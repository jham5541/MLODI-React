// Mock Vector Icons for Expo Go compatibility
import React from 'react';
import { Text } from 'react-native';

// Mock icon component that shows the icon name
const MockIcon = ({ name, size = 20, color = '#000', style, ...props }) => {
  return (
    <Text style={[{ fontSize: size, color }, style]} {...props}>
      {name ? '📱' : '?'}
    </Text>
  );
};

// Mock icon sets
const createIconSet = () => MockIcon;

const Icons = {
  AntDesign: MockIcon,
  Entypo: MockIcon,
  EvilIcons: MockIcon,
  Feather: MockIcon,
  FontAwesome: MockIcon,
  FontAwesome5: MockIcon,
  FontAwesome5Pro: MockIcon,
  Fontisto: MockIcon,
  Foundation: MockIcon,
  Ionicons: MockIcon,
  MaterialIcons: MockIcon,
  MaterialCommunityIcons: MockIcon,
  Octicons: MockIcon,
  Zocial: MockIcon,
  SimpleLineIcons: MockIcon,
};

// Export individual icon sets
module.exports = MockIcon;
module.exports.default = MockIcon;
module.exports.createIconSet = createIconSet;
module.exports.createIconSetFromFontello = createIconSet;
module.exports.createIconSetFromIcoMoon = createIconSet;

// Export all icon sets
Object.assign(module.exports, Icons);