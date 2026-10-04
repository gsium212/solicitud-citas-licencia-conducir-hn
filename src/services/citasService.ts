import { Cita, Usuario, SesionUsuario, Metricas } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { addBusinessDays, isWeekend, format, parseISO, isBefore, startOfDay } from 'date-fns';

const LIMITE_AFORO_DIARIO = 50;
const DIAS_SANCION = 5;

// ============ STORAGE HELPERS ============
function getCitas(): Cita[] {
  const data = localStorage.getItem('citas');
  return data ? JSON.parse(data) : [];
}

function saveCitas(citas: Cita[]) {
  localStorage.setItem('citas', JSON.stringify(citas));
}

function getUsuarios(): Usuario[] {
  const data = localStorage.getItem('usuarios');
  if (data) return JSON.parse(data);
  // Default admin
  const defaultAdmin: Usuario = {
    id: uuidv4(),
    username: 'admin',
    password_hash: btoa('admin123'),
    nombre_completo: 'Administrador del Sistema',
    rol: 'admin',
    activo: true,
    creado_en: new Date().toISOString(),
  };
  const defaultOficial: Usuario = {
    id: uuidv4(),
    username: 'oficial1',
    password_hash: btoa('oficial123'),
    nombre_completo: 'Juan Pérez',
    rol: 'oficial',
    activo: true,
    creado_en: new Date().toISOString(),
  };
  saveUsuarios([defaultAdmin, defaultOficial]);
  return [defaultAdmin, defaultOficial];
}

function saveUsuarios(usuarios: Usuario[]) {
  localStorage.setItem('usuarios', JSON.stringify(usuarios));
}

// ============ AUTH ============
export function login(username: string, password: string): SesionUsuario | null {
  const usuarios = getUsuarios();
  const user = usuarios.find(u => u.username === username && u.password_hash === btoa(password) && u.activo);
  if (!user) return null;
  const sesion: SesionUsuario = {
    id: user.id,
    username: user.username,
    nombre_completo: user.nombre_completo,
    rol: user.rol,
  };
  localStorage.setItem('sesion', JSON.stringify(sesion));
  return sesion;
}

export function logout() {
  localStorage.removeItem('sesion');
}

export function getSesion(): SesionUsuario | null {
  const data = localStorage.getItem('sesion');
  return data ? JSON.parse(data) : null;
}

// ============ BUSINESS LOGIC ============
export function validarDiaHabil(fecha: string): boolean {
  const date = parseISO(fecha);
  return !isWeekend(date);
}

export function contarCitas(fecha: string): number {
  const citas = getCitas();
  return citas.filter(c => c.fecha_cita === fecha).length;
}

export function calcularDuracion(tiposLicencia: string[]): number {
  const count = tiposLicencia.length;
  if (count === 1) return 10;
  if (count === 2) return 15;
  return 20;
}

export function calcularTiempoEspera(fecha: string, numeroTurno: number): number {
  const citas = getCitas();
  const anteriores = citas
    .filter(c => c.fecha_cita === fecha && c.numero_turno < numeroTurno)
    .sort((a, b) => a.numero_turno - b.numero_turno);
  return anteriores.reduce((sum, c) => sum + c.duracion_minutos, 0);
}

function asignarTurno(fecha: string, esPrioritario: boolean): number {
  const citas = getCitas();
  const turnosExistentes = citas
    .filter(c => c.fecha_cita === fecha)
    .map(c => c.numero_turno);

  if (esPrioritario) {
    // Find lowest available positive integer
    let turno = 1;
    while (turnosExistentes.includes(turno)) {
      turno++;
    }
    return turno;
  } else {
    // Next sequential
    return turnosExistentes.length > 0 ? Math.max(...turnosExistentes) + 1 : 1;
  }
}

function verificarSancion(dni: string): { bloqueado: boolean; esPrioritario: boolean; fechaDesbloqueo: string | null } {
  const citas = getCitas();
  const hoy = startOfDay(new Date());

  // Find most recent "No Asistió" for this DNI
  const inasistencias = citas
    .filter(c => c.dni_persona === dni && c.estado === 'No Asistió')
    .sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime());

  if (inasistencias.length === 0) {
    return { bloqueado: false, esPrioritario: false, fechaDesbloqueo: null };
  }

  const ultima = inasistencias[0];
  if (ultima.fecha_desbloqueo_reagendamiento) {
    const fechaDesbloqueo = parseISO(ultima.fecha_desbloqueo_reagendamiento);
    if (isBefore(hoy, startOfDay(fechaDesbloqueo))) {
      return { bloqueado: true, esPrioritario: false, fechaDesbloqueo: ultima.fecha_desbloqueo_reagendamiento };
    }
    // Sanction period has passed - user can schedule but is now priority
    return { bloqueado: false, esPrioritario: true, fechaDesbloqueo: null };
  }

  return { bloqueado: false, esPrioritario: false, fechaDesbloqueo: null };
}

