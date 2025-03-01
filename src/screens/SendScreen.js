import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import ButtonBar from '../components/ButtonBar';

const SendScreen = ({ navigation, route }) => {
  const { customerId, accountId } = route.params || {};
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [amount, setAmount] = useState('');
  const [manager] = useState(() => new BleManager());
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      manager.destroy();
    };
  }, [manager]);
  
  const startScan = () => {
    setDevices([]);
    setIsScanning(true);
    
    // Start scanning for devices
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        setIsScanning(false);
        return;
      }
      
      // Filter for devices with our service UUID or name pattern
      if (device && device.name && (
          device.name.includes('Flume') || 
          device.localName?.includes('Flume')
      )) {
        // Check if device is already in the list
        setDevices(prevDevices => {
          if (!prevDevices.find(d => d.id === device.id)) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      }
    });
    
    // Stop scanning after 10 seconds
    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  };
  
  const stopScan = () => {
    manager.stopDeviceScan();
    setIsScanning(false);
  };
  
  const selectDevice = (device) => {
    setSelectedDevice(device);
  };
  
  const sendPayment = () => {
    if (!selectedDevice || !amount || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please select a device and enter a valid amount');
      return;
    }
    
    if (!accountId) {
      Alert.alert('Error', 'Your account information is not available');
      return;
    }
    
    Alert.alert(
      'Confirm Payment',
      `Send $${amount} to ${selectedDevice.name || 'this device'}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send',
          onPress: () => {
            // Here you would implement the actual payment processing with Nessie API
            // For hackathon purposes, you can simulate a successful payment
            Alert.alert('Success', `Payment of $${amount} sent successfully!`);
            setSelectedDevice(null);
            setAmount('');
            navigation.navigate('Home');
          },
        },
      ]
    );
  };
  
  const renderDeviceItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.deviceItem, 
        selectedDevice?.id === item.id && styles.selectedDevice
      ]}
      onPress={() => selectDevice(item)}
    >
      <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
      <Text style={styles.deviceId}>ID: {item.id.substring(0, 8)}...</Text>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <Text style={styles.title}>Send Payment</Text>
        
        <View style={styles.scanSection}>
          <Button
            title={isScanning ? "Stop Scanning" : "Scan for Receivers"}
            onPress={isScanning ? stopScan : startScan}
            color="#007AFF" // iOS blue
          />
          
          {isScanning && (
            <Text style={styles.scanningText}>Scanning for nearby devices...</Text>
          )}
        </View>
        
        {devices.length > 0 && (
          <View style={styles.devicesContainer}>
            <Text style={styles.sectionTitle}>Available Devices</Text>
            <FlatList
              data={devices}
              renderItem={renderDeviceItem}
              keyExtractor={item => item.id}
              style={styles.deviceList}
            />
          </View>
        )}
        
        {selectedDevice && (
          <View style={styles.paymentContainer}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <Text style={styles.selectedDeviceText}>
              Sending to: {selectedDevice.name || 'Unknown Device'}
            </Text>
            
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={sendPayment}
            >
              <Text style={styles.sendButtonText}>Send Payment</Text>
            </TouchableOpacity>
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
    fontFamily: 'System',
    textAlign: 'center',
  },
  scanSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scanningText: {
    marginTop: 10,
    color: '#8E8E93', // iOS gray
  },
  devicesContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000000',
  },
  deviceList: {
    maxHeight: 200,
  },
  deviceItem: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selectedDevice: {
    backgroundColor: '#E5F1FF', // Light blue
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
  },
  deviceId: {
    fontSize: 12,
    color: '#8E8E93', // iOS gray
    marginTop: 5,
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
  selectedDeviceText: {
    fontSize: 16,
    marginBottom: 15,
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
  sendButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default SendScreen;
