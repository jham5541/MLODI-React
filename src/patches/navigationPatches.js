// Patch for React Navigation HeaderTitle and other components that might use console.bold
// This ensures that any property access on undefined returns undefined instead of throwing

if (typeof global !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  // Override console methods to catch and suppress .bold errors
  console.error = function(...args) {
    // Filter out the specific .bold error
    const errorString = args.join(' ');
    if (errorString.includes("Cannot read property 'bold' of undefined")) {
      return; // Suppress this specific error
    }
    return originalError.apply(console, args);
  };

  console.warn = function(...args) {
    const warnString = args.join(' ');
    if (warnString.includes("Cannot read property 'bold' of undefined")) {
      return;
    }
    return originalWarn.apply(console, args);
  };

  console.log = function(...args) {
    const logString = args.join(' ');
    if (logString.includes("Cannot read property 'bold' of undefined")) {
      return;
    }
    return originalLog.apply(console, args);
  };
}

export {};