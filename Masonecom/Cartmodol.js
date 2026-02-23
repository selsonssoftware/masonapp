import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text, Card, Button, Switch } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import {
  CFEnvironment,
  CFSession,
  CFThemeBuilder,
  CFDropCheckoutPayment,
} from "cashfree-pg-api-contract";
import { CFPaymentGatewayService } from "react-native-cashfree-pg-sdk";

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletBalance, setWalletBalance] = useState(1000);
  const [walletUsed, setWalletUsed] = useState(0);
  const [selfPickup, setSelfPickup] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [phone, setPhone] = useState("9843860940");
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const orderId = "ORD" + new Date().getTime();

  // NORMALIZE (attribute_id & attribute_name fixed)
  const normalizeCartItems = (items) =>
    (items || []).map((item) => ({
      ...item,
      attribute_id: item.attribute_id ?? null,
      attribute_name: item.attribute_name ?? null,
      quantity:
        typeof item.quantity === "number"
          ? item.quantity
          : parseInt(item.quantity) || 1,
      price:
        item.price ??
        item.attributePrice ??
        item.selling ??
        0,
      image: Array.isArray(item.image) ? item.image[0] : item.image,
    }));

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem("cart");
      const savedPhone = await AsyncStorage.getItem("phone");
      const phoneNumber = savedPhone || "guest";

      setPhone(phoneNumber);

      let parsed = savedCart ? JSON.parse(savedCart) : [];
      parsed = normalizeCartItems(parsed);

      setCartItems(parsed);
      calculateTotal(parsed);

      setCartCount(parsed.reduce((s, i) => s + (i.quantity || 0), 0));

      const selected = await AsyncStorage.getItem(
        `selected_address_${phoneNumber}`
      );
      if (selected) setSelectedAddress(JSON.parse(selected));
    } catch (e) {
      console.log("Load cart error:", e);
    }
  };

  useEffect(() => {
    loadCart();
    const unsubscribe = navigation.addListener("focus", loadCart);
    return unsubscribe;
  }, [navigation]);

  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => {
      return sum + Number(item.price) * Number(item.quantity);
    }, 0);
    setTotalPrice(total);
  };

  // UPDATE QUANTITY (attribute_id FIXED)
  const updateQuantity = async (productId, change, attributeId = null) => {
    try {
      const raw = await AsyncStorage.getItem("cart");
      let updatedCart = raw ? JSON.parse(raw) : [];

      const attr = attributeId ?? null;

      const index = updatedCart.findIndex(
        (item) =>
          item.id === productId &&
          (item.attribute_id ?? null) === (attr ?? null)
      );

      if (index !== -1) {
        updatedCart[index].quantity =
          (updatedCart[index].quantity || 0) + change;

        if (updatedCart[index].quantity <= 0) {
          updatedCart.splice(index, 1);
        }
      }

      updatedCart = normalizeCartItems(updatedCart);

      await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
      setCartItems(updatedCart);

      calculateTotal(updatedCart);
      setCartCount(updatedCart.reduce((s, i) => s + (i.quantity || 0), 0));
    } catch (err) {
      console.log("Qty update error:", err);
    }
  };

  // REMOVE ITEM
  const removeItem = async (productId, attributeId = null) => {
    try {
      let updatedCart = await AsyncStorage.getItem("cart");
      updatedCart = updatedCart ? JSON.parse(updatedCart) : [];

      const attr = attributeId ?? null;

      updatedCart = updatedCart.filter(
        (item) =>
          !(
            item.id === productId &&
            (item.attribute_id ?? null) === (attr ?? null)
          )
      );

      updatedCart = normalizeCartItems(updatedCart);

      await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
      setCartItems(updatedCart);

      calculateTotal(updatedCart);
      setCartCount(updatedCart.reduce((s, i) => s + (i.quantity || 0), 0));
    } catch (e) {
      console.log("Remove error:", e);
    }
  };

  // APPLY WALLET
  const applyWalletAmount = () => {
    let amount = Number(walletAmount);

    if (!amount || amount <= 0)
      return Alert.alert("Invalid amount");

    if (amount > walletBalance)
      return Alert.alert("Not enough wallet balance");

    if (amount > totalPrice)
      return Alert.alert("Wallet cannot exceed total price");

    setWalletUsed(amount);
  };

  // FETCH COUPONS
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const userId = await AsyncStorage.getItem("user_id");
        if (!userId) return setLoading(false);

        const res = await fetch(
          `https://masonshop.in/api/coupons_customer?id=${userId}`
        );

        const data = await res.json();

        if (data?.discount_type) setCoupons(data.discount_type);
      } catch (err) {
        console.log("Coupon error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  const applyCoupon = (coupon) => {
    if (totalPrice < coupon.min_order_amount) {
      return Alert.alert(
        "Not Eligible",
        `Minimum order ₹${coupon.min_order_amount}`
      );
    }

    let discount = 0;

    if (coupon.discount_amount.includes("%")) {
      const p = parseFloat(coupon.discount_amount.replace("%", ""));
      discount = (totalPrice * p) / 100;
    } else {
      discount = parseFloat(coupon.discount_amount);
    }

    setAppliedCoupon(coupon);
    setCouponDiscount(discount);
  };

  const finalPayable = Math.max(
    0,
    totalPrice - walletUsed - couponDiscount
  );

  // SAVE ORDER TO SERVER
  const placeOrderOnServer = async () => {
    try {
      const userId = await AsyncStorage.getItem("user_id");
      if (!userId) {
        Alert.alert("Error", "Login required.");
        return false;
      }

      const formattedCart = cartItems.map((item) => ({
        product_id: item.id,
        attribute_id: item.attribute_id ?? null,
        quantity: item.quantity,
        price: item.price,
      }));

      const orderData = {
        user_id: userId,
        total_price: totalPrice,
        final_amount: finalPayable,
        wallet_amount_used: walletUsed,
        discount_amount: couponDiscount,
        coupon_applied: appliedCoupon ? 1 : 0,
        coupon_code: appliedCoupon?.coupon_code || null,
        delivery_address: selectedAddress?.fullAddress || "Not Provided",
        self_pickup: selfPickup ? 1 : 0,
        items: formattedCart,
      };

      const response = await fetch(
        "https://masonshop.in/api/get_cart",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.status) {
        throw new Error(result.message || "Server error");
      }

      return true;
    } catch (err) {
      Alert.alert("Order Error", err.message);
      return false;
    }
  };

  // PAYMENT GATEWAY (Cashfree drop-in)
  const startPayment = async () => {
    if (!selectedAddress && !selfPickup)
      return Alert.alert("Select address or enable pickup.");

    if (cartItems.length === 0)
      return Alert.alert("Cart is empty.");

    try {
      const totalAmount = Number(finalPayable);

      // If total payable is zero (wallet+coupon), just save order
      if (totalAmount <= 0.01) {
        const saved = await placeOrderOnServer();
        if (saved) {
          if (walletUsed > 0) setWalletBalance((p) => p - walletUsed);
          await AsyncStorage.removeItem("cart");
          setCartItems([]);
          setCartCount(0);
          setWalletUsed(0);
          setWalletAmount("");
          navigation.replace("SuccessScreen", { orderId, amount: 0 });
        }
        return;
      }

      // Create order on Cashfree sandbox
      const orderPayload = {
        order_amount: totalAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: "cust_001",
          customer_name: "Test User",
          customer_email: "samy9843@gmail.com",
          customer_phone: phone || "9843860940",
        },
      };

      const res = await fetch("https://sandbox.cashfree.com/pg/orders", {
        method: "POST",
        headers: {
          "x-client-id": Config.CASHFREE_CLIENT_ID,
    "x-client-secret": Config.CASHFREE_CLIENT_SECRET,
          "x-api-version": "2023-08-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (!data.payment_session_id) {
        console.log("Cashfree create order failed:", data);
        throw new Error("Failed to create payment session.");
      }

      const { payment_session_id, order_id } = data;

      // Build Cashfree SDK objects
      const session = new CFSession(payment_session_id, order_id, CFEnvironment.SANDBOX);

      const theme = new CFThemeBuilder()
        .setNavigationBarBackgroundColor("#E64A19")
        .setNavigationBarTextColor("#FFFFFF")
        .setButtonBackgroundColor("#FFC107")
        .setButtonTextColor("#FFFFFF")
        .setPrimaryTextColor("#212121")
        .setSecondaryTextColor("#757575")
        .build();

      const dropPayment = new CFDropCheckoutPayment(session, null, theme);

      CFPaymentGatewayService.setCallback({
        async onVerify(cashfreeOrderID) {
          console.log("Cashfree onVerify:", cashfreeOrderID);

          const saved = await placeOrderOnServer();

          if (saved) {
            if (walletUsed > 0) setWalletBalance((p) => p - walletUsed);

            // Clear cart
            await AsyncStorage.removeItem("cart");
            setCartItems([]);
            setCartCount(0);
            setWalletUsed(0);
            setWalletAmount("");

            navigation.replace("SuccessScreen", {
              orderId: cashfreeOrderID,
              amount: finalPayable,
            });
          } else {
            Alert.alert(
              "Order Save Failed",
              "Payment succeeded, but we couldn't save order. Contact support with ID: " +
                cashfreeOrderID
            );
          }
        },
        onError(error, cashfreeOrderID) {
          console.log("Cashfree onError:", cashfreeOrderID, error);
          Alert.alert("Payment Failed", error?.message || "Payment error occurred");
        },
      });

      // Trigger the payment
      CFPaymentGatewayService.doPayment(dropPayment);
    } catch (err) {
      console.log("Payment Error:", err);
      Alert.alert("Payment Error", err.message || "An unknown error occurred during payment.");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
        </View>

        {/* CART ITEMS */}
        <Card style={styles.card}>
          <Text style={styles.cardHeading}>Cart Items</Text>

          {cartItems.length > 0 ? (
            cartItems.map((item, index) => (
              <View key={index} style={styles.cartItem}>
                <Image source={{ uri: item.image }} style={styles.itemImg} />

                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>
                    {item.name}
                    {item.attribute_name
                      ? ` - ${item.attribute_name}`
                      : ""}
                  </Text>

                  <Text style={styles.itemSubPrice}>
                    ₹{Number(item.price).toFixed(2)} each
                  </Text>

                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() =>
                        updateQuantity(item.id, -1, item.attribute_id)
                      }
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.qtyText}>{item.quantity}</Text>

                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() =>
                        updateQuantity(item.id, 1, item.attribute_id)
                      }
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.rightBox}>
                  <TouchableOpacity
                    style={styles.removeBtnX}
                    onPress={() =>
                      removeItem(item.id, item.attribute_id)
                    }
                  >
                    <Text style={styles.removeX}>×</Text>
                  </TouchableOpacity>

                  <Text style={styles.itemPrice}>
                    ₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ textAlign: "center", marginVertical: 10 }}>
              No items in cart
            </Text>
          )}
        </Card>

        {/* WALLET */}
        <Card style={styles.card}>
          <Text style={styles.cardHeading}>Mason Wallet Balance</Text>
          <Text style={{ marginBottom: 5 }}>
            ₹{walletBalance.toFixed(2)}
          </Text>

          <View style={styles.walletRow}>
            <TextInput
              placeholder="Enter Amount"
              value={walletAmount}
              onChangeText={setWalletAmount}
              style={styles.input}
              keyboardType="numeric"
            />
            <Button
              mode="contained"
              style={styles.redBtn}
              onPress={applyWalletAmount}
            >
              Apply
            </Button>
          </View>

          {walletUsed > 0 && (
            <Text style={{ color: "green", marginTop: 5 }}>
              Applied ₹{walletUsed}
            </Text>
          )}
        </Card>

        {/* COUPONS */}
        <Card style={styles.card}>
          <View style={styles.couponHeader}>
            <Text style={styles.cardHeading}>Coupons</Text>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Coupons", {
                  finalAmount: finalPayable.toFixed(2),
                })
              }
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" style={{ margin: 10 }} />
          ) : coupons.length === 0 ? (
            <Text style={{ margin: 10 }}>No coupons available</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {coupons.map((coupon, index) => {
                const applied = appliedCoupon?.id === coupon.id;

                return (
                  <View
                    key={index}
                    style={[
                      styles.couponContainer,
                      applied && { borderColor: "green", borderWidth: 2 },
                    ]}
                  >
                    <View style={styles.couponLeft}>
                      <Image
                        source={{ uri: coupon.image }}
                        style={styles.couponImg}
                      />

                      <View style={{ flex: 1 }}>
                        <Text style={styles.couponText}>
                          {coupon.coupon_name}
                        </Text>

                        <View
                          style={{
                            flexDirection: "row",
                            marginTop: 5,
                          }}
                        >
                          <Text style={styles.discount}>
                            {coupon.discount_amount}
                          </Text>

                          <Text style={styles.validText}>
                            {coupon.expires_at
                              ? `Valid Till ${coupon.expires_at}`
                              : "No Expiry"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.dottedLine} />

                    <View style={styles.couponRight}>
                      <Text style={styles.couponCode}>
                        {coupon.coupon_code}
                      </Text>

                      {applied ? (
                        <View
                          style={[
                            styles.applyBtn,
                            { backgroundColor: "green" },
                          ]}
                        >
                          <Text style={styles.applyText}>Applied</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.applyBtn}
                          onPress={() => applyCoupon(coupon)}
                        >
                          <Text style={styles.applyText}>Apply</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {appliedCoupon && (
            <Text style={{ marginTop: 5, color: "green" }}>
              Coupon {appliedCoupon.coupon_code} applied!
            </Text>
          )}
        </Card>

        {/* ADDRESS */}
        <Card style={styles.card}>
          <Text style={styles.cardHeading}>Delivery Address</Text>

          <View style={styles.addressRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              {selectedAddress ? (
                <>
                  <Text style={{ fontSize: 14, marginBottom: 5 }}>
                    {selectedAddress.fullAddress}
                  </Text>

                  <Text style={{ fontSize: 12, color: "gray" }}>
                    {selectedAddress.street} {selectedAddress.city}{" "}
                    {selectedAddress.pincode}
                  </Text>
                </>
              ) : (
                <Text style={{ color: "gray" }}>
                  No address selected
                </Text>
              )}
            </View>

            <Button
              mode="contained"
              style={styles.redBtn}
              onPress={() =>
                navigation.navigate("Location", { phone })
              }
            >
              Change
            </Button>
          </View>
        </Card>

        {/* SELF PICKUP */}
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

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>{cartCount} item(s)</Text>
        <TouchableOpacity onPress={startPayment}>
          <Text style={styles.bottomText}>
            Pay ₹{finalPayable.toFixed(2)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CartScreen;

/* ============================== STYLES ============================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: { flexDirection: "row", alignItems: "center", padding: 15 },

  headerTitle: { marginLeft: 10, fontSize: 18, fontWeight: "bold" },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  cardHeading: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111",
  },

  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  itemImg: {
    width: 65,
    height: 65,
    borderRadius: 14,
    backgroundColor: "#f5f5f5",
  },

  itemInfo: { flex: 1, marginLeft: 12 },

  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },

  itemSubPrice: {
    fontSize: 14,
    color: "#666",
    marginTop: 3,
  },

  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#f2f2f2",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  qtyBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },

  qtyText: {
    fontSize: 16,
    marginHorizontal: 12,
    fontWeight: "600",
    color: "#000",
  },

  rightBox: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 65,
  },

  itemPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginTop: 4,
  },

  removeBtnX: {
    backgroundColor: "rgba(255, 0, 0, 0.10)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },

  removeX: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ff3b3b",
    marginTop: -2,
  },

  couponHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },

  seeAll: {
    color: "#E64A19",
    fontSize: 14,
    fontWeight: "bold",
  },

  couponContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7f0",
    borderRadius: 10,
    marginRight: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#f2c2a0",
  },

  couponLeft: { flexDirection: "row", flex: 1, alignItems: "center" },

  couponImg: { width: 40, height: 40, marginRight: 10 },

  couponText: { fontSize: 12, fontWeight: "500", flexShrink: 1 },

  discount: {
    fontSize: 12,
    fontWeight: "bold",
    marginRight: 10,
    backgroundColor: "#DA1F49",
    color: "white",
    paddingHorizontal: 6,
    borderRadius: 6,
  },

  validText: { fontSize: 11, color: "gray" },

  dottedLine: {
    width: 1,
    height: "80%",
    borderStyle: "dashed",
    borderLeftWidth: 1,
    borderColor: "#aaa",
    marginHorizontal: 10,
  },

  couponRight: { alignItems: "center" },
  couponCode: { fontSize: 12, fontWeight: "bold" },

  applyBtn: {
    marginTop: 5,
    backgroundColor: "#E64A19",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },

  applyText: { color: "#fff", fontSize: 12, fontWeight: "bold" },

  walletRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    paddingHorizontal: 10,
    height: 40,
  },

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
    backgroundColor: "#DA1F49",
    padding: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  bottomText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
