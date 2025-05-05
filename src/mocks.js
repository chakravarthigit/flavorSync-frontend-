// Mock AsyncStorage
export const AsyncStorage = {
  getItem: async (key) => {
    console.log('Mock AsyncStorage getItem called with key:', key);
    return null;
  },
  setItem: async (key, value) => {
    console.log('Mock AsyncStorage setItem called with key:', key, 'and value:', value);
    return null;
  },
  removeItem: async (key) => {
    console.log('Mock AsyncStorage removeItem called with key:', key);
    return null;
  },
  clear: async () => {
    console.log('Mock AsyncStorage clear called');
    return null;
  },
  getAllKeys: async () => {
    console.log('Mock AsyncStorage getAllKeys called');
    return [];
  },
  multiGet: async (keys) => {
    console.log('Mock AsyncStorage multiGet called with keys:', keys);
    return keys.map(key => [key, null]);
  },
  multiSet: async (keyValuePairs) => {
    console.log('Mock AsyncStorage multiSet called with pairs:', keyValuePairs);
    return null;
  },
  multiRemove: async (keys) => {
    console.log('Mock AsyncStorage multiRemove called with keys:', keys);
    return null;
  },
};

// Mock Reanimated components and hooks
const createAnimatedComponent = (Component) => Component;

export const Reanimated = {
  View: createAnimatedComponent('View'),
  Text: createAnimatedComponent('Text'),
  Image: createAnimatedComponent('Image'),
  ScrollView: createAnimatedComponent('ScrollView'),
  createAnimatedComponent,
};

// Mock useSharedValue hook
export const useSharedValue = (initialValue) => {
  return { value: initialValue };
};

// Mock useAnimatedStyle hook
export const useAnimatedStyle = (styleCallback) => {
  return styleCallback();
};

// Mock withSpring animation
export const withSpring = (toValue, config) => {
  console.log('Mock withSpring animation called with toValue:', toValue, 'and config:', config);
  return toValue;
};

// Export other common Reanimated functions/components that might be needed
export const withTiming = (toValue, config) => {
  console.log('Mock withTiming animation called with toValue:', toValue, 'and config:', config);
  return toValue;
};

export const useAnimatedGestureHandler = (handlers) => {
  return handlers;
};

export const runOnJS = (fn) => {
  return (...args) => fn(...args);
};

export const useAnimatedScrollHandler = (handlers) => {
  return handlers;
};

export default {
  AsyncStorage,
  Reanimated,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useAnimatedGestureHandler,
  runOnJS,
  useAnimatedScrollHandler,
}; 