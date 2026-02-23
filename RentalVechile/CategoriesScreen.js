import React, { useState, useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  StatusBar,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

// 1. React Query Imports
import { 
  useQuery, 
  useQueryClient, 
  QueryClient, 
  QueryClientProvider 
} from '@tanstack/react-query';

// Initialize Query Client
const queryClient = new QueryClient();

// --- API FETCHERS ---
const fetchCategories = async () => {
  const response = await fetch('https://masonshop.in/api/vehicle-categories');
  if (!response.ok) throw new Error('Network error fetching categories');
  const result = await response.json();
  return result?.data?.filter((cat) => cat.rvc_status === 'on') || [];
};

const fetchRentalVehicles = async () => {
  const response = await fetch('https://masonshop.in/api/rentalvehicle');
  if (!response.ok) throw new Error('Network error fetching vehicles');
  const result = await response.json();
  return result?.data?.filter((veh) => veh.rental_status === 'published') || [];
};

// --- COMPONENTS ---

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleChange = (text) => {
    setQuery(text);
    onSearch(text);
  };

  return (
    <View style={styles.searchContainer}>
      <Icon name="search" size={18} color="#999" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={handleChange}
        placeholder="Search model, brand, or city..."
        placeholderTextColor="#999"
      />
    </View>
  );
};

const BottomNav = ({ navigation }) => (
  <View style={styles.bottomNavContainer}>
    <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("HomeVechile")}>
      <Ionicons name="home" size={25} color="#404040" />
      <Text style={styles.navBtnText}>Home</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("CategoriesScreen")}>
      <Ionicons name="car-outline" size={25} color="#ff893f" />
      <Text style={[styles.navBtnText, {color: '#ff893f'}]}>Vehicles</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("BookingScreen")}>
      <Ionicons name="calendar-outline" size={25} color="#404040" />
      <Text style={styles.navBtnText}>Booking</Text>
    </TouchableOpacity>
  </View>
);

const CategoriesContent = () => {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 2. React Query Hooks with 5-minute (300,000ms) staleTime
  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 300000, 
  });

  const { 
    data: vehicles = [], 
    isLoading: vehLoading, 
    refetch, 
    isRefetching 
  } = useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchRentalVehicles,
    staleTime: 300000,
  });

  // 3. Proper Filtering Logic (Live Data)
  const filteredVehicles = useMemo(() => {
    let list = vehicles;

    // Filter by Category
    if (selectedCategory !== 'all') {
      list = list.filter(v => String(v.rvp_category_id) === String(selectedCategory));
    }

    // Filter by Search Query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      list = list.filter(v => 
        (v.vehicle_name || "").toLowerCase().includes(q) ||
        (v.brand_name || "").toLowerCase().includes(q) ||
        (v.city || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [vehicles, selectedCategory, searchQuery]);

  if (catLoading || vehLoading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#ff893f" />
        <Text style={{marginTop: 10, color: '#666'}}>Loading Live Data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View style={styles.contentRow}>
          {/* SIDEBAR */}
          <View style={styles.sidebar}>
            {/* ALL VEHICLES OPTION */}
            <TouchableOpacity
              style={[styles.categoryBlock, selectedCategory === 'all' && styles.categoryBlockSelected]}
              onPress={() => setSelectedCategory('all')}
            >
              <Ionicons name="grid" size={24} color={selectedCategory === 'all' ? "#ff893f" : "#999"} />
              <Text style={[styles.categoryText, selectedCategory === 'all' && styles.categoryTextSelected]}>All</Text>
            </TouchableOpacity>

            {categories.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.categoryBlock, String(selectedCategory) === String(item.id) && styles.categoryBlockSelected]}
                onPress={() => setSelectedCategory(item.id)}
              >
                {item.rvc_image && <Image source={{ uri: item.rvc_image }} style={styles.categoryIcon} />}
                <Text style={[styles.categoryText, String(selectedCategory) === String(item.id) && styles.categoryTextSelected]} numberOfLines={2}>
                  {item.rvc_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* VEHICLE GRID */}
          <View style={styles.vehiclesWrapper}>
            <SearchBar onSearch={setSearchQuery} />

            <View style={styles.vehiclesContainer}>
              {filteredVehicles.map((item) => (
                <View key={item.id} style={styles.vehicleCard}>
                  {item.vehicle_image && (
                    <Image source={{ uri: item.vehicle_image }} style={styles.vehicleImage} resizeMode="contain" />
                  )}
                  <Text style={styles.vehicleName} numberOfLines={1}>{item.vehicle_name}</Text>
                  <Text style={styles.vehiclePrice}>₹{item.rentalprice_perday || item.rentalprice_perhour} / Day</Text>
                  
                  <TouchableOpacity 
                    style={styles.rentBtn} 
                    onPress={() => navigation.navigate('VechileScreen', { vehicleId: item.id })}
                  >
                    <Text style={styles.rentText}>Rent</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {filteredVehicles.length === 0 && (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No vehicles found matching your criteria.</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNav navigation={navigation} />
    </SafeAreaView>
  );
};

// Main Export with Provider
export default function CategoriesScreen() {
  return (
    <QueryClientProvider client={queryClient}>
      <CategoriesContent />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollViewContent: { flexGrow: 1, paddingVertical: 10 },
  contentRow: { flexDirection: 'row' },
  
  // Search Bar
  searchContainer: {
    height: 45,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderColor: '#eee',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },

  // Sidebar
  sidebar: { width: 90, alignItems: 'center', paddingTop: 5 },
  categoryBlock: {
    width: 75,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 10,
    elevation: 2,
  },
  categoryBlockSelected: {
    borderColor: '#ff893f',
    backgroundColor: '#fff7f1',
    borderWidth: 2,
  },
  categoryIcon: { width: 35, height: 35, marginBottom: 5 },
  categoryText: { fontSize: 10, fontWeight: '500', textAlign: 'center', color: '#666' },
  categoryTextSelected: { fontWeight: '700', color: '#ff893f' },

  // Vehicles
  vehiclesWrapper: { flex: 1, paddingHorizontal: 10, borderLeftWidth: 1, borderLeftColor: '#f0f0f0' },
  vehiclesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  vehicleCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f5f5f5',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  vehicleImage: { width: '100%', height: 80, marginBottom: 8 },
  vehicleName: { fontSize: 13, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  vehiclePrice: { fontSize: 11, color: '#ff893f', fontWeight: '700', textAlign: 'center', marginVertical: 4 },
  rentBtn: { backgroundColor: '#ff893f', borderRadius: 8, paddingVertical: 6, marginTop: 5 },
  rentText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  
  emptyBox: { width: '100%', padding: 20, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 12, textAlign: 'center' },

  // Bottom Nav
  bottomNavContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 65,
    backgroundColor: "#fff",
    borderRadius: 35,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  navBtn: { alignItems: "center" },
  navBtnText: { marginTop: 2, fontSize: 10, color: "#444", fontWeight: '500' },
});