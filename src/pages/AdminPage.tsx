import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  getMetricas,
  getAllUsuarios,
  crearUsuario,
  toggleUsuarioActivo,
  getAllCitas,
  getCitasRango,
} from '../services/citasService';
import { Cita, Usuario, Metricas } from '../types';
import {
  Users,
  UserPlus,
  BarChart3,
  Calendar,
  Shield,
  ShieldOff,
  FileText,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Star,
} from 'lucide-react';

type Tab = 'metricas' | 'usuarios' | 'citas';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('metricas');
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [showCrearUsuario, setShowCrearUsuario] = useState(false);
  const [nuevoUser, setNuevoUser] = useState({ username: '', password: '', nombre: '', rol: 'oficial' as 'oficial' | 'admin' });
  const [errorUser, setErrorUser] = useState('');
  const [fechaDesde, setFechaDesde] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fechaHasta, setFechaHasta] = useState(format(new Date(), 'yyyy-MM-dd'));

  const cargarDatos = () => {
    setMetricas(getMetricas());
    setUsuarios(getAllUsuarios());
    setCitas(getAllCitas().slice(0, 50));
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearUsuario = () => {
    setErrorUser('');
    if (!nuevoUser.username || !nuevoUser.password || !nuevoUser.nombre) {
      setErrorUser('Complete todos los campos.');
      return;
    }
    const result = crearUsuario(nuevoUser.username, nuevoUser.password, nuevoUser.nombre, nuevoUser.rol);
    if (result.success) {
      setShowCrearUsuario(false);
      setNuevoUser({ username: '', password: '', nombre: '', rol: 'oficial' });
      setUsuarios(getAllUsuarios());
    } else {
      setErrorUser(result.error || 'Error al crear usuario.');
    }
  };

  const handleToggleActivo = (userId: string) => {
    toggleUsuarioActivo(userId);
    setUsuarios(getAllUsuarios());
  };

  const handleBuscarCitas = () => {
    setCitas(getCitasRango(fechaDesde, fechaHasta));
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Panel de Administración</h2>
        <p className="text-gray-500">Gestión del sistema de citas</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'metricas' as Tab, label: 'Métricas', icon: BarChart3 },
          { id: 'usuarios' as Tab, label: 'Usuarios', icon: Users },
          { id: 'citas' as Tab, label: 'Citas', icon: FileText },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Metricas Tab */}
      {tab === 'metricas' && metricas && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Citas Hoy</p>
                  <p className="text-2xl font-bold text-gray-800">{metricas.total_citas_hoy}</p>
                </div>
              </div>
              <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(metricas.total_citas_hoy / 50) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{metricas.aforo_restante} cupos restantes</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Atendidos</p>
                  <p className="text-2xl font-bold text-green-600">{metricas.atendidos_hoy}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">No Asistieron</p>
                  <p className="text-2xl font-bold text-red-600">{metricas.no_asistieron_hoy}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Citas (7 días)</p>
                  <p className="text-2xl font-bold text-purple-600">{metricas.citas_semana}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Inattendance Rate */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Tasa de Inasistencia
            </h3>
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke={metricas.tasa_inasistencia > 20 ? '#ef4444' : metricas.tasa_inasistencia > 10 ? '#f59e0b' : '#22c55e'}
                    strokeWidth="12"
                    strokeDasharray={`${metricas.tasa_inasistencia * 2.51} 251`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-800">{metricas.tasa_inasistencia}%</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>La tasa de inasistencia del día es <strong>{metricas.tasa_inasistencia}%</strong>.</p>
                <p className="mt-1 text-gray-400">
                  {metricas.tasa_inasistencia > 20
                    ? '⚠️ Tasa alta — considere enviar recordatorios.'
                    : metricas.tasa_inasistencia > 10
                    ? '📊 Tasa moderada — dentro de lo esperado.'
                    : '✅ Tasa baja — buen cumplimiento.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usuarios Tab */}
      {tab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Gestión de Usuarios</h3>
            <button
              onClick={() => setShowCrearUsuario(!showCrearUsuario)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Usuario
            </button>
          </div>

          {/* Create User Form */}
          {showCrearUsuario && (
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <h4 className="font-medium text-gray-700 mb-4">Crear Nuevo Usuario</h4>
              {errorUser && (
                <div className="p-2 mb-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {errorUser}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Usuario"
                  value={nuevoUser.username}
                  onChange={e => setNuevoUser({ ...nuevoUser, username: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={nuevoUser.password}
                  onChange={e => setNuevoUser({ ...nuevoUser, password: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={nuevoUser.nombre}
                  onChange={e => setNuevoUser({ ...nuevoUser, nombre: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={nuevoUser.rol}
                  onChange={e => setNuevoUser({ ...nuevoUser, rol: e.target.value as 'oficial' | 'admin' })}
                  className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="oficial">Oficial</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleCrearUsuario}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Crear
                </button>
                <button
                  onClick={() => { setShowCrearUsuario(false); setErrorUser(''); }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{u.username}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{u.nombre_completo}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {u.rol === 'admin' ? 'Admin' : 'Oficial'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {u.username !== 'admin' && (
                        <button
                          onClick={() => handleToggleActivo(u.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.activo
                              ? 'text-red-500 hover:bg-red-50'
                              : 'text-green-500 hover:bg-green-50'
                          }`}
                          title={u.activo ? 'Desactivar' : 'Activar'}
                        >
                          {u.activo ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Citas Tab */}
      {tab === 'citas' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={e => setFechaDesde(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={e => setFechaHasta(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <button
                onClick={handleBuscarCitas}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <span className="text-sm text-gray-500">{citas.length} citas encontradas</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Fecha</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Turno</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">DNI</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Nombre</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Licencias</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Estado</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Prior.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {citas.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/50 text-sm">
                      <td className="px-4 py-2.5 text-gray-600">
                        {format(parseISO(c.fecha_cita), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-blue-600">#{c.numero_turno}</td>
                      <td className="px-4 py-2.5 text-gray-600">{c.dni_persona}</td>
                      <td className="px-4 py-2.5 text-gray-800 font-medium">{c.nombre_persona}</td>
                      <td className="px-4 py-2.5 text-gray-500">{c.tipos_licencia.join(', ')}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.estado === 'Pendiente'
                            ? 'bg-blue-100 text-blue-700'
                            : c.estado === 'Atendido'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {c.estado}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {c.es_prioritario && <Star className="w-4 h-4 text-yellow-500" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {citas.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No hay citas en el rango seleccionado</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
