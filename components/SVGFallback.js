import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * A fallback component to use when SVG components fail to load properly
 * This helps avoid crashes when SVG native modules aren't properly linked
 */
const SVGFallback = ({ width = 100, height = 100, style, children }) => {
  return (
    <View 
      style={[
        styles.container, 
        { width, height }, 
        style
      ]}
    >
      <Text style={styles.text}>SVG</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#DDDDDD',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  text: {
    fontSize: 12,
    color: '#333333',
  }
});

export default SVGFallback; 