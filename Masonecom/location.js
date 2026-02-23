import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
  PermissionsAndroid,
} from "react-native";
import { 
  Appbar, TextInput, IconButton, Divider, Text, List, 
  ActivityIndicator, Button, Searchbar 
} from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Geolocation from "@react-native-community/geolocation";
import { useIsFocused } from "@react-navigation/native";
import { useQueryClient } from '@tanstack/react-query';

const ADDRESS_STORE_API_URL = "https://masonshop.in/api/address_store";
const ADDRESS_SHOW_API_URL = "https://masonshop.in/api/address_show";
const ADDRESS_DELETE_API_URL = "https://masonshop.in/api/address_delete";
const GOOGLE_API_KEY = "AIzaSyAIYXornd93q38EIYOELtmWwNtRmxoLaTg"; 
const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

export default function LocationScreen({ navigation, route }) {
  const queryClient = useQueryClient();
  const isFocused = useIsFocused();
  
  // States
  const [userPhone, setUserPhone] = useState(null);
  const [addressSearch, setAddressSearch] = useState("");
  const [savedLocations, setSavedLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(false); 
  const [isSaving, setIsSaving] = useState(false); 
  const [isLocating, setIsLocating] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [doorNo, setDoorNo] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [directions, setDirections] = useState("");
  const [label, setLabel] = useState("Home");

  const showToast = (msg) => ToastAndroid.showWithGravity(msg, ToastAndroid.SHORT, ToastAndroid.BOTTOM);

 // --- 1. STRICT SESSION LOAD ---
  useEffect(() => {
    const getUniqueUser = async () => {
      // 1. Clear existing data immediately to prevent showing old user's address
      setSavedLocations([]);
      setFilteredLocations([]);
      
      let phone = route.params?.phone;
      console.log("Phone from params:", phone);

      // 2. If no phone in params, try AsyncStorage
      if (!phone) {
        phone = await AsyncStorage.getItem("phone");
        console.log("Phone from AsyncStorage:", phone);
      }

   

      // 4. Validate and Load
      if (phone && phone !== "guest" && phone !== "") {
        setUserPhone(phone);
        loadSavedAddress(phone);
      } else {
        showToast("Session Error: Please Login");
      }
    };

    if (isFocused) {
      getUniqueUser();
    }
  }, [isFocused, route.params?.phone]); // Added dependency to re-run if params change

  // --- 2. API: FETCH ONLY FOR CURRENT USER ---
  const loadSavedAddress = async (phoneId) => {
    setIsLoading(true);
    try {
      // Ensure we are passing the unique user ID to the API
      const response = await fetch(`${ADDRESS_SHOW_API_URL}?user_id=${phoneId}`);
      const data = await response.json();

      if (data && data.status === true && Array.isArray(data.data)) {
        const apiAddresses = data.data.map(item => ({
          id: String(item.id), 
          label: item.site_name || "Other",
          fullAddress: item.full_address,
          city: item.city,
          pincode: item.zip_code
        }));
        setSavedLocations(apiAddresses);
        setFilteredLocations(apiAddresses);
      } else {
        setSavedLocations([]);
        setFilteredLocations([]);
      }

      // Load selected state specific to THIS phone number
      const selected = await AsyncStorage.getItem(`selected_address_${phoneId}`);
      if (selected) setSelectedId(JSON.parse(selected).id);

    } catch (error) {
      console.log("Fetch Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- GPS Logic ---
  const handleCurrentLocation = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) return showToast("Permission Denied");
    }

    setIsLocating(true);
    Geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`${GOOGLE_GEOCODE_URL}?latlng=${pos.coords.latitude},${pos.coords.longitude}&key=${GOOGLE_API_KEY}`);
          const data = await res.json();
          if (data.status === "OK") {
            const comp = data.results[0].address_components;
            const getComp = (t) => comp.find(c => c.types.includes(t))?.long_name || "";
            setDoorNo(getComp('street_number') || getComp('premise'));
            setStreet(getComp('sublocality_level_1') || getComp('route'));
            setCity(getComp('locality'));
            setPincode(getComp('postal_code'));
            setModalVisible(true);
          }
        } catch (e) { showToast("GPS Search Failed"); }
        finally { setIsLocating(false); }
      },
      () => { setIsLocating(false); showToast("Turn on Location Services"); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // --- API: SAVE FOR UNIQUE USER ---
  const handleSave = async () => {
    if (!doorNo || !street || !city || !pincode) return showToast("Required fields missing");
    if (!userPhone) return showToast("Invalid Session");

    setIsSaving(true);
    const apiData = {
        user_id: userPhone, 
        full_address: `${doorNo}, ${street}, ${city} - ${pincode}`, 
        city, location: street, zip_code: pincode, phone: userPhone,
        site_name: label, district: directions || "NA",
        latitude: "0.0", longitude: "0.0", state: "NA", country: "India",
    };

    try {
        const response = await fetch(ADDRESS_STORE_API_URL, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiData),
        });
        const data = await response.json();
        if (data.status === true) {
            loadSavedAddress(userPhone);
            setModalVisible(false);
            resetModalFields();
            showToast("Address Added");
        }
    } catch (e) { showToast("Error saving address"); } finally { setIsSaving(false); }
  };

  const resetModalFields = () => {
    setDoorNo(""); setStreet(""); setCity(""); setPincode(""); setDirections(""); setLabel("Home");
  };

  const selectAddress = async (item) => {
    await AsyncStorage.setItem(`selected_address_${userPhone}`, JSON.stringify(item));
    queryClient.invalidateQueries({ queryKey: ['selectedAddress'] });
    setSelectedId(item.id);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={{ backgroundColor: "#fff", elevation: 0 }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="My Addresses" titleStyle={{fontWeight: 'bold', color: '#333'}} />
      </Appbar.Header>

      <ScrollView style={{ padding: 15 }}>
        <Searchbar 
            placeholder="Search your addresses" 
            value={addressSearch} 
            onChangeText={(t) => {
                setAddressSearch(t);
                setFilteredLocations(savedLocations.filter(loc => loc.fullAddress.toLowerCase().includes(t.toLowerCase())));
            }} 
            style={styles.search} 
        />

        <View style={styles.row}>
          <TouchableOpacity style={[styles.button, { backgroundColor: "#ffe6e6" }]} onPress={handleCurrentLocation} disabled={isLocating}>
            {isLocating ? <ActivityIndicator size="small" color="#DA1F49" /> : <><Icon name="crosshairs-gps" size={22} color="#DA1F49" /><Text style={styles.btnTxtRed}> Current</Text></>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: "#f0f0f0" }]} onPress={() => { resetModalFields(); setModalVisible(true); }}>
            <Icon name="plus" size={22} color="#444" /><Text style={{color: '#444', fontWeight: 'bold'}}> Add New</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? <ActivityIndicator color="#DA1F49" style={{marginTop: 50}} /> : 
          filteredLocations.length > 0 ? filteredLocations.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => selectAddress(item)}>
              <List.Item
                title={item.label}
                description={item.fullAddress}
                left={() => <Icon name="map-marker-radius" size={24} color={selectedId === item.id ? "#DA1F49" : "#999"} style={{alignSelf: 'center'}} />}
                right={() => selectedId === item.id ? <Icon name="check-circle" size={24} color="green" style={{alignSelf: 'center'}} /> : null}
                titleStyle={{ fontWeight: 'bold', color: selectedId === item.id ? "#DA1F49" : "#333" }}
              />
              <Divider />
            </TouchableOpacity>
          )) : (
            <View style={{marginTop: 100, alignItems: 'center'}}>
                <Icon name="map-marker-off" size={50} color="#ccc" />
                <Text style={{color: '#999', marginTop: 10}}>No addresses found for this account</Text>
            </View>
          )
        }
      </ScrollView>

      {/* --- MODAL KEYBOARD FIX --- */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
               <Text style={styles.modalHeader}>Deliver To</Text>
               <IconButton icon="close" onPress={() => setModalVisible(false)} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput style={styles.input} mode="outlined" label="House/Flat No" value={doorNo} onChangeText={setDoorNo} theme={theme} />
              <TextInput style={styles.input} mode="outlined" label="Street / Area" value={street} onChangeText={setStreet} theme={theme} />
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <TextInput style={[styles.input, {flex: 0.55}]} mode="outlined" label="City" value={city} onChangeText={setCity} theme={theme} />
                <TextInput style={[styles.input, {flex: 0.4}]} mode="outlined" label="Pincode" value={pincode} keyboardType="numeric" maxLength={6} onChangeText={setPincode} theme={theme} />
              </View>
              <TextInput style={styles.input} mode="outlined" label="Landmark (Optional)" value={directions} onChangeText={setDirections} theme={theme} />
              <View style={styles.labelRow}>
                {["Home", "Work", "Other"].map(l => (
                  <TouchableOpacity key={l} onPress={() => setLabel(l)} style={[styles.labelBtn, label === l && styles.labelBtnActive]}>
                    <Text style={{ color: label === l ? '#fff' : '#000' }}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Button mode="contained" onPress={handleSave} loading={isSaving} style={styles.saveBtn}>Confirm Address</Button>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const theme = { colors: { primary: '#DA1F49' }, roundness: 12 };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  search: { marginBottom: 15, elevation: 0, borderWidth: 1, borderColor: '#eee', borderRadius: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  button: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 12, marginHorizontal: 5 },
  btnTxtRed: { color: "#DA1F49", fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '85%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalHeader: { fontSize: 20, fontWeight: 'bold' },
  input: { marginBottom: 10, backgroundColor: '#fff' },
  labelRow: { flexDirection: 'row', marginVertical: 15 },
  labelBtn: { paddingVertical: 8, paddingHorizontal: 20, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, marginRight: 10 },
  labelBtnActive: { backgroundColor: '#DA1F49', borderColor: '#DA1F49' },
  saveBtn: { backgroundColor: '#DA1F49', padding: 5, borderRadius: 10 }
});