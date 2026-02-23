import React, { useEffect } from "react";
import { View, StyleSheet, Image, BackHandler, StatusBar } from "react-native";
import { Text, Button } from "react-native-paper";
import * as Animatable from "react-native-animatable"; 

// 1. REUSE BLAST ANIMATION
const blastAnimation = {
  0: { opacity: 0.8, scale: 0 },
  1: { opacity: 0, scale: 4 },
};

Animatable.initializeRegistryWithDefinitions({
  blast: blastAnimation,
});

export default function OrderFailed({ navigation, route }) {
  // Get error reason passed from Payment Screen
  const { reason } = route.params || {};

  const tryAgain = () => {
    navigation.goBack(); // Go back to Payment Screen to retry
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        navigation.popToTop(); // Go Home on back press
        return true;
    });
    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#B01639" barStyle="light-content" />

      {/* --- BLAST RINGS --- */}
      <View style={styles.blastContainer}>
          <Animatable.View animation="blast" duration={1000} easing="ease-out" style={styles.blastRing} />
          <Animatable.View animation="blast" duration={1000} delay={200} easing="ease-out" style={styles.blastRing} />
      </View>

      {/* --- MAIN ERROR ICON (Shake Effect) --- */}
      <Animatable.View 
        animation="tada" // ❌ "Tada" makes it shake/wobble
        duration={1500} 
        style={styles.iconCircle}
      >
        <Image
          source={{ uri: "https://img.icons8.com/fluency/96/cancel.png" }} 
          style={styles.icon}
          resizeMode="contain"
        />
      </Animatable.View>

      {/* TEXT */}
      <Animatable.Text animation="fadeInUp" delay={500} style={styles.title}>
        Payment Failed
      </Animatable.Text>
      
      <Animatable.Text animation="fadeInUp" delay={700} style={styles.subtitle}>
        Something went wrong.
      </Animatable.Text>

      {/* GLASS ERROR CARD */}
      <Animatable.View animation="fadeInUp" delay={900} style={styles.glassCard}>
        <View style={styles.row}>
            <Text style={styles.label}>Error Details</Text>
        </View>
        <View style={{marginTop: 5}}>
            <Text style={styles.errorValue}>
                {reason || "The payment was cancelled or declined by the bank."}
            </Text>
        </View>
      </Animatable.View>

      {/* FOOTER BUTTONS */}
      <Animatable.View animation="fadeInUp" delay={1200} style={styles.footer}>
        
        {/* RETRY BUTTON (White) */}
        <Button
          mode="contained"
          style={styles.btn}
          labelStyle={styles.btnText}
          onPress={tryAgain}
        >
          Try Again
        </Button>

        {/* CANCEL LINK */}
        <Button 
            mode="text" 
            textColor="rgba(255,255,255,0.7)"
            style={{marginTop: 15}}
            onPress={() => navigation.popToTop()}
        >
            Cancel & Go Home
        </Button>

      </Animatable.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DA1F49", // YOUR THEME
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    overflow: 'hidden'
  },
  
  blastContainer: {
    position: 'absolute',
    top: '25%', 
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
    width: 60, 
    height: 60,
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
    textAlign: 'center'
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
    marginBottom: 5
  },
  label: {
    color: "#FFCDD2",
    fontSize: 14,
    fontWeight: '600'
  },
  errorValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    textAlign: 'left'
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