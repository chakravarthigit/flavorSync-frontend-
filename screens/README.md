# App Screens Directory

This directory contains all the screen components for the FlavorSync application.

## Structure

The application uses a flat structure where all screens are located directly in the `frontend/screens/` directory rather than nested in a `src` folder. This simplifies imports and navigation throughout the app.

## Screen Components

Key screen components:
- `HomeScreen.js` - Main application screen for food discovery
- `ProfileScreen.js` - User profile management
- `SearchScreen.js` - Food and restaurant search functionality
- `LoginScreen.js` - Authentication screen
- `SignupScreen.js` - User registration
- `BiteBot.js` - AI food recommendation interface

## Development Notes

- When creating new screens, place them directly in this directory
- Use the same styling and component patterns as existing screens
- Import services from `../services/` directory
- Import components from `../components/` directory

## Directory Consolidation

In April 2025, the app's structure was consolidated from having both:
- `frontend/screens/`
- `frontend/src/screens/` 

Into a single `frontend/screens/` directory for better maintainability. If looking for older implementations, check the `frontend/src_backup/` directory. 