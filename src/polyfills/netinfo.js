// Mock NetInfo for Expo Go compatibility

const NetInfo = {
  fetch: async () => {
    console.log('[Mock NetInfo] fetch called');
    return Promise.resolve({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
      details: {
        isConnectionExpensive: false,
        ssid: 'MockWiFi',
        bssid: '00:00:00:00:00:00',
        strength: 100,
        ipAddress: '192.168.1.100',
        subnet: '255.255.255.0',
      },
    });
  },

  addEventListener: (listener) => {
    console.log('[Mock NetInfo] addEventListener called');
    // Return unsubscribe function
    return () => {
      console.log('[Mock NetInfo] Event listener unsubscribed');
    };
  },

  useNetInfo: () => {
    console.log('[Mock NetInfo] useNetInfo hook called');
    return {
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
      details: {
        isConnectionExpensive: false,
        ssid: 'MockWiFi',
        bssid: '00:00:00:00:00:00',
        strength: 100,
        ipAddress: '192.168.1.100',
        subnet: '255.255.255.0',
      },
    };
  },

  configure: (configuration) => {
    console.log('[Mock NetInfo] configure called with:', configuration);
  },

  refresh: async () => {
    console.log('[Mock NetInfo] refresh called');
    return NetInfo.fetch();
  },
};

module.exports = NetInfo;
module.exports.default = NetInfo;