import React, { useEffect, useState, useCallback } from 'react';
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
  ImageBackground,
  ActivityIndicator,
  Alert
} from 'react-native';

// --- Icon Imports ---
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// --- Helper for Colors and Images ---
const CARD_COLORS = ['#F97316', '#3F51B5', '#4CAF50', '#B71C1C', '#009688'];
const BG_IMAGES = [
  'https://img.freepik.com/free-vector/flat-people-shopping-online_23-2148531553.jpg',
  'https://img.freepik.com/free-vector/flat-woman-holding-discount-signs_23-2148536553.jpg',
  'https://img.freepik.com/free-vector/cashback-concept-illustration_114360-16447.jpg',
  'https://img.freepik.com/free-photo/construction-tools_1232-2868.jpg',
];

const getCardVisuals = (index) => {
  return {
    color: CARD_COLORS[index % CARD_COLORS.length],
    bgImage: BG_IMAGES[index % BG_IMAGES.length],
  };
};

export default function CouponScreen({ route }) {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [vendorDetails, setVendorDetails] = useState(null);
  const [userCoupons, setUserCoupons] = useState([]);
  const [masonCoupons, setMasonCoupons] = useState([]);
  
  // FIXED: Standardized state naming to match your navigation needs
  const [vendorid, setVendorId] = useState('');

  // Get vendorId from QR scan or previous screen
  const vendorIdFromParams = route?.params?.vendorId || 'M583400';

  useFocusEffect(
    useCallback(() => {
      if (!vendorIdFromParams) {
        Alert.alert(
          "Error",
          "No Vendor ID provided",
          [{ text: "Go Back", onPress: () => navigation.goBack() }]
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      fetchData();
      // FIXED: Update local state so it can be passed to CouponDetailScreen
      setVendorId(vendorIdFromParams); 
    }, [vendorIdFromParams])
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("user_id");
      const finalUserId = userId || ""; 

      const url = `https://masonshop.in/api/redeemQrcode?user_id=${finalUserId}&qr_code=${vendorIdFromParams}`;
      console.log("REDEEM API:", url);

      const response = await fetch(url);
      const json = await response.json();

      if (json.status === true) {
        setVendorDetails(json.vendor_details);
        setUserCoupons(json.coupons || []);
        setMasonCoupons(json['mason_coupons'] || []);
      } else {
        Alert.alert("Notice", "Invalid QR Code or No Data Found");
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      Alert.alert("Error", "Failed to load coupons. Check your internet.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B71C1C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* --- Header Section --- */}
        <View style={styles.headerContainer}>
          <ImageBackground
            source={{ uri: 'https://img.freepik.com/free-photo/construction-site-silhouettes_1127-3254.jpg' }}
            style={styles.headerBackground}
            imageStyle={{ borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
          >
            <View style={styles.headerOverlay} />

            <SafeAreaView>
              <View style={styles.navBar}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Feather name="chevron-left" color="white" size={28} />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Feather name="more-vertical" color="white" size={24} />
                </TouchableOpacity>
              </View>

              {vendorDetails && (
                <View style={styles.profileSection}>
                  <View style={styles.logoContainer}>
                    <Image source={{ uri: vendorDetails.logo }} style={styles.logoImage} resizeMode="contain" />
                  </View>
                  <Text style={styles.companyName}>{vendorDetails.store_name}</Text>
                  <View style={styles.infoRow}>
                    <Feather name="map-pin" size={14} color="#ddd" />
                    <Text style={styles.infoText}>{vendorDetails.address}, {vendorDetails.city}</Text>
                  </View>
                </View>
              )}
            </SafeAreaView>
          </ImageBackground>
        </View>

        {/* --- Main Content --- */}
        <View style={styles.contentContainer}>
          
          {/* Store Coupons */}
          {userCoupons.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Store Coupons</Text>
              {userCoupons.map((item, index) => (
                <TouchableOpacity  
                  key={item.id}
                  activeOpacity={0.9}
                  // FIXED: Passing Vendor_id consistently
                  onPress={() => navigation.navigate('CouponDetailScreen', { 
                    couponId: item.coupon_code, 
                    Vendor_id: vendorid 
                  })}
                >
                  <CouponCard data={item} visuals={getCardVisuals(index)} storeLogo={vendorDetails?.logo} />
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Mason Coupons */}
          {masonCoupons.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Mason Coupons</Text>
              {masonCoupons.map((item, index) => (
                <TouchableOpacity  
                  key={item.id}
                  activeOpacity={0.9}
                  // FIXED: Explicitly sending vendorid so backend can update the Mason coupon with this store_id
                  onPress={() => navigation.navigate('CouponDetailScreen', { 
                    couponId: item.coupon_code, 
                    Vendor_id: vendorid 
                  })}
                >
                  <CouponCard data={item} visuals={getCardVisuals(index + 5)} storeLogo="../assets/splash.png" />
                </TouchableOpacity>
              ))}
            </>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

// --- Reusable Coupon Card Component ---
const CouponCard = ({ data, visuals, storeLogo }) => {
  const titleText = data.coupon_type === 'FLAT' ? `Flat ₹${data.discount_amount} OFF` : `${data.discount_amount}% OFF`;
  const isRedeemed = data.status === 'Redeemed';

  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardLeft}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: visuals.bgImage }} style={styles.cardImage} />
          <View style={[styles.daysLeftTag, { backgroundColor: isRedeemed ? '#ddd' : '#fff' }]}>
            <Text style={[styles.daysLeftText, { color: isRedeemed ? '#666' : '#000' }]}>{isRedeemed ? 'Redeemed' : 'Active'}</Text>
          </View>
        </View>
        <View style={styles.cardDetails}>
          {storeLogo && <Image source={{ uri: storeLogo }} style={styles.brandLogoSmall} resizeMode="contain" />}
          <Text style={styles.cardTitle} numberOfLines={2}>{titleText}</Text>
          <Text style={styles.cardValidity}>Min Order: ₹{data.min_order_amount || 0}</Text>
        </View>
      </View>

      <View style={styles.dividerContainer}>
        <View style={styles.circleCutoutTop} /><View style={styles.dashedLine} /><View style={styles.circleCutoutBottom} />
      </View>

      <View style={[styles.cardRight, { backgroundColor: visuals.color }]}>
        <Text style={styles.couponType}>{data.coupon_type}</Text>
        <Text style={styles.couponAmount}>₹{data.discount_amount}</Text>
        <Text style={styles.couponCode}>{data.coupon_code}</Text>
        <View style={styles.getCodeBtn}>
          <Text style={[styles.getCodeText, { color: isRedeemed ? '#999' : visuals.color }]}>{isRedeemed ? 'Used' : 'Use Now'}</Text>
        </View>
      </View>
    </View>
  );
};

// ... existing styles ...

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerContainer: {
    height: 320,
    marginBottom: 20,
  },
  headerBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(183, 28, 28, 0.85)', // Red Overlay
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    marginBottom: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 90,
    height: 90,
    backgroundColor: '#fff',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    color: '#eee',
    fontSize: 13,
    marginLeft: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    marginRight: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#eee',
    marginHorizontal: 8,
  },
  contentContainer: {
    paddingHorizontal: 16,
    marginTop: -40, // Pull up to overlap header
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    marginTop: 15,
    marginLeft: 4,
    paddingVertical:15,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  
  // --- CARD STYLES ---
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 140,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardLeft: {
    flex: 2,
    padding: 12,
    flexDirection: 'row',
  },
  imageContainer: {
    width: 70,
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 10,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  daysLeftTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingVertical: 2,
    alignItems: 'center',
    opacity: 0.9,
  },
  daysLeftText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  brandLogoSmall: {
    width: 20,
    height: 20,
    marginBottom: 4,
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardValidity: {
    fontSize: 12,
    color: '#777',
  },
  
  // --- DIVIDER STYLES ---
  dividerContainer: {
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Match card background
    position: 'relative',
    zIndex: 1,
  },
  dashedLine: {
    height: '80%',
    width: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  circleCutoutTop: {
    position: 'absolute',
    top: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5F7FA', // Match Screen BG
  },
  circleCutoutBottom: {
    position: 'absolute',
    bottom: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5F7FA', // Match Screen BG
  },

  // --- RIGHT SIDE STYLES ---
  cardRight: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    position: 'relative',
  },
  couponType: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  couponAmount: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  couponCode: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 8,
    opacity: 0.9,
  },
  getCodeBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
  },
  getCodeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  bgDecoration1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bgDecoration2: {
    position: 'absolute',
    bottom: -10,
    left: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});