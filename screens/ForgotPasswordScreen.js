import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../App';
import { COLORS } from '../constants/colors';
import { useLoading } from '../components/LoadingContext';
import LinearGradient from 'react-native-linear-gradient';

// Define colors for the gradient background
const GRADIENT_COLORS = {
  gradientStart: '#400F0F', // Dark maroon
  gradientMiddle: '#B60000', // Brand red
  gradientEnd: '#FF4D00', // Orange
};

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');  // 'success' or 'error'
  const { isDarkMode } = useContext(ThemeContext);
  const navigation = useNavigation();
  const { showLoader, hideLoader } = useLoading();

  // Theme based styles - always white text for gradient background
  const theme = {
    text: COLORS.white, // Always white for better contrast against gradient
    secondaryText: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white for secondary text
    card: 'rgba(255, 255, 255, 0.15)', // Translucent white for input fields
    border: 'rgba(255, 255, 255, 0.3)', // Translucent white for borders
  };

  const handleForgotPassword = async () => {
    // Validate email
    if (!email || email.trim() === '') {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    showLoader('Processing your request...');

    try {
      // Try different API endpoints - prioritize production endpoint
      const apiBaseUrls = [
        'https://flavorsync-backend.onrender.com/api',
        // Only try local endpoints when in development
        ...(process.env.NODE_ENV === 'development' ? ['http://10.0.2.2:5000/api', 'http://localhost:5000/api'] : [])
      ];

      let success = false;
      let lastError = '';

      for (const baseUrl of apiBaseUrls) {
        try {
          console.log(`Trying API endpoint: ${baseUrl}/auth/forgot-password`);
          
          // Set a timeout for the request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
          
          const response = await fetch(`${baseUrl}/auth/forgot-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          const data = await response.json();
          console.log('Server response:', data);
          
          if (response.ok) {
            success = true;
            setMessage(data.msg || 'If an account with that email exists, an OTP has been sent.');
            setMessageType('success');
            
            // Navigate to ResetPasswordScreen with email
            setTimeout(() => {
              navigation.navigate('ResetPasswordScreen', { email });
            }, 1500);
            
            break;
          } else {
            lastError = data.msg || 'An error occurred';
          }
        } catch (err) {
          console.error(`Error with ${baseUrl}:`, err);
          lastError = err.message || 'Network request failed';
          // Continue to next API URL
        }
      }

      if (!success) {
        // If we've tried all APIs and still failed, show a more user-friendly message
        if (lastError.includes('Network request failed') || lastError.includes('Failed to fetch')) {
          setMessage('Unable to connect to server. Please check your internet connection and try again.');
        } else {
          setMessage(lastError || 'Service unavailable. Please try again later.');
        }
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred. Please try again later.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
      hideLoader();
    }
  };

  return (
    <LinearGradient
      colors={[GRADIENT_COLORS.gradientStart, GRADIENT_COLORS.gradientMiddle, GRADIENT_COLORS.gradientEnd]}
      style={styles.container}
      start={{x: 0.1, y: 0.1}}
      end={{x: 0.8, y: 1.0}}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content" 
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* App Title */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandName}>flavorsync</Text>
          <Text style={styles.brandTagline}>SMART BITES, RIGHT PLACES</Text>
        </View>

        <View style={styles.contentContainer}>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            Enter your email address and we'll send you a one-time code (OTP) to reset your password.
          </Text>

          {message ? (
            <View style={[
              styles.messageContainer, 
              { backgroundColor: messageType === 'success' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)' }
            ]}>
              <Text style={[
                styles.messageText, 
                { color: messageType === 'success' ? '#FFFFFF' : '#FFFFFF' }
              ]}>
                {message}
              </Text>
            </View>
          ) : null}

          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TextInput
                placeholder="Email"
                placeholderTextColor={theme.secondaryText}
                style={[styles.input, { color: COLORS.white }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isSubmitting}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.button,
                isSubmitting ? styles.buttonDisabled : null,
              ]}
              onPress={handleForgotPassword}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#B60000" size="small" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login Link */}
            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() => navigation.navigate('LoginScreen')}
            >
              <Text style={[styles.linkText, { color: COLORS.white }]}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
    paddingTop: 70,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  brandName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 8,
  },
  brandTagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 2,
    textAlign: 'center',
  },
  contentContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  buttonText: {
    color: '#B60000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 50, 0, 0.4)',
    paddingVertical: 12,
    borderRadius: 8,
  },
  linkText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  messageContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  messageText: {
    fontSize: 16,
  },
});

export default ForgotPasswordScreen; 