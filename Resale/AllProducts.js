import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Modal,
  ScrollView,
  RefreshControl // Added for swipe-to-refresh
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 45) / 2;

// Top Service Data
const services = [
  { name: 'Shop', image: require('../assets/shop.png'), screen: "HomeScreen" },
  { name: 'RentalVehicle', image: require('../assets/rental.png'), screen: "HomeVechile" },
  { name: 'RentalMaterial', image: require('../assets/rental-meterial.png'), screen: "MeterialHome" },
  { name: 'Real Estate', image: require('../assets/real-estate.png'), screen: "RealEstateHome" },
  { name: 'Diary', image: require('../assets/diary.png'), screen: "DairyList" },
  { name: 'Resale', image: require('../assets/resale.png'), screen: "Resale" },
  { name: 'Coupon', image: require('../assets/coupons.png'), screen: "CouponsHome" },
  { name: 'Insurance', image: require('../assets/insurence.png'), screen: null },
  { name: 'Others', image: require('../assets/cement.webp'), screen: null },
];

export default function AllProductsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const { categoryId: initialCatId, categoryName: initialCatName } = route.params || {};

  // --- State ---
  const [products, setProducts] = useState([]);
  const [displayProducts, setDisplayProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Added for swipe-to-refresh
  const [location, setLocation] = useState(null);

  const [activeCategoryId, setActiveCategoryId] = useState(initialCatId || null);
  const [activeCategoryName, setActiveCategoryName] = useState(initialCatName || 'All Products');
  const [sortOption, setSortOption] = useState('newest');
  
  const [isSortVisible, setSortVisible] = useState(false);
  const [isFilterVisible, setFilterVisible] = useState(false);

  // --- 1. Initial Load ---
  useEffect(() => {
    requestLocationPermission();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchData();
  }, [location, activeCategoryId]);

  useEffect(() => {
    applySort(products);
  }, [sortOption, products]);

  // --- 2. Pull-to-Refresh Logic ---
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories();
    fetchData();
  }, [location, activeCategoryId]);

  // --- 3. Location Logic ---
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) getUserLocation();
        else fetchData();
      } catch (err) { fetchData(); }
    } else {
      getUserLocation();
    }
  };

  const getUserLocation = () => {
    Geolocation.getCurrentPosition(
      (info) => {
        setLocation({ latitude: info.coords.latitude, longitude: info.coords.longitude });
      },
      () => fetchData(),
      { enableHighAccuracy: false, timeout: 15000 }
    );
  };

  // --- 4. API Logic ---
  const fetchCategories = async () => {
    try {
      const response = await fetch('https://masonshop.in/api/resale_categoryapi');
      const json = await response.json();
      if (json.status && json.data) setCategories(json.data);
    } catch (error) { console.error('Cat Error:', error); }
  };

  const fetchData = async () => {
    if (!refreshing) setLoading(true);
    let url = activeCategoryId 
      ? `https://masonshop.in/api/resaleProductsByCategory?category_id=${activeCategoryId}`
      : `https://masonshop.in/api/get_resale_products`;

    const hasParams = url.includes('?');
    if (location) {
      url += `${hasParams ? '&' : '?'}latitude=${location.latitude}&longitude=${location.longitude}`;
    }

    try {
      const response = await fetch(url);
      const json = await response.json();
      if (json.status && json.data) {
        setProducts(json.data);
      } else {
        setProducts([]);
        setDisplayProducts([]);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- 5. Sorting & Helpers ---
  const applySort = (data) => {
    let sorted = [...data];
    if (sortOption === 'lowToHigh') sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    else if (sortOption === 'highToLow') sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    else sorted.sort((a, b) => b.id - a.id);
    setDisplayProducts(sorted);
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; 
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const getImageUrl = (imgStr) => {
    if (!imgStr) return 'https://via.placeholder.com/400x200';
    return imgStr.startsWith('http') ? imgStr : `https://masonshop.in/public/${imgStr}`;
  };

  // --- 6. Render ---
  const renderProduct = ({ item }) => {
    const distance = location 
      ? getDistance(location.latitude, location.longitude, item.latitude, item.longitude) 
      : null;

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.9} 
        onPress={() => navigation.navigate('ResaleDetails', { product: item })}
      >
        <Image source={{ uri: getImageUrl(item.multiple_image[0]) }} style={styles.cardImg} resizeMode="cover" />
        <View style={styles.cardContent}>
          <Text numberOfLines={1} style={styles.itemTitle}>{item.project_name}</Text>
          <Text style={styles.itemPrice}>₹{item.price}</Text>
          <View style={styles.ratingRow}>
            <MaterialIcons name="place" size={12} color="#888" />
            <Text style={styles.ratingText} numberOfLines={1}>
              {distance ? `${distance} km away` : (item.city || 'Nearby')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. TOP SERVICES SCROLLBAR */}
      

      {/* 2. HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activeCategoryName}</Text>
        <TouchableOpacity>
          <MaterialIcons name="search" size={26} color="#000" />
        </TouchableOpacity>
      </View>

      {/* 3. FILTER & SORT BAR */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setSortVisible(true)}>
          <MaterialIcons name="sort" size={20} color="#000" />
          <Text style={styles.filterBtnText}>Sort</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterVisible(true)}>
          <MaterialIcons name="filter-list" size={20} color="#000" />
          <Text style={styles.filterBtnText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* 4. PRODUCTS LIST with Pull-to-Refresh */}
      {loading && !refreshing ? (
        <View style={styles.centerLoading}><ActivityIndicator size="large" color="#4A144B" /></View>
      ) : (
        <FlatList
          data={displayProducts}
          renderItem={renderProduct}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A144B']} tintColor="#4A144B" />
          }
          ListEmptyComponent={
            <View style={styles.centerLoading}><Text style={{color:'#888', marginTop: 50}}>No products found.</Text></View>
          }
        />
      )}

      {/* SORT MODAL */}
      <Modal visible={isSortVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setSortVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort By</Text>
            {['newest', 'lowToHigh', 'highToLow'].map((opt) => (
              <TouchableOpacity key={opt} style={styles.modalOption} onPress={() => {setSortOption(opt); setSortVisible(false);}}>
                <Text style={[styles.optionText, sortOption === opt && styles.activeOptionText]}>
                  {opt === 'newest' ? 'Newest' : opt === 'lowToHigh' ? 'Price: Low to High' : 'Price: High to Low'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FILTER MODAL */}
      <Modal visible={isFilterVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setFilterVisible(false)}>
          <View style={[styles.modalContent, { height: '60%' }]}>
            <Text style={styles.modalTitle}>Categories</Text>
            <ScrollView>
              {categories.map((cat) => (
                <TouchableOpacity key={cat.id} style={styles.modalOption} onPress={() => {setActiveCategoryId(cat.id); setActiveCategoryName(cat.name); setFilterVisible(false);}}>
                  <Text style={[styles.optionText, activeCategoryId === cat.id && styles.activeOptionText]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Resale')}>
          <MaterialIcons name="home-filled" size={28} color="#4A144B" />
          <Text style={[styles.navText, { color: '#4A144B' }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Explore')}>
           <MaterialIcons name="grid-view" size={28} color="#999" />
           <Text style={styles.navText}>Catg</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sellButton} onPress={() => navigation.navigate('PostItems')}>
          <MaterialIcons name="add" size={32} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}  onPress={() => navigation.navigate('ChatList')}>
           <MaterialIcons name="chat-bubble-outline" size={26} color="#999" />
           <Text style={styles.navText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('UserResale')}>
           <MaterialIcons name="person-outline" size={28} color="#999" />
           <Text style={styles.navText}>My Items</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF',paddingVertical:40 },
  // Top Bar
  topBarContainer: { backgroundColor: '#FFF', paddingVertical: 10 },
  topServiceList: { paddingLeft: 15 },
  topServiceItem: { alignItems: 'center', marginRight: 18, width: 65 },
  topServiceIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  activeService: { borderWidth: 2, borderColor: '#4A144B', backgroundColor: '#F9EFFF' },
  topServiceImg: { width: 30, height: 30, resizeMode: 'contain' },
  topServiceText: { fontSize: 10, fontWeight: '600', color: '#444' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderColor: '#F5F5F5' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  filterBar: { flexDirection: 'row', height: 50, borderBottomWidth: 1, borderColor: '#F5F5F5', alignItems: 'center' },
  filterBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  filterBtnText: { marginLeft: 8, fontWeight: '600', color: '#000' },
  divider: { width: 1, height: '60%', backgroundColor: '#EEE' },
  listContainer: { padding: 15, paddingBottom: 100 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { width: CARD_WIDTH, backgroundColor: '#FFF', borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden' },
  cardImg: { width: '100%', height: 150, backgroundColor: '#F9F9F9' },
  cardContent: { padding: 10 },
  itemTitle: { fontSize: 13, color: '#444', fontWeight: '500' },
  itemPrice: { fontSize: 15, fontWeight: 'bold', color: '#000', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  ratingText: { fontSize: 11, color: '#888', marginLeft: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  modalOption: { paddingVertical: 15, borderBottomWidth: 1, borderColor: '#EEE' },
  optionText: { fontSize: 16, color: '#333' },
  activeOptionText: { color: '#4A144B', fontWeight: 'bold' },
  bottomNav: { flexDirection: 'row', height: 70, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#EEE', justifyContent: 'space-around', alignItems: 'center', position: 'absolute', bottom: 0, width: '100%', paddingBottom: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navText: { fontSize: 10, marginTop: 2, color: '#999' },
  sellButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#4A144B', justifyContent: 'center', alignItems: 'center', marginBottom: 25, elevation: 5, borderWidth: 3, borderColor: '#FFF' }
});