/**
 * MongoDB Service for FlavorSync
 * 
 * Handles interaction with MongoDB for user data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for the MongoDB API (replace with your actual API endpoint)
const API_BASE_URL = 'https://api.flavorsync.com';

// Default timeout for API requests (15 seconds)
const DEFAULT_TIMEOUT = 15000;

/**
 * Handles API requests with timeout and error handling
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - The response data
 */
const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeout = setTimeout(() => {
    controller.abort();
  }, DEFAULT_TIMEOUT);
  
  try {
    const response = await fetch(url, { ...options, signal });
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

/**
 * Get the authentication token from storage
 * @returns {Promise<string|null>} - The authentication token
 */
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

/**
 * User registration
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - The registration response
 */
export const registerUser = async (userData) => {
  try {
    return await fetchWithTimeout(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * User login
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - The login response with user data and token
 */
export const loginUser = async (email, password) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    // Store token in AsyncStorage
    if (response.token) {
      await AsyncStorage.setItem('userToken', response.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.user));
    }
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Get user profile
 * @returns {Promise<Object>} - The user profile data
 */
export const getUserProfile = async () => {
  try {
    // Try to get from local storage first
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      return JSON.parse(userData);
    }
    
    // If not available, fetch from API
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Update local storage
    await AsyncStorage.setItem('userData', JSON.stringify(response.user));
    
    return response.user;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {Object} profileData - The updated profile data
 * @returns {Promise<Object>} - The updated user profile
 */
export const updateUserProfile = async (profileData) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    
    // Update local storage with new user data
    await AsyncStorage.setItem('userData', JSON.stringify(response.user));
    
    return response.user;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

/**
 * Upload user profile image
 * @param {Object} imageData - The image data to upload
 * @returns {Promise<Object>} - The response with the image URL
 */
export const uploadProfileImage = async (imageData) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const formData = new FormData();
    formData.append('profileImage', {
      uri: imageData.uri,
      type: imageData.type || 'image/jpeg',
      name: imageData.fileName || 'profile.jpg',
    });
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/users/profile/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    // Update user data in local storage
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const parsedData = JSON.parse(userData);
      parsedData.profileImage = response.imageUrl;
      await AsyncStorage.setItem('userData', JSON.stringify(parsedData));
    }
    
    return response;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

/**
 * Logout user and clear local storage
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} - True if authenticated
 */
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    return !!token;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

/**
 * Save user preferences
 * @param {Object} preferences - User preferences to save
 * @returns {Promise<Object>} - The updated preferences
 */
export const saveUserPreferences = async (preferences) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      // If no token, just save locally
      await AsyncStorage.setItem('userPreferences', JSON.stringify(preferences));
      return preferences;
    }
    
    // Save to API if authenticated
    const response = await fetchWithTimeout(`${API_BASE_URL}/users/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(preferences),
    });
    
    // Update local storage
    await AsyncStorage.setItem('userPreferences', JSON.stringify(response.preferences));
    
    return response.preferences;
  } catch (error) {
    console.error('Save preferences error:', error);
    // Fall back to local storage if API fails
    await AsyncStorage.setItem('userPreferences', JSON.stringify(preferences));
    return preferences;
  }
};

/**
 * Get user preferences
 * @returns {Promise<Object>} - The user preferences
 */
export const getUserPreferences = async () => {
  try {
    // Try to get from local storage first
    const localPrefs = await AsyncStorage.getItem('userPreferences');
    if (localPrefs) {
      return JSON.parse(localPrefs);
    }
    
    // If not available and authenticated, fetch from API
    const token = await getAuthToken();
    if (token) {
      const response = await fetchWithTimeout(`${API_BASE_URL}/users/preferences`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Update local storage
      await AsyncStorage.setItem('userPreferences', JSON.stringify(response.preferences));
      
      return response.preferences;
    }
    
    // Return default preferences if not found
    return {
      theme: 'light',
      notifications: true,
      locationTracking: true,
    };
  } catch (error) {
    console.error('Get preferences error:', error);
    // Return default preferences if error
    return {
      theme: 'light',
      notifications: true,
      locationTracking: true,
    };
  }
}; 