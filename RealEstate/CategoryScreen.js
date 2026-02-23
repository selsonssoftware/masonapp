import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useNavigation } from '@react-navigation/native';
 import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const THEME = '#00897B';

// ✅ Ensure these URLs are correct
const API_URL = 'https://masonshop.in/api/realestate_fulluser';
const FILTER_URL = 'https://masonshop.in/api/search_filter';

/* ================= DISTANCE CALCULATION ================= */
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const toRad = v => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const BuyerPropertyScreen = () => {
  const navigation = useNavigation();

  /* ================= STATE ================= */
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= MODALS ================= */
  const [searchModal, setSearchModal] = useState(false);
  const [sortModal, setSortModal] = useState(false);

  /* ================= SEARCH FIELDS ================= */
  const [purpose, setPurpose] = useState('Buy'); 
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bhk, setBhk] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  /* ================= GET USER LOCATION ================= */
  useEffect(() => {
    Geolocation.getCurrentPosition(
      pos => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      err => console.log('Location Error:', err),
      { enableHighAccuracy: true }
    );
  }, []);

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
  loadProperties();
}, []);

const loadProperties = async () => {
  try {
    setLoading(true);

    // ✅ Get logged-in user id
    const sessionUserId = await AsyncStorage.getItem('user_id');

    const res = await fetch(API_URL);
    const json = await res.json();

    // ✅ Ensure data is always an array
    const dataArray = Array.isArray(json.data) ? json.data : [];

    // ✅ Filter published + admin approved + not user's own property
    const filteredData = dataArray.filter(item =>
      item.status === 'published' &&
      item.admin_status === 'on' &&
      item.user_id !== sessionUserId
    );

    setProperties(filteredData);
  } catch (e) {
    console.log('Load error:', e);
    setProperties([]);
  } finally {
    setLoading(false);
  }
};


  /* ================= APPLY SEARCH (FIXED) ================= */
