import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Image,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext, AuthContext } from '../App'; // Import ThemeContext and AuthContext
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLoading } from '../components/LoadingContext';

const { width, height } = Dimensions.get('window');

// Define colors based on theme
const COLORS = {
  background: '#FFFFFF',
  backgroundDark: '#121212',
  primary: '#B60000',
  primaryLight: '#CC4D4D',
  primaryDark: '#800000',
  accent: '#CC4D4D',
  text: '#1B1B1B',
  textDark: '#FFFFFF',
  secondaryText: '#767676',
  secondaryTextDark: '#BBBBBB',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  lightGrayDark: '#272727',
  gray: '#767676',
  grayDark: '#8E8E8E',
  darkGray: '#1B1B1B',
  darkGrayDark: '#EEEEEE',
  black: '#1B1B1B',
  shadow: 'rgba(27, 27, 27, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.3)',
  // New gradient colors for background
  gradientStart: '#400F0F', // Dark maroon
  gradientMiddle: '#B60000', // Brand red
  gradientEnd: '#FF4D00', // Orange
};

// Base64 encoding function to replace Buffer.from
const btoa = (input) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  
  input = String(input);
  
  while (i < input.length) {
    const chr1 = input.charCodeAt(i++);
    const chr2 = i < input.length ? input.charCodeAt(i++) : Number.NaN;
    const chr3 = i < input.length ? input.charCodeAt(i++) : Number.NaN;
    
    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    const enc3 = isNaN(chr2) ? 64 : ((chr2 & 15) << 2) | (chr3 >> 6);
    const enc4 = isNaN(chr3) ? 64 : (chr3 & 63);
    
    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }
  
  return output;
};

const SignupScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useContext(ThemeContext);
  const { setIsLoggedIn } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  
  // Use global loading context instead of local state
  const { showLoader, hideLoader } = useLoading();

  // Get theme colors based on dark mode state
  const theme = {
    background: isDarkMode ? COLORS.backgroundDark : COLORS.background,
    text: COLORS.white, // Always white for better contrast against gradient
    secondaryText: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white
    card: 'rgba(255, 255, 255, 0.15)', // Translucent white for input fields
    border: 'rgba(255, 255, 255, 0.3)', // Translucent white for borders
    shadow: isDarkMode ? COLORS.shadowDark : COLORS.shadow,
  };

  const toggleDebugView = () => {
    setShowDebug(!showDebug);
  };

  const testServerConnection = async () => {
    try {
      setSignupError('');
      setIsLoading(true);
      
      const healthUrl = 'https://flavorsync-backend.onrender.com/api/healthcheck';
      console.log('Testing connectivity with:', healthUrl);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        timeout: 10000
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Server health check successful:', data);
        setIsLoading(false);
        Alert.alert(
          'Connection Successful', 
          `The server is running correctly.\nResponse: ${JSON.stringify(data)}`,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        console.log('Server health check failed with status:', response.status);
        setIsLoading(false);
        Alert.alert(
          'Connection Failed', 
          `The server responded with status: ${response.status}`,
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setIsLoading(false);
      Alert.alert(
        'Connection Error', 
        `Could not connect to the server: ${error.message}`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleSignup = async () => {
    // Reset error state
    setShowError(false);
    setErrorMessage('');
    
    // Validate input fields
    if (!validateFields()) {
      return;
    }
    
    try {
      // Get the server URL from AsyncStorage with multiple fallbacks
      let serverUrl = await AsyncStorage.getItem('serverBaseUrl');
      
      // List of possible server URLs to try if the primary one fails
      const serverUrls = [
        serverUrl,
        'https://flavorsync-backend.onrender.com',
        'https://flavorsync-api.onrender.com'
      ].filter(Boolean); // Remove any null/undefined values
      
      let responseData = null;
      let error = null;
      
      // Try each server URL until one works
      for (const url of serverUrls) {
        try {
          console.log('Attempting to register with:', { email, username });
          console.log('Trying API URL:', `${url}/api/auth/register`);
          
          // Connect to backend API for signup
          const response = await fetch(`${url}/api/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              name,
              username,
              email,
              password,
            }),
          });
          
          // Get response as text first for better error handling
          const responseText = await response.text();
          console.log('Raw server response:', responseText);
          
          // Try to parse JSON response
          try {
            const data = JSON.parse(responseText);
            console.log('Parsed response data:', data);
            
            if (response.ok) {
              responseData = data;
              
              // Save working URL for future use
              await AsyncStorage.setItem('serverBaseUrl', url);
              
              break; // Success - exit the loop
            } else {
              // Handle specific error cases
              if (data.message && data.message.includes('already exists')) {
                throw new Error('This email is already registered. Please use another email or log in.');
              } else if (data.message && data.message.includes('Username already taken')) {
                throw new Error('This username is already taken. Please choose another username.');
              } else if (data.mongoStatus === 'offline') {
                throw new Error('Database connection issue. Please try again later.');
              } else {
                // Store the error but keep trying other URLs
                error = new Error(data.message || 'Sign up failed');
              }
            }
          } catch (jsonError) {
            console.error('Error parsing JSON:', jsonError);
            
            if (responseText.includes('already exists')) {
              throw new Error('This email or username is already registered');
            }
            
            // Store the error but keep trying other URLs
            error = new Error(`Invalid server response: ${responseText.substring(0, 100)}`);
          }
        } catch (fetchError) {
          console.error('Fetch error for URL', url, fetchError);
          // Store the error but keep trying other URLs
          error = fetchError;
        }
      }
      
      // If we got a successful response
      if (responseData) {
        console.log('Signup successful, data received:', responseData);
        
        // Show a success message
        Alert.alert(
          'Account Created',
          'Your account has been created successfully! Please login with your credentials.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.replace('LoginScreen');
              }
            }
          ]
        );
      } else {
        // If all server URLs failed, throw the last error
        throw error || new Error('Could not connect to any server. Please check your internet connection.');
      }
    } catch (error) {
      console.error('Registration error:', error.message);
      showErrorMessage(error.message || 'Registration failed. Please try again.');
    }
  };

  const validateFields = () => {
    if (!name || name.trim() === '') {
      showErrorMessage('Please enter your name');
      return false;
    }
    
    if (!username || username.trim() === '') {
      showErrorMessage('Please enter a username');
      return false;
    }
    
    if (!email || email.trim() === '') {
      showErrorMessage('Please enter your email');
      return false;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showErrorMessage('Please enter a valid email address');
      return false;
    }
    
    if (!password || password.length < 6) {
      showErrorMessage('Password must be at least 6 characters');
      return false;
    }
    
    if (password !== confirmPassword) {
      showErrorMessage('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const showErrorMessage = (message) => {
    setShowError(true);
    setErrorMessage(message);
  };

  const toggleSecureTextEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const toggleSecureConfirmTextEntry = () => {
    setSecureConfirmTextEntry(!secureConfirmTextEntry);
  };

  const handleLoginPress = () => {
    navigation.navigate('LoginScreen');
  };

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientMiddle, COLORS.gradientEnd]}
      start={{x: 0.1, y: 0.1}}
      end={{x: 0.8, y: 1.0}}
      style={styles.container}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* App Title */}
          <View style={styles.brandContainer}>
            <Text style={styles.brandName}>flavorsync</Text>
            <Text style={styles.brandTagline}>
              SMART BITES, RIGHT PLACES
            </Text>
          </View>

          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your full name"
                placeholderTextColor={theme.secondaryText}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>
          
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                placeholderTextColor={theme.secondaryText}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
          
          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Choose a username"
                placeholderTextColor={theme.secondaryText}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          </View>
          
          {/* Show error message if any */}
          {showError && (
            <View style={styles.errorToast}>
              <Text style={styles.errorToastText}>{errorMessage}</Text>
            </View>
          )}
          
          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Create a password"
                placeholderTextColor={theme.secondaryText}
                secureTextEntry={secureTextEntry}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
            </View>
          </View>
          
          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Confirm your password"
                placeholderTextColor={theme.secondaryText}
                secureTextEntry={secureConfirmTextEntry}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
            </View>
          </View>
          
          {/* Signup Button */}
          <TouchableOpacity
            style={[
              styles.signupButton,
              { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
            ]}
            onPress={handleSignup}
          >
            <Text style={[styles.signupButtonText, { color: COLORS.primary }]}>
              Create Account
            </Text>
          </TouchableOpacity>
          
          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme.secondaryText }]}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={handleLoginPress}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingTop: 50,
    paddingHorizontal: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
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
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(150, 0, 0, 0.2)',
    height: 50,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#FFFFFF',
  },
  signupButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
    marginBottom: 30,
    backgroundColor: 'rgba(255, 50, 0, 0.4)',
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginText: {
    fontSize: 16,
    marginRight: 5,
  },
  loginLink: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  errorToast: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  errorToastText: {
    color: '#FFCCCC',
    textAlign: 'center',
  },
});

export default SignupScreen; 