import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Animated,
  Easing,
  Image
} from "react-native";
import { Text, Card, Divider } from "react-native-paper"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// CASHFREE SDK
import {
  CFEnvironment,
  CFSession,
  CFThemeBuilder,
  CFDropCheckoutPayment,
} from "cashfree-pg-api-contract";
import { CFPaymentGatewayService } from "react-native-cashfree-pg-sdk";

// --- CUSTOM JUMPING LOADER COMPONENT ---
const JumpingLoader = () => {
  const jumpValue1 = useRef(new Animated.Value(0)).current;
  const jumpValue2 = useRef(new Animated.Value(0)).current;
  const jumpValue3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createJump = (value, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: -15, 
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0, 
            duration: 300,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
          Animated.delay(600), 
        ])
      );
    };

    const anim1 = createJump(jumpValue1, 0);
    const anim2 = createJump(jumpValue2, 200);
    const anim3 = createJump(jumpValue3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  return (
    <View style={styles.loaderContainer}>
      <Animated.Image
        source={require("../assets/technology.png")}
        style={[styles.jumpIcon, { transform: [{ translateY: jumpValue3 }] }]}
      />
      <Animated.Image
        source={require("../assets/cement1.png")}
        style={[styles.jumpIcon, { transform: [{ translateY: jumpValue2 }] }]}
      />
      <Animated.Image
        source={require("../assets/brickwall.png")}
        style={[styles.jumpIcon, { transform: [{ translateY: jumpValue1 }] }]}
      />
    </View>
  );
};

