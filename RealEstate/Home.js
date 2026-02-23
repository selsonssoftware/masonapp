import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';

 import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const NEARBY_RADIUS_KM = 10;

/* ---------------- DISTANCE CALC ---------------- */
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

/* ---------------- DATA ---------------- */
const TOP_MENU = [
  { id: 1, name: 'Shop', icon: 'store', screen: 'HomeScreen' },
  { id: 2, name: 'Vehicle', icon: 'car', screen: 'HomeVehicle' },
  { id: 3, name: 'Material', icon: 'truck-delivery', screen: 'MeterialHome' },
  { id: 4, name: 'Diary', icon: 'notebook', screen: 'DairyList' },
  { id: 5, name: 'Real Estate', icon: 'map-marker-radius', screen: 'RealEstateHome', active: true },
];

const SLIDER_IMAGES = [
  { id: 1, src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800' },
  { id: 2, src: 'https://images.unsplash.com/photo-1600596542815-27bfefd0c3c5?w=800' },
  { id: 3, src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800' },
];

/* ---------------- HEADER ---------------- */
const Header = ({ onProfilePress }) => (
  <LinearGradient colors={['#2980B9', '#6DD5FA']} style={styles.header}>
    <View style={styles.headerRow}>
      <View>
        <Text style={styles.headerTitle}>Home</Text>
        <Text style={styles.headerSub}>Find properties near you</Text>
      </View>

      <TouchableOpacity style={styles.profileIcon} onPress={onProfilePress}>
        <Icon name="account-outline" size={22} color="#2980B9" />
      </TouchableOpacity>
    </View>

    <View style={styles.searchBar}>
      <Icon name="magnify" size={20} color="#999" />
      <TextInput
        placeholder='Search "Properties"'
        placeholderTextColor="#999"
        style={styles.searchInput}
      />
    </View>
  </LinearGradient>
);

/* ---------------- SIDE MENU ---------------- */
const SideMenu = ({ visible, onClose }) => {
  const navigation = useNavigation();

  return (
  <Modal visible={visible} transparent animationType="slide">
  <TouchableOpacity style={styles.overlay} onPress={onClose} />

  <View style={styles.sideMenu}>
    <Text style={styles.menuTitle}>My Account</Text>

    {/* 🔶 POST PROPERTY CARD */}
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => {
        onClose();
        navigation.navigate('RealVendorCategory');
      }}
    >
      <Icon name="plus-box-outline" size={32} color="#800040" />
      <View style={{ marginLeft: 12 }}>
        <Text style={styles.postTitle}>Post Property</Text>
        <Text style={styles.postSub}>Sell or Rent your property</Text>
      </View>
    </TouchableOpacity>

    {/* MENU ITEMS */}
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => {
        onClose();
        navigation.navigate('UserBookings');
      }}
    >
      <Icon name="calendar-check-outline" size={22} />
      <Text style={styles.menuText}>My Bookings</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => {
        onClose();
        navigation.navigate('MyListing');
      }}
    >
      <Icon name="home-city-outline" size={22} />
      <Text style={styles.menuText}>My Property Listings</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Interested')}>
      <Icon name="home-search-outline" size={22} />
      <Text style={styles.menuText}>My Contacted Properties</Text>
    </TouchableOpacity>


     <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('RealMembership')}>
      <Icon name="home-search-outline" size={22} />
      <Text style={styles.menuText}>My Membership</Text>
    </TouchableOpacity>

    {/* 🔻 LOGOUT FIXED AT BOTTOM */}
    <View style={styles.logoutContainer}>
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => {
          onClose();
          // logout logic
        }}
      >
        <Icon name="logout" size={22} color="red" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

  );
};

/* ---------------- TOP MENU ---------------- */
const TopMenu = () => {
  const navigation = useNavigation();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topMenu}>
      {TOP_MENU.map(item => (
        <TouchableOpacity
          key={item.id}
          style={styles.menuIconWrap}
          onPress={() => navigation.navigate(item.screen)}
        >
          <View style={[styles.menuIcon, item.active && styles.menuIconActive]}>
            <Icon name={item.icon} size={26} color={item.active ? '#fff' : '#E74C3C'} />
          </View>
          <Text style={styles.menuLabel}>{item.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

/* ---------------- SLIDER ---------------- */
const AutoSlider = () => {
  const ref = useRef(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      const next = (index + 1) % SLIDER_IMAGES.length;
      ref.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    }, 3000);
    return () => clearInterval(t);
  }, [index]);

  return (
    <FlatList
      ref={ref}
      data={SLIDER_IMAGES}
      horizontal
      pagingEnabled
      keyExtractor={i => i.id.toString()}
      renderItem={({ item }) => (
        <Image source={{ uri: item.src }} style={styles.sliderImage} />
      )}
    />
  );
};

/* ---------------- POST PROPERTY ---------------- */
const PostPropertyBanner = () => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      style={styles.postCard1}
      onPress={() => navigation.navigate('RealVendorCategory')}
    >
      <Text style={styles.postBadge1}>FOR OWNERS</Text>
      <Text style={styles.postTitle1}>Post Your Property</Text>
      <Text style={styles.postSub1}>Sell or Rent your property for FREE</Text>
      <View style={styles.postBtn1}>
        <Text style={styles.postBtnText}>Get Started</Text>
      </View>
    </TouchableOpacity>
  );
};