export function getFechasBloqueadas(): string[] {
  const citas = getCitas();
  const fechaCount: Record<string, number> = {};
  citas.forEach(c => {
    fechaCount[c.fecha_cita] = (fechaCount[c.fecha_cita] || 0) + 1;
  });
  return Object.entries(fechaCount)
    .filter(([, count]) => count >= LIMITE_AFORO_DIARIO)
    .map(([fecha]) => fecha);
}

export function getDisponibilidad(fecha: string): { disponible: boolean; restantes: number; aforo: number } {
  const count = contarCitas(fecha);
  return {
    disponible: count < LIMITE_AFORO_DIARIO,
    restantes: LIMITE_AFORO_DIARIO - count,
    aforo: count,
  };
}

// ============ CITAS CRUD ============
export interface AgendarCitaInput {
  dni_persona: string;
  nombre_persona: string;
  telefono: string;
  fecha_cita: string;
  tipos_licencia: string[];
}

export function agendarCita(input: AgendarCitaInput): { success: boolean; cita?: Cita; error?: string } {
  // Validate weekday
  if (!validarDiaHabil(input.fecha_cita)) {
    return { success: false, error: 'No se pueden agendar citas en fines de semana.' };
  }

  // Check aforo
  const count = contarCitas(input.fecha_cita);
  if (count >= LIMITE_AFORO_DIARIO) {
    return { success: false, error: `Aforo completo para la fecha ${input.fecha_cita}. Límite: ${LIMITE_AFORO_DIARIO} citas/día.` };
  }

  // Check duplicate DNI same day
  const citas = getCitas();
  const duplicado = citas.find(c => c.fecha_cita === input.fecha_cita && c.dni_persona === input.dni_persona);
  if (duplicado) {
    return { success: false, error: 'Ya existe una cita para este DNI en la fecha seleccionada.' };
  }

  // Check sanction
  const sancion = verificarSancion(input.dni_persona);
  if (sancion.bloqueado) {
    return { success: false, error: `Su DNI tiene una sanción activa. Puede reagendar a partir del ${sancion.fechaDesbloqueo}.` };
  }

  const duracion = calcularDuracion(input.tipos_licencia);
  const turno = asignarTurno(input.fecha_cita, sancion.esPrioritario);
  const tiempoEspera = calcularTiempoEspera(input.fecha_cita, turno);

  const nuevaCita: Cita = {
    id: uuidv4(),
    dni_persona: input.dni_persona,
    nombre_persona: input.nombre_persona,
    telefono: input.telefono,
    fecha_cita: input.fecha_cita,
    numero_turno: turno,
    tipos_licencia: input.tipos_licencia,
    duracion_minutos: duracion,
    tiempo_espera_minutos: tiempoEspera,
    estado: 'Pendiente',
    es_prioritario: sancion.esPrioritario,
    fecha_desbloqueo_reagendamiento: null,
    creado_en: new Date().toISOString(),
  };

  citas.push(nuevaCita);
  saveCitas(citas);

  return { success: true, cita: nuevaCita };
}

export function getCitasPorFecha(fecha: string): Cita[] {
  return getCitas()
    .filter(c => c.fecha_cita === fecha)
    .sort((a, b) => a.numero_turno - b.numero_turno);
}

export function getCitasHoy(): Cita[] {
  const hoy = format(new Date(), 'yyyy-MM-dd');
  return getCitasPorFecha(hoy);
}

export function marcarAtendido(citaId: string): { success: boolean; error?: string } {
  const citas = getCitas();
  const idx = citas.findIndex(c => c.id === citaId);
  if (idx === -1) return { success: false, error: 'Cita no encontrada.' };
  if (citas[idx].estado !== 'Pendiente') return { success: false, error: 'La cita ya fue procesada.' };
  citas[idx].estado = 'Atendido';
  saveCitas(citas);
  return { success: true };
}

