import React, { useState, useEffect, useCallback, useRef, useMemo, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Dimensions,
  RefreshControl,
  FlatList,
  Platform,
  Animated,
  useColorScheme,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../App';
import { themeEmitter } from './ProfileScreen';
import LocationService from '../services/LocationService';
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

// Google Places API Key
const GOOGLE_PLACES_API_KEY = "AIzaSyAPjVz-Cm8F28FPIEOPLVrhO27dqI_9z1M";

// Popular food categories
const POPULAR_CATEGORIES = [
  { id: 'cat1', name: 'Pizza', icon: '🍕' },
  { id: 'cat2', name: 'Burger', icon: '🍔' },
  { id: 'cat3', name: 'Biryani', icon: '🍚' },
  { id: 'cat4', name: 'Sushi', icon: '🍣' },
  { id: 'cat5', name: 'Tacos', icon: '🌮' },
  { id: 'cat6', name: 'Pasta', icon: '🍝' },
  { id: 'cat7', name: 'Noodles', icon: '🍜' },
  { id: 'cat8', name: 'Dessert', icon: '🍰' },
];

// Constants for OpenRouter API
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = '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';

// Together API Constants - same as BiteBot screen
const TOGETHER_API_KEY = "f7111033e3074c49c30afdd49692448c32d19727b8fc5b8dcd2ba11fade9605e";
const TOGETHER_API_URL = "https://api.together.xyz/v1/completions";

// Add a list of food suggestions for autocomplete
const FOOD_SUGGESTIONS = [
  // Indian cuisine
  'Biryani', 'Chicken Biryani', 'Veg Biryani', 'Mutton Biryani', 
  'Dosa', 'Masala Dosa', 'Idli', 'Vada', 'Samosa', 'Chole Bhature',
  'Paneer Butter Masala', 'Butter Chicken', 'Tandoori Chicken', 'Naan',
  'Palak Paneer', 'Malai Kofta', 'Gulab Jamun', 'Rasmalai', 'Jalebi',
  
  // International cuisine
  'Pizza', 'Burger', 'Pasta', 'Sushi', 'Ramen', 'Tacos', 'Ice Cream',
  'Fried Rice', 'Noodles', 'Sandwich', 'Salad', 'Steak', 'Curry',
  'French Fries', 'Chocolate Cake', 'Cheesecake', 'Pancakes',
  
  // Cuisine types
  'Indian Food', 'Chinese Food', 'Italian Food', 'Mexican Food',
  'Thai Food', 'Japanese Food', 'American Food', 'Continental Food',
  'Mediterranean Food', 'Lebanese Food', 'Korean Food'
];

// Expand the VALID_FOOD_TERMS array with more food items
const VALID_FOOD_TERMS = [
  // Indian cuisine
  'biryani', 'chicken biryani', 'veg biryani', 'mutton biryani', 
  'dosa', 'masala dosa', 'idli', 'vada', 'samosa', 'chole bhature',
  'paneer', 'butter chicken', 'tandoori', 'naan', 'roti', 'chapati',
  'curry', 'tikka masala', 'vindaloo', 'dal', 'rajma', 'korma',
  'pav bhaji', 'aloo gobi', 'palak paneer', 'gulab jamun', 'jalebi',
  'rasmalai', 'kulfi', 'lassi', 'chai', 'paratha', 'thali',
  'chaat', 'pakora', 'puri', 'bhel puri', 'pani puri',
  
  // International cuisine
  'pizza', 'burger', 'pasta', 'sushi', 'ramen', 'taco', 'burrito',
  'sandwich', 'wrap', 'salad', 'rice', 'noodle', 'soup', 'steak',
  'chicken', 'beef', 'pork', 'fish', 'seafood', 'vegetarian', 'vegan',
  'ice cream', 'cake', 'dessert', 'breakfast', 'lunch', 'dinner',
  'hot dog', 'french fries', 'fried chicken', 'bbq', 'ribs',
  'pancakes', 'waffles', 'omelette', 'croissant', 'bagel',
  'donut', 'muffin', 'bread', 'pastry', 'chocolate', 'pie',
  'cupcake', 'brownie', 'cookie', 'milkshake', 'smoothie',
  
  // Cuisine types
  'indian', 'italian', 'chinese', 'japanese', 'mexican', 'thai',
  'french', 'greek', 'mediterranean', 'american', 'korean', 'vietnamese',
  'middle eastern', 'african', 'spanish', 'german', 'lebanese',
  'turkish', 'brazilian', 'peruvian', 'indonesian', 'malaysian',
  'filipino', 'caribbean', 'polish', 'russian', 'british',
  
  // Food categories
  'restaurant', 'cafe', 'food', 'cuisine', 'dish', 'meal', 'popular', 'nearby',
  'top rated', 'fast food', 'street food', 'grill', 'barbecue', 'bakery',
  'buffet', 'takeout', 'delivery', 'dine-in', 'fine dining', 'casual',
  'brunch', 'dinner', 'lunch', 'appetizer', 'main course', 'side dish',
  'snack', 'beverage', 'drink', 'alcohol', 'coffee', 'tea',
  
  // Additional common foods
  'hamburger', 'cheeseburger', 'wings', 'dumpling', 'spring roll',
  'nachos', 'quesadilla', 'enchilada', 'fajita', 'chimichanga',
  'ravioli', 'risotto', 'tiramisu', 'gelato', 'baguette',
  'croissant', 'macaron', 'escargot', 'gyro', 'souvlaki',
  'hummus', 'falafel', 'shawarma', 'kebab', 'baklava',
  'pad thai', 'tom yum', 'green curry', 'satay', 'tempura',
  'teriyaki', 'nigiri', 'sashimi', 'maki', 'pho', 'dim sum',
  'fried rice', 'chow mein', 'kung pao', 'paella', 'churros',
  'pierogi', 'borscht', 'schnitzel', 'sauerkraut', 'pretzel'
];

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

// Error Boundary as a functional component
const ErrorBoundaryWrapper = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return (
      <View style={styles.errorCard}>
        <Text style={styles.errorCardText}>Could not display this item</Text>
      </View>
    );
  }
  
  return (
    <React.Fragment>
      {React.cloneElement(children, {
        onError: () => setHasError(true)
      })}
    </React.Fragment>
  );
};