const applySearch = async () => {
  setLoading(true);
  setSearchModal(false);

  try {
    // 1. Manually build the query string (Safer for React Native)
    let queryString = `propertyType=${encodeURIComponent(propertyType)}`;
    
    // Add other filters if they are not empty
    if (purpose) queryString += `&purpose=${encodeURIComponent(purpose)}`;
    if (city) queryString += `&city=${encodeURIComponent(city)}`;
    if (area) queryString += `&area=${encodeURIComponent(area)}`;
    if (bhk) queryString += `&bhk=${encodeURIComponent(bhk)}`;
    if (minPrice) queryString += `&minPrice=${encodeURIComponent(minPrice)}`;
    if (maxPrice) queryString += `&maxPrice=${encodeURIComponent(maxPrice)}`;

    const finalUrl = `${FILTER_URL}?${queryString}`;
    console.log('Fetching URL:', finalUrl);
    
    const res = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // 2. Read as text first to avoid "JSON Parse Error" if server crashes
    const text = await res.text();
    
    try {
      const json = JSON.parse(text);
      if (json.success && Array.isArray(json.data)) {
        setProperties(json.data);
      } else {
        setProperties([]);
        Alert.alert("No Results", "Try a different filter.");
      }
    } catch (parseError) {
      console.log("Invalid JSON response:", text);
      Alert.alert("Server Error", "The server returned an invalid response.");
    }

  } catch (e) {
    console.log('Network Error:', e);
    Alert.alert("Network Error", "Check your internet connection or HTTPS settings.");
  } finally {
    setLoading(false);
  }
};

  /* ================= APPLY SORT ================= */
  const applySort = (type) => {
    let sortedList = [...properties];
    if (type === 'low_high') {
      sortedList.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (type === 'high_low') {
      sortedList.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (type === 'newest') {
      sortedList.sort((a, b) => b.id - a.id);
    }
    setProperties(sortedList);
    setSortModal(false);
  };

  /* ================= RESET FILTERS ================= */
  const resetFilters = () => {
    // 1. Clear State
    setPurpose('Buy');
    setCity('');
    setArea('');
    setPropertyType('');
    setBhk('');
    setMinPrice('');
    setMaxPrice('');
    
    // 2. Reload Original Data
    loadProperties();
    setSearchModal(false);
  };

  /* ================= COMPONENTS ================= */
  const ImageSlider = ({ images }) => {
    // Parse images if they are a string (sometimes APIs return JSON string)
    let imageList = images;
    if (typeof images === 'string') {
        try {
            imageList = JSON.parse(images);
        } catch (e) {
            imageList = [images]; 
        }
    }

    if (!imageList || imageList.length === 0) {
      return <Image source={require('../assets/ern.png')} style={styles.image} />;
    }
    return (
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {imageList.map((img, i) => (
          <Image key={i} source={{ uri: img }} style={styles.image} />
        ))}
      </ScrollView>
    );
  };

  const renderItem = ({ item }) => {
    const distance = getDistanceKm(userLat, userLng, item.latitude, item.longtitude);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('ViewDetails', { propertyId: item.property_id || item.id })}
      >
        <View style={styles.card}>
          <ImageSlider images={item.images} />
          <View style={styles.cardBody}>
            <Text style={styles.price}>₹ {item.sqftprice ? item.sqftprice : item.price}</Text>
            <Text style={styles.title}>{(item.bhk || '')} {(item.type || '')}</Text>
            <Text style={styles.address}>{(item.area || '')} {(item.city || '')}</Text>
            {distance && <Text style={styles.distance}>📍 {distance.toFixed(1)} km from you</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.logo}>PROPERTY SEARCH</Text>
      </View>

      {/* TOP SEARCH BAR */}
      <TouchableOpacity style={styles.searchBar} onPress={() => setSearchModal(true)}>
        <Text style={{ color: '#999' }}>Search by City, Area, or Type...</Text>
      </TouchableOpacity>

      {/* LIST OR LOADER */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME} />
          <Text style={{ marginTop: 10, color: THEME }}>Fetching Properties...</Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={item => (item.id ? item.id.toString() : Math.random().toString())}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No properties found.</Text>}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => setSortModal(true)}>
          <Text style={styles.bottomBtnText}>⇅ SORT</Text>
        </TouchableOpacity>
        <View style={styles.verticalDivider} />
        <TouchableOpacity style={styles.bottomBtn} onPress={() => setSearchModal(true)}>
          <Text style={styles.bottomBtnText}>⧫ FILTER</Text>
        </TouchableOpacity>
      </View>

      {/* SORT MODAL */}
      <Modal visible={sortModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Sort Properties</Text>
            <TouchableOpacity style={styles.sheetOption} onPress={() => applySort('low_high')}>
              <Text>Price: Low to High</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetOption} onPress={() => applySort('high_low')}>
              <Text>Price: High to Low</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetOption} onPress={() => applySort('newest')}>
              <Text>Newest First</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeSheet} onPress={() => setSortModal(false)}>
              <Text style={{ color: 'red' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FILTER MODAL */}
      <Modal visible={searchModal} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSearchModal(false)}>
              <Text style={{ fontSize: 22 }}>←</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filter Property</Text>
            <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={resetFilters}>
              <Text style={{ color: 'red', fontWeight: 'bold' }}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* PURPOSE SELECTION */}
            <View style={styles.tabRow}>
              {['Buy', 'Rent', 'Sell'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tabBtn, purpose === t && styles.tabActive]}
                  onPress={() => setPurpose(t)}
                >
                  <Text style={[styles.tabText, purpose === t && styles.tabTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>City</Text>
            <TextInput 
                style={styles.textInput} 
                placeholder="Chennai" 
                value={city} 
                onChangeText={setCity} 
            />

            <Text style={styles.label}>Area / Landmark</Text>
            <TextInput 
                style={styles.textInput} 
                placeholder="Anna Nagar" 
                value={area} 
                onChangeText={setArea} 
            />

            <Text style={styles.label}>Property Type</Text>
            <View style={styles.grid}>
              {['Apartment', 'Villa', 'Plots', 'Office', 'Pg'].map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.box, propertyType === p && styles.boxActive]}
                  onPress={() => setPropertyType(p)}
                >
                  <Text style={propertyType === p && { color: THEME }}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>BHK</Text>
            <View style={styles.grid}>
              {['1BHK', '2BHK', '3BHK', '4BHK'].map(b => (
                <TouchableOpacity
                  key={b}
                  style={[styles.box, bhk === b && styles.boxActive]}
                  onPress={() => setBhk(b)}
                >
                  <Text style={bhk === b && { color: THEME }}>{b}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Price Range</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput 
                style={[styles.textInput, { flex: 1 }]} 
                placeholder="Min" 
                keyboardType="numeric" 
                value={minPrice} 
                onChangeText={setMinPrice} 
              />
              <TextInput 
                style={[styles.textInput, { flex: 1 }]} 
                placeholder="Max" 
                keyboardType="numeric" 
                value={maxPrice} 
                onChangeText={setMaxPrice} 
              />
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.searchBtn} onPress={applySearch}>
            <Text style={styles.searchBtnText}>APPLY FILTERS</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  header: { padding: 16, alignItems: 'center', elevation: 2, backgroundColor: '#fff',paddingVertical:60 },
  logo: { fontSize: 18, fontWeight: 'bold', color: THEME },
  searchBar: { margin: 10, padding: 12, borderRadius: 8, backgroundColor: '#fff', elevation: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', backgroundColor: '#fff',
    elevation: 10, borderTopWidth: 1, borderTopColor: '#eee',
    height: 55, alignItems: 'center',
  },
  bottomBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomBtnText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  verticalDivider: { width: 1, height: '60%', backgroundColor: '#ddd' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  sheetOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  closeSheet: { marginTop: 15, alignItems: 'center', padding: 10 },

  card: { backgroundColor: '#fff', marginHorizontal: 10, marginBottom: 15, borderRadius: 10, overflow: 'hidden', elevation: 2 },
  image: { width, height: 220, resizeMode: 'cover' },
  cardBody: { padding: 12 },
  price: { fontSize: 18, color: THEME, fontWeight: 'bold' },
  title: { fontSize: 16, marginTop: 4 },
  address: { color: '#666', marginTop: 4 },
  distance: { color: '#999', marginTop: 4 },

  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  tabRow: { flexDirection: 'row', marginBottom: 16 },
  tabBtn: { flex: 1, padding: 10, borderBottomWidth: 2, borderColor: '#ddd', alignItems: 'center' },
  tabActive: { borderColor: THEME },
  tabText: { color: '#999' },
  tabTextActive: { color: THEME, fontWeight: 'bold' },
  label: { marginTop: 16, fontWeight: 'bold', color: '#333' },
  textInput: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 6, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  box: {
    width: '31%', padding: 10, borderWidth: 1, borderColor: '#ddd',
    borderRadius: 6, margin: '1%', alignItems: 'center',
  },
  boxActive: { borderColor: THEME, backgroundColor: '#E0F2F1' },
  searchBtn: { backgroundColor: THEME, padding: 16, alignItems: 'center' },
  searchBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default BuyerPropertyScreen;