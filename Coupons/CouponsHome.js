import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  Platform,
  ActivityIndicator,
  PermissionsAndroid,
  RefreshControl
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Geolocation from '@react-native-community/geolocation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// --- HELPER: CALCULATE DISTANCE ---
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 99999; 
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; 
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

export default function CouponsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Coupon');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // --- 1. DATA FETCHING (REACT QUERY) ---
  
  const { data: categories = [], isLoading: catLoading, refetch: refetchCats } = useQuery({
    queryKey: ['store_categories'],
    queryFn: async () => {
      const res = await fetch('https://masonshop.in/api/store_category');
      const json = await res.json();
      return json.status ? json.data : [];
    }
  });

  const { data: shops = [], isLoading: shopLoading, refetch: refetchShops } = useQuery({
    queryKey: ['all_stores'],
    queryFn: async () => {
      const res = await fetch('https://masonshop.in/api/getstore');
      const json = await res.json();
      return json.status ? json.data : [];
    }
  });

  // --- 2. LOCATION & REFRESH LOGIC ---

  const onRefresh = async () => {
    setRefreshing(true);
    setSearchQuery(""); // Clear search on refresh
    await Promise.all([refetchCats(), refetchShops()]);
    getUserLocation();
    setRefreshing(false);
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      if (granted === PermissionsAndroid.RESULTS.GRANTED) getUserLocation();
    } else {
      getUserLocation();
    }
  };

  const getUserLocation = () => {
    Geolocation.getCurrentPosition(
      (info) => setUserLocation(info.coords),
      (error) => console.log("Location Error: ", error),
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 1000 }
    );
  };

  // --- 3. SEARCH & MATCHING FILTER ---

  const filteredShops = useMemo(() => {
    let result = [...shops];
    const query = searchQuery.toLowerCase().trim();

    // A. Filter by Search Text (Name, City, or Category)
    if (query) {
      result = result.filter(shop => 
        shop.store_name?.toLowerCase().includes(query) ||
        shop.city?.toLowerCase().includes(query) ||
        shop.category?.toLowerCase().includes(query)
      );
    }

    // B. Filter by Category Tab
    if (selectedCategory) {
      result = result.filter(shop => 
        shop.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // C. Distance Sorting
    if (userLocation) {
      result = result.map(shop => ({
        ...shop,
        distanceInKm: getDistance(
          userLocation.latitude, 
          userLocation.longitude, 
          parseFloat(shop.latitude), 
          parseFloat(shop.longtitude)
        )
      })).sort((a, b) => a.distanceInKm - b.distanceInKm);
    }

    return result;
  }, [shops, searchQuery, selectedCategory, userLocation]);

  const tabs = [
    { id: 1, name: 'RealEstate', icon: 'Home', lib: 'FA5', color: '#f39c12', screen: "RealEstateHome"},
    { id: 2, name: 'Shop', icon: 'store', lib: 'MCI', color: '#27ae60', screen: "HomeScreen" },
    { id: 3, name: 'Vehicle', icon: 'car', lib: 'FA5', color: '#e67e22', screen: "HomeVechile"},
    { id: 4, name: 'Material', icon: 'truck', lib: 'FA5', color: '#c0392b', screen: "MeterialHome"},
    { id: 5, name: 'Resale', icon: 'book', lib: 'FA5', color: '#e84393' },
  ];

  if ((catLoading || shopLoading) && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3f229eff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      
      {/* HEADER WITH SEARCH */}
      <View style={styles.headerContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" style={{ marginRight: 8 }} />
            <TextInput 
                placeholder='Search shop name or city...' 
                placeholderTextColor="#999" 
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
            )}
          </View>
          <Image source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} style={styles.avatar} />
        </View>

        {/* TOP TABS */}
        <View style={styles.navContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navScroll}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.name;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.navItem}
                  onPress={() => {
                    setActiveTab(tab.name);
                    if (tab.screen) navigation.navigate(tab.screen);
                  }}
                >
                  <View style={styles.navIconContainer}>
                    {tab.lib === 'FA5' ? 
                      <FontAwesome5 name={tab.icon} size={18} color={tab.color} /> : 
                      <MaterialCommunityIcons name={tab.icon} size={22} color={tab.color} />
                    }
                  </View>
                  <Text style={[styles.navText, isActive && styles.navTextActive]}>{tab.name}</Text>
                  {isActive && <View style={styles.activeLine} />}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.bodyScroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3f229eff"]} />
        }
      >
        {!searchQuery && (
            <>
                <View style={styles.bannerWrapper}>
                <Image source={{ uri: 'https://img.freepik.com/free-vector/gradient-sale-background_23-2148934477.jpg' }} style={styles.bannerImage} />
                <View style={styles.bannerTextOverlay}>
                    <Text style={styles.bannerBigText}>AMAZING</Text>
                    <Text style={styles.bannerHugeText}>COUPON</Text>
                    <Text style={styles.bannerBigText}>DEALS!</Text>
                </View>
                </View>

                <View style={styles.categorySection}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                    {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.category_name;
                    return (
                        <TouchableOpacity 
                        key={cat.id} 
                        style={[styles.catItem, isSelected && styles.catItemSelected]} 
                        onPress={() => setSelectedCategory(isSelected ? null : cat.category_name)}
                        >
                        <Image source={{ uri: cat.category_image }} style={styles.catImage} resizeMode="cover" />
                        <View style={[styles.catOverlay, isSelected && styles.catOverlaySelected]} />
                        <Text style={styles.catText} numberOfLines={1}>{cat.category_name}</Text>
                        </TouchableOpacity>
                    );
                    })}
                </ScrollView>
                </View>
            </>
        )}

        {/* SHOP LIST SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
             {searchQuery ? `Results for "${searchQuery}"` : "Nearby Shops"}
          </Text>
        </View>

        <View style={styles.listContainer}>
          {filteredShops.length === 0 ? (
            <View style={{alignItems:'center', marginTop: 40}}>
              <Ionicons name="search-outline" size={60} color="#ccc" />
              <Text style={styles.noDataText}>No matching shops found.</Text>
            </View>
          ) : (
            filteredShops.map((shop) => (
              <TouchableOpacity 
                key={shop.id} 
                style={styles.card}
                onPress={() => navigation.navigate('StoreCoupons', { vendorId: shop.user_id })}
              >
                <View style={styles.cardLogoWrapper}>
                  <Image source={{ uri: shop.logo }} style={styles.cardLogo} resizeMode="contain" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.shopTitle}>{shop.store_name}</Text>
                  <Text style={styles.offerText}>{shop.description || 'Limited Time Offer'}</Text>
                  {shop.distanceInKm && (
                    <Text style={styles.distText}>
                      <Ionicons name="navigate" size={12} /> {shop.distanceInKm.toFixed(1)} km away
                    </Text>
                  )}
                  <View style={styles.locationRow}>
                    <Ionicons name="location-sharp" size={14} color="#c0392b" />
                    <Text style={styles.locationText}>{shop.city || 'Local'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{height: 120}} />
      </ScrollView>

      {/* FLOATING ACTION BUTTON */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.fixedButton} onPress={() => navigation.navigate('UserReedemHistory')}>
          <Text style={styles.buttonIcon}>📜</Text>
          <Text style={styles.buttonText}>Redemption History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerContainer: {
    backgroundColor: '#2c3e50',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20 },
  searchBar: { flex: 1, height: 45, backgroundColor: '#fff', borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginRight: 12 },
  searchInput: { flex: 1, color: '#333', fontSize: 14 },
  avatar: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 2, borderColor: '#f1c40f' },
  navContainer: { paddingBottom: 5 },
  navScroll: { paddingHorizontal: 10 },
  navItem: { alignItems: 'center', marginHorizontal: 8, width: 75 },
  navIconContainer: { width: 40, height: 40, backgroundColor: '#fff', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  navText: { fontSize: 11, color: '#bdc3c7', fontWeight: '600' },
  navTextActive: { color: '#fff' },
  activeLine: { marginTop: 6, width: 30, height: 3, backgroundColor: '#f1c40f', borderRadius: 2 },
  bannerWrapper: { marginHorizontal: 16, marginTop: 20, height: 160, borderRadius: 15, overflow: 'hidden' },
  bannerImage: { width: '100%', height: '100%' },
  bannerTextOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  bannerBigText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  bannerHugeText: { color: '#fff', fontSize: 34, fontWeight: '900', fontStyle: 'italic' },
  categorySection: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2c3e50', marginLeft: 16 },
  catScroll: { paddingLeft: 16, marginTop: 10 },
  catItem: { width: 100, height: 100, borderRadius: 12, overflow: 'hidden', marginRight: 12, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: '#eee' },
  catItemSelected: { borderWidth: 2, borderColor: '#e67e22' },
  catImage: { ...StyleSheet.absoluteFillObject },
  catOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  catOverlaySelected: { backgroundColor: 'rgba(230, 126, 34, 0.2)' },
  catText: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginBottom: 8, zIndex: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 20, marginBottom: 15 },
  listContainer: { paddingHorizontal: 16 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 15, padding: 12, marginBottom: 15, elevation: 3 },
  cardLogoWrapper: { width: 80, height: 80, backgroundColor: '#f9f9f9', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardLogo: { width: 60, height: 60 },
  cardContent: { flex: 1 },
  shopTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  offerText: { fontSize: 14, color: '#e67e22', fontWeight: '500', marginBottom: 4 },
  distText: { fontSize: 12, color: '#27ae60', fontWeight: 'bold', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 12, color: '#7f8c8d', marginLeft: 4 },
  noDataText: { textAlign: 'center', color: '#999', marginTop: 10 },
  bottomContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  fixedButton: {
    backgroundColor: '#212121',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 8,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  buttonIcon: { fontSize: 18 },
});