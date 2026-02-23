import React, { useEffect } from "react";
import { View, StyleSheet, Image, BackHandler, StatusBar } from "react-native";
import { Text, Button } from "react-native-paper";
import * as Animatable from "react-native-animatable"; 

// 1. DEFINE CUSTOM "BLAST" ANIMATION
const blastAnimation = {
  0: { opacity: 0.8, scale: 0 },
  1: { opacity: 0, scale: 4 },
};

Animatable.initializeRegistryWithDefinitions({
  blast: blastAnimation,
});

export default function OrderSuccess({ navigation, route }) {
  const { orderId, amount } = route.params || {};

  // --- NAVIGATION FIX ---
  const goToOrders = () => {
    // 1. Pop back to the very first screen (Home)
    navigation.popToTop(); 
    // 2. Immediately open Orders. Now, pressing 'Back' from Orders will go to Home!
    setTimeout(() => {
        navigation.navigate("MyOrders"); // Make sure "Orders" matches your exact route name
    }, 100);
  };

  const goHome = () => {
    navigation.popToTop(); 
  };

  useEffect(() => {
    // If they press the physical back button on THIS screen, just send them Home
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        goHome();
        return true;
    });

    // Auto-redirect to Orders page after 5 seconds
    const timer = setTimeout(() => {
      goToOrders();
    }, 5000);

    return () => {
        clearTimeout(timer);
        backHandler.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#DA1F49" barStyle="light-content" />

      {/* --- BLAST RINGS --- */}
      <View style={styles.blastContainer}>
          <Animatable.View animation="blast" duration={1000} easing="ease-out" style={styles.blastRing} />
          <Animatable.View animation="blast" duration={1000} delay={200} easing="ease-out" style={styles.blastRing} />
          <Animatable.View animation="blast" duration={1000} delay={400} easing="ease-out" style={styles.blastRing} />
      </View>

      {/* --- MAIN TICK ICON --- */}
      <Animatable.View 
        animation="rubberBand" 
        duration={1500} 
        style={styles.iconCircle}
      >
        <Image
          source={{ uri: "https://img.icons8.com/fluency/96/ok.png" }} 
          style={styles.icon}
          resizeMode="contain"
        />
      </Animatable.View>

      {/* TEXT */}
      <Animatable.Text animation="fadeInUp" delay={500} style={styles.title}>
        Payment Successful!
      </Animatable.Text>
      
      <Animatable.Text animation="fadeInUp" delay={700} style={styles.subtitle}>
        Your order has been confirmed.
      </Animatable.Text>

      {/* GLASS DETAILS CARD */}
      <Animatable.View animation="fadeInUp" delay={900} style={styles.glassCard}>
        <View style={styles.row}>
            <Text style={styles.label}>Order ID</Text>
            <Text style={styles.value}>#{orderId || "ORD_12345"}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
            <Text style={styles.label}>Amount Paid</Text>
            <Text style={styles.amountValue}>₹{amount || "0"}</Text>
        </View>
      </Animatable.View>

      {/* FOOTER */}
      <Animatable.View animation="fadeInUp" delay={1200} style={styles.footer}>
        <Button
          mode="contained"
          style={styles.btn}
          labelStyle={styles.btnText}
          onPress={goToOrders} // Updated to go to Orders
        >
          View Orders
        </Button>
      </Animatable.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DA1F49", 
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    overflow: 'hidden'
  },
  
  blastContainer: {
    position: 'absolute',
    top: '22%', 
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  blastRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 2,
    borderColor: '#fff',
  },

  iconCircle: {
    backgroundColor: '#fff', 
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 5}
  },
  icon: {
    width: 70, 
    height: 70,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 30,
  },
  glassCard: {
    width: '100%',
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5
  },
  label: {
    color: "#FFCDD2",
    fontSize: 14,
    fontWeight: '600'
  },
  value: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  amountValue: {
    color: "#FFD700", 
    fontSize: 22,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 15,
  },
  footer: {
    width: '100%',
    alignItems: 'center'
  },
  btn: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 30,
    paddingVertical: 8,
    elevation: 5,
  },
  btnText: {
    color: "#DA1F49",
    fontWeight: "bold",
    fontSize: 16,
  }
});