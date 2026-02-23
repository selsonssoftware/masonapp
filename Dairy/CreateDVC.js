import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  FlatList,
  PermissionsAndroid,
  Platform,
  KeyboardAvoidingView
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import Geolocation from '@react-native-community/geolocation';
import { Picker } from '@react-native-picker/picker'; // ✅ IMPORT PICKER
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#3f229eff",
  bg: "#F8FAFC",
  white: "#FFFFFF",
  muted: "#64748B",
  border: "#E2E8F0",
  success: "#10B981"
};

const CreateDVC = ({ navigation }) => {
  /* ========================= STATE ========================= */
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Data States
  const [themes, setThemes] = useState([]);
  const [categories, setCategories] = useState([]); // ✅ CATEGORIES STATE
  
  const [form, setForm] = useState({
    theme_id: null,
    name: "",
    mobile: "",
    whatsapp: "",
    jobRole: "",
    serviceCategory: "", // Selected from Dropdown
    website: "",
    email: "",
    address: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    
    // Location
    latitude: "",
    longitude: "",
    map_url: "",

    // Business
    companyName: "",
    establishmentYear: "",
    businessNature: "",
    specialties: "",
    description: "",

    // Service
    serviceName: "",
    servicePrice: "",
    serviceContent: "",

    // Payment
    paytm: "",
    phonepe: "",
    gpay: "",
    bankName: "",
    ifsc: "",
    accountNumber: "",

    // Social
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    keywords: "",
    otherLink: "",
  });

  const [images, setImages] = useState({
    logo: null,
    serviceImage: null,
    qr: null,
    gallery: [],
  });

  /* ========================= EFFECTS ========================= */
  useEffect(() => {
    fetchThemes();
    fetchCategories(); // ✅ FETCH CATEGORIES
  }, []);

  const fetchThemes = async () => {
    try {
      const res = await fetch("https://masonshop.in/api/theme");
      const json = await res.json();
      if (json.success) setThemes(json.message);
    } catch (e) { console.log("Theme Error", e); }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("https://masonshop.in/api/Category_dairy");
      const json = await response.json();
      if (json.status && json.Diary_category) {
        setCategories(json.Diary_category);
      }
    } catch (error) { console.error("Category Error:", error); }
  };

  const updateField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* ========================= GEOLOCATION LOGIC ========================= */

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization("whenInUse");
      return auth === "granted";
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "We need access to your location.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
  };

  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert("Permission Denied", "Location permission is required.");
      return;
    }

    setLocationLoading(true);

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // ✅ FIX: Generate Google Maps URL
        const googleMapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

        setForm((prev) => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          map_url: googleMapUrl // ✅ Save URL
        }));

        setLocationLoading(false);
        Alert.alert("Success", "Location fetched successfully!");
      },
      (error) => {
        setLocationLoading(false);
        Alert.alert("Error", "Failed to get location.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  /* ========================= IMAGE PICKER ========================= */
  const pickImage = async (key, multiple = false) => {
    const res = await launchImageLibrary({
      mediaType: "photo",
      selectionLimit: multiple ? 5 : 1,
    });
    if (!res.assets) return;

    setImages((prev) => ({
      ...prev,
      [key]: multiple ? res.assets : res.assets[0],
    }));
  };

  /* ========================= SUBMIT ========================= */
  const submitForm = async () => {
    if(!form.theme_id) {
        Alert.alert("Error", "Please select a theme first.");
        setCurrentStep(1);
        return;
    }
    let userId = await AsyncStorage.getItem('user_id');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("user_id", userId);
      fd.append("theme_id", form.theme_id);

      // Personal
      fd.append("person_name", form.name);
      fd.append("mobile_num2", form.mobile);
      fd.append("Whatsapp_num", form.whatsapp);
      fd.append("jobroll", form.jobRole);
      fd.append("category", form.serviceCategory);
      fd.append("website_name", form.website);
      fd.append("gmail", form.email);
      fd.append("address", form.address);
      fd.append("city", form.city);
      fd.append("state", form.state);
      fd.append("district", form.district);
      fd.append("location", form.city); // Or map_url if API supports it

      // Location
      fd.append("latitude", form.latitude);
      fd.append("longitude", form.longitude);
      
      // Social
      fd.append("facebook", form.facebook);
      fd.append("instagram", form.instagram);
      fd.append("twitter", form.twitter);
      fd.append("youtube", form.youtube);

      // Business
      fd.append("keyword", form.keywords);
      fd.append("otherlinks", form.otherLink);
      fd.append("site_name", form.companyName);
      fd.append("type", form.businessNature);
      fd.append("title", form.serviceName);
      fd.append("description", form.description);

      // Images
      if (images.logo) {
        fd.append("logo", { uri: images.logo.uri, name: "logo.jpg", type: "image/jpeg" });
      }
      if (images.serviceImage) {
        fd.append("image", { uri: images.serviceImage.uri, name: "image.jpg", type: "image/jpeg" });
      }
      if (images.gallery[0]) {
        fd.append("site_image", { uri: images.gallery[0].uri, name: "site.jpg", type: "image/jpeg" });
      }

      const res = await fetch("https://masonshop.in/api/dvc_all", {
        method: "POST",
        body: fd,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const json = await res.json();

      if (json.success) {
        Alert.alert("Success", "Digital Visiting Card Created!");
        navigation.goBack();
      } else {
        Alert.alert("Error", json.message || "Failed to create card.");
      }
    } catch (e) {
      Alert.alert("Error", "Network Error");
    } finally {
      setLoading(false);
    }
  };

  /* ========================= NAVIGATION ========================= */
  const nextStep = () => {
    if (currentStep === 1 && !form.theme_id) {
        Alert.alert("Wait", "Please select a theme design to proceed.");
        return;
    }
    setCurrentStep(prev => prev + 1);
  };
  const prevStep = () => setCurrentStep(prev => prev - 1);

  /* ========================= RENDER STEPS ========================= */

  const renderStep1_ThemeSelection = () => (
    <View>
      <Text style={styles.stepTitle}>Step 1: Choose Your Design</Text>
      <Text style={styles.stepSubtitle}>Select a template for your digital card.</Text>
      {themes.length === 0 ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={themes}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.themeCard, form.theme_id === item.id && styles.themeCardSelected]}
              onPress={() => updateField("theme_id", item.id)}
            >
              <Image source={{ uri: item.theme }} style={styles.themeImage} resizeMode="cover" />
              {form.theme_id === item.id && (
                <View style={styles.selectedOverlay}>
                  <Ionicons name="checkmark-circle" size={30} color={COLORS.success} />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  const renderStep2_Personal = () => (
    <Section title="Step 2: Personal Information">
      <Input label="Name" value={form.name} onChange={(v) => updateField("name", v)} />
      <Input label="Mobile" value={form.mobile} onChange={(v) => updateField("mobile", v)} keyboardType="phone-pad" />
      <Input label="Whatsapp" value={form.whatsapp} onChange={(v) => updateField("whatsapp", v)} keyboardType="phone-pad" />
      <Input label="Job Role" value={form.jobRole} onChange={(v) => updateField("jobRole", v)} />
      
      {/* ✅ CATEGORY PICKER (Replaced Input) */}
      <View style={styles.inputWrap}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
            <Picker
                selectedValue={form.serviceCategory}
                onValueChange={(itemValue) => updateField("serviceCategory", itemValue)}
                style={styles.picker}
                dropdownIconColor={COLORS.primary}
            >
                <Picker.Item label="Select Category..." value="" color="#999" />
                {categories.map((item) => (
                    <Picker.Item 
                        key={item.id} 
                        label={item.category_name} 
                        value={item.category_name} 
                    />
                ))}
            </Picker>
        </View>
      </View>
      
      <Input label="Email" value={form.email} onChange={(v) => updateField("email", v)} keyboardType="email-address" />
      <Input label="Address" value={form.address} onChange={(v) => updateField("address", v)} />
      
      {/* LOCATION BUTTON */}
      <View style={{marginBottom: 16}}>
          <Text style={styles.label}>Location Coordinates</Text>
          <TouchableOpacity 
            style={styles.locationBtn} 
            onPress={getCurrentLocation}
            disabled={locationLoading}
          >
              {locationLoading ? (
                  <ActivityIndicator size="small" color="white" />
              ) : (
                  <>
                    <Ionicons name="location-sharp" size={18} color="white" />
                    <Text style={styles.locationBtnText}>
                        {form.latitude ? "Update Current Location" : "Fetch Current Location"}
                    </Text>
                  </>
              )}
          </TouchableOpacity>
          
          {form.latitude ? (
              <View style={styles.locationPreview}>
                  <Text style={{fontSize: 12, color: COLORS.success}}>
                     <Ionicons name="checkmark" /> Coords: {form.latitude}, {form.longitude}
                  </Text>
              </View>
          ) : null}
      </View>

      <Input label="City" value={form.city} onChange={(v) => updateField("city", v)} />
      <Input label="State" value={form.state} onChange={(v) => updateField("state", v)} />
      <Input label="Pincode" value={form.pincode} onChange={(v) => updateField("pincode", v)} keyboardType="numeric" />
      <Upload label="Upload Profile/Logo" image={images.logo} onPick={() => pickImage("logo")} />
    </Section>
  );

  const renderStep3_Business = () => (
    <Section title="Step 3: Business Details">
      <Input label="Company Name" value={form.companyName} onChange={(v) => updateField("companyName", v)} />
      <Input label="Year Est." value={form.establishmentYear} onChange={(v) => updateField("establishmentYear", v)} keyboardType="numeric" />
      <Input label="Business Nature" value={form.businessNature} onChange={(v) => updateField("businessNature", v)} />
      <Input label="Website" value={form.website} onChange={(v) => updateField("website", v)} />
      <Textarea label="Specialties" value={form.specialties} onChange={(v) => updateField("specialties", v)} />
      <Textarea label="Description" value={form.description} onChange={(v) => updateField("description", v)} />
    </Section>
  );

  const renderStep4_ServicePayment = () => (
    <View>
      <Section title="Service Info">
        <Input label="Service Name" value={form.serviceName} onChange={(v) => updateField("serviceName", v)} />
        <Input label="Service Price" value={form.servicePrice} onChange={(v) => updateField("servicePrice", v)} keyboardType="numeric" />
        <Textarea label="Service Details" value={form.serviceContent} onChange={(v) => updateField("serviceContent", v)} />
        <Upload label="Service Image" image={images.serviceImage} onPick={() => pickImage("serviceImage")} />
      </Section>

      <Section title="Payment Options">
        <Input label="Paytm Number" value={form.paytm} onChange={(v) => updateField("paytm", v)} keyboardType="phone-pad" />
        <Input label="PhonePe Number" value={form.phonepe} onChange={(v) => updateField("phonepe", v)} keyboardType="phone-pad" />
        <Input label="GPay Number" value={form.gpay} onChange={(v) => updateField("gpay", v)} keyboardType="phone-pad" />
        <Input label="Bank Name" value={form.bankName} onChange={(v) => updateField("bankName", v)} />
        <Input label="IFSC Code" value={form.ifsc} onChange={(v) => updateField("ifsc", v)} />
        <Input label="Account Number" value={form.accountNumber} onChange={(v) => updateField("accountNumber", v)} keyboardType="numeric" />
        <Upload label="Payment QR Code" image={images.qr} onPick={() => pickImage("qr")} />
      </Section>
    </View>
  );

  const renderStep5_Final = () => (
    <View>
      <Section title="Social Media & Gallery">
        <Input label="Facebook URL" value={form.facebook} onChange={(v) => updateField("facebook", v)} />
        <Input label="Instagram URL" value={form.instagram} onChange={(v) => updateField("instagram", v)} />
        <Input label="YouTube URL" value={form.youtube} onChange={(v) => updateField("youtube", v)} />
        <Input label="Keywords (comma sep)" value={form.keywords} onChange={(v) => updateField("keywords", v)} />
        <Upload label="Gallery Images (Max 5)" onPick={() => pickImage("gallery", true)} />
      </Section>
    </View>
  );

  /* ========================= MAIN UI ========================= */

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome size={20} name="arrow-left" style={{color: "white"}} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Digital Card</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${(currentStep / 5) * 100}%` }]} />
      </View>
      
      {/* KeyboardAvoidingView prevents keyboard covering inputs */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.form}>
            {currentStep === 1 && renderStep1_ThemeSelection()}
            {currentStep === 2 && renderStep2_Personal()}
            {currentStep === 3 && renderStep3_Business()}
            {currentStep === 4 && renderStep4_ServicePayment()}
            {currentStep === 5 && renderStep5_Final()}

            <View style={styles.navBtnContainer}>
                {currentStep > 1 && (
                    <TouchableOpacity style={styles.prevBtn} onPress={prevStep}>
                        <Text style={styles.prevBtnText}>Back</Text>
                    </TouchableOpacity>
                )}

                {currentStep < 5 ? (
                    <TouchableOpacity style={styles.nextBtn} onPress={nextStep}>
                        <Text style={styles.nextBtnText}>Next Step</Text>
                        <FontAwesome name="angle-right" size={20} color="white" style={{marginLeft:8}} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.submitBtn} onPress={submitForm} disabled={loading}>
                        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>Submit & Create</Text>}
                    </TouchableOpacity>
                )}
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FLOATING BOTTOM NAV */}
      <View style={styles.bottomNavWrapper}>
          <View style={styles.bottomNav}>
              <TouchableOpacity style={styles.bNavItem} onPress={() => navigation.navigate("DairyList")}>
                  <Ionicons name="home-outline" size={22} color={COLORS.muted} />
                  <Text style={styles.bNavText}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bNavItem}>
                  <FontAwesome name="plus-circle" size={22} color={COLORS.primary} />
                  <Text style={[styles.bNavText, {color: COLORS.primary, fontWeight:'700'}]}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.centerSearch}>
                  <FontAwesome name="search" size={20} color="white" />
              </TouchableOpacity>
             <TouchableOpacity style={styles.bNavItem} onPress={() => navigation.navigate("MyDVC")}>
                 <FontAwesome name="qrcode" size={22} color={COLORS.primary} />
                 <Text style={styles.bNavText}>QR Code</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.bNavItem} onPress={() => navigation.navigate("Myupload")}>
                 <FontAwesome name="id-card-o" size={22} color={COLORS.primary} />
                 <Text style={[styles.bNavText, { color: COLORS.primary, fontWeight: '700' }]}>My DVC</Text>
               </TouchableOpacity>
          </View>
      </View>
    </View>
  );
};

/* ========================= COMPONENTS ========================= */

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Input = ({ label, value, onChange, keyboardType="default" }) => (
  <View style={styles.inputWrap}>
    <Text style={styles.label}>{label}</Text>
    <TextInput 
        style={styles.input} 
        value={value} 
        onChangeText={onChange} 
        keyboardType={keyboardType}
        placeholderTextColor="#94A3B8"
    />
  </View>
);

const Textarea = ({ label, value, onChange }) => (
  <View style={styles.inputWrap}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
      multiline
      value={value}
      onChangeText={onChange}
    />
  </View>
);

const Upload = ({ label, onPick, image }) => (
  <View style={styles.inputWrap}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.uploadBox} onPress={onPick}>
      {image ? <Image source={{ uri: image.uri }} style={styles.image} resizeMode="cover" /> : (
        <View style={{alignItems:'center'}}>
            <Ionicons name="cloud-upload-outline" size={24} color={COLORS.primary} />
            <Text style={{color: COLORS.muted, marginTop:4, fontSize:12}}>Tap to Upload</Text>
        </View>
      )}
    </TouchableOpacity>
  </View>
);

/* ========================= STYLES ========================= */

const styles = StyleSheet.create({
  header: { height: 60, alignItems: "center", backgroundColor: COLORS.primary, flexDirection: "row", gap : 15, paddingHorizontal: 20 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "600" },

  progressBarContainer: { height: 4, backgroundColor: '#E2E8F0', width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.success },

  form: { padding: 16 },
  
  stepTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 5 },
  stepSubtitle: { fontSize: 14, color: COLORS.muted, marginBottom: 20 },

  themeCard: { width: '48%', height: 220, borderRadius: 12, marginBottom: 16, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', backgroundColor: 'white', elevation: 2 },
  themeCardSelected: { borderColor: COLORS.success, borderWidth: 3 },
  themeImage: { width: '100%', height: '100%' },
  selectedOverlay: { position: 'absolute', top: 10, right: 10, backgroundColor: 'white', borderRadius: 20 },

  section: { backgroundColor: COLORS.white, padding: 16, borderRadius: 14, marginBottom: 16, elevation: 1 },
  sectionTitle: { fontWeight: "700", marginBottom: 16, fontSize: 16, color: '#334155' },

  label: { fontSize: 12, color: COLORS.muted, marginBottom: 6, fontWeight: '500' },
  inputWrap: { marginBottom: 16 },
  input: { height: 48, backgroundColor: "#F8FAFC", borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border, color: '#333' },
  
  // ✅ PICKER STYLES
  pickerContainer: { height: 48, backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', overflow: 'hidden' },
  picker: { width: '100%', color: '#333' },

  uploadBox: { height: 100, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', backgroundColor: '#F8FAFC', justifyContent: "center", alignItems: "center" },
  image: { width: "100%", height: "100%", borderRadius: 12 },

  locationBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, height: 45, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  locationBtnText: { color: 'white', fontWeight: '600', marginLeft: 8 },
  locationPreview: { padding: 8, backgroundColor: '#F0FDF4', borderRadius: 8, borderWidth: 1, borderColor: '#DCFCE7' },

  navBtnContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  prevBtn: { flex: 1, marginRight: 10, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.muted },
  prevBtnText: { color: COLORS.muted, fontWeight: '600' },
  nextBtn: { flex: 1, height: 50, backgroundColor: COLORS.primary, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  nextBtnText: { color: COLORS.white, fontWeight: '700' },
  
  submitBtn: { flex: 1, height: 50, backgroundColor: COLORS.success, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },

  bottomNavWrapper: { position: 'absolute', bottom: 25, left: 0, right: 0, alignItems: 'center' },
  bottomNav: {
      width: width * 0.9,
      height: 70,
      backgroundColor: COLORS.white,
      borderRadius: 35,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 15,
      alignItems: 'center',
      elevation: 15,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 10,
  },
  bNavItem: { alignItems: 'center', flex: 1 },
  bNavText: { fontSize: 10, color: COLORS.muted, marginTop: 4 },
  centerSearch: {
      backgroundColor: COLORS.primary,
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: -10,
      elevation: 5
  }
});

export default CreateDVC;