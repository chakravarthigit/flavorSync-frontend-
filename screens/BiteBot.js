import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
  StatusBar,
  Platform,
  SafeAreaView,
  Share,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

// Google Places API Key - from the SearchScreen.js file
const GOOGLE_PLACES_API_KEY = "AIzaSyAPjVz-Cm8F28FPIEOPLVrhO27dqI_9z1M";

// Update Together API Key with the correct one from backend .env
const TOGETHER_API_KEY = "f7111033e3074c49c30afdd49692448c32d19727b8fc5b8dcd2ba11fade9605e";
const TOGETHER_API_URL = "https://api.together.xyz/v1/completions";

// Define the app theme colors
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
  black: '#1B1B1B',
  shadow: 'rgba(27, 27, 27, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.3)',
};

// Helper function to validate image URI
const isValidImageUri = (uri) => {
  if (!uri) return false;
  if (typeof uri !== 'string') return false;
  return uri.startsWith('http');
};

// Icon renderer helper function with emoji fallback
const IconRenderer = ({ iconName, size = 24, color = COLORS.primary }) => {
  // Emoji map for fallback
  const emojiMap = {
    'star': '⭐',
    'star-o': '☆',
    'star-half-o': '⭐',
    'map-marker': '📍',
    'cutlery': '🍽️',
    'arrow-left': '◀️',
    'clock-o': '⏱️',
    'refresh': '🔄',
    'phone': '📞',
    'globe': '🌐',
    'share-alt': '📤',
    'heart': '❤️',
    'heart-o': '♡',
    'comments': '💬',
    'info-circle': 'ℹ️',
    'dollar': '💰',
    'lightbulb-o': '💡',
    'rocket': '🚀',
    'thumbs-up': '👍',
    'thumbs-down': '👎',
    'utensils': '🍴',
    'smile': '😊',
    'frown': '😞',
    'meh': '😐',
    'fire': '🔥',
  };

  // Return emoji fallback
  return (
    <Text style={{ fontSize: size, color: color }}>
      {emojiMap[iconName] || '•'}
    </Text>
  );
};

