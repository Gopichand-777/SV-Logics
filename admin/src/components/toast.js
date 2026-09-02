// Plain JS — NO React exports here (required for Vite Fast Refresh compatibility)
import { getAddFn } from './toastStore.js';

export const toast = {
  success: (msg) => getAddFn()?.('success', msg),
  error:   (msg) => getAddFn()?.('error',   msg),
  warning: (msg) => getAddFn()?.('warning', msg),
  info:    (msg) => getAddFn()?.('info',    msg),
};
