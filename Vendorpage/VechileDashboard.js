import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [coupons, setCoupons] = useState([]); // Dynamic Coupons State

  const navigation = useNavigation();

  // --- API CALL FUNCTION ---
  const fetchDashboardData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("user_id");
      
      // 1. Fetch Dashboard Stats
      const dashRes = await fetch(`https://masonshop.in/api/vendor_vehicle_dashboard?user_id=${userId}`);
      const dashJson = await dashRes.json();
      
      if (dashJson.status) {
        setDashboardData(dashJson);
        
        // 2. Fetch Coupons using store_id from dashboard data
        const storeId = userId || "M581545"; 
        const couponRes = await fetch(`https://masonshop.in/api/store_redeem?store_id=${storeId}`);
        const couponJson = await couponRes.json();
        
        if (couponJson.status) {
          setCoupons(couponJson.data);
        }
      }
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
      Alert.alert("Network Error", "Unable to connect to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(true);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerLoader}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15, padding: 5 }}>
              <Ionicons name="arrow-back" size={28} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('VechileDashboard')} activeOpacity={0.7}>
              <View>
                <Text style={styles.headerTitle}>Hello</Text>
                <Text style={styles.headerSubtitle}>
                  {dashboardData?.vendor?.store_name || 'Vendor Partner'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('StoreEditProfile')}>
            {dashboardData?.vendor?.logo ? (
               <Image source={{ uri: dashboardData.vendor.logo }} style={styles.profileLogo} />
            ) : (
              <Ionicons name="person-circle-outline" size={40} color="#4f46e5" />
            )}
          </TouchableOpacity>
        </View>

        {/* Promo Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Rent Heavy Vehicles for Your Construction Needs</Text>
            <Text style={styles.bannerText}>Reliable machines, <Text style={styles.highlightText}>flexible timings</Text></Text>
          </View>
          <Image source={{ uri: 'https://pngimg.com/d/excavator_PNG58.png' }} style={styles.bannerImage} resizeMode="contain" />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#eefad6' }]}>
            <View style={styles.iconContainer}><Icon name="cash-multiple" size={24} color="#65a30d" /></View>
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={styles.statValue}>₹{dashboardData?.total_revenue || 0}</Text> 
          </View>
          
          <TouchableOpacity style={[styles.statCard, { backgroundColor: '#cdfefe' }]} onPress={() => navigation.navigate('VechileBookingAllDetails')}>
            <View style={styles.iconContainer}><Icon name="calendar-check" size={24} color="#0891b2" /></View>
            <Text style={styles.statLabel}>Bookings</Text>
            <Text style={styles.statValue}>{dashboardData?.booking_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { backgroundColor: '#a5b4fc' }]} onPress={() => navigation.navigate('VendorAllVechiles')}>
            <View style={styles.iconContainer}><Icon name="car-multiple" size={24} color="#4f46e5" /></View>
            <Text style={styles.statLabel}>Vehicles</Text>
            <Text style={styles.statValue}>{dashboardData?.vehicle_count || 0}</Text>
          </TouchableOpacity>
        </View>

        {/* QR Code Section */}
        <Text style={styles.sectionTitle}>My QR Code</Text>
        <View style={styles.qrSection}>
          <View style={styles.qrContainer}>
             {dashboardData?.vendor?.qr_code ? (
               <Image source={{ uri: dashboardData.vendor.qr_code }} style={styles.qrImage} resizeMode="contain" />
             ) : (
               <View style={styles.noQrBox}><Text>No QR Code</Text></View>
             )}
             <View style={[styles.corner, styles.topLeft]} /><View style={[styles.corner, styles.topRight]} />
             <View style={[styles.corner, styles.bottomLeft]} /><View style={[styles.corner, styles.bottomRight]} />
          </View>

          <View style={styles.qrActions}>
            <TouchableOpacity style={styles.actionBtn}>
              <View style={[styles.actionIconBg, { backgroundColor: '#ff6b6b' }]}><Ionicons name="share-social" size={20} color="#fff" /></View>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <View style={[styles.actionIconBg, { backgroundColor: '#ff6b6b' }]}><Ionicons name="download-outline" size={20} color="#fff" /></View>
              <Text style={styles.actionText}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Coupon List */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Recent Coupon Redemption</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllReedems', { storeId: dashboardData?.vendor?.store_id })}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {coupons.slice(0, 5).map((item) => (
          <View key={item.id} style={styles.couponCardWrapper}>
            <View style={styles.dateTag}>
              <Text style={styles.dateText}>
                {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.couponCard}>
              <View style={styles.cardUpper}>
                <View style={styles.userInfo}>
                  <Ionicons name="person-circle" size={40} color="#cbd5e1" style={{ marginRight: 10 }} />
                  <View>
                    <Text style={styles.userName}>User: {item.user_id}</Text>
                    <Text style={styles.userPhone}>ID: #{item.id}</Text>
                    <Text style={styles.userId}>Min Order: ₹{item.min_order_amount}</Text>
                  </View>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.amountInfo}>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Redeemed</Text>
                    <Text style={styles.amountValue}>₹{item.discount_amount}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardLower}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailValue}>₹{item.discount_amount} OFF</Text>
                  <Text style={styles.detailLabel}>Discount</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailValue}>{item.coupon_type}</Text>
                  <Text style={styles.detailLabel}>Type</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailValueBlue}>{item.coupon_code}</Text>
                  <Text style={styles.detailLabelRed}>Coupon Code</Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        {coupons.length === 0 && <Text style={styles.emptyText}>No recent redemptions</Text>}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('VechileDashboard')}>
          <Icon name="view-dashboard" size={24} color="#4f46e5" />
          <Text style={[styles.tabLabel, { color: "#4f46e5" }]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('VechileBookingAllDetails')}>
          <Icon name="calendar-month-outline" size={24} color="#999" />
          <Text style={[styles.tabLabel, { color: "#999" }]}>Booking</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('AddVechile')}>
          <View style={styles.addBtnCircle}><Icon name="plus" size={30} color="#fff" /></View>
          <Text style={styles.tabLabel}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('VendorAllVechiles')}>
          <Icon name="tray-arrow-up" size={24} color="#999" />
          <Text style={[styles.tabLabel, { color: "#999" }]}>Uploads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('StoreEditProfile')}>
          <Icon name="account-outline" size={24} color="#999" />
          <Text style={[styles.tabLabel, { color: "#999" }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingTop: 40 },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  headerSubtitle: { fontSize: 16, color: '#555', textTransform: 'capitalize' },
  profileLogo: { width: 45, height: 45, borderRadius: 23, borderWidth: 1, borderColor: '#eee' },
  bannerContainer: { backgroundColor: '#f8f9fa', borderRadius: 15, padding: 20, marginBottom: 25, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eee', elevation: 2 },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 5 },
  bannerText: { fontSize: 12, color: '#555' },
  highlightText: { color: '#eab308', fontWeight: 'bold' },
  bannerImage: { width: 100, height: 80 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { width: '31%', borderRadius: 15, padding: 15, alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#555', textAlign: 'center', marginBottom: 5, fontWeight: '600' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  viewAllText: { color: '#4f46e5', fontWeight: 'bold', fontSize: 14 },
  qrSection: { flexDirection: 'row', backgroundColor: '#fff4eb', padding: 20, borderRadius: 20, marginBottom: 25 },
  qrContainer: { flex: 2, alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 15 },
  qrImage: { width: 110, height: 110 },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: '#ff6b6b', borderWidth: 3 },
  topLeft: { top: 0, left: 10, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 10, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 10, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 10, borderLeftWidth: 0, borderTopWidth: 0 },
  qrActions: { flex: 1, justifyContent: 'center', gap: 15 },
  actionBtn: { alignItems: 'center' },
  actionIconBg: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  actionText: { fontSize: 12, color: '#555' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  couponCardWrapper: { marginBottom: 20 },
  dateTag: { alignSelf: 'flex-end', backgroundColor: '#f5f5f5', padding: 4, borderRadius: 4, zIndex: 1, marginBottom: -8 },
  dateText: { fontSize: 10 },
  couponCard: { borderRadius: 12, overflow: 'hidden', elevation: 3, backgroundColor: '#fff' },
  cardUpper: { backgroundColor: '#0f172a', padding: 15, flexDirection: 'row' },
  userInfo: { flexDirection: 'row', flex: 1.5 },
  userName: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  userPhone: { color: '#cbd5e1', fontSize: 11 },
  userId: { color: '#cbd5e1', fontSize: 11 },
  verticalDivider: { width: 1, backgroundColor: '#334155', marginHorizontal: 10 },
  amountInfo: { flex: 1, justifyContent: 'center' },
  amountValue: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  amountLabel: { color: '#cbd5e1', fontSize: 10 },
  cardLower: { flexDirection: 'row', padding: 10, justifyContent: 'space-around' },
  detailItem: { alignItems: 'center' },
  detailValue: { fontWeight: 'bold', fontSize: 13 },
  detailLabel: { fontSize: 10, color: '#ef4444' },
  detailLabelRed: { fontSize: 10, color: '#ef4444' },
  detailValueBlue: { fontWeight: 'bold', color: '#0f172a', fontSize: 13 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 10 },
  bottomTab: { position: 'absolute', bottom: 0, flexDirection: 'row', backgroundColor: '#fff', paddingBottom: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  tabItem: { flex: 1, alignItems: 'center' },
  tabLabel: { fontSize: 10, marginTop: 4 },
  addBtnCircle: { width: 45, height: 45, backgroundColor: '#333', borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginTop: -15 },
});

export default Dashboard;