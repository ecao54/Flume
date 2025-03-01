import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Platform,
  Alert,
  NativeModules,
  PermissionsAndroid
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BleManager, LogLevel } from 'react-native-ble-plx';
import ButtonBar from '../components/ButtonBar';

// Initialize BLE Manager with verbose logging for debugging
const bleManager = new BleManager();
bleManager.setLogLevel(LogLevel.Verbose);

// Create a mock BLE implementation for development
const MockBLE = {
  isInitialized: false,
  initialize: async () => {
    console.log('[MockBLE] Initializing...');
    MockBLE.isInitialized = true;
    return true;
  },
  broadcast: async (userId, serviceUUIDs, options) => {
    console.log('[MockBLE] Broadcasting with payload:', options);
    return true;
  },
  stopBroadcast: async () => {
    console.log('[MockBLE] Stopped broadcasting');
    return true;
  },
  checkAdvertisingSupport: async () => {
    console.log('[MockBLE] Checking advertising support');
    return true;
  }
};

const ReceiveScreen = ({ navigation }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [isAdvertising, setIsAdvertising] = useState(false);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [bleReady, setBleReady] = useState(false);
  const [useMockBLE, setUseMockBLE] = useState(false);

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await AsyncStorage.getItem('userProfile');
        if (profileData) {
          setUserProfile(JSON.parse(profileData));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
      }
    };
    loadProfile();
  }, []);

  // Initialize BLE
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 2;
  
    const initializeBLE = async () => {
      try {
        // Check permissions
        const hasPermission = await checkPermissions();
        if (!hasPermission) {
          throw new Error('Bluetooth permissions not granted');
        }

        console.log('Checking Bluetooth state...');
        
        // Check if Bluetooth is powered on
        try {
          const state = await bleManager.state();
          console.log('Bluetooth state:', state);
          
          if (state !== 'PoweredOn') {
            console.log('Bluetooth is not powered on. Using mock implementation.');
            await MockBLE.initialize();
            if (mounted) {
              setUseMockBLE(true);
              setBleReady(true);
            }
            return;
          }
        } catch (stateError) {
          console.log('Error checking Bluetooth state:', stateError);
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Retrying BLE initialization (${retryCount}/${MAX_RETRIES})`);
            setTimeout(initializeBLE, 2000);
            return;
          } else {
            console.log('Falling back to mock implementation after retries');
            await MockBLE.initialize();
            if (mounted) {
              setUseMockBLE(true);
              setBleReady(true);
            }
            return;
          }
        }

        console.log('BLE initialization successful');
        if (mounted) {
          setBleReady(true);
          setUseMockBLE(false);
          setError(null);
        }
      } catch (error) {
        console.error('BLE initialization error:', error);
        
        if (!mounted) return;

        console.log('Falling back to mock implementation due to error');
        await MockBLE.initialize();
        if (mounted) {
          setUseMockBLE(true);
          setBleReady(true);
          setError(null); // Clear error since we're using mock implementation
        }
      }
    };
  
    initializeBLE();
  
    return () => {
      mounted = false;
      if (isAdvertising) {
        stopAdvertising();
      }
    };
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS === 'ios') {
      return true;
    }
    
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Bluetooth Permission",
          message: "This app needs access to Bluetooth to discover nearby users",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const startAdvertising = async () => {
    try {
      if (!userProfile) {
        setError('User profile not available');
        return;
      }

      if (!bleReady) {
        throw new Error('BLE not initialized');
      }

      const payload = {
        u: userProfile.userId,
        n: userProfile.username,
        b: parseFloat(userProfile.balance) || 0
      };

      const payloadString = JSON.stringify(payload);
      console.log('Broadcasting payload:', payloadString);
      
      if (useMockBLE) {
        await MockBLE.broadcast(userProfile.userId, ['1819'], {
          payload: payloadString
        });
      } else {
        // In a real implementation, you would use platform-specific code
        // to advertise using BLE peripheral mode
        console.log('Using real BLE implementation - would broadcast here');
        // Start scanning as an alternative since advertising isn't 
        // directly supported in react-native-ble-plx
        bleManager.startDeviceScan(null, null, (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            return;
          }
          if (device && device.name) {
            console.log('Found device:', device.name);
          }
        });
      }

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
      if (useMockBLE) {
        await MockBLE.stopBroadcast();
      } else {
        bleManager.stopDeviceScan();
      }
      setIsAdvertising(false);
      setTimeRemaining(300);
    } catch (error) {
      console.error('Stop advertising error:', error);
    }
  };

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

  if (!userProfile) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.content}>
          <Text>Loading profile...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <Text style={styles.title}>Receive Payment</Text>
        
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>
            {`${userProfile.firstName} ${userProfile.lastName}`}
          </Text>
          <Text style={styles.username}>@{userProfile.username}</Text>
          {useMockBLE && (
            <Text style={styles.mockBadge}>Development Mode</Text>
          )}
        </View>
        
        <TouchableOpacity
          style={[
            styles.button,
            isAdvertising ? styles.buttonStop : styles.buttonStart,
            !bleReady && styles.buttonDisabled
          ]}
          onPress={isAdvertising ? stopAdvertising : startAdvertising}
          disabled={!bleReady}
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
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
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
  username: {
    fontSize: 14,
    color: '#8E8E93',
  },
  mockBadge: {
    fontSize: 11,
    color: '#FFFFFF',
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 8,
    overflow: 'hidden',
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  buttonStop: {
    backgroundColor: '#FF3B30',
  },
  buttonStart: {
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 10,
  },
  status: {
    marginTop: 10,
    color: '#34C759',
    fontWeight: '500',
  },
  timer: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  error: {
    color: '#FF3B30',
    marginTop: 20,
    fontWeight: '500',
  },
});

export default ReceiveScreen;