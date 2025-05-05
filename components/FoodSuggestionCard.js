import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const FoodSuggestionCard = ({ 
  food, 
  isDarkMode, 
  onSelectRestaurant, 
  restaurants = [],
  isLoadingRestaurants = false,
  onViewRestaurants 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigation = useNavigation();
  
  // Use a placeholder image if any issues with loading
  const placeholderImage = require('../assets/restaurant-placeholder.jpg');
  
  // Safely get image source with error handling
  const getImageSource = () => {
    try {
      if (imageError || !food || !food.imageUrl) {
        return placeholderImage;
      }
      return { uri: food.imageUrl };
    } catch (error) {
      console.log('Error getting image source:', error);
      return placeholderImage;
    }
  };
  
  // Reset image state when food changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [food?.name]);

  // Theme colors based on dark mode
  const themeColors = {
    background: isDarkMode ? '#2E2E2E' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#333333',
    subText: isDarkMode ? '#BBBBBB' : '#666666',
    accent: '#FF8A00',
    border: isDarkMode ? '#444444' : '#EEEEEE',
  };

  // Render restaurant options if available
  const renderRestaurantOptions = () => {
    if (!restaurants || !Array.isArray(restaurants)) {
      return null;
    }

    if (isLoadingRestaurants) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={themeColors.accent} />
          <Text style={[styles.loadingText, { color: themeColors.subText }]}>
            Finding places...
          </Text>
        </View>
      );
    }

    if (restaurants.length === 0) {
      return (
        <View>
          <Text style={[styles.noRestaurantsText, { color: themeColors.subText }]}>
            No restaurants found nearby
          </Text>
          {onViewRestaurants && (
            <TouchableOpacity 
              style={[styles.viewButton, { backgroundColor: themeColors.accent }]}
              onPress={onViewRestaurants}
            >
              <Text style={styles.viewButtonText}>Find Restaurants</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.restaurantsList}>
        <Text style={[styles.restaurantsTitle, { color: themeColors.text }]}>
          Try these places:
        </Text>
        {restaurants.slice(0, 3).map((restaurant, index) => {
          // Skip invalid restaurants
          if (!restaurant || !restaurant.name) {
            return null;
          }
          
          return (
            <TouchableOpacity 
              key={restaurant.id || `restaurant-${index}`}
              style={[styles.restaurantItem, { borderBottomColor: themeColors.border }]}
              onPress={() => {
                try {
                  if (onSelectRestaurant) onSelectRestaurant(restaurant);
                } catch (e) {
                  console.error('Error selecting restaurant:', e);
                }
              }}
            >
              <View style={styles.restaurantInfo}>
                <Text style={[styles.restaurantName, { color: themeColors.text }]}>
                  {restaurant.name}
                </Text>
                {restaurant.address && (
                  <Text style={[styles.restaurantAddress, { color: themeColors.subText }]} numberOfLines={1}>
                    {restaurant.address}
                  </Text>
                )}
              </View>
              <View style={styles.restaurantMeta}>
                {restaurant.rating && (
                  <Text style={styles.ratingText}>⭐ {Number(restaurant.rating).toFixed(1)}</Text>
                )}
                {restaurant.openNow !== undefined && (
                  <Text style={[
                    styles.openStatus, 
                    { color: restaurant.openNow ? '#4CAF50' : '#FF5252' }
                  ]}>
                    {restaurant.openNow ? 'Open' : 'Closed'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Safe render with error boundary
  try {
    if (!food) {
      return null;
    }
    
    const handleCardPress = () => {
      // If an onPress function is provided, use it
      if (onSelectRestaurant) {
        onSelectRestaurant(food);
      } else {
        // Otherwise navigate to the restaurant details screen
        navigation.navigate('RestaurantDetails', { restaurant: food });
      }
    };

    return (
      <TouchableOpacity 
        style={[
          styles.card, 
          isDarkMode ? styles.darkCard : {}
        ]}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          {!imageLoaded && !imageError && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF8A00" />
            </View>
          )}
          
          <Image 
            source={getImageSource()}
            style={[styles.image, imageLoaded ? {} : styles.hiddenImage]}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              console.log('Image failed to load for:', food.name);
              setImageError(true);
              setImageLoaded(true); // Show placeholder
            }}
            defaultSource={placeholderImage}
          />
        </View>
        
        <View style={styles.content}>
          <Text style={[
            styles.title, 
            isDarkMode ? styles.darkText : {}
          ]}>
            {food.name || 'Food Option'}
          </Text>
          
          {food.description && (
            <Text style={[
              styles.description, 
              isDarkMode ? styles.darkSubText : {}
            ]} numberOfLines={2}>
              {food.description}
            </Text>
          )}
          
          {food.cuisine && (
            <Text style={[
              styles.cuisine, 
              isDarkMode ? styles.darkSubText : {}
            ]}>
              {food.cuisine}
            </Text>
          )}
          
          {/* Restaurant Options */}
          <View style={styles.restaurantsContainer}>
            <Text style={[
              styles.restaurantsTitle, 
              isDarkMode ? styles.darkSubText : {}
            ]}>
              Available at:
            </Text>
            
            {isLoadingRestaurants ? (
              <ActivityIndicator size="small" color="#FF8A00" style={styles.loadingIndicator} />
            ) : restaurants && restaurants.length > 0 ? (
              <View>
                {restaurants.slice(0, 2).map((restaurant, index) => (
                  <TouchableOpacity
                    key={`${restaurant.id || index}`}
                    style={styles.restaurantItem}
                    onPress={() => {
                      try {
                        if (onSelectRestaurant) onSelectRestaurant(restaurant);
                      } catch (error) {
                        console.error('Error handling restaurant press:', error);
                      }
                    }}
                  >
                    <Text style={[
                      styles.restaurantName, 
                      isDarkMode ? styles.darkSubText : {}
                    ]} numberOfLines={1}>
                      {restaurant.name}
                      {restaurant.distance ? ` • ${restaurant.distance}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                {restaurants.length > 2 && (
                  <Text style={[
                    styles.moreRestaurants, 
                    isDarkMode ? styles.darkSubText : {}
                  ]}>
                    +{restaurants.length - 2} more options
                  </Text>
                )}
              </View>
            ) : (
              <Text style={[
                styles.noRestaurants, 
                isDarkMode ? styles.darkSubText : {}
              ]}>
                No restaurants found nearby
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  } catch (error) {
    console.error('Error rendering FoodSuggestionCard:', error);
    // Fallback UI in case of render error
    return (
      <View style={[styles.card, isDarkMode ? styles.darkCard : {}]}>
        <Text style={[styles.title, isDarkMode ? styles.darkText : {}]}>
          {food?.name || 'Food Option'}
        </Text>
        <Text style={[styles.description, isDarkMode ? styles.darkSubText : {}]}>
          Error displaying this suggestion
        </Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 8,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkCard: {
    backgroundColor: '#2E2E2E',
  },
  imageContainer: {
    width: 100,
    height: 120,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  hiddenImage: {
    opacity: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    zIndex: 1,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cuisine: {
    fontSize: 12,
    color: '#FF8A00',
    marginBottom: 8,
  },
  restaurantsContainer: {
    marginTop: 4,
  },
  restaurantsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  restaurantItem: {
    marginVertical: 2,
  },
  restaurantInfo: {
    flex: 1,
    marginRight: 8,
  },
  restaurantName: {
    fontSize: 12,
    color: '#666',
  },
  restaurantAddress: {
    fontSize: 12,
  },
  restaurantMeta: {
    alignItems: 'flex-end',
  },
  ratingText: {
    fontSize: 12,
    color: '#FF8A00',
    marginBottom: 2,
  },
  openStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingIndicator: {
    marginVertical: 4,
  },
  noRestaurants: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  moreRestaurants: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    fontStyle: 'italic',
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkSubText: {
    color: '#BBBBBB',
  },
  viewButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  }
});

export default FoodSuggestionCard; 