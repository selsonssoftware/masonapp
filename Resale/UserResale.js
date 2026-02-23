import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ================= API ================= */
// ✅ Updated for Resale Products
const LIST_API = 'https://masonshop.in/api/resale_userdata';

// 🔄 Assumed Endpoints based on your pattern (Change if different)
const UPDATE_STATUS_API = 'https://masonshop.in/api/resale_updateStatus';
const DELETE_PROPERTY_API = 'https://masonshop.in/api/resale_delete';
const MEMBERSHIP_API = 'https://masonshop.in/api/check_subscription';

/* ================= THEME COLORS ================= */
const COLORS = {
  primary: '#700b33',
  background: '#F8F9FA',
  cardBg: '#FFFFFF',
  textDark: '#1A1A1A',
  textLight: '#757575',
  border: '#E0E0E0',
  success: '#4CAF50',
  danger: '#FF5252',
};

const MyResaleListing = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('unpublished');
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState(null);

  useEffect(() => {
    fetchUserProducts();
    fetchMembership();
  }, []);

  const fetchUserProducts = async () => {
    try {
      setLoading(true);
      const storedUserId = (await AsyncStorage.getItem('user_id')) || 'M850440';

      const res = await fetch(`${LIST_API}?user_id=${storedUserId}`);
      const json = await res.json();

      if (json.status) {
        // ✅ Handle if data is an Object (single item) OR Array (multiple items)
        const rawData = Array.isArray(json.data) ? json.data : (json.data ? [json.data] : []);
        
        setAllProducts(
  rawData.map(item => ({
    id: item.id?.toString(),
    title: item.project_name || 'No Name',
    price: item.price,
    status: item.status,
    description: item.description,
    category: item.category,
    
    // ✅ CORRECT IMAGE LOGIC:
    // 1. Check if 'image' exists
    // 2. If null, check if 'multiple_image' has items and take the first one
    // 3. Fallback to placeholder
    image: item.image 
      ? item.image 
      : (item.multiple_image && item.multiple_image.length > 0 
          ? item.multiple_image[0] 
          : 'https://via.placeholder.com/400x300?text=No+Image'),
  }))
);} else {
        setAllProducts([]);
      }
    } catch (error) {
      console.log('Resale fetch error:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembership = async () => {
    try {
      const userId = (await AsyncStorage.getItem('user_id')) || 'M850440';
      const res = await fetch(`${MEMBERSHIP_API}?user_id=${userId}`);
      const data = await res.json();
      setMembership(data);
    } catch {}
  };

  const filteredData = useMemo(
    () => allProducts.filter(p => p.status === activeTab),
    [activeTab, allProducts]
  );

  const updateStatus = async (id, status) => {
    if (!membership || membership.status !== 'active') {
      Alert.alert(
        'Membership Required',
        'You need an active subscription to publish this product.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Membership',
            onPress: () => navigation.navigate('Membership'),
          },
        ]
      );
      return;
    }

    try {
      // ✅ Sending 'id' instead of property_id
      await fetch(UPDATE_STATUS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      fetchUserProducts();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const deleteProduct = id => {
    Alert.alert('Delete Product', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          // ✅ Sending 'id'
          await fetch(`${DELETE_PROPERTY_API}?id=${id}`);
          fetchUserProducts();
        },
      },
    ]);
  };

  /* ================= PRODUCT CARD ================= */
  const renderProduct = ({ item }) => {
    return (
      <View style={styles.card}>
        {/* IMAGE */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.productImg} resizeMode="cover" />
          
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>₹ {item.price}</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: activeTab === 'published' ? COLORS.success : '#555' }]}>
             <Text style={styles.statusText}>{activeTab.toUpperCase()}</Text>
          </View>
        </View>

        {/* DETAILS */}
        <View style={styles.detailsContainer}>
          <Text style={styles.titleText} numberOfLines={1}>
            {item.title}
          </Text>

          <View style={styles.categoryRow}>
            <Icon name="tag-outline" size={16} color={COLORS.textLight} />
            <Text style={styles.categoryText}>Category: {item.category || 'General'}</Text>
          </View>

          <Text style={styles.descText} numberOfLines={2}>
            {item.description || 'No description available.'}
          </Text>

          <View style={styles.separator} />

          {/* ACTIONS */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => deleteProduct(item.id)}>
              <Icon name="trash-can-outline" size={20} color={COLORS.danger} />
              <Text style={styles.deleteText}>Remove</Text>
            </TouchableOpacity>

            {activeTab === 'unpublished' && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => updateStatus(item.id, 'published')}>
                <Text style={styles.primaryBtnText}>Publish</Text>
                <Icon name="arrow-right" size={18} color="#fff" />
              </TouchableOpacity>
            )}

            {activeTab === 'published' && (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: '#444' }]}
                onPress={() => updateStatus(item.id, 'soldout')}>
                <Text style={styles.primaryBtnText}>Mark Sold</Text>
                <Icon name="check" size={18} color="#fff" />
              </TouchableOpacity>
            )}
            
             {activeTab === 'soldout' && (
               <View style={styles.soldBadge}>
                  <Text style={{color: COLORS.textLight, fontSize: 12}}>Sold Out</Text>
               </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>My Resale Products</Text>
        <Text style={styles.headerSubtitle}>Manage your sales</Text>
      </View>

      <View style={styles.tabBar}>
        {['unpublished', 'published', 'soldout'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.activeTab]}
            onPress={() => setActiveTab(t)}>
            <Text
              style={[
                styles.tabText,
                activeTab === t && styles.activeTabText,
              ]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderProduct}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
             <View style={styles.emptyContainer}>
                <Icon name="package-variant" size={60} color="#ccc" />
                <Text style={styles.emptyText}>No products found in {activeTab}</Text>
             </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default MyResaleListing;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: COLORS.background,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textDark },
  headerSubtitle: { fontSize: 14, color: COLORS.textLight, marginTop: 2 },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textLight },
  activeTabText: { color: '#fff', fontWeight: 'bold' },

  listContent: { paddingBottom: 100 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* CARD DESIGN */
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },

  imageContainer: { position: 'relative' },
  productImg: { width: '100%', height: 200 }, // Taller image for products
  
  priceTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },

  detailsContainer: { padding: 16 },

  titleText: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 },

  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  categoryText: { fontSize: 13, color: COLORS.textLight, marginLeft: 6 },

  descText: { fontSize: 13, color: '#666', lineHeight: 18 },

  separator: { height: 1, backgroundColor: '#eee', marginVertical: 14 },

  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FFF0F0',
  },
  deleteText: { color: COLORS.danger, fontWeight: '600', marginLeft: 6, fontSize: 13 },

  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  soldBadge: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 10, color: '#999', fontSize: 16 },
});