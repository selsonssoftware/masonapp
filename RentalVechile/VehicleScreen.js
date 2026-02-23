import React, { useEffect, useState } from 'react';
import {
  View,
  Modal,
  Text,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Platform,
  StatusBar,
  Linking, // Import Linking for external links (call/whatsapp)
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import excavator from '../assets/excavator.png';
import oil from '../assets/oil-barrel.png';
import vehicletype from '../assets/trucks.png';
import phone from '../assets/phone-call.png';
import whatsapp from '../assets/whatsapp.png';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: windowWidth } = Dimensions.get('window');

const VehicleScreen = ({ route }) => {
  const { vehicleId } = route.params || {};
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();
  const [user_id, setUser_id] = useState('');
  const [vendorDetails, setVendorDetails] = useState(null); // object or null

  const fetchVehicleDetails = async (isRefreshing = false) => {
    if (!isRefreshing) {
      setLoading(true);
      setError(null);
    }
    setRefreshing(isRefreshing);

    if (!vehicleId) {
      setError('No vehicleId provided in route params');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // 1) fetch all vehicles and find matching
      const response = await fetch('https://masonshop.in/api/rentalvehicle');
      if (!response.ok) {
        throw new Error(`Vehicles API HTTP ${response.status}`);
      }
      const json = await response.json();
      const result = Array.isArray(json.data) ? json.data : [];
      const matchingVehicle = result.find(item => String(item.id) === String(vehicleId));

      if (matchingVehicle) {
        setVehicleData(matchingVehicle);
      } else {
        setError(`Vehicle not found for id: ${vehicleId}`);
        setVehicleData(null);
      }

      // 2) fetch vendor / vehicle details endpoint — await json then access .data
      const response2 = await fetch(`https://masonshop.in/api/getVehicleDetails?id=${vehicleId}`);
      if (!response2.ok) {
        // don't throw immediately — we'll still show vehicle info if present
        console.warn('Vendor details HTTP', response2.status);
        setVendorDetails(null);
      } else {
        const json2 = await response2.json();
        const vendor = Array.isArray(json2.data) && json2.data.length > 0 ? json2.data[0] : null;
        setVendorDetails(vendor);
      }
    } catch (err) {
      console.error('Error fetching vehicle data:', err);
      setError(err.message || 'Error fetching vehicle data');
      setVehicleData(null);
      setVendorDetails(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVehicleDetails();
  }, [vehicleId]);

  const onRefresh = () => {
    fetchVehicleDetails(true);
  };

useEffect(() => {
  const getUserId = async () => {
    const userid = await AsyncStorage.getItem('user_id');
    setUser_id(userid);
  };

  getUserId();
}, []);


  // --- Contact Functions for Vendor Icons (Correctly set up) ---
  const handleCallVendor = () => {
    const mobile = vendorDetails?.mobile; // Assuming vendorDetails.mobile holds the phone number
    if (mobile) {
      Linking.openURL(`tel:${mobile}`).catch(err => {
        console.error('Failed to open phone app:', err);
        Alert.alert('Error', `Cannot open phone application. Number: ${mobile}`);
      });
    } else {
      Alert.alert('Error', 'Vendor mobile number is not available.');
    }
  };

  const handleWhatsappVendor = () => {
    const mobile = vendorDetails?.mobile; // Assuming vendorDetails.mobile holds the phone number
    const title = vehicleData?.title || vehicleData?.vehicle_name || 'Vehicle';
    
    // Construct the WhatsApp URL
    const whatsappUrl = `whatsapp://send?phone=${mobile}&text=Hello, I'm interested in renting the vehicle: ${title} (ID: ${vehicleId})`;

    if (mobile) {
      Linking.canOpenURL(whatsappUrl)
        .then(supported => {
          if (supported) {
            Linking.openURL(whatsappUrl);
          } else {
            Alert.alert('Error', 'WhatsApp is not installed or the number is invalid.');
          }
        })
        .catch(err => {
          console.error('Failed to open WhatsApp:', err);
          Alert.alert('Error', 'Cannot open WhatsApp.');
        });
    } else {
      Alert.alert('Error', 'Vendor mobile number is not available for WhatsApp.');
    }
  };
  // -----------------------------------------------------------

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff7a27" />
        <Text style={{ marginTop: 10, fontSize: 14 }}>Loading vehicle details...</Text>
      </View>
    );
  }

  if (error || !vehicleData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={{ fontSize: 14, color: '#444', textAlign: 'center', paddingHorizontal: 24 }}>
            {error || 'Vehicle not found'}
          </Text>
          <TouchableOpacity
            style={[styles.rentBtn, { marginTop: 16, width: 160, alignSelf: 'center' }]}
            onPress={() => fetchVehicleDetails(false)}
          >
            <Text style={styles.rentBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const title = vehicleData.title || vehicleData.vehicle_name || 'Vehicle';

  const handleSubmit = async () => {
    try {
      const data = {
        user_id: user_id,
        vehicle_id: vehicleId,
      };
      const response = await fetch('https://masonshop.in/api/ren_vehicle_orders_get_cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (response.ok) {
        console.log(result);
        setModalVisible(false);
        navigation.navigate('FinalVendorScreen', { vehicleId });
      } else {
        Alert.alert('Error', result.message || 'Cannot rent vehicle.');
      }
    } catch (error) {
      console.error('API Error:', error);
      Alert.alert('Error', 'Network request failed.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fffaf6" />

     

      <ScrollView
        style={{ backgroundColor: '#fffaf6' }}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <LinearGradient colors={['#fff4ea', '#fff7f2']} style={styles.linearGradient} locations={[0, 1]}>
          <View style={styles.heroWrapper}>
            {vehicleData.vehicle_image ? (
              <Image source={{ uri: vehicleData.vehicle_image }} style={styles.mainImage} resizeMode="cover" />
            ) : null}

            <View style={styles.floatingContainerOverlay}>
              <View style={styles.floatercontainer}>
                <Image source={excavator} style={styles.imagecard} />
                <Text style={styles.imageheading}>{vehicleData.capacity || '--'}</Text>
                <Text style={styles.imagedescription}>WEIGHT</Text>
              </View>
              <View style={styles.floatercontainer}>
                <Image source={oil} style={styles.imagecard} />
                <Text style={styles.imageheading}>{vehicleData.fuel_type || '--'}</Text>
                <Text style={styles.imagedescription}>FUEL TYPE</Text>
              </View>
              <View style={styles.floatercontainer}>
                <Image source={vehicletype} style={styles.imagecard} />
                <Text style={styles.imageheading}>{vehicleData.vehicle_type || '--'}</Text>
                <Text style={styles.imagedescription}>TYPE</Text>
              </View>
            </View>
          </View>

          <View style={styles.contentWrapper}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{vehicleData.location || 'Vehicle Available now'}</Text>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.sectionBody}>{vehicleData.description || 'No description available.'}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Vendor Details</Text>

              <View style={styles.spcontainer}>
                <View style={styles.spCard}>
                  <Image
                    style={styles.spimage}
                    source={
                      vendorDetails && vendorDetails.logo
                        ? { uri: vendorDetails.logo }
                        : { uri: 'https://commons.wikimedia.org/wiki/File:Portrait_Placeholder.png' }
                    }
                  />

                  <View style={{ flex: 1, justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'column' }}>
                        <Text style={styles.spname}>{vendorDetails?.vendor_name ?? 'Vendor'}</Text>
                        <Text style={styles.spratings}>{vendorDetails?.store_name ?? ''}</Text>
                      </View>

                      <View style={styles.vendorActions}>
                        {/* Correctly calls handleWhatsappVendor for contact */}
                        <TouchableOpacity onPress={handleWhatsappVendor}>
                          <Image source={whatsapp} style={styles.vendorIcon} />
                        </TouchableOpacity>
                        {/* Correctly calls handleCallVendor for contact */}
                        <TouchableOpacity onPress={handleCallVendor}>
                          <Image source={phone} style={styles.vendorIcon} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.vendorMetaRow}>
                      <Text style={styles.vendorMetaText}>Available</Text>
                      <Text style={styles.vendorMetaText}>-  Professional</Text>
                     
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>Pricing</Text>

              <View style={styles.paymentsection}>
                <View style={styles.priceItem}>
                  <Text style={styles.priceMain}>₹ {vehicleData.rentalprice_perday || '--'}</Text>
                  <Text style={styles.priceSub}>per Day</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceMain}>₹ {vehicleData.rentalprice_perhour || '--'}</Text>
                  <Text style={styles.priceSub}>per Hour</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceMain}>₹ {vehicleData.rentalprice_perkm || '--'}</Text>
                  <Text style={styles.priceSub}>per Km</Text>
                </View>
              </View>

              {/* RENT NOW: This is the main button that opens the modal */}
              <TouchableOpacity
                style={styles.rentBtn}
                onPress={() => {
                  console.log('Attempting to set modalVisible to true'); // 👈 DEBUG LOG ADDED HERE
                  setModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.rentBtnText}>Rent Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
         {/* The Modal component itself */}
      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirm Rental</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to rent <Text style={{ fontWeight: '700' }}>{title}</Text>?
            </Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalButton, styles.modalCancelBtn]}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSubmit} style={[styles.modalButton, styles.modalConfirmBtn]}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollViewContent: { flexGrow: 1 },
  linearGradient: { flex: 1, paddingBottom: 30 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  heroWrapper: { position: 'relative' },
  mainImage: { width: windowWidth, height: 260 },
  floatingContainerOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: -28,
    left: 20,
    right: 20,
  },
  floatercontainer: {
    flexDirection: 'column',
    borderRadius: 14,
    borderColor: '#f2c3a0',
    borderWidth: 1,
    width: (windowWidth - 60) / 3,
    paddingVertical: 8,
    backgroundColor: '#fff8f5',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 2 } }),
  },
  imagecard: { width: 26, height: 26, alignSelf: 'center', marginBottom: 4 },
  imageheading: { textAlign: 'center', fontSize: 13, fontWeight: '700' },
  imagedescription: { textAlign: 'center', fontSize: 10, color: '#6b6b6b', marginTop: 2, fontWeight: '600' },
  contentWrapper: { paddingHorizontal: 20, marginTop: 40 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4, color: '#262626' },
  subtitle: { fontSize: 12, textAlign: 'center', color: '#777', marginBottom: 18 },
  card: { backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f2f2f2', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 2 } }) },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#1f1f1f' },
  sectionBody: { fontSize: 13, lineHeight: 19, color: '#4b4b4b', textAlign: 'justify' },
  spcontainer: { marginTop: 4 },
  spCard: { width: '100%', flexDirection: 'row', alignItems: 'center', borderRadius: 12, gap: 14, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#fff', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }) },
  spimage: { width: 62, height: 62, borderRadius: 40, borderColor: '#ff8d6a', borderWidth: 0.8 },
  spname: { fontSize: 15, fontWeight: '600', color: '#1f1f1f' },
  spratings: { fontSize: 12, color: '#666' },
  vendorActions: { flexDirection: 'row', gap: 10 },
  vendorIcon: { width: 24, height: 24 },
  vendorMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8, alignItems: 'center' },
  vendorMetaText: { fontSize: 11, color: '#444' },
  vehicleTag: { fontSize: 11, backgroundColor: '#eaeaea', borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8, color: '#333' },
  paymentsection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 10, marginBottom: 16 },
  priceItem: { alignItems: 'center', flex: 1 },
  priceMain: { fontSize: 16, fontWeight: '700', color: '#1f1f1f' },
  priceSub: { fontSize: 11, color: '#777', marginTop: 2 },
  rentBtn: { backgroundColor: '#ff6d25', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 4, ...Platform.select({ ios: { shadowColor: 'rgba(255, 109, 37, 0.7)', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } }, android: { elevation: 3 } }) },
  rentBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15, letterSpacing: 0.4 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: windowWidth - 60, backgroundColor: '#ffffff', borderRadius: 14, paddingVertical: 18, paddingHorizontal: 18, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 6 } }) },
  modalTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 8, color: '#222' },
  modalBody: { fontSize: 13, textAlign: 'center', color: '#555', marginBottom: 16 },
  modalButtonsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  modalButton: { width: 110, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  modalCancelBtn: { backgroundColor: '#333333' },
  modalConfirmBtn: { backgroundColor: '#ff7a27' },
  modalCancelText: { color: '#ffffff', fontSize: 14, fontWeight: '500' },
  modalConfirmText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});

export default VehicleScreen;