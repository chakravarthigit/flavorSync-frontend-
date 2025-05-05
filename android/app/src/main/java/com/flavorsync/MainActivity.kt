package com.flavorsync

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "FlavorSync"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
      
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // Request permissions when the activity is created
    checkAndRequestLocationPermissions()
  }
  
  private fun checkAndRequestLocationPermissions() {
    // Step 1: Check and request foreground location permissions
    val fineLocationPermission = Manifest.permission.ACCESS_FINE_LOCATION
    val coarseLocationPermission = Manifest.permission.ACCESS_COARSE_LOCATION
    
    // Check if we have foreground location permissions
    val hasFineLocation = ContextCompat.checkSelfPermission(
      this, 
      fineLocationPermission
    ) == PackageManager.PERMISSION_GRANTED
    
    val hasCoarseLocation = ContextCompat.checkSelfPermission(
      this, 
      coarseLocationPermission
    ) == PackageManager.PERMISSION_GRANTED
    
    // First request foreground location permission if needed
    if (!hasFineLocation || !hasCoarseLocation) {
      ActivityCompat.requestPermissions(
        this,
        arrayOf(fineLocationPermission, coarseLocationPermission),
        FOREGROUND_LOCATION_PERMISSION_REQUEST_CODE
      )
    } else {
      // We already have foreground permissions,
      // now check if we need background permissions (only on Android 10+)
      checkAndRequestBackgroundLocationIfNeeded()
    }
  }
  
  private fun checkAndRequestBackgroundLocationIfNeeded() {
    // Background location permission is only available on Android 10+ (API level 29+)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      val backgroundLocationPermission = Manifest.permission.ACCESS_BACKGROUND_LOCATION
      
      val hasBackgroundLocation = ContextCompat.checkSelfPermission(
        this, 
        backgroundLocationPermission
      ) == PackageManager.PERMISSION_GRANTED
      
      if (!hasBackgroundLocation) {
        // Request background location permission
        ActivityCompat.requestPermissions(
          this,
          arrayOf(backgroundLocationPermission),
          BACKGROUND_LOCATION_PERMISSION_REQUEST_CODE
        )
      }
    }
  }
  
  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<out String>,
    grantResults: IntArray
  ) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    
    when (requestCode) {
      FOREGROUND_LOCATION_PERMISSION_REQUEST_CODE -> {
        // Check if foreground location permissions were granted
        if (grantResults.isNotEmpty() && 
            grantResults[0] == PackageManager.PERMISSION_GRANTED) {
          // Foreground permissions granted, now check if we need background
          checkAndRequestBackgroundLocationIfNeeded()
        }
      }
      BACKGROUND_LOCATION_PERMISSION_REQUEST_CODE -> {
        // Background permission result - no further action needed
        if (grantResults.isNotEmpty() && 
            grantResults[0] == PackageManager.PERMISSION_GRANTED) {
          // Remove the thank you toast message
        }
      }
    }
  }
  
  companion object {
    private const val FOREGROUND_LOCATION_PERMISSION_REQUEST_CODE = 1001
    private const val BACKGROUND_LOCATION_PERMISSION_REQUEST_CODE = 1002
  }
}