const PaymentScreen = ({ route, navigation }) => {
  const { billDetails, deliveryDetails, cartItems } = route.params;
  const { totalPrice, walletUsed, couponDiscount, finalPayable, appliedCoupon } = billDetails;
  
  const [paymentType, setPaymentType] = useState("full");
  const [bookingAmount, setBookingAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const isProcessing = useRef(false);

  useEffect(() => {
    try { CFPaymentGatewayService.removeCallback(); } catch (e) { console.log(e); }
    const checkCart = async () => {
        const currentCart = await AsyncStorage.getItem("cart");
        if (!currentCart || JSON.parse(currentCart).length === 0) {
             navigation.popToTop();
        }
    };
    checkCart();
    return () => { try { CFPaymentGatewayService.removeCallback(); } catch (e) { console.log(e); } };
  }, []);

  const forceSuccessNavigation = async (orderId, amount) => {
      try {
          await AsyncStorage.setItem("cart", JSON.stringify([]));
          await AsyncStorage.multiRemove(["cashfree_order_id", "payment_session_id"]);
          setTimeout(() => {
              navigation.replace("SuccessScreen", { orderId, amount });
          }, 1500);
      } catch (e) {
          setLoading(false);
          navigation.popToTop();
      }
  };

  const placeOrderOnServer = async (cashfreeOrderId = null) => {
    try {
      const userId = await AsyncStorage.getItem("user_id");
      
      // --- COUPON VALUE LOGIC FIX FOR API ---
      // If it's cashback, the UI discount is 0, so we pull the actual value from the appliedCoupon object.
      // If it's discount or fullcash, couponDiscount holds the exact deducted amount.
      let apiDiscountAmount = couponDiscount;
      if (appliedCoupon && appliedCoupon.coupon_type?.toLowerCase() === 'cashback') {
          apiDiscountAmount = Number(appliedCoupon.discount_amount) || 0;
      }

      const payload = {
        user_id: userId,
        total_price: totalPrice,
        final_amount: finalPayable,
        wallet_amount_used: walletUsed,
        discount_amount: apiDiscountAmount, // <--- Sends the same variable for all 3 types
        coupon_applied: appliedCoupon ? 1 : 0,
        coupon_code: appliedCoupon?.coupon_code || null,
        delivery_address: deliveryDetails.selfPickup ? "Self Pickup" : (deliveryDetails.selectedAddress?.fullAddress || "Not Provided"),
        self_pickup: deliveryDetails.selfPickup ? 1 : 0,
        booking_amount: paymentType === "booking" ? bookingAmount : 0,
        remaining_amount: paymentType === "booking" ? Math.max(0, finalPayable - bookingAmount) : 0,
        payment_type: paymentType,
        payment_gateway_order_id: cashfreeOrderId,
        items: cartItems.map((i) => ({
          product_id: i.product_id,
          attribute_id: i.attribute_id,
          quantity: i.qty,
          price: i.price,
        })),
      };
      
      const res = await fetch("https://masonshop.in/api/get_cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data.status;
    } catch (e) {
      return false;
    }
  };

  const handlePayment = async () => {
    if (isProcessing.current) return;
    const amountToPay = paymentType === "booking" ? Number(bookingAmount) : Number(finalPayable);

    if (paymentType === "booking") {
        if (amountToPay < 200) return Alert.alert("Limit", "Minimum booking amount is ₹200");
        if (amountToPay > finalPayable) return Alert.alert("Invalid Amount", "Booking amount cannot be greater than Total Bill.");
    }

    isProcessing.current = true; 
    setLoading(true);
    const uniqueOrderId = "ORD_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

    if (amountToPay <= 0) {
        await placeOrderOnServer(uniqueOrderId);
        await forceSuccessNavigation(uniqueOrderId, 0);
        return;
    }

    try {
        const res = await fetch("https://sandbox.cashfree.com/pg/orders", {
            method: "POST",
            headers: {
                 "x-client-id": Config.CASHFREE_CLIENT_ID,
    "x-client-secret": Config.CASHFREE_CLIENT_SECRET,

              "x-api-version": "2023-08-01",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              order_amount: amountToPay,
              order_currency: "INR",
              order_id: uniqueOrderId,
              customer_details: {
                customer_id: (await AsyncStorage.getItem("user_id")) || "guest",
                customer_phone: deliveryDetails.phone,
                customer_name: "Customer",
                customer_email: "pay@masonshop.in",
              },
            }),
        });
        const data = await res.json();
        const session = new CFSession(data.payment_session_id, data.order_id, CFEnvironment.SANDBOX);
        const theme = new CFThemeBuilder().setNavigationBarBackgroundColor("#DA1F49").setNavigationBarTextColor("#fff").setButtonBackgroundColor("#DA1F49").setButtonTextColor("#fff").build();
        const drop = new CFDropCheckoutPayment(session, null, theme);

        CFPaymentGatewayService.setCallback({
            async onVerify(cfId) {
                await placeOrderOnServer(cfId);
                await forceSuccessNavigation(cfId, amountToPay);
            },
            onError(err) {
                setLoading(false);
                isProcessing.current = false;
                navigation.navigate("FailedScreen", { reason: err?.message || "Payment cancelled." });
            }
        });
        CFPaymentGatewayService.doPayment(drop);
    } catch (e) {
        setLoading(false); 
        isProcessing.current = false;
        Alert.alert("Error", e.message);
    }
  };

  const currentPayable = paymentType === "booking" ? Number(bookingAmount) : Number(finalPayable);

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loaderOverlay}>
            <JumpingLoader />
            <Text style={styles.loadingText}>Building your order...</Text>
            <Text style={styles.loadingSubText}>Please wait securely</Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
            <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Payment</Text>
      </View>

      <ScrollView contentContainerStyle={{padding: 15}}>
        <Card style={styles.billCard}>
            <Text style={styles.heading}>Order Summary</Text>
            
            <View style={styles.row}>
                <Text style={styles.billLabel}>Total Order Amount</Text>
                <Text style={styles.billValue}>₹{totalPrice}</Text>
            </View>

            {walletUsed > 0 && (
                <View style={styles.row}>
                    <Text style={styles.billLabel}>Wallet Discount</Text>
                    <Text style={[styles.billValue, {color: 'green'}]}>- ₹{walletUsed}</Text>
                </View>
            )}

            {/* Display Coupon Discount if applicable */}
            {couponDiscount > 0 && (
                <View style={styles.row}>
                    <Text style={styles.billLabel}>Coupon Discount ({appliedCoupon?.coupon_code})</Text>
                    <Text style={[styles.billValue, {color: 'green'}]}>- ₹{couponDiscount}</Text>
                </View>
            )}

            {/* Display Cashback Pending if applicable */}
            {appliedCoupon && appliedCoupon.coupon_type?.toLowerCase() === 'cashback' && (
                <View style={styles.row}>
                    <Text style={styles.billLabel}>Cashback Pending ({appliedCoupon.coupon_code})</Text>
                    <Text style={[styles.billValue, {color: 'green'}]}>+ ₹{appliedCoupon.discount_amount}</Text>
                </View>
            )}

            <Divider style={{marginVertical: 10}} />

            <View style={styles.row}>
                <Text style={[styles.billLabel, {fontSize: 16, fontWeight: 'bold'}]}>Remaining Payable</Text>
                <Text style={[styles.billValue, {fontSize: 16, fontWeight: 'bold', color: '#DA1F49'}]}>₹{finalPayable}</Text>
            </View>
        </Card>

        <Text style={styles.sectionTitle}>Payment Mode</Text>
        
        <TouchableOpacity style={[styles.optionBox, paymentType === 'full' && styles.optionActive]} onPress={() => setPaymentType('full')} disabled={loading}>
            <Icon name={paymentType === 'full' ? "radiobox-marked" : "radiobox-blank"} size={24} color="#DA1F49" />
            <Text style={{marginLeft:10, fontWeight:'bold'}}>Full Payment (₹{finalPayable})</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.optionBox, paymentType === 'booking' && styles.optionActive]} onPress={() => { setPaymentType('booking'); setBookingAmount(200); }} disabled={loading}>
            <Icon name={paymentType === 'booking' ? "radiobox-marked" : "radiobox-blank"} size={24} color="#DA1F49" />
            <Text style={{marginLeft:10, fontWeight:'bold'}}>Booking Amount</Text>
        </TouchableOpacity>

        {paymentType === 'booking' && (
             <View style={styles.bookingContainer}>
                <Text style={{marginBottom:10, color:'gray'}}>Select Amount:</Text>
                <View style={{flexDirection:'row', gap: 10, marginBottom: 15}}>
                    {[200, 500, 1000].map(amt => (
                        <TouchableOpacity 
                            key={amt} 
                            style={[styles.chip, bookingAmount === amt && styles.chipActive]}
                            onPress={() => setBookingAmount(amt)}
                            disabled={loading}
                        >
                            <Text style={bookingAmount === amt ? {color:'#fff', fontWeight:'bold'} : {color:'#000'}}>₹{amt}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="Or enter custom amount" 
                    value={bookingAmount ? String(bookingAmount) : ""}
                    onChangeText={(t) => setBookingAmount(Number(t))}
                    editable={!loading}
                />
                <Text style={{fontSize:12, color:'gray', marginTop:5}}>
                    Remaining: ₹{Math.max(0, finalPayable - bookingAmount)}
                </Text>
            </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View><Text style={{color:'#fff'}}>You Pay</Text><Text style={{color:'#fff', fontSize: 22, fontWeight:'bold'}}>₹{currentPayable}</Text></View>
        <TouchableOpacity style={[styles.payBtn, loading && {opacity:0.6}]} onPress={handlePayment} disabled={loading}>
            <Text style={styles.payText}>{loading ? "PROCESSING..." : "PAY NOW"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  billCard: { padding: 15, backgroundColor: '#fff', borderRadius: 10, marginBottom: 20, marginHorizontal: 5, elevation: 2 },
  heading: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel: { fontSize: 14, color: '#666' },
  billValue: { fontSize: 14, fontWeight: '600', color: '#000' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#555' },
  optionBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  optionActive: { borderColor: '#DA1F49', backgroundColor: '#fff5f7' },
  bookingContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginTop: -5, marginBottom: 20 },
  chip: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: '#eee', borderWidth:1, borderColor:'#ddd' },
  chipActive: { backgroundColor: '#DA1F49', borderColor: '#DA1F49' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, width: '100%', backgroundColor:'#fff' },
  footer: { backgroundColor: '#333', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  payBtn: { backgroundColor: '#DA1F49', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  payText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  loaderOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.95)', zIndex: 999, justifyContent: 'center', alignItems: 'center' },
  loaderContainer: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  jumpIcon: { width: 50, height: 50, resizeMode: 'contain' },
  loadingText: { fontSize: 18, fontWeight: 'bold', color: '#DA1F49' },
  loadingSubText: { fontSize: 14, color: '#888', marginTop: 5 }
});