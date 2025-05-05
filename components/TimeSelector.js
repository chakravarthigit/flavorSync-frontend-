import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const TimeSelector = ({ selectedTime, onSelectTime, isDarkMode }) => {
  // Available time periods with their corresponding icons
  const timePeriods = [
    { id: 'morning', label: 'Morning', icon: '🌅' },
    { id: 'afternoon', label: 'Afternoon', icon: '☀️' },
    { id: 'evening', label: 'Evening', icon: '🌆' },
    { id: 'night', label: 'Late Night', icon: '🌙' },
  ];

  // Theme colors based on dark mode
  const themeColors = {
    text: isDarkMode ? '#FFFFFF' : '#333333',
    subText: isDarkMode ? '#BBBBBB' : '#666666',
    background: isDarkMode ? '#2E2E2E' : '#F8F8F8',
    selectedBg: '#FF8A00',
    selectedText: '#FFFFFF',
    border: isDarkMode ? '#444444' : '#EEEEEE',
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: themeColors.text }]}>What time is it?</Text>
      <View style={styles.timeList}>
        {timePeriods.map((time) => (
          <TouchableOpacity
            key={time.id}
            style={[
              styles.timeItem,
              { backgroundColor: themeColors.background, borderColor: themeColors.border },
              selectedTime === time.id && { backgroundColor: themeColors.selectedBg }
            ]}
            onPress={() => onSelectTime(time.id)}
          >
            <Text style={styles.timeIcon}>{time.icon}</Text>
            <Text
              style={[
                styles.timeLabel,
                { color: themeColors.subText },
                selectedTime === time.id && { color: themeColors.selectedText }
              ]}
            >
              {time.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  timeList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeItem: {
    width: '23%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default TimeSelector; 