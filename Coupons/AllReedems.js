import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable'; 

const RedeemHistoryScreen = () => {
  const navigation = useNavigation();
  
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // --- Search State ---
  const [searchQuery, setSearchQuery] = useState('');

  // --- Date Formatter ---
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // --- Fetch Data API ---
  const fetchRedeemHistory = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const sessionId = await AsyncStorage.getItem("user_id");
      
      if (!sessionId) {
        Alert.alert("Session Error", "User ID not found. Please log in again.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const url = `https://masonshop.in/api/store_redeem?store_id=${sessionId}`;
      
      const response = await fetch(url);
      const json = await response.json();

      if (json.status === true) {
        const sortedData = (json.data || []).sort(
            (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
        );
        setHistoryData(sortedData);
      } else {
        setHistoryData([]);
      }
    } catch (error) {
      console.error("History Fetch Error:", error);
      Alert.alert("Network Error", "Failed to fetch redeem history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRedeemHistory();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRedeemHistory(true);
  };

  // --- SEARCH FILTER LOGIC ---
  const filteredData = useMemo(() => {
    if (!searchQuery) return historyData;
    
    const lowerCaseQuery = searchQuery.toLowerCase();
    
    return historyData.filter(item => {
      const couponCode = (item.coupon_code || '').toLowerCase();
      const userId = (item.user_id || '').toLowerCase();
      const status = (item.status || '').toLowerCase();
      
      return couponCode.includes(lowerCaseQuery) || 
             userId.includes(lowerCaseQuery) ||
             status.includes(lowerCaseQuery);
    });
  }, [historyData, searchQuery]);

  // --- Reusable Detail Row Component ---
  const DetailRow = ({ icon, label, value, highlight }) => (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={14} color="#7f8c8d" style={styles.detailIcon} />
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={[styles.detailValue, highlight && styles.highlightText]} numberOfLines={1}>
        {value || 'N/A'}
      </Text>
    </View>
  );

  // --- UI Components ---
  const renderHistoryCard = ({ item, index }) => {
    let discountDisplay = String(item.discount_amount);
    if (!discountDisplay.includes('%') && !discountDisplay.includes('₹')) {
        const isFlat = item.coupon_type && item.coupon_type.toUpperCase() === 'FLAT';
        discountDisplay = isFlat ? `₹${item.discount_amount}` : `${item.discount_amount}%`;
    }

    return (
      <Animatable.View 
        animation="fadeInUp" 
        duration={500} 
        delay={Math.min(index * 50, 500)} // Capped delay so long lists don't take forever
        style={styles.cardContainer}
      >
        {/* TOP SECTION: Code & Status */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.couponCode}>{item.coupon_code}</Text>
            <Text style={styles.couponType}>{String(item.coupon_type).toUpperCase()} COUPON</Text>
          </View>
          <View style={[styles.statusBadge, item.status === 'redeemed' ? styles.statusRedeemed : styles.statusOther]}>
            <Text style={[styles.statusText, item.status === 'redeemed' && styles.statusTextRedeemed]}>
              {(item.status || 'UNKNOWN').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* MIDDLE SECTION: Huge Discount Display */}
        <View style={styles.cardBody}>
           <Text style={styles.discountTitle}>Discount Applied</Text>
           <Text style={styles.discountAmount}>-{discountDisplay}</Text>
        </View>

        {/* DASHED DIVIDER (Ticket Style) */}
        <View style={styles.dividerContainer}>
            <View style={styles.circleCutoutLeft} />
            <View style={styles.dashedLine} />
            <View style={styles.circleCutoutRight} />
        </View>

        {/* BOTTOM SECTION: All API Details Grid */}
        <View style={styles.cardFooter}>
            <View style={styles.gridColumn}>
                <DetailRow icon="person-outline" label="Customer" value={item.user_id} highlight />
                <DetailRow icon="cart-outline" label="Min Order" value={`₹${item.min_order_amount}`} />
                <DetailRow icon="calendar-outline" label="Created" value={formatDate(item.created_at)} />
            </View>
            <View style={styles.gridColumn}>
                <DetailRow icon="storefront-outline" label="Store" value={item.store_name || item.store_id} />
                <DetailRow icon="swap-horizontal-outline" label="Transfer" value={item.transfer_to || '-'} />
                <DetailRow icon="checkmark-done-outline" label="Redeemed" value={formatDate(item.updated_at)} highlight />
            </View>
        </View>

        {/* EXPIRY WARNING (If Applicable) */}
        {item.expires_at && (
            <View style={styles.expiryBox}>
                <Ionicons name="warning-outline" size={14} color="#e67e22" />
                <Text style={styles.expiryText}> Expired/Expires on: {formatDate(item.expires_at)}</Text>
            </View>
        )}
      </Animatable.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Redeem History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* SUMMARY STATS */}
      {!loading && historyData.length > 0 && (
        <Animatable.View animation="fadeInDown" style={styles.summaryBox}>
            <View style={styles.summaryIconBg}>
                <Ionicons name="analytics-outline" size={24} color="#4f46e5" />
            </View>
            <View style={{flex: 1, marginLeft: 15}}>
                <Text style={styles.summaryText}>Total Redemptions</Text>
                <Text style={styles.summarySubText}>Coupons successfully processed</Text>
            </View>
            <Text style={styles.summaryValue}>{historyData.length}</Text>
        </Animatable.View>
      )}

      {/* SEARCH BAR */}
      {!loading && (historyData.length > 0 || searchQuery.length > 0) && (
        <Animatable.View animation="fadeIn" style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#95a5a6" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by code, customer or status..."
            placeholderTextColor="#95a5a6"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 5 }}>
              <Ionicons name="close-circle" size={20} color="#bdc3c7" />
            </TouchableOpacity>
          )}
        </Animatable.View>
      )}

      {/* LIST CONTENT */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Syncing History...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderHistoryCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />
          }
          ListEmptyComponent={
            <Animatable.View animation="zoomIn" style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={80} color="#e0e0e0" />
              {searchQuery ? (
                 <>
                    <Text style={styles.emptyTitle}>No Matches Found</Text>
                    <Text style={styles.emptySub}>No coupons match "{searchQuery}".</Text>
                 </>
              ) : (
                 <>
                    <Text style={styles.emptyTitle}>No History Found</Text>
                    <Text style={styles.emptySub}>You haven't redeemed any coupons yet.</Text>
                 </>
              )}
            </Animatable.View>
          }
        />
      )}
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#Eef0f2',
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryIconBg: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center'
  },
  summaryText: { fontSize: 15, color: '#333', fontWeight: 'bold' },
  summarySubText: { fontSize: 11, color: '#95a5a6', marginTop: 2 },
  summaryValue: { fontSize: 24, fontWeight: '900', color: '#4f46e5' },

  // SEARCH BAR STYLES
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginTop: 15,
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },

  listContent: { padding: 15, paddingBottom: 40 },
  
  // CARD DESIGN
  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 15,
    backgroundColor: '#fafbfc',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  couponCode: { fontSize: 18, fontWeight: '900', color: '#2c3e50', letterSpacing: 1 },
  couponType: { fontSize: 10, fontWeight: 'bold', color: '#7f8c8d', marginTop: 4, letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusRedeemed: { backgroundColor: '#e8f8f5', borderWidth: 1, borderColor: '#27ae60' },
  statusOther: { backgroundColor: '#fdf2e9', borderWidth: 1, borderColor: '#e67e22' },
  statusText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  statusTextRedeemed: { color: '#27ae60' },

  cardBody: { padding: 15, alignItems: 'center', backgroundColor: '#FFF' },
  discountTitle: { fontSize: 12, color: '#95a5a6', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  discountAmount: { fontSize: 36, fontWeight: '900', color: '#4f46e5', marginTop: 5 },

  // DASHED DIVIDER (Ticket Effect)
  dividerContainer: { flexDirection: 'row', alignItems: 'center', zIndex: 1, marginVertical: -5 },
  circleCutoutLeft: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F4F6F9', marginLeft: -10 },
  dashedLine: { flex: 1, height: 1, borderWidth: 1, borderColor: '#e0e0e0', borderStyle: 'dashed' },
  circleCutoutRight: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F4F6F9', marginRight: -10 },

  cardFooter: { flexDirection: 'row', padding: 15, backgroundColor: '#FFF' },
  gridColumn: { flex: 1, paddingHorizontal: 5 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailIcon: { marginRight: 6 },
  detailLabel: { fontSize: 11, color: '#7f8c8d', width: 65 },
  detailValue: { fontSize: 11, color: '#2c3e50', fontWeight: '500', flex: 1 },
  highlightText: { color: '#27ae60', fontWeight: 'bold' },

  expiryBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff3e0', paddingVertical: 8 },
  expiryText: { fontSize: 11, color: '#e67e22', fontWeight: '600' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#7f8c8d', fontWeight: '500' },
  
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#7f8c8d', marginTop: 15 },
  emptySub: { fontSize: 14, color: '#bdc3c7', marginTop: 5, textAlign: 'center' },
});

export default RedeemHistoryScreen;