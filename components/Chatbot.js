import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Animated as RNAnimated,
  Easing,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing as ReanimatedEasing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hi there! How can I help you with FlavorSync today?', isBot: true },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef(null);
  
  // Animation values
  const slideAnim = useSharedValue(500); // Start from bottom
  const fadeAnim = useSharedValue(0);
  const scale = useSharedValue(0.8);
  
  // Bubble animations
  const spinValue = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    // Initial animations
    slideAnim.value = withTiming(0, { duration: 400, easing: ReanimatedEasing.out(ReanimatedEasing.cubic) });
    fadeAnim.value = withTiming(1, { duration: 400 });
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    
    // Start loading animation
    RNAnimated.loop(
      RNAnimated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    
    return () => {
      // Clean up animations
      slideAnim.value = withTiming(500, { duration: 300 });
      fadeAnim.value = withTiming(0, { duration: 300 });
    };
  }, []);

  const handleSend = () => {
    if (input.trim() === '') return;
    
    // Add user message
    const newMessages = [
      ...messages,
      { id: messages.length + 1, text: input, isBot: false },
    ];
    setMessages(newMessages);
    setInput('');
    
    // Simulate bot typing
    setIsTyping(true);
    
    // Simulate bot response after delay
    setTimeout(() => {
      const botResponses = [
        "I can help you find restaurants nearby!",
        "Would you like some dish recommendations?",
        "Check out our trending restaurants section!",
        "How about trying our AI food suggestion feature?",
        "You can upload photos of your favorite dishes too!",
      ];
      
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
      
      setMessages([
        ...newMessages,
        { id: newMessages.length + 1, text: randomResponse, isBot: true },
      ]);
      setIsTyping(false);
    }, 1500);
    
    // Dismiss keyboard
    Keyboard.dismiss();
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: slideAnim.value },
        { scale: scale.value },
      ],
      opacity: fadeAnim.value,
    };
  });
  
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleClose = () => {
    // Animate out
    slideAnim.value = withTiming(500, { duration: 300 });
    fadeAnim.value = withTiming(0, { duration: 300 });
    
    // Call the onClose prop after animation completes
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  return (
    <Animated.View style={[styles.overlay, containerStyle]}>
      <AnimatedLinearGradient
        colors={['#0D0D0D', '#161616', '#1F1F1F']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>FlavorSync AI Assistant</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
        
        {/* Chat area */}
        <ScrollView 
          style={styles.messagesContainer}
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View 
              key={message.id} 
              style={[
                styles.messageBubble,
                message.isBot ? styles.botBubble : styles.userBubble,
              ]}
            >
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          ))}
          
          {isTyping && (
            <View style={[styles.messageBubble, styles.botBubble]}>
              <RNAnimated.View style={{ transform: [{ rotate: spin }] }}>
                <Text style={styles.typingIndicator}>●●●</Text>
              </RNAnimated.View>
            </View>
          )}
        </ScrollView>
        
        {/* Input area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#A0A0A0"
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={handleSend}
            disabled={input.trim() === ''}
          >
            <LinearGradient
              colors={['#6D00FF', '#00FFE0']} 
              style={styles.sendButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </AnimatedLinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: '90%',
    height: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF6B00',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 107, 0, 0.2)',
  },
  headerTitle: {
    color: '#FF6B00',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: -2,
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messagesContent: {
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 10,
  },
  botBubble: {
    backgroundColor: '#1F1F1F',
    borderTopLeftRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  userBubble: {
    backgroundColor: 'rgba(109, 0, 255, 0.2)',
    borderTopRightRadius: 4,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(0, 231, 255, 0.3)',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  typingIndicator: {
    color: '#00E7FF',
    fontSize: 16,
    letterSpacing: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 107, 0, 0.2)',
    paddingBottom: Platform.OS === 'android' ? 25 : 15,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(31, 31, 31, 0.5)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#FFFFFF',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 231, 255, 0.3)',
  },
  sendButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default Chatbot; 