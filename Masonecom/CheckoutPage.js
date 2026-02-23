import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
import { RadioButton, Card, Portal, Dialog, Button, Provider as PaperProvider } from 'react-native-paper';

export default function CheckoutScreen({ navigation, route }) {
  const phone = route.params?.phone || 'guest';
  const finalTotal = route.params?.finalTotal || 0;
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [walletBalance, setWalletBalance] = useState(230); // dummy balance
  const isFocused = useIsFocused();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadSelectedAddress();
    }
  }, [isFocused]);

  const loadSelectedAddress = async () => {
    try {
      const stored = await AsyncStorage.getItem(`selected_address_${phone}`);
      if (stored) {
        setSelectedAddress(JSON.parse(stored));
      } else {
        setSelectedAddress(null);
      }
    } catch (error) {
      console.error('Error loading selected address:', error);
    }
  };

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      alert('Please select a delivery address before placing the order.');
      return;
    }
    setShowDialog(true);
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} />
            </TouchableOpacity>
            <Text style={styles.title}>Checkout</Text>
          </View>

          {/* Address Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('AddAddressScreen', { phone })}
              style={styles.addBtn}
            >
              <Icon name="plus-circle" size={20} color="#DA1F49" />
              <Text style={{ color: '#DA1F49', marginLeft: 6 }}>Add / Change Address</Text>
            </TouchableOpacity>

            {selectedAddress ? (
              <View style={[styles.addressCard, styles.selectedCard]}>
                <Text style={styles.addrText}>{selectedAddress.name}</Text>
                <Text style={styles.addrText}>{selectedAddress.street}</Text>
                <Text style={styles.addrText}>
                  {selectedAddress.city}, {selectedAddress.pincode}
                </Text>
              </View>
            ) : (
              <Text style={{ color: 'gray', marginTop: 10 }}>
                No address selected. Please add an address.
              </Text>
            )}
          </View>

          {/* Payment Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>

            {/* Wallet */}
            <TouchableOpacity onPress={() => setPaymentMethod('wallet')}>
              <Card style={[styles.paymentCard, paymentMethod === 'wallet' && styles.selectedCard]}>
                <Card.Content style={styles.cardContent}>
                  <RadioButton
                    value="wallet"
                    status={paymentMethod === 'wallet' ? 'checked' : 'unchecked'}
                    onPress={() => setPaymentMethod('wallet')}
                    color="#DA1F49"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.radioLabel}>Wallet</Text>
                    <Text style={{ fontSize: 13, color: '#555' }}>Balance: ₹{walletBalance}</Text>
                  </View>
                  <TouchableOpacity>
                    <Icon name="plus-circle-outline" size={22} color="#DA1F49" />
                  </TouchableOpacity>
                </Card.Content>
              </Card>
            </TouchableOpacity>

            {/* Online */}
            <TouchableOpacity onPress={() => setPaymentMethod('online')}>
              <Card style={[styles.paymentCard, paymentMethod === 'online' && styles.selectedCard]}>
                <Card.Content style={styles.cardContent}>
                  <RadioButton
                    value="online"
                    status={paymentMethod === 'online' ? 'checked' : 'unchecked'}
                    onPress={() => setPaymentMethod('online')}
                    color="#DA1F49"
                  />
                  <Text style={styles.radioLabel}>Online Payment</Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>

            {/* COD */}
            <TouchableOpacity onPress={() => setPaymentMethod('cod')}>
              <Card style={[styles.paymentCard, paymentMethod === 'cod' && styles.selectedCard]}>
                <Card.Content style={styles.cardContent}>
                  <RadioButton
                    value="cod"
                    status={paymentMethod === 'cod' ? 'checked' : 'unchecked'}
                    onPress={() => setPaymentMethod('cod')}
                    color="#DA1F49"
                  />
                  <Text style={styles.radioLabel}>Cash on Delivery</Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          </View>

          {/* Dialog */}
          <Portal>
            <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)}>
              <Dialog.Title>Order Placed!</Dialog.Title>
              <Dialog.Content>
                <Text>Your order has been placed successfully using {paymentMethod}.</Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setShowDialog(false)}>Okay</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </ScrollView>

        {/* Sticky Footer */}
        <View style={styles.stickyFooter}>
          <TouchableOpacity style={styles.placeOrderBtn} onPress={handlePlaceOrder}>
            <Text style={styles.placeOrderText}>Pay Now (₹{finalTotal.toFixed(2)})</Text>
          </TouchableOpacity>
        </View>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginLeft: 16 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  addressCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  selectedCard: {
    borderColor: '#DA1F49',
    backgroundColor: '#FFF1F5',
  },
  addrText: {
    fontSize: 14,
    color: '#333',
  },
  radioLabel: { fontSize: 14, color: '#333', flex: 1 },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  placeOrderBtn: {
    backgroundColor: '#DA1F49',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  placeOrderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  paymentCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginVertical: 8,
    backgroundColor: '#fff',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
