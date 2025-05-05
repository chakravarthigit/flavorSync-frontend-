import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

const ImagePicker = ({ onImageSelected, defaultImage = null }) => {
  const [imageUri, setImageUri] = useState(defaultImage);
  const [loading, setLoading] = useState(false);

  // Pick an image from the device's library
  const pickImage = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 800,
      maxWidth: 800,
      quality: 0.7,
    };

    try {
      setLoading(true);
      const result = await launchImageLibrary(options);
      setLoading(false);
      
      // Check if the user cancelled the image picker
      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }
      
      // Check for errors
      if (result.errorCode) {
        console.log('ImagePicker Error: ', result.errorMessage);
        Alert.alert('Error', 'Failed to pick image: ' + result.errorMessage);
        return;
      }
      
      // If we have an asset, proceed with it
      if (result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        console.log('Selected image: ', selectedImage.uri);
        setImageUri(selectedImage.uri);
        
        // Call the callback with the local URI
        if (onImageSelected) {
          onImageSelected(selectedImage.uri);
        }
      }
    } catch (error) {
      setLoading(false);
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Tap to select an image</Text>
          </View>
        )}
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FF8A00" />
          </View>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={pickImage} disabled={loading}>
        <Text style={styles.buttonText}>
          {imageUri ? 'Change Image' : 'Select Image'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 15,
  },
  imageContainer: {
    width: 200,
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#E1E1E1',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
    textAlign: 'center',
    padding: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#FF8A00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ImagePicker; 