import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import CategoriesPage from "./pages/CategoriesPage";
import CategoryDetailPage from "./pages/CategoryDetailPage";
import ParticipantsPage from "./pages/ParticipantsPage";
import MyVotesPage from "./pages/MyVotesPage";
import NotFoundPage from "./pages/NotFoundPage";
import WinnerPage from "./pages/WinnerPage";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import CategoriesManagement from "./pages/admin/CategoriesManagement";
import PeopleManagement from "./pages/admin/PeopleManagement";
import NominationsManagement from "./pages/admin/NominationsManagement";
import UsersManagement from "./pages/admin/UsersManagement";
import Statistics from "./pages/admin/Statistics";
import LotteryManagement from "./pages/admin/LotteryManagement";
import LotteryDisplayPage from "./pages/LotteryDisplayPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Routes - Sin TopNav ni Snowfall */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="categorias" element={<CategoriesManagement />} />
          <Route path="personas" element={<PeopleManagement />} />
          <Route path="nominaciones" element={<NominationsManagement />} />
          <Route path="usuarios" element={<UsersManagement />} />
          <Route path="estadisticas" element={<Statistics />} />
          <Route path="loteria" element={<LotteryManagement />} />
          {/* Ruta 404 para admin */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Página de ganador - Sin TopNav ni Snowfall */}
        <Route path="ganador" element={<WinnerPage />} />

        {/* Página de lotería - Sin TopNav, con Snowfall interno */}
        <Route path="loteria-display" element={<LotteryDisplayPage />} />

        {/* Public Routes - Con TopNav y Snowfall */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="participantes" element={<ParticipantsPage />} />
          <Route
            path="mis-votos"
            element={
              <ProtectedRoute>
                <MyVotesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="categorias"
            element={
              <ProtectedRoute>
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="categorias/:categoryId"
            element={
              <ProtectedRoute>
                <CategoryDetailPage />
              </ProtectedRoute>
            }
          />
          {/* Ruta 404 - debe ir al final para capturar todas las rutas no definidas */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
