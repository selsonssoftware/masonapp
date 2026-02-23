// CartScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Card,
  Button,
  Switch,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const CartScreen = () => {
  const [cartItems, setCartItems] = useState([]);
  const [walletAmount, setWalletAmount] = useState("");
  const [selfPickup, setSelfPickup] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  // Load Cart from Session
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem("cart");
      let parsed = savedCart ? JSON.parse(savedCart) : [];
      setCartItems(parsed);
      calculateTotal(parsed);
    } catch (error) {
      console.log("Error loading cart", error);
    }
  };

  // ✅ Update quantity (same as Home Page logic)
  const updateQuantity = async (productId, change) => {
    try {
      const existingCart = await AsyncStorage.getItem("cart");
      let updatedCart = existingCart ? JSON.parse(existingCart) : [];

      const index = updatedCart.findIndex((item) => item.id === productId);
      if (index !== -1) {
        updatedCart[index].quantity += change;
        if (updatedCart[index].quantity <= 0) {
          updatedCart.splice(index, 1);
        }
      }

      await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
      setCartItems(updatedCart);
      calculateTotal(updatedCart);
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  // ✅ Calculate Total Price
  const calculateTotal = (items) => {
    let total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    setTotalPrice(total);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Icon name="arrow-left" size={24} color="black" />
          <Text style={styles.headerTitle}>Aditya Brila Cement</Text>
        </View>

        {/* Cart Items */}
        <Card style={styles.card}>
          <Text style={styles.cardHeading}>Cart Items</Text>
          {cartItems.length > 0 ? (
            cartItems.map((item, index) => (
              <View key={index} style={styles.cartItem}>
                <Image source={{ uri: item.image }} style={styles.itemImg} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.name}</Text>
                  <View style={styles.qtyRow}>
                    <Button
                      mode="outlined"
                      textColor="red"
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.id, -1)}
                    >
                      -
                    </Button>
                    <Text style={styles.qtyText}>{item.quantity} kg</Text>
                    <Button
                      mode="outlined"
                      textColor="red"
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.id, 1)}
                    >
                      +
                    </Button>
                  </View>
                </View>
                <Text style={styles.itemPrice}>
                  ₹{item.price * item.quantity}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ textAlign: "center", marginVertical: 10 }}>
              No items in cart
            </Text>
          )}
        </Card>

        {/* Wallet Section */}
        <Card style={styles.card}>
          <Text style={styles.cardHeading}>Mason Wallet Balance</Text>
          <Text style={{ marginBottom: 5 }}>₹1000.00</Text>
          <View style={styles.walletRow}>
            <TextInput
              placeholder="Enter Amount"
              value={walletAmount}
              onChangeText={setWalletAmount}
              style={styles.input}
              keyboardType="numeric"
            />
            <Button mode="contained" style={styles.redBtn}>+</Button>
          </View>
          <Text style={styles.warning}>⚠ Please Enter Valid Amount</Text>
        </Card>

        {/* Coupon */}
        <Card style={styles.card}>
          <View style={styles.couponHeader}>
            <Text style={styles.cardHeading}>Coupon</Text>
            <TouchableOpacity onPress={() => console.log("Go to Coupon Page")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.couponContainer}>
            {/* Left Side */}
            <View style={styles.couponLeft}>
              <Image
                source={{ uri: "https://i.ibb.co/tBY7kYv/mc.png" }}
                style={styles.couponImg}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.couponText}>
                  Gift card valued at 500 or 10% off at McDonald’s
                </Text>
                <View style={{ flexDirection: "row", marginTop: 5, alignItems: "center" }}>
                  <Text style={styles.discount}>10%</Text>
                  <Text style={styles.validText}>Valid Till 30 Nov</Text>
                </View>
              </View>
            </View>

            {/* Vertical Dotted Line */}
            <View style={styles.dottedLine} />

            {/* Right Side (Coupon Code) */}
            <View style={styles.couponRight}>
              <Text style={styles.couponCode}>XXRVT678</Text>
            </View>
          </View>
        </Card>

        {/* Delivery Address */}
        <Card style={styles.card}>
          <Text style={styles.cardHeading}>Delivery Address</Text>
          <View style={styles.addressRow}>
            <Text>NO:X ABC Street, Kodambakkam</Text>
            <Button mode="contained" style={styles.redBtn}>Change</Button>
          </View>
        </Card>

        {/* Self Pickup */}
        <Card style={styles.card}>
          <Text style={styles.cardHeading}>Self Pickup</Text>
          <View style={styles.pickupRow}>
            <Text>Enable Pickup Option</Text>
            <Switch
              value={selfPickup}
              onValueChange={() => setSelfPickup(!selfPickup)}
            />
          </View>
        </Card>

      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>
          {cartItems.length} item(s)
        </Text>
        <Text style={styles.bottomText}>Pay ₹{totalPrice}</Text>
      </View>
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", padding: 15 },
  headerTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 10 },
  card: { margin: 10, padding: 10, borderRadius: 12 },
  cardHeading: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  cartItem: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  itemImg: { width: 50, height: 50, marginRight: 10 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: "bold" },
  qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  qtyBtn: { marginHorizontal: 5, borderRadius: 5, borderColor: "red" },
  qtyText: { fontSize: 14, fontWeight: "bold", color: "red" },
  itemPrice: { fontSize: 16, fontWeight: "bold", color: "black" },
  redBtn: { backgroundColor: "red", borderRadius: 8 },
  walletRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    paddingHorizontal: 10,
  },
  warning: { color: "red", marginTop: 5, fontSize: 12 },
  couponHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  seeAll: { color: "red", fontWeight: "bold" },
  couponContainer: { flexDirection: "row", alignItems: "center" },
  couponLeft: { flex: 2, flexDirection: "row", alignItems: "center" },
  couponImg: { width: 40, height: 40, marginRight: 10 },
  couponText: { fontSize: 13, fontWeight: "500" },
  discount: {
    backgroundColor: "red",
    color: "white",
    fontWeight: "bold",
    paddingHorizontal: 6,
    borderRadius: 6,
    fontSize: 12,
  },
  validText: { marginLeft: 10, color: "gray", fontSize: 12 },
  dottedLine: {
    width: 1,
    borderStyle: "dotted",
    borderLeftWidth: 1,
    borderColor: "gray",
    height: "100%",
    marginHorizontal: 10,
  },
  couponRight: { flex: 1, alignItems: "center", justifyContent: "center" },
  couponCode: { fontWeight: "bold", fontSize: 14, color: "black" },
  addressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomBar: {
    backgroundColor: "red",
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bottomText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
