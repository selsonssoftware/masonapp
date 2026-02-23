import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  PermissionsAndroid,
  Platform,
  Keyboard
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from "@react-native-community/geolocation"; 
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: windowWidth } = Dimensions.get('window');

const GOOGLE_API_KEY = "AIzaSyAIYXornd93q38EIYOELtmWwNtRmxoLaTg"; 
const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

const Carousel = ({ data }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  if (!data || data.length === 0) return null;
  return (
    <View style={styles.carouselContainer}>
      <Animated.FlatList
        data={data}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image style={styles.carouselFullImage} source={{ uri: item.image }} resizeMode="cover" />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.slideOverlay}>
              <Text style={styles.slideTitleText}>{item.name}</Text>
            </LinearGradient>
          </View>
        )}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
      />
      <View style={styles.dotsContainer}>
        {data.map((_, i) => {
          const dotWidth = scrollX.interpolate({
            inputRange: [(i - 1) * windowWidth, i * windowWidth, (i + 1) * windowWidth],
            outputRange: [6, 16, 6],
            extrapolate: 'clamp',
          });
          return <Animated.View key={i} style={[styles.dot, { width: dotWidth }]} />;
        })}
      </View>
    </View>
  );
};

export default function HomeScreenVehicle() {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [address, setAddress] = useState('Locating...');
  const [active, setActive] = useState('RentalVehicle');
  const [searchHistory, setSearchHistory] = useState(['JCB', 'Crane', 'Tractor']);

  const { data: userId } = useQuery({
    queryKey: ['session_user_id'],
    queryFn: async () => await AsyncStorage.getItem('user_id'),
  });

  const { data: sliders = [], isLoading: sliderLoading } = useQuery({
    queryKey: ['vehicleSliders'],
    queryFn: async () => {
      const res = await fetch("https://masonshop.in/api/slider_vehicle_api");
      const json = await res.json();
      return json?.slider || [];
    },
  });

  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ['vehicleCategories'],
    queryFn: async () => {
      const res = await fetch("https://masonshop.in/api/vehicle-categories");
      const json = await res.json();
      return json?.data?.filter(c => c.rvc_status === "on") || [];
    },
  });

  const { data: rentalVehicles = [], isLoading: vehicleLoading, refetch } = useQuery({
    queryKey: ['recentRentalVehicles', userId],
    queryFn: async () => {
      try {
        const url = userId 
          ? `https://masonshop.in/api/rental_vehiclelatestProducts?user_id=${userId}`
          : `https://masonshop.in/api/rental_vehiclelatestProducts`;
        const res = await fetch(url);
        const json = await res.json();
        return (json.success || json.status) && Array.isArray(json.data) ? json.data : [];
      } catch (error) {
        return [];
      }
    },
  });

  const filteredVehicles = Array.isArray(rentalVehicles) 
    ? rentalVehicles.filter(v => v?.vehicle_name?.toLowerCase().includes(search?.toLowerCase() || ''))
    : [];

  const handleSearchSubmit = (term) => {
    const finalTerm = term || search;
    if (finalTerm?.trim() && !searchHistory.includes(finalTerm)) {
      setSearchHistory([finalTerm, ...searchHistory].slice(0, 8));
    }
    setSearch(finalTerm);
    setIsSearching(false);
    Keyboard.dismiss();
  };

  useEffect(() => {
    const fetchLocation = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) { setAddress("Permission Denied"); return; }
        } catch (err) { setAddress("Permission Error"); }
      }
      Geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await fetch(`${GOOGLE_GEOCODE_URL}?latlng=${pos.coords.latitude},${pos.coords.longitude}&key=${GOOGLE_API_KEY}`);
          const data = await res.json();
          if (data.results?.[0]) setAddress(data.results[0].formatted_address.split(',').slice(0, 2).join(','));
        } catch (e) { setAddress("Address Error"); }
      }, (err) => setAddress("GPS Off"), { enableHighAccuracy: true, timeout: 20000 });
    };
    fetchLocation();
  }, []);

  const services = [
    { name: 'Shop', image: require('../assets/shop.png'), screen: "HomeScreen" },
    { name: 'RentalVehicle', image: require('../assets/rental.png'), screen: "HomeVechile" },
    { name: 'RentalMaterial', image: require('../assets/rental-meterial.png'), screen: "MeterialHome" },
    { name: 'Real Estate', image: require('../assets/real-estate.png'), screen: "RealEstateHome" },
    { name: 'Diary', image: require('../assets/diary.png'), screen: "DairyList" },
    { name: 'Resale', image: require('../assets/resale.png'), screen: "Resale" },
      { name: 'Coupon', image: require('../assets/coupons.png'), screen: "CouponsHome" },
    { name: 'Insurance', image: require('../assets/insurence.png')  },
    { name: 'Others', image: require('../assets/cement.webp') },
  
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#f8f9ff" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ff922c" />
      
      {isSearching && (
        <View style={styles.searchOverlay}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => setIsSearching(false)}>
              <Icon name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <TextInput
              autoFocus
              placeholder="Search for Brands, Products"
              style={styles.overlayInput}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => handleSearchSubmit()}
            />
          </View>
          <ScrollView keyboardShouldPersistTaps="always">
            {search.length === 0 ? (
              <>
                <Text style={styles.historyTitle}>Recent Searches</Text>
                {searchHistory.map((item, i) => (
                  <TouchableOpacity key={i} style={styles.historyRow} onPress={() => handleSearchSubmit(item)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Icon name="history" size={20} color="#777" />
                      <Text style={styles.historyTextItem}>{item}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              filteredVehicles.map(item => (
                <TouchableOpacity key={item.id} style={styles.suggestionRow} onPress={() => { setIsSearching(false); navigation.navigate("VechileScreen", { vehicleId: item.id }); }}>
                  <Icon name="search" size={20} color="#777" />
                  <Text style={styles.suggestionText}>{item.vehicle_name}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={sliderLoading || vehicleLoading} onRefresh={refetch} />}
      >
        <LinearGradient colors={['#ff922c', '#ffffff']} style={styles.linearGradient}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="location-on" size={18} color="#000" />
                <Text style={styles.pickupText}>Pickup</Text>
              </View>
              <Text style={styles.address} numberOfLines={1}>{address}</Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.imageWrapper} onPress={()=> navigation.navigate('ViewCart')}><Icon name="shopping-cart" size={22} color="#000" /></TouchableOpacity>
              <TouchableOpacity style={styles.imageWrapper} onPress={()=> navigation.navigate('Profile')}><Icon name="account-circle" size={24} color="#000" /></TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity activeOpacity={1} style={styles.inputTrigger} onPress={() => setIsSearching(true)}>
            <Icon name="search" size={20} color="#777" style={{ marginRight: 10 }} />
            <Text style={{ color: '#777' }}>Search for JCB, Crane, etc...</Text>
          </TouchableOpacity>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wrapper}>
            <View style={styles.row}>
              {services.map((item) => (
                <TouchableOpacity key={item.name} style={styles.itemBox} onPress={() => item.screen && navigation.navigate(item.screen)}>
                  <Image source={item.image} style={styles.iconImage} />
                  <Text style={[styles.label, active === item.name && styles.labelActive]}>{item.name}</Text>
                  {active === item.name && <View style={styles.activeLine} />}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </LinearGradient>

        {sliderLoading ? <ActivityIndicator style={{marginTop: 20}} color="#ff922c" /> : <Carousel data={sliders} />}

        {/* CATEGORIES SECTION */}
        <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Shop by Categories</Text>
            <TouchableOpacity onPress={() => navigation.navigate("CategoriesScreen")}>
                <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
        </View>
        
        <View style={styles.categoriesGrid}>
          {catLoading ? (
            <ActivityIndicator color="#ff922c" style={{ margin: 20 }} />
          ) : (
            categories.map((item) => (
              <TouchableOpacity key={item.id} style={styles.catcontainer} onPress={() => navigation.navigate("CategoriesScreen", { categoryId: item.id })}>
                <View style={styles.catIconWrapper}>
                    <Image source={{ uri: item.rvc_image }} style={styles.catimage} />
                </View>
                <Text style={styles.catname} numberOfLines={1}>{item.rvc_name}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* RECENT VEHICLES SECTION - CONDITIONALLY RENDERED */}
        {rentalVehicles?.length > 0 && (
            <>
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Recent Rental Vehicles</Text>
                    <TouchableOpacity onPress={() => navigation.navigate("CategoriesScreen")}>
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 15, paddingBottom: 20 }}>
                    {vehicleLoading ? (
                        <ActivityIndicator style={{marginLeft: 20, marginTop: 10}} color="#ff922c" />
                    ) : (
                        rentalVehicles.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.recentCard} onPress={() => navigation.navigate("VechileScreen", { vehicleId: item.id })}>
                            <Image source={{ uri: item.vehicle_image || 'https://via.placeholder.com/150' }} style={styles.recentImage} />
                            <View style={styles.recentDetails}>
                                <Text style={styles.recentName} numberOfLines={1}>{item.vehicle_name}</Text>
                                <Text style={styles.recentPrice}>₹{item.rentalprice_perday} / Day</Text>
                                <View style={styles.recentSubInfo}>
                                    <Icon name="location-on" size={12} color="#777" />
                                    <Text style={styles.recentCity}>{item.city || 'Location N/A'}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            </>
        )}
        
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNavContainer}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("HomeVechile")}>
          <Ionicons name="home" size={24} color="#ff922c" />
          <Text style={[styles.navBtnText, {color: '#ff922c'}]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("CategoriesScreen")}>
          <Ionicons name="grid-outline" size={24} color="#444" />
          <Text style={styles.navBtnText}>Vehicles</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("BookingScreen")}>
          <Ionicons name="calendar-outline" size={24} color="#444" />
          <Text style={styles.navBtnText}>Booking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', zIndex: 1000 },
  searchHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 60, borderBottomWidth: 1, borderBottomColor: '#eee', marginTop: Platform.OS === 'android' ? 0 : 40 },
  overlayInput: { flex: 1, marginLeft: 15, fontSize: 16 },
  historyTitle: { padding: 15, fontSize: 14, fontWeight: 'bold', color: '#777', backgroundColor: '#f8f8f8' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  historyTextItem: { marginLeft: 15, fontSize: 15 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  suggestionText: { marginLeft: 15, fontSize: 15 },
  linearGradient: { paddingBottom: 15, paddingTop: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginTop: 45 },
  pickupText: { fontSize: 18, fontWeight: "700", marginLeft: 2 },
  address: { fontSize: 13, marginTop: 2, fontWeight: "600", color: "#444" },
  headerIcons: { flexDirection: "row" },
  imageWrapper: { backgroundColor: "#fff", marginLeft: 10, padding: 8, borderRadius: 12, elevation: 3 },
  inputTrigger: { height: 45, marginHorizontal: 20, marginTop: 15, borderRadius: 12, paddingHorizontal: 15, backgroundColor: "#fff", elevation: 2, flexDirection: 'row', alignItems: 'center' },
  wrapper: { marginTop: 15 },
  row: { flexDirection: "row", paddingHorizontal: 10 },
  itemBox: { width: 90, alignItems: "center", marginHorizontal: 5 },
  iconImage: { width: 42, height: 42 },
  label: { fontSize: 11, marginTop: 5, color: "#555" },
  labelActive: { color: "#ff7a28", fontWeight: "700" },
  activeLine: { width: 35, height: 3, backgroundColor: "#ff7a28", borderRadius: 5, marginTop: 3 },
  carouselContainer: { marginTop: 5 },
  slide: { width: windowWidth - 0, height: 160, borderRadius: 0, marginHorizontal: 0, overflow: 'hidden', backgroundColor: '#eee' },
  carouselFullImage: { width: '100%', height: '100%' },
  slideOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, justifyContent: 'flex-end', padding: 15 },
  slideTitleText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  dotsContainer: { flexDirection: "row", justifyContent: "center", marginTop: 10 },
  dot: { height: 6, borderRadius: 3, backgroundColor: "#ff7a28", marginHorizontal: 3 },
  
  // Section Header Alignment
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 25 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: '#222' },
  viewAllText: { fontSize: 12, color: '#ff922c', fontWeight: '600' },

  // Updated Categories Grid
  categoriesGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 10, marginTop: 0 },
  catcontainer: { 
    width: (windowWidth - 40) / 4, // Perfect 4 items per row alignment
    marginVertical: 10, 
    alignItems: 'center' 
  },
  catIconWrapper: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginBottom: 8
  },
  catimage: { width: 32, height: 32 },
  catname: { fontSize: 10, textAlign: "center", fontWeight: "600", color: '#444' },

  // Recent Cards
  recentCard: { width: 170, backgroundColor: "#fff", marginRight: 15, borderRadius: 15, overflow: 'hidden', elevation: 4, marginTop: 10, marginBottom: 10 },
  recentImage: { width: "100%", height: 100 },
  recentDetails: { padding: 10 },
  recentName: { fontSize: 14, fontWeight: "800", color: '#333' },
  recentPrice: { fontSize: 13, color: "#ff6b2f", fontWeight: "700", marginTop: 2 },
  recentSubInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  recentCity: { fontSize: 11, color: "#777", marginLeft: 2 },
  
  bottomNavContainer: { position: "absolute", bottom: 20, left: 20, right: 20, height: 70, backgroundColor: "#fff", borderRadius: 35, flexDirection: "row", justifyContent: "space-around", alignItems: "center", elevation: 10 },
  navBtn: { alignItems: "center" },
  navBtnText: { marginTop: 4, fontSize: 11, color: "#444" },
});