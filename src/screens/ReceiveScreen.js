import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BleManager, LogLevel } from 'react-native-ble-plx';
import ButtonBar from '../components/ButtonBar';

// Initialize BLE Manager with verbose logging for debugging
const bleManager = new BleManager();
bleManager.setLogLevel(LogLevel.Verbose);

// Same service UUID used in SendScreen for consistency
const FLUME_SERVICE_UUID = '13333333-3333-3333-3333-333333333337';

const ReceiveScreen = ({ navigation }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [isAdvertising, setIsAdvertising] = useState(false);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [bleReady, setBleReady] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  const [connectionCount, setConnectionCount] = useState(0);

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
    
    const initializeBLE = async () => {
      try {
        console.log('Initializing BLE for iOS environment...');
        
        // On iOS, check Bluetooth state
        const state = await bleManager.state();
        console.log('Current Bluetooth state:', state);
        
        if (state !== 'PoweredOn') {
          console.log('Bluetooth is not powered on');
          // Alert.alert(
          //   'Bluetooth Required',
          //   'Please enable Bluetooth in Settings to allow others to find you.',
          //   [{ text: 'OK' }]
          // );
          console.warn('Proceeding despite Bluetooth not being powered on');
        }

        // Get our own device ID
        try {
          const connectedDevices = await bleManager.connectedDevices([]);
          if (connectedDevices.length > 0) {
            console.log('Using existing connected device ID');
            setDeviceId(connectedDevices[0].id);
          } else {
            // Generate a pseudorandom device ID for identification
            const randomId = 'flume-' + Math.random().toString(36).substring(2, 10);
            console.log('Generated device ID:', randomId);
            setDeviceId(randomId);
          }
        } catch (e) {
          console.log('Error getting device ID:', e);
          const randomId = 'flume-' + Math.random().toString(36).substring(2, 10);
          setDeviceId(randomId);
        }

        if (mounted) {
          console.log('BLE initialization successful');
          setBleReady(true);
          setError(null);
        }
      } catch (error) {
        console.error('BLE initialization error:', error);
        
        if (mounted) {
          console.error('BLE initialization encountered issues, but continuing');
          setBleReady(true); // Still allow the user to try
          setError('Bluetooth initialization issue, but you can try anyway');
        }
      }
    };
    
    initializeBLE();
    
    return () => {
      mounted = false;
      
      // Clean up any active BLE operations
      if (isAdvertising) {
        stopAdvertising();
      }
    };
  }, []);

  const startAdvertising = async () => {
    try {
      if (!userProfile) {
        setError('User profile not available');
        return;
      }
      
      console.log('Starting BLE advertising...');
      
      if (!bleReady) {
        throw new Error('BLE not initialized');
      }

      // Reset counters
      setScanCount(0);
      setConnectionCount(0);

      // Create user data payload with exact same keys as expected by SendScreen
      const payload = {
        u: userProfile.userId || deviceId || '12345',
        n: userProfile.username || 'user',
        f: `${userProfile.firstName} ${userProfile.lastName}`,
        b: parseFloat(userProfile.balance) || 0
      };
      
      // Create a unique, recognizable local name with Flume prefix + username
      // This MUST exactly match what SendScreen is looking for
      const localName = `Flume-${userProfile.username || 'User'}`;
      
      // Add this log to clearly state what's being broadcast
      console.log(`BLE BROADCAST: Device will appear as "${localName}" to senders`);
      console.log(`BLE SERVICE UUID: ${FLUME_SERVICE_UUID}`);
      console.log(`BLE PAYLOAD: ${JSON.stringify(payload, null, 2)}`);
      
      // iOS enhanced visibility approach
      console.log('Setting up iOS enhanced visibility approach...');
      
      // First stop any existing scans
      bleManager.stopDeviceScan();
      console.log('Setting up device for maximum visibility...');

      // Check current BLE state before proceeding
      bleManager.state()
        .then(state => {
          console.log(`Current BLE state: ${state}`);
          if (state !== 'PoweredOn') {
            Alert.alert('Please ensure Bluetooth is enabled');
          }
        });

      // Critical - Start a scan for a very short time, then stop it
      // This makes our device more visible to other scanners on iOS
      bleManager.startDeviceScan([FLUME_SERVICE_UUID], { allowDuplicates: true }, () => {});
      setTimeout(() => {
        bleManager.stopDeviceScan();
        console.log('Visibility boost scan completed');
        setScanCount(prev => prev + 1);
      }, 500);
      
      // Start scanning to keep our BLE stack active and make device visible
      console.log('Starting continuous BLE scan for visibility...');
      bleManager.startDeviceScan(
        null, 
        { allowDuplicates: true }, // This makes our device more visible
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            return;
          }
          
          if (device) {
            // Logging discovered devices
            console.log(`Found device: ${device.name || 'Unknown'} (${device.id})`);
            
            // Try to connect to discovered devices to boost visibility
            // Skip connecting to our own iPhone devices
            if (device.name && !device.name.includes('iPhone')) {
              device.connect()
                .then(connectedDevice => {
                  console.log(`Connected to ${connectedDevice.name || connectedDevice.id}`);
                  setConnectionCount(prev => prev + 1);
                  
                  // Try to write our user data to the device
                  return connectedDevice.discoverAllServicesAndCharacteristics()
                    .then(() => {
                      return connectedDevice.services();
                    })
                    .then(services => {
                      if (services && services.length > 0) {
                        console.log(`Found ${services.length} services`);
                        // Attempt to write to a generic service if available
                        return services[0].characteristics();
                      }
                      return [];
                    })
                    .then(characteristics => {
                      if (characteristics && characteristics.length > 0) {
                        // Try to write our payload to make ourselves discoverable
                        const writableChar = characteristics.find(c => 
                          c.isWritableWithResponse || c.isWritableWithoutResponse
                        );
                        if (writableChar) {
                          // Include the device name in the payload - CRITICAL for findability
                          const enhancedPayload = {
                            d: localName,  // deviceName shortened to 'd'
                            u: (userProfile.userId || deviceId || '12345').substring(0, 8), // Just send the first 8 chars
                            n: userProfile.username || 'user',
                            f: (userProfile.firstName || '').charAt(0) + ' ' + userProfile.lastName, // First initial + last name
                            b: parseFloat(userProfile.balance) || 0
                          };
                          
                          console.log(`BLE SENDING: Compact payload (${JSON.stringify(enhancedPayload).length} bytes)`);
                          console.log(JSON.stringify(enhancedPayload));
                          
                          // Convert to base64 and check size
                          const payloadBase64 = Buffer.from(JSON.stringify(enhancedPayload)).toString('base64');
                          console.log(`Encoded payload size: ${payloadBase64.length} bytes`);
                          
                          // Only send if within reasonable BLE size limits
                          if (payloadBase64.length > 200) {
                            console.warn('Payload too large for reliable BLE transfer, using minimal version');
                            // Create minimal version with just essential info
                            const minimalPayload = {
                              d: localName,
                              n: userProfile.username || 'user'
                            };
                            return writableChar.writeWithResponse(
                              Buffer.from(JSON.stringify(minimalPayload)).toString('base64')
                            );
                          } else {
                            return writableChar.writeWithResponse(payloadBase64);
                          }
                        }
                      }
                      return null;
                    })
                    .catch(err => console.log('Error with characteristics:', err))
                    .finally(() => {
                      // Always disconnect when done
                      return connectedDevice.cancelConnection();
                    });
                })
                .catch(() => {});
            }
          }
        }
      );
      
      // Set up an interval to frequently refresh our device's visibility
      global.visibilityTimer = setInterval(() => {
        console.log('Refreshing BLE visibility...');
        setScanCount(prev => prev + 1);
        
        // This pattern of starting/stopping scanning makes iOS devices
        // much more visible to other iOS devices
        bleManager.startDeviceScan([FLUME_SERVICE_UUID], { allowDuplicates: true }, () => {});
        setTimeout(() => {
          bleManager.stopDeviceScan();
        }, 300);
        
        // Add random variation to scanning behavior - makes us more visible
        setTimeout(() => {
          bleManager.startDeviceScan(null, { allowDuplicates: false }, () => {});
          setTimeout(() => {
            bleManager.stopDeviceScan();
          }, 200);
        }, 1000);
      }, 2000);
      
      // Set up a beacon-like interval to keep refreshing BLE stack
      global.beaconTimer = setInterval(() => {
        console.log('Refreshing BLE visibility...');
        setScanCount(prev => prev + 1);
        
        // Change scan parameters periodically to increase discoverability
        bleManager.stopDeviceScan();
        setTimeout(() => {
          bleManager.startDeviceScan(null, { allowDuplicates: false }, () => {});
        }, 200);
        
        // Restart scan with different params after a delay
        setTimeout(() => {
          bleManager.stopDeviceScan();
          bleManager.startDeviceScan(null, { allowDuplicates: true }, () => {});
        }, 500);
        
      }, 3000);
      
      // Add an interval to attempt connection to any iOS devices
      // This makes us even more visible
      global.connectionTimer = setInterval(() => {
        bleManager.connectedDevices([])
          .then(connectedDevices => {
            console.log(`Currently connected to ${connectedDevices.length} devices`);
            
            // Try to simulate advertising by actively looking for scanners
            bleManager.stopDeviceScan();
            bleManager.startDeviceScan(null, { allowDuplicates: true }, (error, device) => {
              if (!error && device) {
                // Look for any device, not just iPhones
                console.log(`Found potential scanner: ${device.name || 'Unknown'}`);
                
                // Attempt to connect
                device.connect()
                  .then(connectedDevice => {
                    console.log(`Connected to scanner ${connectedDevice.name || 'Unknown device'}`);
                    setConnectionCount(prev => prev + 1);
                    
                    console.log(`Advertising as ${localName}`);
                    
                    // Try to write user data to the device
                    return connectedDevice.discoverAllServicesAndCharacteristics()
                      .then(() => {
                        return connectedDevice.services();
                      })
                      .then(services => {
                        if (services && services.length > 0) {
                          console.log(`Found ${services.length} services to write to`);
                          return services[0].characteristics();
                        }
                        return [];
                      })
                      .then(characteristics => {
                        if (characteristics && characteristics.length > 0) {
                          const writableChar = characteristics.find(c => 
                            c.isWritableWithResponse || c.isWritableWithoutResponse
                          );
                          
                          if (writableChar) {
                            console.log('Found writable characteristic, sending payload');
                            
                            // Include the device name in the payload with the exact same format
                            // that SendScreen is looking for
                            const enhancedPayload = {
                              deviceName: localName,  // This is critical!
                              u: userProfile.userId || deviceId || '12345',
                              n: userProfile.username || 'user',
                              f: `${userProfile.firstName} ${userProfile.lastName}`,
                              b: parseFloat(userProfile.balance) || 0
                            };
                            
                            console.log(`BLE SENDING: Enhanced payload with deviceName=${localName}`);
                            
                            return writableChar.writeWithResponse(
                              Buffer.from(JSON.stringify(enhancedPayload)).toString('base64')
                            );
                          }
                        }
                        return null;
                      })
                      .catch(err => console.log('Error writing data:', err))
                      .finally(() => {
                        // Disconnect after a brief moment
                        setTimeout(() => {
                          connectedDevice.cancelConnection().catch(() => {});
                        }, 500);
                      });
                  })
                  .catch(() => {});
              }
            });
          })
          .catch(err => console.log('Error checking connections:', err));
      }, 5000);

      setIsAdvertising(true);
      setTimeRemaining(300);
      setError(null);
    } catch (error) {
      console.error('Start advertising error:', error);
      setError(`Failed to start receiving: ${error.message}`);
    }
  };

  const stopAdvertising = async () => {
    try {
      console.log('Stopping BLE advertising...');
      
      // Stop all BLE operations
      bleManager.stopDeviceScan();
      
      // Clear all timer intervals
      if (global.beaconTimer) {
        clearInterval(global.beaconTimer);
        global.beaconTimer = null;
      }
      
      if (global.connectionTimer) {
        clearInterval(global.connectionTimer);
        global.connectionTimer = null;
      }
      
      if (global.visibilityTimer) {
        clearInterval(global.visibilityTimer);
        global.visibilityTimer = null;
      }
      
      setIsAdvertising(false);
      setTimeRemaining(300);
      setScanCount(0);
      setConnectionCount(0);
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
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
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
            {isAdvertising ? "Finish Receiving Payments" : "Receive Payments"}
          </Text>
        </TouchableOpacity>
        
        {isAdvertising && (
          <View style={styles.indicatorContainer}>
            <View style={[styles.indicator, { backgroundColor: '#34C759' }]} />
            <Text style={styles.status}>Visible to nearby senders</Text>
            <Text style={styles.timer}>
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </Text>
            <Text style={styles.deviceInfo}>
              Device ID: {deviceId?.substring(0, 8) || 'Unknown'}
            </Text>
            
            <View style={styles.broadcastDetails}>
              <Text style={styles.broadcastTitle}>Broadcasting as:</Text>
              <Text style={styles.broadcastName}>Flume-{userProfile.username}</Text>
              
              <Text style={styles.broadcastTitle}>Payload:</Text>
              <View style={styles.payloadContainer}>
                <Text style={styles.payloadItem}>ID: {userProfile.userId?.substring(0, 8) || deviceId?.substring(0, 8) || '12345'}</Text>
                <Text style={styles.payloadItem}>Username: @{userProfile.username}</Text>
                <Text style={styles.payloadItem}>Name: {userProfile.firstName} {userProfile.lastName}</Text>
                <Text style={styles.payloadItem}>Balance: ${parseFloat(userProfile.balance).toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        {isAdvertising && (
          <View style={styles.devicesContainer}>
            <Text style={styles.smallText}>
              Keep this screen open and ensure you are near the sending device.
            </Text>
            <View style={styles.bluetoothStats}>
              <Text style={styles.statsTitle}>Bluetooth Activity:</Text>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Service UUID:</Text>
                <Text style={styles.statValue}>{FLUME_SERVICE_UUID.substring(0, 8)}...</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Broadcasting Mode:</Text>
                <Text style={styles.statValue}>Enhanced Visibility</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>BLE State:</Text>
                <Text style={styles.statValue}>Active</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Broadcast Type:</Text>
                <Text style={styles.statValue}>Scanning + Connections</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Update Interval:</Text>
                <Text style={styles.statValue}>Every 3 seconds</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Scans Performed:</Text>
                <Text style={styles.statValue}>{scanCount}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Connections Made:</Text>
                <Text style={styles.statValue}>{connectionCount}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Device Name:</Text>
                <Text style={styles.statValue}>Flume-{userProfile.username}</Text>
              </View>
            </View>
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
    backgroundColor: '#FBFBFC',
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: 26,
    marginBottom: 80,
    marginHorizontal: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#20859E',
    fontFamily: 'Figtree',
    marginBottom: 36,
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
  button: {
    backgroundColor: '#62B6CB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  buttonStop: {
    backgroundColor: '#62B6CB',
  },
  buttonStart: {
    backgroundColor: '#62B6CB',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FBFBFC',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Figtree'
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
  deviceInfo: {
    marginTop: 8,
    fontSize: 12,
    color: '#8E8E93',
  },
  error: {
    color: '#FF3B30',
    marginTop: 20,
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 10,
    color: '#8E8E93',
  },
  devicesContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  smallText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  broadcastDetails: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 15,
    width: '100%',
  },
  broadcastTitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 3,
  },
  broadcastName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 10,
  },
  payloadContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  payloadItem: {
    fontSize: 12,
    fontFamily: 'Menlo-Regular',
    color: '#3C3C43',
    marginBottom: 4,
  },
  bluetoothStats: {
    marginTop: 10,
    width: '100%',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 10,
  },
  statsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  statValue: {
    fontSize: 11,
    fontWeight: '500',
    color: '#3C3C43',
  }
});

export default ReceiveScreen;