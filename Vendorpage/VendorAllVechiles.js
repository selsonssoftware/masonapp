import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const VendorVehicleScreen = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('unpublished'); 
  const navigation = useNavigation();

  useEffect(() => {
    fetchVehicles();
  }, []);

  // REUSABLE FETCH FUNCTION
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const userid = (await AsyncStorage.getItem('user_id')) || 'M778987';
      const response = await fetch(
        `https://masonshop.in/api/getVendorVehicles?user_id=${userid}`
      );
      const json = await response.json();
      if (json.status) {
        setVehicles(json.data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 1. DELETE VEHICLE LOGIC
  const handleDeleteVehicle = (item) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${item.vehicle_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              const response = await fetch(`https://masonshop.in/api/rental_deleteProperty?id=${item.id}`);
              const json = await response.json();
              
              if (json.status) {
                Alert.alert('Deleted', 'Vehicle removed successfully');
                // SUDDEN REFRESH AFTER DELETE
                await fetchVehicles(); 
              } else {
                Alert.alert('Error', 'Failed to delete vehicle');
              }
            } catch (error) {
              Alert.alert('Error', 'Network request failed');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  // 2. PUBLISH VEHICLE LOGIC
  const handlePublishAction = async (item) => {
    

    setProcessing(true);
    try {
      const userid = (await AsyncStorage.getItem('user_id')) || 'M778987';
      const subRes = await fetch(`https://masonshop.in/api/check_subscription?user_id=${userid}`);
      const subJson = await subRes.json();
      
      if (subJson.status !== 'active') {
        setProcessing(false);
        Alert.alert('Membership Required', 'Active subscription needed to publish.', [
          { text: 'Later', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Membership') }
        ]);
        return;
      }

      const formData = new FormData();
      formData.append('user_id', userid);
      formData.append('id', item.id);

      const publishRes = await fetch(`https://masonshop.in/api/rental_updateStatus`, {
        method: 'POST',
        body: formData,
      });

      if (publishRes.ok) {
        Alert.alert('Success', 'Vehicle published successfully!');
        // SUDDEN REFRESH AFTER PUBLISH
        await fetchVehicles(); 
      } else {
        Alert.alert('Error', 'Failed to update status');
      }
    } catch (error) {
      Alert.alert('Error', 'Network request failed');
    } finally {
      setProcessing(false);
    }
  };

  const filteredData = vehicles.filter((item) => item.vehicle_status === activeTab);

  const renderVehicle = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.vehicle_image }} style={styles.image} resizeMode="cover" />
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, item.vehicle_status === 'published' ? styles.badgeActive : styles.badgeInactive]}>
            <Text style={styles.badgeText}>{item.vehicle_status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleName} numberOfLines={1}>{item.vehicle_name}</Text>
            <Text style={styles.vehicleSub}>{item.brand_model} • {item.city}</Text>
          </View>
          
          <View style={styles.actionContainer}>
            {activeTab === 'unpublished' ? (
              <TouchableOpacity 
                style={[
                  styles.publishBtn, 
                  item.status === 'off' && { backgroundColor: '#E2E8F0' } 
                ]} 
                onPress={() => handlePublishAction(item)}
                
              >
                <Text style={[styles.publishBtnText,  { color: '#04a1efff' }]}>
                   Publish
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => handleDeleteVehicle(item)}>
                <Icon name="trash-can-outline" size={26} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}><Text style={styles.statLabel}>DAY</Text><Text style={styles.statValue}>₹{item.rentalprice_perday}</Text></View>
          <View style={styles.statBox}><Text style={styles.statLabel}>HOUR</Text><Text style={styles.statValue}>₹{item.rentalprice_perhour}</Text></View>
          <View style={styles.statBox}><Text style={styles.statLabel}>KM</Text><Text style={styles.statValue}>₹{item.rentalprice_perkm}</Text></View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Garage</Text>
          <Text style={styles.subtitle}>{vehicles.length} Listings</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('AddVechile')}>
          <Icon name="plus-circle" size={32} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'unpublished' && styles.activeTab]} 
          onPress={() => setActiveTab('unpublished')}
        >
          <Text style={[styles.tabText, activeTab === 'unpublished' && styles.activeTabText]}>Unpublished</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'published' && styles.activeTab]} 
          onPress={() => setActiveTab('published')}
        >
          <Text style={[styles.tabText, activeTab === 'published' && styles.activeTabText]}>Published</Text>
        </TouchableOpacity>
      </View>

      {processing && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderVehicle}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchVehicles} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="car-off" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No vehicles found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF' },
  title: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#6366F1' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#94A3B8' },
  activeTabText: { color: '#6366F1' },
  list: { padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 15, marginBottom: 16, elevation: 3, overflow: 'hidden' },
  imageContainer: { height: 160, width: '100%' },
  image: { height: '100%', width: '100%' },
  badgeContainer: { position: 'absolute', top: 10, left: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeActive: { backgroundColor: '#DCFCE7' },
  badgeInactive: { backgroundColor: '#F1F5F9' },
  badgeText: { fontSize: 9, fontWeight: '900', color: '#166534' },
  content: { padding: 15 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleName: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  vehicleSub: { fontSize: 12, color: '#64748B' },
  actionContainer: { flexDirection: 'row', alignItems: 'center' },
  publishBtn: { backgroundColor: '#6366F1', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  publishBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  deleteBtn: { padding: 5 },
  statsGrid: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 10, marginTop: 12, padding: 10 },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 8, fontWeight: '900', color: '#94A3B8' },
  statValue: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, color: '#94A3B8', fontWeight: '600' },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 99, justifyContent: 'center', alignItems: 'center' }
});

export default VendorVehicleScreen;