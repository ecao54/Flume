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
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Sign up for</Text>
          <Text style={(styles.title,styles.flume)}> Flume</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={15}
          />
          
          <Text style={styles.inputLabel}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter first name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          
          <Text style={styles.inputLabel}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter last name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
          
          <Text style={styles.inputLabel}>Starting Balance</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter starting balance"
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
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Log In</Text>
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
    backgroundColor: '#FBFBFC',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'top',
    alignItems: 'left',
    padding: 28,
    marginTop: 26,
  },
  titleContainer: {
    flexDirection: 'row',
    marginBottom: 36,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#20859E',
    fontFamily: 'Figtree',
  },
  flume: {
    fontSize: 32,
    fontWeight: '800',
    color: '#20859E',
    fontFamily: 'Figtree',
    fontStyle: 'italic'
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Figtree',
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#C4C4C5',
    borderRadius: 10,
    paddingTop: 14,
    paddingRight: 12,
    paddingBottom: 14,
    paddingLeft: 12,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'Figtree',
    fontWeight: '400'
  },
  button: {
    backgroundColor: '#62B6CB',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FBFBFC',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'FigTree',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontFamily: 'Figtree',
    fontWeight: '400',
    color: '#39393E',
    fontSize: 18,
  },
  loginText: {
    color: '#20859E',
    fontSize: 18,
    fontWeight: '400',
  },
});

export default SignupScreen;