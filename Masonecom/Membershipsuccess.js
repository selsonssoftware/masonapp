import React, { useEffect } from "react";
import { 
    View, 
    StyleSheet, 
    Image, 
    BackHandler, 
    StatusBar, 
    Dimensions
} from "react-native";
import { Text, Button, Surface } from "react-native-paper";
import * as Animatable from "react-native-animatable";
import ConfettiCannon from "react-native-confetti-cannon";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const { width } = Dimensions.get("window");

const MembershipSuccess = ({ navigation, route }) => {
  const { user_id, package_name, package_image, amount } = route.params || {};

  // 🔥 FIX: Use popToTop() to prevent White Screen
  const goToHome = () => {
    // This goes back to the very first screen (HomeScreen) and clears the stack
    navigation.popToTop(); 
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        goToHome();
        return true;
    });

    const timer = setTimeout(() => {
        goToHome();
    }, 5000); // Auto-redirect after 5s

    return () => {
        clearTimeout(timer);
        backHandler.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      {/* 🎉 CONFETTI BLAST */}
      <ConfettiCannon count={200} origin={{x: -10, y: 0}} fadeOut={true} />

      {/* 1. HEADER */}
      <Animatable.View animation="fadeInDown" delay={300} style={styles.header}>
          <View style={styles.successIconContainer}>
             <Icon name="check-bold" size={40} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Membership Activated!</Text>
          <Text style={styles.headerSubtitle}>Welcome to the club</Text>
      </Animatable.View>

      {/* 2. WALLET CARD */}
      <Animatable.View 
        animation="flipInY" 
        duration={1000} 
        delay={500} 
        style={styles.cardContainer}
      >
        <Surface style={styles.membershipCard}>
            <View style={styles.cardCircle} />
            
            <View style={styles.cardTop}>
                <Image 
                    source={{ uri: "https://img.icons8.com/color/96/crown.png" }} 
                    style={{ width: 40, height: 40 }} 
                />
                <Text style={styles.brandName}>MASON SHOP</Text>
            </View>

            <Text style={styles.planName}>{package_name} Member</Text>

            <View style={{flexDirection:'row', marginVertical: 15}}>
                 <Icon name="chip" size={30} color="#FFD700" style={{opacity:0.8}} />
                 <Icon name="wifi" size={25} color="#fff" style={{marginLeft: 10, opacity:0.6}} />
            </View>

            <View style={styles.cardBottom}>
                <View>
                    <Text style={styles.cardLabel}>MEMBER ID</Text>
                    <Text style={styles.cardValue}>{user_id || "MS-0000"}</Text>
                </View>
                <View>
                     <Text style={styles.cardLabel}>VALIDITY</Text>
                     <Text style={styles.cardValue}>1 YEAR</Text>
                </View>
            </View>
        </Surface>
      </Animatable.View>

      {/* 3. RECEIPT INFO */}
      <Animatable.View animation="fadeInUp" delay={1000} style={styles.receiptContainer}>
          <View style={styles.row}>
              <Text style={styles.receiptLabel}>Amount Paid</Text>
              <Text style={styles.receiptValue}>₹{amount}</Text>
          </View>
          <View style={styles.row}>
              <Text style={styles.receiptLabel}>Transaction Status</Text>
              <Text style={[styles.receiptValue, {color:'green'}]}>Successful</Text>
          </View>
      </Animatable.View>

      {/* 4. BUTTON */}
      <Animatable.View animation="fadeInUp" delay={1200} style={styles.footer}>
        <Button
          mode="contained"
          style={styles.btn}
          contentStyle={{height: 50}}
          labelStyle={styles.btnText}
          onPress={goToHome}
        >
          Go to Home
        </Button>
      </Animatable.View>

    </View>
  );
};

export default MembershipSuccess;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  header: { alignItems: 'center', marginBottom: 30 },
  successIconContainer: {
      width: 80, height: 80,
      backgroundColor: '#4CAF50',
      borderRadius: 40,
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 15,
      elevation: 5
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 16, color: '#888', marginTop: 5 },
  cardContainer: {
      width: '100%',
      alignItems: 'center',
      marginBottom: 30,
  },
  membershipCard: {
      width: width * 0.85,
      height: 200,
      backgroundColor: '#DA1F49',
      borderRadius: 16,
      padding: 20,
      elevation: 10,
      shadowColor: '#DA1F49',
      shadowOpacity: 0.4,
      shadowOffset: {width: 0, height: 10},
      shadowRadius: 15,
      justifyContent: 'space-between',
      overflow: 'hidden'
  },
  cardCircle: {
      position: 'absolute',
      right: -50, top: -50,
      width: 150, height: 150,
      borderRadius: 75,
      backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
  },
  brandName: { color: 'rgba(255,255,255,0.7)', fontWeight: 'bold', fontSize: 12, letterSpacing: 2 },
  planName: { color: '#fff', fontSize: 22, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginTop: 5 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cardLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight:'bold' },
  cardValue: { color: '#fff', fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 1, marginTop: 2 },
  receiptContainer: {
      width: '90%',
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 15,
      marginBottom: 30,
      borderWidth: 1,
      borderColor: '#eee'
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  receiptLabel: { color: '#666', fontSize: 14 },
  receiptValue: { color: '#333', fontSize: 14, fontWeight: 'bold' },
  footer: { width: '100%' },
  btn: {
    backgroundColor: "#333",
    borderRadius: 30,
  },
  btnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' }
});