// Function to search restaurants from Google Places API
const searchRestaurantsForFood = async (foodQuery, locationCoords) => {
  try {
    console.log(`Searching for "${foodQuery}" using Google Places API`);
    
    // Validate location coordinates
    if (!locationCoords || typeof locationCoords.latitude !== 'number' || typeof locationCoords.longitude !== 'number') {
      console.log('Invalid or missing location coordinates for restaurant search, returning empty results');
      return [];
    }
    
    // Construct the API URL
    const apiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${locationCoords.latitude},${locationCoords.longitude}&radius=5000&type=restaurant&keyword=${encodeURIComponent(foodQuery)}&key=${GOOGLE_PLACES_API_KEY}`;
    
    // Set up timeout for fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout (reduced)
    
    try {
      const response = await fetch(apiUrl, { 
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
        console.log('No results from Places API');
        return [];
      }
      
      // Process the results - ensure image is a string URI
      return data.results.map(place => {
        // Create a proper image URL string instead of an object with uri property
        let imageUrl = '';
        if (place.photos && place.photos[0] && place.photos[0].photo_reference) {
          imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`;
        }
        
        return {
          id: place.place_id || `temp-id-${Math.random().toString(36).substring(2, 9)}`,
          name: place.name || 'Unknown Restaurant',
          cuisine: place.types && place.types[0] ? place.types[0].replace(/_/g, ' ') : 'Restaurant',
          rating: place.rating || 4.0,
          distance: `${((Math.random() * 2) + 0.5).toFixed(1)} km`,
          address: place.vicinity || 'Address not available',
          price: place.price_level ? '$'.repeat(place.price_level) : '$$',
          image: imageUrl // Use string URL instead of an object
        };
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.log('Fetch error in restaurant search:', fetchError.message);
      return []; // Return empty array instead of throwing
    }
  } catch (error) {
    console.log('Error searching restaurants, returning empty results');
    return []; // Return empty array instead of throwing
  }
};

