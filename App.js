import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

const App = () => {
  const [initialRoute, setInitialRoute] = useState('Login');
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Check if user profile exists in AsyncStorage
    const checkUserProfile = async () => {
      try {
        const profileData = await AsyncStorage.getItem('userProfile');
        if (profileData) {
          const profile = JSON.parse(profileData);
          setUserProfile(profile);
          setInitialRoute('Home');
        }
      } catch (error) {
        console.error('Error checking user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserProfile();
  }, []);

  if (isLoading) {
    return null; // or a loading screen
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
      <Stack.Navigator 
          initialRouteName={initialRoute}
          screenOptions={{
            animationEnabled: false
          }}
        >
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Signup" 
            component={SignupScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ headerShown: false }}
            initialParams={userProfile ? {
              userId: userProfile.userId,
              customerName: `${userProfile.firstName} ${userProfile.lastName}`,
              balance: userProfile.balance
            } : undefined}
          />
          <Stack.Screen 
            name="Send" 
            component={SendScreen} 
            options={{ 
              headerBackTitle: 'Back',
              headerTintColor: '#007AFF', // iOS blue
            }}
          />
          <Stack.Screen 
            name="Receive" 
            component={ReceiveScreen} 
            options={{ 
              headerBackTitle: 'Back',
              headerTintColor: '#007AFF', // iOS blue
            }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ 
              headerShown: false,
              animationEnabled: false
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
