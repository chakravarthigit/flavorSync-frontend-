/**
 * LocationHelper.js
 * Re-exports LocationService functionality for backward compatibility
 */

import LocationService from '../services/LocationService';

// Re-export everything from LocationService
export const {
  DEFAULT_LOCATION,
  requestLocationPermission,
  checkLocationPermission,
  getCurrentLocation
} = LocationService;

export default LocationService; 