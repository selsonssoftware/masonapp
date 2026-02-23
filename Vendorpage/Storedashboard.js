import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Text, Button, Card } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ===== API ===== */
const STORE_API = "https://masonshop.in/api/vendor_dashboard";
const REDEEM_HISTORY_API = 'https://masonshop.in/api/store_redeem';

export default function StoreDashboard() {
  const [vendor, setVendor] = useState(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reedemHistory, setReedemHistory] = useState([]);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("user_id");
      if (!userId) {
        setLoading(false);
        return;
      }

      // 1. Fetch Store Profile first to get the vendor/store_id
      const storeRes = await fetch(`${STORE_API}?user_id=${userId}`);
      const storeJson = await storeRes.json();
      
      if (storeJson.status === true) {
        setVendor(storeJson.vendor);
        
        // 2. Fetch Redeem History using store_id from the profile
        const redeemRes = await fetch(`${REDEEM_HISTORY_API}?store_id=${userId}`);
        const redeemJson = await redeemRes.json();
        if (redeemJson.status === true) {
          setReedemHistory(redeemJson.data || []);
        }
      }
    } catch (e) {
      console.log("Dashboard Data Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !vendor) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#DA1F49" />
        <Text style={{marginTop: 10}}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* ================= PROFILE HEADER ================= */}
      <View style={styles.header}>
        <View style={styles.logoWrapper}>
          <Image source={{ uri: vendor.logo }} style={styles.logo} />
        </View>
        <Text style={styles.storeName}>{vendor.store_name}</Text>
        <Text style={styles.address}>
          {vendor.address}, {vendor.city}
        </Text>
      </View>

      {/* ================= STATS CARDS ================= */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Icon name="ticket-confirmation" size={22} color="#DA1F49" />
          <Text variant="labelSmall">Coupons</Text>
          <Text style={styles.statValue}>{vendor.coupons_count || '0'}</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="ticket-percent" size={22} color="#DA1F49" />
          <Text variant="labelSmall">Total Redeemed</Text>
          <Text style={styles.statValue}>₹{vendor.total_redeem_amt || '0'}</Text>
        </View>
      </View>

      {/* ================= QR SECTION ================= */}
      <TouchableOpacity onPress={() => setQrVisible(true)}>
        <Card style={styles.qrCard}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.qrTitle}>Store QR Code</Text>
              <Text style={{fontSize: 12, color: '#666'}}>
                Share this QR with customers to redeem coupons.
              </Text>
            </View>
            <Icon name="qrcode" size={50} color="#DA1F49" />
          </View>
        </Card>
      </TouchableOpacity>

      {/* ================= ACTION SECTION ================= */}
      <Card style={styles.createCouponCard}>
        <Text style={styles.createCouponText}>Boost Your Sales</Text>
        <Text style={{textAlign: 'center', fontSize: 12, marginVertical: 5}}>
          Create exclusive discount coupons for your customers.
        </Text>
        <Button 
          mode="contained" 
          style={styles.couponBtn} 
          onPress={() => navigation.navigate('GenerateCoupons')}
        >
          Create Coupon
        </Button>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CouponsDetails')}>
            <Icon name="ticket-outline" size={18} color="#DA1F49" />
            <Text style={styles.actionText}>My Coupons</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ReedemHistory')}>
            <Icon name="history" size={18} color="#DA1F49" />
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('StoreEditProfile')}>
            <Icon name="account-edit-outline" size={18} color="#DA1F49" />
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* ================= RECENT REDEMPTION ================= */}
      <Text style={styles.sectionTitle}>Recent Redemptions</Text>
      
      {reedemHistory.length > 0 ? (
        reedemHistory.map((item, index) => (
          <Card style={styles.redemptionCard} key={item.id || index}>
            <View style={styles.redHeader}>
              <View style={styles.redemptionHeader}>
                <View style={styles.userInfo}>
                  <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.avatar} />
                  <View>
                    <Text style={styles.name}>User: {item.user_id}</Text>
                    <Text style={styles.userDetail}>Status: {item.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.redemptionDate}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.couponInfo}>
                <View>
                  <Text style={styles.whiteText}>Discount</Text>
                  <Text style={styles.highlight}>₹{item.discount_amount}</Text>
                </View>
                <View>
                  <Text style={styles.whiteText}>Code</Text>
                  <Text style={styles.highlight}>{item.coupon_code}</Text>
                </View>
                <View>
                  <Text style={styles.whiteText}>Type</Text>
                  <Text style={styles.highlight}>{item.coupon_type}</Text>
                </View>
              </View>
            </View>

            <View style={styles.amountRow}>
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Min. Order</Text>
                <Text style={styles.amountRed}>₹{item.min_order_amount}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Status</Text>
                <Text style={styles.amountGreen}>REDEEMED</Text>
              </View>
            </View>
          </Card>
        ))
      ) : (
        <Text style={{textAlign: 'center', marginVertical: 20, color: '#999'}}>
            No recent redemptions found.
        </Text>
      )}

      <View style={{height: 50}} />

      {/* QR MODAL (Unchanged) */}
      <Modal visible={qrVisible} transparent animationType="fade" onRequestClose={() => setQrVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Image source={{ uri: vendor.qr_code }} style={styles.qrImage} />
            <Text style={styles.storeName}>{vendor.store_name}</Text>
            <Button mode="outlined" textColor="#DA1F49" style={{marginTop: 20}} onPress={() => setQrVisible(false)}>
              Close
            </Button>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: "#fff", padding: 12, paddingTop: 40 },
  header: { alignItems: "center", marginVertical: 15 },
  logoWrapper: { position: "relative" },
  logo: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#f0f0f0' },
  storeName: { fontSize: 18, fontWeight: "bold", marginTop: 8 },
  address: { fontSize: 12, color: "#555", textAlign: 'center', paddingHorizontal: 20 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  statCard: {
    flex: 1,
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
  },
  statValue: { fontSize: 15, fontWeight: "bold", color: '#000', marginTop: 4 },
  qrCard: { marginVertical: 12, padding: 16, borderRadius: 12, elevation: 2, backgroundColor: '#FFF5F7' },
  qrTitle: { fontSize: 16, fontWeight: "bold", color: '#DA1F49' },
  createCouponCard: {
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#DA1F49",
    alignItems: "center",
    backgroundColor: '#fff'
  },
  createCouponText: { fontSize: 16, fontWeight: "bold", color: "#DA1F49" },
  couponBtn: { marginTop: 10, backgroundColor: "#DA1F49", width: '100%' },
  actionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 15, width: "100%" },
  actionBtn: { flex: 1, marginHorizontal: 3, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#DA1F49", alignItems: "center" },
  actionText: { marginTop: 4, fontSize: 10, color: "#DA1F49", fontWeight: "600" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 15 },
  redemptionCard: { borderRadius: 12, marginBottom: 12, overflow: "hidden", elevation: 3 },
  redHeader: { backgroundColor: "#DA1F49", padding: 12 },
  redemptionHeader: { flexDirection: "row", justifyContent: "space-between" },
  userInfo: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 45, height: 45, borderRadius: 22, marginRight: 10, backgroundColor: '#eee' },
  name: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  userDetail: { color: "#fff", fontSize: 11, opacity: 0.9 },
  redemptionDate: { color: "#fff", fontSize: 10 },
  couponInfo: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.3)', paddingTop: 8 },
  whiteText: { color: "#fff", fontSize: 10, opacity: 0.8 },
  highlight: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  amountRow: { flexDirection: "row", padding: 12, backgroundColor: '#fff' },
  amountBox: { flex: 1, alignItems: "center" },
  amountLabel: { fontSize: 10, color: '#666' },
  amountRed: { color: "#DA1F49", fontWeight: "bold", fontSize: 14 },
  amountGreen: { color: "green", fontWeight: "bold", fontSize: 14 },
  divider: { width: 1, backgroundColor: "#eee" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#fff", padding: 25, borderRadius: 20, alignItems: "center", width: "85%" },
  qrImage: { width: 220, height: 220, marginBottom: 15 },
});