const BiteBot = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Extract restaurant data and isDarkMode from route params
  const { restaurant: routeRestaurant, isDarkMode: routeIsDarkMode } = route.params || {};
  const [isDarkMode, setIsDarkMode] = useState(routeIsDarkMode || false);
  const [restaurant, setRestaurant] = useState(routeRestaurant || null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [restaurantDetails, setRestaurantDetails] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [userQuestion, setUserQuestion] = useState('');
  const [conversation, setConversation] = useState([]);
  
  // Get status bar height for proper padding
  const statusBarHeight = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24;
  
  // Theme colors based on dark mode setting
  const theme = {
    background: isDarkMode ? COLORS.backgroundDark : COLORS.background,
    text: isDarkMode ? COLORS.textDark : COLORS.text,
    secondaryText: isDarkMode ? COLORS.secondaryTextDark : COLORS.secondaryText,
    card: isDarkMode ? COLORS.lightGrayDark : COLORS.white,
    border: isDarkMode ? '#3A3A3A' : COLORS.lightGray,
    shadow: isDarkMode ? COLORS.shadowDark : COLORS.shadow,
  };

  // Fetch restaurant details
  const fetchRestaurantDetails = async (placeId) => {
    if (!placeId) {
      console.error('No place ID provided');
      setError('Restaurant information is unavailable');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching details for place ID:', placeId);
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_phone_number,website,opening_hours,formatted_address,review,price_level,geometry,photo,type&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(detailsUrl);
      
      if (!response.ok) {
        throw new Error(`API response not ok: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Place details API error: ${data.status}`);
      }
      
      return data.result;
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
      setError('Failed to load restaurant details. Please try again.');
      setLoading(false);
      return null;
    }
  };

  const getRestaurantDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!restaurant) {
        throw new Error('No restaurant data provided');
      }

      // If we already have place_id, use that to fetch details
      if (restaurant.id || restaurant.place_id) {
        const placeId = restaurant.id || restaurant.place_id;
        const details = await fetchRestaurantDetails(placeId);

        if (details) {
          // Process photos to create URLs
          let photos = [];
          if (details.photos && details.photos.length > 0) {
            photos = details.photos.map(photo => {
              const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`;
              // Validate URL
              return isValidImageUri(photoUrl) ? photoUrl : null;
            }).filter(url => url !== null);
          }

          // Process reviews
          let reviews = [];
          if (details.reviews && details.reviews.length > 0) {
            reviews = details.reviews.map(review => ({
              author: review.author_name || 'Anonymous',
              rating: review.rating || 0,
              text: review.text || '',
              time: review.time ? new Date(review.time * 1000).toLocaleDateString() : 'Unknown date'
            }));
          }

          // Create a normalized restaurant object
          const enhancedRestaurant = {
            ...restaurant,
            name: details.name || restaurant.name,
            rating: details.rating || restaurant.rating || 0,
            address: details.formatted_address || restaurant.address,
            phone: details.formatted_phone_number || restaurant.phone || 'Not available',
            website: details.website || restaurant.website || '',
            openingHours: details.opening_hours?.weekday_text || [],
            photos: photos.length > 0 ? photos : [restaurant.image].filter(Boolean),
            reviews: reviews.length > 0 ? reviews : restaurant.reviews || [],
            geometry: details.geometry?.location || null,
            cuisine: restaurant.cuisine || (details.types && details.types.length > 0 
              ? details.types[0].replace(/_/g, ' ').charAt(0).toUpperCase() + details.types[0].replace(/_/g, ' ').slice(1)
              : 'Restaurant'),
            priceLevel: details.price_level 
              ? '₹'.repeat(details.price_level) 
              : restaurant.price || '₹₹'
          };

          setRestaurantDetails(enhancedRestaurant);
          analyzeRestaurant(enhancedRestaurant);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error getting restaurant details:', error);
      setError('Failed to load restaurant details');
      setLoading(false);
    }
  };

  // Analyze restaurant using Together API
  const analyzeRestaurant = async (restaurant) => {
    if (!restaurant) return;
    
    setAnalyzing(true);
    
    try {
      console.log('Preparing analysis for:', restaurant.name);
      
      const prompt = `
You are BiteBot, an AI food critic and restaurant expert. I'm visiting a restaurant called ${restaurant.name}.

Restaurant Information:
- Name: ${restaurant.name}
- Cuisine: ${restaurant.cuisine || 'Unknown'}
- Rating: ${restaurant.rating} out of 5
- Price Level: ${restaurant.priceLevel || 'Unknown'}
- Address: ${restaurant.address || 'Unknown'}

Reviews from customers:
${restaurant.reviews && restaurant.reviews.length > 0 
  ? restaurant.reviews.map(review => 
      typeof review === 'string' 
        ? `- "${review}"` 
        : `- "${review.text || 'No text'}" (${review.rating}/5)`)
      .join('\n')
  : 'No reviews available'
}

Based on this information, provide a SHORT and CONCISE analysis of this restaurant with 3-4 bullet points maximum for each section:
1. Pros: What's good about this restaurant (3 bullet points max)
2. Cons: Any potential downsides (2 bullet points max)
3. Quick Verdict: One sentence on whether this restaurant is worth visiting and why

Keep your analysis very brief and to the point. The entire response should not exceed 10-12 lines.
`;

      console.log('Sending Together API request');
      
      // Add timeout for API request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(TOGETHER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOGETHER_API_KEY}`
        },
        body: JSON.stringify({
          model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
          prompt: prompt,
          max_tokens: 250, // Reduced token count for shorter response
          temperature: 0.7,
          top_p: 0.9,
          n: 1,
          stream: false
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error('API response error:', response.status, response.statusText);
        throw new Error(`API response error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response received successfully');
      
      if (data.choices && data.choices.length > 0) {
        setAnalysis(data.choices[0].text.trim());
      } else {
        console.warn('API response missing expected data structure:', data);
        // Use a fallback analysis based on available information
        generateFallbackAnalysis(restaurant);
      }
    } catch (error) {
      console.error('Error analyzing restaurant:', error.message);
      // Generate a fallback analysis when API fails
      generateFallbackAnalysis(restaurant);
    } finally {
      setAnalyzing(false);
    }
  };

  // Add a fallback analysis function for when the API fails
  const generateFallbackAnalysis = (restaurant) => {
    try {
      // Create a basic analysis based on the data we already have
      const rating = restaurant.rating || 0;
      let sentiment = "average";
      if (rating >= 4.5) sentiment = "excellent";
      else if (rating >= 4.0) sentiment = "very good";
      else if (rating >= 3.5) sentiment = "good";
      else if (rating < 3.0) sentiment = "below average";
      
      const fallbackAnalysis = `
Pros:
• ${rating >= 4.0 ? `Highly rated with ${rating.toFixed(1)}/5 stars` : `${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} rating of ${rating.toFixed(1)}/5`}
• ${restaurant.cuisine ? `Serves ${restaurant.cuisine} cuisine` : 'Various food options available'}
• ${restaurant.priceLevel === '$' ? 'Budget-friendly prices' : restaurant.priceLevel === '$$' ? 'Reasonably priced' : 'Upscale dining experience'}

Cons:
• ${rating < 3.5 ? 'Lower customer satisfaction ratings' : 'Limited detailed information available'}
• May have wait times during peak hours

Quick Verdict: ${restaurant.name} is ${rating >= 4.0 ? 'definitely worth visiting' : rating >= 3.0 ? 'worth considering' : 'an option to consider if in the area'} for its ${sentiment} ${restaurant.cuisine || 'food'} ${rating >= 4.0 ? 'and great ratings' : ''}.
`;
      
      setAnalysis(fallbackAnalysis);
    } catch (error) {
      console.error('Error generating fallback analysis:', error);
      setAnalysis("This restaurant has a rating of " + (restaurant.rating || 0).toFixed(1) + "/5 stars. " + 
                  "Located at " + (restaurant.address || "address unavailable") + ".");
    }
  };

  // Handle user question about the restaurant
  const handleAskQuestion = async () => {
    if (!userQuestion.trim()) return;
    
    const newQuestion = {
      type: 'user',
      content: userQuestion
    };
    
    setConversation([...conversation, newQuestion]);
    setUserQuestion('');
    
    try {
      // Create context for the bot
      const context = `
Restaurant Information:
- Name: ${restaurantDetails?.name || restaurant?.name}
- Cuisine: ${restaurantDetails?.cuisine || restaurant?.cuisine || 'Unknown'}
- Rating: ${restaurantDetails?.rating || restaurant?.rating} out of 5
- Price Level: ${restaurantDetails?.priceLevel || restaurant?.priceLevel || 'Unknown'}
- Address: ${restaurantDetails?.address || restaurant?.address || 'Unknown'}

Reviews:
${restaurantDetails?.reviews && restaurantDetails.reviews.length > 0 
  ? restaurantDetails.reviews.map(review => 
      typeof review === 'string' 
        ? `- "${review}"` 
        : `- "${review.text || 'No text'}" (${review.rating}/5)`)
      .join('\n')
  : 'No reviews available'
}
`;

      const prompt = `
You are BiteBot, an AI food critic and restaurant expert. 
You're having a conversation with someone who is asking about ${restaurantDetails?.name || restaurant?.name}.

${context}

The user asks: "${userQuestion}"

Provide a helpful, accurate, and concise response as BiteBot. Be conversational but focused on providing useful information about this specific restaurant.
`;

      // Add timeout for API request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(TOGETHER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOGETHER_API_KEY}`
        },
        body: JSON.stringify({
          model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
          prompt: prompt,
          max_tokens: 400,
          temperature: 0.7,
          top_p: 0.9,
          n: 1,
          stream: false
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API response error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      let botResponse = "I'm sorry, I couldn't process your question right now.";
      
      if (data.choices && data.choices.length > 0) {
        botResponse = data.choices[0].text.trim();
      } else {
        // Generate a basic response if API doesn't return proper structure
        botResponse = generateBasicResponse(userQuestion, restaurant);
      }
      
      const newAnswer = {
        type: 'bot',
        content: botResponse
      };
      
      setConversation(prev => [...prev, newAnswer]);
      
    } catch (error) {
      console.error('Error getting response:', error);
      
      // Generate a basic response when API fails
      const fallbackResponse = generateBasicResponse(userQuestion, restaurant);
      
      const errorResponse = {
        type: 'bot',
        content: fallbackResponse
      };
      
      setConversation(prev => [...prev, errorResponse]);
    }
  };

  // Add a helper function to generate basic responses when API fails
  const generateBasicResponse = (question, restaurant) => {
    // Convert question to lowercase for easier matching
    const q = question.toLowerCase();
    
    // Check for common questions and provide basic responses
    if (q.includes('menu') || q.includes('food') || q.includes('dish') || q.includes('eat')) {
      return `${restaurant.name} is a ${restaurant.cuisine || 'restaurant'} that likely offers typical dishes for this cuisine. You might want to check their website or call ahead for specific menu items.`;
    }
    
    if (q.includes('hour') || q.includes('open') || q.includes('time') || q.includes('close')) {
      return `I don't have the exact hours for ${restaurant.name}, but you can check their website or call them directly for the most up-to-date opening hours.`;
    }
    
    if (q.includes('price') || q.includes('expensive') || q.includes('cost') || q.includes('cheap')) {
      const priceLevel = restaurant.priceLevel || '$$';
      return `${restaurant.name} appears to be a ${priceLevel === '$' ? 'budget-friendly' : priceLevel === '$$' ? 'moderately priced' : 'higher-end'} restaurant (${priceLevel}).`;
    }
    
    if (q.includes('review') || q.includes('rating') || q.includes('good') || q.includes('bad')) {
      const rating = restaurant.rating || 0;
      return `${restaurant.name} has a rating of ${rating.toFixed(1)} out of 5 based on customer reviews.`;
    }
    
    if (q.includes('location') || q.includes('address') || q.includes('where')) {
      return `${restaurant.name} is located at: ${restaurant.address || 'Address information not available'}`;
    }
    
    // Default fallback response
    return `I'm sorry, I don't have enough information to answer that specific question about ${restaurant.name}. You might want to check their website or contact them directly.`;
  };

  // Load restaurant details when component mounts
  useEffect(() => {
    getRestaurantDetails();
  }, []);

  // Handle map directions
  const handleDirections = () => {
    if (!restaurantDetails || (!restaurantDetails.address && !restaurantDetails.geometry)) {
      Alert.alert('Location Unavailable', 'No location data available for this restaurant.');
      return;
    }

    try {
      // First try using coordinates if available (more accurate)
      let mapsUrl;
      
      if (restaurantDetails.geometry && 
          restaurantDetails.geometry.location && 
          restaurantDetails.geometry.location.lat && 
          restaurantDetails.geometry.location.lng) {
        // Use coordinates for more precise location
        const { lat, lng } = restaurantDetails.geometry.location;
        const label = encodeURIComponent(restaurantDetails.name);
        
        // Different URL schemes for iOS and Android
        if (Platform.OS === 'ios') {
          // Apple Maps format for iOS
          mapsUrl = `maps:?q=${label}&ll=${lat},${lng}`;
        } else {
          // Google Maps format for Android
          mapsUrl = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
        }
      } else {
        // Fallback to using address if coordinates not available
        const address = encodeURIComponent(restaurantDetails.address || restaurant.address);
        
        // Platform-specific schemes
        if (Platform.OS === 'ios') {
          mapsUrl = `maps:?q=${address}`;
        } else {
          mapsUrl = `geo:0,0?q=${address}`;
        }
      }
      
      // Try to open using the platform-specific URL first
      Linking.canOpenURL(mapsUrl)
        .then(supported => {
          if (supported) {
            return Linking.openURL(mapsUrl);
          } else {
            // Fallback to Google Maps web URL which works on most devices
            const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${
              encodeURIComponent(restaurantDetails.address || restaurant.address)
            }`;
            
            return Linking.openURL(fallbackUrl);
          }
        })
        .catch(error => {
          console.error('Error opening maps:', error);
          Alert.alert('Maps Error', 'Cannot open maps at this time. Please try again later.');
        });
    } catch (error) {
      console.error('Error preparing maps URL:', error);
      Alert.alert('Maps Error', 'Cannot open maps at this time. Please try again later.');
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!restaurant) return;
    
    try {
      const shareOptions = {
        title: restaurant.name,
        message: `Check out what BiteBot says about ${restaurant.name}! ${restaurant.address || ''}`,
      };

      const result = await Share.share(shareOptions);
    } catch (error) {
      console.error('Error sharing content:', error);
      Alert.alert('Share Error', 'Could not share restaurant information.');
    }
  };

  // Back button component
  const BackButton = () => (
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => navigation.goBack()}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.headerIconText}>◀️</Text>
    </TouchableOpacity>
  );

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent={true}
        />
        <View style={[styles.headerContainer, { paddingTop: statusBarHeight }]}>
          <View style={styles.header}>
            <BackButton />
            <Text style={[styles.headerTitle, { color: theme.text }]}>BiteBot</Text>
            <View style={{ width: 40 }} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading restaurant details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error || !restaurant) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent={true}
        />
        <View style={[styles.headerContainer, { paddingTop: statusBarHeight }]}>
          <View style={styles.header}>
            <BackButton />
            <Text style={[styles.headerTitle, { color: theme.text }]}>BiteBot</Text>
            <View style={{ width: 40 }} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>
            {error || 'Restaurant information unavailable'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={getRestaurantDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Get the placeholder or actual image URI
  const heroImageUri = restaurantDetails?.photos && restaurantDetails.photos.length > 0 && isValidImageUri(restaurantDetails.photos[0])
    ? restaurantDetails.photos[0]
    : isValidImageUri(restaurant.image)
      ? restaurant.image
      : 'https://via.placeholder.com/800x500/CCCCCC/666666?text=No+Image';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      
      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: statusBarHeight }]}>
        <View style={styles.header}>
          <BackButton />
          <Text style={[styles.headerTitle, { color: theme.text }]}>BiteBot</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <IconRenderer iconName="share-alt" size={22} color={isDarkMode ? COLORS.white : COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Section */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: heroImageUri }}
            style={styles.heroImage}
            resizeMode="cover"
            defaultSource={{uri: 'https://via.placeholder.com/800x500/CCCCCC/666666?text=No+Image'}}
          />
          
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={styles.heroGradient}
          />
          
          {/* Hero content */}
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{restaurant.name}</Text>
            
            <View style={styles.heroSubtitle}>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Text key={star} style={{ fontSize: 16, marginRight: 2 }}>
                    {star <= Math.floor(restaurant.rating) ? '⭐' : 
                     star === Math.ceil(restaurant.rating) && restaurant.rating % 1 >= 0.5 ? '⭐' : '☆'}
                  </Text>
                ))}
                <Text style={styles.ratingText}>
                  {restaurant.rating ? restaurant.rating.toFixed(1) : '0.0'}
                </Text>
              </View>
              
              <View style={styles.cuisineContainer}>
                <IconRenderer iconName="cutlery" size={16} color={COLORS.white} />
                <Text style={styles.cuisineText}>{restaurant.cuisine}</Text>
              </View>
              
              {restaurant.priceLevel && (
                <View style={styles.priceContainer}>
                  <Text style={styles.priceText}>{restaurant.priceLevel}</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.addressText}>{restaurant.address}</Text>
          </View>
        </View>
        
        {/* BiteBot Analysis Section */}
        <View style={[styles.analysisContainer, { backgroundColor: theme.card }]}>
          <View style={styles.analysisHeader}>
            <IconRenderer iconName="lightbulb-o" size={24} color={COLORS.primary} />
            <Text style={[styles.analysisTitle, { color: theme.text }]}>BiteBot's Quick Take</Text>
          </View>
          
          {analyzing ? (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={[styles.analyzingText, { color: theme.secondaryText }]}>
                Analyzing this restaurant...
              </Text>
            </View>
          ) : analysis ? (
            <View style={styles.analysisContent}>
              <Text style={[styles.analysisText, { color: theme.text }]}>
                {analysis}
              </Text>
            </View>
          ) : (
            <View style={styles.analysisContent}>
              <Text style={[styles.analysisText, { color: theme.secondaryText }]}>
                No analysis available. Please try again later.
              </Text>
            </View>
          )}
        </View>
        
        {/* Quick Action Button */}
        <TouchableOpacity 
          style={[styles.directionsButton, { backgroundColor: COLORS.primary }]}
          onPress={handleDirections}
        >
          <IconRenderer iconName="map-marker" size={20} color={COLORS.white} />
          <Text style={styles.directionsButtonText}>Get Directions</Text>
        </TouchableOpacity>
        
        {/* Conversation Section */}
        <View style={[styles.conversationContainer, { backgroundColor: theme.card }]}>
          <View style={styles.conversationHeader}>
            <IconRenderer iconName="comments" size={24} color={COLORS.primary} />
            <Text style={[styles.conversationTitle, { color: theme.text }]}>Ask BiteBot</Text>
          </View>
          
          {conversation.length > 0 ? (
            <View style={styles.messagesContainer}>
              {conversation.map((message, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.messageItem,
                    message.type === 'user' ? styles.userMessage : styles.botMessage,
                    message.type === 'user' 
                      ? { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' } 
                      : { backgroundColor: isDarkMode ? '#4A0E0E' : '#B60000' }
                  ]}
                >
                  <Text style={[
                    styles.messageText, 
                    { color: message.type === 'user' ? theme.text : '#FFFFFF' }
                  ]}>
                    {message.content}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noMessagesContainer}>
              <Text style={[styles.noMessagesText, { color: theme.secondaryText }]}>
                Ask BiteBot anything about this restaurant!
              </Text>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
                color: theme.text
              }]}
              placeholder="Ask a question about this restaurant..."
              placeholderTextColor={theme.secondaryText}
              value={userQuestion}
              onChangeText={setUserQuestion}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, { 
                backgroundColor: COLORS.primary,
                opacity: userQuestion.trim() ? 1 : 0.5
              }]}
              onPress={handleAskQuestion}
              disabled={!userQuestion.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Add some bottom padding */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.text,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerIconText: {
    fontSize: 24,
    color: COLORS.primary,
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  heroContainer: {
    height: height * 0.30,
    width: width,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cuisineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  cuisineText: {
    marginLeft: 5,
    fontSize: 16,
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  priceContainer: {
    marginRight: 16,
  },
  priceText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  analysisContainer: {
    borderRadius: 16,
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  analysisContent: {
    marginLeft: 4,
  },
  analysisText: {
    fontSize: 15,
    lineHeight: 22,
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  analyzingText: {
    marginLeft: 10,
    fontSize: 16,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  directionsButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: 8,
  },
  conversationContainer: {
    borderRadius: 16,
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  conversationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  messagesContainer: {
    marginBottom: 16,
  },
  messageItem: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  noMessagesContainer: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  noMessagesText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  sendButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default BiteBot; 