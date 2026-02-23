import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, Image, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Dimensions, FlatList, ActivityIndicator, Keyboard, Platform, Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

const queryClient = new QueryClient();
const { width, height } = Dimensions.get('window');

// --- Storage Keys ---
const CART_STORAGE_KEY = 'materialcart';
const WISHLIST_STORAGE_KEY = 'material_wishlist';
const SEARCH_HISTORY_KEY = 'search_history';

// --- Static Navigation Items ---
const NAV_ITEMS = [
  { name: 'Shop', image: require('../assets/shop.png'), screen: "HomeScreen" },
  { name: 'RentalVehicle', image: require('../assets/rental.png'), screen: "HomeVechile" },
  { name: 'RentalMaterial', image: require('../assets/rental-meterial.png'), screen: "MeterialHome" },
  { name: 'Real Estate', image: require('../assets/real-estate.png'), screen: "RealEstateHome" },
  { name: 'Diary', image: require('../assets/diary.png'), screen: "DairyList" },
  { name: 'Resale', image: require('../assets/resale.png'), screen: "Resale" },
  { name: 'Insurance', image: require('../assets/insurence.png'), screen: "MeterialHome" },
  { name: 'Others', image: require('../assets/cement.webp')  },
  { name: 'Coupon', image: require('../assets/coupons.png'), screen: "CouponsHome" },
];

// --- API Fetchers ---
const fetchCategories = async () => {
  const res = await fetch("https://masonshop.in/api/rental-material-categories");
  const json = await res.json();
  return json?.status ? json.Rental_Material_categories : [];
};

const fetchProducts = async () => {
  const res = await fetch("https://masonshop.in/api/rent_mat_product_api");
  const json = await res.json();
  return json?.status ? json.Rental_Material_products : [];
};

const fetchSlider = async () => {
  const res = await fetch("https://masonshop.in/api/sliderrentalmaterial");
  const json = await res.json();
  return json?.status ? json.slider : [];
};

// --- Local Storage Fetchers ---
const fetchLocalCart = async () => {
  const saved = await AsyncStorage.getItem(CART_STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

const fetchLocalWishlist = async () => {
  const saved = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

// --- Sub-Component: Dynamic Auto Image Slider ---
const AutoImageSlider = ({ sliderData, isLoading }) => {
  const flatListRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!sliderData || sliderData.length === 0) return;
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % sliderData.length;
      setActiveIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 4000);
    return () => clearInterval(interval);
  }, [activeIndex, sliderData]);

  if (isLoading) return <ActivityIndicator style={{ height: 160 }} color="#4a90e2" />;

  return (
    <View style={styles.sliderContainer}>
      <FlatList
        ref={flatListRef}
        data={sliderData}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={({ item }) => (
          <Image source={{ uri: item.image }} style={styles.bannerImage} />
        )}
      />
    </View>
  );
};

