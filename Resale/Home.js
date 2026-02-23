import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  StatusBar,
  RefreshControl // 1. Added RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Geolocation from '@react-native-community/geolocation';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40) / 2;

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

export default function ResaleHomeScreen() {
  const navigation = useNavigation();

  // --- State Variables ---
 
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // 2. State for swipe-to-refresh
  const [location, setLocation] = useState(null);

  // --- 1. Initial Load ---
  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (location) {
      fetchAllData();
    }
  }, [location]);

  // --- 2. Location Logic ---
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getUserLocation();
        } else {
          fetchAllData(); 
        }
      } catch (err) {
        console.warn(err);
        fetchAllData();
      }
    } else {
      getUserLocation();
    }
  };


  const fetchCategories = async () => {
  const response = await fetch('https://masonshop.in/api/resale_categoryapi');
  const json = await response.json();

  if (!json.status) return [];

  return json.data.map(item => ({
    ...item,
    image: item.image?.startsWith('http')
      ? item.image
      : `https://masonshop.in/${item.image}`,
  }));
};

const {
  data: categories = [],
  isLoading: categoryLoading,
  error: categoryError,
} = useQuery({
  queryKey: ['resale-categories'],
  queryFn: fetchCategories,
  staleTime: 1000 * 60,
});


  const getUserLocation = () => {
    Geolocation.getCurrentPosition(
      (info) => {
        setLocation({ latitude: info.coords.latitude, longitude: info.coords.longitude });
      },
      (error) => {
        console.log("Location Error: ", error);
        fetchAllData();
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 1000 }
    );
  };

  // --- 3. Fetch APIs ---
  const fetchAllData = useCallback(async () => {
    // We don't set global loading to true if we are refreshing (to keep the swipe spinner visible instead)
    if (!refreshing) setLoading(true); 
    
    try {
      await Promise.all([fetchSliders(), fetchCategories(), fetchProducts()]);
    } catch (error) {
      console.error("Error loading home data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false); // 3. Stop the refresh spinner
    }
  }, [location, refreshing]);

  // 4. Handle Swipe-to-Refresh action
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllData();
  }, [fetchAllData]);

 

const fetchSliders = async () => {
  const response = await fetch('https://masonshop.in/api/resale_slider');
  const json = await response.json();

  if (!json.status) return [];

  return json.data.map(item => ({
    ...item,
    image: item.image?.startsWith('http')
      ? item.image
      : `https://masonshop.in/${item.image}`,
  }));
};

