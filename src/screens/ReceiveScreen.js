import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Platform,
  Alert ,
  NativeModules
} from 'react-native';
import BLEAdvertiser from 'react-native-ble-advertiser';
import ButtonBar from '../components/ButtonBar';

const BLE_COMPANY_ID = 0x4C;

const ReceiveScreen = ({ navigation, route }) => {
  const { userId, username, customerName, balance } = route.params || {};
  const [isAdvertising, setIsAdvertising] = useState(false);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes

  // Initialize BLE on component mount
  useEffect(() => {
    const initializeBLE = async () => {
      try {
        // Wait for BLE module to be ready
        if (!BLEAdvertiser) {
          throw new Error('BLE Advertiser not available');
        }

        if (Platform.OS === 'ios') {
          // Ensure BLEAdvertiser is available before calling methods
          await new Promise(resolve => setTimeout(resolve, 1000)); // Give native module time to initialize
          await BLEAdvertiser.setCompanyId(BLE_COMPANY_ID);
        }
        
        const bluetoothEnabled = await BLEAdvertiser.checkAdvertisingSupport()
          .catch(() => false);

        if (!bluetoothEnabled) {
          setError('Please enable Bluetooth to receive payments');
          return;
        }

      } catch (error) {
        console.error('BLE initialization error:', error);
        setError('Bluetooth initialization failed. Please restart the app.');
      }
    };

    initializeBLE();

    // Cleanup function
    return () => {
      if (isAdvertising) {
        stopAdvertising().catch(console.error);
      }
    };
  }, []);

  // Handle advertising timeout
  useEffect(() => {
    let timer;
    if (isAdvertising && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      stopAdvertising();
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAdvertising, timeRemaining]);

  const startAdvertising = async () => {
    try {
      if (!userId || !username) {
        setError('User profile not available');
        return;
      }
  
      // Create payload with user info, ensuring balance is a number
      const payload = {
        u: userId,
        n: username,
        b: typeof balance === 'number' ? balance : parseFloat(balance) || 0
      };
  
      // Convert payload to bytes (limited to 31 bytes for BLE)
      const payloadString = JSON.stringify(payload);
      const bytes = Array.from(new TextEncoder().encode(payloadString));
  
      await BLEAdvertiser.broadcast(userId, 0x0001, 0x0001, {
        manufacturerSpecificData: bytes,
        includeDeviceName: false
      });
  
      setIsAdvertising(true);
      setTimeRemaining(300);
      setError(null);
    } catch (error) {
      console.error('Start advertising error:', error);
      setError('Failed to start receiving. Please try again.');
    }
  };

  const stopAdvertising = async () => {
    try {
      await BLEAdvertiser.stopBroadcast();
      setIsAdvertising(false);
      setTimeRemaining(300);
    } catch (error) {
      console.error('Stop advertising error:', error);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isAdvertising) {
        stopAdvertising();
      }
    };
  }, [isAdvertising]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <Text style={styles.title}>Receive Payment</Text>
        
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{customerName || 'User'}</Text>
          <Text style={styles.username}>@{username || 'username'}</Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.button,
            isAdvertising ? styles.buttonStop : styles.buttonStart
          ]}
          onPress={isAdvertising ? stopAdvertising : startAdvertising}
        >
          <Text style={styles.buttonText}>
            {isAdvertising ? "Stop Receiving" : "Start Receiving"}
          </Text>
        </TouchableOpacity>
        
        {isAdvertising && (
          <View style={styles.indicatorContainer}>
            <View style={[styles.indicator, { backgroundColor: '#34C759' }]} />
            <Text style={styles.status}>Visible to nearby senders</Text>
            <Text style={styles.timer}>
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
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
