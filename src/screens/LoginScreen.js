import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    try {
      // Get stored profile from AsyncStorage
      const profileData = await AsyncStorage.getItem('userProfile');
      
      if (profileData) {
        const userProfile = JSON.parse(profileData);
        
        // For a hackathon demo, we're just checking if any profile exists
        // In a real app, you'd validate credentials here
        
        navigation.reset({
          index: 0,
          routes: [{ 
            name: 'Home', 
            params: { 
              userId: userProfile.userId,
              customerName: `${userProfile.firstName} ${userProfile.lastName}`,
              balance: userProfile.balance
            } 
          }],
        });
      } else {
        // No profile found, redirect to signup
        Alert.alert(
          'No Profile Found', 
          'Please create a profile first',
          [
            {
              text: 'Create Profile',
              onPress: () => navigation.navigate('Signup')
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sign in. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Flume</Text>
      <Text style={styles.subtitle}>Bluetooth Payments</Text>
      
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F2F2F7', // iOS light background
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 50,
    color: '#8E8E93', // iOS gray
    fontFamily: 'System',
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF', // iOS blue
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#8E8E93', // iOS gray
    fontSize: 16,
  },
  signupText: {
    color: '#007AFF', // iOS blue
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoginScreen;
