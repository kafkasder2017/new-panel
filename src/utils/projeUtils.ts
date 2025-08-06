import { ProjeStatus } from '../../types';

export const getStatusClass = (status: ProjeStatus): string => {
  switch (status) {
    case ProjeStatus.PLANLAMA:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    case ProjeStatus.DEVAM_EDIYOR:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    case ProjeStatus.TAMAMLANDI:
      return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    case ProjeStatus.IPTAL_EDILDI:
      return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    default:
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
  }
};

export const getProgressClass = (status: ProjeStatus): string => {
  switch (status) {
    case ProjeStatus.PLANLAMA:
      return 'bg-blue-500';
    case ProjeStatus.DEVAM_EDIYOR:
      return 'bg-yellow-500';
    case ProjeStatus.TAMAMLANDI:
      return 'bg-green-500';
    case ProjeStatus.IPTAL_EDILDI:
      return 'bg-red-500';
    default:
      return 'bg-zinc-500';
  }
};