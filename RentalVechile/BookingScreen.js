import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Image,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Dimensions
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const ORDERS_API_URL = 'https://masonshop.in/api/get_user_booked_orders';
const VEHICLES_API_URL = 'https://masonshop.in/api/rentalvehicle';

export default function BookingScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [bookedVehicles, setBookedVehicles] = useState([]);
  const [query, setQuery] = useState('');

  const navigation = useNavigation();

  // 1. FIXED: Removed [userid] dependency to prevent ReferenceError
  const fetchBookedVehicleIds = useCallback(async () => {
    try {
      const userid = await AsyncStorage.getItem("user_id");
      if (!userid) return [];

      const response = await fetch(`${ORDERS_API_URL}?user_id=${userid}`);
      const result = await response.json();

      if (response.ok && result.status && Array.isArray(result.data)) {
        // Return whole item to keep the Date information
        return result.data.map((item) => ({
          productId: String(item.product_id),
          bookingDate: item.created_at || item.booking_date || 'Date N/A' // Attempt to get date
        }));
      } else {
        return [];
      }
    } catch (error) {
      console.error(error);
      return [];
    }
  }, []);

  const fetchBookedVehicles = useCallback(async (bookedData) => {
    // Check if bookedData is empty
    if (!Array.isArray(bookedData) || bookedData.length === 0) {
      setBookedVehicles([]);
      setRefreshing(false);
      return;
    }

    try {
      const response = await fetch(VEHICLES_API_URL);
      const result = await response.json();

      if (response.ok && result.status && Array.isArray(result.data)) {
        const allVehicles = result.data;

        const finalBookedList = bookedData
          .map((orderItem) => {
            // Find vehicle matching the ID
            const vehicle = allVehicles.find((v) => String(v.id) === orderItem.productId);
            if (!vehicle) return null;

            const priceString = vehicle.rentalprice_perday ?? '';
            const price = Number(String(priceString).replace(/[^0-9]/g, '')) || 0;

            return {
              vehicle_type: vehicle.vehicle_name || 'N/A',
              price,
              location: vehicle.city || 'N/A',
              date: orderItem.bookingDate, // 2. FIXED: Using actual date from order
              vehicle_number: vehicle.vehicle_number || 'N/A',
              image: vehicle.vehicle_image || 'https://via.placeholder.com/150',
              product_id: vehicle.id,
            };
          })
          .filter(Boolean);

        setBookedVehicles(finalBookedList);
      } else {
        // Alert.alert('Error', result.message || 'Cannot fetch vehicle details.');
        setBookedVehicles([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Network request failed for vehicle details.');
      setBookedVehicles([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const fetchAllBookings = useCallback(async () => {
    setRefreshing(true);
    const orderData = await fetchBookedVehicleIds();
    await fetchBookedVehicles(Array.isArray(orderData) ? orderData : []);
  }, [fetchBookedVehicleIds, fetchBookedVehicles]);

  useEffect(() => {
    fetchAllBookings();
  }, [fetchAllBookings]);

  const onRefresh = useCallback(() => {
    fetchAllBookings();
  }, [fetchAllBookings]);

  const handleViewDetails = (vehicleId) => {
    // Ensure you have a 'DetailsScreen' in your navigation stack
    navigation.navigate('DetailsScreen', { vehicleId });
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredVehicles = normalizedQuery
    ? bookedVehicles.filter((v) => {
        const name = (v.vehicle_type || '').toString().toLowerCase();
        const number = (v.vehicle_number || '').toString().toLowerCase();
        return name.includes(normalizedQuery) || number.includes(normalizedQuery);
      })
    : bookedVehicles;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bookings</Text>
        </View>

        <View style={styles.searchWrapper}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by vehicle name or number"
            placeholderTextColor="#999"
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff732e']} tintColor={'#ff732e'} />
          }
        >
          {refreshing && bookedVehicles.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#ff732e" />
              <Text style={styles.emptyText}>Loading bookings...</Text>
            </View>
          ) : filteredVehicles.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {normalizedQuery ? 'No bookings match your search.' : 'You have no bookings yet.'}
              </Text>
            </View>
          ) : (
            filteredVehicles.map((item, index) => {
              // Use index in key fallback to ensure uniqueness if product_id duplicates exist in history
              const key = `${item.product_id}_${index}`;
              return (
                <View key={key} style={styles.bookingCard}>
                  <Image
                    source={{
                      uri: item.image && item.image !== 'https://masonshop.in/' ? item.image : 'https://via.placeholder.com/150',
                    }}
                    style={styles.bookingImage}
                    resizeMode="cover"
                  />
                  <View style={styles.bookingInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.vehicleType}>{item.vehicle_type}</Text>
                      <Text style={styles.priceText}>₹ {Number(item.price).toLocaleString('en-IN')}</Text>
                    </View>

                    <Text style={styles.metaText}>
                      {item.location} • {item.date}
                    </Text>
                    
                    <Text style={[styles.metaText, {marginTop: 2}]}>
                       Vehicle No: <Text style={{ fontWeight: '500', color:'#333' }}>{item.vehicle_number}</Text>
                    </Text>

                    <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-between', gap: 10 }}>
                      <TouchableOpacity style={styles.viewBtn} activeOpacity={0.7} onPress={() => handleViewDetails(item.product_id)}>
                        <Text style={styles.viewText}>View Details</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rentBtn}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('VechileScreen', { vehicleId: item.product_id })}
                      >
                        <Text style={styles.rentText}>Rent Again</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          <View style={{ height: 50 }} />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// 3. FIXED: Added Missing Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  searchWrapper: {
    padding: 15,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    fontSize: 15,
    color: '#333',
  },
  scrollViewContent: {
    padding: 15,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#888',
    fontSize: 16,
  },
  bookingCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 10,
  },
  bookingImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  bookingInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  vehicleType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff732e',
  },
  metaText: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  viewBtn: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewText: {
    color: '#555',
    fontSize: 12,
    fontWeight: '600',
  },
  rentBtn: {
    flex: 1,
    backgroundColor: '#ff732e',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  rentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});