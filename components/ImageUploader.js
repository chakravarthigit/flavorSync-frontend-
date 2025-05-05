import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../utils/storage';

const ImageUploader = ({ onImageUploaded, folder = 'images/', defaultImage = null }) => {
  const [image, setImage] = useState(defaultImage);
  const [uploading, setUploading] = useState(false);

  // Request permissions and pick an image from the device's library
  const pickImage = async () => {
    try {
      // Request permission to access the media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload images');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setImage(selectedImage.uri);
        await handleUpload(selectedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Handle the upload process
  const handleUpload = async (imageUri) => {
    if (!imageUri) return;
    
    setUploading(true);
    try {
      const downloadUrl = await uploadImage(imageUri, folder);
      setUploading(false);
      
      // Call the callback with the download URL
      if (onImageUploaded) {
        onImageUploaded(downloadUrl);
      }
    } catch (error) {
      setUploading(false);
      console.error('Error uploading:', error);
      Alert.alert('Upload Failed', 'Failed to upload the image. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Tap to select an image</Text>
          </View>
        )}
        
        {uploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FF8A00" />
          </View>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={pickImage} disabled={uploading}>
        <Text style={styles.buttonText}>
          {image ? 'Change Image' : 'Select Image'}
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
    ...StyleSheet.absoluteFillObject,
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

export default ImageUploader; 