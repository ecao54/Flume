import axios from 'axios';

class NessieService {
  constructor() {
    this.baseUrl = 'http://api.nessieisreal.com';
    this.apiKey = 'fa6ae127198c9b8257d6f3f04228cba6'; // Replace with your actual Nessie API key
  }

  // Get all customers
  async getCustomers() {
    try {
      const response = await axios.get(`${this.baseUrl}/customers?key=${this.apiKey}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  // Get a specific customer
  async getCustomer(customerId) {
    try {
      const response = await axios.get(`${this.baseUrl}/customers/${customerId}?key=${this.apiKey}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  // Create a new customer
  async createCustomer(firstName, lastName) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/customers?key=${this.apiKey}`,
        {
          first_name: firstName,
          last_name: lastName,
          address: {
            street_number: "123",
            street_name: "Main St",
            city: "Boston",
            state: "MA",
            zip: "02110"
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  // Get accounts for a customer
  async getAccounts(customerId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/customers/${customerId}/accounts?key=${this.apiKey}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  // Create an account for a customer
  async createAccount(customerId, accountType = 'Checking') {
    try {
      const response = await axios.post(
        `${this.baseUrl}/customers/${customerId}/accounts?key=${this.apiKey}`,
        {
          type: accountType,
          nickname: `${accountType} Account`,
          rewards: 0,
          balance: 1000 // Starting balance for demo
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  // Get account balance
  async getAccountBalance(accountId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/accounts/${accountId}?key=${this.apiKey}`
      );
      return response.data.balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }

  // Create a transfer between accounts
  async createTransfer(payerId, receiverId, amount, description = 'Bluetooth payment') {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transfers?key=${this.apiKey}`,
        {
          medium: 'balance',
          payee_id: receiverId,
          amount: amount,
          payer_id: payerId,
          description: description
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating transfer:', error);
      throw error;
    }
  }

  // Get transfers for an account
  async getTransfers(accountId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/accounts/${accountId}/transfers?key=${this.apiKey}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching transfers:', error);
      throw error;
    }
  }
}

export default new NessieService();
