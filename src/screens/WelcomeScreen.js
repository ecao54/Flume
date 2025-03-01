import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.topContent}>
        <Image
          source={require('../assets/flume-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Flume</Text>
        <Text style={styles.tagline}>speedy, simple, streamlined.</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.loginButton]} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.buttonText, styles.loginText]}>Log In to Existing Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFBFC',
    justifyContent: 'space-between',
    padding: 28,
  },
  topContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  title: {
    fontSize: 72,
    fontFamily: 'Figtree',
    fontWeight: '700',
    fontStyle: "italic",
    marginBottom: 8,
    color: "#20859E",
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'Figtree',
    fontWeight: '600',
    fontSize: 20,
    color: '#62B6CB',
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 30,
  },
  button: {
    backgroundColor: '#62B6CB',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  loginButton: {
    backgroundColor: '#E9F5F5',
  },
  buttonText: {
    fontFamily: 'Figtree',
    color: '#FBFBFC',
    fontSize: 16,
    fontWeight: '700',
  },
  loginText: {
    color: '#20859E',
  },
});

export default WelcomeScreen;