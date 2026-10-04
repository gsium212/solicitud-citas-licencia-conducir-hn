import { useState } from 'react';
import { format, addDays, isWeekend, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  agendarCita,
  getDisponibilidad,
  consultarCitaPorDni,
} from '../services/citasService';
import { Cita } from '../types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  FileText,
  Phone,
  User,
  CreditCard,
  Search,
  ArrowLeft,
  Star,
  XCircle,
} from 'lucide-react';

const TIPOS_LICENCIA = [
  { id: 'A-I', label: 'A-I (Motocicleta / Automóvil / Camión)' },
  { id: 'B-I', label: 'B-I (Vehículo menor motorizado)' },
  { id: 'B-II', label: 'B-II (Vehículo menor no motorizado)' },
  { id: 'B-III', label: 'B-III (Maquinaria agrícola)' },
  { id: 'C', label: 'C (Vehículo pesado)' },
  { id: 'D', label: 'D (Servicio de transporte)' },
  { id: 'E', label: 'E (Maquinaria especial)' },
  { id: 'F', label: 'F (Emergencia / Policial)' },
];

type Modo = 'agendar' | 'consultar';

export default function CiudadanoPage() {
  const [modo, setModo] = useState<Modo>('agendar');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaCita, setFechaCita] = useState('');
  const [tiposLicencia, setTiposLicencia] = useState<string[]>([]);
  const [citaConfirmada, setCitaConfirmada] = useState<Cita | null>(null);
  const [error, setError] = useState('');
  const [disponibilidad, setDisponibilidad] = useState<{ disponible: boolean; restantes: number; aforo: number } | null>(null);

  // Consulta
  const [dniConsulta, setDniConsulta] = useState('');
  const [citasEncontradas, setCitasEncontradas] = useState<Cita[] | null>(null);
  const [errorConsulta, setErrorConsulta] = useState('');

  const handleConsultar = () => {
    setErrorConsulta('');
    if (dniConsulta.length < 8) {
      setErrorConsulta('Ingrese un DNI válido (8 dígitos).');
      return;
    }
    const citas = consultarCitaPorDni(dniConsulta);
    setCitasEncontradas(citas);
    if (citas.length === 0) {
      setErrorConsulta('No se encontraron citas para este DNI.');
    }
  };

  const getMinDate = () => {
    let d = new Date();
    while (isWeekend(d)) {
      d = addDays(d, 1);
    }
    return format(d, 'yyyy-MM-dd');
  };

  const handleFechaChange = (fecha: string) => {
    setFechaCita(fecha);
    setError('');
    if (fecha) {
      const disp = getDisponibilidad(fecha);
      setDisponibilidad(disp);
      if (!disp.disponible) {
        setError('Aforo completo para esta fecha. Seleccione otra.');
      }
    }
  };

  const toggleLicencia = (id: string) => {
    setTiposLicencia(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const handleAgendar = () => {
    setError('');

    if (!dni || !nombre || !telefono || !fechaCita || tiposLicencia.length === 0) {
      setError('Complete todos los campos.');
      return;
    }

    if (dni.length < 8) {
      setError('DNI inválido (mínimo 8 caracteres).');
      return;
    }

    const result = agendarCita({
      dni_persona: dni,
      nombre_persona: nombre,
      telefono: telefono,
      fecha_cita: fechaCita,
      tipos_licencia: tiposLicencia,
    });

    if (result.success && result.cita) {
      setCitaConfirmada(result.cita);
      setStep(3);
    } else {
      setError(result.error || 'Error desconocido.');
    }
  };

  const resetForm = () => {
    setStep(1);
    setDni('');
    setNombre('');
    setTelefono('');
    setFechaCita('');
    setTiposLicencia([]);
    setCitaConfirmada(null);
    setError('');
    setDisponibilidad(null);
  };

  const getDuracionLabel = () => {
    const count = tiposLicencia.length;
    if (count === 0) return '';
    if (count === 1) return '10 minutos';
    if (count === 2) return '15 minutos';
    return '20 minutos';
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Atendido': return 'bg-green-100 text-green-700 border-green-200';
      case 'No Asistió': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Trámite de Licencia</h2>
        <p className="text-gray-500">Agende su cita o consulte el estado de su trámite</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-8 bg-gray-100 p-1.5 rounded-xl">
        <button
          onClick={() => { setModo('agendar'); setErrorConsulta(''); setCitasEncontradas(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
            modo === 'agendar'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Agendar Cita
        </button>
        <button
          onClick={() => { setModo('consultar'); resetForm(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
            modo === 'consultar'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Search className="w-4 h-4" />
          Consultar Cita
        </button>
      </div>

      {/* ============ CONSULTAR MODO ============ */}
      {modo === 'consultar' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Consultar por DNI
            </h3>
            <p className="text-sm text-gray-500 mb-4">Ingrese su DNI para ver todas sus citas registradas</p>

            <div className="flex gap-3">
              <input
                type="text"
                value={dniConsulta}
                onChange={e => { setDniConsulta(e.target.value.replace(/\D/g, '').slice(0, 8)); setCitasEncontradas(null); setErrorConsulta(''); }}
                onKeyDown={e => e.key === 'Enter' && handleConsultar()}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
                placeholder="Ej: 12345678"
              />
              <button
                onClick={handleConsultar}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Buscar
              </button>
            </div>

            {errorConsulta && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {errorConsulta}
              </div>
            )}
          </div>

          {/* Results */}
          {citasEncontradas && citasEncontradas.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {citasEncontradas.length} cita(s) encontrada(s)
              </h4>
              {citasEncontradas.map(cita => (
                <div key={cita.id} className={`bg-white rounded-xl border p-5 shadow-sm ${
                  cita.es_prioritario ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-100'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                        cita.estado === 'Pendiente' ? 'bg-blue-100 text-blue-700' :
                        cita.estado === 'Atendido' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        #{cita.numero_turno}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{cita.nombre_persona}</p>
                        <p className="text-sm text-gray-500">
                          {format(parseISO(cita.fecha_cita), "dd 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(cita.estado)}`}>
                      {cita.estado}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Licencias</p>
                      <p className="font-medium text-gray-700">{cita.tipos_licencia.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Duración</p>
                      <p className="font-medium text-gray-700">{cita.duracion_minutos} min</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Espera est.</p>
                      <p className="font-medium text-gray-700">{cita.tiempo_espera_minutos} min</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Prioridad</p>
                      <p className="font-medium">
                        {cita.es_prioritario ? (
                          <span className="flex items-center gap-1 text-yellow-600">
                            <Star className="w-3.5 h-3.5" /> Sí
                          </span>
                        ) : 'No'}
                      </p>
                    </div>
                  </div>

                  {cita.estado === 'No Asistió' && cita.fecha_desbloqueo_reagendamiento && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-sm text-red-700">
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Sanción activa. Puede reagendar a partir del{' '}
                        <strong>{format(parseISO(cita.fecha_desbloqueo_reagendamiento), "dd 'de' MMMM", { locale: es })}</strong>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ AGENDAR MODO ============ */}
      {modo === 'agendar' && (
        <>
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step >= s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div className={`w-12 sm:w-20 h-0.5 mx-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Datos Personales
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    DNI
                  </label>
                  <input
                    type="text"
                    value={dni}
                    onChange={e => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Ej: 12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Ej: Juan Pérez García"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Ej: 987654321"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (dni.length >= 8 && nombre && telefono.length >= 7) {
                    setStep(2);
                    setError('');
                  } else {
                    setError('Complete todos los campos correctamente.');
                  }
                }}
                className="mt-6 w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continuar
              </button>
              {error && step === 1 && (
                <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
              )}
            </div>
          )}

          {/* Step 2: Appointment Details */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Detalles de la Cita
              </h3>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Fecha */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha de Cita
                </label>
                <input
                  type="date"
                  value={fechaCita}
                  min={getMinDate()}
                  onChange={e => handleFechaChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                {disponibilidad && fechaCita && (
                  <div className={`mt-2 flex items-center gap-2 text-sm ${disponibilidad.disponible ? 'text-green-600' : 'text-red-600'}`}>
                    <Info className="w-4 h-4" />
                    {disponibilidad.disponible
                      ? `${disponibilidad.restantes} cupos disponibles (${disponibilidad.aforo}/50 ocupados)`
                      : 'Aforo completo'}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-400">Solo días hábiles (Lun-Vie)</p>
              </div>

              {/* Tipos de licencia */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Tipos de Licencia a Tramitar
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TIPOS_LICENCIA.map(tl => (
                    <button
                      key={tl.id}
                      onClick={() => toggleLicencia(tl.id)}
                      className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                        tiposLicencia.includes(tl.id)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <span className="font-medium">{tl.id}</span>
                      <span className="ml-1 text-xs opacity-75">— {tl.label.split('(')[1]?.replace(')', '')}</span>
                    </button>
                  ))}
                </div>
                {tiposLicencia.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                    <Clock className="w-4 h-4" />
                    Duración estimada: <strong>{getDuracionLabel()}</strong>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep(1); setError(''); }}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
                <button
                  onClick={handleAgendar}
                  className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Confirmar Cita
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && citaConfirmada && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">¡Cita Agendada!</h3>
                <p className="text-gray-500 mt-1">Su cita ha sido registrada exitosamente</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Turno N°</span>
                  <span className="font-bold text-blue-600 text-lg">#{citaConfirmada.numero_turno}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha</span>
                  <span className="font-medium">
                    {format(parseISO(citaConfirmada.fecha_cita), "dd 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nombre</span>
                  <span className="font-medium">{citaConfirmada.nombre_persona}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">DNI</span>
                  <span className="font-medium">{citaConfirmada.dni_persona}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Licencias</span>
                  <span className="font-medium">{citaConfirmada.tipos_licencia.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duración</span>
                  <span className="font-medium">{citaConfirmada.duracion_minutos} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tiempo de espera est.</span>
                  <span className="font-medium">{citaConfirmada.tiempo_espera_minutos} min</span>
                </div>
                {citaConfirmada.es_prioritario && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                      ⭐ Prioritario
                    </span>
                    <span className="text-xs text-gray-500">Por reagendamiento post-sanción</span>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>📱 Confirmación WhatsApp:</strong> Se enviará un mensaje de confirmación al número {citaConfirmada.telefono}.
                </p>
              </div>

              <button
                onClick={resetForm}
                className="mt-6 w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agendar Otra Cita
              </button>
            </div>
          )}

          {/* Info box */}
          {step !== 3 && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Información Importante
              </h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Solo se atienden días hábiles (Lunes a Viernes)</li>
                <li>• Límite de 50 citas por día</li>
                <li>• 1 licencia = 10 min | 2 licencias = 15 min | 3+ licencias = 20 min</li>
                <li>• Si no asiste, tendrá 5 días hábiles de sanción antes de poder reagendar</li>
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
