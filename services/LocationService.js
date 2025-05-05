import { Platform, Alert, Linking } from 'react-native';
import { PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Add cache functions for location data
const LOCATION_PERMISSION_KEY = 'location_permission_granted';
const LAST_LOCATION_KEY = 'last_known_location';
const PERMISSION_CHECK_TIMESTAMP = 'location_permission_check_timestamp';

// Function to save permission status
const savePermissionStatus = async (isGranted) => {
  try {
    await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, JSON.stringify(isGranted));
    // Also save timestamp of when we checked permission
    await AsyncStorage.setItem(PERMISSION_CHECK_TIMESTAMP, JSON.stringify(Date.now()));
    console.log('Location permission status saved:', isGranted);
  } catch (error) {
    console.error('Error saving location permission status:', error);
  }
};

// Function to get permission status
const getPermissionStatus = async () => {
  try {
    // First, get the timestamp of when we last checked permission
    const timestampStr = await AsyncStorage.getItem(PERMISSION_CHECK_TIMESTAMP);
    const timestamp = timestampStr ? JSON.parse(timestampStr) : 0;
    const now = Date.now();
    
    // If more than 1 hour has passed, we recheck the actual permission directly from the system
    if (now - timestamp > 60 * 60 * 1000) {
      console.log('Permission check timestamp expired, checking actual permission');
      const currentPermission = await checkLocationPermission();
      await savePermissionStatus(currentPermission);
      return currentPermission;
    }
    
    // Otherwise use the stored value
    const status = await AsyncStorage.getItem(LOCATION_PERMISSION_KEY);
    return status ? JSON.parse(status) : false;
  } catch (error) {
    console.error('Error getting location permission status:', error);
    return false;
  }
};

// Function to save last known location
const saveLastLocation = async (location) => {
  try {
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      console.error('Invalid location data:', location);
      return;
    }
    
    await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(location));
    console.log('Location saved to storage:', location);
  } catch (error) {
    console.error('Error saving location:', error);
  }
};

// Function to get last known location
const getLastLocation = async () => {
  try {
    const location = await AsyncStorage.getItem(LAST_LOCATION_KEY);
    if (!location) return null;
    
    const parsedLocation = JSON.parse(location);
    
    // Validate that we have latitude and longitude
    if (!parsedLocation || typeof parsedLocation.latitude !== 'number' || typeof parsedLocation.longitude !== 'number') {
      console.log('Invalid location data in storage, clearing cache');
      await AsyncStorage.removeItem(LAST_LOCATION_KEY);
      return null;
    }
    
    return parsedLocation;
  } catch (error) {
    console.error('Error getting saved location:', error);
    return null;
  }
};

/**
 * Checks if location permission has been granted - without requesting it
 * @returns {Promise<boolean>} whether permission is granted
 */
export const checkLocationPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        Geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 2000, maximumAge: 3600000 }
        );
      });
    } else {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted;
    }
  } catch (err) {
    console.log("Error checking location permission:", err);
    return false;
  }
};

/**
 * Shows an alert to request location permission with options to open settings
 * @param {function} onRetry - Function to call when user wants to retry
 */
export const showLocationPermissionAlert = (onRetry = null) => {
  Alert.alert(
    'Location Permission Required',
    'FlavorSync needs access to your location to show nearby restaurants. Please grant location permission in settings.',
    [
      {
        text: 'Open Settings',
        onPress: () => {
          if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
          } else {
            Linking.openSettings();
          }
        },
      },
      {
        text: onRetry ? 'Retry' : 'Cancel',
        style: onRetry ? 'default' : 'cancel',
        onPress: () => {
          if (onRetry) {
            setTimeout(onRetry, 500);
          }
        },
      },
    ],
    { cancelable: false }
  );
};

/**
 * Gets the user's current location, requesting permission if needed
 * @param {boolean} forceNew - Whether to force a new location update
 * @param {boolean} showPermissionAlert - Whether to show an alert if permission is denied
 * @returns {Promise<{latitude: number, longitude: number}|null>} location coordinates or null if unavailable
 */
