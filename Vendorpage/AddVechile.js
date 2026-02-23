import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
  Modal,
  FlatList,
} from "react-native";
import { Text, TextInput, Button, Surface, Divider } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { launchImageLibrary } from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import LinearGradient from "react-native-linear-gradient";

export default function VehicleUploadForm({ navigation }) {
  // --- ALL ORIGINAL STATES ---
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [rentalDay, setRentalDay] = useState("");
  const [rentalHour, setRentalHour] = useState("");
  const [rentalKm, setRentalKm] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [capacityLoader, setCapacityLoader] = useState("");
  const [capacitySeating, setCapacitySeating] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [vehicleImage, setVehicleImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- LOCATION & CATEGORY STATES ---
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [pincode, setPincode] = useState("");
  const [selectedCategory, setSelectedCategory] = useState({ id: null, name: "Select Category *" });

  // --- MODAL STATES ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(""); // 'cat', 'state', 'dist', 'office'

  // --- API DATA ---
  const { data: categories } = useQuery({
    queryKey: ["vehicleCategories"],
    queryFn: async () => {
      const res = await fetch("https://masonshop.in/api/vehicle-categories");
      const json = await res.json();
      return json?.data?.filter((c) => c.rvc_status === "on") || [];
    },
  });

  const { data: allLocationData } = useQuery({
    queryKey: ["allStatesData"],
    queryFn: async () => {
      const res = await fetch("https://masonshop.in/api/getAllStatesData");
      return await res.json();
    },
  });

  const districts = selectedState ? allLocationData?.find(s => s.state === selectedState)?.districts || [] : [];
  const offices = selectedDistrict ? districts?.find(d => d.district === selectedDistrict)?.offices || [] : [];

  // =============================
  // MODAL RENDERER
  // =============================
  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const renderModalContent = () => {
    let listData = [];
    let title = "";
    let onSelect = (item) => {};

    if (modalType === 'cat') {
      listData = categories;
      title = "Select Category";
      onSelect = (item) => { setSelectedCategory({ id: item.id, name: item.rvc_name }); };
    } else if (modalType === 'state') {
      listData = allLocationData;
      title = "Select State";
      onSelect = (item) => { setSelectedState(item.state); setSelectedDistrict(null); setPincode(""); };
    } else if (modalType === 'dist') {
      listData = districts;
      title = "Select District";
      onSelect = (item) => { setSelectedDistrict(item.district); setSelectedOffice(null); setPincode(""); };
    } else if (modalType === 'office') {
      listData = offices;
      title = "Select Office";
      onSelect = (item) => { setSelectedOffice(item.officename); setPincode(item.pincode.toString()); };
    }

    return (
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Icon name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={listData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.modalItem} 
              onPress={() => {
                onSelect(item);
                setModalVisible(false);
              }}
            >
              <Text style={styles.modalItemText}>
                {modalType === 'cat' ? item.rvc_name : (modalType === 'office' ? item.officename : (modalType === 'dist' ? item.district : item.state))}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  // =============================
  // IMAGE & SUBMIT
  // =============================
  const pickImage = () => {
    launchImageLibrary({ mediaType: "photo", quality: 0.7 }, (res) => {
      if (!res.didCancel && res.assets) setVehicleImage(res.assets[0]);
    });
  };

  const handleSubmit = async () => {
    if (!vehicleImage || !selectedCategory.id || !selectedState || !pincode) {
      Alert.alert("Error", "Please fill mandatory fields and upload an image.");
      return;
    }
    setLoading(true);
    try {
      const userid = await AsyncStorage.getItem("user_id");
      const formData = new FormData();
      formData.append("user_id", userid || "1");
      formData.append("vehicle_name", vehicleName);
      formData.append("vehicle_type", vehicleType);
      formData.append("brand_name", brand);
      formData.append("brand_model", model);
      formData.append("brand_year", year);
      formData.append("vehicle_number", vehicleNumber);
      formData.append("rentalprice_perday", rentalDay);
      formData.append("rentalprice_perhour", rentalHour);
      formData.append("rentalprice_perkm", rentalKm);
      formData.append("fuel_type", fuelType);
      formData.append("capacity", capacityLoader || capacitySeating);
      formData.append("city", selectedOffice);
      formData.append("district", selectedDistrict);
      formData.append("state", selectedState);
      formData.append("pincode", pincode);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category_type", selectedCategory.id);

      formData.append("vehicle_image", {
        uri: vehicleImage.uri,
        type: vehicleImage.type || "image/jpeg",
        name: vehicleImage.fileName || "vehicle.jpg",
      });

      const response = await fetch("https://masonshop.in/api/add-rental-vehicle", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        Alert.alert("Success", "Vehicle posted successfully!");
        navigation.goBack();
      } else {
        Alert.alert("Error", "Submission failed.");
      }
    } catch (e) {
      Alert.alert("Error", "Server Error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
      <StatusBar barStyle="light-content" backgroundColor="#ff922c" />
      
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          {renderModalContent()}
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#ff922c', '#ffb36b']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Include some details</Text>
        </LinearGradient>

        <Surface style={styles.formCard} elevation={4}>
          <Text style={styles.sectionLabel}>Vehicle Basics</Text>

          <TouchableOpacity style={styles.picker} onPress={() => openModal('cat')}>
            <Text style={{color: selectedCategory.id ? '#000' : '#aaa'}}>{selectedCategory.name}</Text>
            <Icon name="toy-brick-outline" size={20} color="#FF922C" />
          </TouchableOpacity>

          <TextInput label="Vehicle Name *" mode="outlined" style={styles.input} value={vehicleName} onChangeText={setVehicleName} />
          <TextInput label="Vehicle Type *" mode="outlined" style={styles.input} value={vehicleType} onChangeText={setVehicleType} />
          
          <View style={styles.row}>
            <TextInput label="Brand *" mode="outlined" style={styles.flexInput} value={brand} onChangeText={setBrand} />
            <TextInput label="Model" mode="outlined" style={styles.flexInput} value={model} onChangeText={setModel} />
            <TextInput label="Year" mode="outlined" style={[styles.flexInput, {flex: 0.6}]} value={year} onChangeText={setYear} keyboardType="numeric" />
          </View>

          <TextInput label="Vehicle Number *" mode="outlined" style={styles.input} value={vehicleNumber} onChangeText={setVehicleNumber} autoCapitalize="characters" />

          <Divider style={styles.divider} />
          <Text style={styles.sectionLabel}>Location Details</Text>

          <TouchableOpacity style={styles.picker} onPress={() => openModal('state')}>
            <Text style={{color: selectedState ? '#000' : '#aaa'}}>{selectedState || "Select State *"}</Text>
            <Icon name="map-marker-outline" size={20} color="#FF922C" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.picker, !selectedState && styles.disabled]} onPress={() => selectedState && openModal('dist')}>
            <Text style={{color: selectedDistrict ? '#000' : '#aaa'}}>{selectedDistrict || "Select District *"}</Text>
            <Icon name="chevron-down" size={20} color="#777" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.picker, !selectedDistrict && styles.disabled]} onPress={() => selectedDistrict && openModal('office')}>
            <Text style={{color: selectedOffice ? '#000' : '#aaa'}}>{selectedOffice || "Select Office *"}</Text>
            <Icon name="chevron-down" size={20} color="#777" />
          </TouchableOpacity>

          <TextInput label="Pincode" mode="outlined" value={pincode} editable={false} style={[styles.input, {backgroundColor: '#f5f5f5'}]} />

          <Divider style={styles.divider} />
          <Text style={styles.sectionLabel}>Rental Price (₹)</Text>
          <View style={styles.row}>
            <TextInput label="₹ /Day" mode="outlined" style={styles.flexInput} value={rentalDay} onChangeText={setRentalDay} keyboardType="numeric" />
            <TextInput label="₹ /Hour" mode="outlined" style={styles.flexInput} value={rentalHour} onChangeText={setRentalHour} keyboardType="numeric" />
            <TextInput label="₹ /Km" mode="outlined" style={styles.flexInput} value={rentalKm} onChangeText={setRentalKm} keyboardType="numeric" />
          </View>

          <TextInput label="Fuel Type *" mode="outlined" style={styles.input} value={fuelType} onChangeText={setFuelType} />

          <View style={styles.row}>
            <TextInput label="Capacity (Loader)" mode="outlined" style={styles.flexInput} value={capacityLoader} onChangeText={setCapacityLoader} />
            <TextInput label="Capacity (Seating)" mode="outlined" style={styles.flexInput} value={capacitySeating} onChangeText={setCapacitySeating} />
          </View>

          <Divider style={styles.divider} />
          <Text style={styles.sectionLabel}>Ad Content</Text>
          <TextInput label="Add Title *" mode="outlined" style={styles.input} value={title} onChangeText={setTitle} maxLength={70} />
          <TextInput label="Description *" mode="outlined" style={[styles.input, {height: 80}]} value={description} onChangeText={setDescription} multiline />

          <Text style={styles.sectionLabel}>Vehicle Image *</Text>
          <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
            {vehicleImage ? <Image source={{ uri: vehicleImage.uri }} style={styles.fullImg} /> : <View style={{alignItems: 'center'}}><Icon name="camera-plus" size={40} color="#FF922C" /><Text style={{color: '#999'}}>Upload Photo</Text></View>}
          </TouchableOpacity>

          <Button mode="contained" onPress={handleSubmit} loading={loading} style={styles.submitBtn} buttonColor="#FF922C">POST AD</Button>
        </Surface>
        <View style={{height: 50}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 10 },
  formCard: { margin: 15, marginTop: -25, padding: 20, borderRadius: 20, backgroundColor: '#fff' },
  sectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#666', marginBottom: 15, marginTop: 10, textTransform: 'uppercase' },
  input: { marginBottom: 15, backgroundColor: '#fff' },
  flexInput: { flex: 1, marginHorizontal: 5, backgroundColor: '#fff', marginBottom: 15 },
  row: { flexDirection: 'row', marginHorizontal: -5 },
  picker: { height: 55, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, marginBottom: 15 },
  disabled: { backgroundColor: '#f5f5f5', opacity: 0.5 },
  divider: { marginVertical: 15, backgroundColor: '#eee' },
  imageBox: { height: 180, borderRadius: 15, borderStyle: 'dashed', borderWidth: 2, borderColor: '#FF922C', justifyContent: 'center', alignItems: 'center', marginBottom: 25, overflow: 'hidden', backgroundColor: '#fff9f5' },
  fullImg: { width: '100%', height: '100%' },
  submitBtn: { borderRadius: 12, height: 50, justifyContent: 'center' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemText: { fontSize: 16 }
});