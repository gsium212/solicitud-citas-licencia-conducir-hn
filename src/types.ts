export interface Cita {
  id: string;
  dni_persona: string;
  nombre_persona: string;
  telefono: string;
  fecha_cita: string; // YYYY-MM-DD
  numero_turno: number;
  tipos_licencia: string[];
  duracion_minutos: number;
  tiempo_espera_minutos: number;
  estado: 'Pendiente' | 'Atendido' | 'No Asistió';
  es_prioritario: boolean;
  fecha_desbloqueo_reagendamiento: string | null;
  creado_en: string;
}

export interface Usuario {
  id: string;
  username: string;
  password_hash: string;
  nombre_completo: string;
  rol: 'oficial' | 'admin';
  activo: boolean;
  creado_en: string;
}

export interface SesionUsuario {
  id: string;
  username: string;
  nombre_completo: string;
  rol: 'oficial' | 'admin';
}

export interface Metricas {
  total_citas_hoy: number;
  atendidos_hoy: number;
  no_asistieron_hoy: number;
  pendientes_hoy: number;
  aforo_restante: number;
  citas_semana: number;
  tasa_inasistencia: number;
}
