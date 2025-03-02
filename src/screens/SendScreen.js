/**
 * SendScreen.js
 * 
 * iOS-optimized implementation for BLE scanning to find nearby receivers.
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator,
  Platform,
  Linking
} from 'react-native';
import { BleManager, LogLevel } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ButtonBar from '../components/ButtonBar';

// Same service UUID used in ReceiveScreen for consistency
const FLUME_SERVICE_UUID = '13333333-3333-3333-3333-333333333337';

const SendScreen = ({ navigation, route }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [receivers, setReceivers] = useState([]);
  const [selectedReceiver, setSelectedReceiver] = useState(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);
  const [allDevices, setAllDevices] = useState([]); // Track all detected devices for debugging
  const [scanAttempts, setScanAttempts] = useState(0);
  const [manager] = useState(() => new BleManager());
  
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
      }
    };
    loadProfile();
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      manager.stopDeviceScan();
    };
  }, [manager]);
  
  const startScan = () => {
    setScanAttempts(prev => prev + 1);
    
    if (isScanning) {
      stopScan();
      return;
    }
    
    // First attempt or button pressed again - reset receivers
    setReceivers([]);
    setAllDevices([]);
    setSelectedReceiver(null);
    setIsScanning(true);
    setError(null);
    
    console.log(`=== STARTING iOS BLE SCAN (Attempt ${scanAttempts + 1}) ===`);
    console.log(`Looking for devices with Flume- prefix and service UUID: ${FLUME_SERVICE_UUID}`);
    
    // Enable verbose logging for iOS
    manager.setLogLevel(LogLevel.Verbose);
    
    manager.state()
      .then(state => {
        console.log('iOS Bluetooth state:', state);
        
        if (state !== 'PoweredOn') {
          console.log('iOS Bluetooth not powered on');
          Alert.alert(
            'Bluetooth Required',
            'Please enable Bluetooth in iOS Settings to scan for nearby users.',
            [
              { text: 'Settings', onPress: () => Linking.openURL('App-Prefs:Bluetooth') }, 
              { text: 'Cancel' }
            ]
          );
          setIsScanning(false);
          setError('Bluetooth is not enabled');
          return;
        }
        
        console.log('Starting iOS device scan with options...');
        
        // iOS-specific scan options - detect all devices with allowDuplicates
        const scanOptions = {
          allowDuplicates: true,
          scanMode: 1, // Low latency for iOS
        };
        
        // First try scanning with the service UUID
        manager.startDeviceScan(
          null, // Scan for all devices (more reliable on iOS)
          scanOptions,
          (error, device) => {
            if (error) {
              console.error('iOS scan error:', error);
              setIsScanning(false);
              setError('Scan error: ' + error.message);
              return;
            }
            
            if (!device) return;
            
            try {
              // Record all discovered devices for debugging
              // Handle null values to prevent crashes
              setAllDevices(prev => {
                const exists = prev.some(d => d.id === device.id);
                if (!exists) {
                  return [...prev, {
                    id: device.id || 'unknown-id',
                    name: device.name || 'Unnamed',
                    rssi: device.rssi || -100
                  }];
                }
                return prev;
              });
              
              // Enhanced iOS-specific device logging
              const deviceName = device.name || device.localName || 'unnamed';
              console.log(`BLE RECEIVING: Processing device ${deviceName} (${device.id || 'unknown-id'})`);
              console.log(`  RSSI: ${device.rssi || 'unknown'}, MTU: ${device.mtu || 'unknown'}`);
              
              // For iOS - we'll accept any device with a name for testing
              if (deviceName) {
                // Specifically look for Flume devices
                const isFlume = deviceName.includes('Flume');
                
                if (isFlume) {
                  console.log('FOUND FLUME DEVICE:', deviceName);
                  
                  let username = 'Unknown';
                  let fullName = deviceName || 'Unknown User';
                  let balance = null;
                  let userId = null;
                  
                  // Try to extract username from device name - more specific to match our Flume-username pattern
                  if (deviceName.includes('Flume-')) {
                    username = deviceName.split('Flume-')[1];
                    fullName = username; // Use username as name by default
                    console.log(`Extracted username from device name: @${username}`);
                  }
                  
                  // Check for manufacturer data or advertisement data that might contain our payload
                  if (device.manufacturerData) {
                    console.log('Device has manufacturer data, attempting to decode payload');
                    
                    try {
                      const data = Buffer.from(device.manufacturerData, 'base64');
                      
                      // Try to extract text from the data
                      try {
                        // First try direct string conversion
                        const textData = data.toString('utf8');
                        console.log('Decoded text data:', textData);
                        
                        // Look for JSON-like content
                        if (textData.includes('{') && textData.includes('}')) {
                          const jsonStart = textData.indexOf('{');
                          const jsonEnd = textData.lastIndexOf('}') + 1;
                          const jsonStr = textData.substring(jsonStart, jsonEnd);
                          
                          try {
                            const jsonData = JSON.parse(jsonStr);
                            console.log('Extracted JSON payload:', jsonData);
                            
                            // Handle compact keys from ReceiveScreen
                            if (jsonData.n) username = jsonData.n; 
                            if (jsonData.f) fullName = jsonData.f;
                            if (jsonData.b) balance = parseFloat(jsonData.b);
                            if (jsonData.u) userId = jsonData.u;
                            
                            // 'd' is the shortened deviceName field
                            if (jsonData.d && jsonData.d.includes('Flume-')) {
                              const nameFromPayload = jsonData.d.split('Flume-')[1];
                              username = nameFromPayload || username;
                              console.log(`Extracted username from deviceName field: @${username}`);
                            }
                            
                            // Also check for the legacy format
                            if (jsonData.deviceName && jsonData.deviceName.includes('Flume-')) {
                              const nameFromPayload = jsonData.deviceName.split('Flume-')[1];
                              username = nameFromPayload || username;
                              console.log(`Extracted username from legacy deviceName field: @${username}`);
                            }
                          } catch (e) {
                            console.log('JSON parsing failed:', e);
                          }
                        }
                      } catch (e) {
                        console.log('Text decode failed:', e);
                      }
                    } catch (e) {
                      console.log('Manufacturer data decode failed:', e);
                    }
                  }
                  
                  // Also try to connect to the device to read service data
                  // This is advanced and might not be necessary for all devices, but helps with iOS
                  if (isFlume && username !== 'Unknown') {
                    console.log(`Attempting to connect to Flume device for more data: ${deviceName}`);
                    
                    // Use a timeout to prevent blocking the scan
                    setTimeout(() => {
                      device.connect()
                        .then(connectedDevice => {
                          console.log(`Connected to ${connectedDevice.name || connectedDevice.id} for data reading`);
                          
                          return connectedDevice.discoverAllServicesAndCharacteristics()
                            .then(() => {
                              return connectedDevice.services();
                            })
                            .then(services => {
                              if (services && services.length > 0) {
                                console.log(`Found ${services.length} services to read from`);
                                
                                // Try to find a service that matches our expected one
                                const targetService = services.find(s => s.uuid.includes('3333'));
                                if (targetService) {
                                  console.log(`Found potential Flume service: ${targetService.uuid}`);
                                  return targetService.characteristics();
                                }
                                return services[0].characteristics();
                              }
                              return [];
                            })
                            .then(characteristics => {
                              if (characteristics && characteristics.length > 0) {
                                console.log(`Found ${characteristics.length} characteristics`);
                                
                                // Find a characteristic we can read
                                const readableChar = characteristics.find(c => c.isReadable);
                                
                                if (readableChar) {
                                  console.log('Found readable characteristic, reading value');
                                  return readableChar.read();
                                }
                              }
                              return null;
                            })
                            .then(value => {
                              if (value) {
                                console.log('Read characteristic value:', value);
                                
                                // Try to decode it as JSON
                                try {
                                  const textValue = Buffer.from(value.value, 'base64').toString('utf8');
                                  console.log('Decoded characteristic value:', textValue);
                                  
                                  if (textValue.includes('{') && textValue.includes('}')) {
                                    const jsonStart = textValue.indexOf('{');
                                    const jsonEnd = textValue.lastIndexOf('}') + 1;
                                    const jsonStr = textValue.substring(jsonStart, jsonEnd);
                                    
                                    try {
                                      const jsonData = JSON.parse(jsonStr);
                                      console.log('Extracted characteristic JSON:', jsonData);
                                      
                                      // Update our info with the data
                                      if (jsonData.n) username = jsonData.n;
                                      if (jsonData.f) fullName = jsonData.f;
                                      if (jsonData.b) balance = parseFloat(jsonData.b);
                                      if (jsonData.u) userId = jsonData.u;
                                      
                                      // Update receiver info with this new data
                                      setReceivers(prevReceivers => {
                                        const existingIndex = prevReceivers.findIndex(d => d.id === device.id);
                                        
                                        if (existingIndex >= 0) {
                                          // Update existing device with new info
                                          const updatedReceivers = [...prevReceivers];
                                          updatedReceivers[existingIndex] = {
                                            ...updatedReceivers[existingIndex],
                                            username: username,
                                            fullName: fullName,
                                            balance: balance,
                                            userId: userId
                                          };
                                          return updatedReceivers;
                                        }
                                        return prevReceivers;
                                      });
                                    } catch (e) {
                                      console.log('Characteristic JSON parsing failed:', e);
                                    }
                                  }
                                } catch (e) {
                                  console.log('Characteristic value decode failed:', e);
                                }
                              }
                            })
                            .catch(err => console.log('Error reading characteristic:', err))
                            .finally(() => {
                              // Always disconnect
                              connectedDevice.cancelConnection()
                                .catch(err => console.log('Error disconnecting:', err));
                            });
                        })
                        .catch(err => console.log('Connection error:', err));
                    }, 100);
                  }
                  
                  // Now add the device to receivers with the extracted info
                  setReceivers(prevReceivers => {
                    const existingIndex = prevReceivers.findIndex(d => d.id === device.id);
                    
                    if (existingIndex >= 0) {
                      // Update existing device with new info
                      const updatedReceivers = [...prevReceivers];
                      updatedReceivers[existingIndex] = {
                        ...updatedReceivers[existingIndex],
                        rssi: device.rssi || -100,
                        lastSeen: new Date(),
                        // Update if we got new info from payload
                        username: username || updatedReceivers[existingIndex].username,
                        fullName: fullName || updatedReceivers[existingIndex].fullName,
                        balance: balance !== null ? balance : updatedReceivers[existingIndex].balance,
                        userId: userId || updatedReceivers[existingIndex].userId
                      };
                      return updatedReceivers;
                    } else {
                      // Only add if not a duplicate device by username
                      const isDuplicate = prevReceivers.some(d => 
                        d.username === username && 
                        username !== 'Unknown'
                      );
                      
                      if (isDuplicate) {
                        console.log(`Skipping duplicate user: @${username}`);
                        return prevReceivers;
                      }
                      
                      // Add as new device with all available info
                      return [...prevReceivers, {
                        id: device.id || 'unknown-id',
                        name: deviceName || 'Unknown Device',
                        username: username || 'user',
                        fullName: fullName || 'Flume User',
                        rssi: device.rssi || -100,
                        lastSeen: new Date(),
                        isIOS: true,
                        isFlume: true,
                        balance: balance,
                        userId: userId
                      }];
                    }
                  });
                }
              }
            } catch (err) {
              console.error('Error processing device:', err);
            }
          }
        );
        
        // iOS scanning timeout - extended to 20 seconds for better discovery
        // This matches the receiver's refresh cycle better
        setTimeout(() => {
          console.log('iOS scan timeout reached');
          stopScan();
          if (receivers.length === 0) {
            setError('No receiving devices found nearby. Make sure other devices are actively receiving.');
          }
        }, 20000);
      })
      .catch(error => {
        console.error('iOS BLE state error:', error);
        setIsScanning(false);
        setError('Failed to access Bluetooth. Please restart the app.');
      });
  };
  
  const stopScan = () => {
    console.log('Stopping iOS BLE scan');
    manager.stopDeviceScan();
    setIsScanning(false);
    console.log('=== iOS SCAN COMPLETED ===');
  };
  
  const selectReceiver = (receiver) => {
    setSelectedReceiver(receiver);
  };
  
  const sendPayment = () => {
    if (!selectedReceiver || !amount || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please select a receiver and enter a valid amount');
      return;
    }
    
    if (!userProfile) {
      Alert.alert('Error', 'Your account information is not available');
      return;
    }
    
    const paymentAmount = parseFloat(amount);
    
    if (paymentAmount > userProfile.balance) {
      Alert.alert('Error', 'Insufficient funds for this payment');
      return;
    }
    
    Alert.alert(
      'Confirm Payment',
      `Send $${amount} to @${selectedReceiver.username}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send',
          onPress: async () => {
            try {
              // For a real app, you would make an API call here
              // Here we'll just update local storage
              
              // Update user's balance
              const updatedBalance = userProfile.balance - paymentAmount;
              const updatedProfile = {
                ...userProfile,
                balance: updatedBalance
              };
              
              await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
              setUserProfile(updatedProfile);
              
              Alert.alert(
                'Payment Successful', 
                `You sent $${amount} to @${selectedReceiver.username}`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setSelectedReceiver(null);
                      setAmount('');
                      navigation.navigate('Home');
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Payment error:', error);
              Alert.alert('Error', 'Failed to process payment');
            }
          },
        },
      ]
    );
  };
  
  const renderReceiverItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.receiverItem, 
        selectedReceiver?.id === item.id && styles.selectedReceiver,
        item.isFlume && styles.flumeReceiver
      ]}
      onPress={() => selectReceiver(item)}
    >
      <View style={styles.receiverInfo}>
        <Text style={styles.receiverName}>
          {item.fullName}
          {item.isFlume && <Text style={styles.flumeBadge}> ✓ Flume</Text>}
        </Text>
        <Text style={styles.receiverUsername}>@{item.username}</Text>
        <Text style={styles.receiverId}>
          ID: {(item.id || "").substring(0, 8)}...
          <Text style={styles.deviceType}> ({item.name || "Unknown"})</Text>
        </Text>
      </View>
      <View style={styles.signalStrength}>
        <Text style={styles.signalIcon}>
          {(item.rssi || -100) > -60 ? '●●●' : (item.rssi || -100) > -80 ? '●●○' : '●○○'}
        </Text>
        <Text style={styles.rssiValue}>
          {item.rssi || -100} dBm
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <Text style={styles.title}>Send Payment</Text>
        
        {userProfile && (
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <Text style={styles.balanceAmount}>${userProfile.balance.toFixed(2)}</Text>
          </View>
        )}
        
        <View style={styles.scanSection}>
          <TouchableOpacity
            style={[
              styles.scanButton,
              isScanning && styles.scanningButton
            ]}
            onPress={isScanning ? stopScan : startScan}
          >
            {isScanning ? (
              <View style={styles.scanningContainer}>
                <Text style={styles.scanButtonText}>Scanning</Text>
                <ActivityIndicator color="#FFFFFF" size="small" style={styles.scanningIndicator} />
              </View>
            ) : (
              <Text style={styles.scanButtonText}>Scan for Receivers</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        
        {error && receivers.length === 0 && (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={startScan}
          >
            <Text style={styles.rescanButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
        
        {receivers.length > 0 && (
          <View style={styles.receiversContainer}>
            <Text style={styles.sectionTitle}>
              {receivers.length} {receivers.length === 1 ? 'Receiver' : 'Receivers'} Found
            </Text>
            <FlatList
              data={receivers
                // Sort by: First Flume devices, then known usernames, then by signal strength
                .sort((a, b) => {
                  // Flume devices first
                  if (a.isFlume && !b.isFlume) return -1;
                  if (!a.isFlume && b.isFlume) return 1;
                  
                  // Then by signal strength
                  return (b.rssi || -100) - (a.rssi || -100);
                })
              }
              renderItem={renderReceiverItem}
              keyExtractor={item => item.id || Math.random().toString()}
              style={styles.receiverList}
            />
          </View>
        )}
        
        {selectedReceiver && (
          <View style={styles.paymentContainer}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <Text style={styles.selectedReceiverText}>
              <Text style={styles.selectedReceiverLabel}>To: </Text>
              <Text style={styles.selectedReceiverName}>{selectedReceiver.fullName}</Text>
              {'\n'}
              <Text style={styles.selectedReceiverLabel}>Username: </Text>
              <Text style={styles.selectedReceiverUsername}>@{selectedReceiver.username}</Text>
            </Text>
            
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            
            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!amount || 
                 isNaN(parseFloat(amount)) || 
                 parseFloat(amount) <= 0 ||
                 (userProfile && parseFloat(amount) > userProfile.balance)) && 
                styles.sendButtonDisabled
              ]}
              onPress={sendPayment}
              disabled={!amount || 
                      isNaN(parseFloat(amount)) || 
                      parseFloat(amount) <= 0 ||
                      (userProfile && parseFloat(amount) > userProfile.balance)}
            >
              <Text style={styles.sendButtonText}>Send Payment</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!selectedReceiver && !isScanning && allDevices.length > 0 && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>Debug Info - All Devices ({allDevices.length})</Text>
            {allDevices.map((device, index) => (
              <Text key={device.id || index} style={styles.debugDevice}>
                • {device.name || 'Unnamed'} ({(device.id || "").substring(0, 8)}...) RSSI: {device.rssi || 'unknown'}
              </Text>
            ))}
          </View>
        )}
      </SafeAreaView>
      
      <ButtonBar navigation={navigation} activeScreen="Send" />
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
    paddingBottom: 80, // Add padding to account for the button bar
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    color: '#000000',
    textAlign: 'center',
  },
  balanceContainer: {
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
  balanceLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  scanSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  scanningButton: {
    backgroundColor: '#8E8E93',
  },
  scanningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  scanningIndicator: {
    marginLeft: 10,
  },
  errorText: {
    color: '#FF3B30', // iOS red
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500',
  },
  rescanButton: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  rescanButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  receiversContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000000',
  },
  receiverList: {
    maxHeight: 200,
  },
  receiverItem: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiverInfo: {
    flex: 1,
  },
  selectedReceiver: {
    backgroundColor: '#E5F1FF', // Light blue
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  flumeReceiver: {
    backgroundColor: '#EAFFF2', // Light green
    borderColor: '#34C759',
    borderWidth: 1,
  },
  receiverName: {
    fontSize: 16,
    fontWeight: '500',
  },
  flumeBadge: {
    color: '#34C759',
    fontWeight: '600',
  },
  receiverUsername: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 2,
  },
  receiverId: {
    fontSize: 12,
    color: '#8E8E93', // iOS gray
    marginTop: 4,
  },
  deviceType: {
    fontSize: 10,
    color: '#8E8E93',
  },
  signalStrength: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  signalIcon: {
    color: '#34C759', // iOS green
    fontSize: 16,
    fontWeight: 'bold',
  },
  rssiValue: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
  },
  paymentContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  selectedReceiverText: {
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 22,
  },
  selectedReceiverLabel: {
    color: '#8E8E93',
    fontWeight: '400',
  },
  selectedReceiverName: {
    fontWeight: '500',
  },
  selectedReceiverUsername: {
    color: '#007AFF',
    fontWeight: '500',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    marginBottom: 20,
  },
  sendButton: {
    backgroundColor: '#34C759', // iOS green
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#A0E5B4', // Lighter green
    opacity: 0.7,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  debugSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
    color: '#8E8E93',
  },
  debugDevice: {
    fontSize: 10,
    color: '#8E8E93',
    marginVertical: 2,
  },
});

export default SendScreen;