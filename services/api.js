import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set base URL for API requests
const API_URL = 'https://flavorsync-backend.onrender.com/api'; // Using deployed backend on Render
// const API_URL = 'http://10.0.2.2:5000/api'; // Android emulator localhost (commented out)
// If using iOS simulator, use: 'http://localhost:5000/api'

// Create axios instance with default configs
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for auth token
api.interceptors.request.use(
  async (config) => {
    try {
      // Get token from AsyncStorage if available
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from AsyncStorage:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API Services
const ApiService = {
  // Auth Services
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  
  // Food Services
  getFoods: () => api.get('/food'),
  getFoodById: (id) => api.get(`/food/${id}`),
  
  // Review Services
  getReviews: (restaurantId) => api.get(`/reviews/${restaurantId}`),
  addReview: (reviewData) => api.post('/reviews', reviewData),
  
  // Restaurant Services
  getNearbyRestaurants: (lat, lng) => api.get(`/restaurants/nearby?lat=${lat}&lng=${lng}`),
  
  // Chatbot Services
  sendMessage: (message) => api.post('/chatbot', { message }),
};

export default ApiService; 