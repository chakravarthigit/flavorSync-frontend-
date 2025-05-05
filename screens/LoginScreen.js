import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext, AuthContext, NetworkContext } from '../App';
import LinearGradient from 'react-native-linear-gradient';
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
  error: '#FF3B30',
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

const LoginScreen = () => {
  console.log('Rendering LoginScreen');
  
  try {
    const { isDarkMode } = useContext(ThemeContext);
    const { setIsLoggedIn } = useContext(AuthContext);
    const { isConnected, serverReachable } = useContext(NetworkContext || { isConnected: true, serverReachable: false });
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [errorVisible, setErrorVisible] = useState(false);
    const [errorText, setErrorText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Use global loading context instead of local state
    const { showLoader, hideLoader } = useLoading();
    
    // Show network error if no connection
    useEffect(() => {
      console.log('LoginScreen network status:', { isConnected, serverReachable });
      
      if (!isConnected) {
        showError('Network connection unavailable. Please check your internet connection.');
      }
    }, [isConnected, serverReachable]);
    
    // Check for a saved server URL
    const getServerBaseUrl = async () => {
      try {
        const savedUrl = await AsyncStorage.getItem('serverBaseUrl');
        return savedUrl || null;
      } catch (error) {
        console.error('Error getting saved server URL:', error);
        return null;
      }
    };
    
    // Theme-based colors
    const theme = {
      background: isDarkMode ? COLORS.backgroundDark : COLORS.background,
      text: COLORS.white, // Always white for better contrast against gradient
      secondaryText: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white for secondary text
      card: 'rgba(255, 255, 255, 0.15)', // Translucent white for input fields
      border: 'rgba(255, 255, 255, 0.3)', // Translucent white for borders
    };
    
    // Login function with improved error handling
    const handleLogin = async () => {
      try {
        setIsLoading(true);
        setErrorVisible(false); // Clear any previous errors
        
        // Add basic validation function that was missing
        const validateInputs = () => {
          if (!email || email.trim() === '') {
            setErrorVisible(true);
            setErrorText('Please enter your email');
            return false;
          }
          
          if (!password || password.trim() === '') {
            setErrorVisible(true);
            setErrorText('Please enter your password');
            return false;
          }
          
          return true;
        };
        
        if (!validateInputs()) {
          setIsLoading(false);
          return;
        }

        // Show loader with message
        showLoader('Logging in...');

        // List of server URLs to try, in order of preference
        const savedBaseUrl = await AsyncStorage.getItem('serverBaseUrl');
        const serverUrls = [
          savedBaseUrl, // Try the saved URL first if available
          'https://flavorsync-backend.onrender.com', // Deployed server URL on Render
          'https://flavorsync-api.onrender.com' // Backup deployed URL
        ].filter(Boolean); // Remove any null/undefined values
        
        let loginSuccessful = false;
        let lastError = null;

        for (const serverUrl of serverUrls) {
          try {
            const url = `${serverUrl}/api/auth/login`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
            
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({ email, password }),
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Handle different response statuses with appropriate user-friendly messages
            if (response.status === 400 || response.status === 401) {
              lastError = 'Incorrect email or password. Please try again.';
              continue; // Try next server
            }
            
            if (!response.ok) {
              lastError = 'Incorrect email or password. Please try again.';
              continue; // Try next server
            }
            
            // Parse response data, wrapping in try-catch to handle JSON parse errors
            let data;
            try {
              data = await response.json();
            } catch (jsonError) {
              lastError = 'Incorrect email or password. Please try again.';
              continue; // Try next server
            }
            
            // Check if we have a valid token and user data
            if (!data.token || !data.user) {
              lastError = 'Incorrect email or password. Please try again.';
              continue; // Try next server
            }
            
            // Login successful
            loginSuccessful = true;
            
            // Save the successful server URL for future use
            await AsyncStorage.setItem('serverBaseUrl', serverUrl);
            
            // Store token and user data
            await AsyncStorage.setItem('token', data.token);
            await AsyncStorage.setItem('user', JSON.stringify(data.user));
            
            // Also store userData in a consistent format for other parts of the app
            if (data.user) {
              await AsyncStorage.setItem('userData', JSON.stringify({
                id: data.user.id || data.user._id,
                name: data.user.name,
                email: data.user.email,
                username: data.user.username,
                profileImage: data.user.profileImage,
                // Add any other fields needed by the app
              }));
            }
            
            // Force immediate update of isLoggedIn state
            setIsLoggedIn(true);
            
            // Don't navigate directly - React Navigation will handle it when isLoggedIn changes
            hideLoader();
            
            break; // Exit the loop since login was successful
          } catch (error) {
            if (error.name === 'AbortError') {
              lastError = 'Connection timed out';
            } else {
              lastError = 'Network error. Please check your connection';
            }
          }
        }
        
        if (!loginSuccessful) {
          // Show the error directly in the UI instead of an Alert
          setErrorVisible(true);
          // Simplify to always show the same message
          setErrorText('Incorrect email or password. Please try again.');
          hideLoader(); // Make sure to hide the loader
        }
      } catch (error) {
        console.error('Login error:', error);
        setErrorVisible(true);
        setErrorText('An unexpected error occurred. Please try again.');
        hideLoader();
      } finally {
        setIsLoading(false);
      }
    };
    
    // Navigate to signup
    const handleSignupPress = () => {
      navigation.navigate('SignupScreen');
    };
    
    const showError = (message) => {
      setErrorVisible(true);
      setErrorText(message);
    };
    
    return (
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientMiddle, COLORS.gradientEnd]}
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
          
          {/* Error message - updated to be more visible */}
          {errorVisible && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorText}</Text>
            </View>
          )}
          
          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
              <TextInput
                placeholder="Email"
                placeholderTextColor={theme.secondaryText}
                style={[styles.input, { color: theme.text }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            {/* Password Input */}
            <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
              <TextInput
                placeholder="Password"
                placeholderTextColor={theme.secondaryText}
                style={[styles.input, { color: theme.text }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={{ color: theme.text }}>
                  {showPassword ? '🔒' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={() => navigation.navigate('ForgotPasswordScreen')}
            >
              <Text style={[styles.forgotPasswordText, { color: theme.text }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
            
            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                { opacity: isLoading ? 0.7 : 1 }
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
            
            {/* Sign up Link */}
            <View style={styles.signupContainer}>
              <Text style={[styles.signupText, { color: theme.text }]}>
                Don't have an account?
              </Text>
              <TouchableOpacity onPress={handleSignupPress}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  } catch (error) {
    console.error('Error rendering LoginScreen:', error);
    // Return a fallback UI
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#800020' }}>
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
          Something went wrong
        </Text>
        <Text style={{ color: 'white', marginTop: 10 }}>
          Please restart the app
        </Text>
        <Text style={{ color: 'white', fontSize: 12, marginTop: 20 }}>
          Error: {error.message}
        </Text>
      </View>
    );
  }
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
  formContainer: {
    width: '100%',
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
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: 'white',
    borderColor: '#FFFFFF',
    borderWidth: 1,
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B60000',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(255, 50, 0, 0.4)',
    paddingVertical: 12,
    borderRadius: 8,
  },
  signupText: {
    fontSize: 16,
    marginRight: 5,
  },
  signupLink: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  errorContainer: {
    width: '100%',
    marginBottom: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: '#B60000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
});

export default LoginScreen; 