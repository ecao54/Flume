import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, SafeAreaView, Image, ActivityIndicator, ScrollView } from 'react-native';
import NessieService from '../services/NessieService';
import ButtonBar from '../components/ButtonBar';
import ReceivePaymentsDrawer from '../components/ReceivingPayments';

const HomeScreen = ({ navigation, route }) => {
  const [transactions, setTransactions] = useState([]);
  const { customerId, accountId, customerName } = route.params || {};
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

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


  const EmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateText}>
        No transactions yet! Start by sending or receiving money to see your history here.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.title}>
            <Image style={styles.logo} source={require('../assets/flume-logo.png')}/>
           <Text style={styles.flume}>Flume</Text> 
          </View>
          <Text style={styles.subtitle}>PAST TRANSACTIONS</Text>
          {transactions.length === 0 ? (
            <EmptyState />
          ) : (
            <View>
              {/* Transaction list will go here */}
            </View>
          )}

          

          {/* <Button 
            title="Receive Payment"
            onPress={() => setIsDrawerVisible(true)}
          />

          {isDrawerVisible && (
            <ReceivePaymentsDrawer
              visible={isDrawerVisible}
              onClose={() => setIsDrawerVisible(false)}
            />
          )} */}
        </ScrollView>
      </SafeAreaView>
      
      <ButtonBar navigation={navigation} activeScreen="Home" />
      
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
    justifyContent: 'top',
    alignItems: 'left',
    marginBottom: 80
  },
  title: {
    flexDirection: 'row',
    marginBottom: 36,
  },
  logo: {
    width: 42,
    height: 42,
    marginRight: 8
  },
  flume: {
    fontSize: 40,
    fontWeight: '800',
    color: '#20859E',
    fontFamily: 'Figtree',
    fontStyle: 'italic'
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    color: '#1B4965', 
    fontWeight: '600',
    fontFamily: 'Figtree',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'top',
    alignItems: 'left',
    padding: 28,
    marginTop: 26,
  },
  emptyStateContainer: {
  },
  emptyStateText: {
    textAlign: 'center',
    fontSize: 16,
    paddingVertical: 16,
    fontFamily: 'Figtree',
    fontWeight: '500',
    color: '#B3B3BB'
  }
});

export default HomeScreen;
