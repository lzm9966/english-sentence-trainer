import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";
import SentenceDrillApp from "@/pages/SentenceDrillApp/SentenceDrillApp";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<SentenceDrillApp />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
