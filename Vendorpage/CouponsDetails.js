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
import { Text, Searchbar, Surface } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function VendorCoupons() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("FLAT"); // 'FLAT' or 'PERCENTAGE'

 
  const fetchCoupons = async () => {
    setLoading(true);
    const USER_ID=await AsyncStorage.getItem('user_id');
    try {
      const response = await fetch(
        `https://masonshop.in/api/get_coupons?user_id=${USER_ID}`
      );
      const json = await response.json();
      
      if (json && json.status && Array.isArray(json.data)) {
        setCoupons(json.data);
      } else {
        setCoupons([]);
      }
    } catch (err) {
      console.error(err);
      setCoupons([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const copyToClipboard = (code) => {
    if (!code) return;
    Clipboard.setString(code);
    Alert.alert("Copied!", `Code ${code} copied.`);
  };

  const filteredCoupons = coupons.filter((item) => {
    const name = item?.coupon_name || "";
    const code = item?.coupon_code || "";
    const type = item?.coupon_type || "";

    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = type.toUpperCase() === activeTab;
    return matchesSearch && matchesTab;
  });

  const renderCouponItem = ({ item }) => {
    const isPercentage = (item?.coupon_type || "").toUpperCase() === "PERCENTAGE";
    const displayValue = Math.floor(Number(item?.discount_value || 0));
    const expiry = item?.expires_at ? item.expires_at.split(' ')[0] : "No Expiry";
    const usageLimit = item?.no_of_coupons || 0;

    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => navigation.navigate("AllCoupons", { couponId: item?.id })}
      >
        <View style={styles.cardContainer}>
          {/* LEFT SECTION: IMAGE & SYMBOL */}
          <View style={styles.leftSection}>
            {item?.image ? (
              <Image 
                source={{ uri:  item.image_url  }} 
                style={styles.couponImage} 
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Icon name={isPercentage ? "percent" : "cash-multiple"} size={30} color="#065F46" />
              </View>
            )}
        
          </View>

          {/* DIVIDER LINE WITH PUNCH HOLES */}
          <View style={styles.divider}>
            <View style={styles.circleTop} />
            <View style={styles.dashedLine} />
            <View style={styles.circleBottom} />
          </View>

          {/* RIGHT SECTION: DETAILS */}
          <View style={styles.rightSection}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.couponName} numberOfLines={1}>
                  {item?.coupon_name || "Unnamed Coupon"}
                </Text>
                {/* DISPLAY NO_OF_COUPONS */}
                <View style={styles.usageBadge}>
                  <Icon name="ticket-percent" size={12} color="#065F46" />
                  <Text style={styles.usageText}>Limit: {usageLimit}</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color="#ccc" />
            </View>

            <Text style={styles.discountText}>
              {isPercentage ? `${displayValue}% OFF` : `₹${displayValue} OFF`}
            </Text>

            <View style={styles.bottomRow}>
              <View style={styles.codeRow}>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>{item?.coupon_code || "N/A"}</Text>
                </View>
                <TouchableOpacity onPress={() => copyToClipboard(item?.coupon_code)}>
                  <Icon name="content-copy" size={16} color="#666" />
                </TouchableOpacity>
              </View>
              <Text style={styles.expiryText}>Exp: {expiry}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Coupons</Text>
        <TouchableOpacity onPress={() => navigation.navigate("CreateCoupon")}>
          <Icon name="plus-circle" size={30} color="#065F46" />
        </TouchableOpacity>
      </View>

      <Surface style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Total Coupons</Text>
          <Text style={styles.summaryCount}>{coupons?.length || 0}</Text>
        </View>
        <Icon name="ticket-confirmation" size={40} color="#fff" style={{opacity: 0.3}} />
      </Surface>

      <View style={styles.filterSection}>
        <Searchbar
          placeholder="Search name or code..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          elevation={0}
        />

        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === "FLAT" && styles.activeTabBtn]} 
            onPress={() => setActiveTab("FLAT")}>
            <Text style={[styles.tabText, activeTab === "FLAT" && styles.activeTabText]}>Discount (₹)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === "PERCENTAGE" && styles.activeTabBtn]} 
            onPress={() => setActiveTab("PERCENTAGE")}>
            <Text style={[styles.tabText, activeTab === "PERCENTAGE" && styles.activeTabText]}>Percentage (%)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#065F46" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredCoupons}
          renderItem={renderCouponItem}
          keyExtractor={(item) => (item?.id ? item.id.toString() : Math.random().toString())}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="ticket-outline" size={50} color="#ccc" />
              <Text style={{ color: "#999", marginTop: 10 }}>No {activeTab.toLowerCase()} coupons found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F8F9FA" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: "#fff" },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  summaryCard: { margin: 20, padding: 20, borderRadius: 15, backgroundColor: "#065F46", flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4 },
  summaryLabel: { color: "#fff", opacity: 0.8, fontSize: 14 },
  summaryCount: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  filterSection: { paddingHorizontal: 20, marginBottom: 10 },
  searchBar: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginBottom: 15 },
  tabs: { flexDirection: 'row', backgroundColor: '#E0E0E0', borderRadius: 8, padding: 2 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 6 },
  activeTabBtn: { backgroundColor: '#fff', elevation: 2 },
  tabText: { color: '#666', fontWeight: '600', fontSize: 13 },
  activeTabText: { color: '#065F46' },
  listContent: { padding: 20 },
  
  // Card Styles
  cardContainer: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, marginBottom: 15, height: 140, elevation: 2, overflow: 'hidden' },
  leftSection: { width: 90, justifyContent: "center", alignItems: "center", backgroundColor: "#F1F8F6" },
  couponImage: { width: 55, height: 55, borderRadius: 10, backgroundColor: '#fff' },
  placeholderImage: { width: 55, height: 55, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  verticalType: { fontSize: 16, fontWeight: 'bold', color: '#065F46', marginTop: 5 },
  
  divider: { width: 1, height: '100%', position: 'relative', alignItems: 'center' },
  dashedLine: { flex: 1, width: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ddd' },
  circleTop: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#F8F9FA', position: 'absolute', top: -8 },
  circleBottom: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#F8F9FA', position: 'absolute', bottom: -8 },
  
  rightSection: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  couponName: { fontWeight: 'bold', fontSize: 15, color: '#333' },
  
  usageBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E1F2E9', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  usageText: { fontSize: 11, fontWeight: '700', color: '#065F46', marginLeft: 4 },
  
  discountText: { fontSize: 24, fontWeight: 'bold', color: '#065F46', marginVertical: 2 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codeRow: { flexDirection: 'row', alignItems: 'center' },
  codeBox: { backgroundColor: '#F0FDF4', borderStyle: 'dashed', borderWidth: 1, borderColor: '#065F46', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginRight: 8 },
  codeText: { fontSize: 13, fontWeight: 'bold', color: '#065F46' },
  expiryText: { fontSize: 10, color: '#999' },
  emptyState: { alignItems: 'center', marginTop: 40 }
});