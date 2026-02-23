import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator, 
  FlatList, 
  Image,
  Platform
 
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker'; 
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';


import Geolocation from '@react-native-community/geolocation';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';


const { height } = Dimensions.get('window');

const THEME_COLOR = '#800040'; // The Maroon/Red color
const LIGHT_BG = '#F9F9F9';

// --- DATA FOR DROPDOWNS ---
const DROPDOWN_OPTIONS = {
  propertyType: ['Apartment', 'Villa','Plots','Office','Pg' ],
  rentOrSell: ['Rent', 'Sell'],
  constructionStatus: ['Ready To Move', 'Under Construction', 'New Launch'],
  bhk: ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK+'],
  parking: ['Yes', 'No', '2', '3', '3+'],
  facing: ['North', 'East', 'West', 'South'],
  furnishing: ['None', 'Semi Furnished', 'Fully Furnished'],
  listedBy: ['Owner', 'Builder', 'Dealer'],
  landmark: ['Near Bus Stop', 'Near Metro', 'Near School'],
  meals: ['Yes', 'No'],
  plot_type: ['Residential', 'Commercial', 'Agricultural'],
   sharingType: [
    'Single',
    'Double',
    'Triple',
    'Dormitory',
  ],

  furnishing: [
    'Unfurnished',
    'Semi Furnished',
    'Fully Furnished',
  ],

  foodAvailable: [
    'Yes',
    'No',
  ],

  preferredTenants: [
    'Boys',
    'Girls',
    'Anyone',
  ],
};


// Define numeric fields for validation
const NUMERIC_FIELDS = ['buildUpArea', 'carpetArea', 'totalFloors', 'price', 'pinCode', 'accountNumber','sqftprice','washrooms','floor_no'];

const formatKeyForDisplay = (key) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

// --- Fields to display in the main property section (Step 1 & 2) ---
const PROPERTY_FIELDS = [
    'type', 'rentOrSell', 'bhk', 'parking', 'furnishing', 
    'constructionStatus', 'listedBy', 'buildUpArea', 'carpetArea', 
    'totalFloors', 'facing', 'price', 'project_name', 'description','sqftprice','washrooms','available_beds','meals','state','pinCode','landmark' 
];

const LOCATION_FIELDS = [
    'doorNo', 'area', 'landmark', 'pinCode', 'city', 'state',
];

const CONTACT_BANK_FIELDS = [
    'email', 'accountName', 'accountNumber', 'ifsc', 
];


const SellerUploadScreen = () => {
  const route = useRoute();
  const initialPropertyType = route.params?.propertyType || ''; 

  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentDropdownField, setCurrentDropdownField] = useState(null); 

  const navigation=useNavigation();

   const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [mapUrl, setMapUrl] = useState('');

 const [userId, setUserId] = useState(null);


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


useEffect(() => {
  const getUserId = async () => {
    try {
      const id = await AsyncStorage.getItem('user_id');
      if (id !== null) {
        setUserId(id);
      }
    } catch (error) {
      console.log('Error fetching user_id', error);
    }
  };

  getUserId();
}, []);


