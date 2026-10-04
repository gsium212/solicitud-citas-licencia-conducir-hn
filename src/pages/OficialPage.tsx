import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  getCitasHoy,
  marcarAtendido,
  marcarInasistencia,
  getMetricas,
} from '../services/citasService';
import { Cita, Metricas } from '../types';
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  AlertTriangle,
  Star,
  Timer,
} from 'lucide-react';

export default function OficialPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'Pendiente' | 'Atendido' | 'No Asistió'>('todos');

  const cargarDatos = () => {
    setCitas(getCitasHoy());
    setMetricas(getMetricas());
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleAtendido = (citaId: string) => {
    const result = marcarAtendido(citaId);
    if (result.success) {
      setMensaje({ tipo: 'success', texto: 'Cita marcada como atendida.' });
    } else {
      setMensaje({ tipo: 'error', texto: result.error || 'Error.' });
    }
    cargarDatos();
    setTimeout(() => setMensaje(null), 3000);
  };

  const handleInasistencia = (citaId: string) => {
    const result = marcarInasistencia(citaId);
    if (result.success) {
      setMensaje({ tipo: 'success', texto: 'Inasistencia registrada. Sanción aplicada (5 días hábiles).' });
    } else {
      setMensaje({ tipo: 'error', texto: result.error || 'Error.' });
    }
    cargarDatos();
    setTimeout(() => setMensaje(null), 3000);
  };

  const citasFiltradas = filtroEstado === 'todos'
    ? citas
    : citas.filter(c => c.estado === filtroEstado);

  const hoy = format(new Date(), "dd 'de' MMMM, yyyy", { locale: es });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Panel del Oficial</h2>
          <p className="text-gray-500">{hoy}</p>
        </div>
        <button
          onClick={cargarDatos}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Message */}
      {mensaje && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
          mensaje.tipo === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {mensaje.tipo === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {mensaje.texto}
        </div>
      )}

      {/* Metrics Cards */}
      {metricas && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">Total Hoy</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{metricas.total_citas_hoy}</p>
            <p className="text-xs text-gray-400">de {50} aforo</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-gray-500">Pendientes</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{metricas.pendientes_hoy}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-500">Atendidos</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{metricas.atendidos_hoy}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <UserX className="w-4 h-4 text-red-500" />
              <span className="text-xs text-gray-500">No Asistieron</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{metricas.no_asistieron_hoy}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-sm text-gray-500">Filtrar:</span>
        {(['todos', 'Pendiente', 'Atendido', 'No Asistió'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltroEstado(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filtroEstado === f
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'todos' ? 'Todos' : f}
          </button>
        ))}
      </div>

      {/* Queue */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <Timer className="w-5 h-5 text-blue-500" />
            Cola de Citas — {citasFiltradas.length} registros
          </h3>
        </div>

        {citasFiltradas.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay citas para mostrar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {citasFiltradas.map(cita => (
              <div key={cita.id} className={`p-4 sm:p-5 hover:bg-gray-50/50 transition-colors ${
                cita.es_prioritario ? 'bg-yellow-50/50' : ''
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Turno Badge */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                      cita.estado === 'Atendido'
                        ? 'bg-green-100 text-green-700'
                        : cita.estado === 'No Asistió'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {cita.numero_turno}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-800">{cita.nombre_persona}</h4>
                        {cita.es_prioritario && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                            <Star className="w-3 h-3" />
                            Prioritario
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">DNI: {cita.dni_persona} • Tel: {cita.telefono}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">
                          Licencias: {cita.tipos_licencia.join(', ')}
                        </span>
                        <span className="text-xs text-gray-400">
                          • {cita.duracion_minutos} min
                        </span>
                        <span className="text-xs text-gray-400">
                          • Espera: {cita.tiempo_espera_minutos} min
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      cita.estado === 'Pendiente'
                        ? 'bg-blue-100 text-blue-700'
                        : cita.estado === 'Atendido'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {cita.estado}
                    </span>

                    {/* Actions */}
                    {cita.estado === 'Pendiente' && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleAtendido(cita.id)}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          title="Marcar como atendido"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleInasistencia(cita.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Marcar inasistencia"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
