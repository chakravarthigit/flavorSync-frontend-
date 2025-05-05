import React, { useEffect, useContext, useState } from 'react';
import { View, StyleSheet, Text, Animated, Dimensions } from 'react-native';
import { ThemeContext } from '../App';
import DeliveryTruckLoader from '../components/DeliveryTruckLoader';

const { width } = Dimensions.get('window');

const LoadingTransitionScreen = ({ navigation, route }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [message, setMessage] = useState('Preparing your flavor journey...');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const textFadeAnim = React.useRef(new Animated.Value(0)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  
  // Get loading mode from route params (login, startup, etc.)
  const mode = route.params?.mode || 'default';
  
  // Customize messages based on mode
  const getMessagesForMode = (mode) => {
    switch(mode) {
      case 'login':
        return [
          'Welcome back!',
          'Setting up your personal preferences...',
          'Finding your favorite flavors...',
          'Getting the latest recommendations...'
        ];
      default:
        return [
          'Preparing your flavor journey...',
          'Finding local delights...',
          'Getting your recommendations ready...',
          'Loading the tastiest options...'
        ];
    }
  };
  
  const messages = getMessagesForMode(mode);
  
  useEffect(() => {
    console.log('LoadingTransitionScreen mounted - immediate navigation in 2.5 seconds');
    
    // Change message every 500ms (faster)
    const messageInterval = setInterval(() => {
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 500);
    
    // Simple fade-in only
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(textFadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Fast progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2400,
      useNativeDriver: false,
    }).start();

    // CRITICALLY IMPORTANT: Direct timer with shorter delay
    const directTimer = setTimeout(() => {
      console.log('NAVIGATING TO HOME SCREEN NOW');
      navigation.reset({
        index: 0,
        routes: [{ name: 'HomeScreen' }]
      });
    }, 2500); // Just 2.5 seconds total

    return () => {
      clearTimeout(directTimer);
      clearInterval(messageInterval);
    };
  }, []);

  // Progress bar width animation
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  // Theme-based colors
  const backgroundColor = isDarkMode ? '#121212' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#333333';
  const primaryColor = '#FF8A00';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Truck loader animation */}
      <Animated.View style={[styles.loaderContainer, { opacity: fadeAnim }]}>
        <DeliveryTruckLoader />
      </Animated.View>
      
      {/* Loading text and progress bar at bottom */}
      <View style={styles.bottomContainer}>
        {/* Loading text */}
        <Animated.Text style={[
          styles.text,
          { 
            opacity: textFadeAnim,
            color: textColor
          }
        ]}>
          {message}
        </Animated.Text>
        
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <Animated.View 
            style={[
              styles.progressBar,
              {
                width: progressWidth,
                backgroundColor: primaryColor
              }
            ]} 
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  progressContainer: {
    width: width * 0.7,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  }
});

export default LoadingTransitionScreen; 