export function marcarInasistencia(citaId: string): { success: boolean; error?: string } {
  const citas = getCitas();
  const idx = citas.findIndex(c => c.id === citaId);
  if (idx === -1) return { success: false, error: 'Cita no encontrada.' };
  if (citas[idx].estado !== 'Pendiente') return { success: false, error: 'La cita ya fue procesada.' };

  // Calculate unlock date: +5 business days from today
  const hoy = new Date();
  const fechaDesbloqueo = addBusinessDays(hoy, DIAS_SANCION);
  citas[idx].estado = 'No Asistió';
  citas[idx].fecha_desbloqueo_reagendamiento = format(fechaDesbloqueo, 'yyyy-MM-dd');
  saveCitas(citas);
  return { success: true };
}

// ============ ADMIN ============
export function getMetricas(): Metricas {
  const hoy = format(new Date(), 'yyyy-MM-dd');
  const citas = getCitas();
  const citasHoy = citas.filter(c => c.fecha_cita === hoy);
  const atendidos = citasHoy.filter(c => c.estado === 'Atendido').length;
  const noAsistieron = citasHoy.filter(c => c.estado === 'No Asistió').length;
  const pendientes = citasHoy.filter(c => c.estado === 'Pendiente').length;

  // Week stats
  const hace7 = new Date();
  hace7.setDate(hace7.getDate() - 7);
  const citasSemana = citas.filter(c => parseISO(c.fecha_cita) >= hace7).length;

  // Inattendance rate
  const totalProcesadas = atendidos + noAsistieron;
  const tasaInasistencia = totalProcesadas > 0 ? (noAsistieron / totalProcesadas) * 100 : 0;

  return {
    total_citas_hoy: citasHoy.length,
    atendidos_hoy: atendidos,
    no_asistieron_hoy: noAsistieron,
    pendientes_hoy: pendientes,
    aforo_restante: LIMITE_AFORO_DIARIO - citasHoy.length,
    citas_semana: citasSemana,
    tasa_inasistencia: Math.round(tasaInasistencia * 10) / 10,
  };
}

export function getAllUsuarios(): Usuario[] {
  return getUsuarios();
}

export function crearUsuario(username: string, password: string, nombre_completo: string, rol: 'oficial' | 'admin'): { success: boolean; error?: string } {
  const usuarios = getUsuarios();
  if (usuarios.find(u => u.username === username)) {
    return { success: false, error: 'El nombre de usuario ya existe.' };
  }
  const nuevo: Usuario = {
    id: uuidv4(),
    username,
    password_hash: btoa(password),
    nombre_completo,
    rol,
    activo: true,
    creado_en: new Date().toISOString(),
  };
  usuarios.push(nuevo);
  saveUsuarios(usuarios);
  return { success: true };
}

export function toggleUsuarioActivo(userId: string): void {
  const usuarios = getUsuarios();
  const idx = usuarios.findIndex(u => u.id === userId);
  if (idx !== -1) {
    usuarios[idx].activo = !usuarios[idx].activo;
    saveUsuarios(usuarios);
  }
}

export function getAllCitas(): Cita[] {
  return getCitas().sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime());
}

export function consultarCitaPorDni(dni: string): Cita[] {
  return getCitas()
    .filter(c => c.dni_persona === dni)
    .sort((a, b) => b.fecha_cita.localeCompare(a.fecha_cita));
}

export function getCitasParaGrafico(dias: number = 7): { fecha: string; atendidos: number; inasistencias: number; total: number }[] {
  const citas = getCitas();
  const resultado: { fecha: string; atendidos: number; inasistencias: number; total: number }[] = [];
  
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const fechaStr = format(d, 'yyyy-MM-dd');
    const citasDia = citas.filter(c => c.fecha_cita === fechaStr);
    resultado.push({
      fecha: format(d, 'dd/MM'),
      total: citasDia.length,
      atendidos: citasDia.filter(c => c.estado === 'Atendido').length,
      inasistencias: citasDia.filter(c => c.estado === 'No Asistió').length,
    });
  }
  return resultado;
}

export function getDistribucionLicencias(): { nombre: string; cantidad: number }[] {
  const citas = getCitas();
  const count: Record<string, number> = {};
  citas.forEach(c => {
    c.tipos_licencia.forEach(tl => {
      count[tl] = (count[tl] || 0) + 1;
    });
  });
  return Object.entries(count).map(([nombre, cantidad]) => ({ nombre, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
}

export function getCitasRango(fechaDesde: string, fechaHasta: string): Cita[] {
  return getCitas()
    .filter(c => c.fecha_cita >= fechaDesde && c.fecha_cita <= fechaHasta)
    .sort((a, b) => a.fecha_cita.localeCompare(b.fecha_cita) || a.numero_turno - b.numero_turno);
}
