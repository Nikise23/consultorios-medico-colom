/** Especialidad de médicos incluidos en la agenda interna. Vacío = todos. */
export function getAgendaEspecialidadFilter(): string | null {
  const raw = process.env.AGENDA_ESPECIALIDAD?.trim();
  if (raw === '' || raw?.toLowerCase() === 'false' || raw?.toLowerCase() === 'none') {
    return null;
  }
  return raw || 'Oftalmología';
}

export function medicoEnAgenda(especialidad: string | null | undefined): boolean {
  const filtro = getAgendaEspecialidadFilter();
  if (!filtro) return true;
  if (!especialidad?.trim()) return false;
  return especialidad.trim().toLowerCase() === filtro.toLowerCase();
}
