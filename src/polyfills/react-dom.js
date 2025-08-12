// React DOM polyfill for React Native
// This provides the minimum functionality needed for @tanstack/react-query

// React DOM polyfill for React Native
// Provides minimal APIs some libraries expect from react-dom

// Import batched updates from React Native
let batched;
try {
  const rn = require('react-native');
  batched = typeof rn.unstable_batchedUpdates === 'function' ? rn.unstable_batchedUpdates : undefined;
} catch (e) {
  batched = undefined;
}

const noop = () => {};
const safeBatched = batched || ((fn) => fn());

module.exports = {
  unstable_batchedUpdates: safeBatched,
  render: noop,
  createPortal: noop,
  findDOMNode: noop,
  unmountComponentAtNode: noop,
};

module.exports.default = module.exports;
