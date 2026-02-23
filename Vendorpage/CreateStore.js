import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  TextInput,
  Text,
  Button,
  Checkbox,
  Surface,
} from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import RNPickerSelect from "react-native-picker-select";
import { launchImageLibrary } from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking } from "react-native";


import Geolocation from '@react-native-community/geolocation';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export default function CreateStoreWithKYC({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  /* ---------- STORE ---------- */
  const [storeName, setStoreName] = useState("");

               // Add these states at the top of your component
const [cities, setCities] = useState([]);
const [selectedCity, setSelectedCity] = useState(null);

// ... inside your return statement ...


  /* Category */
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [category, setCategory] = useState("");
  const [catLoading, setCatLoading] = useState(true);

  /* Address */
  const [statesData, setStatesData] = useState([]);
  const [stateLoading, setStateLoading] = useState(true);
  const [selectedState, setSelectedState] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [pincode, setPincode] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");

  const [logo, setLogo] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  /* ---------- KYC ---------- */
  const [holderName, setHolderName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upi, setUpi] = useState("");
  const [idProof, setIdProof] = useState(null);
  const [gstCert, setGstCert] = useState(null);
  const [agree, setAgree] = useState(false);



  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [mapUrl, setMapUrl] = useState('');

 


  const requestLocationPermission = async () => {
    const permission =
      Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

    const result = await request(permission);
    return result === RESULTS.GRANTED;
  };

  /* ================= GET LOCATION ================= */
  const getLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;

        setLatitude(latitude);
        setLongitude(longitude);

        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setMapUrl(url);
      },
      error => {
        Alert.alert('Location Error', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000,
      },
    );
  };

  /* ================= INIT ================= */
  useEffect(() => {
    (async () => {
      const granted = await requestLocationPermission();
      if (granted) {
        getLocation();
      } else {
        Alert.alert('Permission Required', 'Location permission denied');
      }
    })();
  }, []);


  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    AsyncStorage.getItem("user_id").then(setUserId);
    fetchCategories();
    fetchStates();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("https://masonshop.in/api/store_category");
      const json = await res.json();
      if (json.status) {
        setCategories(json.data.filter(i => i.status === "on"));
      }
    } catch {
      Alert.alert("Error", "Failed to load categories");
    } finally {
      setCatLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const res = await fetch("https://masonshop.in/api/getAllStatesData");
      const json = await res.json();
      setStatesData(json);
    } catch {
      Alert.alert("Error", "Failed to load states");
    } finally {
      setStateLoading(false);
    }
  };

  /* ---------- IMAGE PICK ---------- */
  const pickImage = (setFile) => {
    launchImageLibrary({ mediaType: "photo", quality: 0.7 }, (res) => {
      if (res.assets?.length) setFile(res.assets[0]);
    });
  };

  /* ---------- STEP 1 ---------- */
  const nextStep = () => {
    if (
      !storeName ||
      !categoryId ||
      !street ||
      !city ||
      !selectedState ||
      !selectedDistrict ||
      !pincode
    ) {
      return Alert.alert("Required", "Please fill all store details");
    }
    if (!logo) return Alert.alert("Logo Required", "Upload store logo");
    if (!termsAccepted) return Alert.alert("Terms", "Accept vendor terms");
    setStep(2);
  };

  /* ---------- SUBMIT (FIXED) ---------- */
  const submitAll = async () => {
    if (!holderName || !bankAccount || !ifsc)
      return Alert.alert("Required", "Enter bank details");

    // if (!idProof || !gstCert)
    //   return Alert.alert("Required", "Upload KYC documents");

    if (!agree)
      return Alert.alert("Confirm", "Confirm KYC details");

    setLoading(true);

    try {
      const fd = new FormData();

      fd.append("user_id", userId);
      fd.append("store_name", storeName);
      fd.append("category_id", categoryId);
      fd.append("category", category);
      fd.append("address", street);
      fd.append("city", city);
      fd.append("district", selectedDistrict);
      fd.append("state", selectedState);
      fd.append("latitude", latitude);
       fd.append("longitude", longitude);
       fd.append("mapUrl", mapUrl);
      fd.append("pincode", pincode);
      fd.append("holder_name", holderName);
      fd.append("account_no", bankAccount);
      fd.append("ifsc_code", ifsc);
      fd.append("upi_id", upi || "");

      const addFile = (key, file) => {
        if (!file || !file.uri) return;
        const uri =
          Platform.OS === "android"
            ? file.uri
            : file.uri.replace("file://", "");
        fd.append(key, {
          uri,
          type: file.type || "image/jpeg",
          name: file.fileName || `${key}_${Date.now()}.jpg`,
        });
      };

      addFile("logo", logo);
      addFile("id_proof", idProof);
      addFile("gst_image", gstCert);

      const res = await fetch("https://masonshop.in/api/vendor_store", {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      });

      const text = await res.text();
      console.log("API RESPONSE:", text);

      let result = {};
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error("Invalid server response");
      }

      if (res.ok && result.status !== false) {
        Alert.alert("Success", "Store registered successfully", [
          {
            text: "OK",
            onPress: () =>
              setTimeout(() => {
                navigation.replace("StoreDashboard");
              }, 300),
          },
        ]);
      } else {
        Alert.alert("Error", result.message || "Submission failed");
      }
    } catch (e) {
      console.log("SUBMIT ERROR:", e);
      Alert.alert("Error", "Server or upload error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>
          {step === 1 ? "Store Profile" : "KYC & Bank Details"}
        </Text>

        <Surface style={styles.card}>
          {step === 1 ? (
            <>
              <TextInput label="Store Name *" mode="outlined" value={storeName} onChangeText={setStoreName} style={styles.input} />

              <Text style={styles.label}>Category *</Text>
              {catLoading ? <ActivityIndicator /> : (
                <RNPickerSelect
                  placeholder={{ label: "Select Category", value: null }}
                  value={categoryId}
                  onValueChange={(v) => {
                    const sel = categories.find(i => i.id === v);
                    setCategoryId(v);
                    setCategory(sel?.category_name || "");
                  }}
                  items={categories.map(i => ({ label: i.category_name, value: i.id }))}
                  useNativeAndroidPickerStyle={false}
                  style={pickerSelectStyles}
                />
              )}

              <Text style={styles.label}>Store Logo *</Text>
              <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setLogo)}>
                {logo ? <Image source={{ uri: logo.uri }} style={styles.fullImage} /> : <Icon name="camera-plus" size={30} color="#DA1F49" />}
              </TouchableOpacity>

              <TextInput label="Street *" mode="outlined" value={street} onChangeText={setStreet} style={styles.input} />
              <TextInput label="City *" mode="outlined" value={city} onChangeText={setCity} style={styles.input} />


{/* ===== STATE ===== */}
<Text style={styles.label}>State *</Text>
{stateLoading ? <ActivityIndicator /> : (
  <RNPickerSelect
    placeholder={{ label: "Select State", value: null }}
    value={selectedState}
    onValueChange={(v) => {
      setSelectedState(v);
      setSelectedDistrict(null);
      setSelectedCity(null); // Reset City
      setPincode("");        // Reset Pincode
      
      const st = statesData.find(s => s.state === v);
      setDistricts(st?.districts || []);
    }}
    items={statesData.map(s => ({ label: s.state, value: s.state }))}
    useNativeAndroidPickerStyle={false}
    style={pickerSelectStyles}
  />
)}

{/* ===== DISTRICT ===== */}
<Text style={styles.label}>District *</Text>
<RNPickerSelect
  placeholder={{ label: "Select District", value: null }}
  value={selectedDistrict}
  onValueChange={(v) => {
    setSelectedDistrict(v);
    setSelectedCity(null); // Reset City
    setPincode("");        // Reset Pincode
    
    const d = districts.find(x => x.district === v);
    setCities(d?.offices || []); // Load Cities/Offices
  }}
  items={districts.map(d => ({ label: d.district, value: d.district }))}
  disabled={!districts.length}
  useNativeAndroidPickerStyle={false}
  style={pickerSelectStyles}
/>

{/* ===== CITY (Added) ===== */}
<Text style={styles.label}>City / Post Office *</Text>
<RNPickerSelect
  placeholder={{ label: "Select City", value: null }}
  value={selectedCity}
  onValueChange={(v) => {
    setSelectedCity(v);
    
    // Find the specific office object to get the Pincode
    const c = cities.find(x => x.officename === v);
    if (c) setPincode(c.pincode.toString());
  }}
  // Remove duplicates just in case multiple offices have same name
  items={[...new Set(cities.map(c => c.officename))].map(name => ({ label: name, value: name }))}
  disabled={!cities.length}
  useNativeAndroidPickerStyle={false}
  style={pickerSelectStyles}
/>
              {/* LOCATION INFO */}
{latitude && longitude && (
  <Surface style={styles.locationBox}>
    <Text style={styles.locationTitle}>📍 Store Location</Text>

    <Text>Latitude: {latitude}</Text>
    <Text>Longitude: {longitude}</Text>

    <TouchableOpacity
      onPress={() => {
        if (mapUrl) {
          Linking.openURL(mapUrl);
        }
      }}
      style={styles.mapBtn}
    >
      <Icon name="map-marker" size={20} color="#fff" />
      <Text style={styles.mapBtnText}>Open in Google Maps</Text>
    </TouchableOpacity>
  </Surface>
)}


              <TextInput label="Pincode *" mode="outlined" value={pincode} editable={false} style={styles.input} />

              <TouchableOpacity style={styles.checkboxRow} onPress={() => setTermsAccepted(!termsAccepted)}>
                <Checkbox status={termsAccepted ? "checked" : "unchecked"} />
                <Text>I accept vendor terms</Text>
              </TouchableOpacity>

              <Button mode="contained" onPress={nextStep}>Continue</Button>
            </>
          ) : (
            <>
              <TextInput label="Account Holder Name *" mode="outlined" value={holderName} onChangeText={setHolderName} style={styles.input} />
              <TextInput label="Account Number *" keyboardType="numeric" mode="outlined" value={bankAccount} onChangeText={setBankAccount} style={styles.input} />
              <TextInput label="IFSC Code *" mode="outlined" value={ifsc} onChangeText={setIfsc} style={styles.input} />

              <TouchableOpacity style={styles.fileBtn} onPress={() => pickImage(setIdProof)}>
                <Text>{idProof ? "ID Proof Selected" : "Upload ID Proof"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.fileBtn} onPress={() => pickImage(setGstCert)}>
                <Text>{gstCert ? "GST Selected" : "Upload GST Certificate"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.checkboxRow} onPress={() => setAgree(!agree)}>
                <Checkbox status={agree ? "checked" : "unchecked"} />
                <Text>I confirm KYC details</Text>
              </TouchableOpacity>

              {loading ? <ActivityIndicator /> : <Button mode="contained" onPress={submitAll}>Submit Application</Button>}
            </>
          )}
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9f9f9" },
  scroll: { padding: 20 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  card: { padding: 20, borderRadius: 15, backgroundColor: "#fff" },
  input: { marginBottom: 12 },
  label: { fontWeight: "bold", marginBottom: 6 },
  uploadBox: {
    height: 100,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  fullImage: { width: "100%", height: "100%" },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginVertical: 15 },
  fileBtn: { padding: 15, borderWidth: 1, borderRadius: 10, marginBottom: 10 },
  locationBox: {
  padding: 15,
  marginBottom: 15,
  borderRadius: 12,
  backgroundColor: "#F1F8FF",
},
locationTitle: {
  fontWeight: "bold",
  marginBottom: 8,
  fontSize: 16,
},
mapBtn: {
  marginTop: 10,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#1976D2",
  padding: 10,
  borderRadius: 8,
},
mapBtnText: {
  color: "#fff",
  marginLeft: 6,
  fontWeight: "bold",
},

});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: { fontSize: 16, padding: 14, borderWidth: 1, borderRadius: 10, marginBottom: 15, backgroundColor: "#fff" },
  inputAndroid: { fontSize: 16, padding: 14, borderWidth: 1, borderRadius: 10, marginBottom: 15, backgroundColor: "#fff" },
});
