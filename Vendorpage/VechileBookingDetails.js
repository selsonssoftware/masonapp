import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BookingDetailsScreen = ({ route, navigation }) => {
  const { orderData } = route.params || {};

  // Prioritize 'rental_status' from the API. If null, fall back to 'status' (pending).
  const determineInitialStatus = () => {
    if (orderData?.rental_status) return orderData.rental_status;
    return orderData?.status || 'pending';
  };

  const [currentStatus, setCurrentStatus] = useState(determineInitialStatus());
  const [isUpdating, setIsUpdating] = useState(false);

  // Status configuration mapping
  const getStatusConfig = (status) => {
    const configs = {
      'pending': { label: 'Pending', color: '#F59E0B', bg: '#FFFBEB', icon: 'clock-outline' },
      'processing': { label: 'Processing', color: '#3B82F6', bg: '#EFF6FF', icon: 'progress-wrench' },
      'completed': { label: 'Completed', color: '#10B981', bg: '#ECFDF5', icon: 'check-circle-outline' },
      '111': { label: 'Confirmed', color: '#10B981', bg: '#ECFDF5', icon: 'check-decagram' },
      'default': { label: status?.toUpperCase() || 'UNKNOWN', color: '#64748B', bg: '#F1F5F9', icon: 'tag-outline' }
    };
    return configs[status] || configs['default'];
  };

  const statusConfig = getStatusConfig(currentStatus);

  const handleUpdateOrderStatus = async (nextStatus) => {
    setIsUpdating(true);
    try {
      const vendorId = await AsyncStorage.getItem('user_id');
      
      const formData = new FormData();
     
      formData.append('rental_status', nextStatus); // Will precisely send "processing" or "completed"
      formData.append('user_id', vendorId);

      const response = await fetch('https://masonshop.in/api/next-status', {
        method: 'POST',
        body: formData,
      });

      const json = await response.json();

      if (json.status === 'success') {
        // Update local state using the new rental_status returned from the API
        setCurrentStatus(json.rental_status); 
        Alert.alert("Success", json.message || "Status updated successfully");
      } else {
        Alert.alert("Error", json.message || "Failed to update order status.");
      }
    } catch (error) {
      console.error("Update Error:", error);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const DetailRow = ({ icon, label, value, hideBorder }) => (
    <View style={[styles.detailRow, !hideBorder && styles.rowBorder]}>
      <View style={styles.detailRowLeft}>
        <View style={styles.iconWrapper}>
          <Icon name={icon} size={20} color="#64748B" />
        </View>
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  if (!orderData) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.labelSmall}>ORDER REFERENCE</Text>
              <Text style={styles.orderIdText}>{orderData.order_id}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Icon name={statusConfig.icon} size={14} color={statusConfig.color} style={{ marginRight: 4 }} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Booking Information</Text>
        <View style={styles.card}>
          <DetailRow icon="car-info" label="Vehicle (Product ID)" value={`#${orderData.product_id}`} />
          <DetailRow icon="account-outline" label="Customer ID" value={orderData.user_id} />
          <DetailRow icon="storefront-outline" label="Store ID" value={orderData.store_id} hideBorder />
        </View>

        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.card}>
          <DetailRow icon="calendar-plus" label="Created At" value={formatDate(orderData.created_at)} />
          <DetailRow icon="calendar-edit" label="Last Updated" value={formatDate(orderData.updated_at)} hideBorder />
        </View>
      </ScrollView>

      {/* Button Logic strictly checks for pending/processing workflows */}
      {(currentStatus === 'pending' || currentStatus === 'processing') && (
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={[
              styles.primaryButton, 
              currentStatus === 'processing' && { backgroundColor: '#10B981' } 
            ]} 
            activeOpacity={0.8}
            disabled={isUpdating}
            onPress={() => {
              // Exact strings sent here:
              if (currentStatus === 'pending') {
                handleUpdateOrderStatus('processing'); 
              } else if (currentStatus === 'processing') {
                handleUpdateOrderStatus('completed');
              }
            }}
          >
            {isUpdating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {currentStatus === 'pending' ? 'Accept Order (Start Processing)' : 'Mark as Completed'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 25 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  labelSmall: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 },
  orderIdText: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '800' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 10, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  detailRowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  detailLabel: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  detailValue: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10 },
  primaryButton: { backgroundColor: '#0F172A', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

export default BookingDetailsScreen;