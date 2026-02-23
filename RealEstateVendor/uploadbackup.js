import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  Alert,
  Image,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';

import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const THEME = '#800040';

/* ================= BUTTON OPTIONS ================= */
const PROPERTY_TYPES = ['Apartment', 'Villa', 'Office', 'Plots', 'Pg'];
const RENT_SELL = ['Rent', 'Sell'];
const BHK = ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK+'];
const PARKING = ['Yes', 'No', '1', '2', '3+'];
const FURNISHING = ['None', 'Semi Furnished', 'Fully Furnished'];
const CONSTRUCTION = ['Ready To Move', 'Under Construction', 'New Launch'];
const FACING = ['North', 'East', 'West', 'South'];
const LISTED_BY = ['Owner', 'Builder', 'Dealer'];

const PLOT_TYPES = ['Residential', 'Commercial', 'Agricultural'];

const PG_TYPES = ['Boys', 'Girls', 'Co-Living'];
const ROOM_TYPES = ['Single', 'Double', 'Triple', 'Dormitory'];
const FOOD = ['Yes', 'No'];
const TENANT = ['Students', 'Working Professionals', 'Any'];

export default function SellerUploadScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('user_id').then(id => setUserId(id));
  }, []);

  /* ================= FORM DATA ================= */
  const [data, setData] = useState({
    user_id: userId,

    propertyType: '',
    rentOrSell: '',
    bhk: '',
    bathrooms: '',
    washrooms: '',
    parking: '',
    furnishing: '',
    constructionStatus: '',
    listedBy: '',
    buildUpArea: '',
    carpetArea: '',
    totalFloors: '',
    facing: '',
    price: '',
    project_name: '',
    description: '',

    // Plot
    plot_type: '',
    plot_area: '',
    length: '',
    breadth: '',
    sqft_price: '',

    // PG
    pgType: '',
    roomType: '',
    totalBeds: '',
    availableBeds: '',
    foodIncluded: '',
    preferredTenant: '',
    deposit: '',
    gateTime: '',

    // Location
    doorNo: '',
    area: '',
    city: '',
    state: '',
    pinCode: '',
    landmark: '',
    email: '',

    images: [],
  });

  const set = (k, v) => setData(p => ({ ...p, [k]: v }));

  /* ================= IMAGE PICKER ================= */
  const pickImages = () => {
    launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 10, quality: 0.8 },
      res => {
        if (res.assets) {
          set('images', [...data.images, ...res.assets]);
        }
      }
    );
  };

  const removeImage = index => {
    set('images', data.images.filter((_, i) => i !== index));
  };

  /* ================= VALIDATION ================= */
  const next = () => {
    if (step === 1 && (!data.propertyType || !data.rentOrSell || !data.price)) {
      return Alert.alert('Error', 'Fill required property details');
    }
    if (step === 2 && (!data.doorNo || !data.area || !data.city || !data.pinCode)) {
      return Alert.alert('Error', 'Fill location details');
    }
    if (step === 3 && data.images.length === 0) {
      return Alert.alert('Error', 'Upload at least one image');
    }
    setStep(step + 1);
  };

  /* ================= SUBMIT ================= */
  const submit = async () => {
    setLoading(true);
    const fd = new FormData();

    Object.keys(data).forEach(k => {
      if (k !== 'images') fd.append(k, data[k] ?? '');
    });

   data.images.forEach((img, i) => {
  fd.append('images[]', {
    uri: img.uri,
    name: img.fileName || `photo_${Date.now()}_${i}.jpg`,
    type: img.type || 'image/jpeg',
  });
});

    try {
      const res = await fetch('https://masonshop.in/api/uploadsAds_1', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: fd,
      });
      const json = await res.json();
      res.ok
        ? Alert.alert('Success', 'Property posted successfully', () => navigation.goBack())
        : Alert.alert('Error', json.message || 'Upload failed');
    } catch {
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  /* ================= BUTTON GROUP ================= */
  const ButtonGroup = ({ label, options, value, onSelect }) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map(o => (
          <TouchableOpacity
            key={o}
            style={[styles.btn, value === o && styles.btnActive]}
            onPress={() => onSelect(o)}
          >
            <Text style={{ color: value === o ? '#fff' : '#000' }}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  /* ================= UI ================= */
  return (
    <View style={{ flex: 1, backgroundColor: '#fff',paddingVertical:50 }}>
      {/* 🔥 NO TOP GAP */}
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 15, paddingTop: 0 }}
      >

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <ButtonGroup label="Property Type" options={PROPERTY_TYPES} value={data.propertyType} onSelect={v => set('propertyType', v)} />
            <ButtonGroup label="Rent / Sell" options={RENT_SELL} value={data.rentOrSell} onSelect={v => set('rentOrSell', v)} />

            {(data.propertyType === 'Apartment' || data.propertyType === 'Villa' || data.propertyType === 'Office') && (
              <>
                <ButtonGroup label="BHK" options={BHK} value={data.bhk} onSelect={v => set('bhk', v)} />
                <TextInput style={styles.input} placeholder="Bathrooms" keyboardType="numeric" onChangeText={v => set('bathrooms', v)} />
                <TextInput style={styles.input} placeholder="Washrooms" keyboardType="numeric" onChangeText={v => set('washrooms', v)} />
                <ButtonGroup label="Parking" options={PARKING} value={data.parking} onSelect={v => set('parking', v)} />
                <ButtonGroup label="Furnishing" options={FURNISHING} value={data.furnishing} onSelect={v => set('furnishing', v)} />
                <ButtonGroup label="Construction Status" options={CONSTRUCTION} value={data.constructionStatus} onSelect={v => set('constructionStatus', v)} />
                <ButtonGroup label="Listed By" options={LISTED_BY} value={data.listedBy} onSelect={v => set('listedBy', v)} />
                <TextInput style={styles.input} placeholder="Built-up Area (Sq.ft)" keyboardType="numeric" onChangeText={v => set('buildUpArea', v)} />
                <TextInput style={styles.input} placeholder="Carpet Area (Sq.ft)" keyboardType="numeric" onChangeText={v => set('carpetArea', v)} />
                <TextInput style={styles.input} placeholder="Total Floors" keyboardType="numeric" onChangeText={v => set('totalFloors', v)} />
                <ButtonGroup label="Facing" options={FACING} value={data.facing} onSelect={v => set('facing', v)} />
              </>
            )}

            {data.propertyType === 'Plots' && (
              <>
                <ButtonGroup label="Plot Type" options={PLOT_TYPES} value={data.plot_type} onSelect={v => set('plot_type', v)} />
                <TextInput style={styles.input} placeholder="Plot Area (Sq.ft)" keyboardType="numeric" onChangeText={v => set('plot_area', v)} />
                <TextInput style={styles.input} placeholder="Length (ft)" keyboardType="numeric" onChangeText={v => set('length', v)} />
                <TextInput style={styles.input} placeholder="Breadth (ft)" keyboardType="numeric" onChangeText={v => set('breadth', v)} />
                <TextInput style={styles.input} placeholder="Price per Sq.ft" keyboardType="numeric" onChangeText={v => set('sqft_price', v)} />
              </>
            )}

            {data.propertyType === 'Pg' && (
              <>
                <ButtonGroup label="PG Type" options={PG_TYPES} value={data.pgType} onSelect={v => set('pgType', v)} />
                <ButtonGroup label="Room Type" options={ROOM_TYPES} value={data.roomType} onSelect={v => set('roomType', v)} />
                <ButtonGroup label="Food Included" options={FOOD} value={data.foodIncluded} onSelect={v => set('foodIncluded', v)} />
                <ButtonGroup label="Preferred Tenant" options={TENANT} value={data.preferredTenant} onSelect={v => set('preferredTenant', v)} />
                <TextInput style={styles.input} placeholder="Total Beds" keyboardType="numeric" onChangeText={v => set('totalBeds', v)} />
                <TextInput style={styles.input} placeholder="Available Beds" keyboardType="numeric" onChangeText={v => set('availableBeds', v)} />
                <TextInput style={styles.input} placeholder="Deposit Amount" keyboardType="numeric" onChangeText={v => set('deposit', v)} />
                <TextInput style={styles.input} placeholder="Gate Closing Time" onChangeText={v => set('gateTime', v)} />
              </>
            )}

            <TextInput style={styles.input} placeholder="Price (₹)" keyboardType="numeric" onChangeText={v => set('price', v)} />
            <TextInput style={styles.input} placeholder="Project Name" onChangeText={v => set('project_name', v)} />
            <TextInput style={[styles.input, { height: 90 }]} placeholder="Description" multiline onChangeText={v => set('description', v)} />
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <TextInput style={styles.input} placeholder="Door No" onChangeText={v => set('doorNo', v)} />
            <TextInput style={styles.input} placeholder="Area" onChangeText={v => set('area', v)} />
            <TextInput style={styles.input} placeholder="City" onChangeText={v => set('city', v)} />
            <TextInput style={styles.input} placeholder="State" onChangeText={v => set('state', v)} />
            <TextInput style={styles.input} placeholder="Pin Code" keyboardType="numeric" onChangeText={v => set('pinCode', v)} />
            <TextInput style={styles.input} placeholder="Landmark" onChangeText={v => set('landmark', v)} />
            <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" onChangeText={v => set('email', v)} />
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <TouchableOpacity style={styles.upload} onPress={pickImages}>
              <Text>Upload Images ({data.images.length}/10)</Text>
            </TouchableOpacity>

            <FlatList
              horizontal
              data={data.images}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item, index }) => (
                <View>
                  <Image source={{ uri: item.uri }} style={styles.img} />
                  <TouchableOpacity onPress={() => removeImage(index)}>
                    <Text style={{ color: 'red', textAlign: 'center' }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <TouchableOpacity style={styles.submit} onPress={submit}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>Confirm & Submit</Text>}
          </TouchableOpacity>
        )}

        {step < 4 && (
          <TouchableOpacity style={styles.next} onPress={next}>
            <Text style={{ color: '#fff' }}>Next</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  label: { fontWeight: '600', marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  btn: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    margin: 5,
  },
  btnActive: {
    backgroundColor: THEME,
    borderColor: THEME,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  upload: {
    padding: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 10,
  },
  img: {
    width: 90,
    height: 90,
    marginRight: 8,
    borderRadius: 6,
  },
  next: {
    backgroundColor: THEME,
    padding: 15,
    alignItems: 'center',
    marginVertical: 10,
  },
  submit: {
    backgroundColor: 'green',
    padding: 15,
    alignItems: 'center',
  },
});
