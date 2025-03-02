import React, { useState } from "react";
import { View, Text, Modal, Image, Button, TouchableOpacity, FlatList, StyleSheet } from "react-native";

const ReceivePaymentsModal = ({ visible, onClose }) => {
  const [users, setUsers] = useState([
    { id: "1", name: "Elliot Cao", status: "pending", amount: "--", picture: require("../assets/default-profile.png") },
    { id: "2", name: "Skyla Jin", status: "sent", amount: "$5.00", picture: require("../assets/default-profile.png")  },
    
  ]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Receiving Payments</Text>
            <Image style={styles.timeLogo} source={require('../assets/time.png')}/>
          </View>

          {/* List of users */}
          <View style={styles.listContainer}>
            <Text style={styles.sectionHeader}>CONNECTED USERS</Text>
            <View style={styles.connectedUsersContainer}>
              <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.userRow}>
                    <View style={styles.row1}>
                      <Image style={styles.profilePic} source={item.picture}/>
                      <View style={styles.col1}>
                        <Text style={styles.userName}>{item.name}</Text>
                        <Text style={item.status === "sent" ? styles.paidText : styles.pendingText}>
                          {item.status === "sent" ? "Payment sent" : "Payment pending..."}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.amount}>{item.amount}</Text>
                  </View>
                )}
              />
            </View>
            <View style={styles.totalContainer}>
              <Text style={styles.total}>Total:</Text>
              <Text style={styles.total}>$5.00</Text>
            </View>
          </View>


          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Finish Receiving Payments</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FBFBFC",
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 64,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: 788,
    width: "100%",
  },
  titleContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 28
  },
  timeLogo: {
    height: 24,
    width: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Figtree',
    fontWeight: "700",
    color: '#20859E',
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: "gray",
    marginTop: 5,
  },
  paymentTitle: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
    marginTop: 5,
    color: "#2a5d87",
  },
  listContainer: {
    borderWidth: 1.5,
    borderColor: "#95DBDA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 28,
    gap: 4
  },
  sectionHeader: {
    fontSize: 14,
    color: '#1B4965', 
    fontWeight: '600',
    fontFamily: 'Figtree',
    marginBottom: 24,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  profilePic: {
    width: 42,
    height: 42
  },
  row1: {
    flexDirection: 'row',
    gap: 16
  },
  col1: {
    flexDirection: 'column',
    gap: 2
  },
  userName: {
    color: '#19191D',
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Figtree'
  },
  paidText: {
    color: "#20859E",
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Figtree'
  },
  pendingText: {
    color: "#B3B3BB",
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Figtree'
  },
  amount: {
    color: "#20859E",
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Figtree'
  },
  total: {
    textAlign: "right",
    color: "#1B4965",
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Figtree'
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: "space-between",
  },
  closeButton: {
    backgroundColor: '#62B6CB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  closeButtonText: {
    color: '#FBFBFC',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Figtree'
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ReceivePaymentsModal;
