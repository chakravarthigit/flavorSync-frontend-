import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, AppState, Alert, Dimensions, SafeAreaView, Platform, StatusBar, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { NetworkContext } from '../App';

// Get device screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const NetworkMonitor = ({ children }) => {
  const appState = useRef(AppState.currentState);
  const [networkState, setNetworkState] = React.useState({
    isConnected: true,
    serverReachable: false,
    lastChecked: Date.now()
  });
  
  // Animation for pulsing effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Set up pulsing animation for the offline notice
  useEffect(() => {
    if (networkState.isConnected === false) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animation when connected
      pulseAnim.setValue(1);
    }
  }, [networkState.isConnected, pulseAnim]);

  // Check server connectivity
  const checkServerConnection = async () => {
    try {
      if (!networkState.isConnected) {
        return { serverReachable: false, workingUrl: null };
      }
      
      const serverUrls = [
        'https://flavorsync-backend.onrender.com',
        'https://flavorsync-api.onrender.com'
      ];
      
      let serverReachable = false;
      let workingUrl = null;
      
      for (const baseUrl of serverUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(`${baseUrl}/api/healthcheck`, {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            serverReachable = true;
            workingUrl = baseUrl;
            break;
          }
        } catch (error) {
          console.log(`Failed to connect to ${baseUrl}:`, error);
          continue;
        }
      }
      
      setNetworkState(prev => ({
        ...prev,
        serverReachable,
        workingUrl,
        lastChecked: Date.now()
      }));
      
      return { serverReachable, workingUrl };
    } catch (error) {
      console.error('Network connection check failed:', error);
      setNetworkState(prev => ({
        ...prev,
        serverReachable: false,
        lastChecked: Date.now()
      }));
      return { serverReachable: false, workingUrl: null };
    }
  };

  // Initialize network monitoring
  useEffect(() => {
    // Subscribe to network info changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState(prev => ({
        ...prev,
        isConnected: state.isConnected ?? false
      }));
      
      // Check server connection whenever network state changes
      if (state.isConnected) {
        checkServerConnection();
      }
    });

    // Subscribe to app state changes (background/foreground)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        // App has come to the foreground, check connection
        NetInfo.fetch().then(state => {
          setNetworkState(prev => ({
            ...prev,
            isConnected: state.isConnected ?? false
          }));
          
          // Only check server if connected
          if (state.isConnected) {
            checkServerConnection();
          }
        });
      }
      
      appState.current = nextAppState;
    });

    // Initial connection check
    NetInfo.fetch().then(state => {
      setNetworkState(prev => ({
        ...prev,
        isConnected: state.isConnected ?? false
      }));
      
      if (state.isConnected) {
        checkServerConnection();
      }
    });

    // Clean up
    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, []);

  // Force recheck every 2 minutes when app is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (networkState.isConnected && appState.current === 'active') {
        checkServerConnection();
      }
    }, 2 * 60 * 1000); // 2 minutes
    
    return () => clearInterval(interval);
  }, [networkState.isConnected]);

  return (
    <NetworkContext.Provider value={networkState}>
      {networkState.isConnected === false && (
        <View style={styles.container}>
          <Animated.View style={[styles.offlineBar, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.offlineText}>⚠️ NO INTERNET CONNECTION</Text>
          </Animated.View>
        </View>
      )}
      {children}
    </NetworkContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight || 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    paddingHorizontal: 10,
  },
  offlineBar: {
    backgroundColor: '#e53935',
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 500,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginTop: 4,
  },
  offlineText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 0.5,
  }
});

export default NetworkMonitor; 