// --- Main Screen ---
const MainScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [history, setHistory] = useState([]);

  // 1. Badge Queries
  const { data: cartItems = [] } = useQuery({ queryKey: ['localCart'], queryFn: fetchLocalCart, refetchInterval: 1000 });
  const { data: wishlistItems = [] } = useQuery({ queryKey: ['localWishlist'], queryFn: fetchLocalWishlist, refetchInterval: 1000 });

  // 2. Data Queries
  const { data: categories = [], isLoading: catLoading } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const { data: allProducts = [], isLoading: prodLoading } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  const { data: sliderData = [], isLoading: sliderLoading } = useQuery({ queryKey: ['slider'], queryFn: fetchSlider });

  useEffect(() => { loadSearchHistory(); }, []);

  const loadSearchHistory = async () => {
    const saved = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    if (saved) setHistory(JSON.parse(saved));
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.length > 0 || history.length > 0) setShowResults(true);
    else setShowResults(false);
  };

  const onSelectMaterial = async (item) => {
    // Update Search History
    const newHistory = [item, ...history.filter(h => h.id !== item.id)].slice(0, 8);
    setHistory(newHistory);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));

    setShowResults(false);
    setSearchQuery('');
    Keyboard.dismiss();
    navigation.navigate('MeterialShop', { material_id: item.id });
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  const filteredResults = allProducts.filter(item => 
    item?.rmp_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#8EC5FC" />
      <LinearGradient colors={['#8EC5FC', '#E0C3FC', '#FFFFFF']} style={styles.gradientHeader} />

      {/* HEADER & SEARCH SECTION */}
      <View style={styles.fixedTop}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Home</Text>
            <Text style={styles.locationText}>Thiruvallur, Chennai</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.navigate('WhisleList')}>
              <Ionicons name="heart-outline" size={20} color="#000" />
              {wishlistItems.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{wishlistItems.length}</Text></View>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.navigate('CartScreen')}>
              <Ionicons name="cart-outline" size={20} color="#000" />
              {cartItems.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{cartItems.length}</Text></View>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person-outline" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput 
              placeholder='Search "Drilling Machine"' 
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearch}
              onFocus={() => (searchQuery.length > 0 || history.length > 0) && setShowResults(true)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {setSearchQuery(''); if(history.length === 0) setShowResults(false);}}>
                <Ionicons name="close-circle" size={22} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* SEARCH OVERLAY (FLIPKART STYLE) */}
      {showResults && (
        <View style={styles.overlay}>
          <View style={styles.overlayHeader}>
            <Text style={styles.overlayTitle}>{searchQuery === '' ? 'RECENT SEARCHES' : 'MATCHING MATERIALS'}</Text>
            {searchQuery === '' && history.length > 0 && (
              <TouchableOpacity onPress={clearHistory}><Text style={styles.clearText}>Clear All</Text></TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setShowResults(false)}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity>
          </View>
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={searchQuery === '' ? history : filteredResults}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultRow} onPress={() => onSelectMaterial(item)}>
                {searchQuery === '' ? (
                  <Ionicons name="time-outline" size={20} color="#bbb" />
                ) : (
                  <Image source={{ uri: item.rmp_image }} style={styles.searchThumb} />
                )}
                <Text style={styles.resultText} numberOfLines={1}>{item.rmp_name}</Text>
                <Ionicons name="arrow-up-left" size={18} color="#ddd" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptySearch}>No matching materials found</Text>}
          />
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Horizontal Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navRow}>
          {NAV_ITEMS.map((item, i) => (
            <TouchableOpacity key={i} style={styles.navItem} onPress={() => navigation.navigate(item.screen)}>
              <Image source={item.image} style={styles.navIcon} />
              <Text style={styles.navLabel}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <AutoImageSlider sliderData={sliderData} isLoading={sliderLoading} />

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.catGrid}>
            {categories.slice(0, 8).map((cat) => (
              <TouchableOpacity key={cat.id} style={styles.catCard} onPress={() => navigation.navigate('MeterialShop', { cat_id: cat.id })}>
                <View style={styles.catIconBg}><Image source={{ uri: cat.rmc_image }} style={styles.catImage} /></View>
                <Text style={styles.catLabel} numberOfLines={1}>{cat.rmc_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Materials List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available for Rent</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={allProducts}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.prodCard}>
                <Image source={{ uri: item.rmp_image }} style={styles.prodImage} />
                <Text style={styles.prodName} numberOfLines={1}>{item.rmp_name}</Text>
                <Text style={styles.prodPrice}>₹{item.rmp_price_day} / Day</Text>
                <TouchableOpacity style={styles.rentBtn} onPress={() => navigation.navigate('MeterialShop', { material_id: item.id })}>
                  <Text style={styles.rentBtnText}>RENT</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </ScrollView>

      {/* BOTTOM NAV BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bItem}><Ionicons name="home" size={22} color="#4a90e2" /><Text style={styles.bTextActive}>Home</Text></TouchableOpacity>
        <TouchableOpacity style={styles.bItem} onPress={() => navigation.navigate("MeterialShop")}><Ionicons name="grid-outline" size={22} color="#555" /><Text style={styles.bText}>Material</Text></TouchableOpacity>
        <TouchableOpacity style={styles.bItem} onPress={() => navigation.navigate("MyBooking")}><Ionicons name="calendar-outline" size={22} color="#555" /><Text style={styles.bText}>Booking</Text></TouchableOpacity>
        <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.navigate('CartScreen')}>
              <Ionicons name="cart-outline" size={20} color="#000" />
              {cartItems.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{cartItems.length}</Text></View>}
            </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' ,paddingVertical:30},
  gradientHeader: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  fixedTop: { paddingHorizontal: 20, paddingTop: 10, zIndex: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  locationText: { fontSize: 11, color: '#666' },
  headerIcons: { flexDirection: 'row' },
  iconCircle: { width: 38, height: 38, backgroundColor: '#fff', borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginLeft: 10, elevation: 4 },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: 'red', borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  searchBarContainer: { marginBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, height: 45, paddingHorizontal: 12, elevation: 3 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#fff', zIndex: 1000, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 40 : 20 },
  overlayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  overlayTitle: { fontSize: 12, fontWeight: 'bold', color: '#888' },
  clearText: { color: '#4a90e2', fontSize: 12, fontWeight: 'bold' },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  searchThumb: { width: 35, height: 35, borderRadius: 5, backgroundColor: '#f9f9f9' },
  resultText: { marginLeft: 15, fontSize: 15, color: '#333' },
  emptySearch: { textAlign: 'center', marginTop: 50, color: '#999' },
  navRow: { marginVertical: 15, paddingLeft: 10 },
  navItem: { alignItems: 'center', width: 80 },
  navIcon: { width: 40, height: 40 },
  navLabel: { fontSize: 10, marginTop: 4 },
  sliderContainer: { marginHorizontal: 0, height: 160, borderRadius: 0, overflow: 'hidden', elevation: 5 },
  bannerImage: { width: width - 40, height: 160 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 15 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
  catCard: { width: (width - 20) / 4, alignItems: 'center', marginBottom: 15 },
  catIconBg: { width: 55, height: 55, backgroundColor: '#F0F4FF', borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  catImage: { width: 30, height: 30 },
  catLabel: { fontSize: 10, marginTop: 5, textAlign: 'center' },
  prodCard: { width: 160, backgroundColor: '#fff', borderRadius: 12, padding: 10, marginLeft: 20, elevation: 3, marginBottom: 10 },
  prodImage: { width: '100%', height: 100, borderRadius: 10 },
  prodName: { fontSize: 14, fontWeight: 'bold', marginTop: 8 },
  prodPrice: { color: '#4a90e2', fontWeight: 'bold', marginTop: 4 },
  rentBtn: { backgroundColor: '#4a90e2', padding: 8, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  rentBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  bottomBar: { position: 'absolute', bottom: 10, left: 20, right: 20, height: 65, backgroundColor: '#fff', borderRadius: 32, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  bItem: { alignItems: 'center' },
  bTextActive: { fontSize: 10, color: '#4a90e2', marginTop: 2 },
  bText: { fontSize: 10, color: '#555', marginTop: 2 }
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainScreen />
    </QueryClientProvider>
  );
}