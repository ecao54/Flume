import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView } from 'react-native';
import BLEAdvertiser from 'react-native-ble-advertiser';
import ButtonBar from '../components/ButtonBar';

const ReceiveScreen = ({ navigation, route }) => {
  const { customerId, accountId, customerName } = route.params || {};
  const [isAdvertising, setIsAdvertising] = useState(false);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  
  useEffect(() => {
    // iOS-specific setup
    BLEAdvertiser.setCompanyId(0x4C); // Apple's company ID
    
    // Clean up when component unmounts
    return () => {
      if (isAdvertising) {
        BLEAdvertiser.stopBroadcast()
          .then(() => console.log('Advertising stopped on unmount'))
          .catch(error => console.error('Error stopping advertising:', error));
      }
    };
  }, [isAdvertising]);
  
  // Timer effect
  useEffect(() => {
    let timer;
    if (isAdvertising && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isAdvertising) {
      // Stop advertising when timer reaches zero
      BLEAdvertiser.stopBroadcast()
        .then(() => {
          setIsAdvertising(false);
          console.log('Advertising stopped due to timeout');
        })
        .catch(error => console.error('Error stopping advertising:', error));
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAdvertising, timeRemaining]);
  
  const toggleAdvertising = async () => {
    try {
      setError(null);
      
      if (isAdvertising) {
        await BLEAdvertiser.stopBroadcast();
        setIsAdvertising(false);
        console.log('Stopped advertising');
      } else {
        if (!accountId) {
          setError('No account information available');
          return;
        }
        
        // Generate a unique UUID or use a fixed one for your app
        const uuid = "44C13E43-097A-9C9F-537F-5666A6840C08";
        
        // Encode account ID in major/minor values
        // This is a simplified approach - in a real app, you'd use a more secure method
        const accountIdStr = accountId.toString();
        const major = parseInt(accountIdStr.substring(0, 4), 16) || 0xCD00;
        const minor = parseInt(accountIdStr.substring(4, 8), 16) || 0x0003;
        
        await BLEAdvertiser.broadcast(uuid, major, minor);
        
        setIsAdvertising(true);
        setTimeRemaining(300); // Reset timer to 5 minutes
        console.log('Started advertising with account:', accountId);
      }
    } catch (error) {
      console.error('Error toggling advertising:', error);
      setError(error.message || 'Failed to start Bluetooth advertising');
      setIsAdvertising(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <Text style={styles.title}>Receive Payment</Text>
        
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{customerName || 'User'}</Text>
          <Text style={styles.accountId}>Account: {accountId ? `...${accountId.substring(accountId.length - 6)}` : 'Not available'}</Text>
        </View>
        
        <Button
          title={isAdvertising ? "Stop Receiving" : "Start Receiving"}
          onPress={toggleAdvertising}
          color="#007AFF" // iOS blue
        />
        
        {isAdvertising && (
          <View style={styles.indicatorContainer}>
            <View style={styles.indicator} />
            <Text style={styles.status}>Your device is visible to nearby senders</Text>
            <Text style={styles.statusDetail}>Waiting for payment...</Text>
            <Text style={styles.timer}>
              Time remaining: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </Text>
          </View>
        )}
        
        {error && (
          <Text style={styles.error}>{error}</Text>
        )}
      </SafeAreaView>
      
      <ButtonBar navigation={navigation} activeScreen="Receive" />
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
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80, // Add padding to account for the button bar
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    color: '#000000',
    fontFamily: 'System',
  },
  accountInfo: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  accountId: {
    fontSize: 14,
    color: '#8E8E93', // iOS gray
  },
  indicatorContainer: {
    alignItems: 'center',
    marginTop: 30,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  indicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#34C759', // iOS green
    marginBottom: 10,
  },
  status: {
    marginTop: 10,
    color: '#34C759', // iOS green
    fontWeight: '500',
  },
  statusDetail: {
    color: '#8E8E93', // iOS gray
    marginTop: 5,
    fontSize: 14,
  },
  timer: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  error: {
    color: '#FF3B30', // iOS red
    marginTop: 20,
    fontWeight: '500',
  },
});

export default ReceiveScreen;
