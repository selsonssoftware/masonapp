import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ToastAndroid,
  RefreshControl 
} from "react-native";
import { Text, Card, Button, Switch } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useQuery, useQueryClient } from '@tanstack/react-query';

const CART_KEY = "cart";

const CartScreen = ({ navigation }) => {
  const queryClient = useQueryClient();

  // --- States ---
  const [refreshing, setRefreshing] = useState(false); 
  const [cartItems, setCartItems] = useState([]);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletUsed, setWalletUsed] = useState(0);
  const [walletError, setWalletError] = useState("");
  const [selfPickup, setSelfPickup] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [phone, setPhone] = useState("guest");
  const [selectedAddress, setSelectedAddress] = useState(null);
  
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const showToast = (msg) => {
    ToastAndroid.showWithGravity(msg, ToastAndroid.SHORT, ToastAndroid.BOTTOM);
  };

  // --- 1. DATA NORMALIZATION ---
  const normalizeCartItems = (items) =>
    (items || []).map((item) => ({
      ...item,
      product_id: item.product_id ?? item.id ?? null,
      attribute_id: item.attribute_id ?? item.attributeId ?? null,
      qty: Number(item.qty ?? item.quantity ?? 1),
      price: Number(item.price ?? item.attributePrice ?? item.selling ?? 0),
      image: Array.isArray(item.image) ? item.image[0] : item.image,
      name: item.name ?? item.product_name ?? "",
      attribute_name: item.attribute_name ?? item.attributeName ?? "",
    }));

  // --- 2. LOAD DATA ---
  const loadLocalData = async () => {
    try {
      const savedPhone = await AsyncStorage.getItem("phone") || "guest";
      setPhone(savedPhone);
      const savedCart = await AsyncStorage.getItem(CART_KEY);
      let parsed = savedCart ? JSON.parse(savedCart) : [];
      parsed = normalizeCartItems(parsed);
      setCartItems(parsed);
      const total = parsed.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
      setTotalPrice(total);
      const selected = await AsyncStorage.getItem(`selected_address_${savedPhone}`);
      setSelectedAddress(selected ? JSON.parse(selected) : null);
    } catch (error) {
      console.log("Error loading storage", error);
    }
  };

  // --- 3. SWIPE REFRESH LOGIC ---
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries(['userData']);
    await loadLocalData();
    setRefreshing(false);
    showToast("Cart Updated");
  }, [queryClient]);

  useEffect(() => {
    loadLocalData();
    const unsubscribe = navigation.addListener("focus", loadLocalData);
    return unsubscribe;
  }, [navigation]);

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['userData'],
    queryFn: async () => {
      const userId = await AsyncStorage.getItem("user_id");
      if (!userId) return { discount_type: [], cashback_type: [], fullcash_type: [], mason_wallet: 0 };
      const response = await fetch(`https://masonshop.in/api/coupons_customer?id=${userId}`);
      return await response.json();
    },
  });

  // COMBINE ALL 3 COUPON ARRAYS
  const allCoupons = [
    ...(userData?.discount_type || []),
    ...(userData?.cashback_type || []),
    ...(userData?.fullcash_type || [])
  ];

  // --- 4. CALCULATIONS ---
  const finalPayable = Math.max(0, totalPrice - walletUsed - couponDiscount);

  // --- 5. WALLET LOGIC ACTIONS ---
  const applyWalletAmount = () => {
    setWalletError("");
    const entered = parseFloat(walletAmount);
    const balance = Number(userData?.mason_wallet || 0);
    
    if (isNaN(entered) || entered <= 0) {
        setWalletError("Please enter a valid amount");
        return;
    }
    if (entered > balance) {
        setWalletError("Insufficient Wallet Balance");
        return;
    }
    if (entered > totalPrice) {
        setWalletError(`Amount cannot exceed Total (₹${totalPrice})`);
        return;
    }

    setWalletUsed(entered);
    showToast("Wallet Applied");
  };

  const removeWallet = () => {
    setWalletUsed(0);
    setWalletAmount("");
    setWalletError("");
    showToast("Wallet Removed");
  };

  // --- 6. COUPON LOGIC ACTIONS ---
  const applyCoupon = (coupon) => {
    const payableBeforeCoupon = totalPrice - walletUsed;
    if (payableBeforeCoupon <= 0) return showToast("Total is too low for coupon");
    
    if (payableBeforeCoupon < Number(coupon.min_order_amount)) {
        return showToast(`Min Order Amount is ₹${coupon.min_order_amount}`);
    }

    let calculatedDiscount = 0;
    const type = coupon.coupon_type?.toLowerCase();

    // 1. Discount or Full Cash Type (Both reduce from total based on discount_amount)
    if (type === 'discount' || type === 'fullcash' || type === 'full cash') {
        const amt = String(coupon.discount_amount || "0");
        if (amt.includes("%")) {
            calculatedDiscount = (payableBeforeCoupon * parseFloat(amt.replace("%", ""))) / 100;
        } else {
            calculatedDiscount = parseFloat(amt);
        }
        setCouponDiscount(Math.min(calculatedDiscount, payableBeforeCoupon));
        showToast("Coupon Applied");
    } 
    // 2. Cashback Type (No deduction from total)
    else if (type === 'cashback') {
        setCouponDiscount(0); 
        showToast(`₹${coupon.discount_amount || 0} Cashback will be credited after order`);
    }

    setAppliedCoupon(coupon);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    showToast("Coupon Removed");
  };

  const updateQuantity = async (productId, change, attributeId = null) => {
    let updated = cartItems.map(item => {
      if (Number(item.product_id) === Number(productId) && item.attribute_id === attributeId) {
        const newQty = item.qty + change;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean);

    setCartItems(updated);
    const total = updated.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
    setTotalPrice(total);
    
    if (walletUsed > total) {
        setWalletUsed(0);
        setWalletAmount("");
    }

    await AsyncStorage.setItem(CART_KEY, JSON.stringify(updated));
  };

  const removeItem = async (productId, attributeId = null) => {
    let updated = cartItems.filter(item => 
      !(Number(item.product_id) === Number(productId) && item.attribute_id === attributeId)
    );
    setCartItems(updated);
    const total = updated.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
    setTotalPrice(total);
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(updated));
  };

  const proceedNext = () => {
    if (cartItems.length === 0) return showToast("Cart is Empty");
    if (!selfPickup && !selectedAddress) return Alert.alert("Missing Details", "Please select a Delivery Address or enable Self Pickup.");

    navigation.navigate("PaymentScreen", {
      billDetails: { totalPrice, walletUsed, couponDiscount, finalPayable, appliedCoupon },
      deliveryDetails: { selfPickup, selectedAddress, phone },
      cartItems
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{paddingBottom: 100}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#DA1F49"]} />
        }
      >
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
        </View>

        {/* 1. Cart Items */}
        <Card style={styles.card}>
          <Text style={styles.cardHeading}>Cart Items ({cartItems.length})</Text>
          {cartItems.map((item, index) => (
            <View key={index} style={styles.cartItem}>
              <Image source={{ uri: item.image }} style={styles.itemImg} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.name} {item.attribute_name ? `- ${item.attribute_name}` : ""}</Text>
                <Text style={styles.itemSubPrice}>₹{item.price} each</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product_id, -1, item.attribute_id)}><Text style={styles.qtyBtnText}>-</Text></TouchableOpacity>
                  <Text style={styles.qtyText}>{item.qty}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product_id, 1, item.attribute_id)}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
                </View>
              </View>
              <View style={styles.rightBox}>
                <TouchableOpacity style={styles.removeBtnX} onPress={() => removeItem(item.product_id, item.attribute_id)}>
                  <Text style={styles.removeX}>×</Text>
                </TouchableOpacity>
                <Text style={styles.itemPrice}>₹{item.price * item.qty}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* 2. Wallet Section */}
        <Card style={styles.walletCard}>
          <View style={styles.headerRow}>
            <Text style={styles.walletTitle}>Mason Wallet</Text>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Balance</Text>
              <Text style={styles.totalAmount}>₹{userData?.mason_wallet || 0}</Text>
            </View>
          </View>
          
          <TextInput 
            placeholder="Enter amount to redeem" 
            style={[styles.amountInput, walletError ? {borderColor: 'red', borderBottomWidth: 1.5} : null]} 
            value={walletAmount} 
            onChangeText={(t) => { setWalletAmount(t); setWalletError(""); }} 
            keyboardType="numeric" 
            editable={walletUsed === 0}
          />
          
          {walletError !== "" && <Text style={styles.errorText}>{walletError}</Text>}

          <View style={styles.footerRow}>
             {walletUsed > 0 ? (
                <Button mode="contained" onPress={removeWallet} style={[styles.applyBtn, {backgroundColor: '#d32f2f'}]} labelStyle={{color:'white'}}>Remove</Button>
             ) : (
                <Button mode="contained" onPress={applyWalletAmount} style={styles.applyBtn} labelStyle={{color:'white'}}>Apply</Button>
             )}
             {walletUsed > 0 && <Text style={styles.appliedText}>Applied: ₹{walletUsed}</Text>}
          </View>
        </Card>

        {/* 3. Coupons */}
        <Card style={styles.card}>
          <View style={styles.couponHeader}>
            <Text style={styles.cardHeading}>Coupons</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Coupons", { finalAmount: totalPrice })}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {allCoupons.map((c, index) => {
                const applied = appliedCoupon?.id === c.id;
                const type = c.coupon_type?.toLowerCase();
                const isCashback = type === 'cashback';
                
                let displayAmt = "";
                if (isCashback) {
                    displayAmt = `₹${c.discount_amount || 0} Cashback`;
                } else {
                    const amt = String(c.discount_amount || "");
                    if (amt && amt !== "null") {
                       displayAmt = amt.includes('%') ? `${amt} Off` : `₹${amt} Off`;
                    } else {
                       displayAmt = `100% Off`; 
                    }
                }

                return (
                  <View key={index} style={[styles.couponContainer, applied && { borderColor: "green", borderWidth: 2 }]}>
                    <View style={styles.couponLeft}>
                      <Image source={{ uri: c.image }} style={styles.couponImg} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.couponText}>{c.coupon_name}</Text>
                        <Text style={styles.discount}>{displayAmt}</Text>
                      </View>
                    </View>
                    <View style={styles.dottedLine} />
                    <View style={styles.couponRight}>
                      <Text style={styles.couponCode}>{c.coupon_code}</Text>
                      <TouchableOpacity style={[styles.applyBtn, applied && { backgroundColor: "green" }]} onPress={() => applied ? removeCoupon() : applyCoupon(c)}>
                        <Text style={styles.applyText}>{applied ? "Remove" : "Apply"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
            })}
          </ScrollView>
        </Card>

        {/* 4. Delivery Address */}
        <Card style={styles.card}>
          <Text style={styles.cardHeading}>Delivery Address</Text>
          {selectedAddress ? (
            <View style={{marginBottom: 10}}>
              <Text style={{fontSize:16, fontWeight:'bold', color: '#333'}}>{selectedAddress.name || selectedAddress.label || "My Address"}</Text>
              <Text style={{color:'#555', marginTop: 2}}>{selectedAddress.fullAddress}</Text>
              <Text style={{color: "gray", marginTop: 2}}>{selectedAddress.pincode}</Text>
            </View>
          ) : (
            <Text style={{color:'red', marginBottom: 10}}>No address selected</Text>
          )}
          <Button mode="contained" style={styles.redBtn} onPress={() => navigation.navigate("Location", { phone })}>
            {selectedAddress ? "Change Address" : "Select Address"}
          </Button>
        </Card>

        {/* 5. Self Pickup */}
        <Card style={styles.card}>
          <View style={styles.pickupRow}>
             <View>
                <Text style={styles.cardHeading}>Self Pickup</Text>
                <Text style={{color:'gray', fontSize:12}}>Pick up items directly from store</Text>
             </View>
            <Switch value={selfPickup} onValueChange={setSelfPickup} color="#DA1F49" />
          </View>
        </Card>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={{color:'#ffcccc', fontSize:12}}>Total Payable</Text>
          <Text style={styles.bottomText}>₹{finalPayable}</Text>
          {appliedCoupon?.coupon_type?.toLowerCase() === 'cashback' && (
             <Text style={{color:'#90EE90', fontSize:10, fontWeight:'bold'}}>+₹{appliedCoupon.discount_amount || 0} Cashback pending</Text>
          )}
        </View>
        <TouchableOpacity onPress={proceedNext} style={styles.proceedBtn}>
          <Text style={styles.proceedText}>Proceed →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", paddingTop: 40 },
  header: { flexDirection: "row", alignItems: "center", padding: 15, backgroundColor:'#fff' },
  headerTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 15, color:'#000' },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 16, marginHorizontal: 12, marginVertical: 8, elevation: 2 },
  cardHeading: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#111" },
  cartItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  itemImg: { width: 70, height: 70, borderRadius: 12, backgroundColor: "#f5f5f5" },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemTitle: { fontSize: 15, fontWeight: "600", color: "#333" },
  itemSubPrice: { fontSize: 13, color: "#666", marginTop: 4 },
  qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 8, backgroundColor: "#f5f5f5", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, alignSelf: "flex-start" },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 1 },
  qtyBtnText: { fontSize: 18, fontWeight: "700", color: "#333" },
  qtyText: { fontSize: 16, marginHorizontal: 12, fontWeight: "600", color: "#000" },
  rightBox: { alignItems: "flex-end", justifyContent: "space-between", height: 70 },
  itemPrice: { fontSize: 16, fontWeight: "700", color: "#111" },
  removeBtnX: { backgroundColor: "#ffebee", width: 26, height: 26, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  removeX: { fontSize: 18, fontWeight: "bold", color: "#d32f2f", marginTop: -2 },
  walletCard: { borderRadius: 16, padding: 16, backgroundColor: "#fff", elevation: 2, marginHorizontal: 12, marginVertical: 8 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  walletTitle: { fontSize: 16, fontWeight: "700", color: "#2E7D32" },
  amountInput: { height: 45, borderBottomWidth: 1, borderColor: "#ddd", paddingHorizontal: 10, backgroundColor: "#fff", marginBottom: 5 },
  errorText: { color: 'red', fontSize: 12, marginBottom: 10, marginLeft: 5, fontWeight: 'bold' },
  footerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  appliedText: { fontSize: 14, color: "green", fontWeight:'600' },
  totalBox: { backgroundColor: "#FFF3E0", borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, alignItems: "center" },
  totalLabel: { color: "#E65100", fontSize: 10, fontWeight: "600" },
  totalAmount: { color: "#E65100", fontSize: 17, fontWeight: "bold" },
  couponHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  seeAll: { color: "#DA1F49", fontSize: 14, fontWeight: 'bold' },
  couponContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff7f0", borderRadius: 10, marginRight: 10, padding: 10, borderWidth: 1, borderColor: "#ffe0b2", minWidth: 260 },
  couponLeft: { flexDirection: "row", flex: 1, alignItems: 'center' },
  couponImg: { width: 35, height: 35, marginRight: 10 },
  couponText: { fontSize: 13, fontWeight: "600" },
  discount: { fontSize: 11, fontWeight: "bold", color: "#DA1F49" },
  dottedLine: { width: 1, height: "80%", borderStyle: "dashed", borderLeftWidth: 1, borderColor: "#ccc", marginHorizontal: 10 },
  couponRight: { alignItems: "center" },
  couponCode: { fontSize: 11, fontWeight: "bold", color:'#333' },
  applyBtn: { marginTop: 5, backgroundColor: "#DA1F49", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  applyText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  redBtn: { backgroundColor: "#DA1F49", borderRadius: 8, marginTop: 5 },
  pickupRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bottomBar: { backgroundColor: "#DA1F49", paddingHorizontal: 20, paddingVertical: 15, flexDirection: "row", justifyContent: "space-between", alignItems: 'center', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  bottomText: { color: "white", fontSize: 22, fontWeight: "bold" },
  proceedBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20},
  proceedText: { color: 'white', fontWeight:'bold', fontSize: 15}
});