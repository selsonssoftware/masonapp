import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
  ImageBackground
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const THEME_COLOR = '#2d3447';
const ACCENT_COLOR = '#E91E63';

export default function CouponDetailScreen({ route, navigation }) {
  
  // 1. Get couponId safely
  const { couponId ,Vendor_id} = route.params || {};

  const [loading, setLoading] = useState(true);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [couponData, setCouponData] = useState(null);

  useEffect(() => {
    if (couponId) {
      fetchCouponDetails();
    } else {
      Alert.alert("Error", "No Coupon ID found");
      navigation.goBack();
    }
  }, [couponId]);

  // --- 2. Fetch Coupon Details ---
  const fetchCouponDetails = async () => {
    try {
      // API to view coupon details
      const url = `https://masonshop.in/api/coupons_view?id=${couponId}`;
      console.log("Fetching Coupon Data:", url);

      const response = await fetch(url);
      const json = await response.json();

      if (json.status === true) {
        setCouponData(json.data);
      } else {
        Alert.alert("Error", "Could not fetch coupon details");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Network request failed");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. Redeem Function with 5-Sec Delay ---
  const handleRedeem = async () => {
    if (!couponData) return;

    setRedeemLoading(true);

    try {
      // A. Get User ID from Storage
      const userId = await AsyncStorage.getItem('user_id');

      if (!userId) {
        Alert.alert("Error", "User not logged in.");
        setRedeemLoading(false);
        return;
      }

      console.log("Starting Redeem Process...");
      console.log("Data to Send:", {
        user_id: userId,
        coupon_code: couponData.coupon_code,
        store_id: couponData.store_id || Vendor_id,
      });
      
      // B. Create the Promise for the API Call
      // REPLACE THIS URL with your actual Redeem API endpoint
      const apiCallPromise = fetch('https://masonshop.in/api/redeemCoupon', {
        method: 'POST',
        headers: {
           // 'Content-Type': 'multipart/form-data', // FormData sets this automatically
        },
        // Using FormData is common for PHP backends
       // Inside handleRedeem in CouponDetailScreen
body: (() => {
    const data = new FormData(); // Capital 'F' fixed
    data.append('user_id', userId);
    data.append('coupon_code', couponData.coupon_code);
    
    // Logic: Send the coupon's own store_id if it exists.
    // If it's a Mason coupon (store_id is null), send the Vendor_id we passed 
    // from the QR scan/store page so the backend can update it.
    const finalStoreId = couponData.store_id || Vendor_id;
    
    data.append('store_id', finalStoreId);
    return data;
})()
      }).then(res => res.json());

      // C. Create a Promise for the 5-Second Timer
      const timerPromise = new Promise(resolve => setTimeout(resolve, 5000));

      // D. Wait for BOTH (API + 5 Seconds) to finish
      const [apiResult] = await Promise.all([apiCallPromise, timerPromise]);

      console.log("API Result:", apiResult);

      setRedeemLoading(false);

      // E. Check API Success
      if (apiResult.status === true || apiResult.status === "true") {
        Alert.alert("Success", "Coupon Redeemed Successfully!", [
            { text: "OK", onPress: () => navigation.navigate('CouponSuccess',{couponcode:couponData.coupon_code,totalsave:couponData.discount_amount}) }
        ]);
      } else {
        // Show error message from API
        Alert.alert("Failed", apiResult.message || "Redemption failed.");
      }

    } catch (error) {
      console.error("Redeem Error:", error);
      // Ensure we wait at least the 5 seconds even if error occurs immediately
      setTimeout(() => {
          setRedeemLoading(false);
          Alert.alert("Error", "Network request failed. Please try again.");
      }, 5000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No Expiry';
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short', year: 'numeric' })}`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
      </View>
    );
  }

  // --- Display Calculations ---
  const discountText = couponData?.coupon_type === 'FLAT' 
    ? `₹${couponData?.discount_value}`
    : `${couponData?.discount_value}%`;
  
  const discountLabel = couponData?.coupon_type === 'FLAT' ? 'Flat Discount' : 'Percentage Off';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* --- HERO IMAGE BACKGROUND --- */}
      <ImageBackground
        source={{ 
            uri: couponData?.image || 'https://img.freepik.com/free-vector/modern-sale-banner-with-abstract-shapes_1361-1678.jpg'
        }}
        style={styles.headerImage}
      >
        <View style={styles.headerOverlay} />
        
        {/* Navigation Header */}
        <SafeAreaView>
            <View style={styles.navBar}>
                <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Coupon Details</Text>
                <View style={{width: 40}} /> 
            </View>
        </SafeAreaView>
      </ImageBackground>

      {/* --- MAIN CONTENT SHEET --- */}
      <View style={styles.sheetContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* 1. Header Info */}
          <View style={styles.titleSection}>
            <Text style={styles.couponName}>{couponData?.coupon_name || "Exclusive Offer"}</Text>
            <Text style={styles.couponType}>{couponData?.type === 'store' ? 'Store Exclusive' : 'Universal Coupon'}</Text>
          </View>

          {/* 2. Coupon Ticket Card */}
          <View style={styles.ticketContainer}>
            <View style={styles.ticketLeft}>
                <Text style={styles.ticketLabel}>{discountLabel}</Text>
                <Text style={styles.ticketValue}>{discountText}</Text>
                <Text style={styles.ticketSub}>OFF</Text>
            </View>
            
            {/* Dashed Divider */}
            <View style={styles.ticketDivider}>
                <View style={styles.circleTop} />
                <View style={styles.dashedLine} />
                <View style={styles.circleBottom} />
            </View>

            <View style={styles.ticketRight}>
                <Text style={styles.codeLabel}>COUPON CODE</Text>
                <View style={styles.codeBox}>
                    <Text style={styles.codeText}>{couponData?.coupon_code}</Text>
                </View>
                <Text style={styles.tapToCopy}>Valid Now</Text>
            </View>
          </View>

          {/* 3. Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
                <View style={[styles.iconBox, {backgroundColor: '#e3f2fd'}]}>
                    <Feather name="calendar" size={20} color="#2196f3" />
                </View>
                <Text style={styles.infoLabel}>Expires</Text>
                <Text style={styles.infoValue}>{formatDate(couponData?.expires_at)}</Text>
            </View>

            <View style={styles.infoItem}>
                <View style={[styles.iconBox, {backgroundColor: '#fff3e0'}]}>
                    <Feather name="shopping-cart" size={20} color="#ff9800" />
                </View>
                <Text style={styles.infoLabel}>Min Spend</Text>
                <Text style={styles.infoValue}>₹{couponData?.min_order_amount}</Text>
            </View>

            <View style={styles.infoItem}>
                <View style={[styles.iconBox, {backgroundColor: '#e8f5e9'}]}>
                    <Feather name="check-circle" size={20} color="#4caf50" />
                </View>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>{couponData?.status === 'not_used' ? 'Available' : 'Used'}</Text>
            </View>
          </View>

          {/* 4. Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <Text style={styles.descriptionText}>
              • This coupon gives you {discountText} OFF on your total bill.{'\n'}
              • Minimum order value of ₹{couponData?.min_order_amount} is required.{'\n'}
              • Valid until {formatDate(couponData?.expires_at)}.{'\n'}
              • Cannot be combined with other offers.
            </Text>
          </View>

          <View style={{height: 100}} /> 
        </ScrollView>

        {/* --- STICKY FOOTER --- */}
        <View style={styles.footerContainer}>
            <TouchableOpacity 
                style={[styles.redeemButton, { opacity: redeemLoading ? 0.8 : 1 }]}
                onPress={handleRedeem}
                disabled={redeemLoading}
                activeOpacity={0.8}
            >
                {redeemLoading ? (
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                         <ActivityIndicator color="#fff" style={{marginRight: 10}}/>
                         <Text style={styles.redeemText}>PROCESSING...</Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.redeemText}>REDEEM NOW</Text>
                        <Feather name="arrow-right" size={20} color="#fff" />
                    </>
                )}
            </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  // Header
  headerImage: {
    width: '100%',
    height: 300,
    justifyContent: 'flex-start',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40, // Adjusted for status bar
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },

  // Main Sheet
  sheetContainer: {
    flex: 1,
    marginTop: -40,
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 24,
  },

  // Title Section
  titleSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  couponName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  couponType: {
    fontSize: 14,
    color: '#888',
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Ticket Card
  ticketContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    height: 140,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 25,
  },
  ticketLeft: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ACCENT_COLOR,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    padding: 10,
  },
  ticketLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  ticketValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  ticketSub: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ticketDivider: {
    width: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#fff',
  },
  dashedLine: {
    height: '80%',
    width: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  circleTop: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5F7FA',
  },
  circleBottom: {
    position: 'absolute',
    bottom: -10,
    left: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5F7FA',
  },
  ticketRight: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  codeLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 1,
  },
  codeBox: {
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 1,
  },
  tapToCopy: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },

  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  infoItem: {
    width: '31%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },

  // Description
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 24,
  },

  // Footer
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    elevation: 10,
  },
  redeemButton: {
    backgroundColor: THEME_COLOR,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  redeemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    letterSpacing: 0.5,
  },
});