/* ---------------- PROPERTY CARD ---------------- */
const ListingCard = ({ item, distance }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.listingCard}>
      <Image
        source={{ uri: item.images?.[0] || 'https://via.placeholder.com/400' }}
        style={styles.listingImage}
      />
      <View style={styles.cardBody}>
        <Text style={styles.price}>Rs.{Number(item.price).toLocaleString('en-IN') || sqftprice}</Text>
        <Text style={styles.title}>{item.project_name}</Text>
        <Text style={styles.location}>{item.area}, {item.city}</Text>
        {distance !== null && (
          <Text style={styles.distance}>📍 {distance.toFixed(1)} KM away</Text>
        )}
        <TouchableOpacity
          style={styles.contactBtn}
          onPress={() =>
            navigation.navigate('ViewDetails', { propertyId: item.property_id })
          }
        >
          <Text style={styles.contactText}>Contact Owner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/* ---------------- BOTTOM NAV ---------------- */
const BottomNav = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
        <Icon name="home-outline" size={24} />
        <Text>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('RealEstateCategory')}>
        <Icon name="grid-large" size={24} />
        <Text>My Property</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.centerBtn} onPress={() => navigation.navigate('RealVendorCategory')}>
        <Icon name="plus" size={30} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('UserBookings')}>
        <Icon name="calendar-month-outline" size={24} />
        <Text>Booking</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyListing')}>
        <Icon name="book-outline" size={24} />
        <Text>My Listing</Text>
      </TouchableOpacity>
    </View>
  );
};

/* ---------------- MAIN APP ---------------- */
export default function App() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    const getLocation = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      }

      Geolocation.getCurrentPosition(
        pos => setUserLocation(pos.coords),
        err => console.log(err),
        { enableHighAccuracy: true }
      );
    };
    getLocation();
  }, []);


useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      // 🔹 1. Get session user_id
      const sessionUserId = await AsyncStorage.getItem('user_id');

      if (!sessionUserId) {
        setProperties([]);
        setLoading(false);
        return;
      }

      // 🔹 2. Fetch all properties
      const res = await fetch('https://masonshop.in/api/realestate_fulluser');
      const json = await res.json();

      // 🔹 3. Filter only same user_id properties
      const filteredProperties = json.success
        ? json.data.filter(
            (item) => item.user_id !== sessionUserId
          )
        : [];

      setProperties(filteredProperties);
    } catch (error) {
      console.error('Property fetch error:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        <Header onProfilePress={() => setMenuVisible(true)} />
        <TopMenu />
        <AutoSlider />
        <PostPropertyBanner />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby Properties</Text>

          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            properties
              .map(item => {
                if (!userLocation || !item.latitude || !item.longtitude) {
                  return { item, distance: null };
                }
                const d = getDistanceKm(
                  userLocation.latitude,
                  userLocation.longitude,
                  item.latitude,
                  item.longtitude
                );
                return d <= NEARBY_RADIUS_KM ? { item, distance: d } : null;
              })
              .filter(Boolean)
              .map(({ item, distance }) => (
                <ListingCard key={item.id} item={item} distance={distance} />
              ))
          )}
        </View>
      </ScrollView>

      <BottomNav />
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },

  header: { padding: 16,paddingVertical:50 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: '#EAF2F8', fontSize: 12 },

  profileIcon: {
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 10,
    flexDirection: 'row',
    padding: 8,
  },
  searchInput: { marginLeft: 8, flex: 1 },

  topMenu: { backgroundColor: '#fff', paddingVertical: 12 },
  menuIconWrap: { alignItems: 'center', marginHorizontal: 12 },
  menuIcon: { backgroundColor: '#FDEDEC', padding: 12, borderRadius: 30 },
  menuIconActive: { backgroundColor: '#E74C3C' },
  menuLabel: { fontSize: 12, marginTop: 4 },

  sliderImage: { width, height: 200 },

  postCard1: { margin: 16, backgroundColor: '#2E86DE', borderRadius: 16, padding: 20 },
  postBadge1: { color: '#FFD700', fontWeight: 'bold' },
  postTitle1: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  postSub1: { color: '#ECF0F1', marginVertical: 6 },
  postBtn1: { backgroundColor: '#fff', padding: 10, borderRadius: 6, marginTop: 10, width: 120 },
  postBtnText: { textAlign: 'center', fontWeight: 'bold', color: '#2E86DE' },

  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },

  listingCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  listingImage: { width: '100%', height: 180 },
  cardBody: { padding: 12 },

  price: { fontSize: 18, fontWeight: 'bold', color: '#27AE60' },
  title: { fontSize: 15, fontWeight: '600' },
  location: { color: '#777', fontSize: 13, marginVertical: 4 },
  distance: { fontSize: 12, color: '#555' },

  contactBtn: { backgroundColor: '#2980B9', padding: 10, borderRadius: 6, marginTop: 10 },
  contactText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  navItem: { alignItems: 'center' },
  centerBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2980B9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -45,
  },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sideMenu: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '70%',
    backgroundColor: '#fff',
    padding: 20,
  },
  menuTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  menuText: { fontSize: 15, marginLeft: 12 },
  overlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
},

sideMenu: {
  position: 'absolute',
  right: 0,
  top: 0,
  bottom: 0,
  width: '80%',
  backgroundColor: '#fff',
  padding: 20,
},

menuTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 15,
},

/* 🔶 POST PROPERTY CARD */
postCard: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FDEEF4',
  padding: 16,
  borderRadius: 14,
  marginBottom: 20,
  elevation: 3,
},

postTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#800040',
},

postSub: {
  fontSize: 12,
  color: '#666',
  marginTop: 2,
},

menuItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 14,
},

menuText: {
  fontSize: 15,
  marginLeft: 12,
},

/* 🔻 LOGOUT AT BOTTOM */
logoutContainer: {
  position: 'absolute',
  bottom: 30,
  left: 20,
  right: 20,
},

logoutBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  borderTopWidth: 1,
  borderColor: '#eee',
  paddingTop: 14,
},

logoutText: {
  marginLeft: 10,
  color: 'red',
  fontWeight: 'bold',
  fontSize: 15,
},

});
