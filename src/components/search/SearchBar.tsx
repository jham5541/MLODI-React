import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onFocus?: () => void;
  onClear?: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({ 
  placeholder = "Search songs, artists, albums...", 
  onSearch, 
  onFocus,
  onClear,
  autoFocus = false 
}: SearchBarProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (text: string) => {
    setQuery(text);
    onSearch?.(text);
  };

  const handleClear = () => {
    setQuery('');
    onSearch?.('');
    onClear?.();
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: isFocused ? themeColors.primary : themeColors.border,
    },
    searchIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: themeColors.text,
      paddingVertical: 0,
    },
    clearButton: {
      marginLeft: 8,
      padding: 4,
    },
  });

  return (
    <View style={styles.container}>
      <Ionicons
        name="search"
        size={20}
        color={isFocused ? themeColors.primary : themeColors.textSecondary}
        style={styles.searchIcon}
      />
      
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={themeColors.textSecondary}
        value={query}
        onChangeText={handleSearch}
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();
        }}
        onBlur={() => setIsFocused(false)}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      {query.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Ionicons
            name="close-circle"
            size={20}
            color={themeColors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}