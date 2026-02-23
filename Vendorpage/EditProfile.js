import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { launchImageLibrary } from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function EditProfile() {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");

  // --- READ-ONLY STATES ---
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("");
  const [vendorType, setVendorType] = useState("store"); // Added to track if it's 'vehicle' or 'store'

  // --- EDITABLE FORM STATES ---
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");
  const [holderName, setHolderName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upi, setUpi] = useState("");

  // --- FILE STATES ---
  const [logo, setLogo] = useState(null);
  const [idProof, setIdProof] = useState(null);
  const [gstCert, setGstCert] = useState(null);

  useEffect(() => {
    fetchVendorDetails();
  }, []);

  const fetchVendorDetails = async () => {
    const userid = await AsyncStorage.getItem('user_id');
    setUserId(userid);
    setLoading(true);
    try {
      const response = await fetch(`https://masonshop.in/api/vendordetails_by_id?user_id=${userid}`);
      const result = await response.json();
      if (result.status && result.data) {
        const d = result.data;
        
        // Dynamic Type (Vehicle or Store)
        setVendorType(d.type || "store");

        // Set Read-Only Fields
        setStoreName(d.store_name || "");
        setCategory(d.category || "");
        
        // Set Editable Fields
        setAddress(d.address || "");
        setCity(d.city || "");
        setPincode(d.pincode || "");
        setService(d.service || "");
        setLocation(d.location || "");
        setHolderName(d.holder_name || "");
        setBankAccount(d.account_no || "");
        setIfsc(d.ifsc_code || "");
        setUpi(d.upi_id || "");
        setLogo(d.logo);
        setIdProof(d.id_proof);
        setGstCert(d.gst_image);
      }
    } catch (error) {
      Alert.alert("Error", "Could not fetch profile details");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = (type) => {
    launchImageLibrary({ mediaType: "photo", quality: 0.7 }, (response) => {
      if (response.didCancel || !response.assets) return;
      const file = response.assets[0];
      if (type === "logo") setLogo(file);
      if (type === "id") setIdProof(file);
      if (type === "gst") setGstCert(file);
    });
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("address", address);
      formData.append("city", city);
      formData.append("pincode", pincode);
      formData.append("location", location);
      formData.append("service", service);
      formData.append("account_no", bankAccount);
      formData.append("upi_id", upi);
      formData.append("holder_name", holderName);
      formData.append("ifsc_code", ifsc);

      const appendFile = (key, file) => {
        if (file && typeof file === 'object' && file.uri) {
          const uri = Platform.OS === "android" ? file.uri : file.uri.replace("file://", "");
          formData.append(key, {
            uri: uri,
            type: file.type || "image/jpeg",
            name: file.fileName || `${key}.jpg`,
          });
        }
      };

      appendFile("logo", logo);
      appendFile("id_proof", idProof);
      appendFile("gst_image", gstCert);

      const response = await fetch("https://masonshop.in/api/store_edit", {
        method: "POST",
        body: formData,
        headers: { 
            "Accept": "application/json",
            "Content-Type": "multipart/form-data",
        },
      });

      const result = await response.json();
      if (result.status) {
        Alert.alert("Success", "Profile updated!");
      } else {
        Alert.alert("Update Failed", result.message);
      }
    } catch (e) {
      Alert.alert("Error", "Update failed. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  const SectionHeader = ({ title, icon }) => (
    <View style={styles.sectionHeader}>
      <Icon name={icon} size={20} color="#2E7D32" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  if (loading && !storeName) {
      return <View style={styles.loader}><ActivityIndicator size="large" color="#2E7D32" /></View>;
  }

  // Determine prefix based on the API 'type'
  const displayPrefix = vendorType?.toLowerCase() === 'vehicle' ? 'Vehicle' : 'Store';

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* LOGO */}
        <View style={styles.logoSection}>
          <TouchableOpacity onPress={() => pickImage("logo")}>
            {logo ? (
              <Image source={{ uri: typeof logo === 'string' ? logo : logo.uri }} style={styles.fullImage} />
            ) : (
              <View style={styles.logoPlaceholder}><Icon name="store" size={40} color="#999" /></View>
            )}
            <Icon name="camera" size={20} color="#2E7D32" style={styles.camIcon} />
          </TouchableOpacity>
        </View>

        {/* 1. READ ONLY INFO (Dynamically updated based on type) */}
        <SectionHeader title={`${displayPrefix} Identity`} icon={vendorType?.toLowerCase() === 'vehicle' ? 'car' : 'shield-check'} />
        <TextInput 
          label={`${displayPrefix} Name (Fixed)`} 
          mode="outlined" 
          value={storeName} 
          editable={false} 
          style={[styles.input, styles.readOnlyInput]} 
        />
        <TextInput 
          label={`${displayPrefix} Category (Fixed)`} 
          mode="outlined" 
          value={category} 
          editable={false} 
          style={[styles.input, styles.readOnlyInput]} 
        />

        {/* 2. EDITABLE ADDRESS */}
        <SectionHeader title="Update Details" icon="pencil-outline" />
        <TextInput label="Address" mode="outlined" value={address} onChangeText={setAddress} style={styles.input} />
        <TextInput label="Service Type" mode="outlined" value={service} onChangeText={setService} style={styles.input} />
        
        <View style={styles.row}>
          <TextInput label="City" mode="outlined" value={city} onChangeText={setCity} style={[styles.input, { flex: 1, marginRight: 10 }]} />
          <TextInput label="Pincode" mode="outlined" keyboardType="numeric" value={pincode} onChangeText={setPincode} style={[styles.input, { flex: 1 }]} />
        </View>

        {/* 3. BANKING */}
        <SectionHeader title="Bank Details" icon="bank-outline" />
        <TextInput label="Account Holder" mode="outlined" value={holderName} onChangeText={setHolderName} style={styles.input} />
        <TextInput label="Account Number" mode="outlined" keyboardType="numeric" value={bankAccount} onChangeText={setBankAccount} style={styles.input} />
        <TextInput label="IFSC Code" mode="outlined" value={ifsc} onChangeText={setIfsc} style={styles.input} />

        {/* 4. DOCUMENTS */}
        <SectionHeader title="Documents" icon="file-document-outline" />
        <View style={styles.docRow}>
          <TouchableOpacity style={styles.docBox} onPress={() => pickImage("id")}>
            {idProof ? <Image source={{ uri: typeof idProof === 'string' ? idProof : idProof.uri }} style={styles.docImg} /> : <Icon name="card-account-details-outline" size={30} color="#999" />}
            <Text style={styles.docText}>ID Proof</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.docBox} onPress={() => pickImage("gst")}>
            {gstCert ? <Image source={{ uri: typeof gstCert === 'string' ? gstCert : gstCert.uri }} style={styles.docImg} /> : <Icon name="file-certificate-outline" size={30} color="#999" />}
            <Text style={styles.docText}>GST Image</Text>
          </TouchableOpacity>
        </View>

        <Button mode="contained" onPress={handleUpdate} style={styles.saveBtn} loading={loading} disabled={loading}>
          Save Changes
        </Button>
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#fff" },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { paddingHorizontal: 20, paddingTop: 40 },
  logoSection: { alignItems: "center", marginBottom: 20 },
  logoPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#F5F5F5", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#DDD" },
  fullImage: { width: 90, height: 90, borderRadius: 45 },
  camIcon: { position: "absolute", bottom: 0, right: 0, backgroundColor: "#fff", borderRadius: 10, padding: 2, elevation: 3 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginTop: 20, marginBottom: 10 },
  sectionTitle: { marginLeft: 8, fontSize: 14, fontWeight: "bold", color: "#666", textTransform: 'uppercase' },
  input: { backgroundColor: "#fff", marginBottom: 10 },
  readOnlyInput: { backgroundColor: "#F9F9F9" }, // Visual cue for non-editable
  row: { flexDirection: "row" },
  docRow: { flexDirection: "row", justifyContent: "space-between" },
  docBox: { width: "48%", height: 100, borderWidth: 1, borderColor: "#EEE", borderRadius: 8, backgroundColor: "#FAFAFA", justifyContent: "center", alignItems: "center", overflow: 'hidden' },
  docImg: { width: '100%', height: '100%' },
  docText: { fontSize: 10, color: "#999", position: 'absolute', bottom: 5 },
  saveBtn: { backgroundColor: "#2E7D32", paddingVertical: 4, marginTop: 30, borderRadius: 8 },
});