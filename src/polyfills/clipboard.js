// Mock Clipboard for Expo Go compatibility

const Clipboard = {
  getString: async () => {
    console.log('[Mock Clipboard] getString called');
    return Promise.resolve('');
  },

  setString: async (text) => {
    console.log('[Mock Clipboard] setString called with:', text);
    return Promise.resolve();
  },

  hasString: async () => {
    console.log('[Mock Clipboard] hasString called');
    return Promise.resolve(false);
  },

  hasImage: async () => {
    console.log('[Mock Clipboard] hasImage called');
    return Promise.resolve(false);
  },

  hasURL: async () => {
    console.log('[Mock Clipboard] hasURL called');
    return Promise.resolve(false);
  },

  getImagePNG: async () => {
    console.log('[Mock Clipboard] getImagePNG called');
    return Promise.resolve(null);
  },

  getImageJPG: async () => {
    console.log('[Mock Clipboard] getImageJPG called');
    return Promise.resolve(null);
  },

  setImage: async (imageData) => {
    console.log('[Mock Clipboard] setImage called');
    return Promise.resolve();
  },
};

module.exports = Clipboard;
module.exports.default = Clipboard;