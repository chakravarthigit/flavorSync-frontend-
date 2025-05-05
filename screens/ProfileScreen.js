/**
 * Profile Screen
 * 
 * User profile screen with edit functionality for name and avatar
 */

import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Easing,
  Dimensions,
  AppState,
  PermissionsAndroid
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'react-native-image-picker';
import { AuthContext } from '../App';
import { EventEmitter } from 'events';
import { useLoading } from '../components/LoadingContext';

const { width } = Dimensions.get('window');

// Theme colors
const LIGHT_COLORS = {
  background: '#FFFFFF',
  card: '#F5F5F5',
  primary: '#B60000',
  text: '#121212',
  textSecondary: '#666666',
  border: '#DDDDDD',
  error: '#FF3B30',
  fieldBg: '#F8F8F8',
  shadow: 'rgba(0,0,0,0.1)',
  white: '#FFFFFF',
};

const DARK_COLORS = {
  background: '#121212',
  card: '#1E1E1E',
  primary: '#B60000',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  border: '#333333',
  error: '#FF3B30',
  fieldBg: '#252525',
  shadow: 'rgba(0,0,0,0.5)',
  white: '#FFFFFF',
};

// Field icons (emojis as placeholders, you can replace with actual icon components)
const FIELD_ICONS = {
  name: '👤',
  username: '@',
  email: '✉️',
  phone: '📱',
  bio: '📝',
};

// Create a global theme event emitter that can be shared across components
export const themeEmitter = new EventEmitter();

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

// Helper function to normalize image URLs
const normalizeImageUrl = (url) => {
  if (!url) return null;
  
  // Handle URLs with IP addresses or localhost
  if (url.includes('10.214.96.37') || 
      url.includes('192.168.') || 
      url.includes('localhost') || 
      url.includes('127.0.0.1')) {
    
    // Extract the path portion from the URL
    const urlParts = url.split('/');
    const pathPortion = '/' + urlParts.slice(3).join('/');
    
    // Create a new URL with the Render domain
    return `https://flavorsync-backend.onrender.com${pathPortion}`;
  }
  
  // Handle relative paths
  if (url.startsWith('/')) {
    return `https://flavorsync-backend.onrender.com${url}`;
  }
  
  // Return the original URL if it doesn't need normalization
  return url;
};

