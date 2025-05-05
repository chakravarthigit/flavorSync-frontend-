import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Default API base URL - Using deployed backend on Render
const API_BASE_URL = 'https://flavorsync-backend.onrender.com/api';
// const API_BASE_URL = 'http://10.0.2.2:5000/api'; // Android emulator localhost (commented out)

/**
 * Check if internet is available
 * @returns {Promise<boolean>} - Whether internet is available
 */
const isInternetAvailable = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  } catch (error) {
    console.error('Error checking internet connection:', error);
    return false;
  }
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache'
  },
  timeout: 5000, // Reduced timeout to 5 seconds
});

// Add timestamp to all GET requests to prevent caching
api.interceptors.request.use(request => {
  if (request.method === 'get') {
    // Add timestamp to URL to prevent caching
    const separator = request.url.includes('?') ? '&' : '?';
    request.url = `${request.url}${separator}_nocache=${Date.now()}`;
  }
  return request;
});

// Simplified default error handler to prevent crashes
const handleError = (error, fallbackData = []) => {
  if (error.code === 'ECONNABORTED') {
    console.error('Request timeout:', error);
  } else if (!error.response) {
    console.error('Network error:', error);
  } else {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
  }
  return fallbackData;
};

// Default restaurant data for fallbacks
const defaultRestaurants = [
  {
    id: 'default-1',
    name: 'Delhi Darbar',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop',
    rating: 4.7,
    cuisine: 'North Indian',
    price: '₹₹',
  },
  {
    id: 'default-2', 
    name: 'Andhra Spice',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&auto=format&fit=crop',
    rating: 4.6,
    cuisine: 'South Indian',
    price: '₹₹',
  }
];

// API Services
const apiService = {
  // Get nearby restaurants using Google Places API via backend
  getNearbyRestaurants: async (latitude, longitude, radius = 1500, type = 'restaurant') => {
    try {
      // Check internet connectivity first
      const isConnected = await isInternetAvailable();
      if (!isConnected) {
        console.error('No internet connection available');
        throw new Error('No internet connection available');
      }
      
      // First try to get token silently
      let token;
      try {
        token = await AsyncStorage.getItem('token');
      } catch (tokenError) {
        console.error('Error getting token:', tokenError);
        // Continue without token
      }
      
      const headers = token ? { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache' 
      } : {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      };
      
      // Add timestamp to prevent caching
      const cacheBuster = Date.now();
      
      const response = await axios.get(`${API_BASE_URL}/places/nearby`, {
        params: { latitude, longitude, radius, type, _nocache: cacheBuster },
        headers,
        timeout: 5000
      });
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      
      throw new Error('No restaurant data available');
    } catch (error) {
      console.error('Error fetching nearby restaurants:', error);
      throw error; // Don't return fallback data, throw error to handle in UI
    }
  },
  
  // Get restaurant details using Google Places API via backend
  getRestaurantDetails: async (placeId) => {
    try {
      // Check internet connectivity first
      const isConnected = await isInternetAvailable();
      if (!isConnected) {
        console.error('No internet connection available');
        throw new Error('No internet connection available');
      }
      
      // Try to get token silently
      let token;
      try {
        token = await AsyncStorage.getItem('token');
      } catch (tokenError) {
        console.error('Error getting token:', tokenError);
        // Continue without token
      }
      
      const headers = token ? { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache' 
      } : {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      };
      
      // Add timestamp to prevent caching
      const cacheBuster = Date.now();
      
      const response = await axios.get(`${API_BASE_URL}/places/details/${placeId}`, {
        params: { _nocache: cacheBuster },
        headers,
        timeout: 5000
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
      throw error; // Don't return fallback data, throw error to handle in UI
    }
  },

  // User authentication services
  login: async (email, password) => {
    try {
      // Check internet connectivity first
      const isConnected = await isInternetAvailable();
      if (!isConnected) {
        console.error('No internet connection available');
        throw new Error('No internet connection. Please check your connection and try again.');
      }
      
      console.log('Login attempt with email:', email);
      
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 400) {
          throw new Error('Invalid email or password');
        } else if (error.response.status === 404) {
          throw new Error('Login endpoint not found');
        } else if (error.response.status >= 500) {
          throw new Error('Server error. Please try again later');
        }
      }
      
      throw new Error('Cannot connect to server. Please check your internet connection.');
    }
  },

  signup: async (userData) => {
    try {
      // Check internet connectivity first
      const isConnected = await isInternetAvailable();
      if (!isConnected) {
        console.error('No internet connection available');
        throw new Error('No internet connection. Please check your connection and try again.');
      }
      
      const response = await api.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle different error cases
      if (!error.response) {
        throw new Error('Network error. Please check your connection.');
      }
      
      if (error.response.status === 409) {
        throw new Error('Email already exists. Please use a different email.');
      }
      
      throw error;
    }
  },

  // Test connection to backend
  testConnection: async () => {
    try {
      // Check internet connectivity first
      const isConnected = await isInternetAvailable();
      if (!isConnected) {
        console.error('No internet connection available');
        return { status: 'offline', message: 'No internet connection available' };
      }
      
      // Add timestamp to prevent caching
      const cacheBuster = Date.now();
      const response = await api.get(`/health?_nocache=${cacheBuster}`);
      return response.data;
    } catch (error) {
      console.error('API connection test failed:', error);
      return { status: 'offline', message: 'Could not connect to server' };
    }
  }
};

export default apiService; 