export const getCurrentLocation = async (forceNew = false, showPermissionAlert = true) => {
  try {
    // Check if permission was previously granted
    let hasPermission = await getPermissionStatus();
    
    // If we don't have permission, request it
    if (!hasPermission) {
      console.log('No permission, requesting...');
      hasPermission = await requestLocationPermission();
      
      // If still no permission and we should show alert
      if (!hasPermission && showPermissionAlert) {
        console.log('Permission denied, showing alert');
        showLocationPermissionAlert(() => getCurrentLocation(forceNew, showPermissionAlert));
        return null;
      } else if (!hasPermission) {
        console.log('Permission denied, not showing alert');
        return null;
      }
    }
    
    // If we're not forcing a new location, check cache first
    if (!forceNew) {
      const cachedLocation = await getLastLocation();
      if (cachedLocation) {
        console.log('Using cached location');
        return cachedLocation;
      }
    }
    
    // Get current position with timeout
    return new Promise((resolve) => {
      // Define a default location as absolute fallback (can be adjusted to a popular city center)
      const defaultLocation = { latitude: 37.7749, longitude: -122.4194 }; // San Francisco
      
      // Set a shorter timeout for the first quick attempt
      const quickTimeout = Platform.OS === 'android' ? 5000 : 3000;
      
      // First, try to get a quick position with low accuracy
      Geolocation.getCurrentPosition(
        position => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          
          // Save the location to cache
          saveLastLocation(location);
          resolve(location);
          
          // After resolving, still try to get a more accurate location in the background
          // but don't make the user wait for it
          setTimeout(() => {
            Geolocation.getCurrentPosition(
              betterPosition => {
                const betterLocation = {
                  latitude: betterPosition.coords.latitude,
                  longitude: betterPosition.coords.longitude
                };
                saveLastLocation(betterLocation);
                console.log('Updated to more accurate location in background');
              },
              error => {
                console.log('Background location update failed:', error);
              },
              { 
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 0
              }
            );
          }, 500);
        },
        error => {
          console.log('Quick location attempt failed:', error);
          
          // If we can't get a quick location, try cached location
          getLastLocation().then(cachedLocation => {
            if (cachedLocation) {
              console.log('Using cached location for speed');
              resolve(cachedLocation);
              
              // Still try to get current location in background
              setTimeout(() => {
                Geolocation.getCurrentPosition(
                  position => {
                    const location = {
                      latitude: position.coords.latitude,
                      longitude: position.coords.longitude
                    };
                    saveLastLocation(location);
                    console.log('Updated cached location in background');
                  },
                  bgError => {
                    console.log('Background update failed:', bgError);
                  },
                  { 
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                  }
                );
              }, 500);
            } else {
              // No cached location, try one more time with medium timeout
              console.log('No cached location, trying medium timeout');
              Geolocation.getCurrentPosition(
                position => {
                  const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                  };
                  saveLastLocation(location);
                  resolve(location);
                },
                finalError => {
                  console.log('Final location attempt failed:', finalError);
                  
                  // Handle specific errors
                  if (finalError.code === 1 && showPermissionAlert) { // PERMISSION_DENIED
                    savePermissionStatus(false);
                    showLocationPermissionAlert(() => getCurrentLocation(true, showPermissionAlert));
                  }
                  
                  // Use default location as last resort
                  console.log('Using default location as last resort');
                  resolve(defaultLocation);
                },
                {
                  enableHighAccuracy: false, // Try with lower accuracy for speed
                  timeout: 10000,
                  maximumAge: 60000 // Accept older locations for speed
                }
              );
            }
          }).catch(() => {
            console.log('Error checking cache, using default location');
            resolve(defaultLocation);
          });
        },
        { 
          enableHighAccuracy: false, // Low accuracy for speed
          timeout: quickTimeout, 
          maximumAge: 300000 // 5 minutes - accept older locations for speed
        }
      );
    });
  } catch (error) {
    console.log('Error in getCurrentLocation:', error);
    
    // Try cached location as fallback
    try {
      const cachedLocation = await getLastLocation();
      if (cachedLocation) {
        console.log('Error in getCurrentLocation, using cached location');
        return cachedLocation;
      }
    } catch {}
    
    // Return null if no location is available
    console.log('No location available');
    return null;
  }
};

/**
 * Gets the best available location (cached or current)
 * Attempts to get current location first, then falls back to cached
 * @returns {Promise<{latitude: number, longitude: number}|null>} location coordinates or null
 */
export const getBestLocation = async () => {
  try {
    // Try to get current location without showing permission alerts
    const currentLocation = await getCurrentLocation(false, false);
    if (currentLocation) {
      console.log('Using current location from getBestLocation');
      return currentLocation;
    }
    
    // If no current location, try to get cached location
    const cachedLocation = await getLastLocation();
    if (cachedLocation) {
      console.log('Using cached location from getBestLocation');
      return cachedLocation;
    }
    
    // No location available
    console.log('No location available from getBestLocation');
    return null;
  } catch (error) {
    console.log('Error in getBestLocation:', error);
    return null;
  }
};

/**
 * Requests location permission from the user
 * @returns {Promise<boolean>} whether permission was granted
 */
export const requestLocationPermission = async () => {
  try {
    // Check if we already have permission
    const hasPermission = await checkLocationPermission();
    if (hasPermission) {
      console.log('Already have location permission');
      savePermissionStatus(true);
      return true;
    }
    
    // Request permission based on platform
    if (Platform.OS === 'ios') {
      // For iOS, ask for WhileInUse permission (less intrusive)
      return new Promise((resolve) => {
        Geolocation.requestAuthorization('whenInUse', (status) => {
          const isGranted = status === 'granted' || status === 'authorized';
          console.log('iOS location permission:', isGranted ? 'granted' : 'denied');
          savePermissionStatus(isGranted);
          resolve(isGranted);
        });
      });
    } else {
      // For Android, use PermissionsAndroid
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'FlavorSync needs access to your location to show nearby restaurants.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      console.log('Android location permission:', isGranted ? 'granted' : 'denied');
      savePermissionStatus(isGranted);
      return isGranted;
    }
  } catch (err) {
    console.error('Error requesting location permission:', err);
    savePermissionStatus(false);
    return false;
  }
};

// Function to clear location data and permission status
export const clearLocationData = async () => {
  try {
    await AsyncStorage.removeItem(LOCATION_PERMISSION_KEY);
    await AsyncStorage.removeItem(LAST_LOCATION_KEY);
    await AsyncStorage.removeItem(PERMISSION_CHECK_TIMESTAMP);
    console.log('Location data cleared');
    return true;
  } catch (error) {
    console.error('Error clearing location data:', error);
    return false;
  }
};

export default {
  getCurrentLocation,
  checkLocationPermission,
  getLastLocation,
  saveLastLocation,
  getPermissionStatus,
  savePermissionStatus,
  getBestLocation,
  requestLocationPermission,
  showLocationPermissionAlert,
  clearLocationData
}; 