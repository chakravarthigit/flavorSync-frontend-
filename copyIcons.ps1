# Copy app icons from assets/IconikAIIcons to Android app resources
Write-Host "Copying app icons from IconikAIIcons to Android resources..."

# List of mipmap directories
$densities = @("hdpi", "mdpi", "xhdpi", "xxhdpi", "xxxhdpi")

foreach ($density in $densities) {
    $srcDir = "assets/IconikAIIcons/android/mipmap-$density"
    $destDir = "android/app/src/main/res/mipmap-$density"
    
    # Ensure the destination directory exists
    if (!(Test-Path $destDir)) {
        Write-Host "Creating directory: $destDir"
        New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    }
    
    # Copy ic_launcher.png if it exists
    $srcLauncher = "$srcDir/ic_launcher.png"
    if (Test-Path $srcLauncher) {
        Write-Host "Copying $srcLauncher to $destDir"
        Copy-Item -Force $srcLauncher "$destDir/ic_launcher.png"
    } else {
        # Try the alternate filename with capital I
        $altSrcLauncher = "$srcDir/Iic_launcher.png"
        if (Test-Path $altSrcLauncher) {
            Write-Host "Copying $altSrcLauncher to $destDir"
            Copy-Item -Force $altSrcLauncher "$destDir/ic_launcher.png"
        }
    }
    
    # Copy ic_launcher_round.png if it exists
    $srcRound = "$srcDir/ic_launcher_round.png"
    if (Test-Path $srcRound) {
        Write-Host "Copying $srcRound to $destDir"
        Copy-Item -Force $srcRound "$destDir/ic_launcher_round.png"
    }
    
    # Copy ic_launcher_foreground.png if it exists
    $srcForeground = "$srcDir/ic_launcher_foreground.png"
    if (Test-Path $srcForeground) {
        Write-Host "Copying $srcForeground to $destDir"
        Copy-Item -Force $srcForeground "$destDir/ic_launcher_foreground.png"
    }
}

# Also copy the Play Store icon
$playStoreIcon = "assets/IconikAIIcons/android/playstore-icon.png"
if (Test-Path $playStoreIcon) {
    Write-Host "Copying Play Store icon to the app directory"
    Copy-Item -Force $playStoreIcon "android/app/src/main/playstore-icon.png"
}

Write-Host "All icons copied successfully!" 