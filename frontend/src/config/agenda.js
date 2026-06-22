/** Especialidad de médicos en la agenda. Vacío o "false" = todos. */
export const AGENDA_ESPECIALIDAD =
  import.meta.env.VITE_AGENDA_ESPECIALIDAD === 'false' ||
  import.meta.env.VITE_AGENDA_ESPECIALIDAD === ''
    ? null
    : (import.meta.env.VITE_AGENDA_ESPECIALIDAD || 'Oftalmología')
