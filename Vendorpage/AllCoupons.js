import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Clipboard,
  Alert,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Text, Searchbar } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function VendorCoupons() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  // Removed filter state since we want to show ALL coupons
  
  const VENDOR_ID = route.params?.couponId;

  const fetchCoupons = async () => {
    if (!VENDOR_ID) {
      Alert.alert("Error", "No ID found to fetch coupons.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://masonshop.in/api/coupons?payment_id=${VENDOR_ID}`
      );
      const json = await response.json();
      const couponData = Array.isArray(json) ? json : (json.data || []);
      setCoupons(couponData);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [VENDOR_ID]);

  const copyToClipboard = (code) => {
    Clipboard.setString(code);
    Alert.alert("Copied!", `Coupon code ${code} copied.`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No Expiry";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Helper to check expiry for the badge status
  const isCouponExpired = (dateString) => {
    if (!dateString) return false; 
    const expiryDate = new Date(dateString);
    const currentDate = new Date();
    return expiryDate < currentDate; 
  };

  // Filter ONLY by Search Query (Show All)
  const filteredCoupons = coupons.filter((item) => {
    const name = item?.coupon_name || "";
    const code = item?.coupon_code || "";
    
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           code.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderCouponItem = ({ item }) => {
    const isPercentage = item.coupon_type && item.coupon_type.toUpperCase() === "PERCENTAGE";
    const minOrder = parseFloat(item.min_order_amount || 0);
    const usageCount = item.no_of_coupons || 0;

    // Formatting discount value
    let rawValue = item.discount_value ? String(item.discount_value).trim() : "0";
    if (rawValue.includes("Select") || rawValue === "") rawValue = "0";
    const displayValue = Math.floor(Number(rawValue)) || 0;

    // Determine Status for Badge
    const expired = isCouponExpired(item.expires_at);
    const displayStatus = expired ? "EXPIRED" : "ACTIVE";

    return (
      <View style={[styles.cardContainer, expired && styles.expiredCardOpacity]}>
        {/* Left Section: Image/Symbol */}
        <View style={styles.leftSection}>
          {item.image ? (
            <Image 
              source={{ uri:  item.image_url  }} 
              style={styles.couponImage} 
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: '#E8F5E9' }]}>
              <Icon name="ticket-percent" size={32} color="#2E7D32" />
            </View>
          )}
          {/* <Text style={styles.verticalText}>{isPercentage ? '%' : '₹'}</Text> */}
        </View>

        {/* Ticket Divider */}
        <View style={styles.divider}>
          <View style={styles.circleTop} />
          <View style={styles.dashedLine} />
          <View style={styles.circleBottom} />
        </View>

        {/* Right Section: Content */}
        <View style={styles.rightSection}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.couponName} numberOfLines={1}>{item.coupon_name || "Unnamed"}</Text>
              
              <View style={styles.usageBadge}>
                <Icon name="tag-multiple" size={10} color="#065F46" />
                <Text style={styles.usageText}>{usageCount} Available</Text>
              </View>
            </View>
            
            {/* Status Badge */}
            <View style={[styles.badge, !expired ? styles.activeBadge : styles.expiredBadge]}>
              <Text style={[styles.badgeText, !expired ? styles.activeText : styles.expiredText]}>
                {displayStatus}
              </Text>
            </View>
          </View>

          <Text style={styles.discountText}>
            {isPercentage ? `${displayValue}% OFF` : `₹${displayValue} OFF`}
          </Text>

          <Text style={styles.minOrderText}>
            {minOrder > 0 ? `Min Order: ₹${minOrder}` : "No Minimum Order"}
          </Text>

          <View style={styles.bottomActionRow}>
            <View style={styles.codeRow}>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{item.coupon_code}</Text>
              </View>
              <TouchableOpacity onPress={() => copyToClipboard(item.coupon_code)}>
                <Icon name="content-copy" size={16} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.expiryText}>Exp: {formatDate(item.expires_at)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Coupons</Text>
       
      </View>

      <View style={styles.filterSection}>
        <Searchbar
          placeholder="Search name or code..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          elevation={0}
        />
        {/* Removed Tabs Section */}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#065F46" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredCoupons}
          renderItem={renderCouponItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="ticket-outline" size={60} color="#ddd" />
              <Text style={{ color: "#999", marginTop: 10 }}>No coupons found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F5F7FA" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: "#fff" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  
  // Adjusted filter section to remove tabs padding
  filterSection: { padding: 20, paddingBottom: 10, backgroundColor: "#fff", borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 2 },
  searchBar: { height: 45, backgroundColor: "#F0F2F5", borderRadius: 10 },
  
  listContent: { padding: 20, paddingBottom: 50 },
  
  cardContainer: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, marginBottom: 15, height: 145, elevation: 3, overflow:'hidden' },
  expiredCardOpacity: { opacity: 0.75 }, // Optional visual cue for expired cards
  
  leftSection: { width: 90, justifyContent: "center", alignItems: "center", backgroundColor: "#F1F8F6" },
  couponImage: { width: 55, height: 55, borderRadius: 8 },
  placeholderImage: { width: 55, height: 55, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  verticalText: { fontSize: 16, fontWeight: 'bold', color: '#065F46', marginTop: 5 },
  
  divider: { width: 1, height: '100%', position: 'relative', alignItems: 'center' },
  dashedLine: { flex: 1, width: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ddd' },
  circleTop: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F5F7FA', position: 'absolute', top: -10, left: -10 },
  circleBottom: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F5F7FA', position: 'absolute', bottom: -10, left: -10 },
  
  rightSection: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  couponName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  usageBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E1F2E9', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  usageText: { fontSize: 10, fontWeight: '700', color: '#065F46', marginLeft: 4 },
  
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  activeBadge: { backgroundColor: '#E8F5E9' },
  expiredBadge: { backgroundColor: '#FFEBEE' },
  badgeText: { fontSize: 9, fontWeight: 'bold' },
  activeText: { color: '#2E7D32' },
  expiredText: { color: '#C62828' },
  
  discountText: { fontSize: 24, fontWeight: 'bold', color: '#065F46' },
  minOrderText: { fontSize: 11, color: '#888' },
  bottomActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codeRow: { flexDirection: 'row', alignItems: 'center' },
  codeBox: { borderWidth: 1, borderColor: '#065F46', borderStyle: 'dashed', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, marginRight: 6, backgroundColor: '#F0FDF4' },
  codeText: { fontSize: 12, fontWeight: 'bold', color: '#065F46' },
  expiryText: { fontSize: 10, color: '#aaa' },
  emptyState: { alignItems: 'center', marginTop: 50 },
});