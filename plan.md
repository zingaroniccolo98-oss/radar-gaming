# PLAN — Game Connection Intelligence Platform ("Connection Radar")

## Decisioni architetturali confermate
- **Stack:** Next.js full-stack (Vercel) + Supabase (DB + Auth). Niente FastAPI.
- **Deliverable sessione:** prototipo funzionante dell'app (frontend + motore di valutazione simulato ma strutturato), architettura pronta per porting Vercel+Supabase.
- **Target:** web responsive (mobile-first), Capacitor-ready (no API solo-browser, niente dipendenze incompatibili).
- **Test connessione:** IBRIDO — input manuale Download/Upload (da test console) + pulsante "Non li conosco" con test automatico client-side (ping/jitter/download/upload via fetch + timing).
- **Lingua UI:** Italiano. Dark theme "gaming premium" come mockup (blu notte, verde/giallo/rosso semaforo, glow, mappa nodi).
- **Engine:** TypeScript isolato in `src/engine/` — indipendente da UI e da AI. Output: connection_score, server_score, time_score, match_instability_risk, overall_score, recommendation (GIOCA ADESSO / PUOI GIOCARE / MEGLIO ASPETTARE).
- **AI Advisor:** nella versione prototipo → generatore rule-based che produce 1-3 frasi dai risultati engine (stesso contract I/O del futuro LLM+RAG). Struttura pronta a sostituire il generatore con chiamata API.

## Stage 1 — Skill & Setup
- Caricare `vibecoding-webapp-swarm` SKILL.md + product-knowledge.md.
- Setup progetto (React/TS/Tailwind/shadcn per il preview swarm; struttura cartelle compatibile con porting Next.js: componenti, engine, data, lib separati).

## Stage 2 — Data model & Game Profiles
- Sub-agent "data architect": definire GameConnectionProfile per 6 giochi iniziali (eFootball, EA FC, CoD/Warzone, Fortnite, Valorant, Rocket League), catalogo server/regioni (official vs observed, confidence), benchmark, soglie configurabili per gioco. File JSON/TS tipizzati in `src/data/`.

## Stage 3 — Engine
- Sub-agent "engine builder": `src/engine/` — scoring connessione (download/upload/ping/jitter/packet loss pesati per profilo gioco), confidence score del test, server score, time windows (regole conservative + curva ore di punta), match_instability_risk (0-100, soglie per gioco), verdict finale. Unit-testato con casi noti.

## Stage 4 — UI/UX (design-first, fedele al mockup)
- Sub-agent "UI builder" con il mockup come riferimento visivo:
  1. **Hero:** "È il momento giusto per giocare?" + CTA "Avvia il test" + mappa/globo nodi verdi/gialli/rossi.
  2. **Onboarding breve:** A cosa giochi? → Da dove giochi? → Come giochi? (card selezionabili, skippabile).
  3. **Scelta gioco:** card logo+nome.
  4. **Test connessione:** campi Download/Upload + "Non li conosco" (test automatico con animazione anello % come mockup), nota su affidabilità se dispositivo diverso.
  5. **Risultato:** mappa Europa/Italia con zoom automatico su area rilevante, nodi colorati, verdict grande (GIOCA ADESSO), 4 indicatori (Connessione / Server / Orario / Rischio partita instabile %), miglior fascia oraria, consiglio AI 1-3 frasi.
  6. **Dettaglio server:** es. "Milano — Ottimo — 16 ms — Stabilità alta" + fasce orarie della giornata.
  7. **Dashboard utente (base):** Oggi / Ultimi test / Il tuo orario migliore / Gioco più testato (localStorage per prototipo).
- Navigazione bottom mobile (Connessione / Server / Condizioni reali) come mockup.

## Stage 5 — Review & Build
- Sub-agent reviewer: check UX (GUARDO→CAPISCO→DECIDO, no numeri tecnici inutili), check Capacitor-readiness, check coerenza mockup.
- Build finale, fix errori, consegna con website_version_manager.

## Stage 6 — Documento di consegna (per l'utente)
- Breve guida: cosa è stato costruito, come portarlo su Vercel+Supabase (schema tabelle Supabase in SQL, struttura API routes, cosa resta da fare: auth Supabase, DB, job periodici, AI/RAG reale).

## Regole trasversali
- UX semaforo: verde/giallo/rosso, percentuali, poche metriche. I dati tecnici servono al motore, non alla UI.
- Mai inventare dati: se dati server limitati → "Dati server limitati" ma valutare comunque connessione/ping/jitter.
- Niente consigli generici: il consiglio deriva dal problema rilevato.
