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
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import CategoriesManagement from "./pages/admin/CategoriesManagement";
import PeopleManagement from "./pages/admin/PeopleManagement";
import NominationsManagement from "./pages/admin/NominationsManagement";
import UsersManagement from "./pages/admin/UsersManagement";
import Statistics from "./pages/admin/Statistics";

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
        </Route>

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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
