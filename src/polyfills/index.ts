// Global polyfills loaded before app code
// Ensure console methods are safe under Hermes (some may be undefined or lack bind)
(() => {
  // Ensure globalThis exists
  // @ts-ignore
  const g: any = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : {}));
  // Make sure g.console exists
  if (!g.console) {
    g.console = {} as any;
  }
  const c: any = g.console;
  const noop = () => {};

  // Safe console methods
  const methods = [
    'log','info','warn','error','debug','trace',
    'time','timeEnd','group','groupCollapsed','groupEnd'
  ];
  methods.forEach((m) => {
    const fn = c[m];
    if (typeof fn !== 'function') {
      c[m] = noop;
      return;
    }
    // Some engines may provide a function without a usable bind; wrap to be safe
    try {
      if (typeof fn.bind === 'function') {
        return;
      }
    } catch (_) {}
    c[m] = (...args: any[]) => {
      try {
        return Function.prototype.apply.call(fn, c, args);
      } catch (_err) {
        try {
          return fn.apply ? fn.apply(c, args) : noop();
        } catch { return noop(); }
      }
    };
  });

  // setImmediate / clearImmediate shims (some shims call setImmediate.bind(...))
  if (typeof g.setImmediate !== 'function') {
    // Prefer microtask when available
    const microtask = typeof g.queueMicrotask === 'function'
      ? g.queueMicrotask.bind(g)
      : (cb: Function) => Promise.resolve().then(() => cb());
    g.setImmediate = (cb: Function, ...args: any[]) => {
      if (args.length === 0) {
        microtask(cb);
        // Return a timeout id-like handle for API compatibility
        return 0 as any;
      }
      const id = g.setTimeout(cb as any, 0, ...args);
      return id;
    };
  }
  if (typeof g.clearImmediate !== 'function') {
    g.clearImmediate = (id: any) => {
      if (typeof id === 'number' || typeof id === 'object') {
        try { g.clearTimeout(id as any); } catch {}
      }
    };
  }

  // Minimal process.nextTick shim if missing
  if (!g.process) { g.process = {} as any; }
  if (typeof g.process.nextTick !== 'function') {
    const enqueue = typeof g.queueMicrotask === 'function'
      ? g.queueMicrotask.bind(g)
      : (fn: Function) => Promise.resolve().then(() => fn());
    g.process.nextTick = (fn: Function, ...args: any[]) => {
      enqueue(() => fn(...args));
    };
  }
})();

// Other runtime polyfills
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
