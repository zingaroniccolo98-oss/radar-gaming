# Connection Radar — Guida al porting su Vercel + Supabase

## Cosa è stato costruito

Prototipo completo e navigabile della piattaforma (7 schermate, italiano, dark theme come il mockup):

| Schermata | Route | Contenuto |
|---|---|---|
| Home | `/` | Hero "È il momento giusto per giocare?", CTA, mappa nodi viva, spiegazione semaforo, step flow |
| Onboarding | `/onboarding` | 3 domande (giochi → piattaforma → tipo rete), sempre skippabile |
| Scelta gioco | `/giochi` | 9 game card con ricerca, fallback senza gioco |
| Test | `/test` | Input manuale Download/Upload + test automatico con anello %, **selettore Cavo/Wi-Fi opzionale e non bloccante**, indicatore affidabilità |
| Risultato | `/risultato` | Mappa Europa con zoom automatico, verdetto (GIOCA ADESSO / PUOI GIOCARE / MEGLIO ASPETTARE), 4 indicatori, miglior fascia, consiglio |
| Dettaglio server | `/server/:id` | Città, stato in ms, fasce orarie, raccomandazione, affidabilità fonte (official/observed) |
| Dashboard | `/dashboard` | Oggi, ultimi test, orario migliore, gioco più testato, connessione media |

### Il motore (`src/engine/index.ts`) — la parte più importante

È **deterministico e isolato**: nessuna dipendenza da UI o AI. Contratto input/output già pronto per diventare un'API:

- `computeConfidence()` — regola utente: manuale/auto × stesso dispositivo × cavo/Wi-Fi/sconosciuto → Alta/Media/Bassa. Mai bloccante, pesa solo il verdetto.
- `connectionScore()` — pesato sulle sensibilità del gioco (ping, jitter, packet loss, banda).
- `serverScore()` / `timeScore()` / `instabilityRisk()` (0-100, soglie configurabili per gioco).
- `evaluate()` — pesi: connessione 45% · server 30% · orario 15% · rischio 10%.
- `buildAdvice()` — consigli 1-3 frasi derivati dal problema rilevato (mai "riavvia il router" generico). Stesso contratto I/O del futuro advisor LLM+RAG.

### Aggiungere un gioco = aggiungere un dato

`src/data/games.ts`: un oggetto `GameProfile` (sensibilità, soglie ping/jitter/loss, banda, server prioritari). Zero modifiche a engine e UI. Server in `src/data/servers.ts` con `sourceType: "official" | "observed"` sempre separati.

---

## Porting su Vercel + Supabase

### 1. Da Vite a Next.js (mezza giornata)

Il codice è già React + TypeScript: le pagine in `src/pages/` diventano route in `app/` (es. `src/pages/Result.tsx` → `app/risultato/page.tsx`). Da sostituire solo `react-router` (Link/useNavigate) con `next/link` e `useRouter`. Componenti, engine, data e store si copiano così come sono.

### 2. Schema Supabase (PostgreSQL)

Tabelle separate, niente monoliti. I tipi in `src/lib/types.ts` mappano 1:1:

```sql
create table games (
  id text primary key,               -- 'efootball', 'eafc', ...
  name text not null,
  publisher text,
  platforms text[],
  server_model text,                 -- 'client-server' | 'p2p' | 'hybrid'
  sensitivity jsonb,                 -- {ping, jitter, packetLoss, bandwidth}
  thresholds jsonb,                  -- ping/jitter/loss + riskBands
  bandwidth_req jsonb,
  enabled boolean default true
);

create table servers (
  id text primary key,
  game_id text references games(id),
  city text, country text, region text,
  provider text,
  source_type text check (source_type in ('official','observed')),
  confidence text check (confidence in ('alta','media','bassa')),
  lon float, lat float,
  base_ping_ms int,
  load_curve float[24],
  last_verified timestamptz,
  enabled boolean default true
);

create table tests (                 -- un test eseguito da un utente
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),   -- null = anonimo
  game_id text references games(id),
  source text,                       -- 'manual' | 'auto'
  download_mbps float, upload_mbps float,
  ping_ms float, jitter_ms float, packet_loss_pct float,
  test_device_connection text,       -- 'lan' | 'wifi' | 'hotspot' | 'unknown'
  same_device boolean,
  created_at timestamptz default now()
);

create table results (               -- output engine, 1:1 con il test
  test_id uuid primary key references tests(id),
  connection_score int, server_score int, time_score int,
  risk int, overall_score int,
  verdict text, confidence text,
  best_slot text, advice text
);

create table aggregates_hourly (     -- la vera forza col tempo (anonimo)
  game_id text, server_id text,
  day_of_week int, hour int,
  avg_ping float, avg_jitter float, avg_loss float,
  samples int,
  primary key (game_id, server_id, day_of_week, hour)
);

-- knowledge base per il futuro mini-RAG
create table knowledge (
  id uuid primary key default gen_random_uuid(),
  game_id text references games(id),
  topic text, content text,
  source text, source_url text,
  reliability int,                   -- gerarchia fonti 1-6
  last_verified timestamptz
);
```

Privacy/GDPR: niente IP completi; gli aggregati sono anonimi per definizione.

### 3. API (Next.js route handlers su Vercel)

L'engine TypeScript si sposta invariato lato server:

- `POST /api/tests` → salva input in `tests`, chiama `evaluate()`, salva in `results`, ritorna il risultato
- `GET /api/games` / `GET /api/games/[id]` / `GET /api/games/[id]/servers`
- `GET /api/results/[testId]`
- `GET /api/history` (utente loggato)
- `GET /api/time-windows`
- `POST /api/advisor` (fase 2: LLM + retrieval dalla tabella `knowledge`)

### 4. Auth (Supabase Auth)

Email/password + Google pronti out-of-the-box. Il test resta anonimo (`user_id` nullable); con login si attivano storico, preferiti, personalizzazione.

### 5. Job periodici (Vercel Cron o pg_cron su Supabase)

Aggregazioni orarie in `aggregates_hourly`, refresh curve di carico server, verifica fonti, pulizia dati vecchi.

### 6. Test di connessione reale (fase 2)

Oggi il test automatico è simulato (`simulateAutoTest`). In produzione: misura client-side con `fetch` ripetute verso endpoint edge (Vercel regions) per ping/jitter + download di file dimensionati per la banda. Il selettore cavo/Wi-Fi e il confidence score sono già pronti ad accogliere i dati reali.

### 7. Capacitor (app iOS/Android)

L'app è già predisposta: niente API solo-browser, `dvh` + safe-area, SVG inline (niente tile map), touch target ≥48px. Quando vorrai: `npm i @capacitor/core @capacitor/cli && npx cap init` puntando alla build Next.js (output statico o server separato).

---

## Roadmap suggerita

1. **Ora**: prototipo validato (questa consegna) → feedback utenti sul flusso.
2. **Sprint 1**: porting Next.js + Supabase, auth, storico reale.
3. **Sprint 2**: test connessione reale client-side, aggregazioni, job periodici.
4. **Sprint 3**: AI advisor con LLM + RAG sulla tabella `knowledge`, admin interno.
5. **Sprint 4**: app store via Capacitor.
