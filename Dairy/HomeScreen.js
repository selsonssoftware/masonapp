import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View, Text, StyleSheet, TextInput, Image, ScrollView,
  TouchableOpacity, SafeAreaView, StatusBar, Dimensions,
  ActivityIndicator, FlatList, Platform, Linking,
  RefreshControl
} from "react-native";
import { useQuery } from '@tanstack/react-query'; 
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from "react-native-linear-gradient"; 
import { InAppBrowser } from 'react-native-inappbrowser-reborn';

const { width } = Dimensions.get("window");

// Constants
const FIVE_MINUTES = 5 * 60 * 1000;
const COLORS = {
  primary: "#3f229eff",
  accent: "#6366F1",
  bg: "#F8FAFC",
  white: "#FFFFFF",
  textMain: "#1F2937",
  textSub: "#6B7280",
  cardBg: "#FFFFFF",
  border: "#E5E7EB",
};

const TOP_NAV = [
  { id: 1, name: "Shop", icon: "🏪", route: "HomeScreen" },
  { id: 2, name: "Vehicle", icon: "🚜", route: "HomeVechile" },
  { id: 3, name: "Material", icon: "🏗️", route: "MeterialHome" },
  { id: 4, name: "Diary", icon: "📔", route: "DairyList" },
  { id: 5, name: "Real Estate", icon: "🏠", route: "RealEstateHome" },
  { id: 6, name: "Resale", icon: "🔄", route: "Resale" },     
  { id: 7, name: "Coupons", icon: "🎟️", route: "CouponsHome" },   
  { id: 8, name: "Insurance", icon: "🛡️", route: "InsuranceScreen" }, 
];

