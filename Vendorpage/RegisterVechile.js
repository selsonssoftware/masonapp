import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { TextInput, Text, Button, Checkbox, Searchbar } from "react-native-paper";
import { launchImageLibrary } from "react-native-image-picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RegisterVehicle({ navigation }) {

  // --- Form States ---
  const [userId, setUserId] = useState(null);
  const [transportName, setTransportName] = useState("");
    const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [street, setStreet] = useState("");
  const [location, setLocation] = useState(""); 
  const [serviceArea, setServiceArea] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [logo, setLogo] = useState(null);
  
  // --- Dynamic Data States ---
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState([]);
  
  // --- Location Hierarchy States ---
  const [fullLocationData, setFullLocationData] = useState([]); 
  
  const [statesList, setStatesList] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  
  const [districtsList, setDistrictsList] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(""); 
  
  const [officesList, setOfficesList] = useState([]); // List of Office Names
  const [selectedOffice, setSelectedOffice] = useState(""); // Selected Office Name
  
  const [pincode, setPincode] = useState(""); // Auto-filled based on Office

  // --- Modal States ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(""); // 'CATEGORY', 'STATE', 'DISTRICT', 'OFFICE'
  const [modalData, setModalData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // --- 1. Load User ID ---
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const id = await AsyncStorage.getItem("user_id");
        if (id) setUserId(id);
      } catch (e) {
        console.log("Error loading user_id", e);
      }
    };
    loadUserId();
  }, []);

  // --- 2. Fetch Vehicle Categories ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("https://masonshop.in/api/vehicle-categories");
        const json = await response.json();

        if (json && json.status === true && json.data) {
           const cats = json.data.map(item => item.rvc_name);
           setCategoriesList(cats);
        } else {
           setCategoriesList([]);
        }
      } catch (error) {
        console.log("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // --- 3. Fetch Location Data ---
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("https://masonshop.in/api/getAllStatesData");
        const json = await response.json(); 
        
        setFullLocationData(json);
        
        if(Array.isArray(json)){
            const states = json.map(item => item.state);
            setStatesList(states);
        }
      } catch (error) {
        console.log("Location fetch error:", error);
      }
    };
    fetchLocations();
  }, []);

  // --- Handlers for Selection Logic ---
  
  // 1. State Selected -> Load Districts
  const handleStateSelect = (state) => {
    setSelectedState(state);
    
    // Reset lower levels
    setSelectedDistrict(""); 
    setSelectedOffice("");
    setPincode("");
    setOfficesList([]);
    
    // Find districts for this state
    const stateData = fullLocationData.find(item => item.state === state);
    if (stateData && stateData.districts) {
      const districts = stateData.districts.map(d => d.district);
      setDistrictsList(districts);
    } else {
      setDistrictsList([]);
    }
    setModalVisible(false);
  };

  // 2. District Selected -> Load Offices
  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    
    // Reset lower levels
    setSelectedOffice("");
    setPincode("");
    
    // Find offices for this district
    const stateData = fullLocationData.find(item => item.state === selectedState);
    const districtData = stateData?.districts.find(d => d.district === district);
    
    if (districtData && districtData.offices) {
      // Map office names
      const offices = districtData.offices.map(o => o.officename);
      setOfficesList(offices);
    } else {
      setOfficesList([]);
    }
    setModalVisible(false);
  };

  // 3. Office Selected -> Auto Select Pincode
  const handleOfficeSelect = (officeName) => {
    setSelectedOffice(officeName);

    // Find the specific office object to get pincode
    const stateData = fullLocationData.find(item => item.state === selectedState);
    const districtData = stateData?.districts.find(d => d.district === selectedDistrict);
    const officeData = districtData?.offices.find(o => o.officename === officeName);

    if (officeData && officeData.pincode) {
      setPincode(officeData.pincode.toString());
    } else {
      setPincode("");
    }
    setModalVisible(false);
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setModalVisible(false);
  };

  // --- Open Modal Helper ---
  const openModal = (type, data) => {
    setModalType(type);
    setModalData(data);
    setSearchQuery("");
    setModalVisible(true);
  };

  // --- Image Picker ---
  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: "photo", quality: 1 });
    if (result.didCancel) return;
    if (result.assets && result.assets.length > 0) {
      const image = result.assets[0];
      if (image.fileSize > 2 * 1024 * 1024) {
        Alert.alert("Error", "Image should be below 2MB");
        return;
      }
      setLogo(image);
    }
  };

  // --- Submit ---
  const handleNext = () => {
    if (!termsAccepted) {
      Alert.alert("Error", "Please accept vendor terms");
      return;
    }
    if (!userId) {
      Alert.alert("Error", "User not logged in");
      return;
    }
    
    if(!transportName || !street || !selectedState || !selectedDistrict || !selectedOffice || !pincode){
       Alert.alert("Missing Fields", "Please fill all required fields marked with *");
       return;
    }

    const VechileData = {
      user_id: userId,
      store_name: transportName,
      role: role,
      category: selectedCategory, 
      description,
      address: street,
      city: selectedDistrict, // Sending District as City
      state: selectedState,   
      pincode: pincode,
      office_name: selectedOffice, // Added extra field if needed by backend, otherwise covered in address
      location,
      service: serviceArea,
      logo,
      bank_account: "",
      ifsc: "",
      upi: "",
      holder_name: "",
      gst_image: null,
    };

    navigation.navigate("Kycformvechile", { VechileData });
  };

  // --- Render Modal List Item ---
  const renderModalItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        if (modalType === "CATEGORY") handleCategorySelect(item);
        if (modalType === "STATE") handleStateSelect(item);
        if (modalType === "DISTRICT") handleDistrictSelect(item);
        if (modalType === "OFFICE") handleOfficeSelect(item);
      }}
    >
      <Text style={styles.modalItemText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={28} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Register Vehicle</Text>
        <Text style={styles.subtitle}>Set up branding and basic structure of the vendor's store</Text>

        {/* Transport Name */}
        <TextInput
          label="Transport Name *"
          value={transportName}
          onChangeText={setTransportName}
          style={styles.input}
          mode="outlined"
          outlineColor="#eee"
          activeOutlineColor="#e91e63"
        />

         <TextInput
          label="Role *"
          value={role}
          onChangeText={setRole}
          style={styles.input}
          mode="outlined"
          outlineColor="#eee"
          activeOutlineColor="#e91e63"
        />

        {/* Category Selector */}
        {/* <TouchableOpacity onPress={() => openModal("CATEGORY", categoriesList)}>
          <View pointerEvents="none">
            <TextInput
              label="Vehicle Category *"
              value={selectedCategory}
              style={styles.input}
              mode="outlined"
              outlineColor="#eee"
              right={<TextInput.Icon icon="chevron-down" />}
              placeholder="Select Category"
            />
          </View>
        </TouchableOpacity> */}

        {/* Description */}
        <TextInput
          label="Description *"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          mode="outlined"
          outlineColor="#eee"
          activeOutlineColor="#e91e63"
          multiline
        />

        {/* Logo Upload */}
        <Text style={styles.sectionLabel}>Logo *</Text>
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            {logo ? (
              <Image source={{ uri: logo.uri }} style={styles.logoPreview} />
            ) : (
              <Text style={{ fontSize: 12, color: "#666" }}>Max 2MB</Text>
            )}
          </View>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <Text style={{ color: "#e91e63", fontWeight: "bold" }}>Upload</Text>
          </TouchableOpacity>
        </View>

        {/* Location Section */}
        <Text style={styles.sectionTitle}>Location Details</Text>
        <Text style={styles.subtitleSmall}>Please select area to auto-detect pincode</Text>

        {/* 1. State Selector */}
        <TouchableOpacity onPress={() => openModal("STATE", statesList)}>
          <View pointerEvents="none">
            <TextInput
              label="State *"
              value={selectedState}
              style={styles.input}
              mode="outlined"
              outlineColor="#eee"
              right={<TextInput.Icon icon="chevron-down" />}
            />
          </View>
        </TouchableOpacity>

        {/* 2. District Selector */}
        <TouchableOpacity 
          onPress={() => {
            if(!selectedState) Alert.alert("Required", "Please Select State First");
            else openModal("DISTRICT", districtsList);
          }}
        >
          <View pointerEvents="none">
            <TextInput
              label="District *"
              value={selectedDistrict}
              style={styles.input}
              mode="outlined"
              outlineColor="#eee"
              right={<TextInput.Icon icon="chevron-down" />}
            />
          </View>
        </TouchableOpacity>

        {/* 3. Office Selector */}
        <TouchableOpacity 
          onPress={() => {
            if(!selectedDistrict) Alert.alert("Required", "Please Select District First");
            else openModal("OFFICE", officesList);
          }}
        >
          <View pointerEvents="none">
            <TextInput
              label="Post Office / Area *"
              value={selectedOffice}
              style={styles.input}
              mode="outlined"
              outlineColor="#eee"
              right={<TextInput.Icon icon="chevron-down" />}
            />
          </View>
        </TouchableOpacity>

        {/* 4. Pincode (Auto-filled) */}
        <TextInput
          label="Pincode (Auto-filled) *"
          value={pincode}
          editable={false} // Prevent manual edit to ensure accuracy
          style={[styles.input, { backgroundColor: "#f0f0f0" }]}
          mode="outlined"
          outlineColor="#eee"
        />

        {/* Address Fields */}
        <TextInput
          label="Street Address / Door No *"
          value={street}
          onChangeText={setStreet}
          style={styles.input}
          mode="outlined"
          outlineColor="#eee"
          activeOutlineColor="#e91e63"
        />

        <TextInput
          label="Specific Location / Landmark"
          value={location}
          onChangeText={setLocation}
          style={styles.input}
          mode="outlined"
          outlineColor="#eee"
          activeOutlineColor="#e91e63"
        />
        
        <TextInput
          label="Serviceable Area *"
          value={serviceArea}
          onChangeText={setServiceArea}
          style={styles.input}
          mode="outlined"
          outlineColor="#eee"
          activeOutlineColor="#e91e63"
        />

        {/* Terms */}
        <View style={styles.checkboxRow}>
          <Checkbox 
            status={termsAccepted ? "checked" : "unchecked"} 
            onPress={() => setTermsAccepted(!termsAccepted)} 
            color="#e91e63" 
          />
          <Text style={styles.checkboxLabel}>Store Accept Mason Vendor Terms</Text>
        </View>

        {/* Submit */}
        <Button mode="contained" style={styles.nextBtn} onPress={handleNext}>
          Submit
        </Button>
      </ScrollView>

      {/* --- Selection Modal --- */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
               Select {modalType === 'DISTRICT' ? 'District' : modalType === 'OFFICE' ? 'Post Office / Area' : modalType}
            </Text>
            
            <Searchbar
              placeholder="Search..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
            />

            <FlatList
              data={modalData.filter(item => 
                item.toString().toLowerCase().includes(searchQuery.toLowerCase())
              )}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderModalItem}
              ListEmptyComponent={<Text style={{textAlign:'center', padding: 20, color:'#888'}}>No data found</Text>}
            />
            
            <Button mode="text" onPress={() => setModalVisible(false)} color="#e91e63">
              Close
            </Button>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  backBtn: { marginBottom: 10 },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginTop: 10 },
  subtitle: { fontSize: 14, textAlign: "center", color: "#555", marginBottom: 20 },
  subtitleSmall: { fontSize: 13, textAlign: "center", color: "#777", marginBottom: 15 },
  input: {
    marginBottom: 15,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  sectionLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  logoRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  logoBox: {
    flex: 0.8,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  logoPreview: { width: "90%", height: "90%", borderRadius: 8, resizeMode: "contain" },
  uploadBtn: {
    flex: 0.2,
    borderWidth: 1,
    borderColor: "#e91e63",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8, marginTop: 10, textAlign: "center" },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginVertical: 15 },
  checkboxLabel: { fontSize: 14, color: "#333" },
  nextBtn: { backgroundColor: "#e91e63", borderRadius: 25, paddingVertical: 8 },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalItemText: {
    fontSize: 16,
  },
  searchBar: {
    marginBottom: 10,
    backgroundColor: '#f1f1f1',
    elevation: 0,
    height: 45,
    borderRadius: 10
  }
});