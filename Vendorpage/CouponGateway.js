import React, { useState, useEffect, useRef } from "react";
import {
  View, StyleSheet, TouchableOpacity, Alert,
  ScrollView, Animated, Easing, Platform
} from "react-native";
import { Text, Card, Button } from "react-native-paper";
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

const PaymentScreen = ({ route, navigation }) => {
  const { couponData } = route.params; // Data from CreateCoupon form
  const [loading, setLoading] = useState(false);
  const isProcessing = useRef(false);

  // --- 1. SDK CLEANUP & SETUP ---
  useEffect(() => {
    try { CFPaymentGatewayService.removeCallback(); } catch (e) { console.log(e); }
    
    return () => { 
      try { CFPaymentGatewayService.removeCallback(); } catch (e) { console.log(e); } 
    };
  }, []);

  // --- 2. FINAL API CALL (Create Coupon) ---
  const finalizeCouponCreation = async (cfOrderId) => {
    try {
      const userId = await AsyncStorage.getItem("user_id");
      const formData = new FormData();

      formData.append("user_id", userId);
      formData.append("amount", couponData.amount);
      formData.append("no_of_coupons", couponData.no_of_coupons);
      formData.append("order_id", cfOrderId); // Using Cashfree Order ID
      formData.append("status", "SUCCESS");
      formData.append("coupon_name", couponData.coupon_name);
      formData.append("coupon_type", couponData.coupon_type);
      formData.append("discount_value", couponData.discount_value);
      formData.append("min_order", couponData.min_order);
      formData.append("experied_date", couponData.experied_date);

      // Image handling
      const uri = Platform.OS === 'android' ? couponData.image.uri : couponData.image.uri.replace('file://', '');
      formData.append("image", {
        uri: uri,
        name: couponData.image.fileName || `coupon_${Date.now()}.jpg`,
        type: couponData.image.type || 'image/jpeg',
      });

      const response = await fetch("https://masonshop.in/api/createcoupon", {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" },
      });

      const json = await response.json();
      if (json.status === true) {
        Alert.alert("Success", "Coupon created successfully!");
        navigation.popToTop(); 
      } else {
        Alert.alert("Server Error", json.message || "Insert failed");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Payment successful, but coupon creation failed.");
    } finally {
      setLoading(false);
      isProcessing.current = false;
    }
  };

  // --- 3. HANDLE CASHFREE PAYMENT ---
  const handlePayment = async () => {
    if (isProcessing.current) return;
    
    setLoading(true);
    isProcessing.current = true;
    const uniqueOrderId = "CPN_" + Date.now();

    try {
        // Fetch Session from Cashfree (Use your production/test credentials correctly)
        const res = await fetch("https://sandbox.cashfree.com/pg/orders", {
            method: "POST",
            headers: {
                 "x-client-id": Config.CASHFREE_CLIENT_ID,
    "x-client-secret": Config.CASHFREE_CLIENT_SECRET,

              "x-api-version": "2023-08-01",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              order_amount: Number(couponData.amount),
              order_currency: "INR",
              order_id: uniqueOrderId,
              customer_details: {
                customer_id: (await AsyncStorage.getItem("user_id")) || "guest",
                customer_phone: "9999999999", // Replace with actual user phone
                customer_name: "Merchant",
                customer_email: "pay@masonshop.in",
              },
            }),
        });
        
        const data = await res.json();
        if (!data.payment_session_id) throw new Error("Payment Session Failed");

        const session = new CFSession(data.payment_session_id, data.order_id, CFEnvironment.SANDBOX);
        const theme = new CFThemeBuilder()
            .setNavigationBarBackgroundColor("#065F46")
            .setNavigationBarTextColor("#fff")
            .setButtonBackgroundColor("#065F46")
            .setButtonTextColor("#fff")
            .build();
        const drop = new CFDropCheckoutPayment(session, null, theme);

        CFPaymentGatewayService.setCallback({
            async onVerify(cfId) {
                console.log("✅ Verified:", cfId);
                await finalizeCouponCreation(cfId);
            },
            onError(err) {
                console.log("❌ Error:", err);
                setLoading(false);
                isProcessing.current = false;
                Alert.alert("Payment Cancelled", err?.message || "Payment failed.");
            }
        });

        CFPaymentGatewayService.doPayment(drop);

    } catch (e) {
        setLoading(false);
        isProcessing.current = false;
        Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
                <Icon name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Checkout</Text>
        </View>

        <ScrollView contentContainerStyle={{padding: 20}}>
            <Card style={styles.summaryCard}>
                <Text style={styles.sectionTitle}>Coupon Summary</Text>
                <View style={styles.row}><Text>Name:</Text><Text style={styles.bold}>{couponData.coupon_name}</Text></View>
                <View style={styles.row}><Text>Type:</Text><Text style={styles.bold}>{couponData.coupon_type}</Text></View>
                <View style={styles.row}><Text>Count:</Text><Text style={styles.bold}>{couponData.no_of_coupons}</Text></View>
                <View style={styles.divider} />
                <View style={styles.row}>
                    <Text style={styles.totalLabel}>Total Payable:</Text>
                    <Text style={styles.totalVal}>₹{couponData.amount}</Text>
                </View>
            </Card>

            <Text style={styles.note}>By clicking Pay Now, your payment will be processed via Cashfree Secure Gateway.</Text>
            
            <Button 
                mode="contained" 
                style={styles.payBtn} 
                onPress={handlePayment}
                loading={loading}
                disabled={loading}
            >
                {loading ? "Processing..." : `Pay ₹${couponData.amount}`}
            </Button>
        </ScrollView>
    </View>
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9", paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  summaryCard: { padding: 20, borderRadius: 12, backgroundColor: '#fff', elevation: 3 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#065F46' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  bold: { fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalVal: { fontSize: 20, fontWeight: 'bold', color: '#065F46' },
  note: { textAlign: 'center', color: 'gray', marginTop: 20, fontSize: 12 },
  payBtn: { marginTop: 30, backgroundColor: '#065F46', paddingVertical: 8, borderRadius: 8 }
});