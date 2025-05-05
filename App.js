import React, { createContext, useEffect, useState, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, Image, StatusBar, Appearance, useColorScheme, Alert, LogBox } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingProvider from './components/LoadingContext';
import NetworkMonitor from './components/NetworkMonitor';
// Import for type checking only, don't call enableScreens() here again
import { enableScreens } from 'react-native-screens';
import SplashScreen from 'react-native-splash-screen';
import { AsyncStorage as MockAsyncStorage, Reanimated, useSharedValue, useAnimatedStyle, withSpring } from './src/mocks';

// NOTE: enableScreens() is already called in index.js

// Import screens
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import SearchScreen from './screens/SearchScreen';
import BiteBot from './screens/BiteBot';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import FlavorSyncSplash from './screens/FlavorSyncSplash';
import LoadingTransitionScreen from './screens/LoadingTransitionScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';

// Create Theme Context
export const ThemeContext = createContext();

// Update ThemeContext to include logout functionality
export const AuthContext = createContext();

// Create Network Status Context
export const NetworkContext = createContext({
  isConnected: true,
  serverReachable: false,
  lastChecked: Date.now()
});

const Stack = createNativeStackNavigator();

// Ignore TurboModule errors specifically for the Reanimated issue
LogBox.ignoreLogs([
  'TurboModuleRegistry',
  'Invariant Violation: TurboModuleRegistry.getEnforcing',
  'PlatformConstants'
]);

const { View: AnimatedView } = Reanimated;

const App = () => {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [isLoading, setIsLoading] = useState(true);
  const [splashFinished, setSplashFinished] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedValue, setSavedValue] = useState('');
  const offset = useSharedValue(0);
  
  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.value }],
    };
  });

  // Add logout function
  const logout = async () => {
    try {
      // Clear all auth-related data
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('userToken');
      
      // Clear any app-specific data that should be reset on logout
      
      console.log('Successfully cleared all authentication data');
      
      // Update login state
      setIsLoggedIn(false);
      
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  };

  // Function to validate stored token
  const validateToken = async (token) => {
    try {
      // For basic validation, we'll check if the token exists and isn't expired
      // In a real app, you might want to decode the JWT and check its expiration
      
      if (!token) return false;
      
      // You could implement a token verification endpoint call here
      // For now, we'll assume the token is valid if it exists
      
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  };
  
  // Function to check authentication status with enhanced token handling
  const checkAuthStatus = async () => {
    try {
      console.log('Checking authentication status...');
      
      // Get token and user data from storage
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      // If no token or user data, user is not logged in
      if (!token || !userData) {
        console.log('No authentication data found');
        setIsLoggedIn(false);
        return false;
      }
      
      // Validate the token
      const isValid = await validateToken(token);
      
      if (isValid) {
        console.log('Valid authentication token found');
        setIsLoggedIn(true);
        return true;
      } else {
        console.log('Invalid or expired token');
        // For security, clear invalid tokens
        await AsyncStorage.removeItem('token');
        setIsLoggedIn(false);
        return false;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsLoggedIn(false);
      return false;
    }
  };

  // Force refresh of login state when it changes
  useEffect(() => {
    if (isLoggedIn) {
      console.log("Login state changed to logged in!");
    }
  }, [isLoggedIn]);

  // Updated app initialization with enhanced authentication
  useEffect(() => {
    console.log('App initialization started');
    
    // Initialize app state and check authentication
    const initializeApp = async () => {
      try {
        console.log('Checking authentication status...');
        
        // Use enhanced auth check
        await checkAuthStatus();
      } catch (error) {
        console.error('Error during app initialization:', error);
      } finally {
        // Mark splash as finished and then hide loader after a delay
        console.log('App initialization complete, transitioning to main UI');
        // Hide the native splash screen
        SplashScreen.hide();
        setTimeout(() => {
          setSplashFinished(true);
          // After a shorter delay, show the main UI
          setTimeout(() => {
            setIsLoading(false);
          }, 500);
        }, 2000);
      }
    };

    initializeApp();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDarkMode(colorScheme === 'dark');
    });

    return () => subscription.remove();
  }, []);

  // Theme values
  const theme = {
    isDarkMode,
    colors: isDarkMode ? {
      background: '#121212',
      text: '#FFFFFF',
      primary: '#B60000',
      secondary: '#FF8A00',
      accent: '#FFB74D',
      error: '#FF3B30',
      success: '#4CAF50',
      card: '#1F1F1F',
      border: '#333333',
    } : {
      background: '#FFFFFF',
      text: '#1B1B1B',
      primary: '#B60000',
      secondary: '#FF8A00',
      accent: '#FFB74D',
      error: '#FF3B30',
      success: '#4CAF50',
      card: '#F8F8F8',
      border: '#E0E0E0',
    }
  };

  console.log('Current app state:', { 
    splashFinished, 
    isLoading, 
    isLoggedIn,
  });

  useEffect(() => {
    // Demo of using our mocked AsyncStorage
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const value = await MockAsyncStorage.getItem('@MyApp:key');
      if (value !== null) {
        setSavedValue(value);
      }
    } catch (error) {
      console.error('Error loading data', error);
    }
  };

  const saveData = async () => {
    try {
      const timestamp = new Date().toISOString();
      await MockAsyncStorage.setItem('@MyApp:key', `Data saved at ${timestamp}`);
      await loadData();
    } catch (error) {
      console.error('Error saving data', error);
    }
  };

  const animate = () => {
    // Toggle between 0 and 100 for the animation
    offset.value = withSpring(offset.value === 0 ? 100 : 0);
  };

  if (!splashFinished) {
    return <FlavorSyncSplash />;
  }
  
  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, logout }}>
      <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
        <LoadingProvider>
          <NetworkMonitor>
            <SafeAreaProvider>
              <StatusBar 
                barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
                backgroundColor="transparent"
                translucent={true}
              />
              <NavigationContainer
                onStateChange={(state) => {
                  // Log navigation state changes for debugging
                  if (state) {
                    const currentRouteName = state.routes[state.index].name;
                    console.log(`Navigation changed: Current screen is ${currentRouteName}`);
                  }
                }}
              >
                <Stack.Navigator 
                  initialRouteName={isLoggedIn ? "LoadingTransitionScreen" : "LoginScreen"} 
                  screenOptions={{ headerShown: false }}
                >
                  {isLoggedIn ? (
                    <>
                      <Stack.Screen name="LoadingTransitionScreen" component={LoadingTransitionScreen} />
                      <Stack.Screen name="HomeScreen" component={HomeScreen} />
                      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
                      <Stack.Screen name="SearchScreen" component={SearchScreen} />
                      <Stack.Screen name="BiteBot" component={BiteBot} />
                    </>
                  ) : (
                    <>
                      <Stack.Screen name="LoginScreen" component={LoginScreen} />
                      <Stack.Screen name="SignupScreen" component={SignupScreen} />
                      <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
                      <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
                      <Stack.Screen name="FlavorSyncSplash" component={FlavorSyncSplash} />
                    </>
                  )}
                </Stack.Navigator>
              </NavigationContainer>
            </SafeAreaProvider>
          </NetworkMonitor>
        </LoadingProvider>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
};

export default App; 