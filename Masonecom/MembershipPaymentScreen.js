import React, { useState, useEffect, useRef } from "react";
import { 
    View, 
    StyleSheet, 
    Alert, 
    Image, 
    ScrollView, 
    StatusBar,
    Animated,
    Easing,
    Dimensions
} from "react-native";
import { Appbar, Text, Button, Surface } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// CASHFREE SDK
import {
  CFEnvironment,
  CFSession,
  CFThemeBuilder,
  CFDropCheckoutPayment,
} from "cashfree-pg-api-contract";
import { CFPaymentGatewayService } from "react-native-cashfree-pg-sdk";

const { width } = Dimensions.get("window");

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
            toValue: -15, // Jump Up
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0, // Land Down
            duration: 300,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
          Animated.delay(600), // Wait before next jump
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
      {/* Ensure these images exist in your assets folder or use URLs */}
      <Animated.Image
        source={require("../assets/technology.png")} // Check path
        style={[styles.jumpIcon, { transform: [{ translateY: jumpValue3 }] }]}
      />
      <Animated.Image
        source={require("../assets/cement1.png")} // Check path
        style={[styles.jumpIcon, { transform: [{ translateY: jumpValue2 }] }]}
      />
      <Animated.Image
        source={require("../assets/brickwall.png")} // Check path
        style={[styles.jumpIcon, { transform: [{ translateY: jumpValue1 }] }]}
      />
    </View>
  );
};

const MembershipPaymentScreen = ({ route, navigation }) => {
  const { planData, userId } = route.params; 
  const [loading, setLoading] = useState(false);
  const isProcessing = useRef(false);

  // --- 1. CLEANUP ---
  useEffect(() => {
    const cleanup = async () => {
        try { CFPaymentGatewayService.removeCallback(); } catch (e) {}
        await AsyncStorage.removeItem("payment_session_id");
    };
    cleanup();
    return () => { try { CFPaymentGatewayService.removeCallback(); } catch (e) {} };
  }, []);

  // --- 2. SERVER VERIFICATION ---
  const verifyAndNavigate = async (cfOrderId, totalAmount) => {
      try {
          console.log("🔍 Verifying Payment...");
          
          const apiResponse = await fetch("https://masonshop.in/api/sub_active", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: userId,
                amount: totalAmount,
                transaction_id: cfOrderId,
                subscription_id: planData.sub_id,
              }),
          });

          const apiData = await apiResponse.json();

          if (apiData?.status === "success") {
               await AsyncStorage.removeItem("payment_session_id");
               
               // Keep loader visible for 1s then navigate
               setTimeout(() => {
                  navigation.replace("MembershipSuccess", {
                    user_id: userId,
                    session: cfOrderId,
                    package_name: planData.sub_name,
                    package_image: planData.sub_image,
                    amount: totalAmount,
                    status: "success",
                  });
               }, 1000);
          } else {
               setLoading(false); isProcessing.current = false;
               Alert.alert("Verification Failed", "Bank did not confirm the payment.");
          }

      } catch (err) {
          console.log("Server Error", err);
          setLoading(false); isProcessing.current = false;
          Alert.alert("Error", "Could not verify payment status.");
      }
  };

  const processPayment = async () => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setLoading(true);

    try {
      const totalAmount = Number(planData.sub_amt);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        Alert.alert("Error", "Invalid amount.");
        setLoading(false); isProcessing.current = false;
        return;
      }

      const uniqueOrderId = "MEM_" + Date.now() + "_" + Math.floor(Math.random() * 999);

      const orderPayload = {
        order_amount: totalAmount,
        order_currency: "INR",
        order_id: uniqueOrderId,
        customer_details: {
          customer_id: userId,
          customer_name: "Member User",
          customer_email: "pay@masonshop.in",
          customer_phone: "9999999999",
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
      if (!data.payment_session_id) throw new Error(data.message || "Session Failed");

      const session = new CFSession(data.payment_session_id, data.order_id, CFEnvironment.SANDBOX);
      const theme = new CFThemeBuilder()
        .setNavigationBarBackgroundColor("#DA1F49")
        .setNavigationBarTextColor("#FFFFFF")
        .setButtonBackgroundColor("#DA1F49")
        .setButtonTextColor("#FFFFFF")
        .build();

      const dropPayment = new CFDropCheckoutPayment(session, null, theme);
      
      CFPaymentGatewayService.setCallback({
        async onVerify(cfId) {
            await verifyAndNavigate(cfId, totalAmount);
        },
        onError(err) {
            console.log("❌ Cancelled");
            setLoading(false); isProcessing.current = false;
            Alert.alert("Payment Cancelled", "Transaction was not completed.");
        }
      });

      CFPaymentGatewayService.doPayment(dropPayment);

    } catch (err) {
      console.error("Payment Error:", err);
      setLoading(false); isProcessing.current = false;
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f5f5f5" barStyle="dark-content" />
      
      {/* 🔥 ANIMATED LOADER OVERLAY */}
      {loading && (
        <View style={styles.loaderOverlay}>
            <JumpingLoader />
            <Text style={styles.loadingText}>Processing Membership...</Text>
            <Text style={styles.loadingSubText}>Please wait securely</Text>
        </View>
      )}

      <Appbar.Header style={{ backgroundColor: "#f5f5f5", elevation: 0 }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} disabled={loading} />
        <Appbar.Content title="Confirm Membership" titleStyle={{fontWeight:'bold'}} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* PREMIUM MEMBERSHIP CARD */}
        <Animatable.View animation="fadeInUp" duration={800} style={styles.membershipCard}>
            <View style={styles.cardHeader}>
                <Image source={{ uri: "https://img.icons8.com/color/96/crown.png" }} style={styles.crownIcon} />
                <Text style={styles.cardTitle}>{planData.sub_name} Plan</Text>
            </View>
            
            <View style={styles.cardBody}>
                <Image source={{uri: planData.sub_image}} style={styles.planImage} />
                <View>
                    <Text style={styles.cardPrice}>₹ {planData.sub_amt}</Text>
                    <Text style={styles.cardDuration}>/ Year</Text>
                </View>
            </View>
            
            <View style={styles.cardFooter}>
                 <Text style={styles.memberId}>Member ID: {userId}</Text>
            </View>
        </Animatable.View>

        {/* BENEFITS LIST */}
        <Animatable.View animation="fadeInUp" delay={300} duration={800}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            <Surface style={styles.benefitsCard}>
                <Text style={styles.description}>{planData.sub_description}</Text>
                
                <View style={styles.featureRow}>
                    <Icon name="check-circle" size={20} color="green" />
                    <Text style={styles.featureText}>Priority Support</Text>
                </View>
                <View style={styles.featureRow}>
                    <Icon name="check-circle" size={20} color="green" />
                    <Text style={styles.featureText}>Exclusive Offers</Text>
                </View>
                <View style={styles.featureRow}>
                    <Icon name="check-circle" size={20} color="green" />
                    <Text style={styles.featureText}>Free Delivery</Text>
                </View>
            </Surface>
        </Animatable.View>

      </ScrollView>

      {/* STICKY FOOTER */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
            <Text style={{color:'#555', fontSize:14}}>Total Payable</Text>
            <Text style={{fontSize: 24, fontWeight:'bold', color:'#000'}}>₹ {planData.sub_amt}</Text>
        </View>
        
        <Button 
            mode="contained" 
            onPress={processPayment}
            loading={loading}
            disabled={loading}
            style={styles.payBtn}
            labelStyle={{fontSize: 16, fontWeight:'bold', paddingVertical: 5}}
        >
            {loading ? "PROCESSING..." : "PAY SECURELY"}
        </Button>
      </View>
    </View>
  );
};

