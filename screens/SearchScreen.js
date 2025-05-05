import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Alert,
  Animated,
  Easing,
  FlatList,
  Platform,
  TouchableWithoutFeedback,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { startTransition } from 'react';
import LocationService from '../services/LocationService';
import { themeEmitter } from './ProfileScreen';
import Fuse from 'fuse.js';

// Define the app theme colors
const COLORS = {
  background: '#FFFFFF',
  backgroundDark: '#121212',
  primary: '#B60000',
  primaryLight: '#CC4D4D',
  primaryDark: '#B60000',
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
};

const FONTS = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
};

// Google Places API Key
const GOOGLE_PLACES_API_KEY = "AIzaSyAPjVz-Cm8F28FPIEOPLVrhO27dqI_9z1M";

// Constants for OpenRouter API
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = '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';

// Sample restaurant data for fallback
const SAMPLE_RESTAURANTS = [
  {
    id: '1',
    name: 'Tasty Bites Restaurant',
    cuisine: 'Italian',
    rating: 4.6,
    distance: '0.5 km',
    description: 'Authentic Italian cuisine with a modern twist',
    price: '₹₹',
    sellCount: 320,
    prepTime: '20-30 min',
    address: '123 Food Street, Culinary District',
    foodItem: 'Pizza Margherita',
    reviews: ['Great food, amazing service!', 'Best Italian food in town']
  },
  {
    id: '2',
    name: 'Spice Garden',
    cuisine: 'Indian',
    rating: 4.3,
    distance: '1.2 km',
    description: 'Traditional Indian dishes with authentic spices',
    price: '₹₹',
    sellCount: 280,
    prepTime: '25-35 min',
    address: '456 Curry Lane, Flavor Town',
    foodItem: 'Butter Chicken',
    reviews: ['Delicious Indian cuisine', 'Authentic flavors and great service']
  },
  {
    id: '3',
    name: 'Sushi Master',
    cuisine: 'Japanese',
    rating: 4.8,
    distance: '2.0 km',
    description: 'Premium sushi and Japanese delicacies',
    price: '₹₹₹',
    sellCount: 210,
    prepTime: '15-25 min',
    address: '789 Ocean Drive, Fish Valley',
    foodItem: 'Dragon Roll',
    reviews: ['Fresh and delicious sushi', 'Best Japanese restaurant in the area']
  },
  {
    id: '4',
    name: 'Burger Haven',
    cuisine: 'American',
    rating: 4.2,
    distance: '0.8 km',
    description: 'Juicy gourmet burgers and crispy fries',
    price: '₹₹',
    sellCount: 350,
    prepTime: '15-20 min',
    address: '101 Beef Street, Burger Block',
    foodItem: 'Classic Cheeseburger',
    reviews: ['Amazing burgers!', 'Wonderful service and delicious food']
  }
];

// Calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  try {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  } catch (error) {
    console.error('Error calculating distance:', error);
    return 1.0; // Default distance
  }
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// Function to fetch detailed information about a restaurant including reviews
const fetchPlaceDetails = async (placeId, apiKey) => {
  try {
    // Create the place details URL
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,review,formatted_phone_number,website,opening_hours&key=${apiKey}`;
    
    console.log(`Fetching details from: ${detailsUrl}`);
    
    const response = await fetch(detailsUrl, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Details API response not ok: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.warn(`Details API error: ${data.status}`, data.error_message);
      return null;
    }
    
    return data.result;
  } catch (error) {
    console.error(`Error fetching place details: ${error.message}`);
    return null;
  }
};

// Function to fetch restaurants from Google Places API with real reviews
const fetchRestaurantsFromAPI = async (query, userLocation) => {
  try {
    console.log(`Searching for restaurants with query: ${query}`);
    
    // Use our Google Places API key directly
    const apiKey = GOOGLE_PLACES_API_KEY;
    
    // Check if we have valid location coordinates
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      console.log('No location coordinates available, returning empty results');
      return [];
    }
    
    // Create the nearby search URL with radius of 5000 meters
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${userLocation.latitude},${userLocation.longitude}&radius=5000&type=restaurant&keyword=${encodeURIComponent(query)}&key=${apiKey}`;
    
    console.log(`Fetching from URL: ${url}`);
    
    // Set up timeout for fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout (reduced from 30)
    
    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      // Check if response is ok
      if (!response.ok) {
        console.log(`Network response was not ok: ${response.status}, returning empty results`);
        return [];
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.log('Google Places API error:', data.status);
        return [];
      }
      
      if (!data.results || data.results.length === 0) {
        console.log('No results found for this query');
        return [];
      }
      
      // Process the results to get uniform restaurant objects
      const restaurantPromises = data.results.map(async (place) => {
        try {
          // Fetch additional details including reviews for each place
          const placeDetails = await fetchPlaceDetails(place.place_id, apiKey);
          
          // Get additional details for each place
          let photoUrl = null;
          if (place.photos && place.photos.length > 0) {
            photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`;
          } else {
            // Use a placeholder image if no photos available
            photoUrl = require('../assets/images/restaurant1.jpg');
          }
          
          // Calculate distance
          const distanceInKm = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            place.geometry?.location?.lat || userLocation.latitude,
            place.geometry?.location?.lng || userLocation.longitude
          );
          
          // Format price level
          const priceLevel = place.price_level || 1;
          const priceText = '₹'.repeat(priceLevel);
          
          // Extract cuisine type from the place types
          let cuisineType = 'Restaurant';
          if (place.types && place.types.length > 0) {
            const filteredTypes = place.types
              .filter(t => !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(t));
            
            if (filteredTypes.length > 0) {
              cuisineType = filteredTypes[0]
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            }
          }
          
          // Extract real reviews if available from place details
          let reviews = ['Good place to eat', 'Nice atmosphere']; // Default fallback
          
          if (placeDetails && placeDetails.reviews && placeDetails.reviews.length > 0) {
            reviews = placeDetails.reviews.map(review => review.text || review.content || review.review_text);
          }
          
          // Create a restaurant object with all needed properties
          return {
            id: place.place_id || `temp-id-${Math.random().toString(36).substring(2, 9)}`,
            name: place.name || 'Restaurant',
            rating: place.rating || 4.0,
            distance: `${distanceInKm.toFixed(1)} km`,
            cuisine: cuisineType,
            address: place.vicinity || 'Address unavailable',
            price: priceText,
            image: photoUrl,
            description: `${cuisineType} restaurant, ${distanceInKm.toFixed(1)} km away`,
            sellCount: Math.floor(Math.random() * 300) + 100,
            prepTime: `${Math.floor(Math.random() * 15) + 15}-${Math.floor(Math.random() * 15) + 30} min`,
            foodItem: query,
            reviews: reviews, // Use real reviews from the API
            phone: placeDetails?.formatted_phone_number || 'Phone not available',
            website: placeDetails?.website || '',
            openingHours: placeDetails?.opening_hours?.weekday_text || []
          };
        } catch (placeError) {
          // If processing an individual place fails, return a minimal restaurant object
          console.log(`Error processing place ${place.place_id || 'unknown'}, using fallback`);
          return {
            id: place.place_id || `temp-id-${Math.random().toString(36).substring(2, 9)}`,
            name: place.name || 'Restaurant',
            rating: place.rating || 4.0,
            address: place.vicinity || 'Address unavailable',
            cuisine: 'Restaurant',
            distance: 'Unknown distance',
            image: require('../assets/images/restaurant1.jpg'),
          };
        }
      });
      
      try {
        // Wait for all promises to resolve, but handle individual failures
        const allResults = await Promise.allSettled(restaurantPromises);
        
        // Filter out rejected promises and return only fulfilled values
        const restaurants = allResults
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);
        
        return restaurants;
      } catch (promiseError) {
        console.log('Error processing restaurant promises:', promiseError);
        return [];
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.log('Fetch error in restaurant search:', fetchError.message);
      return []; // Return empty array instead of throwing
    }
  } catch (error) {
    console.log('Error fetching restaurants, returning empty results');
    return []; // Return empty array instead of throwing
  }
};

// Helper function to safely check dark mode
const getSafeIsDarkMode = (isDarkMode) => {
  // Handle cases where isDarkMode could be undefined or not a boolean
  return typeof isDarkMode === 'boolean' ? isDarkMode : false;
};

// Update the handleRestaurantPress function with safer dark mode handling
const handleRestaurantPress = (restaurant, navigation, isDarkMode) => {
  // Check if we have the required data
  if (!restaurant) {
    console.error("Restaurant data is missing");
    return;
  }
  
  // Check if navigation is available
  if (!navigation) {
    console.error("Navigation object is not available");
    return;
  }
  
  // Get the current dark mode setting with safety check
  const currentDarkMode = getSafeIsDarkMode(isDarkMode);
  
  try {
    console.log('Navigating to RestaurantScreen with data:', { 
      id: restaurant.id,
      name: restaurant.name,
      isDarkMode: currentDarkMode 
    });
    
    // Navigate to RestaurantScreen
    navigation.navigate('RestaurantScreen', { 
      restaurant, 
      isDarkMode: currentDarkMode 
    });
  } catch (error) {
    console.error('Navigation error:', error);
    Alert.alert(
      'Navigation Error',
      'Could not navigate to restaurant details. Please try again.',
      [{ text: 'OK' }]
    );
  }
};

// Replace the IconWithFallback component with a more reliable implementation
const IconWithFallback = ({ faIconName, size, color, style }) => {
  // Direct mapping of common icons to FontAwesome
  const iconMap = {
    'star': 'star',
    'map-marker': 'map-marker',
    'cutlery': 'cutlery',
    'arrow-left': 'arrow-left',
    'refresh': 'refresh',
    'home': 'home',
    'search': 'search',
    'star-o': 'star-o',
    'star-half-o': 'star-half-o',
    'clock-o': 'clock-o',
    'user-circle-o': 'user-circle-o',
    'comments-o': 'comments-o',
    'comment-o': 'comment-o',
    'share-alt': 'share-alt',
    'globe': 'globe',
    'phone': 'phone',
    'info-circle': 'info-circle',
    'lightbulb-o': 'lightbulb-o'
  };
  
  // Ensure we're using a supported icon name
  const iconName = iconMap[faIconName] || 'circle';
  
  try {
    // Use FontAwesome directly
    return <FontAwesome name={iconName} size={size} color={color} style={style} />;
  } catch (error) {
    console.warn(`Failed to render icon: ${faIconName}`, error);
    // Emergency fallback to text if FontAwesome fails completely
    return (
      <View style={[{
        width: size,
        height: size,
        borderRadius: size/2,
        backgroundColor: color,
        justifyContent: 'center',
        alignItems: 'center',
      }, style]}>
        <Text style={{color: '#FFFFFF', fontWeight: 'bold'}}>•</Text>
      </View>
    );
  }
};

// Function to fetch enhanced reviews for a restaurant using OpenRouter API
const fetchEnhancedReviews = async (restaurant) => {
  try {
    if (!restaurant || !restaurant.name) {
      console.error('Restaurant information is missing');
      return [];
    }

    console.log('Fetching enhanced reviews for restaurant:', restaurant.name);
    
    // Create the prompt for the API
    const prompt = `Generate 2 realistic customer reviews for the restaurant "${restaurant.name}".
    
    Restaurant Details:
    - Name: ${restaurant.name}
    - Cuisine: ${restaurant.cuisine || 'Not specified'}
    - Rating: ${restaurant.rating || 'Not rated'}
    
    Please provide 2 short, authentic-sounding customer reviews (2-3 sentences each) that reflect the likely experience at this restaurant. Make them sound like real customer reviews, with varying perspectives and mentioning specific dishes or aspects of the experience.`;
    
    // Prepare the API request
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://flavorsync.app', // Your app's domain
        'X-Title': 'FlavorSync Restaurant App' // Your app's name
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku-20240307",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 250
      }),
      timeout: 10000 // 10 second timeout
    });
    
    // Check if response is OK
    if (!response.ok) {
      console.error('API Error:', response.status);
      return [];
    }
    
    // Parse the response
    const data = await response.json();
    console.log('API response received');
    
    // Extract the AI-generated text
    if (data.choices && data.choices.length > 0) {
      const reviewsText = data.choices[0].message.content;
      
      // Split the text into separate reviews
      let reviews = reviewsText.split(/\n\n|\r\n\r\n/).filter(review => 
        review.trim().length > 0 && !review.startsWith('Review') && !review.includes('Here are')
      );
      
      // Clean up the reviews (remove numbers, quotes, etc.)
      reviews = reviews.map(review => 
        review.replace(/^[0-9]+[\.\:\)\-]\s*|^[\"\']|[\"\']$/g, '').trim()
      );
      
      return reviews.slice(0, 2); // Return at most 2 reviews
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching enhanced reviews:', error);
    return [];
  }
};

// Update the MagicCard component with simpler animations
const MagicCard = ({ restaurant, index, isDarkMode, navigation }) => {
  // Make sure restaurant object exists before accessing its properties
  if (!restaurant) {
    console.error('Restaurant data is missing');
    return null;
  }

  // Animation values - ONLY use simple animations with clear native/JS separation
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  
  // State for touch interactions
  const [isPressed, setIsPressed] = useState(false);
  const [elevation, setElevation] = useState(5);

  // Safely access restaurant properties with defaults
  const name = restaurant.name || 'Restaurant';
  const rating = restaurant.rating || 0;
  const cuisine = restaurant.cuisine || 'Restaurant';
  const address = restaurant.address || 'Address not available';
  const distance = restaurant.distance || '';

  // Simple entry animation with staggered timing
  useEffect(() => {
    const delay = index * 100;
    
    // Simple entry animation with native driver
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Simple press animations
  const handlePressIn = () => {
    setIsPressed(true);
    setElevation(2);
    
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    setElevation(5);
    
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Determine if we have a valid image URL
  const hasValidImage = isValidImageUrl(restaurant.image);
  
  // Randomly determine if restaurant is open (for UI enhancement)
  const isOpen = React.useMemo(() => Math.random() > 0.3, []);

  // Update the onCardPress function to navigate to BiteBot
  const onCardPress = () => {
    try {
      console.log('Navigating to BiteBot with restaurant:', restaurant.name);
      
      // Create a simplified restaurant object with essential data
      const restaurantData = {
        id: restaurant.id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        rating: restaurant.rating,
        image: restaurant.image,
        address: restaurant.address,
        price: restaurant.price,
        placeId: restaurant.id
      };
      
      // Navigate to BiteBot with the restaurant data instead of RestaurantScreen
      navigation.navigate('BiteBot', { 
        restaurant: restaurantData, 
        isDarkMode: isDarkMode 
      });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert(
        'Navigation Error',
        'Could not navigate to BiteBot. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Define theme based on dark mode
  const theme = {
    cardBackground: isDarkMode ? COLORS.lightGrayDark : COLORS.white,
    text: isDarkMode ? COLORS.textDark : COLORS.text,
    secondaryText: isDarkMode ? COLORS.secondaryTextDark : COLORS.secondaryText,
    border: isDarkMode ? '#3A3A3A' : COLORS.lightGray,
    shadowColor: isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)',
  };

  return (
    <TouchableWithoutFeedback 
      onPress={onCardPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View 
        style={[
          styles.card, 
          { 
            backgroundColor: theme.cardBackground,
            marginBottom: 24,
            borderWidth: isDarkMode ? 1 : 0,
            borderColor: theme.border,
            width: '92%',
            alignSelf: 'center',
            shadowColor: theme.shadowColor,
            shadowOffset: { width: 0, height: isPressed ? 2 : 4 },
            shadowOpacity: isPressed ? 0.2 : 0.15,
            shadowRadius: isPressed ? 3 : 6,
            elevation: elevation,
          },
          {
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: translateYAnim }
            ],
          }
        ]}
      >
        {/* Restaurant Image Section */}
        <View style={styles.imageContainer}>
          {hasValidImage ? (
            <Image
              source={{ uri: restaurant.image }}
              style={styles.cardImage}
              resizeMode="cover"
              defaultSource={{uri: 'https://via.placeholder.com/400x300/CCCCCC/666666?text=No+Image'}}
              onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
            />
          ) : (
            <View style={[styles.placeholderImage, {
              backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
            }]}>
              <Text style={{ fontSize: 40 }}>🍽️</Text>
            </View>
          )}
          
          {/* Enhanced gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            start={{ x: 0, y: 0.4 }}
            end={{ x: 0, y: 1 }}
            style={styles.imageGradient}
          />
          
          {/* Status badge (Open/Closed) */}
          <View style={{
            position: 'absolute',
            top: 12,
            left: 12,
            backgroundColor: isOpen ? 'rgba(0, 170, 0, 0.85)' : 'rgba(180, 0, 0, 0.85)',
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isOpen ? 'rgba(255,255,255,0.5)' : 'transparent',
          }}>
            <Text style={{color: 'white', fontWeight: 'bold', fontSize: 11}}>
              {isOpen ? 'OPEN NOW' : 'CLOSED'}
            </Text>
          </View>
          
          {/* Price badge with enhanced style */}
          {restaurant.price && (
            <View style={{
              position: 'absolute',
              right: 12,
              top: 12,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              paddingVertical: 3,
              paddingHorizontal: 8,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
            }}>
              <Text style={{color: 'white', fontWeight: 'bold', fontSize: 12}}>
                {restaurant.price}
              </Text>
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.cardContent}>
          {/* Restaurant Name */}
          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
            {name}
          </Text>
          
          {/* Rating Section with stars */}
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text 
                  key={star} 
                  style={{ marginRight: 2, fontSize: 18 }}
                >
                  {star <= Math.floor(rating) ? '⭐' : 
                   star === Math.ceil(rating) && rating % 1 >= 0.5 ? '⭐' : '☆'}
                </Text>
              ))}
            </View>
            <Text style={[styles.ratingText, { color: theme.text }]}>
              {rating.toFixed(1)}
            </Text>
          </View>
          
          {/* Details Row with enhanced visuals */}
          <View style={styles.detailsRow}>
            {/* Cuisine with icon */}
            {cuisine && (
              <View style={[
                styles.cuisineContainer, 
                { 
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(182,0,0,0.1)',
                  borderRadius: 16,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  marginRight: 8,
                }
              ]}>
                <Text style={{ fontSize: 16, marginRight: 4 }}>🍴</Text>
                <Text style={[styles.cuisineText, { color: theme.text, fontSize: 15 }]}>
                  {cuisine}
                </Text>
              </View>
            )}
            
            {/* Distance with enhanced display */}
            {distance && (
              <View style={[
                styles.distanceContainer,
                {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  borderRadius: 16,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }
              ]}>
                <Text style={{ fontSize: 16, marginRight: 4 }}>📍</Text>
                <Text style={[styles.distanceText, { color: theme.text, fontSize: 15 }]}>
                  {distance}
                </Text>
              </View>
            )}
          </View>
          
          {/* Address with enhanced styling */}
          <View style={[
            styles.addressContainer, 
            { 
              backgroundColor: isDarkMode ? 'rgba(60,60,60,0.3)' : 'rgba(240,240,240,0.7)',
              borderRadius: 10,
              padding: 10,
              marginTop: 8,
              borderLeftWidth: 3,
              borderLeftColor: COLORS.primary,
            }
          ]}>
            <Text style={[styles.addressText, { color: theme.secondaryText, fontSize: 14 }]} numberOfLines={2}>
              {address}
            </Text>
          </View>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// This is a simple debounce function to prevent too many updates while typing
const debounce = (func, delay) => {
  let timeoutId;
  return function(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

// Helper function to validate image URLs
const isValidImageUrl = (url) => {
  if (!url) return false;
  if (typeof url !== 'string') return false;
  return url.startsWith('http') || url.startsWith('https');
};

// Add these constants after the existing constants
// Valid food terms dictionary for search validation
const VALID_FOOD_TERMS = [
  // Indian cuisine
  'biryani', 'chicken biryani', 'veg biryani', 'mutton biryani', 
  'dosa', 'masala dosa', 'idli', 'vada', 'samosa', 'chole bhature',
  'paneer', 'butter chicken', 'tandoori', 'naan', 'roti', 'chapati',
  'curry', 'tikka masala', 'vindaloo', 'dal', 'rajma', 'korma',
  
  // International cuisine
  'pizza', 'burger', 'pasta', 'sushi', 'ramen', 'taco', 'burrito',
  'sandwich', 'wrap', 'salad', 'rice', 'noodle', 'soup', 'steak',
  'chicken', 'beef', 'pork', 'fish', 'seafood', 'vegetarian', 'vegan',
  'ice cream', 'cake', 'dessert', 'breakfast', 'lunch', 'dinner',
  
  // Cuisine types
  'indian', 'italian', 'chinese', 'japanese', 'mexican', 'thai',
  'french', 'greek', 'mediterranean', 'american', 'korean', 'vietnamese',
  'middle eastern', 'african', 'spanish', 'german', 'lebanese',
  
  // Food categories
  'restaurant', 'cafe', 'food', 'cuisine', 'dish', 'meal', 'popular', 'nearby',
  'top rated', 'fast food', 'street food', 'grill', 'barbecue', 'featured'
];

// Update the fuzzy search implementation for the VALID_FOOD_TERMS array
// Create a Fuse instance for fuzzy searching
const fuseOptions = {
  includeScore: true,
  threshold: 0.4,  // Lower threshold = stricter matching
  keys: ['term']
};

// Format the terms for Fuse
const formattedFoodTerms = VALID_FOOD_TERMS.map(term => ({ term }));
const fuse = new Fuse(formattedFoodTerms, fuseOptions);

// Improved function to validate if search term is food-related using fuzzy matching
const isValidFoodTerm = (query) => {
  // Empty check
  if (!query || query.trim() === '') return false;
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Check for pure numbers or special characters (keep this validation)
  if (/^-?\d+$/.test(normalizedQuery)) return false;
  if (/^[^\w\s]+$/.test(normalizedQuery)) return false;
  if (normalizedQuery.length < 2) return false;
  
  // Check for exact matches first (faster than fuzzy)
  if (VALID_FOOD_TERMS.some(term => term === normalizedQuery)) {
    return true;
  }
  
  // Check if query contains any valid food term (also fast)
  if (VALID_FOOD_TERMS.some(term => normalizedQuery.includes(term))) {
    return true;
  }
  
  // Use fuzzy search as a fallback
  const fuzzyResults = fuse.search(normalizedQuery);
  
  // If we have any results with a decent score, consider it valid
  if (fuzzyResults.length > 0 && fuzzyResults[0].score < 0.4) {
    console.log(`Fuzzy match found for "${normalizedQuery}": ${fuzzyResults[0].item.term} (score: ${fuzzyResults[0].score})`);
    return true;
  }
  
  // For compound terms, check each word with fuzzy search
  const words = normalizedQuery.split(/\s+/).filter(word => word.length > 2);
  for (const word of words) {
    const wordResults = fuse.search(word);
    if (wordResults.length > 0 && wordResults[0].score < 0.4) {
      console.log(`Word fuzzy match found for "${word}" in "${normalizedQuery}": ${wordResults[0].item.term} (score: ${wordResults[0].score})`);
      return true;
    }
  }
  
  return false;
};

// Update the constant for food categories to include image URLs
const POPULAR_CATEGORIES = [
  { id: 'cat1', name: 'Biryani', icon: '🍚', image: 'https://i.imgur.com/1KzIOZb.png' },
  { id: 'cat2', name: 'Pizza', icon: '🍕', image: 'https://i.imgur.com/Tn3CtBO.png' },
  { id: 'cat3', name: 'Fried Rice', icon: '🍚', image: 'https://i.imgur.com/HQzcMEL.png' },
  { id: 'cat4', name: 'Burger', icon: '🍔', image: 'https://i.imgur.com/qBMgvR6.png' },
  { id: 'cat5', name: 'Cake', icon: '🍰', image: 'https://i.imgur.com/g00QyZn.png' },
  { id: 'cat6', name: 'Noodles', icon: '🍜', image: 'https://i.imgur.com/DpXQxYZ.png' },
  { id: 'cat7', name: 'Paneer', icon: '🧀', image: 'https://i.imgur.com/Iqg55lS.png' },
  { id: 'cat8', name: 'North Indian', icon: '🍛', image: 'https://i.imgur.com/l4qJHdM.png' },
  { id: 'cat9', name: 'Bowl', icon: '🥣', image: 'https://i.imgur.com/6c5zzLe.png' },
  { id: 'cat10', name: 'Veg Meal', icon: '🥗', image: 'https://i.imgur.com/c1JU0UC.png' },
  { id: 'cat11', name: 'Sweets', icon: '🍬', image: 'https://i.imgur.com/8CPHMF4.png' },
  { id: 'cat12', name: 'Ice Cream', icon: '🍦', image: 'https://i.imgur.com/Nl0tl0t.png' },
];

// Helper function to calculate safe header height for various Android devices
const getStatusBarHeight = () => {
  if (Platform.OS === 'ios') {
    return 0; // SafeAreaView handles this on iOS
  }
  
  // For Android, use StatusBar.currentHeight with a fallback
  return StatusBar.currentHeight || 24; // 24 is a safe fallback if currentHeight is null
};

const SearchScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { query } = route.params || { query: '' };
  
  // Move isDarkMode state to the top
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Define theme early to make it available throughout the component
  const theme = {
    background: isDarkMode ? COLORS.backgroundDark : COLORS.background,
    text: isDarkMode ? COLORS.textDark : COLORS.text,
    secondaryText: isDarkMode ? COLORS.secondaryTextDark : COLORS.secondaryText,
    card: isDarkMode ? COLORS.lightGrayDark : COLORS.white,
    border: isDarkMode ? '#3A3A3A' : COLORS.lightGray,
    shadow: isDarkMode ? COLORS.shadowDark : COLORS.shadow,
  };
  
  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const [searchInputValue, setSearchInputValue] = useState(query || '');
  const [searchQuery, setSearchQuery] = useState(query || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Reference to track if component is mounted
  const componentMounted = useRef(true);
  const searchInputRef = useRef(null);
  
  // Add tab state
  const [activeTab, setActiveTab] = useState('Delivery');
  
  // Add recent searches state
  const [recentSearches, setRecentSearches] = useState([
    { id: '1', name: 'Tiffin Combo', type: 'Dish' },
    { id: '2', name: 'Rice Bowl', type: 'Dish' },
    { id: '3', name: 'Salad', type: 'Dish' }
  ]);
  
  // Add this new state for top picks
  const [topPicks, setTopPicks] = useState([]);
  
  // Create a debounced version of the setter
  const debouncedSetSearchQuery = useCallback(
    debounce((text) => {
      console.log('Debounced search query update:', text);
      setSearchQuery(text);
    }, 300),
    [] // Dependencies array empty because we don't want to recreate this function
  );
  
  // Load dark mode preference - keep this effect
  useEffect(() => {
    const loadDarkModeSetting = async () => {
      try {
        const storedDarkMode = await AsyncStorage.getItem('darkMode');
        if (componentMounted.current) {
          setIsDarkMode(storedDarkMode === 'true');
        }
      } catch (error) {
        console.error('Error loading dark mode setting:', error);
      }
    };
    
    loadDarkModeSetting();
  }, []);
  
  // Get user location when component mounts
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        // Check for cached location first, but don't rely only on it
        const cachedLocation = await LocationService.getLastLocation();
        if (componentMounted.current && cachedLocation) {
          console.log('SearchScreen: Using cached location initially', cachedLocation);
          setUserLocation(cachedLocation);
        }
        
        // Always try to get a current location with permission request
        // The true parameter means we'll show permission request dialog if needed
        const newLocation = await LocationService.getCurrentLocation(true, true);
        
        if (componentMounted.current) {
          if (newLocation) {
            console.log('SearchScreen: Got new location with permission', newLocation);
            setUserLocation(newLocation);
            // Update the location in the cache
            LocationService.saveLastLocation(newLocation);
            
            // If we've already performed a search, refresh the results with new location
            if (searchQuery && results.length === 0 && !loading) {
              handleSearch();
            }
          } else if (!cachedLocation) {
            console.log('SearchScreen: No location available at all');
            setUserLocation(null);
          }
        }
      } catch (error) {
        console.log('SearchScreen: Error getting location', error);
        if (componentMounted.current) {
          // We'll still use cached location if available
          const cachedLocation = await LocationService.getLastLocation();
          if (cachedLocation) {
            setUserLocation(cachedLocation);
          } else {
            setUserLocation(null);
          }
        }
      }
    };
    
    getUserLocation();
  }, []);
  
  // Update the refreshLocation function
  const refreshLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get a new location
      const newLocation = await LocationService.getCurrentLocation(true);
      
      if (componentMounted.current) {
        if (newLocation) {
          console.log('SearchScreen: Refreshed user location', newLocation);
          setUserLocation(newLocation);
          
          // Re-run search with new location
          handleSearch();
        } else {
          console.log('SearchScreen: No location available after refresh');
          setUserLocation(null);
          setLoading(false);
        }
      }
    } catch (error) {
      console.log('SearchScreen: Error refreshing location');
      if (componentMounted.current) {
        setUserLocation(null);
        setLoading(false);
      }
    }
  };
  
  // Function to handle the search action with improved error handling
  const handleSearch = useCallback(async () => {
    // Ensure we have synchronized values
    if (searchInputValue !== searchQuery) {
      setSearchQuery(searchInputValue);
    }
    
    console.log('Searching for:', searchInputValue);
    
    // Only blur the keyboard if needed
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
    
    // Check if search query is empty
    if (!searchInputValue.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    // Add basic validation to prevent searching for pure numbers or other invalid formats
    const trimmedQuery = searchInputValue.trim();
    const isOnlyNumbers = /^-?\d+$/.test(trimmedQuery);
    const isTooShort = trimmedQuery.length < 2;
    const hasSpecialCharsOnly = /^[^\w\s]+$/.test(trimmedQuery);
    
    if (isOnlyNumbers || isTooShort || hasSpecialCharsOnly) {
      setError('Please enter a valid food name, cuisine type, or restaurant name');
      setResults([]);
      setLoading(false);
      return;
    }
    
    // Check if the search term is a valid food term
    if (!isValidFoodTerm(trimmedQuery)) {
      // When food term isn't valid, get some fuzzy suggestions
      const suggestions = fuse.search(trimmedQuery).slice(0, 5);
      
      if (suggestions.length > 0) {
        // Format suggestions as text
        const suggestionText = suggestions
          .map(s => s.item.term)
          .join(', ');
        
        Alert.alert(
          'Not a Food Item',
          `"${trimmedQuery}" doesn't seem to be a food item. Did you mean: ${suggestionText}?`,
          [
            { text: 'Return to Home', onPress: () => navigation.navigate('HomeScreen') },
            // Add buttons for the top 3 suggestions
            ...suggestions.slice(0, 3).map(s => ({
              text: s.item.term,
              onPress: () => {
                setSearchInputValue(s.item.term);
                setSearchQuery(s.item.term);
                // Use setTimeout to avoid state update issues
                setTimeout(() => {
                  // Now continue with the search using the suggested term
                  performSearch(s.item.term);
                }, 100);
              }
            }))
          ]
        );
      } else {
        // Remove the popup alert and just set the error message
        setError('Not a Food Item. Please enter a valid food item, cuisine type, or restaurant category.');
        setResults([]);
        setLoading(false);
      }
      return;
    }
    
    // Create a helper function for the actual search logic
    function performSearch(query) {
      // Prevent state updates if component unmounted
      if (!componentMounted.current) return;
      
      setLoading(true);
      setError(null);
      
      // First check if we have a location already
      if (userLocation) {
        // Use current location and proceed with search
        proceedWithSearch(query, userLocation);
        return;
      }
      
      // If we don't have a location, get it with permission request
      console.log('No location available, requesting permission');
      
      // Request location with permission prompt if needed
      LocationService.getCurrentLocation(true, true)
        .then(newLocation => {
          if (!componentMounted.current) return;
          
          if (newLocation) {
            // Got location successfully
            console.log('Got new location after permission request');
            setUserLocation(newLocation);
            proceedWithSearch(query, newLocation);
          } else {
            // Still no location, try cached as fallback
            console.log('Failed to get current location, trying cached');
            LocationService.getLastLocation()
              .then(cachedLocation => {
                if (!componentMounted.current) return;
                
                if (cachedLocation) {
                  console.log('Using cached location');
                  setUserLocation(cachedLocation);
                  proceedWithSearch(query, cachedLocation);
                } else {
                  // No location available at all, use default
                  console.log('No location available, using default');
                  const defaultLocation = { latitude: 17.3850, longitude: 78.4867 }; // Default to Hyderabad
                  proceedWithSearch(query, defaultLocation);
                }
              })
              .catch(() => {
                // All location attempts failed
                if (!componentMounted.current) return;
                
                console.log('All location attempts failed, using default');
                const defaultLocation = { latitude: 17.3850, longitude: 78.4867 }; // Default to Hyderabad
                proceedWithSearch(query, defaultLocation);
              });
          }
        })
        .catch(error => {
          console.error('Error getting location:', error);
          if (!componentMounted.current) return;
          
          // Try with default location
          const defaultLocation = { latitude: 17.3850, longitude: 78.4867 }; // Default to Hyderabad
          proceedWithSearch(query, defaultLocation);
        });
    }
    
    // Function to show location alert
    function showLocationAlert() {
      setLoading(false);
      
      // Show alert with options to enable location or continue without it
      Alert.alert(
        'Location Services Disabled',
        'FlavorSync needs your location to find restaurants near you. Would you like to enable location services?',
        [
          {
            text: 'Open Settings',
            onPress: () => {
              // Open device settings to enable location
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setResults([]);
              setError('Location access is needed to find nearby restaurants. Please enable location services and try again.');
            },
          },
        ],
        { cancelable: false }
      );
    }
    
    // Function to perform the actual search with location
    function proceedWithSearch(query, location) {
      // If we don't have location yet, try to get it with permission
      if (!location) {
        setLoading(true);
        
        // Request permission and get location
        LocationService.getCurrentLocation(true, true)
          .then(newLocation => {
            if (componentMounted.current) {
              if (newLocation) {
                setUserLocation(newLocation);
                // Now perform search with the new location
                fetchAndProcessResults(query, newLocation);
              } else {
                // User denied permission, show a more friendly error
                setLoading(false);
                setError('Location access is needed to find nearby restaurants. We\'ll try with a default location.');
                
                // Try with a default location as fallback (Hyderabad, India as an example)
                const defaultLocation = { latitude: 17.3850, longitude: 78.4867 };
                fetchAndProcessResults(query, defaultLocation);
              }
            }
          })
          .catch(error => {
            console.log('Error getting location for search:', error);
            if (componentMounted.current) {
              setLoading(false);
              setError('Could not access your location. Please try again later.');
            }
          });
      } else {
        // We have location, proceed with search
        fetchAndProcessResults(query, location);
      }
    }
    
    // Helper function to fetch and process search results
    function fetchAndProcessResults(query, location) {
      fetchRestaurantsFromAPI(query, location)
        .then(restaurants => {
          if (!componentMounted.current) return;
          
          setLoading(false);
          
          if (restaurants && restaurants.length > 0) {
            // Sort restaurants by rating (high to low)
            const sortedRestaurants = restaurants.sort((a, b) => b.rating - a.rating);
            setResults(sortedRestaurants);
            setError(null);
          } else {
            setResults([]);
            setError('No results found');
          }
        })
        .catch(err => {
          console.error('Error fetching restaurants:', err);
          if (componentMounted.current) {
            setLoading(false);
            setError('Search failed. Please try again.');
          }
        });
    }
    
    // Call performSearch with the validated query
    performSearch(trimmedQuery);
  }, [searchInputValue, searchQuery, userLocation, retryCount, navigation, route.params]);
  
  // Set up effect for clean up on unmount
  useEffect(() => {
    return () => {
      componentMounted.current = false;
    };
  }, []);
  
  // Update the useEffect to load top restaurants when no query is provided
  useEffect(() => {
    // Extract location from route.params if available
    if (route.params?.userLocation) {
      // Use the serialized location from navigation params
      setUserLocation(route.params.userLocation);
    }
    
    if (route.params?.query) {
      const queryFromParams = route.params.query;
      setSearchInputValue(queryFromParams);
      setSearchQuery(queryFromParams);
      handleSearch();
    } else {
      // If no query provided, load top-rated restaurants automatically
      setLoading(true);
      setSearchInputValue('top rated');
      setSearchQuery('top rated');
      
      // Use a timeout to ensure state updates are processed
      setTimeout(() => {
        handleSearch();
      }, 100);
    }
  }, [route.params]);
  
  // Update renderRestaurantItem to pass navigation and scrollY
  const renderRestaurantItem = ({ item, index }) => {
    try {
      // Validate restaurant data before passing to MagicCard
      if (!item || typeof item !== 'object') {
        console.error('Invalid restaurant data for item at index', index);
        return null;
      }
      
      return (
        <MagicCard
          key={item.id || `restaurant-${index}`}
          restaurant={item}
          index={index}
          isDarkMode={isDarkMode}
          navigation={navigation}
        />
      );
    } catch (error) {
      console.error('Error rendering restaurant item:', error);
      return null;
    }
  };

  // Header animation based on scroll position
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -5],
    extrapolate: 'clamp',
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.8, 0.7],
    extrapolate: 'clamp',
  });
  
  // Add function to remove a recent search
  const removeRecentSearch = (id) => {
    setRecentSearches(prevSearches => prevSearches.filter(item => item.id !== id));
  };
  
  // Add function to handle category press
  const handleCategoryPress = (category) => {
    setSearchInputValue(category);
    setSearchQuery(category);
    handleSearch();
  };

  // Add a function to load top picks
  const loadTopPicks = useCallback(async () => {
    try {
      // Set up location
      let locationToUse = userLocation;
      if (!locationToUse) {
        try {
          // First try to get cached location without requesting permission
          const cachedLocation = await LocationService.getLastLocation();
          if (cachedLocation) {
            locationToUse = cachedLocation;
            setUserLocation(cachedLocation);
          } else {
            // Only if no cached location, try to get current location without showing popup
            const location = await LocationService.getCurrentLocation(false);
            if (location) {
              locationToUse = location;
              setUserLocation(location);
            }
          }
        } catch (error) {
          console.log('Error getting location for top picks');
        }
        
        // If we still don't have a location, don't show any prompt
        // Just return quietly without attempting to fetch restaurants
        if (!locationToUse) {
          console.log('No location available for top picks');
          return;
        }
      }
      
      // Only fetch restaurants if we have a valid location
      if (locationToUse && locationToUse.latitude && locationToUse.longitude) {
        // Fetch top rated restaurants
        const topRatedRestaurants = await fetchRestaurantsFromAPI('popular', locationToUse);
        
        if (topRatedRestaurants && topRatedRestaurants.length > 0) {
          // Sort by rating and take top 5
          const sortedTopPicks = topRatedRestaurants
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 5);
          
          if (componentMounted.current) {
            setTopPicks(sortedTopPicks);
          }
        }
      }
    } catch (error) {
      console.log('Error loading top picks');
    }
  }, [userLocation]);

  // Call loadTopPicks on component mount
  useEffect(() => {
    loadTopPicks();
  }, [loadTopPicks]);

  // Add a render function for top picks
  const renderTopPickItem = ({ item, index }) => {
    return (
      <TouchableOpacity 
        style={styles.topPickItem}
        onPress={() => {
          // Navigate to BiteBot instead of RestaurantScreen
          navigation.navigate('BiteBot', { 
            restaurant: {
              id: item.id,
              name: item.name,
              cuisine: item.cuisine || 'Restaurant',
              rating: item.rating || 4.0,
              address: item.address || 'Address not available',
              placeId: item.id,
              price: item.price || '$$',
              image: item.image,
              isDarkMode: isDarkMode
            }
          });
        }}
      >
        <View style={styles.topPickImageContainer}>
          <Image 
            source={{ uri: item.image }}
            style={styles.topPickImage}
          />
        </View>
        <Text style={styles.topPickName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.topPickRating}>
          <Text style={styles.topPickRatingText}>⭐ {item.rating}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Add a theme listener to the SearchScreen component
  useEffect(() => {
    // Listen for theme changes from other screens
    const themeListener = (isDark) => {
      console.log('SearchScreen: Theme changed to', isDark ? 'dark' : 'light');
      setIsDarkMode(isDark);
    };
    
    // Subscribe to theme change events
    themeEmitter.addListener('themeChanged', themeListener);
    
    // Cleanup listener on component unmount
    return () => {
      themeEmitter.removeListener('themeChanged', themeListener);
    };
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000000"
        translucent={true}
      />
      
      {/* Add status bar spacing for Android */}
      <View style={{ 
        height: getStatusBarHeight(),
        backgroundColor: '#000000'
      }} />
      
      {/* Improved header with better spacing */}
      <View style={[styles.header, { 
        backgroundColor: '#000000',
        borderBottomColor: 'transparent',
        paddingTop: Platform.OS === 'android' ? 8 : 0
      }]}>
        <Text style={[styles.headerTitle, { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' }]}>
          Search Results
        </Text>
      </View>
      
      {/* If no search performed yet, show categories UI */}
      {!results.length && !loading && !error ? (
        <ScrollView 
          style={{ flex: 1, backgroundColor: '#000000' }}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Delivery/Dining Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === 'Delivery' && [styles.activeTab, { borderBottomColor: '#00C853' }]
              ]}
              onPress={() => setActiveTab('Delivery')}
            >
              <Text style={[
                styles.tabText, 
                { color: '#BBBBBB' },
                activeTab === 'Delivery' && { color: '#00C853', fontWeight: 'bold' }
              ]}>Delivery</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === 'Dining' && [styles.activeTab, { borderBottomColor: '#00C853' }]
              ]}
              onPress={() => setActiveTab('Dining')}
            >
              <Text style={[
                styles.tabText, 
                { color: '#BBBBBB' },
                activeTab === 'Dining' && { color: '#00C853', fontWeight: 'bold' }
              ]}>Dining</Text>
            </TouchableOpacity>
          </View>
          
          {/* Recent Searches Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: '#BBBBBB' }]}>YOUR RECENT SEARCHES</Text>
            
            {recentSearches.map((item) => (
              <View key={item.id} style={styles.recentSearchItem}>
                <View style={styles.searchItemContent}>
                  <View style={styles.searchIconContainer}>
                    <Text style={styles.searchIconText}>🍽️</Text>
                  </View>
                  <View style={styles.searchTextContainer}>
                    <Text style={[styles.searchItemText, { color: '#FFFFFF' }]}>{item.name}</Text>
                    <Text style={[styles.searchItemSubText, { color: '#BBBBBB' }]}>{item.type}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.removeButton} 
                  onPress={() => removeRecentSearch(item.id)}
                >
                  <Text style={{ fontSize: 16, color: '#BBBBBB' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          
          {/* Food Categories Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: '#BBBBBB' }]}>WHAT'S ON YOUR MIND?</Text>
            
            <View style={styles.categoriesGrid}>
              {POPULAR_CATEGORIES.map((category) => (
                <TouchableOpacity 
                  key={category.id} 
                  style={styles.categoryItem}
                  onPress={() => handleCategoryPress(category.name)}
                >
                  <Image 
                    source={{ uri: category.image }} 
                    style={styles.categoryImage}
                  />
                  <Text style={[styles.categoryText, { color: '#FFFFFF' }]}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        // Search results UI - update background color
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
          {/* Loading indicator */}
          {loading && (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[styles.loadingText, { color: theme.text }]}>
                Finding restaurants...
              </Text>
            </View>
          )}
          
          {/* Error message */}
          {!loading && error && (
            <View style={styles.centerContent}>
              <Text style={[styles.errorText, { color: theme.text }]}>
                {error}
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => navigation.navigate('HomeScreen')}
                >
                  <Text style={styles.retryButtonText}>Return to Home Screen</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Results list */}
          {!loading && !error && results.length > 0 && (
            <Animated.FlatList
              data={results}
              renderItem={renderRestaurantItem}
              keyExtractor={(item, index) => item?.id || `restaurant-${index}`}
              contentContainerStyle={[styles.resultsContent, { paddingTop: 10 }]}
              showsVerticalScrollIndicator={false}
              initialNumToRender={5}
              maxToRenderPerBatch={5}
              windowSize={10}
            />
          )}
          
          {/* No results message */}
          {!loading && !error && results.length === 0 && searchQuery && searchQuery !== 'top rated' && (
            <View style={styles.centerContent}>
              <Text style={[styles.noResultsText, { color: theme.text }]}>
                {`No restaurants found serving "${searchQuery}".`}
              </Text>
              <Text style={[styles.suggestionText, { color: theme.secondaryText, marginBottom: 20 }]}>
                Please try a different search.
              </Text>
              <TouchableOpacity 
                style={[styles.retryButton, { marginTop: 15 }]}
                onPress={() => navigation.navigate('HomeScreen')}
              >
                <Text style={styles.retryButtonText}>Return to Home Screen</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
    minHeight: 56,
    zIndex: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerTitle: {
    fontFamily: 'Roboto',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontSize: 18,
    fontWeight: 'normal',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 8,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
    color: COLORS.text,
  },
  sortedByText: {
    fontSize: 14,
    fontFamily: 'Roboto',
    color: COLORS.secondaryText,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Roboto',
    color: COLORS.text,
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Roboto',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    minWidth: 200,
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto',
    color: COLORS.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  noResultsIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  noResultsText: {
    fontSize: 18,
    fontFamily: 'Roboto',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
    paddingHorizontal: 20,
  },
  suggestionText: {
    fontSize: 16,
    fontFamily: 'Roboto',
    color: COLORS.secondaryText,
    textAlign: 'center',
  },
  resultsContent: {
    padding: 8,
    paddingBottom: 40,
  },
  cardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 0,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    backgroundColor: COLORS.white,
    width: '92%',
    alignSelf: 'center',
  },
  imageContainer: {
    height: 220,
    width: '100%',
    position: 'relative',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
    borderRadius: 0,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addressContainer: {
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  addressText: {
    fontSize: 13,
    lineHeight: 18,
  },
  reviewsContainer: {
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  reviewsHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  noReviewsText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Roboto',
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  priceBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  priceText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  cuisineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  cuisineText: {
    fontSize: 16,
    fontFamily: 'Roboto',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 16,
    fontFamily: 'Roboto',
  },
  clearSearchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  headerIconText: {
    fontSize: 24,
    color: COLORS.primary,
  },
  safeArea: {
    flex: 1,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
    paddingHorizontal: 20,
  },
  suggestionChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 5,
    marginBottom: 10,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  searchBar: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    paddingHorizontal: 12,
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    paddingLeft: 4,
  },
  searchIcon: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    color: COLORS.secondaryText,
  },
  sectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    letterSpacing: 0.5,
    marginBottom: 16,
    color: COLORS.secondaryText,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  searchItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchIconText: {
    fontSize: 20,
  },
  searchTextContainer: {
    flexDirection: 'column',
  },
  searchItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchItemSubText: {
    fontSize: 14,
    color: COLORS.secondaryText,
  },
  removeButton: {
    padding: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: (width - 48) / 3,
    alignItems: 'center',
    marginBottom: 24,
  },
  categoryImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 8,
    backgroundColor: '#333333',
  },
  categoryText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#FFFFFF',
    marginTop: 2,
  },
  topPicksSection: {
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: '#000000',
  },
  topPicksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 15,
    marginBottom: 10,
  },
  topPicksList: {
    paddingHorizontal: 10,
  },
  topPickItem: {
    width: 120,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  topPickImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 5,
    borderWidth: 2,
    borderColor: '#00C853',
  },
  topPickImage: {
    width: '100%',
    height: '100%',
  },
  topPickName: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 2,
  },
  topPickRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topPickRatingText: {
    color: '#BBBBBB',
    fontSize: 12,
  },
  resultsHeading: {
    paddingHorizontal: 20,
    paddingTop: 5,          // Reduced from 15
    paddingBottom: 15,      // Keep bottom padding
    marginTop: -5,          // Add negative margin to move up
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsHeadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
});

export default SearchScreen; 