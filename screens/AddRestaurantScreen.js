import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import ImagePicker from '../components/ImagePicker';

const AddRestaurantScreen = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [priceRange, setPriceRange] = useState('₹₹');
  const [rating, setRating] = useState('');
  const [restaurantImage, setRestaurantImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Handle image selection
  const handleImageSelected = (uri) => {
    setRestaurantImage(uri);
    Alert.alert('Success', 'Restaurant image selected successfully!');
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form fields
    if (!name || !cuisine || !address || !restaurantImage) {
      Alert.alert('Error', 'Please fill all required fields and select an image');
      return;
    }

    setIsLoading(true);

    try {
      // Here you would typically save this data to your backend
      // For demo purposes, we'll just show an alert
      Alert.alert(
        'Success',
        'Restaurant added successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to the home screen
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error adding restaurant:', error);
      Alert.alert('Error', 'Failed to add restaurant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Theme-based styles
  const theme = {
    backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
    cardBackgroundColor: isDarkMode ? '#272727' : '#FFFFFF',
    textColor: isDarkMode ? '#FFFFFF' : '#333333',
    inputBackgroundColor: isDarkMode ? '#333333' : '#F5F5F5',
    placeholderTextColor: isDarkMode ? '#888888' : '#999999',
    buttonColor: '#FF8A00',
    buttonTextColor: '#FFFFFF',
    borderColor: isDarkMode ? '#444444' : '#DDDDDD',
    headerTextColor: isDarkMode ? '#FFFFFF' : '#222222',
  };

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Price range options
  const priceRangeOptions = ['₹', '₹₹', '₹₹₹', '₹₹₹₹'];

  return (
    <LinearGradient
      style={styles.container}
      colors={[
        '#0D0D0D', // Cyber Black Matte
        '#161616', // Slightly lighter black
        '#1F1F1F', // Card backgrounds
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={[styles.backButtonText, { color: '#FFFFFF' }]}>←</Text>
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>
                Add New Restaurant
              </Text>
              <TouchableOpacity 
                style={[
                  styles.themeToggleButton, 
                  { 
                    backgroundColor: 'rgba(255, 107, 0, 0.2)', // Neon Orange with transparency
                  }
                ]} 
                onPress={toggleTheme}
              >
                <Text style={styles.themeToggleIcon}>☀️</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={[styles.formContainer, { backgroundColor: '#1F1F1F' }]}>  {/* Card background */}
              {/* Image Upload */}
              <Text style={[styles.label, { color: '#FFFFFF' }]}>Restaurant Image*</Text>
              <ImagePicker
                onImageSelected={handleImageSelected}
                defaultImage={restaurantImage}
              />

              {/* Restaurant Name */}
              <Text style={[styles.label, { color: '#FFFFFF' }]}>Restaurant Name*</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: '#FFFFFF',
                    borderColor: '#333333',
                    backgroundColor: 'rgba(13, 13, 13, 0.5)', // Cyber Black Matte with transparency
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter restaurant name"
                placeholderTextColor="#A0A0A0" // Subtext
              />

              {/* Cuisine */}
              <Text style={[styles.label, { color: '#FFFFFF' }]}>Cuisine*</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: '#FFFFFF',
                    borderColor: '#333333',
                    backgroundColor: 'rgba(13, 13, 13, 0.5)', // Cyber Black Matte with transparency
                  },
                ]}
                value={cuisine}
                onChangeText={setCuisine}
                placeholder="e.g., North Indian, Chinese, Italian"
                placeholderTextColor="#A0A0A0" // Subtext
              />

              {/* Price Range */}
              <Text style={[styles.label, { color: '#FFFFFF' }]}>Price Range</Text>
              <View style={styles.priceRangeContainer}>
                {priceRangeOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.priceRangeOption,
                      priceRange === option && {
                        backgroundColor: '#FF8A00',
                        borderColor: '#FF8A00',
                      },
                    ]}
                    onPress={() => setPriceRange(option)}
                  >
                    <Text
                      style={[
                        styles.priceRangeText,
                        {
                          color: priceRange === option ? '#FFFFFF' : '#FFFFFF',
                        },
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Rating */}
              <Text style={[styles.label, { color: '#FFFFFF' }]}>Rating (1-5)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: '#FFFFFF',
                    borderColor: '#333333',
                    backgroundColor: 'rgba(13, 13, 13, 0.5)', // Cyber Black Matte with transparency
                  },
                ]}
                value={rating}
                onChangeText={(text) => {
                  // Only allow numbers between 1 and 5
                  const numValue = parseFloat(text);
                  if ((numValue >= 1 && numValue <= 5) || text === '') {
                    setRating(text);
                  }
                }}
                placeholder="Enter rating (1-5)"
                placeholderTextColor="#A0A0A0" // Subtext
                keyboardType="numeric"
                maxLength={3}
              />

              {/* Address */}
              <Text style={[styles.label, { color: '#FFFFFF' }]}>Address*</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    color: '#FFFFFF',
                    borderColor: '#333333',
                    backgroundColor: 'rgba(13, 13, 13, 0.5)', // Cyber Black Matte with transparency
                  },
                ]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter complete address"
                placeholderTextColor="#A0A0A0" // Subtext
                multiline
              />

              {/* Description */}
              <Text style={[styles.label, { color: '#FFFFFF' }]}>Description</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    color: '#FFFFFF',
                    borderColor: '#333333',
                    backgroundColor: 'rgba(13, 13, 13, 0.5)', // Cyber Black Matte with transparency
                  },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Tell us about this restaurant"
                placeholderTextColor="#A0A0A0" // Subtext
                multiline
              />

              {/* Submit Button */}
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleSubmit}
              >
                <LinearGradient
                  colors={['#6D00FF', '#00FFE0']} // Deep Purple to Turquoise gradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>Add Restaurant</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  themeToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeToggleIcon: {
    fontSize: 20,
  },
  formContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#FF6B00', // Neon Orange AI Glow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceRangeOption: {
    flex: 1,
    marginHorizontal: 4,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  priceRangeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 10,
  },
  submitButtonText: {
    color: '#FFFFFF', // Main text
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddRestaurantScreen; 