const {
  data: sliders = [],
  isLoading: sliderLoading,
  error: sliderError,
} = useQuery({
  queryKey: ['resale-sliders'],
  queryFn: fetchSliders,
  staleTime: 1000 * 60, // 1 min cache
});


 

  const fetchProducts = async () => {
    try {
      let url = 'https://masonshop.in/api/get_resale_products';
      if (location) {
        url += `?latitude=${location.latitude}&longitude=${location.longitude}`;
      }
      const response = await fetch(url);
      const json = await response.json();
      if (json.status && json.data) setProducts(json.data);
    } catch (error) { console.error('Product Error:', error); }
  };

  const getImageUrl = (imgStr) => {
    if (!imgStr) return 'https://via.placeholder.com/400x200';
    return imgStr.startsWith('http') ? imgStr : `https://masonshop.in/public/${imgStr}`;
  };

  // --- Rendering UI ---

  if (loading && !products.length && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#4A144B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
     

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color="#888" />
          <TextInput 
            placeholder="Search resale items..." 
            style={styles.searchInput}
            placeholderTextColor="#AAA"
          />
        </View>
        <TouchableOpacity style={styles.headerIcon}>
           <MaterialIcons name="notifications-none" size={28} color="#333" />
        </TouchableOpacity>
      </View>

       {/* TOP SERVICES SCROLLBAR */}
      <View style={styles.topBarContainer}>
        <FlatList
          data={services}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.topServiceItem}
              onPress={() => item.screen && navigation.navigate(item.screen)}
            >
              <View style={[styles.topServiceIcon, item.name === 'Resale' && styles.activeService]}>
                <Image source={item.image} style={styles.topServiceImg} />
              </View>
              <Text style={styles.topServiceText} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.topServiceList}
        />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }}
        // 5. Added RefreshControl here
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#4A144B']} // Android color
            tintColor="#4A144B" // iOS color
          />
        }
      >
        
        {/* SLIDER BANNER */}
        {sliders.length > 0 && (
          <FlatList
            data={sliders}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.sliderContainer}>
                <Image source={{ uri: getImageUrl(item.image) }} style={styles.sliderImage} resizeMode="cover" />
              </View>
            )}
            style={styles.sliderList}
            snapToInterval={width - 20}
            decelerationRate="fast"
          />
        )}

        {/* CATEGORIES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
        </View>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
                style={styles.categoryItem}
                onPress={() => navigation.navigate('AllProducts', { categoryId: item.id, categoryName: item.name })}
            >
              <View style={styles.categoryIconCircle}>
                <Image source={{ uri: item.image }} style={styles.categoryImage} resizeMode="contain" />
              </View>
              <Text style={styles.categoryText} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoryList}
        />

        {/* PRODUCTS GRID */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fresh Recommendations</Text>
          <TouchableOpacity onPress={()=> navigation.navigate('AllProducts')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.gridContainer}>
          {products.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.productCard}
              onPress={() => navigation.navigate('ResaleDetails', { product: item })}
            >
              <Image source={{ uri: getImageUrl(item.multiple_image[0]) }} style={styles.productImg} />
              <View style={styles.productInfo}>
                <Text style={styles.productPrice}>₹{item.price}</Text>
                <Text style={styles.productName} numberOfLines={1}>{item.project_name}</Text>
                <View style={styles.locationRow}>
                  <MaterialIcons name="place" size={12} color="#888" />
                  <Text style={styles.locationText} numberOfLines={1}>{item.city || 'Nearby'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {products.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No products found nearby.</Text>
          </View>
        )}
      </ScrollView>

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
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ChatList')}>
           <MaterialIcons name="chat-bubble-outline" size={26} color="#999" />
           <Text style={styles.navText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('UserResale')}>
           <MaterialIcons name="person-outline" size={28} color="#999" />
           <Text style={styles.navText}>My Items</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA',paddingVertical:40 },
  center: { justifyContent: 'center', alignItems: 'center' },
  topBarContainer: { backgroundColor: '#FFF', paddingTop: 10, paddingBottom: 5 },
  topServiceList: { paddingLeft: 15 },
  topServiceItem: { alignItems: 'center', marginRight: 18, width: 65 },
  topServiceIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  activeService: { borderWidth: 2, borderColor: '#4A144B', backgroundColor: '#F9EFFF' },
  topServiceImg: { width: 30, height: 30, resizeMode: 'contain' },
  topServiceText: { fontSize: 10, fontWeight: '600', color: '#444', textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  searchContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 10, alignItems: 'center', height: 45 },
  searchInput: { flex: 1, marginLeft: 10, color: '#000' },
  headerIcon: { marginLeft: 15 },
  sliderList: { marginTop: 10 },
  sliderContainer: { width: width - 30, height: 160, marginLeft: 15, marginRight: 5, borderRadius: 15, overflow: 'hidden', backgroundColor: '#EEE' },
  sliderImage: { width: '100%', height: '100%' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, marginTop: 20, marginBottom: 10, alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  seeAll: { color: '#4A144B', fontWeight: '600' },
  categoryList: { paddingLeft: 15 },
  categoryItem: { alignItems: 'center', marginRight: 20, width: 70 },
  categoryIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE', marginBottom: 5, overflow: 'hidden' },
  categoryImage: { width: 35, height: 35 },
  categoryText: { fontSize: 12, color: '#555', textAlign: 'center' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between' },
  productCard: { width: COLUMN_WIDTH, backgroundColor: '#FFF', borderRadius: 10, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#EFEFEF', elevation: 2 },
  productImg: { width: '100%', height: 140, backgroundColor: '#F0F0F0' },
  productInfo: { padding: 10 },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  productName: { fontSize: 13, color: '#555', marginVertical: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  locationText: { fontSize: 11, color: '#888', marginLeft: 2 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', fontSize: 16 },
  bottomNav: { flexDirection: 'row', height: 70, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#EEE', justifyContent: 'space-around', alignItems: 'center', position: 'absolute', bottom: 0, width: '100%', paddingBottom: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navText: { fontSize: 10, marginTop: 2, color: '#999' },
  sellButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#4A144B', justifyContent: 'center', alignItems: 'center', marginBottom: 25, elevation: 5, borderWidth: 3, borderColor: '#FFF' }
});