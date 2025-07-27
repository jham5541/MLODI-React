import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Placeholder({ title }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    marginVertical: 10,
    borderRadius: 8
  },
  text: {
    color: '#999'
  }
});
