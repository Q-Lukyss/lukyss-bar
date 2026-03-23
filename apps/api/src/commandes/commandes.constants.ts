export const COMMANDE_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  IN_PREPARATION: 'IN_PREPARATION',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
} as const;

export type CommandeStatus =
  (typeof COMMANDE_STATUS)[keyof typeof COMMANDE_STATUS];