export default function HomeScreen({ navigation }) {
  const sliderRef = useRef(null);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- DATA FETCHING ---

  const { data: categories = [], isLoading: catLoading, refetch: refetchCats } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch("https://masonshop.in/api/Category_dairy");
      const json = await res.json();
      return json.status ? json.Diary_category : [];
    },
    staleTime: FIVE_MINUTES,
  });

  const { data: sliders = [], isLoading: sliderLoading, refetch: refetchSliders } = useQuery({
    queryKey: ['sliders'],
    queryFn: async () => {
      const res = await fetch("https://masonshop.in/api/slider_diary_api");
      const json = await res.json();
      return json.status ? json.slider : [];
    },
    staleTime: FIVE_MINUTES,
  });

  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch("https://masonshop.in/api/digitalcard_userprofile");
      const json = await res.json();
      return json.success ? json.data : [];
    },
    staleTime: FIVE_MINUTES,
  });

  // --- SEARCH LOGIC ---
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(person => 
      person.person_name?.toLowerCase().includes(query) ||
      person.jobroll?.toLowerCase().includes(query) ||
      person.city?.toLowerCase().includes(query)
    );
  }, [searchQuery, users]);

  const isGlobalLoading = catLoading || sliderLoading || usersLoading;

  // --- ACTIONS ---

  const onRefresh = async () => {
    setRefreshing(true);
    setSearchQuery(""); 
    await Promise.all([refetchCats(), refetchSliders(), refetchUsers()]);
    setRefreshing(false);
  };

  const openLink = async (url) => {
    if (!url) return;
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(url, {
          toolbarColor: COLORS.primary,
          enableUrlBarHiding: true,
          showTitle: true,
          animated: true,
        });
      } else {
        Linking.openURL(url);
      }
    } catch (error) {
      Linking.openURL(url);
    }
  };

  // Slider Auto-play
  useEffect(() => {
    if (sliders.length > 0) {
      const interval = setInterval(() => {
        let nextIndex = (sliderIndex + 1) % sliders.length;
        sliderRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        setSliderIndex(nextIndex);
      }, 3000); 
      return () => clearInterval(interval);
    }
  }, [sliders, sliderIndex]);

  const renderSliderItem = ({ item }) => (
    <View style={styles.heroWrapper}>
      <Image source={{ uri: item.image }} style={styles.heroImg} resizeMode="cover" />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A2E44" />

      <LinearGradient colors={['#1A2E44', '#D4F8FA']} style={styles.topHeader}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Home</Text>
              <Text style={styles.locationText}>NO:X ABC Street, Thiruvallur</Text>
            </View>
            <TouchableOpacity style={styles.profileCircle} onPress={() => navigation?.navigate("Myupload")}>
              
                <Ionicons name="person" size={18} color="white" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput 
                placeholder="Search name, job or city..." 
                style={styles.searchInput} 
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={20} color={COLORS.primary} />
                </TouchableOpacity>
            )}
          </View>

          <View style={styles.topNavContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
              {TOP_NAV.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.topNavItem}
                  onPress={() => navigation?.navigate(item.route)}
                >
                  <View style={[styles.iconBox, item.name === "Diary" && styles.activeIconBox]}>
                    <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                  </View>
                  <Text style={styles.topNavText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {isGlobalLoading && !refreshing ? (
           <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        ) : (
          <>
            {/* Show Slider and Categories only if NOT searching */}
            {!searchQuery && (
                <>
                {sliders.length > 0 && (
                    <View style={{ marginTop: 20 }}>
                        <FlatList
                        ref={sliderRef}
                        data={sliders}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderSliderItem}
                        onMomentumScrollEnd={(e) => setSliderIndex(Math.floor(e.nativeEvent.contentOffset.x / width))}
                        />
                    </View>
                )}

                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeading}>Categories</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
                        {categories.map((item) => (
                        <TouchableOpacity 
                            key={item.id} 
                            style={styles.catItemHorizontal}
                            onPress={() => navigation?.navigate("AllDVC", { category: item.category_name })}
                        >
                            <View style={styles.catImgWrapper}>
                            <Image source={{ uri: item.category_image }} style={styles.catThumbnail} />
                            </View>
                            <Text style={styles.catLabel} numberOfLines={1}>{item.category_name}</Text>
                        </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
                </>
            )}

            {/* People Section (Filtered) */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeading}>
                {searchQuery ? `Matching Results (${filteredUsers.length})` : "People Around You"}
              </Text>
              
              {filteredUsers.length > 0 ? (
                <ScrollView 
                    horizontal={!searchQuery} 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={{ paddingLeft: 20, paddingBottom: 20 }}
                >
                    {filteredUsers.map((person) => {
                    const cardLink = person.link || `https://masonshop.in/card/${person.user_id || person.id}`;
                    return (
                        <TouchableOpacity 
                            key={person.id} 
                            style={[styles.personCard, searchQuery && { width: width - 40, marginBottom: 15 }]} 
                            onPress={() => openLink(cardLink)}
                        >
                        <Image 
                            source={{ uri: (person.image?.length > 30) ? person.image : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400' }} 
                            style={styles.personImg} 
                        />
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.personOverlay}>
                            <Text style={styles.personName}>{person.person_name || "Unknown"}</Text>
                            <Text style={styles.personRole}>{person.jobroll || "Worker"}</Text>
                            <Text style={styles.personLoc}>📍 {person.city || "India"}</Text>
                        </LinearGradient>
                        </TouchableOpacity>
                    );
                    })}
                </ScrollView>
              ) : (
                <View style={styles.emptySearch}>
                    <Ionicons name="search-outline" size={50} color={COLORS.textSub} />
                    <Text style={{ color: COLORS.textSub, marginTop: 10 }}>No matches found for "{searchQuery}"</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Bottom Nav */}
      <View style={styles.bottomNavWrapper}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.bNavItem} onPress={() => navigation?.navigate("DairyList")}>
            <Ionicons name="home" size={22} color={COLORS.primary} />
            <Text style={styles.bNavText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bNavItem} onPress={() => navigation?.navigate("CreateDVC")}>
            <FontAwesome name="plus-circle" size={22} color={COLORS.primary} />
            <Text style={styles.bNavText}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.centerSearch} onPress={() => navigation?.navigate("AllDVC")}>
            <FontAwesome name="search" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bNavItem} onPress={() => navigation?.navigate("MyDVC")}>
            <FontAwesome name="qrcode" size={22} color={COLORS.primary} />
            <Text style={styles.bNavText}>QR Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bNavItem} onPress={() => navigation?.navigate("Myupload")}>
            <FontAwesome name="id-card-o" size={22} color={COLORS.primary} />
            <Text style={[styles.bNavText, { color: COLORS.primary, fontWeight: '700' }]}>My DVC</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topHeader: { paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingTop: Platform.OS === 'android' ? 10 : 0 },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginTop: 10 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.white },
  locationText: { color: "#E2E8F0", fontSize: 12 },
  profileCircle: { width: 40, height: 40, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, alignItems: "center", justifyContent: "center" },
  
  searchBar: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: COLORS.white, 
    marginHorizontal: 20, 
    marginTop: 15, 
    borderRadius: 12, 
    paddingHorizontal: 15, 
    height: 50,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  searchInput: { flex: 1, color: COLORS.textMain, marginLeft: 10, fontSize: 14 },
  
  topNavContainer: { marginTop: 20 },
  topNavItem: { alignItems: "center", marginRight: 20 },
  iconBox: { width: 50, height: 50, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 15, alignItems: "center", justifyContent: "center", marginBottom: 5 },
  activeIconBox: { backgroundColor: COLORS.white },
  topNavText: { color: COLORS.white, fontSize: 12, fontWeight: "500" },
  heroWrapper: { width: width, height: 200 },
  heroImg: { width: width - 40, height: 180, borderRadius: 20, marginHorizontal: 20, backgroundColor: '#ccc' },
  sectionContainer: { marginTop: 20 },
  sectionHeading: { fontSize: 18, fontWeight: "bold", color: COLORS.textMain, marginLeft: 20, marginBottom: 15 },
  catItemHorizontal: { alignItems: "center", marginRight: 20, width: 70 },
  catImgWrapper: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.white, elevation: 2, alignItems: "center", justifyContent: "center", marginBottom: 8, borderWidth: 1, borderColor: "#F1F5F9" },
  catThumbnail: { width: 35, height: 35, resizeMode: "contain" },
  catLabel: { fontSize: 12, color: COLORS.textMain, textAlign: "center" },
  
  personCard: { width: 160, height: 220, borderRadius: 15, marginRight: 15, backgroundColor: COLORS.white, overflow: "hidden", elevation: 3, position: "relative" },
  personImg: { width: "100%", height: "100%", resizeMode: "cover" },
  personOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, paddingTop: 30 },
  personName: { color: "white", fontWeight: "bold", fontSize: 16 },
  personRole: { color: "#E2E8F0", fontSize: 12, marginBottom: 4 },
  personLoc: { color: "#94A3B8", fontSize: 11 },
  
  emptySearch: { alignItems: 'center', justifyContent: 'center', padding: 40, width: width },

  bottomNavWrapper: { position: "absolute", bottom: 20, left: 20, right: 20, alignItems: 'center' },
  bottomNav: { flexDirection: "row", backgroundColor: COLORS.white, width: '100%', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, justifyContent: "space-between", alignItems: "center", elevation: 10 },
  bNavItem: { alignItems: "center", flex: 1 },
  bNavText: { fontSize: 10, color: COLORS.textSub, marginTop: 4 },
  centerSearch: { width: 50, height: 50, backgroundColor: COLORS.primary, borderRadius: 25, alignItems: "center", justifyContent: "center", marginTop: -25, borderWidth: 4, borderColor: COLORS.bg },
});