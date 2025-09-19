// Emergency console shim to prevent .bold and similar property errors
// This needs to run before ANYTHING else to patch chalk and similar libraries
(function() {
  // Helper function to create a safe proxy that never throws
  function createSafeProxy(target) {
    return new Proxy(target || {}, {
      get: function(obj, prop) {
        // If property exists, return it
        if (prop in obj) {
          const val = obj[prop];
          // If it's a function, wrap it to be safe
          if (typeof val === 'function') {
            return function(...args) {
              try {
                return val.apply(obj, args);
              } catch (e) {
                // Silently fail
                return undefined;
              }
            };
          }
          return val;
        }
        // For any non-existent property, return a proxy that also returns undefined
        // This handles chains like console.log.bold or chalk.bold.red
        return createSafeProxy();
      },
      set: function() {
        return true; // Allow sets but don't do anything
      },
      has: function() {
        return true; // Pretend we have everything
      }
    });
  }

  // Patch global console
  if (typeof global !== 'undefined') {
    global.console = createSafeProxy(global.console || {});
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.console = createSafeProxy(globalThis.console || {});
  }
  if (typeof window !== 'undefined') {
    window.console = createSafeProxy(window.console || {});
  }

  // Also patch chalk if it exists (it shouldn't in React Native but just in case)
  if (typeof global !== 'undefined' && global.chalk) {
    global.chalk = createSafeProxy(global.chalk);
  }
})();
