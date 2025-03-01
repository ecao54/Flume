import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import NessieService from '../services/NessieService';
import ButtonBar from '../components/ButtonBar';

const HomeScreen = ({ navigation, route }) => {
  const { customerId, accountId, customerName } = route.params || {};
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        if (accountId) {
          const accountBalance = await NessieService.getAccountBalance(accountId);
          setBalance(accountBalance);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [accountId]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <Text style={styles.title}>Flume</Text>
        <Text style={styles.subtitle}>Seamless Bluetooth Payments</Text>
        
        <View style={styles.accountContainer}>
          <Text style={styles.greeting}>Hello, {customerName || 'User'}</Text>
          
          {isLoading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>${balance !== null ? balance.toFixed(2) : '0.00'}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('Send', { 
              customerId, 
              accountId,
              customerName 
            })}
          >
            <Text style={styles.buttonText}>Send Money</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('Receive', { 
              customerId, 
              accountId,
              customerName 
            })}
          >
            <Text style={styles.buttonText}>Receive Money</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.historyButton]} 
            onPress={() => navigation.navigate('History', { 
              customerId, 
              accountId 
            })}
          >
            <Text style={styles.buttonText}>Transaction History</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      
      <ButtonBar navigation={navigation} activeScreen="Home" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS light background
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 80, // Add padding to account for the button bar
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    color: '#8E8E93', // iOS gray
    fontFamily: 'System',
  },
  accountContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  balanceContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#8E8E93', // iOS gray
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#34C759', // iOS green
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: '#007AFF', // iOS blue
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  historyButton: {
    backgroundColor: '#5856D6', // iOS purple
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

export default HomeScreen;
