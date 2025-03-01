import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import ButtonBar from '../components/ButtonBar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ navigation, route }) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await AsyncStorage.getItem('userProfile');
        if (profileData) {
          setProfile(JSON.parse(profileData));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSignOut = async () => {
    try {
      await AsyncStorage.removeItem('userProfile');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const connectedBanks = [
    {name: "Bank of America", lastFourNumbers: "1234", image: require('../assets/bank-of-america.png')},
  ];

  

  if (isLoading) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>        
        <View style={styles.profileHeader}>
          <Image
            source={require('../assets/default-profile.png')}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile ? `${profile.firstName} ${profile.lastName}` : 'User Name'}
            </Text>
            <Text style={styles.profileId}>
              @{profile?.username || 'username'}
            </Text>
          </View>
        </View>
        
        <View style={styles.balanceCard}>
          <Text style={styles.cardTitle}>FLUME BALANCE</Text>
          <Text style={styles.balanceAmount}>
            ${profile?.balance ? profile.balance.toFixed(2) : '0.00'}
          </Text>
        </View>

        <View style={styles.banksAndCards}>
          <Text style={styles.banksAndCardsLabel}>Banks and cards</Text>
          {connectedBanks.map((bank) => (
                  
            <TouchableOpacity
              key={bank.name}
            >
              {/* <Image
                source={bank.image}
                style={styles.bankImage}
              /> */}
              <Text
                style={[
                  styles.bankText,
                ]}
              >
                {bank.name}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.addContainer}>
            <Image style={styles.addButton} source={require('../assets/add.png')}/>
            <Text style={styles.addText}>Add a bank or card</Text>
          </View>
        </View>
        
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <Text style={styles.menuItemText}>Account Details</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <Text style={styles.menuItemText}>Notifications</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, styles.signOutItem]} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      
      <ButtonBar navigation={navigation} activeScreen="Profile" />
    </View>
  );
};

// Styles remain the same
const styles = StyleSheet.create({
  // Your existing styles...
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
    backgroundColor: '#E5E5EA', // Placeholder color
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 5,
  },
  profileId: {
    fontSize: 14,
    color: '#8E8E93', // iOS gray
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93', // iOS gray
    marginBottom: 10,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759', // iOS green
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA', // iOS light gray
  },
  menuItemText: {
    fontSize: 16,
  },
  menuItemArrow: {
    fontSize: 20,
    color: '#8E8E93', // iOS gray
  },
  signOutItem: {
    borderBottomWidth: 0,
    justifyContent: 'center',
  },
  signOutText: {
    color: '#FF3B30', // iOS red
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProfileScreen;
