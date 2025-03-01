import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

class FirebaseService {
  // Sign up a new user
  async signUp(email, password, firstName, lastName) {
    try {
      // Create user with email and password
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await firestore().collection('users').doc(user.uid).set({
        firstName,
        lastName,
        email,
        createdAt: firestore.FieldValue.serverTimestamp(),
        balance: 1000, // Initial balance for demo
      });
      
      return user;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }
  
  // Sign in existing user
  async signIn(email, password) {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }
  
  // Sign out current user
  async signOut() {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
  
  // Get current user profile data
  async getUserProfile(userId) {
    try {
      const userDoc = await firestore().collection('users').doc(userId).get();
      return userDoc.exists ? userDoc.data() : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }
  
  // Update user balance
  async updateBalance(userId, newBalance) {
    try {
      await firestore().collection('users').doc(userId).update({
        balance: newBalance
      });
    } catch (error) {
      console.error('Error updating balance:', error);
      throw error;
    }
  }
  
  // Create a transaction record
  async createTransaction(senderId, receiverId, amount) {
    try {
      return await firestore().collection('transactions').add({
        senderId,
        receiverId,
        amount,
        timestamp: firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }
  
  // Get user's transaction history
  async getTransactionHistory(userId) {
    try {
      const sentQuery = await firestore()
        .collection('transactions')
        .where('senderId', '==', userId)
        .orderBy('timestamp', 'desc')
        .get();
        
      const receivedQuery = await firestore()
        .collection('transactions')
        .where('receiverId', '==', userId)
        .orderBy('timestamp', 'desc')
        .get();
        
      const sent = sentQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'sent'
      }));
      
      const received = receivedQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'received'
      }));
      
      return [...sent, ...received].sort((a, b) => 
        b.timestamp?.toDate() - a.timestamp?.toDate()
      );
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }
}

export default new FirebaseService();
