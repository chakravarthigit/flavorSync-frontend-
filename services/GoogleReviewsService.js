import NetInfo from '@react-native-community/netinfo';

// API key - this should ideally be in an environment variable
const API_KEY = 'AIzaSyAPjVz-Cm8F28FPIEOPLVrhO27dqI_9z1M';

/**
 * Service for fetching data from Google Places API
 */

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

/**
 * Get nearby restaurants based on location and search parameters
 * @param {Object} location - User's location (latitude, longitude)
 * @param {String} keyword - Search keyword (optional)
 * @param {Number} radius - Search radius in meters (optional)
 * @returns {Promise<Array>} - Array of restaurant objects
 */
export const getNearbyRestaurants = async (location, keyword = '', radius = 1500) => {
  try {
    // First check if internet is available
    const internetAvailable = await isInternetAvailable();
    if (!internetAvailable) {
      console.error('No internet connection available');
      return [];
    }
    
    // Validate inputs
    if (!location || !location.latitude || !location.longitude) {
      console.error('Invalid location provided:', location);
      return []; // Return empty array instead of throwing
    }
    
    // Add cache-busting parameter to prevent any browser/system caching
    const cacheBuster = `_nocache=${Date.now()}`;
    
    // API key should ideally be stored in a more secure way
    const apiKey = 'AIzaSyAPjVz-Cm8F28FPIEOPLVrhO27dqI_9z1M';
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=${radius}${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''}&type=restaurant&key=${apiKey}&${cacheBuster}`;
    
    console.log(`Fetching nearby restaurants: ${keyword ? keyword : 'all'}`);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        return []; // Return empty array instead of throwing
      }
      
      const data = await response.json();
      
      // ZERO_RESULTS is a valid response, not an error
      if (data.status === 'ZERO_RESULTS') {
        console.log('No restaurants found');
        return [];
      }
      
      // For other non-OK responses, log but don't crash
      if (data.status !== 'OK') {
        console.error('Google Places API error:', data.status, data.error_message || 'Unknown error');
        return [];
      }
      
      return data.results;
    } catch (fetchError) {
      console.error('Fetch error in getNearbyRestaurants:', fetchError);
      if (fetchError.name === 'AbortError') {
        console.error('Request timed out');
      }
      return [];
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Error in getNearbyRestaurants:', error);
    return []; // Return empty array instead of throwing
  }
};

/**
 * Get detailed information about a specific restaurant
 * @param {String} placeId - Google Place ID
 * @returns {Promise<Object>} - Restaurant details object
 */
export const getRestaurantDetails = async (placeId) => {
  try {
    // First check if internet is available
    const internetAvailable = await isInternetAvailable();
    if (!internetAvailable) {
      console.error('No internet connection available');
      return null;
    }
    
    if (!placeId) {
      console.error('No place ID provided');
      return null; // Return null instead of throwing
    }
    
    // Add cache-busting parameter
    const cacheBuster = `_nocache=${Date.now()}`;
    
    const apiKey = 'AIzaSyAPjVz-Cm8F28FPIEOPLVrhO27dqI_9z1M';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,formatted_phone_number,opening_hours,photos,website,price_level,reviews,geometry&key=${apiKey}&${cacheBuster}`;
    
    console.log(`Fetching details for place ID: ${placeId}`);
    
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        return null; // Return null instead of throwing
      }
      
      const data = await response.json();
      
      if (data.status === 'NOT_FOUND') {
        console.log('Restaurant details not found');
        return null;
      }
      
      if (data.status !== 'OK') {
        console.error('Google Places API error:', data.status, data.error_message || 'Unknown error');
        return null;
      }
      
      return data.result;
    } catch (fetchError) {
      console.error('Fetch error in getRestaurantDetails:', fetchError);
      if (fetchError.name === 'AbortError') {
        console.error('Request timed out');
      }
      return null;
    }
  } catch (error) {
    console.error('Error in getRestaurantDetails:', error);
    return null; // Return null instead of throwing
  }
};

/**
 * Generate a photo URL from a photo reference
 * @param {String} photoReference - Google photo reference
 * @param {Number} maxWidth - Maximum width of the photo
 * @returns {String} - URL to the photo
 */
export const getPhotoUrl = (photoReference, maxWidth = 400) => {
  try {
    if (!photoReference) {
      return null;
    }
    
    const apiKey = 'AIzaSyAPjVz-Cm8F28FPIEOPLVrhO27dqI_9z1M';
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${apiKey}`;
  } catch (error) {
    console.error('Error generating photo URL:', error);
    return null;
  }
};

/**
 * Find the most relevant reviews for a specific food item
 * @param {Array} reviews - Array of reviews
 * @param {string} foodName - Name of the food to find in reviews
 * @returns {Array} - Filtered and sorted reviews mentioning the food
 */
export const findRelevantReviews = (reviews, foodName) => {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return [];
  }
  
  // Keywords related to the food
  const keywords = foodName.toLowerCase().split(' ');
  
  // Filter reviews that mention the food or related keywords
  const relevantReviews = reviews.filter(review => {
    if (!review.text) return false;
    
    const reviewText = review.text.toLowerCase();
    return keywords.some(keyword => 
      keyword.length > 3 && reviewText.includes(keyword)
    );
  });
  
  // Sort by rating (highest first) and recency
  return relevantReviews.sort((a, b) => {
    // Prioritize higher ratings
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }
    
    // If ratings are the same, prioritize more recent reviews
    return b.time - a.time;
  });
}; 