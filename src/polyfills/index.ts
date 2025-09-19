// Global polyfills loaded before app code
// Ensure console methods are safe under Hermes (some may be undefined or lack bind)
(() => {
  // Ensure globalThis exists
  // @ts-ignore
  const g: any = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : {}));
  
  // Store original console if it exists
  const originalConsole = g.console || {};
  
  // Create safe wrapper functions
  const noop = () => {};
  const safeMethods: any = {};
  
  // Safe console methods
  const methods = [
    'log','info','warn','error','debug','trace',
    'time','timeEnd','group','groupCollapsed','groupEnd',
    'assert','clear','count','countReset','dir','dirxml',
    'profile','profileEnd','table','timeLog','timeStamp'
  ];
  
  methods.forEach((m) => {
    const fn = originalConsole[m];
    if (typeof fn === 'function') {
      // Wrap the function to be safe
      safeMethods[m] = (...args: any[]) => {
        try {
          return fn.apply(originalConsole, args);
        } catch (_err) {
          // Fallback to noop if there's an error
          return noop();
        }
      };
    } else {
      safeMethods[m] = noop;
    }
  });

  // Ensure React's debug integration doesn't crash on non-function createTask
  // React checks truthiness of console.createTask and will call it if present.
  // We force it to be undefined so React falls back safely.
  (safeMethods as any).createTask = undefined;

  // Create a Proxy that handles all property accesses safely
  // This prevents errors when libraries try to access non-existent properties like .bold
  const consoleProxy = new Proxy(safeMethods, {
    get(target, prop) {
      // If it's a known method, return it
      if (prop in target) {
        return target[prop];
      }
      
      // For any unknown property, return undefined instead of throwing
      // This handles cases where libraries try to access console.bold, console.red, etc.
      // or any other formatting properties that don't exist in React Native
      return undefined;
    },
    set(target, prop, value) {
      // Allow setting properties but don't actually store them
      // This prevents errors when libraries try to modify console
      return true;
    },
    has(target, prop) {
      // Only report that we have the safe methods
      return prop in target;
    }
  });
  
  // Replace global console with the proxy
  try {
    g.console = consoleProxy;
    // Also try to define it as non-configurable if possible
    if (Object.defineProperty) {
      Object.defineProperty(g, 'console', {
        value: consoleProxy,
        writable: true,
        enumerable: true,
        configurable: false
      });
    }
  } catch (e) {
    // If we can't define it, just assign it
    g.console = consoleProxy;
  }

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
