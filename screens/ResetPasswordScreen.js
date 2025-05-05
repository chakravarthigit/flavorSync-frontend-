import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../App';
import { COLORS } from '../constants/colors';
import { useLoading } from '../components/LoadingContext';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

// Define colors for the gradient background
const GRADIENT_COLORS = {
  gradientStart: '#400F0F', // Dark maroon
  gradientMiddle: '#B60000', // Brand red
  gradientEnd: '#FF4D00', // Orange
};

const ResetPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  
  const { isDarkMode } = useContext(ThemeContext);
  const navigation = useNavigation();
  const route = useRoute();
  const { showLoader, hideLoader } = useLoading();
  
  // Get email from route params
  const routeEmail = route.params?.email;
  
  // Set email from route params if available
  React.useEffect(() => {
    if (routeEmail) {
      setEmail(routeEmail);
    }
  }, [routeEmail]);

  // Theme based styles - always white text for gradient background
  const theme = {
    text: COLORS.white, // Always white for better contrast against gradient
    secondaryText: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white for secondary text
    card: 'rgba(255, 255, 255, 0.15)', // Translucent white for input fields
    border: 'rgba(255, 255, 255, 0.3)', // Translucent white for borders
  };

  const handleVerifyOtp = async () => {
    // Validate inputs
    if (!email || email.trim() === '') {
      setMessage('Email is missing. Please go back to Forgot Password screen.');
      setMessageType('error');
      return;
    }

    if (!otp || otp.trim() === '') {
      setMessage('Please enter the OTP sent to your email');
      setMessageType('error');
      return;
    }

    setIsVerifyingOtp(true);
    showLoader('Verifying OTP...');

    try {
      // Try different API endpoints
      const apiBaseUrls = [
        'https://flavorsync-backend.onrender.com/api',
        // Only try local endpoints when in development
        ...(process.env.NODE_ENV === 'development' ? ['http://10.0.2.2:5000/api', 'http://localhost:5000/api'] : [])
      ];

      let success = false;
      let lastError = '';

      for (const baseUrl of apiBaseUrls) {
        try {
          const response = await fetch(`${baseUrl}/auth/validate-otp`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, otp }),
          });

          const data = await response.json();
          
          if (response.ok && data.valid) {
            success = true;
            setOtpVerified(true);
            setMessage('OTP verified successfully. Please set your new password.');
            setMessageType('success');
            break;
          } else {
            lastError = data.msg || 'OTP validation failed';
          }
        } catch (err) {
          console.error(`Error with ${baseUrl}:`, err);
          // Continue to next API URL
        }
      }

      if (!success) {
        setMessage(lastError || 'Invalid or expired OTP');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred while verifying the OTP');
      setMessageType('error');
    } finally {
      setIsVerifyingOtp(false);
      hideLoader();
    }
  };

  const handleResetPassword = async () => {
    // Validate passwords
    if (!password || password.trim() === '') {
      setMessage('Please enter a new password');
      setMessageType('error');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setMessageType('error');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    showLoader('Resetting your password...');

    try {
      // Try different API endpoints
      const apiBaseUrls = [
        'https://flavorsync-backend.onrender.com/api',
        // Only try local endpoints when in development
        ...(process.env.NODE_ENV === 'development' ? ['http://10.0.2.2:5000/api', 'http://localhost:5000/api'] : [])
      ];

      let success = false;
      let lastError = '';

      for (const baseUrl of apiBaseUrls) {
        try {
          const response = await fetch(`${baseUrl}/auth/reset-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, otp, password }),
          });

          const data = await response.json();
          
          if (response.ok) {
            success = true;
            setMessage(data.msg || 'Your password has been reset successfully');
            setMessageType('success');
            
            // Navigate to login after successful reset with a delay using reset
            setTimeout(() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'LoginScreen' }]
              });
            }, 2000);
            
            break;
          } else {
            lastError = data.msg || 'An error occurred';
          }
        } catch (err) {
          console.error(`Error with ${baseUrl}:`, err);
          // Continue to next API URL
        }
      }

      if (!success) {
        setMessage(lastError || 'Password reset failed');
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

  // Render different content based on OTP verification
  const renderContent = () => {
    if (!otpVerified) {
      return (
        <View style={styles.formContainer}>
          {message ? (
            <View style={[
              styles.messageContainer, 
              { backgroundColor: messageType === 'success' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)' }
            ]}>
              <Text style={[
                styles.messageText, 
                { color: COLORS.white }
              ]}>
                {message}
              </Text>
            </View>
          ) : null}

          {/* Email Display (not editable) */}
          <View style={[styles.infoContainer, { borderColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.secondaryText }]}>Email:</Text>
            <Text style={[styles.infoValue, { color: COLORS.white }]}>{email}</Text>
          </View>

          {/* OTP Input */}
          <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TextInput
              placeholder="Enter OTP from email"
              placeholderTextColor={theme.secondaryText}
              style={[styles.input, { color: COLORS.white }]}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              editable={!isVerifyingOtp}
            />
          </View>

          {/* Verify OTP Button */}
          <TouchableOpacity
            style={[
              styles.button,
              isVerifyingOtp ? styles.buttonDisabled : null,
            ]}
            onPress={handleVerifyOtp}
            disabled={isVerifyingOtp}
          >
            {isVerifyingOtp ? (
              <ActivityIndicator color="#B60000" size="small" />
            ) : (
              <Text style={styles.buttonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>

          {/* Resend OTP Link */}
          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => navigation.navigate('ForgotPasswordScreen', { email })}
          >
            <Text style={[styles.linkText, { color: COLORS.white }]}>
              Resend OTP
            </Text>
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
      );
    }

    return (
      <View style={styles.formContainer}>
        {message ? (
          <View style={[
            styles.messageContainer, 
            { backgroundColor: messageType === 'success' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)' }
          ]}>
            <Text style={[
              styles.messageText, 
              { color: COLORS.white }
            ]}>
              {message}
            </Text>
          </View>
        ) : null}

        {/* New Password Input */}
        <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TextInput
            placeholder="New Password"
            placeholderTextColor={theme.secondaryText}
            style={[styles.input, { color: COLORS.white }]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!isSubmitting}
          />
          <TouchableOpacity
            style={styles.passwordVisibility}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={{ color: theme.secondaryText, fontWeight: 'bold' }}>
              {showPassword ? 'HIDE' : 'SHOW'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Confirm Password Input */}
        <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor={theme.secondaryText}
            style={[styles.input, { color: COLORS.white }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            editable={!isSubmitting}
          />
          <TouchableOpacity
            style={styles.passwordVisibility}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Text style={{ color: theme.secondaryText, fontWeight: 'bold' }}>
              {showConfirmPassword ? 'HIDE' : 'SHOW'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reset Password Button */}
        <TouchableOpacity
          style={[
            styles.button,
            isSubmitting ? styles.buttonDisabled : null,
          ]}
          onPress={handleResetPassword}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#B60000" size="small" />
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </TouchableOpacity>
      </View>
    );
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
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            {!otpVerified 
              ? `Enter the OTP sent to ${email}`
              : 'Create a new password for your account.'
            }
          </Text>

          {renderContent()}
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
  contentContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 25,
    lineHeight: 24,
    textAlign: 'center',
  },
  formContainer: {
    marginTop: 20,
  },
  inputContainer: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  input: {
    height: 50,
    flex: 1,
    fontSize: 16,
  },
  passwordVisibility: {
    padding: 10,
  },
  button: {
    backgroundColor: '#FFFFFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#B60000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  messageContainer: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  messageText: {
    fontSize: 14,
    textAlign: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 12,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  infoValue: {
    fontSize: 16,
    flex: 1,
  },
});

export default ResetPasswordScreen; 