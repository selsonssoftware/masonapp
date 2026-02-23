import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, FlatList,
  TouchableOpacity, Image, Dimensions, ActivityIndicator,
  Alert, TextInput, Platform, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// --- API Configuration ---
const BOOKINGS_API_URL = 'https://masonshop.in/api/get_user_orders'; 
const CANCEL_API_URL = 'https://masonshop.in/api/cancel_order'; 

const MyBookingsScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Active');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [cancellingId, setCancellingId] = useState(null);

  // --- Utility: Group Flat API Data by Order ID (CRITICAL FOR YOUR JSON) ---
  const groupOrders = (data) => {
    const grouped = data.reduce((acc, item) => {
      const id = item.order_id;
      if (!acc[id]) {
        acc[id] = {
          id: id,
          status: item.order_status || 'pending',
          totalPrice: parseFloat(item.final_amount || 0),
          advanceAmount: parseFloat(item.advance_amount || 0),
          pendingAmount: parseFloat(item.pending_amount || 0),
          rentalAddress: item.address || 'N/A',
          orderDate: item.created_at || new Date().toISOString(),
          products: [] // Array to hold all grouped items
        };
      }
      acc[id].products.push({
        name: item.rmp_name,
        image: item.rmp_image
      });
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.id.localeCompare(a.id));
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) { setLoading(false); return; }

      const response = await fetch(`${BOOKINGS_API_URL}?user_id=${userId}`);
      const json = await response.json();

      if (json?.status === true && Array.isArray(json.data)) {
        // Grouping the items so one card shows all products of one Order ID
        const processed = groupOrders(json.data);
        setBookings(processed);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      Alert.alert("Error", "Could not load bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  const performCancellation = useCallback(async (orderId) => {
    setCancellingId(orderId);
    try {
        const response = await fetch(`${CANCEL_API_URL}?order_id=${orderId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const json = await response.json();
        if (json.status === true) {
            Alert.alert("Success", "Order cancelled successfully.");
            fetchBookings(); 
        } else {
            Alert.alert("Failed", json.message || "Cancellation failed.");
        }
    } catch (e) {
        Alert.alert("Error", "Connection failed.");
    } finally {
        setCancellingId(null);
    }
  }, [fetchBookings]);

  useFocusEffect(useCallback(() => { fetchBookings(); }, [fetchBookings]));

  const filteredBookings = bookings.filter(booking => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = query === '' || 
      booking.id.toLowerCase().includes(query) ||
      booking.products.some(p => p.name.toLowerCase().includes(query));

    const status = booking.status.toLowerCase();
    const isActiveTab = activeTab === 'Active';
    // Logic: Active tab shows pending/confirmed. Past shows cancelled/completed.
    const isStatusActive = status === 'pending' || status === 'confirmed';

    return matchesSearch && (isActiveTab ? isStatusActive : !isStatusActive);
  });

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return { bg: '#e8f5e9', text: '#2e7d32', dot: '#4caf50' };
      case 'cancelled': return { bg: '#ffebee', text: '#c62828', dot: '#f44336' };
      case 'pending': return { bg: '#fff8e1', text: '#ef6c00', dot: '#ff9800' };
      default: return { bg: '#f5f5f5', text: '#616161', dot: '#9e9e9e' };
    }
  };

  const renderBookingItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    const isCancelling = cancellingId === item.id;
    const showCancelButton = item.status.toLowerCase() === 'pending';

    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderIdText}>Order ID: {item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('RentalInvoice', { bookingId: item.id })}
        >
          {/* SHOW ALL IMAGES IN THE ORDER */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            {item.products.map((prod, idx) => (
              <View key={idx} style={styles.imageWrapper}>
                <Image source={{ uri: prod.image }} style={styles.productImage} />
                <Text style={styles.miniItemName} numberOfLines={1}>{prod.name}</Text>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.productDetails}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color="#888" />
              <Text style={styles.infoText} numberOfLines={1}>{item.rentalAddress}</Text>
            </View>

            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>Advance Paid</Text>
                <Text style={styles.priceValue}>₹{item.advanceAmount}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.priceLabel}>Pending Amount</Text>
                <Text style={[styles.priceValue, { color: '#d32f2f' }]}>₹{item.pendingAmount}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.cardFooter}>
          {showCancelButton ? (
            <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => Alert.alert("Cancel", "Cancel this order?", [{text: "No"}, {text: "Yes", onPress: () => performCancellation(item.id)}])}
                disabled={isCancelling}
            >
              {isCancelling ? <ActivityIndicator size="small" color="#D32F2F" /> : <Text style={styles.cancelBtnText}>Cancel</Text>}
            </TouchableOpacity>
          ) : <View />}

          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => navigation.navigate('RentalInvoice', { bookingId: item.id })}
          >
            <Text style={styles.actionBtnText}>Invoice</Text>
            <Ionicons name="document-text-outline" size={16} color="#FFF" style={{marginLeft: 5}} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order History</Text>
          <View style={{width: 24}} /> 
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" style={{marginLeft: 10}} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Order ID or Item..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.tabWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'Active' && styles.activeTab]} onPress={() => setActiveTab('Active')}>
            <Text style={[styles.tabText, activeTab === 'Active' && styles.activeTabText]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'Past' && styles.activeTab]} onPress={() => setActiveTab('Past')}>
            <Text style={[styles.tabText, activeTab === 'Past' && styles.activeTabText]}>Past / Cancelled</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !cancellingId ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4a90e2" /></View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={item => item.id}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<View style={styles.center}><Text style={{color: '#999'}}>No rentals found</Text></View>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fb', paddingTop: Platform.OS === 'android' ? 0 : 0 },
  header: { backgroundColor: '#FFF', paddingHorizontal: 15, paddingBottom: 15, elevation: 4,paddingVertical:40 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#333' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f2f5', borderRadius: 10, height: 45 },
  searchInput: { flex: 1, paddingHorizontal: 10, fontSize: 15 },
  tabWrapper: { paddingHorizontal: 15, paddingTop: 15 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#e0e5ec', borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFF', elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  activeTabText: { color: '#333', fontWeight: 'bold' },
  listContainer: { padding: 15 },
  cardContainer: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  orderIdText: { fontSize: 13, fontWeight: 'bold', color: '#444' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  imageScroll: { marginBottom: 15 },
  imageWrapper: { width: 75, marginRight: 12, alignItems: 'center' },
  productImage: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee' },
  miniItemName: { fontSize: 9, color: '#666', marginTop: 4, textAlign: 'center' },
  productDetails: { flex: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoText: { fontSize: 12, color: '#666', marginLeft: 6 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8f9fa', padding: 10, borderRadius: 10 },
  priceLabel: { fontSize: 10, color: '#888', marginBottom: 2 },
  priceValue: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#fff5f5' },
  cancelBtnText: { color: '#d32f2f', fontWeight: 'bold', fontSize: 13 },
  actionBtn: { backgroundColor: '#4a90e2', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 }
});

export default MyBookingsScreen;