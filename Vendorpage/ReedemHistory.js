import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Clipboard,
  Alert,
  Dimensions,
  Keyboard
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// ✅ API Configuration
const REDEEM_HISTORY_API = 'https://masonshop.in/api/store_redeem';

const RedeemHistoryScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalRedeemed, setTotalRedeemed] = useState(0);
  
  // 🔍 Search State
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      // ✅ Dynamic Store ID (Uncomment line below to use real user ID)
      // const storeId = await AsyncStorage.getItem('user_id'); 
      const storeId = await AsyncStorage.getItem('user_id');

      const response = await fetch(`${REDEEM_HISTORY_API}?store_id=${storeId}`);
      const json = await response.json();

      if (json.status && Array.isArray(json.data)) {
        setData(json.data);
        
        // Calculate total stats
        const total = json.data.reduce((sum, item) => sum + parseFloat(item.discount_amount || 0), 0);
        setTotalRedeemed(total);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      Alert.alert("Error", "Failed to load redemption history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const copyToClipboard = (code) => {
    Clipboard.setString(code);
    Alert.alert('Copied', `Coupon Code ${code} copied to clipboard!`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // 🔍 FILTER LOGIC: Matches Coupon Code, User ID, or Amount
  const filteredData = data.filter((item) => {
    const query = searchQuery.toLowerCase();
    const code = item.coupon_code ? item.coupon_code.toLowerCase() : '';
    const user = item.user_id ? item.user_id.toLowerCase() : '';
    const amount = item.discount_amount ? item.discount_amount.toString() : '';

    return code.includes(query) || user.includes(query) || amount.includes(query);
  });

  const renderItem = ({ item }) => {
    return (
      <View style={styles.card}>
        {/* Left: Icon & Amount */}
        <View style={styles.leftSection}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="ticket-percent-outline" size={24} color="#fff" />
          </View>
          <Text style={styles.amountText}>₹{item.discount_amount}</Text>
          <Text style={styles.amountLabel}>Saved</Text>
        </View>

        {/* Middle: Details */}
        <View style={styles.middleSection}>
          <TouchableOpacity onPress={() => copyToClipboard(item.coupon_code)}>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{item.coupon_code}</Text>
              <MaterialCommunityIcons name="content-copy" size={14} color="#700b33" style={{marginLeft: 4}}/>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.detailText}>
            <Text style={{fontWeight: 'bold'}}>User:</Text> {item.user_id}
          </Text>
          <Text style={styles.detailText}>
             Min Order: ₹{item.min_order_amount}
          </Text>
          <Text style={styles.dateText}>{formatDate(item.updated_at)}</Text>
        </View>

        {/* Right: Status Badge */}
        <View style={styles.rightSection}>
          <View style={[styles.badge, item.status === 'redeemed' ? styles.badgeSuccess : styles.badgePending]}>
            <Text style={styles.badgeText}>{item.status?.toUpperCase()}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Redemption History</Text>
          <Text style={styles.headerSubtitle}>Track coupons used in your store</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <MaterialCommunityIcons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* STATS CARD */}
      {!loading && (
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Coupons</Text>
            <Text style={styles.statValue}>{data.length}</Text>
          </View>
          <View style={styles.verticalLine} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Discount</Text>
            <Text style={styles.statValue}>₹{totalRedeemed.toLocaleString()}</Text>
          </View>
        </View>
      )}

      {/* 🔍 SEARCH BAR */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={22} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Code, User ID or Amount..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      {/* LIST */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#700b33" />
        </View>
      ) : (
        <FlatList
          // ✅ Use filteredData here instead of data
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          // ✅ Keyboard dismiss on scroll
          onScrollBeginDrag={Keyboard.dismiss} 
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="text-search" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery ? "No matching coupons found" : "No coupons redeemed yet."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default RedeemHistoryScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  
  /* Header */
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 13, color: '#777', marginTop: 2 },
  refreshBtn: { padding: 8, backgroundColor: '#f0f0f0', borderRadius: 8 },

  /* Stats Card */
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#700b33',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    padding: 15,
    elevation: 4,
    shadowColor: '#700b33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  verticalLine: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 10 },

  /* 🔍 Search Bar Styles */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 50,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#333', height: '100%' },

  /* List */
  listContent: { paddingHorizontal: 15, paddingBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  
  /* Sections inside Card */
  leftSection: {
    alignItems: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
    minWidth: 70,
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#700b33',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  amountText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  amountLabel: { fontSize: 10, color: '#888' },

  middleSection: { flex: 1, paddingHorizontal: 12 },
  codeContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fdf2f5', alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    marginBottom: 6, borderWidth: 1, borderColor: '#f8d7da',
  },
  codeText: { fontSize: 14, fontWeight: 'bold', color: '#700b33', letterSpacing: 0.5 },
  detailText: { fontSize: 12, color: '#555', marginBottom: 2 },
  dateText: { fontSize: 11, color: '#999', marginTop: 4 },

  rightSection: { justifyContent: 'center', alignItems: 'flex-end' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeSuccess: { backgroundColor: '#e6f4ea' },
  badgePending: { backgroundColor: '#fff3e0' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#1e7e34' },

  /* Empty/Loader */
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 10, fontSize: 16, color: '#888' },
});