// Restaurant card component
const RestaurantCard = ({ restaurant, onPress, onError }) => {
  const [imageError, setImageError] = useState(false);
  
  try {
    // Safely extract the image URL as a string
    const imageUrl = typeof restaurant.image === 'string' ? 
      restaurant.image : 
      (restaurant.image && typeof restaurant.image.uri === 'string' ? 
        restaurant.image.uri : 
        '');
    
    return (
      <TouchableOpacity
        style={[
          styles.restaurantCard,
          { height: normalize(120) }
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={[styles.restaurantImageContainer, { width: normalize(100) }]}>
          {!imageError && imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.restaurantImage}
              onError={() => setImageError(true)}
              defaultSource={require('../assets/images/restaurant1.jpg')}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={{ fontSize: normalize(24) }}>🍽️</Text>
            </View>
          )}
        </View>
        <View style={styles.restaurantInfo}>
          <Text 
            style={[styles.restaurantName, { fontSize: normalize(16) }]} 
            numberOfLines={1}
          >
            {restaurant.name}
          </Text>
          <View style={styles.restaurantDetails}>
            <View style={styles.restaurantType}>
              <Text style={{ fontSize: normalize(12) }}>🍴</Text>
              <Text style={[styles.restaurantTypeText, { fontSize: normalize(13) }]}>
                {restaurant.cuisine || 'restaurant'}
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <Text style={{ fontSize: normalize(12), marginRight: normalize(2) }}>⭐</Text>
              <Text style={[styles.ratingText, { fontSize: normalize(13) }]}>
                {restaurant.rating?.toFixed(1) || '4.0'}
              </Text>
            </View>
          </View>
          <View style={styles.locationContainer}>
            <Text style={{ fontSize: normalize(12) }}>📍</Text>
            <Text 
              style={[styles.locationText, { fontSize: normalize(13) }]} 
              numberOfLines={2}
            >
              {restaurant.distance ? `${restaurant.distance}` : '0.9 km'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  } catch (error) {
    if (onError) onError();
    return null;
  }
};

// RobotIcon component
const RobotIcon = ({ size = 24, color = '#FFFFFF', isDarkMode = false }) => {
  return (
    <Text style={{ 
      fontSize: size * 0.8, 
      color: color,
      textAlign: 'center',
      lineHeight: size
    }}>
      🤖
    </Text>
  );
};

// ChatBot UI components
const ChatFloatingButton = ({ onPress, isDarkMode, isVisible = true }) => {
  if (!isVisible) return null;
  
  return (
    <TouchableOpacity
      style={[
        styles.chatButtonContainer,
        {
          backgroundColor: COLORS.primary,
          shadowColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(182,0,0,0.4)',
        }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <RobotIcon 
        size={normalize(28)} 
        color={COLORS.white} 
        isDarkMode={isDarkMode} 
      />
    </TouchableOpacity>
  );
};

// Add this section to get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Add a scaling function for responsive sizing
const scale = SCREEN_WIDTH / 375; // 375 is the standard width used for design
const normalize = (size) => Math.round(size * scale);

// Helper function to safely get status bar height with fallback
const getStatusBarHeight = () => {
  if (Platform.OS === 'ios') {
    return 0; // SafeAreaView handles this on iOS
  }
  
  // For Android, use StatusBar.currentHeight with a fallback
  return StatusBar.currentHeight || 24; // 24 is a safe fallback if currentHeight is null
};

// Main HomeScreen component
const HomeScreen = () => {
  // Refs
  const navigation = useNavigation();
  const navigationRef = useRef(navigation);
  const isMounted = useRef(true);
  
  // State
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentSearches, setRecentSearches] = useState(['Biryani', 'Pizza', 'Burger']);
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userName, setUserName] = useState('Foodie');
  const [userLocation, setUserLocation] = useState(null);
  
  // Chatbot state
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'system', content: 'I am FlavorSync AI, your food assistant. I can help you find restaurants, suggest dishes, and answer food-related questions.' },
    { role: 'assistant', content: 'Hello! 👋 I\'m your FlavorSync AI food assistant. I can help you with:\n\n• Finding restaurants\n• Suggesting dishes\n• Answering food questions\n• Providing cooking tips\n\nHow can I assist you today?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef(null);
  
  // Animation for chat panel
  const chatPanelAnim = useRef(new Animated.Value(0)).current;
  
  // Create animation style for chat panel
  const chatPanelStyle = {
    transform: [
      {
        translateY: chatPanelAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [500, 0]
        })
      }
    ],
    opacity: chatPanelAnim
  };
  
  // Simple animation for fade-in effects
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Update the toggleDarkMode function to include animation
  const toggleAnimation = useRef(new Animated.Value(0)).current;
  
  // Add a pulsing animation for the Explore Now button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Load dark mode preference
  useEffect(() => {
    try {
      const loadDarkModeSetting = async () => {
        try {
          const storedDarkMode = await AsyncStorage.getItem('darkMode');
          if (isMounted.current) {
            if (storedDarkMode !== null) {
              setIsDarkMode(storedDarkMode === 'true');
            } else {
              setIsDarkMode(colorScheme === 'dark');
            }
          }
        } catch (error) {
          console.error('Error loading dark mode setting:', error);
          if (isMounted.current) {
            setIsDarkMode(false);
          }
        }
      };
      
      loadDarkModeSetting();
    } catch (error) {
      console.error('Fatal error loading settings:', error);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [colorScheme]);
  
  // Simple fade-in animation on mount
  useEffect(() => {
    try {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Animation error:', error);
      fadeAnim.setValue(1);
    }
    
    return () => {
      try {
        fadeAnim.setValue(0);
      } catch (error) {
        console.error('Animation cleanup error:', error);
      }
    };
  }, [fadeAnim]);
  
  // Set up the pulsing animation on component mount
  useEffect(() => {
    try {
      // Set the pulse animation to a static value instead of an animation loop
      pulseAnim.setValue(1);
      // No animation loop needed
    } catch (error) {
      console.error('Pulse animation error:', error);
    }
    
    return () => {
      // Clean up
      pulseAnim.stopAnimation();
    };
  }, [pulseAnim]);
  
  // Try to match theme with app.js
  const theme = useMemo(() => ({
    background: isDarkMode ? COLORS.backgroundDark : COLORS.background,
    text: isDarkMode ? COLORS.textDark : COLORS.text,
    secondaryText: isDarkMode ? COLORS.secondaryTextDark : COLORS.secondaryText,
    card: isDarkMode ? COLORS.lightGrayDark : COLORS.white,
    border: isDarkMode ? '#3A3A3A' : COLORS.lightGray,
    shadow: isDarkMode ? COLORS.shadowDark : COLORS.shadow,
    lightGray: isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.lightGray,
  }), [isDarkMode]);
  
  // Toggle dark mode with proper error handling and animation
  const toggleDarkMode = useCallback(async () => {
    try {
      const newMode = !isDarkMode;
      
      // Start the animation
      Animated.sequence([
        Animated.timing(toggleAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(toggleAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
      
      // Set dark mode after a small delay to match the animation
      setTimeout(() => {
        setIsDarkMode(newMode);
      }, 150);
      
      // IMPORTANT: Use 'isDarkMode' key to match what ProfileScreen is using
      try {
        console.log('HomeScreen: Saving theme preference:', newMode ? 'dark' : 'light');
        await AsyncStorage.setItem('isDarkMode', newMode ? 'true' : 'false');
        // Also save to 'darkMode' for backward compatibility
        await AsyncStorage.setItem('darkMode', newMode ? 'true' : 'false');
      } catch (storageError) {
        console.error('Error saving dark mode preference:', storageError);
      }
      
      // Emit theme change event - this will instantly update the ProfileScreen
      console.log('HomeScreen: Emitting themeChanged event with value:', newMode);
      themeEmitter.emit('themeChanged', newMode);
    } catch (error) {
      console.error('Error toggling dark mode:', error);
    }
  }, [isDarkMode, toggleAnimation]);
  
  // Safe navigation function
  const safeNavigate = useCallback((routeName, params = {}) => {
    try {
      if (navigationRef.current) {
        navigationRef.current.navigate(routeName, params);
      }
    } catch (error) {
      console.error(`Error navigating to ${routeName}:`, error);
    }
  }, []);
  
  // Load featured restaurants on initial render
  useEffect(() => {
    let mounted = true;
    
    const loadFeaturedRestaurants = async () => {
      if (!mounted) return;
      
      setLoading(true);
      try {
        // Get the best location (user or cached) - can be null
        let locationToUse = userLocation;
        
        if (!locationToUse) {
          // Use LocationService's getBestLocation
          locationToUse = await LocationService.getBestLocation();
          console.log('Using best available location for featured restaurants:', locationToUse);
        }
        
        // Only search for restaurants if we have a location
        if (locationToUse) {
          console.log('Using location for featured restaurants:', locationToUse);
          
          // Get restaurants from API
          const restaurants = await searchRestaurantsForFood('popular restaurants', locationToUse);
          
          if (!mounted) return;
          
          if (restaurants && restaurants.length > 0) {
            setFeaturedRestaurants(restaurants.slice(0, 3));
          } else {
            // Set empty restaurants without showing alert
            setFeaturedRestaurants([]);
          }
        } else {
          // No location available
          console.log('No location available for featured restaurants');
          setFeaturedRestaurants([]);
        }
      } catch (error) {
        // Handle error silently with console.log instead of error
        console.log('Silently handling featured restaurants error');
        
        if (!mounted) return;
        
        // Set empty state without showing alert
        setFeaturedRestaurants([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    // Load featured restaurants when component mounts or location changes
    loadFeaturedRestaurants();
    
    return () => {
      mounted = false;
    };
  }, [userLocation]); // Add userLocation as dependency
  
  // Function to get the best available location (cached only)
  const getSafeLocation = async () => {
    // If we already have userLocation in state, use that first
    if (userLocation) {
      return userLocation;
    }
    
    // Otherwise, use the LocationService's getBestLocation 
    try {
      const bestLocation = await LocationService.getBestLocation();
      return bestLocation; // This can be null
    } catch (error) {
      console.log('Error in getSafeLocation');
      return null;
    }
  };

  // Handle refresh
  const onRefresh = useCallback(() => {
    try {
      setRefreshing(true);
      
      // Reload featured restaurants
      const reloadRestaurants = async () => {
        try {
          // First, try to get an updated location
          let locationToUse = userLocation;
          
          if (!locationToUse) {
            try {
              // Try to get a new location first
              const newLocation = await LocationService.getCurrentLocation(false);
              if (isMounted.current && newLocation) {
                setUserLocation(newLocation);
                locationToUse = newLocation;
              } else if (isMounted.current) {
                // If we can't get a new location, try cached
                const cachedLocation = await LocationService.getBestLocation();
                console.log('Using cached location for refresh:', cachedLocation);
                locationToUse = cachedLocation; // Can be null
              }
            } catch (error) {
              console.log('Error getting location for refresh');
              locationToUse = null;
            }
          }
          
          // Only search for restaurants if we have a location
          if (locationToUse) {
            console.log('Refreshing restaurants with location:', locationToUse);
            
            const restaurants = await searchRestaurantsForFood('popular restaurants', locationToUse);
            if (isMounted.current) {
              if (restaurants && restaurants.length > 0) {
                setFeaturedRestaurants(restaurants.slice(0, 3));
              } else {
                // No restaurants found
                setFeaturedRestaurants([]);
              }
            }
          } else {
            // No location available
            console.log('No location available for refresh');
            if (isMounted.current) {
              setFeaturedRestaurants([]);
            }
          }
        } catch (error) {
          // Handle errors silently
          console.log('Silently handling reload restaurants error');
          if (isMounted.current) {
            setFeaturedRestaurants([]);
          }
        } finally {
          if (isMounted.current) {
            setRefreshing(false);
          }
        }
      };
      
      reloadRestaurants();
    } catch (error) {
      // Handle errors silently
      console.log('Silently handling refresh error');
      setRefreshing(false);
    }
  }, [userLocation]);
  
  // Update the handleSearch function to provide suggestions based on fuzzy matching when a search fails
  const handleSearch = useCallback(() => {
    try {
      if (!searchQuery.trim()) return;
      
      // Basic validation for search query
      const trimmedQuery = searchQuery.trim();
      const isOnlyNumbers = /^-?\d+$/.test(trimmedQuery);
      const isTooShort = trimmedQuery.length < 2;
      const hasSpecialCharsOnly = /^[^\w\s]+$/.test(trimmedQuery);
      
      if (isOnlyNumbers || isTooShort || hasSpecialCharsOnly) {
        Alert.alert(
          'Invalid Search',
          'Please enter a valid food name, cuisine type, or restaurant name',
          [{ text: 'OK' }]
        );
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
              { text: 'Cancel', style: 'cancel' },
              // Add buttons for the top 3 suggestions
              ...suggestions.slice(0, 3).map(s => ({
                text: s.item.term,
                onPress: () => {
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
          Alert.alert(
            'Not a Food Item',
            'Please enter a valid food item, cuisine type, or restaurant category',
            [{ text: 'OK' }]
          );
        }
        return;
      }
      
      // If we get here, it's a valid food term, so perform the search
      performSearch(trimmedQuery);
    } catch (error) {
      console.error('Search error:', error);
    }
  }, [searchQuery]);
  
  // Create a helper function to perform the actual search navigation
  const performSearch = async (query) => {
    // Add to recent searches
    setRecentSearches(prev => {
      if (!prev.includes(query)) {
        return [query, ...prev.filter(item => item !== query).slice(0, 3)];
      }
      return prev;
    });
    
    try {
      // Get best location (user or cached) - can be null
      const locationForSearch = await getSafeLocation();
      
      // Only pass serializable location data (not the Promise object)
      let serializedLocation = null;
      if (locationForSearch) {
        // Extract only the serializable properties
        serializedLocation = {
          latitude: locationForSearch.latitude,
          longitude: locationForSearch.longitude
        };
      }
      
      // Navigate to search results with serialized location data
      safeNavigate('SearchScreen', { 
        query: query,
        userLocation: serializedLocation
      });
    } catch (error) {
      console.error('Error in performSearch:', error);
      // If there's an error, just navigate with the query
      safeNavigate('SearchScreen', { query });
    }
  };

  // Handle category selection
  const handleCategoryPress = useCallback(async (category) => {
    // Add to recent searches
    setRecentSearches(prev => {
      if (!prev.includes(category)) {
        return [category, ...prev.filter(item => item !== category).slice(0, 3)];
      }
      return prev;
    });
    
    try {
      // Get best location (user or cached) - can be null
      const locationForSearch = await getSafeLocation();
      
      // Only pass serializable location data (not the Promise object)
      let serializedLocation = null;
      if (locationForSearch) {
        // Extract only the serializable properties
        serializedLocation = {
          latitude: locationForSearch.latitude,
          longitude: locationForSearch.longitude
        };
      }
      
      // Navigate to search results with serialized location data
      safeNavigate('SearchScreen', { 
        query: category,
        userLocation: serializedLocation
      });
    } catch (error) {
      console.error('Error in handleCategoryPress:', error);
      // If there's an error, just navigate with the query
      safeNavigate('SearchScreen', { query: category });
    }
  }, [safeNavigate, userLocation]);
  
  // Render a category item
  const renderCategoryItem = useCallback(({ item }) => (
    <TouchableOpacity 
      style={[
        styles.categoryItem,
        { width: SCREEN_WIDTH < 350 ? normalize(65) : normalize(70) }
      ]}
      onPress={() => handleCategoryPress(item.name)}
    >
      <View style={[
        styles.categoryIcon, 
        { 
          backgroundColor: theme.lightGray,
          borderColor: isDarkMode ? '#3A3A3A' : COLORS.lightGray,
          width: SCREEN_WIDTH < 350 ? normalize(50) : normalize(56),
          height: SCREEN_WIDTH < 350 ? normalize(50) : normalize(56),
        }
      ]}>
        <Text style={styles.categoryIconText}>{item.icon}</Text>
      </View>
      <Text style={[styles.categoryName, { color: theme.text }]}>{item.name}</Text>
    </TouchableOpacity>
  ), [handleCategoryPress, theme, isDarkMode]);
  
  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    try {
      setRecentSearches([]);
    } catch (error) {
      console.error('Clear recent searches error:', error);
    }
  }, []);
  
  // Function to toggle chat visibility
  const toggleChat = () => {
    if (chatVisible) {
      // Hide chat
      Animated.timing(chatPanelAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => setChatVisible(false));
    } else {
      // Show chat
      setChatVisible(true);
      Animated.timing(chatPanelAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  };

  // Function to generate a fallback AI response when the API fails
  const generateFallbackResponse = (userMessage) => {
    const userQuery = userMessage.toLowerCase();
    
    // Common food-related queries and responses
    if (userQuery.includes('recommend') || userQuery.includes('suggest')) {
      if (userQuery.includes('restaurant')) {
        return "I recommend trying 'Spice Garden' for authentic Indian cuisine, 'Golden Dragon' for Chinese dishes, or 'Bella Italia' for delicious Italian food. These restaurants have great reviews in your area!";
      } else if (userQuery.includes('dish') || userQuery.includes('food')) {
        return "Based on popular trends, you might enjoy trying Butter Chicken, Pad Thai, or a classic Margherita pizza. Would you like more specific recommendations?";
      }
    }
    
    if (userQuery.includes('recipe') || userQuery.includes('how to make') || userQuery.includes('cook')) {
      return "For recipes and cooking instructions, I recommend checking out specialized cooking apps or websites. Would you like me to help you find restaurants that serve this dish instead?";
    }
    
    if (userQuery.includes('hello') || userQuery.includes('hi ') || userQuery === 'hi') {
      return "Hello! 👋 I'm your FlavorSync AI assistant. How can I help you with food today?";
    }
    
    if (userQuery.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with?";
    }
    
    // Default response
    return "I'm your FlavorSync food assistant. I can help you find great restaurants and dishes. What kind of food are you interested in today?";
  };

  // Function to send message to Together API
  const sendMessage = async () => {
    if (!userInput.trim()) return;
    
    // Add user message to chat
    const newUserMessage = { role: 'user', content: userInput };
    const updatedMessages = [...chatMessages, newUserMessage];
    setChatMessages(updatedMessages);
    setUserInput('');
    setChatLoading(true);
    
    try {
      // Scroll to bottom
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollToEnd({ animated: true });
      }
      
      // Prepare context and prompt
      const messagesContext = updatedMessages
        .filter(msg => msg.role !== 'system')
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');
      
      const prompt = `
You are FlavorSync AI, a helpful food assistant. You provide concise, accurate information about food, restaurants, cuisines, and dining recommendations.

Here are some things you can help with:
- Restaurant recommendations
- Food and cuisine information
- Dietary advice
- Cooking tips and recipe ideas

Always be helpful, friendly, and provide specific information when possible. Keep responses concise and to the point.

The following is a conversation with a user:

${messagesContext}

User: ${userInput}
Assistant:`;
      
      // Add timeout for API request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Call Together API
      const response = await fetch(TOGETHER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOGETHER_API_KEY}`
        },
        body: JSON.stringify({
          model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
          prompt: prompt,
          max_tokens: 250,
          temperature: 0.7,
          top_p: 0.9,
          n: 1,
          stream: false
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error Response:', response.status, errorData);
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        const assistantMessage = {
          role: 'assistant',
          content: data.choices[0].text.trim()
        };
        
        setChatMessages([...updatedMessages, assistantMessage]);
        
        // Scroll to bottom after response
        setTimeout(() => {
          if (chatScrollRef.current) {
            chatScrollRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      
      // Generate a fallback response instead of showing an error
      const fallbackResponse = generateFallbackResponse(userInput);
      setChatMessages([
        ...updatedMessages,
        { 
          role: 'assistant', 
          content: fallbackResponse,
          _apiError: true // Flag to identify fallback responses in UI
        }
      ]);
      
      // Show error icon in the UI
      if (chatScrollRef.current) {
        setTimeout(() => {
          if (chatScrollRef.current) {
            chatScrollRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }
    } finally {
      setChatLoading(false);
    }
  };
  
  // Add this inside the HomeScreen component, somewhere near the top (after other useState, useContext hooks)
  const { logout } = useContext(AuthContext);

  // Add a handleLogout function
  const handleLogout = async () => {
    // Just call logout - App.js will handle the navigation
    await logout();
  };
  
  // Add a function to load the user data after the loadDarkModeSetting function
  useEffect(() => {
    // Load user's name from AsyncStorage
    const loadUserData = async () => {
      try {
        // First try to get data from the 'user' key which stores the authenticated user
        const userJson = await AsyncStorage.getItem('user');
        
        if (userJson) {
          // We have an authenticated user
          const parsedUser = JSON.parse(userJson);
          console.log('Loaded user data for greeting:', parsedUser);
          
          // Set user name based on available fields (name, username, or email)
          if (parsedUser.name) {
            setUserName(parsedUser.name.split(' ')[0]); // Just use the first name
          } else if (parsedUser.username) {
            setUserName(parsedUser.username);
          } else if (parsedUser.email) {
            // Use the part before @ in email as a name
            setUserName(parsedUser.email.split('@')[0]);
          }
        }
      } catch (error) {
        console.error('Error loading user data for greeting:', error);
      }
    };
    
    loadUserData();
  }, []);
  
  // Update the fetchUserLocation function in the useEffect hook to always request permission
  useEffect(() => {
    let mounted = true;
    
    const fetchUserLocation = async () => {
      try {
        console.log('HomeScreen: Attempting to get user location');
        
        // First check if we have a saved location
        const savedLocation = await LocationService.getLastLocation();
        
        if (savedLocation) {
          console.log('HomeScreen: Using saved location');
          setUserLocation(savedLocation);
        }
        
        // Always attempt to get current location with permission request
        // This will show the permission dialog if needed
        const location = await LocationService.getCurrentLocation(true, true);
        
        if (location && mounted) {
          console.log('HomeScreen: Got new location with permission');
          setUserLocation(location);
          await LocationService.saveLastLocation(location);
          
          // Reload featured restaurants with new location if needed
          if (mounted && (!featuredRestaurants || featuredRestaurants.length === 0)) {
            const restaurants = await searchRestaurantsForFood('popular restaurants', location);
            if (mounted && restaurants && restaurants.length > 0) {
              setFeaturedRestaurants(restaurants.slice(0, 3));
            }
          }
        }
      } catch (error) {
        console.error('HomeScreen: Error fetching user location:', error);
      }
    };
    
    fetchUserLocation();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  // Update the refreshLocation function to properly request permission
  const refreshLocation = async () => {
    try {
      setLoading(true);
      
      // Always request location permission when manually refreshing
      const location = await LocationService.getCurrentLocation(true, true);
      
      if (location) {
        console.log('HomeScreen: Refreshed location successful');
        setUserLocation(location);
        await LocationService.saveLastLocation(location);
        
        // Reload restaurants with new location
        const restaurants = await searchRestaurantsForFood('popular restaurants', location);
        if (restaurants && restaurants.length > 0) {
          setFeaturedRestaurants(restaurants.slice(0, 3));
        }
        
        // Show success message
        Alert.alert(
          'Location Updated',
          'Your location has been updated successfully.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error refreshing location:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle restaurant selection with proper image handling
  const handleRestaurantPress = useCallback((restaurant) => {
    try {
      // Ensure image is properly formatted as a string URI
      const imageUrl = typeof restaurant.image === 'string' ? 
        restaurant.image : 
        (restaurant.image && typeof restaurant.image.uri === 'string' ? 
          restaurant.image.uri : 
          '');
      
      // Navigate to BiteBot screen with restaurant data
      safeNavigate('BiteBot', { 
        restaurant: {
          id: restaurant.id,
          place_id: restaurant.id, // Ensure place_id is available
          name: restaurant.name,
          cuisine: restaurant.cuisine || 'Restaurant',
          rating: restaurant.rating || 4.0,
          address: restaurant.address || 'Address not available',
          priceLevel: restaurant.price || '$$',
          image: imageUrl, // Use string URL instead of object
          isDarkMode: isDarkMode
        }
      });
    } catch (error) {
      console.error('Restaurant press error:', error);
      // Show fallback alert if navigation fails
      Alert.alert(
        restaurant.name,
        'Unable to view restaurant details at this time.',
        [{ text: 'OK' }]
      );
    }
  }, [safeNavigate, isDarkMode]);
  
  // Main return statement with error handling
  try {
  return (
      <>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
          backgroundColor="transparent"
          translucent={true}
        />
        <SafeAreaView style={[styles.container, { 
          backgroundColor: theme.background
        }]}>
          {/* Add explicit status bar spacing for Android */}
          {Platform.OS === 'android' && (
            <View style={{ height: getStatusBarHeight(), backgroundColor: theme.background }} />
          )}
          
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, {
              // Adjust padding based on screen width
              paddingHorizontal: SCREEN_WIDTH < 350 ? normalize(10) : normalize(16),
              paddingTop: normalize(4)
            }]}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                colors={[COLORS.primary]} 
              />
            }
          >
            {/* Header with adjustments for small screens */}
            <View style={[styles.header, { 
              marginTop: normalize(4),
              marginBottom: normalize(8),
              flexWrap: 'wrap'
            }]}>
              <View style={{ flex: 1, minWidth: SCREEN_WIDTH < 350 ? '100%' : '60%' }}>
                <Text style={[styles.greeting, { 
                  color: theme.text,
                  fontSize: SCREEN_WIDTH < 350 ? normalize(22) : normalize(24)
                }]}>Hello, {userName}</Text>
                <Text style={[styles.subtitle, { 
                  color: theme.secondaryText,
                  fontSize: SCREEN_WIDTH < 350 ? normalize(14) : normalize(16)
                }]}>What would you like to eat today?</Text>
              </View>
              <View style={[
                styles.headerButtons,
                { marginTop: SCREEN_WIDTH < 350 ? normalize(4) : 0 }
              ]}>
                <TouchableOpacity 
                  style={[styles.themeToggleButton, { 
                    backgroundColor: theme.lightGray,
                    width: normalize(40),
                    height: normalize(40),
                    marginRight: normalize(8)
                  }]}
                  onPress={toggleDarkMode}
                >
                  <Text style={styles.themeToggleText}>
                    {isDarkMode ? '☀️' : '🌙'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.profileButton, { 
                    backgroundColor: theme.lightGray,
                    width: normalize(40),
                    height: normalize(40)
                  }]}
                  onPress={() => safeNavigate('ProfileScreen')}
                >
                  <Text style={styles.profileButtonText}>👤</Text>
                </TouchableOpacity>
              </View>
            </View>
        
            {/* Search Bar - Improved for better responsiveness */}
            <View style={[styles.searchContainer, { 
              marginVertical: normalize(12),
              paddingHorizontal: normalize(6) // Reduced horizontal padding
            }]}>
              <View style={[
                styles.searchBar, 
                { 
                  borderColor: theme.border,
                  backgroundColor: isDarkMode ? COLORS.lightGrayDark : COLORS.white,
                  height: normalize(46), // Slightly reduced height
                  marginRight: normalize(6), // Reduced margin
                  flex: 1
                }
              ]}>
                <TextInput
                  style={[styles.searchInput, { 
                    color: theme.text,
                    fontSize: normalize(14) // Slightly smaller font
                  }]}
                  placeholder="What would you like to eat today?"
                  placeholderTextColor={theme.secondaryText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setSearchQuery('')}
                    hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}
                  >
                    <Text style={styles.clearButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[styles.searchButton, { 
                  backgroundColor: COLORS.primary,
                  height: normalize(46), // Match height with input
                  paddingHorizontal: Platform.OS === 'android' ? normalize(12) : normalize(16), // Smaller padding on Android
                  minWidth: normalize(70) // Ensure minimum width
                }]}
                onPress={handleSearch}
              >
                <Text style={[styles.searchButtonText, { 
                  fontSize: normalize(15),
                  fontWeight: '700' 
                }]}>Search</Text>
              </TouchableOpacity>
            </View>
            
            {/* Popular Categories */}
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={[styles.sectionTitle, { 
                color: theme.text,
                marginTop: normalize(4),  
                marginBottom: normalize(12)
              }]}>Popular Categories</Text>
              <FlatList
                data={POPULAR_CATEGORIES}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.categoriesContainer,
                  { paddingRight: normalize(16) } // Add extra padding at end
                ]}
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                windowSize={3}
                removeClippedSubviews={true}
              />
            </Animated.View>
            
            {/* Featured Restaurants Banner */}
            <Animated.View style={{ opacity: fadeAnim, marginTop: normalize(20) }}>
              <Text style={[styles.sectionTitle, { 
                color: theme.text,
                marginBottom: normalize(12)
              }]}>Featured Restaurants</Text>
              <TouchableOpacity 
                style={styles.bannerContainer}
                onPress={async () => {
                  try {
                    // Get the location and serialize it properly
                    const locationData = await getSafeLocation();
                    let serializedLocation = null;
                    if (locationData) {
                      serializedLocation = {
                        latitude: locationData.latitude,
                        longitude: locationData.longitude
                      };
                    }
                    safeNavigate('SearchScreen', { 
                      query: 'popular',
                      userLocation: serializedLocation
                    });
                  } catch (error) {
                    console.error('Banner navigation error:', error);
                    safeNavigate('SearchScreen', { query: 'popular' });
                  }
                }}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.bannerGradient}
                  fallback={
                    <View style={[styles.bannerGradient, { backgroundColor: COLORS.primary }]} />
                  }
                >
                  <View style={styles.bannerContentContainer}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bannerTitle}>Discover Top Restaurants</Text>
                      <Text style={styles.bannerSubtitle}>Explore highly-rated places near you</Text>
            </View>
                    <Animated.View 
                      style={[
                        styles.bannerButton,
                      ]}
                    >
                      <Text style={styles.bannerButtonText}>Explore Now</Text>
                      <Text style={{marginLeft: 4, fontSize: 16, color: COLORS.primary}}>➡️</Text>
                    </Animated.View>
              </View>
                </LinearGradient>
              </TouchableOpacity>
          </Animated.View>
          
          {/* Featured Restaurants */}
            <Animated.View style={{ opacity: fadeAnim, marginTop: normalize(20) }}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { 
                  color: theme.text,
                  marginBottom: 0  // Override default margin
                }]}>Top Rated Restaurants</Text>
                <TouchableOpacity onPress={async () => {
                  try {
                    // Get the location and serialize it properly
                    const locationData = await getSafeLocation();
                    let serializedLocation = null;
                    if (locationData) {
                      serializedLocation = {
                        latitude: locationData.latitude,
                        longitude: locationData.longitude
                      };
                    }
                    safeNavigate('SearchScreen', { 
                      query: 'top rated',
                      userLocation: serializedLocation
                    });
                  } catch (error) {
                    console.error('View All navigation error:', error);
                    safeNavigate('SearchScreen', { query: 'top rated' });
                  }
                }}>
                  <Text style={[styles.viewAllText, {fontSize: 14, fontWeight: 'bold'}]}>View All</Text>
              </TouchableOpacity>
            </View>
            
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading restaurants...</Text>
                </View>
              ) : featuredRestaurants.length > 0 ? (
                featuredRestaurants.map(restaurant => (
                  <ErrorBoundaryWrapper key={restaurant.id}>
                    <RestaurantCard
                      restaurant={restaurant}
                      onPress={() => handleRestaurantPress(restaurant)}
                    />
                  </ErrorBoundaryWrapper>
                ))
              ) : (
                <View style={[styles.emptyContainer, { backgroundColor: theme.card }]}>
                  <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No restaurants available</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={onRefresh}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
              </View>
            )}
          </Animated.View>
          
            {/* Quick Links */}
            <Animated.View style={{ opacity: fadeAnim, marginTop: 24, marginBottom: 10 }}>
              <View style={styles.quickLinksContainer}>
                <TouchableOpacity 
                  style={[
                    styles.quickLinkItem, 
                    { 
                      backgroundColor: theme.card, 
                      shadowColor: theme.shadow,
                      borderColor: isDarkMode ? '#3A3A3A' : COLORS.lightGray,
                    }
                  ]}
                  onPress={async () => {
                    try {
                      // Get the location and serialize it properly
                      const locationData = await getSafeLocation();
                      let serializedLocation = null;
                      if (locationData) {
                        serializedLocation = {
                          latitude: locationData.latitude,
                          longitude: locationData.longitude
                        };
                      }
                      safeNavigate('SearchScreen', { 
                        query: 'nearby',
                        userLocation: serializedLocation 
                      });
                    } catch (error) {
                      console.error('Nearby navigation error:', error);
                      safeNavigate('SearchScreen', { query: 'nearby' });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickLinkIconContainer, {backgroundColor: 'rgba(182, 0, 0, 0.15)'}]}>
                    <Text style={styles.quickLinkIconText}>📍</Text>
                    </View>
                  <Text style={[styles.quickLinkText, { color: theme.text }]}>Nearby</Text>
            </TouchableOpacity>
        
        <TouchableOpacity 
                  style={[
                    styles.quickLinkItem, 
                    { 
                      backgroundColor: theme.card, 
                      shadowColor: theme.shadow,
                      borderColor: isDarkMode ? '#3A3A3A' : COLORS.lightGray,
                    }
                  ]}
                  onPress={async () => {
                    try {
                      // Get the location and serialize it properly
                      const locationData = await getSafeLocation();
                      let serializedLocation = null;
                      if (locationData) {
                        serializedLocation = {
                          latitude: locationData.latitude,
                          longitude: locationData.longitude
                        };
                      }
                      safeNavigate('SearchScreen', { 
                        query: 'top rated',
                        userLocation: serializedLocation 
                      });
                    } catch (error) {
                      console.error('Top Rated navigation error:', error);
                      safeNavigate('SearchScreen', { query: 'top rated' });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickLinkIconContainer, {backgroundColor: 'rgba(182, 0, 0, 0.15)'}]}>
                    <Text style={styles.quickLinkIconText}>⭐</Text>
                  </View>
                  <Text style={[styles.quickLinkText, { color: theme.text }]}>Top Rated</Text>
        </TouchableOpacity>
        
                <TouchableOpacity 
              style={[
                    styles.quickLinkItem, 
                    { 
                      backgroundColor: theme.card, 
                      shadowColor: theme.shadow,
                      borderColor: isDarkMode ? '#3A3A3A' : COLORS.lightGray,
                    }
                  ]}
                  onPress={toggleChat}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickLinkIconContainer, {backgroundColor: 'rgba(182, 0, 0, 0.15)'}]}>
                    <Text style={styles.quickLinkIconText}>🤖</Text>
                    </View>
                  <Text style={[styles.quickLinkText, { color: theme.text }]}>AI Chat</Text>
                </TouchableOpacity>
                  </View>
            </Animated.View>
          </ScrollView>
          
          {/* Chat Floating Button - hide when chat is visible */}
          <ChatFloatingButton onPress={toggleChat} isDarkMode={isDarkMode} isVisible={!chatVisible} />
          
          {/* AI Chatbot Panel */}
          {chatVisible && (
            <Animated.View style={[
              styles.chatPanel,
              chatPanelStyle,
              {
                backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
                borderColor: isDarkMode ? '#333333' : '#E0E0E0',
              }
            ]}>
              <View style={styles.chatPanelHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={{ fontSize: 24, marginRight: 10 }}>🤖</Text>
                  <Text style={[styles.chatPanelTitle, { color: theme.text }]}>
                    FlavorSync AI Assistant
                  </Text>
                </View>
                <TouchableOpacity onPress={toggleChat} style={styles.chatCloseButton}>
                  <Text style={{ fontSize: 20, color: theme.text }}>✕</Text>
                  </TouchableOpacity>
                </View>
              <ScrollView
                ref={chatScrollRef}
                style={styles.chatMessagesContainer}
                contentContainerStyle={styles.chatMessagesContent}
              >
                {chatMessages.map((message, index) => {
                  if (message.role === 'system') return null;
                  
                  return (
                    <View
                      key={index}
                      style={[
                        styles.chatMessage,
                        message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                        message.role === 'user' 
                          ? { backgroundColor: isDarkMode ? '#333' : '#E6F7FF' } 
                          : { backgroundColor: isDarkMode ? '#4A0E0E' : '#B60000' }
                      ]}
                    >
                      <Text 
                        style={[
                          styles.chatMessageText,
                          { 
                            color: message.role === 'user' 
                              ? (isDarkMode ? '#FFFFFF' : '#000000') 
                              : '#FFFFFF'
                          }
                        ]}
                      >
                        {message.content}
                      </Text>
                    </View>
                  );
                })}
                
                {chatLoading && (
                  <View style={[
                    styles.chatMessage, 
                    styles.assistantMessage,
                    { backgroundColor: isDarkMode ? '#222' : '#F0F0F0' }
                  ]}>
                    <Text style={[
                      styles.chatMessageText, 
                      { color: theme.text }
                    ]}>
                      Thinking...
                    </Text>
                  </View>
                )}
                
                {/* Error indicator if API failed but using fallback */}
                {chatMessages.length > 0 && 
                 chatMessages[chatMessages.length-1].role === 'assistant' && 
                 chatMessages[chatMessages.length-1]._apiError && (
                  <View style={{
                    alignSelf: 'center',
                    marginVertical: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    backgroundColor: isDarkMode ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 0, 0, 0.05)',
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <Text style={{
                      fontSize: 18,
                      marginRight: 6,
                      color: '#FF5252'
                    }}>⚠️</Text>
                    <Text style={{
                      fontSize: 12,
                      color: isDarkMode ? '#FF5252' : '#D32F2F',
                    }}>
                      API Error: 401 - Using fallback responses
                    </Text>
                </View>
              )}
              </ScrollView>
              
              <View style={[
                styles.chatInputContainer,
                { 
                  backgroundColor: isDarkMode ? '#222' : '#F8F8F8',
                  borderTopColor: isDarkMode ? '#333' : '#E0E0E0'
                }
              ]}>
                <TextInput
                  style={[
                    styles.chatInput,
                    { 
                    color: theme.text,
                      backgroundColor: isDarkMode ? '#333' : '#FFFFFF',
                      borderColor: isDarkMode ? '#444' : '#E0E0E0'
                    }
                  ]}
                  placeholder="Ask about food, restaurants, etc."
                  placeholderTextColor={isDarkMode ? '#999' : '#999'}
                  value={userInput}
                  onChangeText={setUserInput}
                  multiline
                  numberOfLines={1}
                  returnKeyType="send"
                  onSubmitEditing={sendMessage}
                  editable={!chatLoading}
                />
                <TouchableOpacity 
                  style={[
                    styles.chatSendButton,
                    { opacity: chatLoading || !userInput.trim() ? 0.5 : 1 }
                  ]}
                  onPress={sendMessage}
                  disabled={chatLoading || !userInput.trim()}
                >
                  <Text style={{ fontSize: 20, color: '#FFFFFF' }}>➤</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
      </SafeAreaView>
      </>
    );
  } catch (error) {
    // Fallback UI if rendering fails
    console.error('Fatal rendering error:', error);
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: COLORS.primary, marginBottom: 20 }}>
          Something went wrong. Please try again.
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 0, // Let explicit spacing handle this
  },
  scrollContent: {
    paddingBottom: normalize(80),
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Change from center to flex-start
    marginBottom: normalize(8),
    marginTop: normalize(4),
    width: '100%', // Ensure proper width
    flexWrap: 'wrap', // Allow wrapping on small screens
  },
  greeting: {
    fontSize: normalize(24),
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: 'Roboto',
    marginBottom: normalize(4),
  },
  subtitle: {
    fontSize: normalize(16),
    color: COLORS.secondaryText,
    fontFamily: 'Roboto',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // Ensure right alignment
  },
  themeToggleButton: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  profileButton: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(16),
    width: '100%', // Ensure full width
    justifyContent: 'space-between', // Better spacing
  },
  searchBar: {
    flex: 1,
    height: normalize(46),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: normalize(12),
    marginRight: normalize(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: COLORS.text,
    fontFamily: 'Roboto',
    fontSize: normalize(14),
    paddingTop: 0,
    paddingBottom: 0,
  },
  searchButton: {
    height: normalize(46),
    paddingHorizontal: normalize(12),
    borderRadius: normalize(12),
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 0,
  },
  searchButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
    fontSize: normalize(15),
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: normalize(18),
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: normalize(12),
    marginTop: normalize(8),
    fontFamily: 'Roboto',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  viewAllText: {
    fontSize: normalize(14),
    color: COLORS.primary,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
  },
  categoriesContainer: {
    paddingBottom: normalize(8),
    paddingRight: normalize(16),
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: SCREEN_WIDTH < 350 ? normalize(12) : normalize(16),
  },
  categoryIcon: {
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(6),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  categoryIconText: {
    fontSize: SCREEN_WIDTH < 350 ? normalize(20) : normalize(24),
  },
  categoryName: {
    fontSize: normalize(13),
    textAlign: 'center',
    color: COLORS.text,
    fontFamily: 'Roboto',
    maxWidth: normalize(70), // Ensure text doesn't overflow
  },
  bannerContainer: {
    height: normalize(140),
    borderRadius: normalize(16),
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  bannerGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    padding: 20,
  },
  bannerContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  bannerTitle: {
    fontSize: normalize(20),
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: normalize(6),
    fontFamily: 'Roboto',
  },
  bannerSubtitle: {
    fontSize: normalize(13),
    color: COLORS.white,
    marginBottom: 0,
    fontFamily: 'Roboto',
    opacity: 0.9,
    maxWidth: '90%',
  },
  bannerButton: {
    backgroundColor: COLORS.white,
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(10),
    alignSelf: 'center',
    marginLeft: normalize(8),
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerButtonText: {
    fontSize: normalize(14),
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: 'Roboto',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.secondaryText,
    fontFamily: 'Roboto',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.secondaryText,
    marginBottom: 12,
    fontFamily: 'Roboto',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  restaurantCard: {
    backgroundColor: COLORS.white,
    borderRadius: normalize(12),
    marginBottom: normalize(12),
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    height: normalize(120),
    borderWidth: Platform.OS === 'android' ? 0.5 : 0,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  restaurantImageContainer: {
    width: normalize(100),
    height: '100%',
    overflow: 'hidden',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantInfo: {
    flex: 1,
    padding: normalize(12),
    justifyContent: 'space-between',
  },
  restaurantName: {
    fontSize: normalize(16),
    fontWeight: 'bold',
    marginBottom: normalize(4),
    color: COLORS.text,
    fontFamily: 'Roboto',
  },
  restaurantDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: normalize(4),
  },
  restaurantType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: normalize(3),
    paddingHorizontal: normalize(8),
    borderRadius: normalize(12),
    marginRight: normalize(8),
  },
  restaurantTypeText: {
    marginLeft: normalize(4),
    fontSize: normalize(13),
    color: COLORS.text,
    fontFamily: 'Roboto',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: normalize(13),
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: 'Roboto',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: normalize(4),
  },
  locationText: {
    marginLeft: normalize(4),
    fontSize: normalize(13),
    color: COLORS.secondaryText,
    fontFamily: 'Roboto',
    maxWidth: '85%',
  },
  quickLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  quickLinkItem: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  quickLinkIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(182, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickLinkText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: 'Roboto',
  },
  errorCard: {
    backgroundColor: '#f8d7da',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorCardText: {
    fontSize: 14,
    color: '#721c24',
    textAlign: 'center',
  },
  buttonIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIconText: {
    fontSize: 22,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
  },
  quickLinkIconText: {
    fontSize: 32,
  },
  chatButtonContainer: {
    position: 'absolute',
    right: normalize(16),
    bottom: normalize(16),
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(182,0,0,0.4)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 999,
  },
  chatPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  chatPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  chatPanelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  chatCloseButton: {
    padding: 8,
  },
  chatMessagesContainer: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  chatMessage: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    marginLeft: '20%',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    marginRight: '20%',
  },
  chatMessageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Roboto',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 100,
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    fontSize: 16,
    marginRight: 8,
  },
  chatSendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  profileButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  themeToggleButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  themeToggleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#999',
  },
});

// Apply performance optimization with React.memo
export default React.memo(HomeScreen); 