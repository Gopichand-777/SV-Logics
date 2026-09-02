// Plain JS only — no React exports (Vite Fast Refresh compatible)
import { getAddFn } from './toastStore.js';

export const toast = {
  success: (msg) => getAddFn()?.('success', msg),
  error:   (msg) => getAddFn()?.('error',   msg),
  warning: (msg) => getAddFn()?.('warning', msg),
  info:    (msg) => getAddFn()?.('info',    msg),
};
