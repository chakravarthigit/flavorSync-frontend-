import axios from 'axios';
import { Platform } from 'react-native';

// Get the correct base URL based on platform
const getBaseUrl = () => {
  // Using the deployed backend URL on Render
  const baseUrl = 'https://flavorsync-backend.onrender.com/api/users';
  
  // Commented out platform-specific URLs that point to localhost
  /*
  if (Platform.OS === 'android') {
    // 10.0.2.2 is the special IP for Android emulator to reach host machine
    baseUrl = 'http://10.0.2.2:5000/api/users';
  } else if (Platform.OS === 'ios') {
    // iOS simulator can use localhost directly
    baseUrl = 'http://localhost:5000/api/users';
  } else {
    // For web or physical devices, use the actual IP
    const LOCAL_IP = '192.168.55.102'; // Update this to your machine's IP
    baseUrl = `http://${LOCAL_IP}:5000/api/users`;
  }
  */
  
  console.log(`Using server URL: ${baseUrl}`);
  return baseUrl;
};

// Create axios instance with default config
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    console.log('Request headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return Promise.reject(error);
  }
);

export const updateProfile = async (userId, profileData) => {
  try {
    console.log('Starting profile update...');
    const response = await api.post('/update-profile', {
      _id: userId,
      ...profileData
    });
    console.log('Profile update completed successfully');
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out - server might be busy or unresponsive');
      throw { message: 'Update request timed out. Please try again later.' };
    }
    throw error.response?.data || { message: 'Failed to update profile' };
  }
};

export const uploadProfileImage = async (userId, imageUri) => {
  try {
    console.log('Starting image upload process...');
    console.log('Image URI:', imageUri);
    console.log('User ID:', userId);

    // Create form data
    const formData = new FormData();
    
    // Extract filename and type from URI
    let uriParts = imageUri.split('.');
    let fileType = uriParts[uriParts.length - 1];
    
    // Handle URIs with query parameters
    if (fileType.includes('?')) {
      fileType = fileType.split('?')[0];
    }
    
    // Ensure we have a valid file type
    if (!fileType.match(/jpg|jpeg|png|gif/i)) {
      fileType = 'jpeg'; // Default to jpeg if unknown format
    }
    
    // Create a unique filename to avoid caching issues
    const fileName = `profile_${userId}_${Date.now()}.${fileType}`;
    
    // Format the URI based on platform
    let formattedUri = imageUri;
    if (Platform.OS === 'ios' && imageUri.startsWith('file://')) {
      formattedUri = imageUri.replace('file://', '');
    }
    
    console.log('Preparing file with:', {
      uri: formattedUri,
      type: `image/${fileType}`,
      name: fileName
    });
    
    // Add the image file
    formData.append('image', {
      uri: formattedUri,
      type: `image/${fileType}`,
      name: fileName
    });
    
    // Add user ID
    formData.append('userId', userId);

    // Log the complete FormData contents for debugging
    console.log('FormData prepared with image and userId');
    for (let pair of formData._parts) {
      console.log(`FormData part:`, pair);
    }

    // Make the request with specific headers for file upload
    const response = await api.post('/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout for uploads
    });

    console.log('Upload response received:', response.data);
    
    // Verify the image URL is accessible
    if (response.data && response.data.imageUrl) {
      console.log('Verifying image URL is accessible:', response.data.imageUrl);
      
      // Add a cache-busting query parameter to the image URL
      const imageUrl = `${response.data.imageUrl}?t=${Date.now()}`;
      response.data.imageUrl = imageUrl;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    
    // Enhanced error logging
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Handle specific error types
    if (error.code === 'ECONNABORTED') {
      throw { message: 'Image upload timed out. Please try again later.' };
    }
    
    if (error.message && error.message.includes('Network request failed')) {
      throw { message: 'Network connection error. Please check your internet connection and try again.' };
    }
    
    throw { message: 'Failed to upload image: ' + (error.message || 'Unknown error') };
  }
}; 