const ProfileScreen = ({ navigation }) => {
  const { isLoggedIn, setIsLoggedIn, logout } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeField, setActiveField] = useState(null);
  const [themeVersion, setThemeVersion] = useState(0); // Force re-renders on theme change
  const [imageLoadFailed, setImageLoadFailed] = useState(false); // Track image load failure
  const appState = useRef(AppState.currentState);
  
  // Animation values
  const profileOpacity = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.8)).current;
  const fieldsTranslateY = useRef(new Animated.Value(50)).current;
  const logoutButtonOpacity = useRef(new Animated.Value(0)).current;
  const editButtonScale = useRef(new Animated.Value(1)).current;
  
  // Field animation values
  const fieldAnimations = useRef({
    name: new Animated.Value(1),
    username: new Animated.Value(1),
    email: new Animated.Value(1),
    phoneNumber: new Animated.Value(1),
    bio: new Animated.Value(1)
  }).current;
  
  // Use global loading context instead of local state
  const { showLoader, hideLoader } = useLoading();
  
  // Replace the theme detection useEffect with this improved version
  useEffect(() => {
    // Function to read the theme from storage
    const loadTheme = async () => {
      try {
        const theme = await AsyncStorage.getItem('isDarkMode');
        if (theme !== null) {
          const newDarkMode = theme === 'true';
          if (isDarkMode !== newDarkMode) {
            console.log("ProfileScreen: Theme changed to:", newDarkMode ? "dark" : "light", "(from AsyncStorage)");
            setIsDarkMode(newDarkMode);
            setThemeVersion(prev => prev + 1); // Force re-render
          }
        }
      } catch (error) {
        console.error('ProfileScreen: Error loading theme:', error);
      }
    };
    
    // Load theme initially
    loadTheme();
    
    // Add direct theme change listener from event emitter
    const handleThemeChange = (newIsDarkMode) => {
      console.log("ProfileScreen: Theme change event received:", newIsDarkMode ? "dark" : "light");
      if (isDarkMode !== newIsDarkMode) {
        setIsDarkMode(newIsDarkMode);
        setThemeVersion(prev => prev + 1);
      }
    };
    
    // Subscribe to theme changes
    themeEmitter.on('themeChanged', handleThemeChange);
    
    // Also keep the regular checks as fallback
    const focusListener = navigation.addListener('focus', loadTheme);
    const checkInterval = setInterval(loadTheme, 250); // Check more frequently
    
    // Debug - print when this component mounts
    console.log("ProfileScreen: Theme synchronization set up");
    
    return () => {
      clearInterval(checkInterval);
      focusListener();
      themeEmitter.removeListener('themeChanged', handleThemeChange);
      console.log("ProfileScreen: Theme synchronization cleaned up");
    };
  }, [navigation, isDarkMode]);
  
  // Get current theme colors based on mode
  // Force recalculation when themeVersion changes
  const COLORS = React.useMemo(() => 
    isDarkMode ? DARK_COLORS : LIGHT_COLORS,
    [isDarkMode, themeVersion]
  );
  
  // Define styles inside the component, so they have access to COLORS
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    statusBarSpace: {
      height: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingBottom: 30,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    editButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 4,
    },
    editButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
    },
    profileContent: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 30,
    },
    avatarContainer: {
      marginBottom: 30,
    },
    avatarTouchable: {
      position: 'relative',
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 3,
      borderColor: '#B60000', // Using a hardcoded color
    },
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarPlaceholderText: {
      fontSize: 40,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    editAvatarOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 50,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    editAvatarText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 14,
    },
    fieldsContainer: {
      width: '100%',
    },
    fieldContainer: {
      marginBottom: 20,
      borderRadius: 12,
      padding: 15,
      overflow: 'hidden',
    },
    fieldHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    fieldIcon: {
      fontSize: 18,
      marginRight: 8,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '500',
    },
    fieldValue: {
      fontSize: 16,
      marginLeft: 28,
    },
    input: {
      height: 48,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 16,
      marginLeft: 28,
    },
    bioInput: {
      minHeight: 100,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingTop: 12,
      fontSize: 16,
      textAlignVertical: 'top',
      marginLeft: 28,
    },
    errorText: {
      color: '#FF3B30',
      marginBottom: 16,
      fontSize: 14,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 30,
    },
    cancelButton: {
      flex: 1,
      height: 50,
      borderWidth: 1,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
      backgroundColor: 'transparent',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    saveButton: {
      flex: 1,
      height: 50,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    logoutButton: {
      marginTop: 30,
      height: 50,
      width: '100%',
      borderWidth: 1,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    logoutButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    imageContainer: {
      position: 'relative',
    },
    imageLoadingIndicator: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 50,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageErrorOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 50,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageErrorText: {
      color: '#FFFFFF',
      fontSize: 18,
      marginBottom: 20,
    },
    imageErrorButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
    },
    imageRetryButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      backgroundColor: '#B60000',
      marginHorizontal: 4,
    },
    imageRetryText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    imageClearButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      backgroundColor: 'rgba(255,255,255,0.2)',
      marginHorizontal: 4,
    },
    imageClearText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
  
  // Fetch user data
  useEffect(() => {
    loadUserData();
  }, []);
  
  const loadUserData = async () => {
    try {
      // Show loader without message
      showLoader('');
      
      // First try to get data from the 'user' key which stores the authenticated user
      const userJson = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      
      if (userJson && token) {
        // We have an authenticated user
        const parsedUser = JSON.parse(userJson);
        console.log('Loaded authenticated user:', parsedUser);
        
        // Convert relative image path to full URL if needed
        let profileImage = parsedUser.profileImage;
        if (profileImage) {
          profileImage = normalizeImageUrl(profileImage);
          console.log('Normalized profile image URL:', profileImage);
        }
        
        setUser(parsedUser);
        setName(parsedUser.name || '');
        setUsername(parsedUser.username || parsedUser.email?.split('@')[0] || '');
        setEmail(parsedUser.email || '');
        setPhoneNumber(parsedUser.phoneNumber || '');
        setBio(parsedUser.bio || 'Food enthusiast using FlavorSync to discover great meals.');
        setImageUri(profileImage);
      } else {
        // Fall back to userData if no authenticated user found
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          
          // Convert relative image path to full URL if needed
          let profileImage = parsedUser.profileImage;
          if (profileImage) {
            profileImage = normalizeImageUrl(profileImage);
            console.log('Normalized profile image URL:', profileImage);
          }
          
          setUser(parsedUser);
          setName(parsedUser.name || '');
          setUsername(parsedUser.username || parsedUser.email?.split('@')[0] || '');
          setEmail(parsedUser.email || '');
          setPhoneNumber(parsedUser.phoneNumber || '');
          setBio(parsedUser.bio || 'Food enthusiast using FlavorSync to discover great meals.');
          setImageUri(profileImage);
        } else {
          // No user data at all
          setUser({ name: 'Guest User' });
          setName('Guest User');
          setUsername('guest');
          setEmail('guest@example.com');
          setPhoneNumber('');
          setBio('Food enthusiast using FlavorSync to discover great meals.');
        }
      }
      
      // Hide loader when data is loaded
      hideLoader();
      startEntryAnimations();
    } catch (error) {
      console.error('Error loading user data:', error);
      hideLoader();
    }
  };
  
  // Re-run animations when theme changes
  useEffect(() => {
    if (!user) {
      startEntryAnimations();
    }
  }, [isDarkMode, user]);
  
  // Start entry animations
  const startEntryAnimations = () => {
    // Reset animation values
    profileOpacity.setValue(0);
    avatarScale.setValue(0.8);
    fieldsTranslateY.setValue(50);
    logoutButtonOpacity.setValue(0);
    
    // Create animation sequence
    Animated.stagger(120, [
      Animated.timing(profileOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(avatarScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fieldsTranslateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(logoutButtonOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Animate fields one by one
    Object.keys(fieldAnimations).forEach((field, index) => {
      Animated.sequence([
        Animated.delay(600 + (index * 100)),
        Animated.spring(fieldAnimations[field], {
          toValue: 1.05,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(fieldAnimations[field], {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    });
  };
  
  // Handle field focus animation
  const handleFieldFocus = (fieldName) => {
    setActiveField(fieldName);
    Animated.spring(fieldAnimations[fieldName], {
      toValue: 1.03,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  // Handle field blur animation
  const handleFieldBlur = (fieldName) => {
    setActiveField(null);
    Animated.spring(fieldAnimations[fieldName], {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  // Edit button press animation
  const onEditButtonPressIn = () => {
    Animated.spring(editButtonScale, {
      toValue: 0.95,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };
  
  const onEditButtonPressOut = () => {
    Animated.spring(editButtonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  // Replace the image picker function with a simpler implementation with options
  const handleImagePick = () => {
    // Give the user a choice between camera and gallery
    Alert.alert(
      "Select Image Source",
      "Choose where to select your profile picture from",
      [
        {
          text: "Camera",
          onPress: () => openCamera()
        },
        {
          text: "Gallery",
          onPress: () => openGallery()
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  // Simple function to open camera
  const openCamera = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      maxHeight: 800,
      maxWidth: 800,
      quality: 0.7,
    };

    ImagePicker.launchCamera(options, handleImageResponse);
  };

  // Simple function to open gallery
  const openGallery = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      maxHeight: 800,
      maxWidth: 800,
      quality: 0.7,
    };

    ImagePicker.launchImageLibrary(options, handleImageResponse);
  };

  // Common handler function for both camera and gallery responses
  const handleImageResponse = (response) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
      return;
    }
    
    if (response.errorCode) {
      console.log('ImagePicker Error:', response.errorCode, response.errorMessage);
      Alert.alert('Error', `Failed to pick image: ${response.errorMessage}`);
      return;
    }
    
    if (!response.assets || response.assets.length === 0) {
      console.log('No image selected');
      return;
    }
    
    const selectedImage = response.assets[0];
    console.log('Image selected, uri:', selectedImage.uri);
    
    // Update UI with selected image
    setImageUri(selectedImage.uri);
    setIsUploading(true);
    
    // Create image data object for later upload
    const imageData = {
      uri: selectedImage.uri,
      type: selectedImage.type || 'image/jpeg',
      name: selectedImage.fileName || 'profile.jpg',
      base64: selectedImage.base64
    };
    
    // Store image data for profile save
    setUser(prevUser => ({
      ...prevUser,
      imageData: imageData
    }));
    
    // Show upload activity for a moment
    setTimeout(() => {
      setIsUploading(false);
    }, 1000);
  };

  // Modify the uploadImageToServer function to better handle MongoDB uploads
  const uploadImageToServer = async (imageData, userId) => {
    try {
      console.log('Starting image upload to MongoDB server, user ID:', userId);
      
      // Create form data for the image upload
      const formData = new FormData();
      
      // Add user ID to form data
      formData.append('userId', userId);
      
      // Create proper file object with correct structure for React Native
      const fileToUpload = {
        uri: imageData.uri,
        type: imageData.type || 'image/jpeg',
        name: imageData.fileName || `profile_${userId}.jpg`,
      };
      
      // Log file details for debugging
      console.log('Preparing image upload:', fileToUpload.name, 'type:', fileToUpload.type);
      
      // Append file with 'image' field name - must match what server expects
      formData.append('image', fileToUpload);
      
      // Use the deployed backend URL on Render instead of local IP
      const serverUrl = 'https://flavorsync-backend.onrender.com';
      const uploadUrl = `${serverUrl}/api/users/upload-image`;
      console.log('Sending image to server at:', uploadUrl);
      
      // Show loading state
      setIsUploading(true);
      
      // Send the request to the server - do NOT set Content-Type header for multipart/form-data
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        timeout: 30000 // 30 second timeout
      });
      
      // Check for HTTP error status
      if (!response.ok) {
        const statusText = response.statusText || '';
        throw new Error(`Server error: ${response.status} ${statusText}`);
      }
      
      // Get response text for debugging
      const responseText = await response.text();
      console.log('Server response text:', responseText.substring(0, 150) + '...');
      
      // Try to parse as JSON if possible
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Upload response status:', data.mongoStatus || 'unknown');
      } catch (e) {
        console.log('Server response was not JSON:', e.message);
        throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}...`);
      }
      
      // Check for image URL in the response
      const imageUrl = data.imageUrl || data.url || data.image || data.path;
      
      if (!imageUrl) {
        console.warn('No image URL in server response, falling back to local URI');
        return imageData.uri;
      }
      
      // Fix any URL with incorrect domain
      let fullImageUrl = imageUrl;
      
      // Check if the URL contains an IP address or localhost and replace it
      if (fullImageUrl.includes('10.214.96.37') || 
          fullImageUrl.includes('192.168.') || 
          fullImageUrl.includes('localhost') || 
          fullImageUrl.includes('127.0.0.1')) {
        
        // Extract the path portion from the URL
        const urlParts = fullImageUrl.split('/');
        const pathPortion = '/' + urlParts.slice(3).join('/');
        
        // Create a new URL with the Render domain
        fullImageUrl = `https://flavorsync-backend.onrender.com${pathPortion}`;
        console.log('Replaced server IP with Render domain:', fullImageUrl);
      }
      // Handle relative paths
      else if (fullImageUrl.startsWith('/')) {
        fullImageUrl = `https://flavorsync-backend.onrender.com${fullImageUrl}`;
        console.log('Converting relative image path to full URL:', fullImageUrl);
      }
      
      console.log('Successfully uploaded image, URL (fixed):', fullImageUrl);
      return fullImageUrl;
    } catch (error) {
      console.error('Error uploading image to server:', error.message);
      
      // Return the local URI as fallback
      if (imageData && imageData.uri) {
        console.log('Using local image URI as fallback');
        return imageData.uri;
      }
      
      // Rethrow the error to let the caller handle it
      throw new Error(`Failed to upload image to server: ${error.message}`);
    } finally {
      // Hide loading state
      setIsUploading(false);
    }
  };

  // Update the handleSaveProfile function to use the correct server URL
  const handleSaveProfile = async () => {
    try {
      setSaveError(null);
      setIsUploading(true); // Show loading state
      
      // Validate required fields
      if (!name.trim()) {
        setSaveError('Name cannot be empty');
        setIsUploading(false);
        return;
      }
      
      if (!username.trim()) {
        setSaveError('Username cannot be empty');
        setIsUploading(false);
        return;
      }
      
      if (!email.trim()) {
        setSaveError('Email cannot be empty');
        setIsUploading(false);
        return;
      }
      
      let profileImageUrl = user.profileImage;
      
      // Fix any existing image URL with incorrect domain
      if (profileImageUrl) {
        profileImageUrl = normalizeImageUrl(profileImageUrl);
        console.log('Normalized existing profile image URL:', profileImageUrl);
      }
      
      // If we have new image data, upload it to server
      if (user.imageData && !user.imageData.uploaded) {
        try {
          // Get user ID from stored data
          const userJson = await AsyncStorage.getItem('user');
          const userData = JSON.parse(userJson);
          // Check for both id and _id fields
          const userId = userData?.id || userData?._id || 'local-user';
          
          console.log('Uploading profile image to MongoDB for user:', userId);
          
          // Upload image to MongoDB server and get back the URL
          profileImageUrl = await uploadImageToServer(user.imageData, userId);
          
          // Mark image as uploaded to prevent multiple uploads
          setUser(prevUser => ({
            ...prevUser,
            imageData: { ...prevUser.imageData, uploaded: true }
          }));
          
          // Check if the image was successfully uploaded to MongoDB (not base64 or local URI)
          const isImageURL = profileImageUrl && (
            profileImageUrl.startsWith('http://') || 
            profileImageUrl.startsWith('https://') ||
            profileImageUrl.startsWith('/uploads/') // Also accept relative paths from the server
          );
          
          if (isImageURL) {
            // Normalize the URL regardless of format
            profileImageUrl = normalizeImageUrl(profileImageUrl);
            console.log('Normalized uploaded image URL:', profileImageUrl);
          } else {
            console.warn('Image not saved to MongoDB server, using local image instead');
          }
        } catch (imageError) {
          console.error('Error uploading image to MongoDB:', imageError);
          setSaveError('Could not upload image to server, but will continue updating profile.');
        }
      }
      
      // Ensure profileImageUrl is a full URL before saving
      if (profileImageUrl) {
        profileImageUrl = normalizeImageUrl(profileImageUrl);
        console.log('Final normalized image URL for profile:', profileImageUrl);
      }
      
      const updatedUser = { 
        ...user, 
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        bio: bio.trim(),
        profileImage: profileImageUrl || imageUri,
        lastUpdated: new Date().toISOString()
      };
      
      // Remove temporary image data
      delete updatedUser.imageData;
      
      // Send profile update to server with updated image URL
      const token = await AsyncStorage.getItem('token');
      
      // Use either id or _id, ensuring we're using the right field for MongoDB
      // Normalize the ID field - the server expects _id
      const userId = updatedUser.id || updatedUser._id;
      if (userId) {
        // Make sure _id is set correctly for the server
        updatedUser._id = userId;
      }
      
      console.log('Sending profile update to MongoDB server for user ID:', userId);
      
      try {
        // Make sure we have a valid ID before attempting server update
        if (!userId || userId === 'local-user') {
          throw new Error('No valid user ID available for server update');
        }
        
        // Use environment variable for server URL or fallback to development machine IP
        const serverUrl = 'https://flavorsync-backend.onrender.com';
        const response = await fetch(`${serverUrl}/api/users/update-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(updatedUser),
          timeout: 30000 // 30 second timeout
        });
        
        if (!response.ok) {
          // If we get an error status code, throw error
          const errorText = await response.text();
          throw new Error(`Server error (${response.status}): ${errorText}`);
        }
        
        // Get response text first to handle any response format
        const responseText = await response.text();
        let responseData;
        
        try {
          // Try to parse as JSON
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          console.warn('Server response was not JSON:', parseError);
          responseData = { success: true }; // Assume success if we can't parse
        }
        
        // Update local storage with new user data
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update state with new user data
        setUser(updatedUser);
        setImageUri(profileImageUrl || imageUri);
        setIsEditing(false); // Exit editing mode after successful save
        
        // Show success message
        setSaveError(null);
        Alert.alert('Success', 'Profile updated successfully');
        
        // Re-trigger animations when returning to view mode
        startEntryAnimations();
        
      } catch (serverError) {
        console.error('Server update error:', serverError);
        setSaveError('Failed to update profile on server. Please try again later.');
      }
      
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError(error.message || 'An unexpected error occurred while saving your profile');
    } finally {
      setIsUploading(false); // Hide loading state
    }
  };
  
  // Cancel editing and revert changes
  const handleCancelEdit = () => {
    // Reset to saved values
    setName(user?.name || '');
    setUsername(user?.username || '');
    setEmail(user?.email || '');
    setPhoneNumber(user?.phoneNumber || '');
    setBio(user?.bio || 'Food enthusiast using FlavorSync to discover great meals.');
    setImageUri(user?.profileImage || null);
    setIsEditing(false);
    setSaveError(null);
    
    // Re-trigger animations when returning to view mode
    startEntryAnimations();
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      // First show confirmation dialog
      Alert.alert(
        'Confirm Logout',
        'Are you sure you want to log out?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Logout',
            onPress: async () => {
              try {
                // Show loader
                showLoader('Logging out...');
                
                // Perform logout action
                await logout();
                
                // Hide loader
                hideLoader();
                
                // Don't manually navigate - let conditional rendering handle it
                // The navigation will automatically update when isLoggedIn changes
              } catch (error) {
                console.error('Error during logout process:', error);
                hideLoader(true);
                Alert.alert('Error', 'An unexpected error occurred. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error showing logout dialog:', error);
    }
  };
  
  // Check theme debugging
  const checkCurrentTheme = async () => {
    try {
      const theme = await AsyncStorage.getItem('isDarkMode');
      console.log('Current theme from AsyncStorage:', theme);
      Alert.alert('Theme Check', `Current theme is: ${theme === 'true' ? 'Dark' : 'Light'}`);
    } catch (error) {
      console.error('Error checking theme:', error);
    }
  };
  
  // Animated styles
  const profileContentStyle = {
    opacity: profileOpacity,
  };
  
  const avatarStyle = {
    transform: [{ scale: avatarScale }],
  };
  
  const fieldsContainerStyle = {
    opacity: profileOpacity,
    transform: [{ translateY: fieldsTranslateY }],
  };
  
  const logoutButtonStyle = {
    opacity: logoutButtonOpacity,
  };
  
  const editButtonStyle = {
    transform: [{ scale: editButtonScale }],
  };
  
  // Get field animation style
  const getFieldStyle = (fieldName) => {
    return {
      transform: [{ scale: fieldAnimations[fieldName] }],
      shadowOpacity: fieldAnimations[fieldName].interpolate({
        inputRange: [1, 1.03],
        outputRange: [0, 0.2]
      }),
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: activeField === fieldName ? 5 : 0,
      backgroundColor: activeField === fieldName 
        ? isDarkMode ? '#2A2A2A' : '#FFFFFF'
        : isEditing 
          ? COLORS.fieldBg
          : 'transparent',
    };
  };

  // Add a function to reload user data
  const reloadUserData = async () => {
    try {
      // Show loader
      showLoader('Refreshing...');
      
      // Clear AsyncStorage cache for this user
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const parsedUser = JSON.parse(userJson);
        
        // If the profile image exists, normalize it
        if (parsedUser.profileImage) {
          const normalizedUrl = normalizeImageUrl(parsedUser.profileImage);
          
          // Only update if the URL changed
          if (normalizedUrl !== parsedUser.profileImage) {
            parsedUser.profileImage = normalizedUrl;
            
            // Save the fixed user data back
            await AsyncStorage.setItem('user', JSON.stringify(parsedUser));
            console.log('Fixed and saved user data with normalized image URL:', normalizedUrl);
          }
        }
      }
      
      // Reload user data
      await loadUserData();
      
      // Hide loader after a brief delay
      setTimeout(() => {
        hideLoader();
      }, 500);
      
      // Show success message
      Alert.alert('Success', 'Profile refreshed successfully');
    } catch (error) {
      console.error('Error reloading user data:', error);
      hideLoader();
      Alert.alert('Error', 'Failed to refresh profile. Please try again.');
    }
  };

  // Add a function to clear image cache
  const clearImageCache = async () => {
    try {
      // Show loader
      showLoader('Clearing image cache...');
      
      // Get stored user
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const parsedUser = JSON.parse(userJson);
        
        if (parsedUser.profileImage) {
          // Create a modified version with a timestamp to force reload
          const timestamp = new Date().getTime();
          let newImageUrl = normalizeImageUrl(parsedUser.profileImage);
          
          // Add timestamp parameter to break cache
          newImageUrl = newImageUrl.includes('?') 
            ? `${newImageUrl}&t=${timestamp}` 
            : `${newImageUrl}?t=${timestamp}`;
            
          // Update user data
          parsedUser.profileImage = newImageUrl;
          await AsyncStorage.setItem('user', JSON.stringify(parsedUser));
          
          // Update state
          setImageUri(newImageUrl);
          setUser(prevUser => ({...prevUser, profileImage: newImageUrl}));
          
          console.log('Image cache cleared with new URL:', newImageUrl);
        }
      }
      
      // Hide loader
      setTimeout(() => {
        hideLoader();
        Alert.alert('Success', 'Image cache cleared. Try reloading the profile again.');
      }, 500);
    } catch (error) {
      console.error('Error clearing image cache:', error);
      hideLoader();
      Alert.alert('Error', 'Failed to clear image cache. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={COLORS.background} />
      
      {/* Fixed header at the top */}
      <View style={[styles.statusBarSpace, { backgroundColor: COLORS.background }]} />
      
      <View style={[styles.header, { 
        backgroundColor: COLORS.background,
        borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      }]}>
        <Text style={[styles.headerTitle, { color: COLORS.text }]}>
          {isEditing ? 'Edit Profile' : 'My Profile'}
        </Text>
        
        {!isEditing ? (
          <View style={{ flexDirection: 'row' }}>
            <Animated.View style={editButtonStyle}>
              <TouchableOpacity 
                style={[styles.editButton, { backgroundColor: COLORS.primary }]}
                onPress={() => setIsEditing(true)}
                onPressIn={onEditButtonPressIn}
                onPressOut={onEditButtonPressOut}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: COLORS.background }]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.profileContent, profileContentStyle]}>
            <Animated.View style={[styles.avatarContainer, avatarStyle]}>
              <TouchableOpacity 
                style={styles.avatarTouchable}
                onPress={isEditing ? handleImagePick : null}
                activeOpacity={isEditing ? 0.7 : 1}
              >
                {imageUri ? (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ 
                        uri: imageUri ? normalizeImageUrl(imageUri) : null
                      }}
                      style={styles.avatar}
                    />
                    {isUploading && (
                      <ActivityIndicator 
                        size="large" 
                        color="#FFFFFF"
                        style={styles.imageLoadingIndicator} 
                      />
                    )}
                  </View>
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: '#B60000' }]}>
                    <Text style={styles.avatarPlaceholderText}>
                      {name ? name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
                
                {isEditing && (
                  <View style={styles.editAvatarOverlay}>
                    {isUploading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.editAvatarText}>
                        {imageUri ? 'Change' : 'Add'}
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View style={[styles.fieldsContainer, fieldsContainerStyle]}>
              {/* Name Field */}
              <Animated.View 
                style={[
                  styles.fieldContainer, 
                  getFieldStyle('name')
                ]}
              >
                <View style={styles.fieldHeader}>
                  <Text style={styles.fieldIcon}>{FIELD_ICONS.name}</Text>
                  <Text style={[styles.fieldLabel, { color: COLORS.textSecondary }]}>Name</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, { 
                      color: COLORS.text, 
                      borderColor: activeField === 'name' ? COLORS.primary : COLORS.border
                    }]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    placeholderTextColor={COLORS.textSecondary}
                    selectionColor={COLORS.primary}
                    onFocus={() => handleFieldFocus('name')}
                    onBlur={() => handleFieldBlur('name')}
                  />
                ) : (
                  <Text style={[styles.fieldValue, { color: COLORS.text }]}>{name || 'Not set'}</Text>
                )}
              </Animated.View>
              
              {/* Username Field */}
              <Animated.View 
                style={[
                  styles.fieldContainer, 
                  getFieldStyle('username')
                ]}
              >
                <View style={styles.fieldHeader}>
                  <Text style={styles.fieldIcon}>{FIELD_ICONS.username}</Text>
                  <Text style={[styles.fieldLabel, { color: COLORS.textSecondary }]}>Username</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, { 
                      color: COLORS.text, 
                      borderColor: activeField === 'username' ? COLORS.primary : COLORS.border
                    }]}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter your username"
                    placeholderTextColor={COLORS.textSecondary}
                    selectionColor={COLORS.primary}
                    onFocus={() => handleFieldFocus('username')}
                    onBlur={() => handleFieldBlur('username')}
                  />
                ) : (
                  <Text style={[styles.fieldValue, { color: COLORS.text }]}>{username || 'Not set'}</Text>
                )}
              </Animated.View>
              
              {/* Email Field */}
              <Animated.View 
                style={[
                  styles.fieldContainer, 
                  getFieldStyle('email')
                ]}
              >
                <View style={styles.fieldHeader}>
                  <Text style={styles.fieldIcon}>{FIELD_ICONS.email}</Text>
                  <Text style={[styles.fieldLabel, { color: COLORS.textSecondary }]}>Email</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, { 
                      color: COLORS.text, 
                      borderColor: activeField === 'email' ? COLORS.primary : COLORS.border
                    }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    selectionColor={COLORS.primary}
                    onFocus={() => handleFieldFocus('email')}
                    onBlur={() => handleFieldBlur('email')}
                  />
                ) : (
                  <Text style={[styles.fieldValue, { color: COLORS.text }]}>{email || 'Not set'}</Text>
                )}
              </Animated.View>
              
              {/* Phone Number Field */}
              <Animated.View 
                style={[
                  styles.fieldContainer, 
                  getFieldStyle('phoneNumber')
                ]}
              >
                <View style={styles.fieldHeader}>
                  <Text style={styles.fieldIcon}>{FIELD_ICONS.phone}</Text>
                  <Text style={[styles.fieldLabel, { color: COLORS.textSecondary }]}>Phone Number</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, { 
                      color: COLORS.text, 
                      borderColor: activeField === 'phoneNumber' ? COLORS.primary : COLORS.border
                    }]}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Enter your phone number"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="phone-pad"
                    selectionColor={COLORS.primary}
                    onFocus={() => handleFieldFocus('phoneNumber')}
                    onBlur={() => handleFieldBlur('phoneNumber')}
                  />
                ) : (
                  <Text style={[styles.fieldValue, { color: COLORS.text }]}>
                    {phoneNumber || 'Not set'}
                  </Text>
                )}
              </Animated.View>
              
              {/* Bio Field */}
              <Animated.View 
                style={[
                  styles.fieldContainer, 
                  getFieldStyle('bio')
                ]}
              >
                <View style={styles.fieldHeader}>
                  <Text style={styles.fieldIcon}>{FIELD_ICONS.bio}</Text>
                  <Text style={[styles.fieldLabel, { color: COLORS.textSecondary }]}>Bio</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    style={[styles.bioInput, { 
                      color: COLORS.text, 
                      borderColor: activeField === 'bio' ? COLORS.primary : COLORS.border
                    }]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell us about yourself"
                    placeholderTextColor={COLORS.textSecondary}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    selectionColor={COLORS.primary}
                    onFocus={() => handleFieldFocus('bio')}
                    onBlur={() => handleFieldBlur('bio')}
                  />
                ) : (
                  <Text style={[styles.fieldValue, { color: COLORS.text }]}>{bio || 'Not set'}</Text>
                )}
              </Animated.View>
              
              {/* Error Message */}
              {saveError && (
                <Text style={styles.errorText}>{saveError}</Text>
              )}
              
              {/* Action Buttons */}
              {isEditing ? (
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.cancelButton, { borderColor: COLORS.primary }]}
                    onPress={handleCancelEdit}
                  >
                    <Text style={[styles.cancelButtonText, { color: COLORS.primary }]}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.saveButton, { backgroundColor: COLORS.primary }]}
                    onPress={handleSaveProfile}
                  >
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Animated.View style={logoutButtonStyle}>
                  <TouchableOpacity 
                    style={[styles.logoutButton, { borderColor: COLORS.primary }]}
                    onPress={handleLogout}
                  >
                    <Text style={[styles.logoutButtonText, { color: COLORS.primary }]}>Logout</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ProfileScreen; 