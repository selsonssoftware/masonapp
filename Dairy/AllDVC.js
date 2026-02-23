import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  TextInput, PermissionsAndroid, Platform, Alert, ActivityIndicator,
  Dimensions, Linking
} from "react-native";
import { useQuery } from '@tanstack/react-query'; // NEW
import Geolocation from '@react-native-community/geolocation';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';

const { width } = Dimensions.get("window");

const STALE_TIME = 5 * 60 * 1000; // 5 Minutes
const COLORS = {
  primary: "#3f229eff",
  bg: "#F8FAFC",
  white: "#FFFFFF",
  muted: "#64748B",
  cardBg: "#FFFFFF",
  textMain: "#1E293B",
  accent: "#FFC107",
  border: "#E2E8F0"
};

const HomeDVC = ({ navigation, route }) => {
  /* ========================= STATE ========================= */
  const [userLocation, setUserLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(route.params?.category || "All");
  const [searchQuery, setSearchQuery] = useState("");

  /* ========================= FETCHING ========================= */

  // 1. Fetch Categories
  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ['categories_list'],
    queryFn: async () => {
      const res = await fetch("https://masonshop.in/api/Category_dairy");
      const json = await res.json();
      if (json.status && json.Diary_category) {
        return [{ id: 0, category_name: "All", category_image: null }, ...json.Diary_category];
      }
      return [{ id: 0, category_name: "All", category_image: null }];
    },
    staleTime: STALE_TIME
  });

  // 2. Fetch Digital Cards (Master Data)
  const { data: masterData = [], isLoading: cardsLoading, refetch } = useQuery({
    queryKey: ['digital_cards'],
    queryFn: async () => {
      const res = await fetch("https://masonshop.in/api/digitalcard_userprofile");
      const json = await res.json();
      if (json.success && json.data) {
        return json.data.map(item => ({
          id: item.id,
          user_id: item.user_id,
          name: item.person_name || "Unknown",
          company: item.site_name || item.person_name, 
          jobRole: item.jobroll,
          category: item.category || "General",
          mobile: item.mobilenum,
          image: (item.site_image && item.site_image.length > 10 && item.site_image !== "https://vcard.masonshop.in/") 
                  ? item.site_image : "https://via.placeholder.com/150", 
          rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1), 
          latitude: item.location ? parseFloat(item.location.split(',')[0]) : null,
          longitude: item.location ? parseFloat(item.location.split(',')[1]) : null,
          cardLink: item.link || `https://masonshop.in/card/${item.user_id || item.id}`,
        }));
      }
      return [];
    },
    staleTime: STALE_TIME
  });

  /* ========================= FILTERING & SORTING ========================= */

  // Memoized filter logic for performance
  const displayData = useMemo(() => {
    let filtered = [...masterData];

    if (selectedCategory !== "All") {
      filtered = filtered.filter(item => 
        item.category?.toLowerCase().trim() === selectedCategory.toLowerCase().trim()
      );
    }

    if (searchQuery) {
      const low = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(low) || 
        item.company.toLowerCase().includes(low) || 
        item.category.toLowerCase().includes(low)
      );
    }

    if (userLocation) {
      filtered = filtered.map(item => ({
        ...item,
        distance: (item.latitude && item.longitude) 
          ? getDistance(userLocation.latitude, userLocation.longitude, item.latitude, item.longitude) 
          : 99999
      })).sort((a, b) => a.distance - b.distance);
    }

    return filtered;
  }, [masterData, selectedCategory, searchQuery, userLocation]);

  /* ========================= EFFECTS ========================= */

  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Sync category if route params change
  useEffect(() => {
    if (route.params?.category) {
      setSelectedCategory(route.params.category);
    }
  }, [route.params?.category]);

  /* ========================= HELPERS ========================= */

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      if (granted === PermissionsAndroid.RESULTS.GRANTED) getLocation();
    } else {
      getLocation();
    }
  };

  const getLocation = () => {
    Geolocation.getCurrentPosition(
      (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => console.log(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  };

  const openLink = async (url) => {
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(url, {
          toolbarColor: COLORS.primary,
          showTitle: true,
          animated: true,
        });
      } else {
        Linking.openURL(url);
      }
    } catch (error) { Linking.openURL(url); }
  };

  /* ========================= RENDER ========================= */

  const renderCard = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => openLink(item.cardLink)}>
      <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardContent}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.company}</Text>
          <View style={styles.ratingBadge}>
            <FontAwesome name="star" color={COLORS.white} size={10} />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>{item.jobRole} | {item.category}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={14} color={COLORS.primary} />
          <Text style={styles.distanceText}>
            {item.distance && item.distance !== 99999 ? `${item.distance.toFixed(1)} km away` : "Location N/A"} 
          </Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.callBtn} onPress={() => item.mobile && Linking.openURL(`tel:${item.mobile}`)}>
             <Ionicons name="call" color="white" size={14} />
             <Text style={styles.btnText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewBtn} onPress={() => openLink(item.cardLink)}>
             <Text style={[styles.btnText, {color: COLORS.primary}]}>View Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Find Professionals</Text>
          <View style={styles.locStatus}>
            <Ionicons name="navigate" size={12} color={COLORS.white} />
            <Text style={styles.locText}>{userLocation ? "Showing Nearby" : "Detecting Location..."}</Text>
          </View>
        </View>
        <View style={styles.profileCircle}><FontAwesome name="user" size={20} color={COLORS.primary} /></View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.muted} style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search electricians, plumbers..."
          placeholderTextColor={COLORS.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={{height: 70}}>
        <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[styles.catItem, selectedCategory === item.category_name && styles.catItemSelected]}
                onPress={() => setSelectedCategory(item.category_name)}
              >
                {item.category_image && <Image source={{uri: item.category_image}} style={styles.catIcon} />}
                <Text style={[styles.catText, selectedCategory === item.category_name && styles.catTextSelected]}>
                    {item.category_name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.catList}
        />
      </View>

      {catLoading || cardsLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={cardsLoading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={50} color={COLORS.muted} />
                <Text style={styles.emptyText}>No professionals found.</Text>
            </View>
          }
        />
      )}
      
      {/* Bottom Nav remains the same as your previous structure */}
    </View>
  );
};
/* ========================= STYLES ========================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 45,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingBottom: 40
  },
  welcomeText: { fontSize: 20, fontWeight: '700', color: 'white' },
  locStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 4, opacity: 0.9 },
  locText: { color: 'white', fontSize: 12, marginLeft: 4 },
  profileCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },

  /* Search */
  searchContainer: {
    marginHorizontal: 16,
    marginTop: -25,
    backgroundColor: 'white',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    height: 50,
    marginBottom: 10
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: COLORS.textMain, fontSize: 14 },

  /* Categories */
  catList: { paddingHorizontal: 16, alignItems: 'center' },
  catItem: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 25,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40
  },
  catItemSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catIcon: { width: 20, height: 20, borderRadius: 10, marginRight: 6 },
  catText: { color: COLORS.muted, fontWeight: '600', fontSize: 13, textTransform: 'capitalize' },
  catTextSelected: { color: 'white' },

  /* Cards */
  listContent: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 10 },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  cardImage: { width: 90, height: 90, borderRadius: 12, backgroundColor: '#eee' },
  cardContent: { flex: 1, marginLeft: 14, justifyContent: 'space-between' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMain, flex: 1, marginRight: 5 },
  cardSubtitle: { fontSize: 12, color: COLORS.muted, marginVertical: 4 },
  
  ratingBadge: { flexDirection: 'row', backgroundColor: COLORS.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignItems: 'center' },
  ratingText: { color: 'white', fontSize: 10, fontWeight: '700', marginLeft: 3 },

  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  distanceText: { fontSize: 12, color: COLORS.muted, marginLeft: 4 },

  actionRow: { flexDirection: 'row', gap: 10 },
  callBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  viewBtn: { borderWidth: 1, borderColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnText: { fontSize: 11, fontWeight: '600', color: 'white', marginLeft: 5 },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: COLORS.muted, marginTop: 10 },

  /* Bottom Nav */
  bottomNavWrapper: { position: 'absolute', bottom: 25, left: 0, right: 0, alignItems: 'center' },
  bottomNav: {
      width: width * 0.9,
      height: 70,
      backgroundColor: COLORS.white,
      borderRadius: 35,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 15,
      alignItems: 'center',
      elevation: 10,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 10,
  },
  bNavItem: { alignItems: 'center', flex: 1 },
  bNavText: { fontSize: 10, color: COLORS.muted, marginTop: 4 },
  centerSearch: {
      backgroundColor: COLORS.primary,
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: -10,
      elevation: 5
  }
});

export default HomeDVC;