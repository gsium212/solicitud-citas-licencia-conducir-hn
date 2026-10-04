import { useState, useEffect } from 'react';
import { SesionUsuario } from './types';
import { getSesion, login, logout } from './services/citasService';
import CiudadanoPage from './pages/CiudadanoPage';
import OficialPage from './pages/OficialPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import { Calendar, Shield, User, LogOut, Building2 } from 'lucide-react';

type Vista = 'ciudadano' | 'oficial' | 'admin' | 'login';

function App() {
  const [sesion, setSesion] = useState<SesionUsuario | null>(null);
  const [vista, setVista] = useState<Vista>('ciudadano');

  useEffect(() => {
    const s = getSesion();
    if (s) {
      setSesion(s);
      setVista(s.rol === 'admin' ? 'admin' : 'oficial');
    }
  }, []);

  const handleLogin = (username: string, password: string): boolean => {
    const s = login(username, password);
    if (s) {
      setSesion(s);
      setVista(s.rol === 'admin' ? 'admin' : 'oficial');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    logout();
    setSesion(null);
    setVista('ciudadano');
  };

  const renderPage = () => {
    switch (vista) {
      case 'ciudadano':
        return <CiudadanoPage />;
      case 'oficial':
        return sesion ? <OficialPage /> : <LoginPage onLogin={handleLogin} />;
      case 'admin':
        return sesion?.rol === 'admin' ? <AdminPage /> : <LoginPage onLogin={handleLogin} />;
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
      default:
        return <CiudadanoPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Building2 className="w-7 h-7 text-blue-600" />
              <h1 className="text-lg font-bold text-gray-800 hidden sm:block">Sistema de Citas</h1>
              <h1 className="text-lg font-bold text-gray-800 sm:hidden">Citas</h1>
            </div>

            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setVista('ciudadano')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  vista === 'ciudadano'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Ciudadano</span>
              </button>

              {sesion ? (
                <>
                  <button
                    onClick={() => setVista(sesion.rol === 'admin' ? 'admin' : 'oficial')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      vista === 'oficial' || vista === 'admin'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {sesion.rol === 'admin' ? 'Admin' : 'Oficial'}
                    </span>
                  </button>
                  <div className="hidden md:flex items-center gap-2 px-3 py-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{sesion.nombre_completo}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Salir</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setVista('login')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    vista === 'login'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Ingresar</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          Sistema de Citas Municipal — Todos los derechos reservados © 2026
        </div>
      </footer>
    </div>
  );
}

export default App;
