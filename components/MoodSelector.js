import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';

const moods = [
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'sad', emoji: '😔', label: 'Sad' },
  { id: 'hungry', emoji: '😋', label: 'Hungry' },
  { id: 'stressed', emoji: '😓', label: 'Stressed' },
  { id: 'tired', emoji: '😴', label: 'Tired' }
];

const MoodSelector = ({ selectedMood, onSelectMood, isDarkMode = false }) => {
  // Handle mood selection with error protection
  const handleMoodSelect = (mood) => {
    try {
      console.log('Mood selected:', mood);
      if (onSelectMood && typeof onSelectMood === 'function') {
        onSelectMood(mood);
      }
    } catch (error) {
      console.error('Error selecting mood:', error);
      // Don't propagate the error to prevent app crash
    }
  };
  
  // Safe render with error boundary
  try {
    return (
      <View style={styles.container}>
        <Text style={[
          styles.sectionTitle, 
          isDarkMode ? styles.darkText : {}
        ]}>
          How are you feeling today?
        </Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moodsContainer}
        >
          {moods.map((mood) => (
            <TouchableOpacity
              key={mood.id}
              style={[
                styles.moodItem,
                selectedMood === mood.id && styles.selectedMood,
                isDarkMode && styles.darkMoodItem,
                selectedMood === mood.id && isDarkMode && styles.darkSelectedMood
              ]}
              onPress={() => handleMoodSelect(mood.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={[
                styles.moodLabel,
                isDarkMode ? styles.darkText : {}
              ]}>
                {mood.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  } catch (error) {
    console.error('Error rendering MoodSelector:', error);
    // Fallback UI in case of render error
    return (
      <View style={styles.container}>
        <Text style={[styles.sectionTitle, isDarkMode ? styles.darkText : {}]}>
          How are you feeling today?
        </Text>
        <Text style={[styles.errorText, isDarkMode ? styles.darkText : {}]}>
          Unable to display mood options
        </Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  moodsContainer: {
    paddingHorizontal: 12,
  },
  moodItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    minWidth: 80,
  },
  selectedMood: {
    backgroundColor: '#FFE4CC',
    borderWidth: 1,
    borderColor: '#FF8A00',
  },
  darkMoodItem: {
    backgroundColor: '#444444',
  },
  darkSelectedMood: {
    backgroundColor: '#663500',
    borderColor: '#FF8A00',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  moodLabel: {
    fontSize: 14,
    color: '#333333',
  },
  darkText: {
    color: '#FFFFFF',
  },
  errorText: {
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
    color: '#888',
  },
});

export default MoodSelector; 