import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache expiration time (1 hour in milliseconds)
const CACHE_EXPIRATION = 60 * 60 * 1000;

/**
 * Generates food suggestions based on user's mood and time of day
 * @param {string} mood - The user's selected mood
 * @param {string} timeOfDay - The selected time of day (optional)
 * @param {object} location - User's location coordinates (optional)
 * @returns {Promise<object>} - Food suggestions with description and image references
 */
export const generateFoodSuggestions = async (mood, timeOfDay = null, location = null) => {
  try {
    console.log(`Getting suggestions for mood: ${mood}`);
    
    // Auto-detect time of day if not provided
    if (!timeOfDay) {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        timeOfDay = 'morning';
      } else if (hour >= 12 && hour < 17) {
        timeOfDay = 'afternoon';
      } else if (hour >= 17 && hour < 22) {
        timeOfDay = 'evening';
      } else {
        timeOfDay = 'night';
      }
      console.log(`Auto-detected time of day: ${timeOfDay}`);
    }
    
    // Check cache first
    const cacheKey = `food_suggestions_${mood}_${timeOfDay}`;
    try {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const now = new Date().getTime();
        
        // Use cache if it's less than 1 hour old
        if (now - timestamp < CACHE_EXPIRATION) {
          console.log('Using cached food suggestions');
          return data;
        }
      }
    } catch (cacheError) {
      console.log('Cache error, proceeding to fallback:', cacheError);
    }
    
    // Get fallback suggestions
    const fallbackData = getFallbackSuggestions(mood, timeOfDay);
    
    // Cache the fallback results
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        data: fallbackData,
        timestamp: new Date().getTime()
      }));
    } catch (cacheError) {
      console.log('Error caching data:', cacheError);
    }
    
    return fallbackData;
  } catch (error) {
    console.error('Error in generateFoodSuggestions:', error);
    return getFallbackSuggestions(mood, timeOfDay || 'afternoon');
  }
};

/**
 * Get fallback suggestions if the API call fails
 * @param {string} mood - The user's selected mood
 * @param {string} timeOfDay - The selected time of day
 * @returns {object} - Fallback food suggestions
 */