const [formData, setFormData] = useState({
  user_id: userId, // ✅ SET LOGGED IN USER ID

  propertyType: initialPropertyType,
  rentOrSell:'',
  bhk: '',
  bathrooms: '',           // ✅ ADD
  parking: '',
  furnishing: '',
  constructionStatus: '',
  listed_by: '',
  buildUpArea: '',
  carpetArea: '',
  totalFloors: '',
  floor_no: '',             // ✅ ADD
  facing: '',
  maintenance: '',          // ✅ ADD
     // ✅ ADD
           // ✅ ADD
  status: 'active',         // ✅ ADD
  price: '',
  project_name: '',
  add_title: '',            // ✅ ADD
  description: '',

  deposit: '',               // ✅ PG
  totalBeds: '',             // ✅ PG
  availableBeds: '',         // ✅ PG
  sharingType: '',           // ✅ PG
  preferredTenants: '',      // ✅ PG
  foodAvailable: '',         // ✅ PG
  washrooms: '',             // ✅ PG
  wifi: '',                  // ✅ PG
  powerBackup: '',  
   

  doorNo: '',
  map_url:mapUrl,
  latitude:latitude,
  longtitude:longitude,
  street_name: '',          // ✅ ADD
  area: '',
  city: '',
  district: '',             // ✅ ADD
  state: '',
  pinCode: '',
  landmark: '',
  
   sqftprice:'',

  images: [],
  email: '',
});


  // --- HANDLERS ---
  const handleInputChange = (field, value) => {
    let finalValue = value;
    
   
    
    // For IFSC, allow alphanumeric and limit to 11 chars, make uppercase
    if (field ===  'ifsc') {
        finalValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 11);
    }

    setFormData(prevFormData => ({ 
        ...prevFormData, 
        [field]: finalValue 
    }));
  };

  const handleDropdownSelect = (field, value) => {
    handleInputChange(field, value);
    setIsModalVisible(false);
  };

  const openDropdown = (field) => {
    setCurrentDropdownField(field);
    setIsModalVisible(true);
  };
  
  const validateStep = () => { 
    if (currentStep === 1 && formData.propertyType === 'Apartment') {
        if (!formData.propertyType || !formData.rentOrSell || !formData.price || !formData.bhk || !formData.buildUpArea || !formData.carpetArea || !formData.totalFloors) {
            Alert.alert("Validation Error", "Please fill in all required fields (Property Type, Rent/Sell, BHK, Price, Area, Floors) before continuing.");
            return false;
        }
    }
    // if (currentStep === 2) {
    //     if (!formData.doorNo || !formData.area || !formData.pinCode || !formData.city || !formData.state || !formData.email) {
    //         Alert.alert("Validation Error", "Please fill in all location and contact details before continuing.");
    //         return false;
    //     }
    // }
    if (currentStep === 3) {
       if (formData.images.length === 0) {
            Alert.alert("Validation Error", "Please upload at least one image before continuing.");
            return false;
        }
    }
    // Step 4 Bank Details Validation
    if (currentStep === 4) {
       
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < 4 && validateStep()) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 4) {
        return;
    }
  };

  useEffect(() => {
  setFormData(prev => ({
    ...prev,
    latitude: latitude,
    longtitude: longitude, // keep backend key if required
    map_url: mapUrl,
  }));
}, [latitude, longitude, mapUrl]);


  const submitToApi = async () => {
    if (!validateStep()) {
        setShowPreview(false); // Close preview if validation fails
        return;
    }

    setShowPreview(false); // Close preview modal
    setIsSubmitting(true);
    
    // Function to prepare FormData for API submission (required for files/images)
  const createFormData = (data) => {
  const formData = new FormData();
  
  formData.append('user_id', userId);
  formData.append('type', data.propertyType);
  formData.append('sale_or_rent', data.rentOrSell);
  formData.append('bhk', data.bhk);
  formData.append('bathrooms', data.bathrooms);
  formData.append('parking', data.parking);
  formData.append('furnishing', data.furnishing);
  formData.append('constructionStatus', data.constructionStatus);
  formData.append('listed_by', data.listedBy);

  // AREA / FLOOR
  formData.append('super_builtup_area', data.buildUpArea);
  formData.append('carpet_area', data.carpetArea);
  formData.append('total_floors', data.totalFloors);
   formData.append('floor_no', data.floor_no);
  formData.append('facing', data.facing);

  // PLOT
  formData.append('plot_type', data.plot_type);
  formData.append('plot_area', data.plot_area);
  formData.append('length', data.length);
  formData.append('breadth', data.breadth);
  formData.append('total_sq_ft', data.total_sq_ft);
   formData.append('sqftprice', data.sqftprice);

  // DETAILS
  formData.append('project_name', data.project_name);
  formData.append('add_title', data.add_title);
  formData.append('description', data.description);
  formData.append('price', data.price);
  formData.append('meals', data.meals);
  formData.append('status', data.status);

  if (data.propertyType === 'Pg') {
    formData.append('deposit', data.deposit || '');
    formData.append('total_beds', data.totalBeds || '');
    formData.append('available_beds', data.availableBeds || '');
    formData.append('sharing_type', data.sharingType || '');
    formData.append('washrooms', data.washrooms || '');
    formData.append('food_available', data.foodAvailable || '');
    formData.append('preferred_tenants', data.preferredTenants || '');
    formData.append('wifi', data.wifi || '');
    formData.append('power_backup', data.powerBackup || '');
  }

  // ADDRESS ✅ (THIS WAS YOUR MAIN BUG)
  formData.append('door_no', data.doorNo);
  formData.append('street_name', data.street_name);
  formData.append('area', data.area);
  formData.append('city', data.city);
  formData.append('district', data.district);
  formData.append('state', data.state);
  formData.append('pincode', data.pinCode);
  formData.append('landmark', data.landmark);
  formData.append('email', data.email);
  // GPS LOCATION ✅
formData.append('latitude', data.latitude || '');
formData.append('longtitude', data.longtitude || '');
formData.append('map_url', data.map_url || '');


data.images.forEach((img, index) => {
  formData.append('images[]', {
    uri: Platform.OS === 'android' ? img.uri : img.uri.replace('file://', ''),
    name: img.fileName || `image_${index}.jpg`,
    type: img.type || 'image/jpeg',
  });
});


  return formData;
};


    const API_URL = 'https://masonshop.in/api/uploadsrealestate_full';
    
    try {
        const dataToSend = createFormData(formData);
        
       const response = await fetch(API_URL, {
  method: 'POST',
 headers: {
        'Accept': 'application/json',
        // DO NOT set 'Content-Type': 'multipart/form-data' here!
      },
  body: dataToSend,
});


        const responseJson = await response.json();
        
        if (response.ok) { 
            Alert.alert("Success", responseJson.message || "Property posted successfully!");
            navigation.navigate('ApartmentSuccess');
        } else {
            const errorMessage = responseJson.errors ? 
                Object.values(responseJson.errors).flat().join('\n') : 
                (responseJson.message || `API Error: Status ${response.status}`);
            Alert.alert("Submission Failed", errorMessage);
        }

    } catch (error) {
        console.error('Network or Submission Error:', error);
        Alert.alert("Error", `Failed to upload property: ${error.message || 'Check your network connection.'}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleImageUpload = () => {
      const maxLimit = 10 - formData.images.length;
      if (maxLimit <= 0) {
           Alert.alert("Limit Reached", "You have already uploaded the maximum of 10 images.");
           return;
      }
      
      const options = {
          mediaType: 'photo',
          selectionLimit: maxLimit, 
          quality: 0.8,
          includeBase64: false,
      };

      launchImageLibrary(options, (response) => {
          if (response.didCancel || response.errorCode) {
              Alert.alert("Error", `Image picker failed: ${response.errorMessage}`);
          } else if (response.assets && response.assets.length > 0) {
              const newImages = response.assets.map(asset => ({
                  uri: asset.uri,
                  fileName: asset.fileName || `Photo_${Date.now()}`,
                  type: asset.type,
              }));
              
              setFormData(prevFormData => ({
                  ...prevFormData, 
                  images: [...prevFormData.images, ...newImages] 
              }));
          }
      });
  }
  
  // --- NEW HANDLER for Image Removal ---
  const handleImageRemove = (indexToRemove) => {
    Alert.alert(
        "Remove Image",
        "Are you sure you want to remove this image?",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Remove", 
                onPress: () => {
                    setFormData(prevFormData => ({
                        ...prevFormData,
                        images: prevFormData.images.filter((_, index) => index !== indexToRemove)
                    }));
                },
                style: "destructive"
            }
        ]
    );
  };

  // --- RENDER HELPERS (Components) ---
  const renderTab = (stepNumber, title) => {
    const isActive = currentStep === stepNumber;
    const isComplete = currentStep > stepNumber; 

    return (
      <TouchableOpacity 
        style={styles.tabWrapper}
        onPress={() => setCurrentStep(stepNumber)}
        disabled={isSubmitting}
      >
        <View style={[styles.tabIndicator, (isActive || isComplete) && styles.tabIndicatorActive]}>
            {isComplete ? (
                <Text style={styles.checkIcon}>✓</Text>
            ) : (
                <Text style={[styles.stepNumberText, isActive && {color: '#fff'}]}>{stepNumber}</Text>
            )}
        </View>
        <Text style={[
            styles.tabText, 
            isActive && styles.tabTextActive, 
            isComplete && styles.tabTextComplete
        ]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  const DropdownMock = ({ label, placeholder, value, fieldName }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label} <Text style={styles.required}>*</Text></Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => openDropdown(fieldName)} disabled={isSubmitting}>
        <Text style={[styles.inputText, !value && { color: '#999' }]}>
          {value || placeholder}
        </Text>
        <Text style={styles.dropdownIcon}>▼</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDropdownModal = () => {
    if (!currentDropdownField) return null;

    const options = DROPDOWN_OPTIONS[currentDropdownField] || [];
    const title = formatKeyForDisplay(currentDropdownField);

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={() => setIsModalVisible(false)}
        >
            <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1} 
                onPress={() => setIsModalVisible(false)}
            >
                <View style={styles.dropdownModalContent} onStartShouldSetSetResponder={() => true}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    
                    <FlatList
                        data={options}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={styles.modalOption} 
                                onPress={() => handleDropdownSelect(currentDropdownField, item)}
                            >
                                <Text style={styles.modalOptionText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                        style={{ maxHeight: height * 0.45 }}
                        showsVerticalScrollIndicator={true}
                    />

                    <View style={styles.modalButtons}>
                        <TouchableOpacity 
                            style={[styles.modalBtn, styles.cancelBtn]} 
                            onPress={() => setIsModalVisible(false)}
                        >
                            <Text>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
  };
  
  const renderPreviewModal = () => {
    const EXCLUDED_PREVIEW_FIELDS = [
        'images', 'ifsc', 'accountName', 'accountNumber', 
    ];
    
    const keys = Object.keys(formData).filter(key => !EXCLUDED_PREVIEW_FIELDS.includes(key));
    
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={showPreview}
            onRequestClose={() => setShowPreview(false)}
        >
            <View style={styles.previewModalCenter}>
                <View style={styles.previewModalContent}>
                    <Text style={styles.modalTitle}>Listing Preview (Public Data)</Text>
                    <ScrollView style={{maxHeight: height * 0.6}}>
                        {keys.map(key => {
                            const value = formData[key];
                            if (value === '' || value === undefined || value === null) return null;

                            const label = formatKeyForDisplay(key);
                            
                            if (key === 'description') {
                                return (
                                    <View key={key} style={styles.previewItemFull}>
                                        <Text style={styles.previewLabel}>{label}:</Text>
                                        <Text style={styles.previewValue}>{value}</Text>
                                    </View>
                                );
                            }
                            
                            return (
                                <View key={key} style={styles.previewItem}>
                                    <Text style={styles.previewLabel}>{label}</Text>
                                    <Text style={styles.previewValue}>{value}</Text>
                                </View>
                            );
                        })}
                        <View style={styles.previewItemFull}>
                            <Text style={styles.previewLabel}>Images</Text>
                            <Text style={styles.previewValue}>{formData.images.length} uploaded</Text>
                        </View>
                        <View style={{marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0'}}>
                             <Text style={{fontSize: 14, fontWeight: '700', color: THEME_COLOR}}>
                                  Bank Details Are NOT Public
                             </Text>
                        </View>
                    </ScrollView>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity 
                            style={[styles.modalBtn, styles.cancelBtn]} 
                            onPress={() => setShowPreview(false)}
                        >
                            <Text>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.modalBtn, styles.confirmBtn]} 
                            onPress={submitToApi}
                            disabled={isSubmitting}
                        >
                             {isSubmitting ? (
                                 <ActivityIndicator color="#fff" />
                             ) : (
                                <Text style={{color: '#fff', fontWeight: 'bold'}}>Confirm & Submit</Text>
                             )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
  };
  
  // --- STEP 1 CONTENT ---
  const renderStep1 = () => (
    <View>


      {(formData.propertyType === 'Apartment'  || formData.propertyType === 'Villa') && (
        <>
      <DropdownMock label="Property Type" placeholder="Eg: Apartment" value={formData.propertyType} fieldName="propertyType" />
      <DropdownMock label="Rent / Sell" placeholder="Select Rent or Sell" value={formData.rentOrSell} fieldName="rentOrSell" />
      <DropdownMock label="BHK" placeholder="Select number of BHK" value={formData.bhk} fieldName="bhk" />
      <View>
        <Text style={styles.label}>Bathrooms</Text>
<TextInput
  style={styles.bareInput}
  keyboardType="numeric"
  placeholder="Bathrooms"
  value={formData.bathrooms}
  onChangeText={(v) => handleInputChange('bathrooms', v)}
/>
</View>
      <DropdownMock label="Car Parking" placeholder="Eg: 2" fieldName="parking" value={formData.parking} />
      <DropdownMock label="Furnishing" placeholder="Select Furnishing Status" value={formData.furnishing} fieldName="furnishing" />
      <DropdownMock label="Construction Status" placeholder="Eg: Ready To Move In" fieldName="constructionStatus" value={formData.constructionStatus} />
      <DropdownMock label="Listed By" placeholder="Eg: Builder" value={formData.listedBy} fieldName="listedBy" />
      
 

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Build Up Area (Sq.ft) <Text style={styles.required}>*</Text></Text>
          <TextInput 
             style={styles.bareInput}
             placeholder="1230" 
             placeholderTextColor="#999"
             value={formData.buildUpArea}
             onChangeText={(text) => handleInputChange('buildUpArea', text)}
             keyboardType="numeric"
          />
        </View>
        
        <View style={styles.halfInput}>
          <Text style={styles.label}>Carpet Area (Sq.ft) <Text style={styles.required}>*</Text></Text>
          <TextInput 
             style={styles.bareInput}
             placeholder="1230"
             placeholderTextColor="#999"
             value={formData.carpetArea}
             onChangeText={(text) => handleInputChange('carpetArea', text)}
             keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.row}>
         <View style={styles.halfInput}>
            <Text style={styles.label}>Total Floors <Text style={styles.required}>*</Text></Text>
            <TextInput 
               style={styles.bareInput}
               placeholder="Eg: 28"
               placeholderTextColor="#999"
               value={formData.totalFloors}
               onChangeText={(text) => handleInputChange('totalFloors', text)}
               keyboardType="numeric"
            />
         </View>
         <View style={styles.halfInput}>
            <DropdownMock label="Facing" placeholder="Eg: East" value={formData.facing} fieldName="facing" />
         </View>
      </View>
      
       <Text style={styles.label}>Floor No <Text style={styles.required}>*</Text></Text>
      <TextInput 
         style={styles.bareInput}
         placeholder="120000"
         placeholderTextColor="#999"
         value={formData.floor_no}
         onChangeText={(text) => handleInputChange('floor_no', text)}
         keyboardType="numeric"
      />


      <Text style={styles.label}>Set a Price (₹) <Text style={styles.required}>*</Text></Text>
      <TextInput 
         style={styles.bareInput}
         placeholder="120000"
         placeholderTextColor="#999"
         value={formData.price}
         onChangeText={(text) => handleInputChange('price', text)}
         keyboardType="numeric"
      />

    

      <Text style={styles.label}>Project Name</Text>
      <TextInput 
         style={styles.bareInput}
         placeholder="Eg: GreenVista Heights"
         placeholderTextColor="#999"
         value={formData.project_name}
         onChangeText={(text) => handleInputChange('project_name', text)}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput 
         style={[styles.bareInput, styles.textArea]}
         placeholder="Add details about your property..."
         placeholderTextColor="#999"
         value={formData.description}
         onChangeText={(text) => handleInputChange('description', text)}
         multiline={true}
      />
      
      </>
      )}



      {( formData.propertyType === 'Plots') && (
  <>

        <DropdownMock label="Property Type" placeholder="Eg: Apartment" value={formData.propertyType} fieldName="propertyType" />
      <DropdownMock label="Rent / Sell" placeholder="Select Rent or Sell" value={formData.rentOrSell} fieldName="rentOrSell" />
    <DropdownMock
      label="Plot Type"
      placeholder="Select Plot Type"
      value={formData.plot_type}
      fieldName="plot_type"
    />

    <View>
      <Text style={styles.label}>Plot Area (Sq.ft)</Text>
      <TextInput
        style={styles.bareInput}
        placeholder="Eg: 2400"
        keyboardType="numeric"
        value={formData.plot_area}
        onChangeText={(v) => handleInputChange('plot_area', v)}
      />
    </View>

    <View style={styles.row}>
      <View style={styles.halfInput}>
        <Text style={styles.label}>Length (ft)</Text>
        <TextInput
          style={styles.bareInput}
          placeholder="Eg: 60"
          keyboardType="numeric"
          value={formData.length}
          onChangeText={(v) => handleInputChange('length', v)}
        />
      </View>

      <View style={styles.halfInput}>
        <Text style={styles.label}>Breadth (ft)</Text>
        <TextInput
          style={styles.bareInput}
          placeholder="Eg: 40"
          keyboardType="numeric"
          value={formData.breadth}
          onChangeText={(v) => handleInputChange('breadth', v)}
        />
      </View>

      
    </View>

    <Text style={styles.label}>Price Per SQRT (₹) <Text style={styles.required}>*</Text></Text>
      <TextInput 
         style={styles.bareInput}
         placeholder="120000"
         placeholderTextColor="#999"
         value={formData.sqftprice}
         onChangeText={(text) => handleInputChange('sqftprice', text)}
         keyboardType="numeric"
      />

    
      <DropdownMock label="Listed By" placeholder="Eg: Builder" value={formData.listedBy} fieldName="listedBy" />
      <Text style={styles.label}>Project Name</Text>
      <TextInput 
         style={styles.bareInput}
         placeholder="Eg: GreenVista Heights"
         placeholderTextColor="#999"
         value={formData.project_name}
         onChangeText={(text) => handleInputChange('project_name', text)}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput 
         style={[styles.bareInput, styles.textArea]}
         placeholder="Add details about your property..."
         placeholderTextColor="#999"
         value={formData.description}
         onChangeText={(text) => handleInputChange('description', text)}
         multiline={true}
      />
  </>
)}


  {( formData.propertyType === 'Office') && (
  <>

       <DropdownMock label="Property Type" placeholder="Eg: Apartment" value={formData.propertyType} fieldName="propertyType" />
      <DropdownMock label="Rent / Sell" placeholder="Select Rent or Sell" value={formData.rentOrSell} fieldName="rentOrSell" />
       
      <View>
        <Text style={styles.label}>Bathrooms</Text>
<TextInput
  style={styles.bareInput}
  keyboardType="numeric"
  placeholder="Bathrooms"
  value={formData.bathrooms}
  onChangeText={(v) => handleInputChange('bathrooms', v)}
/>
 <Text style={styles.label}>Washrooms</Text>
<TextInput
  style={styles.bareInput}
  keyboardType="numeric"
  placeholder="washrooms"
  value={formData.bathrooms}
  onChangeText={(v) => handleInputChange('washrooms', v)}
/>
</View>
      <DropdownMock label="Car Parking" placeholder="Eg: 2" fieldName="parking" value={formData.parking} />
      <DropdownMock label="Furnishing" placeholder="Select Furnishing Status" value={formData.furnishing} fieldName="furnishing" />
      <DropdownMock label="Construction Status" placeholder="Eg: Ready To Move In" fieldName="constructionStatus" value={formData.constructionStatus} />
      <DropdownMock label="Listed By" placeholder="Eg: Builder" value={formData.listedBy} fieldName="listedBy" />
      
 

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Build Up Area (Sq.ft) <Text style={styles.required}>*</Text></Text>
          <TextInput 
             style={styles.bareInput}
             placeholder="1230" 
             placeholderTextColor="#999"
             value={formData.buildUpArea}
             onChangeText={(text) => handleInputChange('buildUpArea', text)}
             keyboardType="numeric"
          />
        </View>
        
        <View style={styles.halfInput}>
          <Text style={styles.label}>Carpet Area (Sq.ft) <Text style={styles.required}>*</Text></Text>
          <TextInput 
             style={styles.bareInput}
             placeholder="1230"
             placeholderTextColor="#999"
             value={formData.carpetArea}
             onChangeText={(text) => handleInputChange('carpetArea', text)}
             keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.row}>
         <View style={styles.halfInput}>
            <Text style={styles.label}>Total Floors <Text style={styles.required}>*</Text></Text>
            <TextInput 
               style={styles.bareInput}
               placeholder="Eg: 28"
               placeholderTextColor="#999"
               value={formData.totalFloors}
               onChangeText={(text) => handleInputChange('totalFloors', text)}
               keyboardType="numeric"
            />
         </View>
         <View style={styles.halfInput}>
            <DropdownMock label="Facing" placeholder="Eg: East" value={formData.facing} fieldName="facing" />
         </View>
      </View>
      
      <Text style={styles.label}>Set a Price (₹) <Text style={styles.required}>*</Text></Text>
      <TextInput 
         style={styles.bareInput}
         placeholder="120000"
         placeholderTextColor="#999"
         value={formData.price}
         onChangeText={(text) => handleInputChange('price', text)}
         keyboardType="numeric"
      />

    

      <Text style={styles.label}>Project Name</Text>
      <TextInput 
         style={styles.bareInput}
         placeholder="Eg: GreenVista Heights"
         placeholderTextColor="#999"
         value={formData.project_name}
         onChangeText={(text) => handleInputChange('project_name', text)}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput 
         style={[styles.bareInput, styles.textArea]}
         placeholder="Add details about your property..."
         placeholderTextColor="#999"
         value={formData.description}
         onChangeText={(text) => handleInputChange('description', text)}
         multiline={true}
      />
      </>
      )}


      {( formData.propertyType === 'Pg') && (
      <>

  <DropdownMock
      label="Property Type"
      value={formData.propertyType}
      fieldName="propertyType"
    />

    <DropdownMock
      label="Listed By"
      value={formData.listedBy}
      fieldName="listedBy"
    />

    <Text style={styles.label}>Monthly Rent (₹)</Text>
    <TextInput
      style={styles.bareInput}
      keyboardType="numeric"
      placeholder="Eg: 8000"
      value={formData.price}
      onChangeText={(v) => handleInputChange('price', v)}
    />

    <Text style={styles.label}>Security Deposit (₹)</Text>
    <TextInput
      style={styles.bareInput}
      keyboardType="numeric"
      placeholder="Eg: 5000"
      value={formData.deposit}
      onChangeText={(v) => handleInputChange('deposit', v)}
    />

    <Text style={styles.label}>Total Beds</Text>
    <TextInput
      style={styles.bareInput}
      keyboardType="numeric"
      placeholder="Eg: 10"
      value={formData.totalBeds}
      onChangeText={(v) => handleInputChange('totalBeds', v)}
    />

    <Text style={styles.label}>Beds Available</Text>
    <TextInput
      style={styles.bareInput}
      keyboardType="numeric"
      placeholder="Eg: 3"
      value={formData.availableBeds}
      onChangeText={(v) => handleInputChange('availableBeds', v)}
    />

    <DropdownMock
      label="Sharing Type"
      value={formData.sharingType}
      fieldName="sharingType"
      placeholder="Single / Double / Triple"
    />

    <Text style={styles.label}>Bathrooms</Text>
    <TextInput
      style={styles.bareInput}
      keyboardType="numeric"
      value={formData.bathrooms}
      onChangeText={(v) => handleInputChange('bathrooms', v)}
    />

    <Text style={styles.label}>Washrooms</Text>
    <TextInput
      style={styles.bareInput}
      keyboardType="numeric"
      value={formData.washrooms}
      onChangeText={(v) => handleInputChange('washrooms', v)}
    />

    <DropdownMock
      label="Furnishing"
      value={formData.furnishing}
      fieldName="furnishing"
    />

    <DropdownMock
      label="Food Available"
      value={formData.foodAvailable}
      fieldName="foodAvailable"
    />

    <DropdownMock
      label="Preferred Tenants"
      value={formData.preferredTenants}
      fieldName="preferredTenants"
      placeholder="Boys / Girls / Anyone"
    />

    <DropdownMock
      label="Parking"
      value={formData.parking}
      fieldName="parking"
    />

    <Text style={styles.label}>Description</Text>
    <TextInput
      style={[styles.bareInput, styles.textArea]}
      multiline
      value={formData.description}
      onChangeText={(v) => handleInputChange('description', v)}
    />
      

        
      </>
      )}

    </View>




      
  );

  // --- STEP 2 CONTENT (Location + Email) ---
  const renderStep2 = () => (
    <View>
      
      <Text style={styles.label}>Full Address<Text style={styles.required}>*</Text></Text>
      <TextInput 
         style={styles.bareInput}
         placeholder="Full Address"
         placeholderTextColor="#999"
         value={formData.area}
         onChangeText={(text) => handleInputChange('area', text)}
      />
      <Text style={styles.label}>Door No & Street Name <Text style={styles.required}>*</Text></Text>
      <TextInput 
         style={styles.bareInput}
         placeholder="Eg: 190/1 Happy Street"
         placeholderTextColor="#999"
         value={formData.doorNo}
         onChangeText={(text) => handleInputChange('doorNo', text)}
      />
       <Text style={styles.label}>Map Url<Text style={styles.required}>*</Text></Text>
      <TextInput 
         style={styles.bareInput}
         placeholder="Eg: Anna Nagar"
         placeholderTextColor="#999"
         value={formData.map_url}
         onChangeText={(text) => handleInputChange('map_url', text)}
      />

       <Text style={styles.label}>Latitude <Text style={styles.required}>*</Text></Text>
     <TextInput
  style={styles.bareInput}
  placeholder="Latitude"
  placeholderTextColor="#999"
  value={formData.latitude ? String(formData.latitude) : ''}
  editable={false}   // auto-filled from GPS
/>


       <Text style={styles.label}>longtitude <Text style={styles.required}>*</Text></Text>
      <TextInput
  style={styles.bareInput}
  placeholder="Longitude"
  placeholderTextColor="#999"
  value={formData.longtitude ? String(formData.longtitude) : ''}
  editable={false}   // auto-filled from GPS
/>


      <DropdownMock label="Near By Landmark" placeholder="Select a nearby landmark" value={formData.landmark} fieldName="landmark" />
      
      <Text style={styles.label}>Pin Code <Text style={styles.required}>*</Text></Text>
      <TextInput 
         style={styles.bareInput}
         placeholder="Eg: 600001"
         placeholderTextColor="#999"
         value={formData.pinCode}
         onChangeText={(text) => handleInputChange('pinCode', text)}
         keyboardType="numeric"
         maxLength={6}
      />
      <Text style={styles.label}>City <Text style={styles.required}>*</Text></Text>
      <TextInput 
         style={styles.bareInput}
         placeholder="Eg: Chennai"
         placeholderTextColor="#999"
         value={formData.city}
         onChangeText={(text) => handleInputChange('city', text)}
      />
      <Text style={styles.label}>State <Text style={styles.required}>*</Text></Text>
      <TextInput 
         style={styles.bareInput}
         placeholder="Eg: Tamil Nadu"
         placeholderTextColor="#999"
         value={formData.state}
         onChangeText={(text) => handleInputChange('state', text)}
      />
      
       
    </View>
  );
  
  // --- STEP 3 CONTENT (Media) ---
  const renderStep3 = () => (
    <View>
       <Text style={styles.label}>Gallery <Text style={styles.required}>*</Text></Text>
       <TouchableOpacity 
           style={styles.uploadBox} 
           onPress={handleImageUpload} 
           disabled={formData.images.length >= 10 || isSubmitting}
       >
          <Text style={{fontSize: 30, color: '#ccc'}}>{formData.images.length >= 10 ? '🚫' : '+'}</Text>
          <Text style={{color: '#666', marginTop: 5}}>
               {formData.images.length >= 10 ? 'Max Reached (10)' : `Upload Images (${formData.images.length}/10)`}
          </Text>
       </TouchableOpacity>
       
       <View style={{marginTop: 20}}>
           <Text style={styles.label}>Uploaded Images ({formData.images.length})</Text>
           {formData.images.length > 0 ? (
                <FlatList
                    data={formData.images}
                    keyExtractor={(item, index) => index.toString()}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item, index }) => (
                        <View style={styles.imagePreviewContainer}>
                            <Image 
                                source={{ uri: item.uri }} 
                                style={styles.previewImage}
                            />
                            <TouchableOpacity 
                                style={styles.removeImageButton}
                                onPress={() => handleImageRemove(index)}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.removeImageText}>X</Text>
                            </TouchableOpacity>
                            <Text style={styles.imageCaption}>
                                {item.fileName.substring(0, 15) + '...'}
                            </Text>
                        </View>
                    )}
                />
           ) : (
               <Text style={{color: '#999', paddingLeft: 5, paddingVertical: 10}}>No images uploaded yet. Upload high-quality photos to attract buyers.</Text>
           )}
       </View>
    </View>
);

  // --- STEP 4 CONTENT (Final Preview & Bank Details INPUT) ---
  const renderStep4 = () => {
      // Combines all fields for a complete review
      const propertyKeys = [...PROPERTY_FIELDS, ...LOCATION_FIELDS, 'email'];

      const renderReviewItem = (key) => {
          const value = formData[key];
          if (value === '' || value === undefined || value === null) return null;
          
          const label = formatKeyForDisplay(key);

          if (key === 'description') {
              return (
                  <View key={key} style={styles.previewItemFull}>
                      <Text style={styles.previewLabel}>{label}:</Text>
                      <Text style={styles.previewValue}>{value}</Text>
                  </View>
              );
          }
          
          return (
              <View key={key} style={styles.previewItem}>
                  <Text style={styles.previewLabel}>{label}</Text>
                  <Text style={styles.previewValue}>{value}</Text>
              </View>
          );
      };
      
      return (
        <View>
            <Text style={styles.sectionHeader}>📋 Property Review (Public Data)</Text>
            {propertyKeys.map(key => renderReviewItem(key))}
            
            <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>Images Uploaded</Text>
                <Text style={styles.previewValue}>{formData.images.length} photos</Text>
            </View>

           
        </View>
      );
  };


  // --- MAIN RETURN ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : Alert.alert('Back', 'Go back to Home?')}
          disabled={isSubmitting}
        >
          <Text style={styles.headerIcon}>{'<'}</Text> 
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentStep === 1 ? 'Property Features' : currentStep === 2 ? 'Location Details' : currentStep === 3 ? 'Media Upload' : 'Finalize & Submit'}
        </Text>
        <View style={styles.headerRight}>
             <TouchableOpacity onPress={() => setCurrentStep(1)} disabled={isSubmitting}>
                 <Text style={styles.headerIcon}>↺</Text>
             </TouchableOpacity>
             <View style={styles.stepBadge}>
                 <Text style={styles.stepText}>{currentStep}/4</Text>
             </View>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
        {renderTab(1, 'Features')}
        {renderTab(2, 'Location')}
        {renderTab(3, 'Media')}
        {renderTab(4, 'Preview')}
      </View>

      {/* FORM CONTENT */}
      <ScrollView style={styles.content} contentContainerStyle={{paddingBottom: 100}} keyboardShouldPersistTaps="handled">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()} 

        <View style={styles.footerSpacing} />
      </ScrollView>

      {/* BOTTOM BUTTON */}
      <View style={styles.footer}>
        {currentStep < 4 ? (
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonSubmit, isSubmitting && {opacity: 0.7}]} 
            onPress={handleNext} 
            disabled={isSubmitting}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextSubmit]}>Continue to Step {currentStep + 1}</Text>
          </TouchableOpacity>
        ) : (
            <TouchableOpacity 
                style={[styles.actionButton, styles.actionButtonSubmit, isSubmitting && {opacity: 0.7}]} 
                onPress={() => Alert.alert("Confirm Submission", "Are you sure all details are correct and you want to submit?", [{text: "Cancel"}, {text: "Submit", onPress: submitToApi}])} 
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={[styles.actionButtonText, styles.actionButtonTextSubmit]}>Confirm & Submit Listing</Text>
                )}
            </TouchableOpacity>
        )}
      </View>

      {/* MODALS */}
      {renderDropdownModal()}
      {/* We only need the preview modal if the user explicitly triggers a dedicated preview before submission */}
      {/* {renderPreviewModal()} */} 

    </SafeAreaView>
  );
};
// ... (Styles remain the same)
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      paddingTop: 50, // Added paddingTop to accommodate Safe Area View
    },
    // --- HEADER ---
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#000',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
    },
    headerIcon: {
      fontSize: 24,
      color: '#333',
    },
    stepBadge: {
      backgroundColor: THEME_COLOR,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    stepText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },
    // --- TABS ---
    tabContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between', 
      paddingHorizontal: 15,
      marginBottom: 20,
      paddingTop: 10,
    },
    tabWrapper: {
      alignItems: 'center',
      flex: 1, 
    },
    tabIndicator: {
      width: 28, 
      height: 28,
      borderRadius: 14,
      backgroundColor: '#ddd',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 5,
    },
    tabIndicatorActive: {
      backgroundColor: THEME_COLOR,
    },
    stepNumberText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#000',
    },
    checkIcon: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
    tabText: {
      fontSize: 10, 
      color: '#888',
      fontWeight: '500',
      textAlign: 'center',
    },
    tabTextActive: {
      fontWeight: '700',
      color: '#333',
    },
    tabTextComplete: {
      color: THEME_COLOR,
    },
    // --- FORM INPUTS & LAYOUT ---
    content: {
      paddingHorizontal: 20,
    },
    inputContainer: {
      marginBottom: 5, 
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: '#333',
      marginBottom: 8, 
    },
    required: {
      color: 'red',
    },
  
    bareInput: {
      backgroundColor: '#F9F9F9',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: '#333',
      marginBottom: 5, 
      borderWidth: 1,
      borderColor: '#E0E0E0',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    dropdown: {
      backgroundColor: LIGHT_BG,
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#f0f0f0',
      marginBottom: 15,
    },
    inputText: {
      fontSize: 14,
      color: '#333',
    },
    dropdownIcon: {
      fontSize: 12,
      color: '#666',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    halfInput: {
      width: '48%',
    },
    uploadBox: {
      width: 120,
      height: 120,
      borderWidth: 1.5,
      borderColor: THEME_COLOR,
      borderStyle: 'dashed',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fafafa',
    },
    uploadedImageText: {
        fontSize: 13,
        color: '#333',
        paddingVertical: 2,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: THEME_COLOR,
        marginTop: 20,
        marginBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: THEME_COLOR,
        paddingBottom: 5,
    },
    // --- FOOTER & BUTTONS ---
    footerSpacing: {
      height: 50,
    },
    footer: {
      padding: 20,
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    actionButton: {
      backgroundColor: '#fff',
      borderWidth: 1.5,
      borderColor: THEME_COLOR,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
    },
    actionButtonSubmit: {
        backgroundColor: THEME_COLOR,
        marginTop: 0, 
    },
    actionButtonTextSubmit: {
        color: '#fff',
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: THEME_COLOR,
    },
    // --- MODAL STYLES ---
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    previewModalCenter: { 
      flex: 1,
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    previewModalContent: { 
      width: '90%',
      backgroundColor: '#fff',
      borderRadius: 15,
      padding: 20,
      elevation: 5,
    },
    previewItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    previewItemFull: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    previewLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    previewValue: {
        fontSize: 13,
        color: '#333',
        maxWidth: '50%',
        textAlign: 'right',
    },
    dropdownModalContent: { 
      backgroundColor: '#fff',
      borderTopLeftRadius: 15,
      borderTopRightRadius: 15,
      padding: 20,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'center',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    modalBtn: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 5,
    },
    cancelBtn: {
      backgroundColor: '#eee',
    },
    confirmBtn: {
      backgroundColor: THEME_COLOR,
    },
    modalOption: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    modalOptionText: {
      fontSize: 16,
      color: '#333',
    },
    uploadBox: {
        borderWidth: 2,
        borderColor: '#ccc',
        borderStyle: 'dashed',
        borderRadius: 10,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: '#fff',
    },
    imagePreviewContainer: {
        width: 100,
        height: 120, // Taller to accommodate caption
        marginRight: 15,
        borderRadius: 8,
        overflow: 'hidden', // Clips the image
        position: 'relative',
        backgroundColor: LIGHT_BG,
        borderWidth: 1,
        borderColor: '#eee',
    },
    previewImage: {
        width: '100%',
        height: 90, // Image takes top part
        resizeMode: 'cover',
    },
    imageCaption: {
        fontSize: 10,
        color: '#333',
        textAlign: 'center',
        paddingVertical: 3,
        height: 30, // Fixed height for caption
        backgroundColor: '#fff',
    },
    removeImageButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: THEME_COLOR,
        borderRadius: 12,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10, // Ensure button is above image
    },
    removeImageText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    
    // ... (Rest of existing styles)
    
    // Existing styles you'll need:
    label: { 
        fontSize: 14, 
        color: '#333', 
        marginBottom: 5, 
        marginTop: 15 
    },
    required: {
        color: 'red',
        fontSize: 12
    },
  });
  
  export default SellerUploadScreen;