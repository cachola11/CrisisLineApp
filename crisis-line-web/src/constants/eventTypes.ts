/** Canonical list of event type labels (Gestão de Eventos, calendário, etc.). */
export const EVENT_TYPES = [
  'Turno',
  'Teambuilding',
  'Evento Aberto',
  'Reunião Coordenação',
  'Reunião Geral',
  'Interrupção Letiva',
] as const;

export type EventTypeLabel = (typeof EVENT_TYPES)[number];

/** Includes legacy label stored in older documents. */
const NO_SIGNUP_EVENT_TYPES = new Set<string>(['Interrupção Letiva', 'Pausa Lectiva']);

export function eventTypeAllowsSignUps(type: string | undefined | null): boolean {
  if (!type) return true;
  return !NO_SIGNUP_EVENT_TYPES.has(type);
}

export const EVENT_TYPE_EMOJIS: Record<string, string> = {
  Turno: '☎️',
  Teambuilding: '🎉',
  'Evento Aberto': '📢',
  'Reunião Coordenação': '💻',
  'Reunião Geral': '👥',
  'Interrupção Letiva': '📅',
  'Pausa Lectiva': '📅',
};
