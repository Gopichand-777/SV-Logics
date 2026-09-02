// Shared mutable ref — no React, no imports
// Lets toast.js call ToastContainer's `add` without circular deps
let _addFn = null;

export const setAddFn = (fn) => { _addFn = fn; };
export const getAddFn = ()    => _addFn;