const getFallbackSuggestions = (mood, timeOfDay) => {
  console.log(`Providing fallback suggestions for ${mood} during ${timeOfDay}`);
  
  // Predefined fallback suggestions based on mood and time
  const fallbackMap = {
    happy: {
      morning: {
        foods: [
          {
            name: 'Fruit Bowl with Yogurt',
            description: 'A colorful bowl of fresh fruits with yogurt to keep your happy mood going',
            cuisine: 'Breakfast, Café',
            imageQuery: 'fruit bowl yogurt breakfast'
          },
          {
            name: 'Blueberry Pancakes',
            description: 'Fluffy pancakes with sweet blueberries to celebrate your good mood',
            cuisine: 'American, Breakfast',
            imageQuery: 'blueberry pancakes'
          },
          {
            name: 'Avocado Toast',
            description: 'A trendy, nutritious breakfast that will sustain your positive energy',
            cuisine: 'Café, Brunch',
            imageQuery: 'avocado toast breakfast'
          }
        ]
      },
      afternoon: {
        foods: [
          {
            name: 'Mediterranean Salad',
            description: 'A fresh, vibrant salad to maintain your upbeat afternoon mood',
            cuisine: 'Mediterranean, Health Food',
            imageQuery: 'mediterranean salad feta'
          },
          {
            name: 'Sushi Roll',
            description: 'Colorful, delicious sushi to match your happy mood',
            cuisine: 'Japanese, Sushi',
            imageQuery: 'colorful sushi rolls'
          },
          {
            name: 'Tacos',
            description: 'Fun and flavorful tacos to share with friends',
            cuisine: 'Mexican, Street Food',
            imageQuery: 'street tacos'
          }
        ]
      },
      evening: {
        foods: [
          {
            name: 'Pizza',
            description: 'A delicious pizza to share during your happy evening',
            cuisine: 'Italian, Pizzeria',
            imageQuery: 'artisan pizza'
          },
          {
            name: 'BBQ Ribs',
            description: 'Satisfying BBQ ribs to continue your great day',
            cuisine: 'American, BBQ',
            imageQuery: 'bbq ribs glazed'
          },
          {
            name: 'Pad Thai',
            description: 'A flavorful noodle dish that pairs well with your positive mood',
            cuisine: 'Thai, Asian Fusion',
            imageQuery: 'pad thai noodles'
          }
        ]
      },
      night: {
        foods: [
          {
            name: 'Ice Cream Sundae',
            description: 'A sweet treat to end your happy day on a high note',
            cuisine: 'Dessert, Ice Cream Parlor',
            imageQuery: 'ice cream sundae dessert'
          },
          {
            name: 'Chocolate Fondue',
            description: 'A fun, interactive dessert to enjoy during your happy night',
            cuisine: 'Dessert, Fondue',
            imageQuery: 'chocolate fondue strawberries'
          },
          {
            name: 'Nachos',
            description: 'A shareable snack perfect for late night enjoyment',
            cuisine: 'Mexican, Bar Food',
            imageQuery: 'loaded nachos cheese'
          }
        ]
      }
    },
    sad: {
      morning: {
        foods: [
          {
            name: 'Oatmeal with Cinnamon & Honey',
            description: 'A warm, comforting breakfast to lift your spirits',
            cuisine: 'Breakfast, Comfort Food',
            imageQuery: 'warm oatmeal honey cinnamon'
          },
          {
            name: 'Chocolate Croissant',
            description: 'A sweet, indulgent pastry to boost your mood',
            cuisine: 'French, Bakery',
            imageQuery: 'chocolate croissant'
          },
          {
            name: 'Egg & Cheese Sandwich',
            description: 'A satisfying sandwich with protein to start improving your day',
            cuisine: 'Breakfast, Deli',
            imageQuery: 'egg cheese breakfast sandwich'
          }
        ]
      },
      afternoon: {
        foods: [
          {
            name: 'Mac & Cheese',
            description: 'A classic comfort food to lift your spirits',
            cuisine: 'American, Comfort Food',
            imageQuery: 'creamy mac and cheese'
          },
          {
            name: 'Chicken Noodle Soup',
            description: 'A warm, soothing soup that feels like a hug in a bowl',
            cuisine: 'Home-style, Comfort Food',
            imageQuery: 'homemade chicken noodle soup'
          },
          {
            name: 'Grilled Cheese Sandwich',
            description: 'A simple, satisfying sandwich that provides comfort',
            cuisine: 'American, Diner',
            imageQuery: 'grilled cheese sandwich'
          }
        ]
      },
      evening: {
        foods: [
          {
            name: 'Lasagna',
            description: 'A hearty, layered pasta dish to provide comfort',
            cuisine: 'Italian, Comfort Food',
            imageQuery: 'homemade lasagna'
          },
          {
            name: 'Mashed Potatoes & Gravy',
            description: 'Creamy, comforting side dish that soothes the soul',
            cuisine: 'American, Comfort Food',
            imageQuery: 'creamy mashed potatoes gravy'
          },
          {
            name: 'Beef Stew',
            description: 'A warm, hearty stew to wrap you in comfort',
            cuisine: 'Home-style, Comfort Food',
            imageQuery: 'beef stew vegetables'
          }
        ]
      },
      night: {
        foods: [
          {
            name: 'Chocolate Brownie',
            description: 'A rich, chocolatey treat to elevate your mood',
            cuisine: 'Dessert, Bakery',
            imageQuery: 'fudge brownie dessert'
          },
          {
            name: 'Hot Chocolate',
            description: 'A warm, sweet drink to comfort you at night',
            cuisine: 'Beverage, Café',
            imageQuery: 'hot chocolate whipped cream'
          },
          {
            name: 'Cookie Dough Ice Cream',
            description: 'A sweet, indulgent treat to improve your mood',
            cuisine: 'Dessert, Ice Cream',
            imageQuery: 'cookie dough ice cream'
          }
        ]
      }
    },
    tired: {
      morning: {
        foods: [
          {
            name: 'Espresso with Toast',
            description: 'A quick energy boost to start your morning',
            cuisine: 'Café, Breakfast',
            imageQuery: 'espresso toast jam'
          },
          {
            name: 'Smoothie Bowl',
            description: 'A nutrient-rich breakfast that is easy to eat and energizing',
            cuisine: 'Health Food, Breakfast',
            imageQuery: 'smoothie bowl fruits'
          },
          {
            name: 'Energy Oatmeal',
            description: 'Slow-release carbs with nuts and fruits to maintain energy',
            cuisine: 'Breakfast, Health Food',
            imageQuery: 'oatmeal nuts berries'
          }
        ]
      },
      afternoon: {
        foods: [
          {
            name: 'Buddha Bowl',
            description: 'A balanced bowl of grains, vegetables, and protein for sustained energy',
            cuisine: 'Health Food, Fusion',
            imageQuery: 'buddha bowl vegetables'
          },
          {
            name: 'Chicken Wrap',
            description: 'Protein-packed lunch to boost your energy levels',
            cuisine: 'Casual, Deli',
            imageQuery: 'chicken avocado wrap'
          },
          {
            name: 'Trail Mix',
            description: 'A quick, energizing snack with nuts and dried fruits',
            cuisine: 'Snack, Health Food',
            imageQuery: 'trail mix nuts dried fruits'
          }
        ]
      },
      evening: {
        foods: [
          {
            name: 'Salmon with Quinoa',
            description: 'Omega-3 rich fish with protein-packed quinoa for restoring energy',
            cuisine: 'Seafood, Health Food',
            imageQuery: 'grilled salmon quinoa'
          },
          {
            name: 'Veggie Stir Fry',
            description: 'A light yet nutrient-rich dinner that won\'t weigh you down',
            cuisine: 'Asian, Vegetarian',
            imageQuery: 'vegetable stir fry tofu'
          },
          {
            name: 'Sweet Potato Bowl',
            description: 'Complex carbs and vegetables to restore energy',
            cuisine: 'Health Food, Vegetarian',
            imageQuery: 'sweet potato bowl vegetables'
          }
        ]
      },
      night: {
        foods: [
          {
            name: 'Chamomile Tea & Cookies',
            description: 'A calming tea with a small sweet treat for relaxation',
            cuisine: 'Beverage, Snack',
            imageQuery: 'chamomile tea cookies'
          },
          {
            name: 'Banana Smoothie',
            description: 'A light, sleep-promoting drink with magnesium-rich banana',
            cuisine: 'Beverage, Health Food',
            imageQuery: 'banana smoothie honey'
          },
          {
            name: 'Greek Yogurt with Honey',
            description: 'Protein-rich snack that supports sleep and recovery',
            cuisine: 'Dairy, Dessert',
            imageQuery: 'greek yogurt honey nuts'
          }
        ]
      }
    },
    hungry: {
      morning: {
        foods: [
          {
            name: 'Full Breakfast Plate',
            description: 'A hearty breakfast with eggs, bacon, toast, and more to satisfy intense hunger',
            cuisine: 'American, Breakfast',
            imageQuery: 'full english breakfast plate'
          },
          {
            name: 'Breakfast Burrito',
            description: 'A filling wrap packed with eggs, cheese, beans and more',
            cuisine: 'Mexican, Breakfast',
            imageQuery: 'breakfast burrito'
          },
          {
            name: 'Steak and Eggs',
            description: 'Protein-rich dish that will keep you full for hours',
            cuisine: 'American, Breakfast',
            imageQuery: 'steak eggs breakfast'
          }
        ]
      },
      afternoon: {
        foods: [
          {
            name: 'Burger and Fries',
            description: 'A classic filling meal that satisfies big appetites',
            cuisine: 'American, Fast Food',
            imageQuery: 'gourmet burger fries'
          },
          {
            name: 'Loaded Sandwich',
            description: 'A stacked sandwich with multiple fillings to tackle hunger',
            cuisine: 'Deli, Lunch',
            imageQuery: 'loaded club sandwich'
          },
          {
            name: 'Burrito Bowl',
            description: 'A substantial bowl of rice, beans, meat and toppings',
            cuisine: 'Mexican, Fast Casual',
            imageQuery: 'burrito bowl guacamole'
          }
        ]
      },
      evening: {
        foods: [
          {
            name: 'Steak and Potatoes',
            description: 'A substantial dinner for serious hunger',
            cuisine: 'American, Steakhouse',
            imageQuery: 'steak potatoes dinner'
          },
          {
            name: 'Pasta Bolognese',
            description: 'A hearty pasta dish with rich meat sauce',
            cuisine: 'Italian, Pasta',
            imageQuery: 'pasta bolognese parmesan'
          },
          {
            name: 'All-You-Can-Eat Buffet',
            description: 'The ultimate solution for extreme hunger',
            cuisine: 'Buffet, Various',
            imageQuery: 'restaurant buffet food'
          }
        ]
      },
      night: {
        foods: [
          {
            name: 'Deep Dish Pizza',
            description: 'A filling late-night option to satisfy cravings',
            cuisine: 'Italian, Pizzeria',
            imageQuery: 'deep dish pizza'
          },
          {
            name: 'Loaded Nachos',
            description: 'A shareable platter that satisfies late-night hunger',
            cuisine: 'Mexican, Bar Food',
            imageQuery: 'loaded nachos cheese'
          },
          {
            name: 'Midnight Breakfast',
            description: 'Breakfast foods served late make a filling night meal',
            cuisine: 'Diner, Breakfast',
            imageQuery: 'midnight breakfast diner'
          }
        ]
      }
    },
    stressed: {
      morning: {
        foods: [
          {
            name: 'Avocado Smoothie',
            description: 'Nutrient-rich smoothie with stress-reducing avocado and banana',
            cuisine: 'Health Food, Breakfast',
            imageQuery: 'avocado smoothie'
          },
          {
            name: 'Dark Chocolate Oatmeal',
            description: 'Comforting oatmeal with mood-boosting dark chocolate',
            cuisine: 'Breakfast, Comfort Food',
            imageQuery: 'chocolate oatmeal berries'
          },
          {
            name: 'Green Tea & Toast',
            description: 'L-theanine in green tea helps reduce stress with simple carbs for energy',
            cuisine: 'Breakfast, Café',
            imageQuery: 'green tea toast honey'
          }
        ]
      },
      afternoon: {
        foods: [
          {
            name: 'Mediterranean Plate',
            description: 'Anti-inflammatory foods to help combat stress',
            cuisine: 'Mediterranean, Health Food',
            imageQuery: 'mediterranean plate hummus'
          },
          {
            name: 'Tuna Salad Sandwich',
            description: 'Omega-3 rich tuna helps reduce stress hormones',
            cuisine: 'Deli, Lunch',
            imageQuery: 'tuna salad sandwich'
          },
          {
            name: 'Dark Chocolate',
            description: 'A small piece of dark chocolate can reduce stress hormones',
            cuisine: 'Snack, Dessert',
            imageQuery: 'dark chocolate squares'
          }
        ]
      },
      evening: {
        foods: [
          {
            name: 'Salmon with Asparagus',
            description: 'Omega-3 rich salmon helps reduce anxiety and stress',
            cuisine: 'Seafood, Health Food',
            imageQuery: 'salmon asparagus dinner'
          },
          {
            name: 'Comfort Soup',
            description: 'A warm bowl of soup is soothing when stressed',
            cuisine: 'Comfort Food, Soup',
            imageQuery: 'chicken vegetable soup'
          },
          {
            name: 'Turkey and Sweet Potatoes',
            description: 'Tryptophan in turkey promotes calm, while sweet potatoes provide comfort',
            cuisine: 'American, Comfort Food',
            imageQuery: 'roasted turkey sweet potatoes'
          }
        ]
      },
      night: {
        foods: [
          {
            name: 'Herbal Tea and Cookies',
            description: 'Calming herbs like chamomile with a simple sweet treat',
            cuisine: 'Beverage, Snack',
            imageQuery: 'herbal tea cookies'
          },
          {
            name: 'Warm Milk with Honey',
            description: 'A traditional calming drink before bed',
            cuisine: 'Beverage, Home',
            imageQuery: 'warm milk honey'
          },
          {
            name: 'Cheese and Crackers',
            description: 'Simple comfort food with protein to stabilize mood',
            cuisine: 'Snack, Appetizer',
            imageQuery: 'cheese board crackers'
          }
        ]
      }
    }
  };
  
  // Construct a minimal response with the fallback data or most generic option
  try {
    if (fallbackMap[mood] && fallbackMap[mood][timeOfDay]) {
      return { foods: fallbackMap[mood][timeOfDay].foods };
    } else {
      // Most generic fallback if specific mood/time not found
      return { 
        foods: [
          {
            name: 'Pizza',
            description: 'A versatile, crowd-pleasing option that works for any mood',
            cuisine: 'Italian, Pizzeria',
            imageQuery: 'pepperoni pizza'
          },
          {
            name: 'Chocolate Cake',
            description: 'A sweet treat that can improve most moods',
            cuisine: 'Dessert, Bakery',
            imageQuery: 'chocolate cake slice'
          },
          {
            name: 'Burger and Fries',
            description: 'A satisfying meal that provides comfort and energy',
            cuisine: 'American, Fast Food',
            imageQuery: 'gourmet burger fries'
          }
        ]
      };
    }
  } catch (error) {
    console.error('Error getting fallback suggestions:', error);
    return { 
      foods: [
        {
          name: 'Pizza',
          description: 'A versatile, crowd-pleasing option',
          cuisine: 'Italian, Pizzeria',
          imageQuery: 'pizza'
        }
      ]
    };
  }
}; 