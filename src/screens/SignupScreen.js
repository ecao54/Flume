import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignupScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [balance, setBalance] = useState('1000');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSignup = async () => {
    // Validate inputs
    if (!username || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
      Alert.alert('Error', 'Username must be 3-15 characters long and contain only letters, numbers, and underscores');
      return;
    }
    
    setIsLoading(true);
    try {
      // Check if username already exists
      const existingProfiles = await AsyncStorage.getItem('userProfiles');
      const profiles = existingProfiles ? JSON.parse(existingProfiles) : [];
      
      if (profiles.some(profile => profile.username === username)) {
        Alert.alert('Error', 'Username already taken');
        setIsLoading(false);
        return;
      }
      
      // Create user profile
      const userProfile = {
        userId: username,
        username,
        firstName,
        lastName,
        balance: parseFloat(balance) || 1000,
        createdAt: new Date().toISOString()
      };
      
      // Add to profiles array
      profiles.push(userProfile);
      await AsyncStorage.setItem('userProfiles', JSON.stringify(profiles));
      
      // Save current user profile
      await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
      
      navigation.reset({
        index: 0,
        routes: [{ 
          name: 'Home', 
          params: { 
            userId: username,
            username,
            customerName: `${firstName} ${lastName}`,
            balance: parseFloat(balance) || 1000
          } 
        }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to create profile. Please try again.');
      console.error('Profile creation error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Create Profile</Text>
        <Text style={styles.subtitle}>Join Flume for seamless payments</Text>
        
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username (letters, numbers, underscores only)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={15}
          />
          
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Starting Balance"
            value={balance}
            onChangeText={setBalance}
            keyboardType="decimal-pad"
          />
          
          <TouchableOpacity 
            style={styles.button}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Create Profile</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have a profile? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: '#8E8E93',
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
    backgroundColor: '#007AFF',
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
    color: '#8E8E93',
    fontSize: 16,
  },
  loginText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SignupScreen;