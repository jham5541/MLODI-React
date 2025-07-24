// React DOM polyfill for React Native
// This provides the minimum functionality needed for @tanstack/react-query

// Import from React Native instead of React
const React = require('react-native');

// Use React Native's batched updates if available, otherwise use a fallback
const unstable_batchedUpdates = React.unstable_batchedUpdates || ((fn) => fn());

// Export the batched updates function that react-query expects
module.exports = {
  unstable_batchedUpdates,
  render: () => {},
  createPortal: () => {},
  findDOMNode: () => {},
  unmountComponentAtNode: () => {},
};

// Also support ES module exports
module.exports.default = module.exports;

// Support named exports
Object.assign(module.exports, {
  unstable_batchedUpdates,
});