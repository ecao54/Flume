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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [balance, setBalance] = useState('1000');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSignup = async () => {
    // Validate inputs
    if (!firstName || !lastName) {
      Alert.alert('Error', 'Please fill in your name');
      return;
    }
    
    setIsLoading(true);
    try {
      // Generate a simple userId
      const userId = 'user_' + Date.now().toString();
      
      // Create user profile
      const userProfile = {
        userId,
        firstName,
        lastName,
        balance: parseFloat(balance) || 1000,
        createdAt: new Date().toISOString()
      };
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
      
      navigation.reset({
        index: 0,
        routes: [{ 
          name: 'Home', 
          params: { 
            userId: userId,
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
    backgroundColor: '#F2F2F7', // iOS light background
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
  loginText: {
    color: '#007AFF', // iOS blue
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SignupScreen;
