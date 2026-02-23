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
  Modal,
  Dimensions,
} from "react-native";
import { TextInput, Text, Button, Checkbox, Surface, Divider } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { launchImageLibrary } from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get('window');

export default function CreateStoreWithKYC({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  /* --- Preview Modal State --- */
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUri, setPreviewUri] = useState(null);

  /* ---------- STORE STATES ---------- */
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [pincode, setPincode] = useState("");
  const [stateName, setStateName] = useState("");
  const [logo, setLogo] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  /* ---------- KYC STATES ---------- */
  const [holderName, setHolderName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upi, setUpi] = useState("");
  const [idProof, setIdProof] = useState(null);
  const [gstCert, setGstCert] = useState(null);
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("user_id").then((val) => {
      if (val) setUserId(val);
    });
  }, []);

  const pickImage = (setFile) => {
    launchImageLibrary({ mediaType: "photo", quality: 0.7 }, (res) => {
      if (res.assets && res.assets.length > 0) {
        setFile(res.assets[0]);
      }
    });
  };

  const handlePreview = (uri) => {
    setPreviewUri(uri);
    setPreviewVisible(true);
  };

  const nextStep = () => {
    if (!storeName || !category || !street || !city || !district || !pincode || !stateName) {
      return Alert.alert("Required", "Please fill all business and address fields.");
    }
    if (!logo) return Alert.alert("Logo Required", "Please upload a store logo.");
    if (!termsAccepted) return Alert.alert("Terms", "Please accept vendor terms.");
    setStep(2);
  };

  const submitAll = async () => {
    if (!holderName || !bankAccount || !ifsc) return Alert.alert("Required", "Fill bank details");
    if (!idProof || !gstCert) return Alert.alert("Uploads", "ID Proof and GST are required");
    if (!agree) return Alert.alert("Terms", "Agree to KYC details");

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("user_id", userId || "");
      formData.append("store_name", storeName);
      formData.append("category", category);
      formData.append("description", description || "");
      formData.append("address", street);
      formData.append("city", city);
      formData.append("district", district);
      formData.append("state", stateName);
      formData.append("pincode", pincode);
      formData.append("holder_name", holderName);
      formData.append("account_no", bankAccount);
      formData.append("ifsc_code", ifsc);
      formData.append("upi_id", upi || "");

      const appendFile = (key, file) => {
        if (file) {
          formData.append(key, {
            uri: Platform.OS === "android" ? file.uri : file.uri.replace("file://", ""),
            type: file.type || "image/jpeg",
            name: file.fileName || `${key}.jpg`,
          });
        }
      };

      appendFile("logo", logo);
      appendFile("id_proof", idProof);
      appendFile("gst_image", gstCert);

      const response = await fetch("https://masonshop.in/api/vendor_store", {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" },
      });

      const result = await response.json();
      setLoading(false);

      if (response.ok || result.status === true) {
        Alert.alert("Success", "Store Registered Successfully!", [
          { text: "OK", onPress: () => navigation.replace("StoreDashboard") }
        ]);
      } else {
        Alert.alert("Error", result.message || "Submission failed");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Network Error", "Check your internet connection.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* --- FULL SCREEN IMAGE PREVIEW MODAL --- */}
      <Modal visible={previewVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.closeArea} onPress={() => setPreviewVisible(false)} />
          <View style={styles.modalBody}>
            <Image source={{ uri: previewUri }} style={styles.fullPreview} resizeMode="contain" />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPreviewVisible(false)}>
              <Icon name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Progress Header */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: "#DA1F49" }]} />
        <View style={[styles.progressBar, { backgroundColor: step === 2 ? "#DA1F49" : "#E5E5E5" }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.headerTitle}>{step === 1 ? "Business Details" : "KYC & Verification"}</Text>

        <Surface style={styles.card} elevation={2}>
          {step === 1 ? (
            /* STEP 1: STORE PROFILE */
            <View>
              <TextInput label="Store Name *" mode="outlined" value={storeName} onChangeText={setStoreName} style={styles.input} />
              <TextInput label="Business Category *" mode="outlined" value={category} onChangeText={setCategory} style={styles.input} />
              
              <Text style={styles.label}>Store Logo *</Text>
              <TouchableOpacity style={styles.logoUpload} onPress={() => logo ? handlePreview(logo.uri) : pickImage(setLogo)}>
                {logo ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: logo.uri }} style={styles.fullImage} />
                    <TouchableOpacity style={styles.removeIcon} onPress={() => setLogo(null)}>
                      <Icon name="close-circle" size={24} color="red" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{alignItems: 'center'}}><Icon name="camera-plus" size={35} color="#DA1F49" /><Text style={{fontSize: 12, color: '#666'}}>Tap to Upload</Text></View>
                )}
              </TouchableOpacity>

              <Divider style={styles.divider} />
              <Text style={styles.sectionTitle}>Address Info</Text>
              <TextInput label="Street Address *" mode="outlined" value={street} onChangeText={setStreet} style={styles.input} />
              <View style={styles.row}>
                <TextInput label="City *" mode="outlined" value={city} onChangeText={setCity} style={[styles.input, { flex: 1, marginRight: 8 }]} />
                <TextInput label="District *" mode="outlined" value={district} onChangeText={setDistrict} style={[styles.input, { flex: 1 }]} />
              </View>
              <View style={styles.row}>
                <TextInput label="State *" mode="outlined" value={stateName} onChangeText={setStateName} style={[styles.input, { flex: 1, marginRight: 8 }]} />
                <TextInput label="Pincode *" mode="outlined" keyboardType="numeric" value={pincode} onChangeText={setPincode} style={[styles.input, { flex: 1 }]} />
              </View>

              <TouchableOpacity style={styles.checkRow} onPress={() => setTermsAccepted(!termsAccepted)}>
                <Checkbox status={termsAccepted ? "checked" : "unchecked"} color="#DA1F49" />
                <Text style={{flex: 1}}>I agree to the Merchant Terms & Conditions</Text>
              </TouchableOpacity>

              <Button mode="contained" onPress={nextStep} style={styles.mainBtn} contentStyle={{height: 50}}>Next Step</Button>
            </View>
          ) : (
            /* STEP 2: KYC & BANKING */
            <View>
              <TextInput label="Account Holder Name *" mode="outlined" value={holderName} onChangeText={setHolderName} style={styles.input} />
              <TextInput label="Account Number *" mode="outlined" keyboardType="numeric" value={bankAccount} onChangeText={setBankAccount} style={styles.input} />
              <TextInput label="IFSC Code *" mode="outlined" autoCapitalize="characters" value={ifsc} onChangeText={setIfsc} style={styles.input} />
              
              <Text style={[styles.label, {marginTop: 10}]}>KYC Documents (ID & GST) *</Text>
              
              {/* ID PROOF PREVIEW ROW */}
              <View style={styles.documentRow}>
                <TouchableOpacity style={[styles.fileBtn, {flex: 1}]} onPress={() => pickImage(setIdProof)}>
                  <Icon name={idProof ? "check-circle" : "card-account-details-outline"} size={24} color={idProof ? "green" : "#DA1F49"} />
                  <Text style={styles.fileBtnText} numberOfLines={1}>{idProof ? "ID Proof Added" : "Select ID Proof"}</Text>
                </TouchableOpacity>
                {idProof && (
                  <TouchableOpacity style={styles.thumbnailBtn} onPress={() => handlePreview(idProof.uri)}>
                    <Image source={{ uri: idProof.uri }} style={styles.thumbnail} />
                    <View style={styles.previewOverlay}><Icon name="eye" size={14} color="#fff" /></View>
                  </TouchableOpacity>
                )}
              </View>

              {/* GST CERT PREVIEW ROW */}
              <View style={styles.documentRow}>
                <TouchableOpacity style={[styles.fileBtn, {flex: 1}]} onPress={() => pickImage(setGstCert)}>
                  <Icon name={gstCert ? "check-circle" : "file-document-outline"} size={24} color={gstCert ? "green" : "#DA1F49"} />
                  <Text style={styles.fileBtnText} numberOfLines={1}>{gstCert ? "GST Certificate Added" : "Select GST Cert"}</Text>
                </TouchableOpacity>
                {gstCert && (
                  <TouchableOpacity style={styles.thumbnailBtn} onPress={() => handlePreview(gstCert.uri)}>
                    <Image source={{ uri: gstCert.uri }} style={styles.thumbnail} />
                    <View style={styles.previewOverlay}><Icon name="eye" size={14} color="#fff" /></View>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={styles.checkRow} onPress={() => setAgree(!agree)}>
                <Checkbox status={agree ? "checked" : "unchecked"} color="#DA1F49" />
                <Text style={{flex: 1}}>I confirm the banking details are correct</Text>
              </TouchableOpacity>

              {loading ? (
                <ActivityIndicator size="large" color="#DA1F49" style={{ marginVertical: 15 }} />
              ) : (
                <Button mode="contained" onPress={submitAll} style={styles.mainBtn} contentStyle={{height: 50}}>Complete Registration</Button>
              )}
              
              <Button mode="text" onPress={() => setStep(1)} style={{marginTop: 10}} labelStyle={{color: '#666'}}>Back to Store Profile</Button>
            </View>
          )}
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f9fc" },
  progressContainer: { flexDirection: "row", height: 5, paddingHorizontal: 20, marginTop: 15 },
  progressBar: { flex: 1, marginHorizontal: 3, borderRadius: 10 },
  scroll: { padding: 20, paddingBottom: 40 },
  headerTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#222" },
  card: { padding: 18, borderRadius: 15, backgroundColor: "#fff", elevation: 4 },
  input: { marginBottom: 14, backgroundColor: "#fff" },
  label: { fontWeight: "bold", marginBottom: 8, color: "#444" },
  sectionTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 12, color: "#DA1F49" },
  row: { flexDirection: "row" },
  logoUpload: {
    height: 130, borderStyle: "dashed", borderWidth: 1.5, borderColor: "#DA1F49",
    borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 20, backgroundColor: '#fff5f6'
  },
  imageContainer: { width: "100%", height: "100%", position: 'relative' },
  fullImage: { width: "100%", height: "100%", borderRadius: 12 },
  removeIcon: { position: 'absolute', top: 5, right: 5, backgroundColor: '#fff', borderRadius: 15 },
  checkRow: { flexDirection: "row", alignItems: "center", marginVertical: 12 },
  mainBtn: { backgroundColor: "#DA1F49", borderRadius: 8, marginTop: 10 },
  divider: { marginVertical: 15 },

  /* --- Document Section Styles --- */
  documentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  fileBtn: {
    flexDirection: "row", alignItems: "center", padding: 15, borderWidth: 1,
    borderColor: "#ddd", borderRadius: 10, borderStyle: "dashed", backgroundColor: '#fafafa'
  },
  fileBtnText: { marginLeft: 10, color: "#555", fontSize: 14, fontWeight: '500' },
  thumbnailBtn: { marginLeft: 12, position: 'relative' },
  thumbnail: { width: 55, height: 55, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
  previewOverlay: { 
    position: 'absolute', bottom: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', 
    borderBottomRightRadius: 8, borderTopLeftRadius: 8, padding: 3 
  },

  /* --- Modal Styles --- */
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" },
  closeArea: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  modalBody: { width: width * 0.9, height: height * 0.7, justifyContent: 'center', alignItems: 'center' },
  fullPreview: { width: '100%', height: '100%' },
  modalCloseBtn: { position: 'absolute', top: -50, right: 0, padding: 10 }
});