import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Clipboard,
  Alert,
  Dimensions,
  Image
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// ✅ API Configuration
const USER_REDEEM_API = 'https://masonshop.in/api/coupon_redeem';

// ✅ Theme Colors
const COLORS = {
  primary: '#700b33',
  secondary: '#FFD700', // Gold for Mason Coupons
  store: '#2196F3',     // Blue for Store Coupons
  bg: '#f8f9fa',
  card: '#fff',
  text: '#333',
  gray: '#777'
};

const UserRedeemHistory = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('mason'); // 'mason' or 'store'
  const [masonCoupons, setMasonCoupons] = useState([]);
  const [storeCoupons, setStoreCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      // ✅ Get User ID from Storage (Dynamic)
      // const userId = await AsyncStorage.getItem('user_id'); 
      const userId = 'M583400'; // Hardcoded for testing

      const response = await fetch(`${USER_REDEEM_API}?user_id=${userId}`);
      const json = await response.json();

      if (json.status && json.data) {
        setMasonCoupons(json.data.mason_coupons || []);
        setStoreCoupons(json.data.store_coupons || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      Alert.alert("Error", "Failed to load coupons.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCoupons();
  };

  const copyToClipboard = (code) => {
    Clipboard.setString(code);
    Alert.alert('Copied', `${code} copied to clipboard!`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // ✅ RENDER ITEM
  const renderItem = ({ item }) => {
    const isStore = activeTab === 'store';
    
    return (
      <View style={styles.card}>
        {/* Left Icon Section */}
        <View style={styles.leftSection}>
          <View style={[styles.iconCircle, { backgroundColor: isStore ? '#e3f2fd' : '#fff9c4' }]}>
            <MaterialCommunityIcons 
              name={isStore ? "storefront-outline" : "crown-outline"} 
              size={24} 
              color={isStore ? COLORS.store : '#fbc02d'} 
            />
          </View>
        </View>

        {/* Middle Content */}
        <View style={styles.middleSection}>
          <Text style={styles.couponLabel}>
            {isStore ? 'Store Coupon' : 'Mason Reward'}
          </Text>
          
          <TouchableOpacity onPress={() => copyToClipboard(item.coupon_code)}>
            <View style={styles.codeRow}>
              <Text style={styles.codeText}>{item.coupon_code}</Text>
              <MaterialCommunityIcons name="content-copy" size={14} color={COLORS.primary} />
            </View>
          </TouchableOpacity>

          <View style={styles.metaRow}>
            {item.discount_amount ? (
               <Text style={styles.discountText}>Save ₹{item.discount_amount}</Text>
            ) : (
               <Text style={styles.discountText}>Special Offer</Text>
            )}
            
            {item.min_order_amount && (
               <Text style={styles.minOrderText}>Min Order: ₹{item.min_order_amount}</Text>
            )}
          </View>

          <Text style={styles.dateText}>Used on: {formatDate(item.updated_at)}</Text>
        </View>

        {/* Right Status */}
        <View style={styles.rightSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>REDEEMED</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={26} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Redemptions</Text>
        </View>

        <TouchableOpacity onPress={onRefresh}>
           <MaterialCommunityIcons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'mason' && styles.activeTab]}
          onPress={() => setActiveTab('mason')}
        >
          <Text style={[styles.tabText, activeTab === 'mason' && styles.activeTabText]}>
            Mason Coupons
          </Text>
          {activeTab === 'mason' && <View style={styles.activeLine} />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'store' && styles.activeTab]}
          onPress={() => setActiveTab('store')}
        >
          <Text style={[styles.tabText, activeTab === 'store' && styles.activeTabText]}>
            Store Coupons
          </Text>
          {activeTab === 'store' && <View style={styles.activeLine} />}
        </TouchableOpacity>
      </View>

      {/* LIST CONTENT */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'mason' ? masonCoupons : storeCoupons}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name={activeTab === 'mason' ? "ticket-outline" : "shopping-outline"} 
                size={60} color="#ddd" 
              />
              <Text style={styles.emptyText}>
                No {activeTab} coupons redeemed yet.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default UserRedeemHistory;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  
  /* Header */
 /* Header */
  header: {
    paddingHorizontal: 15,
    paddingVertical: 50,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2, // shadow for Android
    shadowColor: '#000', // shadow for iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,

  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },

  /* Tabs */
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  activeLine: {
    position: 'absolute',
    bottom: -5,
    width: '60%',
    height: 3,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  /* List */
  listContent: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    // Shadow
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  /* Left Icon */
  leftSection: {
    marginRight: 15,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Middle Content */
  middleSection: {
    flex: 1,
  },
  couponLabel: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  codeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // subtle underline hint
    borderStyle: 'dashed'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  discountText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    backgroundColor: '#fcecf2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  minOrderText: {
    fontSize: 12,
    color: '#666',
  },
  dateText: {
    fontSize: 11,
    color: '#aaa',
  },

  /* Right Status */
  rightSection: {
    marginLeft: 10,
  },
  badge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2e7d32',
  },

  /* Empty State */
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    opacity: 0.6,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 14,
    color: '#888',
  },
});