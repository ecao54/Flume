import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, ActivityIndicator, ScrollView } from 'react-native';
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
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const connectedBanks = [ // mock data for now
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
        <ScrollView contentContainerStyle={styles.scrollContent}>     
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
              <View style={styles.cardContainer}> 
                {connectedBanks.map((bank) => (     
                  <TouchableOpacity
                    key={bank.name}
                    style={styles.card}
                  >
                    <Image
                      source={bank.image}
                      style={styles.bankImage}
                    />
                    <View style={styles.bankTextContainer}>
                      <Text style={styles.bankText}>
                        {bank.name}
                      </Text>
                      <Text style={styles.bankInfo}>
                        •••• {bank.lastFourNumbers}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              <TouchableOpacity style={styles.addContainer}>
                <Image style={styles.addButton} source={require('../assets/add.png')}/>
                <Text style={styles.addText}>Add a bank or card</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
              <Text style={styles.menuItemText}>Account Details</Text>
              <Image style={styles.menuItemArrow} source={require('../assets/next_cheveron.png')}/>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
              <Text style={styles.menuItemText}>Notifications</Text>
              <Image style={styles.menuItemArrow} source={require('../assets/next_cheveron.png')}/>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.menuItem, styles.signOutItem]} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
      
      <ButtonBar navigation={navigation} activeScreen="Profile" />
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
    marginBottom: 80
  },
  scrollContent: {
    padding: 28,
    marginTop: 26,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'left',
    marginBottom: 36,
  },
  profileImage: {
    width: 59,
    height: 59,
    borderRadius: 35,
    marginRight: 20,
    backgroundColor: '#E5E5EA', // Placeholder color
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    fontFamily: 'Figtree',
    color: '#20859E'
  },
  profileId: {
    fontSize: 16,
    color: '#1B4965', 
    fontWeight: '600',
    fontFamily: 'Figtree',
  },
  balanceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 36,
    outlineWidth: 1,
    outlineColor: '#C4C4C5',
  },
  cardTitle: {
    fontSize: 14,
    marginBottom: 8,
    color: '#1B4965', 
    fontWeight: '600',
    fontFamily: 'Figtree',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '600',
    color: '#20859E', 
  },
  banksAndCards: {
    marginBottom: 36
  },
  cardContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  banksAndCardsLabel: {
    fontSize: 16,
    color: '#19191D',
    fontFamily: 'Figtree',
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    width: 128,
    borderRadius: 12,
    shadowColor: '#1B4965',
    shadowOpacity: .09,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 15,
    backgroundColor: '#FBFBFC'
  },
  bankImage: {
    width: 'auto',
    height: 75.24,
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12,
    resizeMode: 'contain', // dont know
  },
  bankTextContainer: {
    padding: 16,
  },
  bankText: {
    fontSize: 14,
    fontFamily: 'Figtree',
    fontWeight: '600',
    color: '#19191D',
    marginBottom: 8,
  },
  bankInfo: {
    fontSize: 14,
    fontFamily: 'Figtree',
    fontWeight: '500',
    color: '#B3B3BB',
  },
  addContainer: {
    width: 128,
    outlineWidth: 1,
    outlineColor: '#E6E6E7',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16
  },
  addButton: {
    width: 24,
    height: 24,
    marginBottom: 8
  },
  addText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Figtree',
    color: '#1B4965'
  },
  menuSection: {
    gap: 16
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E7', 
    paddingBottom: 16
  },
  menuItemText: {
    fontSize: 18,
    fontFamily: 'Figtree',
    fontWeight: '500',
    color: '#19191D'
  },
  menuItemArrow: {
    width: 23,
    height: 23
  },
  signOutItem: {
    borderBottomWidth: 0,
  },
  signOutText: {
    color: '#20859E',
    fontSize: 18,
    fontFamily: 'Figtree',
    fontWeight: '500',
  },
});

export default ProfileScreen;
