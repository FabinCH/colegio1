// ============================================
// App.jsx — Componente principal de React con Rutas
// ============================================

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificacionesProvider } from './context/NotificacionesContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Estudiantes from './pages/Estudiantes';
import Materias from './pages/Materias';
import Cursos from './pages/Cursos';
import Cuadernos from './pages/Cuadernos';
import Asistencia from './pages/Asistencia';
import Evaluaciones from './pages/Evaluaciones';
import Reportes from './pages/Reportes';
import Predicciones from './pages/Predicciones';

function App() {
  return (
    <ThemeProvider>
      <OfflineProvider>
        <AuthProvider>
          <NotificacionesProvider>
            <Router>
              <Routes>
              {/* Rutas Públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Rutas Protegidas (Requieren Login) */}
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard"    element={<Dashboard />} />
                <Route path="/estudiantes"  element={<Estudiantes />} />
                <Route path="/materias"     element={<Materias />} />
                <Route path="/cursos"       element={<Cursos />} />
                <Route path="/cuadernos"    element={<Cuadernos />} />
                <Route path="/asistencia"   element={<Asistencia />} />
                <Route path="/evaluaciones" element={<Evaluaciones />} />
                <Route path="/reportes"     element={<Reportes />} />
                <Route path="/predicciones" element={<Predicciones />} />
              </Route>

              {/* Ruta por defecto */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Router>
          </NotificacionesProvider>
        </AuthProvider>
      </OfflineProvider>
    </ThemeProvider>
  );
}

export default App;
