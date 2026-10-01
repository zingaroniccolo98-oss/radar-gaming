import { Route, Routes } from "react-router";
import { StoreProvider } from "@/store";
import Home from "@/pages/Home";
import Onboarding from "@/pages/Onboarding";
import GameSelect from "@/pages/GameSelect";
import Test from "@/pages/Test";
import Result from "@/pages/Result";
import ServerDetail from "@/pages/ServerDetail";
import Dashboard from "@/pages/Dashboard";

export default function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/giochi" element={<GameSelect />} />
        <Route path="/test" element={<Test />} />
        <Route path="/risultato" element={<Result />} />
        <Route path="/server/:id" element={<ServerDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </StoreProvider>
  );
}
