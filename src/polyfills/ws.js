// WebSocket polyfill for React Native
// This is a no-op polyfill since we don't need WebSocket functionality in the mobile app

// Mock WebSocket class
class MockWebSocket {
  constructor() {
    this.readyState = 3; // CLOSED
  }
  
  close() {}
  send() {}
  addEventListener() {}
  removeEventListener() {}
}

// Mock WebSocket Server (not used in React Native)
class MockWebSocketServer {
  constructor() {}
  close() {}
  on() {}
  off() {}
}

// Export mock implementations
module.exports = MockWebSocket;
module.exports.WebSocket = MockWebSocket;
module.exports.WebSocketServer = MockWebSocketServer;
module.exports.createWebSocketStream = () => ({
  pipe: () => {},
  on: () => {},
  write: () => {},
  end: () => {},
});

// Default export
module.exports.default = MockWebSocket;