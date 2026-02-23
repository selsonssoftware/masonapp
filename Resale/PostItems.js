import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Image,
  KeyboardAvoidingView,
  Modal,
  FlatList,
  ActivityIndicator,
  PermissionsAndroid,
  Alert
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ResaleProductForm({ navigation }) {
  // --- State: Product ---
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  
  // Changed 'image' to 'images' array for multiple selection
  const [images, setImages] = useState([]); 

  // --- State: Address ---
  const [doorNo, setDoorNo] = useState('');
  const [streetName, setStreetName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  // --- State: Dropdowns ---
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [allLocationData, setAllLocationData] = useState([]); 
  const [districtsList, setDistrictsList] = useState([]);
  const [areasList, setAreasList] = useState([]); 

  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);

  // --- State: Location (Lat/Long) ---
  const [location, setLocation] = useState({ latitude: null, longitude: null, mapUrl: '' });
  const [locationStatus, setLocationStatus] = useState('Fetching...'); // UI Status

  // --- Modal & Loading ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // --- 1. Init ---
  useEffect(() => {
    fetchCategories();
    fetchAddressData();
    requestLocationPermission();
  }, []);

  // --- 2. API Calls ---
  const fetchCategories = async () => {
    try {
      const response = await fetch('https://masonshop.in/api/resale_categoryapi');
      const json = await response.json();
      if (json.status && json.data) setCategories(json.data);
    } catch (error) { console.error('Error categories:', error); }
  };

  const fetchAddressData = async () => {
    try {
      const response = await fetch('https://masonshop.in/api/getAllStatesData');
      const json = await response.json();
      if (Array.isArray(json)) setAllLocationData(json);
    } catch (error) { console.error('Error address data:', error); }
  };

  // --- 3. Location Logic ---
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          { title: "Location Access", message: "App needs location to tag your product." }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) getUserLocation();
        else setLocationStatus('Permission Denied');
      } catch (err) { console.warn(err); }
    } else {
      getUserLocation();
    }
  };

  const getUserLocation = () => {
    setLocationStatus('Locating...');
    Geolocation.getCurrentPosition(
      (info) => {
        const { latitude, longitude } = info.coords;
        // Construct a Google Maps URL
        const mapUrl = `http://maps.google.com/maps?q=${latitude},${longitude}`;
        
        console.log("Got Location:", latitude, longitude);
        setLocation({ latitude, longitude, mapUrl });
        setLocationStatus('Location Fetched');
      },
      (error) => {
        console.log("Location Error:", error);
        setLocationStatus('Location Failed');
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 1000 }
    );
  };

  // --- 4. Multiple Image Picker ---
 const handleImagePick = () => {
    // 1. Check how many images are already selected
    const existingCount = images.length;
    const maxLimit = 5;
    const remainingSlots = maxLimit - existingCount;

    if (remainingSlots <= 0) {
      Alert.alert("Limit Reached", "You can only upload up to 5 images.");
      return;
    }

    const options = {
      mediaType: 'photo',
      selectionLimit: remainingSlots, // Only allow picking what fits (e.g., if you have 3, pick 2 more)
      quality: 0.8,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('ImagePicker Error', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        
        // --- CORRECTION HERE ---
        // Don't use setImages(response.assets) -> This overwrites!
        // Use functional update to APPEND new images:
        
        setImages(prevImages => [...prevImages, ...response.assets]); 
      }
    });
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  // --- 5. Submit Logic ---
  const handleSubmit = async () => {
    if (!productName || !selectedCategory || !description || !price || images.length === 0 ||
        !doorNo || !streetName || !city || !selectedState || !selectedDistrict || !selectedArea) {
      Alert.alert("Missing Fields", "Please fill all fields and select at least one image.");
      return;
    }
 const userId = (await AsyncStorage.getItem('user_id')) || 'M850440';
    setSubmitting(true);
    const formData = new FormData();

    // Basic Fields
    formData.append('user_id', userId);
    formData.append('project_name', productName);
    formData.append('category', selectedCategory.id);
    formData.append('description', description);
    formData.append('price', price);

    // Address Fields
    formData.append('door_no', doorNo);
    formData.append('street_name', streetName);
    formData.append('address', address);
    formData.append('city', city);
    formData.append('state', selectedState.state);
    formData.append('district', selectedDistrict.district);
    formData.append('area', selectedArea.officename);
    formData.append('pincode', pincode);

    // --- Lat/Long (User Location) ---
    // Send 0 or empty if location failed, to avoid server errors if fields are strictly required
    formData.append('latitude', location.latitude || ''); 
    formData.append('longitude', location.longitude || '');
    formData.append('map_url', location.mapUrl || '');

    // --- Multiple Images ---
    images.forEach((img, index) => {
  formData.append('images[]', { // <--- Fixed here
    uri: Platform.OS === 'android' ? img.uri : img.uri.replace('file://', ''),
    type: img.type,
    name: img.fileName || `image_${index}_${Date.now()}.jpg`,
  });
});

    try {
  console.log("Submitting...");
  
  const response = await fetch('https://masonshop.in/api/resale_productsapi', {
    method: 'POST',
    body: formData,
    // headers removed intentionally
  });

  // 1. Get raw text first
  const responseText = await response.text();
  console.log("Raw Server Response:", responseText); // <--- CHECK THIS LOG

  // 2. Try to parse it manually to see if it works
  try {
    const json = JSON.parse(responseText);
    
    if (json.status || response.ok) {
      Alert.alert("Success", "Product uploaded successfully!");
      navigation.goBack();
    } else {
      Alert.alert("Failed", json.message || "Upload failed.");
    }
  } catch (jsonError) {
    // If this runs, it means the server sent HTML (error page) instead of JSON
    console.error("JSON Parse Error. Server sent:", responseText);
    Alert.alert("Server Error", "The server returned an invalid response. Check console logs.");
  }

} catch (error) {
  console.error("Network Error:", error);
  Alert.alert("Error", "Network error occurred.");
} finally {
  setSubmitting(false);
}

     
  };

  // --- Dropdown Helpers ---
  const openModal = (type) => {
    if (type === 'district' && !selectedState) return Alert.alert("Select State first");
    if (type === 'area' && !selectedDistrict) return Alert.alert("Select District first");
    setModalType(type);
    setModalVisible(true);
  };

  const handleSelection = (item) => {
    if (modalType === 'category') setSelectedCategory(item);
    else if (modalType === 'state') {
      setSelectedState(item);
      setDistrictsList(item.districts || []);
      setSelectedDistrict(null); setSelectedArea(null); setAreasList([]); setPincode('');
    }
    else if (modalType === 'district') {
      setSelectedDistrict(item);
      setAreasList(item.offices || []);
      setSelectedArea(null); setPincode('');
    }
    else if (modalType === 'area') {
      setSelectedArea(item);
      if (item.pincode) setPincode(String(item.pincode));
    }
    setModalVisible(false);
  };

  // --- Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#FDEEF9', '#FFF5F7', '#FFFFFF']} style={styles.gradientBackground}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="chevron-left" size={30} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Include Details</Text>
          <View style={{ width: 30 }} /> 
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content}>
            
            <Text style={styles.sectionTitle}>Product Info</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product Name <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} placeholder='Eg: "Sofa Set"' placeholderTextColor="#A0A0A0" value={productName} onChangeText={setProductName} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity style={styles.dropdownInput} onPress={() => openModal('category')}>
                <Text style={selectedCategory ? styles.inputText : styles.placeholderText}>{selectedCategory ? selectedCategory.name : 'Select Category'}</Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#A0A0A0" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Details..." placeholderTextColor="#A0A0A0" multiline numberOfLines={3} value={description} onChangeText={setDescription} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#A0A0A0" keyboardType="numeric" value={price} onChangeText={setPrice} />
            </View>

            {/* --- Address Section --- */}
            <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Address & Location</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 0.4, marginRight: 10 }]}>
                <Text style={styles.label}>Door No <Text style={styles.required}>*</Text></Text>
                <TextInput style={styles.input} placeholder="No" placeholderTextColor="#A0A0A0" value={doorNo} onChangeText={setDoorNo} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Street <Text style={styles.required}>*</Text></Text>
                <TextInput style={styles.input} placeholder="Street Name" placeholderTextColor="#A0A0A0" value={streetName} onChangeText={setStreetName} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address / Landmark <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} placeholder="Full Address" placeholderTextColor="#A0A0A0" value={address} onChangeText={setAddress} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>City <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} placeholder="City" placeholderTextColor="#A0A0A0" value={city} onChangeText={setCity} />
            </View>

            {/* Dropdowns */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>State <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity style={styles.dropdownInput} onPress={() => openModal('state')}>
                <Text style={selectedState ? styles.inputText : styles.placeholderText}>{selectedState ? selectedState.state : 'Select State'}</Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#A0A0A0" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>District <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity style={[styles.dropdownInput, !selectedState && styles.disabledInput]} onPress={() => openModal('district')}>
                <Text style={selectedDistrict ? styles.inputText : styles.placeholderText}>{selectedDistrict ? selectedDistrict.district : 'Select District'}</Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#A0A0A0" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Area <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity style={[styles.dropdownInput, !selectedDistrict && styles.disabledInput]} onPress={() => openModal('area')}>
                <Text style={selectedArea ? styles.inputText : styles.placeholderText}>{selectedArea ? selectedArea.officename : 'Select Area'}</Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#A0A0A0" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pincode <Text style={styles.required}>*</Text></Text>
              <TextInput style={[styles.input, styles.disabledInput]} value={pincode} editable={false} placeholder="Auto-filled" placeholderTextColor="#A0A0A0" />
            </View>

            {/* --- Lat/Long Indicator --- */}
            <View style={styles.gpsContainer}>
              <TouchableOpacity onPress={requestLocationPermission} style={styles.gpsButton}>
                 <MaterialIcons name={location.latitude ? "my-location" : "location-searching"} size={20} color={location.latitude ? "green" : "#666"} />
                 <Text style={styles.gpsText}>
                    {location.latitude ? ` GPS: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : ` ${locationStatus}`}
                 </Text>
              </TouchableOpacity>
            </View>

            {/* --- Multiple Image Upload --- */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product Images (Max 5) <Text style={styles.required}>*</Text></Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                <TouchableOpacity style={styles.uploadBox} onPress={handleImagePick}>
                  <MaterialIcons name="add-a-photo" size={24} color="#B0B0B0" />
                  <Text style={styles.uploadText}>Add</Text>
                </TouchableOpacity>

                {images.map((img, index) => (
                  <View key={index} style={styles.imagePreview}>
                    <Image source={{ uri: img.uri }} style={styles.thumbImage} />
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                      <MaterialIcons name="close" size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Submit */}
            <TouchableOpacity style={[styles.submitButton, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#4A144B" /> : <Text style={styles.submitButtonText}>Submit Product</Text>}
            </TouchableOpacity>

            <View style={{ height: 50 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* --- Generic Modal --- */}
        <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Option</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><MaterialIcons name="close" size={24} /></TouchableOpacity>
              </View>
              <FlatList
                data={
                  modalType === 'category' ? categories : 
                  modalType === 'state' ? allLocationData :
                  modalType === 'district' ? districtsList : areasList
                }
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalItem} onPress={() => handleSelection(item)}>
                    {item.image && <Image source={{ uri: item.image }} style={styles.modalItemImage} />}
                    <Text style={styles.modalItemText}>
                      {modalType === 'category' ? item.name : 
                       modalType === 'state' ? item.state : 
                       modalType === 'district' ? item.district : 
                       `${item.officename} (${item.pincode})`}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  gradientBackground: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#4A144B', marginBottom: 15 },
  inputGroup: { marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, color: '#333', marginBottom: 6, fontWeight: '500' },
  required: { color: '#D32F2F' },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    padding: 12, color: '#000', elevation: 1
  },
  dropdownInput: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    padding: 12, elevation: 1
  },
  disabledInput: { backgroundColor: '#F5F5F5', color: '#888' },
  inputText: { color: '#000' },
  placeholderText: { color: '#A0A0A0' },
  textArea: { height: 80, textAlignVertical: 'top' },
  
  // Image Upload Styles
  uploadBox: {
    width: 70, height: 70, borderWidth: 1, borderColor: '#CCC', borderStyle: 'dashed',
    borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10,
    backgroundColor: '#FAFAFA'
  },
  uploadText: { fontSize: 10, color: '#888' },
  imagePreview: { width: 70, height: 70, marginRight: 10, position: 'relative' },
  thumbImage: { width: '100%', height: '100%', borderRadius: 8 },
  removeBtn: {
    position: 'absolute', top: -5, right: -5, backgroundColor: 'red',
    width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center'
  },

  // GPS Styles
  gpsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'flex-end' },
  gpsButton: { flexDirection: 'row', alignItems: 'center', padding: 5 },
  gpsText: { marginLeft: 5, fontSize: 12, color: '#666', fontStyle: 'italic' },

  submitButton: {
    marginTop: 10, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#4A144B',
    borderRadius: 10, paddingVertical: 12, alignItems: 'center'
  },
  submitButtonText: { fontSize: 16, fontWeight: 'bold', color: '#4A144B' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '60%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalItemImage: { width: 30, height: 30, marginRight: 15, borderRadius: 5 },
  modalItemText: { fontSize: 14, color: '#333' },
});