export default MembershipPaymentScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 20, paddingBottom: 100 },
  
  // CARD STYLES
  membershipCard: {
      backgroundColor: '#222', 
      borderRadius: 20,
      padding: 20,
      marginBottom: 25,
      elevation: 10,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowOffset: {width: 0, height: 5}
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  crownIcon: { width: 30, height: 30, marginRight: 10 },
  cardTitle: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  
  cardBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  planImage: { width: 60, height: 60, borderRadius: 30, backgroundColor:'#fff' },
  cardPrice: { color: '#fff', fontSize: 32, fontWeight: 'bold', textAlign:'right' },
  cardDuration: { color: '#888', fontSize: 14, textAlign:'right' },
  
  cardFooter: { borderTopWidth: 1, borderTopColor: '#444', paddingTop: 15 },
  memberId: { color: '#aaa', fontSize: 12, letterSpacing: 1, fontFamily: 'monospace' },

  // BENEFITS STYLES
  sectionTitle: { fontSize: 16, fontWeight:'bold', marginBottom: 10, color:'#444', marginLeft: 5 },
  benefitsCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, elevation: 2 },
  description: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 15 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  featureText: { marginLeft: 10, fontSize: 14, color: '#555' },

  // FOOTER
  footer: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: '#fff', padding: 20,
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      elevation: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
  },
  totalRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 15 },
  payBtn: { backgroundColor: '#DA1F49', borderRadius: 12 },
  
  // LOADER STYLES
  loaderOverlay: { 
      position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, 
      backgroundColor: 'rgba(255,255,255,0.95)', zIndex: 999, 
      justifyContent: 'center', alignItems: 'center' 
  },
  loaderContainer: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  jumpIcon: { width: 50, height: 50, resizeMode: 'contain' },
  loadingText: { fontSize: 18, fontWeight: 'bold', color: '#DA1F49' },
  loadingSubText: { fontSize: 14, color: '#888', marginTop: 5 }
});