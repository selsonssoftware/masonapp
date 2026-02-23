import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Animated,
  TouchableWithoutFeedback,
  Platform,
  TouchableOpacity,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// --- Animated Card Component ---
const AnimatedBookingCard = ({ item, config, onPress, onAccept }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleValue }] }]}>
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.orderLabel}>ORDER REF</Text>
            <Text style={styles.orderId}>{item.order_id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Icon name="car-info" size={16} color="#94A3B8" />
            <Text style={styles.infoValue}>Vehicle ID: <Text style={styles.bold}>{item.product_id}</Text></Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="calendar-range" size={16} color="#94A3B8" />
            <Text style={styles.infoValue}>{new Date(item.created_at).toDateString()}</Text>
          </View>

          {/* Accept Button: Only visible if status is pending */}
          {item.status === 'pending' && (
            <TouchableOpacity 
              style={styles.acceptButton} 
              onPress={() => onAccept(item.order_id)}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptButtonText}>Accept Booking</Text>
              <Icon name="check-circle-outline" size={18} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        <Icon name="chevron-right" size={20} color="#CBD5E1" style={styles.chevron} />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// --- Main Screen ---
const VendorBookingScreen = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const userid = await AsyncStorage.getItem('user_id');
      const response = await fetch(
        `https://masonshop.in/api/get_vendor_booked_orders?user_id=${userid}`
      );
      const json = await response.json();
      if (json.status) {
        setOrders(json.data);
        setFilteredOrders(json.data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateOrderStatus = async (orderId) => {
    Alert.alert(
      "Accept Order",
      "Are you sure you want to accept this booking?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Accept", 
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await fetch('https://masonshop.in/api/next-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId })
              });
              
              const json = await response.json();
              if (json.status) {
                Alert.alert("Success", "Order is now in processing.");
                fetchBookings(); // Refresh the list
              } else {
                Alert.alert("Error", json.message || "Could not update status");
              }
            } catch (error) {
              Alert.alert("Error", "Network request failed");
            } finally {
              setActionLoading(false);
            }
          } 
        }
      ]
    );
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter((item) => 
        item.order_id.toLowerCase().includes(text.toLowerCase()) ||
        item.product_id.toString().includes(text)
      );
      setFilteredOrders(filtered);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      '111': { label: 'Confirmed', color: '#10B981', bg: '#ECFDF5' },
      'pending': { label: 'Pending', color: '#F59E0B', bg: '#FFFBEB' },
      'processing': { label: 'Processing', color: '#6366F1', bg: '#EEF2FF' },
      'default': { label: status?.toUpperCase(), color: '#64748B', bg: '#F1F5F9' }
    };
    return configs[status] || configs['default'];
  };

  const renderItem = ({ item }) => {
    const config = getStatusConfig(item.status);
    return (
      <AnimatedBookingCard 
        item={item} 
        config={config} 
        onPress={() => navigation.navigate('VechileBookingDetails', { orderData: item })} 
        onAccept={updateOrderStatus}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Order ID or Vehicle..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Icon name="close-circle" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {(loading || actionLoading) && (
        <View style={styles.loaderOverlay}>
           <ActivityIndicator size="large" color="#0F172A" />
           {actionLoading && <Text style={styles.loaderText}>Updating Status...</Text>}
        </View>
      )}

      <FlatList
        data={filteredOrders}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Icon name="database-search" size={48} color="#E2E8F0" />
              <Text style={styles.emptyText}>No matching orders found</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 25 : 0 },
  header: { backgroundColor: '#FFF', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 15 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 45,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#1E293B', fontSize: 14, fontWeight: '500' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2, 
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
  orderId: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800' },
  infoBox: { gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoValue: { fontSize: 13, color: '#64748B', marginLeft: 8 },
  bold: { color: '#0F172A', fontWeight: '700' },
  chevron: { position: 'absolute', right: 12, bottom: 20 },
  acceptButton: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 15,
    gap: 8,
  },
  acceptButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  loaderOverlay: { paddingVertical: 20, alignItems: 'center' },
  loaderText: { marginTop: 8, color: '#64748B', fontSize: 12, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94A3B8', marginTop: 10, fontSize: 15 }
});

export default VendorBookingScreen;