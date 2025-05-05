import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const FlavorSyncSplash = () => {
  // Animation values
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.5)).current;
  
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(20)).current;
  
  // Animation for the letters of "FlavorSync"
  const letterAnimations = Array(10).fill().map(() => ({
    opacity: useRef(new Animated.Value(0)).current,
    translateY: useRef(new Animated.Value(-20)).current,
  }));

  useEffect(() => {
    // Start animations as soon as component mounts
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Sequence of animations
    
    // 1. Animate the title with a bounce effect
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(titleScale, {
      toValue: 1,
      duration: 800,
      easing: Easing.bounce,
      useNativeDriver: true,
    }).start();
    
    // 2. Animate each letter of "FlavorSync" with a staggered effect
    letterAnimations.forEach((anim, index) => {
      Animated.sequence([
        Animated.delay(index * 80),
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
    
    // 3. Animate the tagline after the title animation
    Animated.sequence([
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };
  
  // Individual letters for the staggered animation
  const letters = "FlavorSync".split("");

  return (
    <LinearGradient 
      colors={['#5a0000', '#B60000']} 
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Main title with letter animations */}
        <View style={styles.titleContainer}>
          {letters.map((letter, index) => (
            <Animated.Text 
              key={`letter-${index}`}
              style={[
                styles.titleLetter,
                {
                  opacity: letterAnimations[index]?.opacity || titleOpacity,
                  transform: [
                    { translateY: letterAnimations[index]?.translateY || 0 },
                  ],
                },
              ]}
            >
              {letter}
            </Animated.Text>
          ))}
        </View>
        
        {/* Tagline */}
        <Animated.Text 
          style={[
            styles.tagline,
            {
              opacity: taglineOpacity,
              transform: [
                { translateY: taglineTranslateY },
              ],
            },
          ]}
        >
          SMART BITES, RIGHT PLACES
        </Animated.Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleLetter: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: 16,
    color: '#FFB74D',
    letterSpacing: 1.5,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
});

export default FlavorSyncSplash; 