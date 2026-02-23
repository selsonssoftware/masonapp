import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  ImageBackground,
  Image,
  ActivityIndicator,
  Keyboard,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { TextInput, Button, Searchbar } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import AwesomeAlert from 'react-native-awesome-alerts';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Reusable Searchable Modal Component ---
const SearchableModal = ({ visible, data, onSelect, onClose, title, placeholder }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredData = data.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Searchbar
            placeholder={placeholder}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor="#f41b3b"
            elevation={0}
          />
          <FlatList
            data={filteredData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.itemRow} 
                onPress={() => {
                  onSelect(item.value);
                  setSearchQuery('');
                  onClose();
                }}
              >
                <Text style={styles.itemText}>{item.label}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No results found</Text>}
          />
          <Button onPress={() => { setSearchQuery(''); onClose(); }} textColor="#f41b3b">Close</Button>
        </View>
      </View>
    </Modal>
  );
};

export default function PersonalDetailsScreen({ navigation, route }) {
  const { phone } = route.params || {};

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // ===== Referral States =====
  const [referralCode, setReferralCode] = useState('');
  const [referrerName, setReferrerName] = useState(''); 
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState('');

  const [address, setAddress] = useState('');

  // ===== Location Data =====
  const [statesData, setStatesData] = useState([]);
  const [stateItems, setStateItems] = useState([]);
  const [districtItems, setDistrictItems] = useState([]);
  const [cityItems, setCityItems] = useState([]); 

  const [stateValue, setStateValue] = useState(null);
  const [districtValue, setDistrictValue] = useState(null);
  const [cityValue, setCityValue] = useState(null); 
  const [pincode, setPincode] = useState('');

  // Modals Visibility
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Loaders
  const [stateLoading, setStateLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  /* ===== Alert States ===== */
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const alertConfirmActionRef = useRef(null); // Safely holds the navigation function

  /* ===== 1. Referral Logics ===== */
  useEffect(() => {
    fetch('https://masonshop.in/api/get-referral')
      .then(res => res.json())
      .then(data => {
        if (data.referral) {
          setReferralCode(data.referral);
        }
      });
  }, []);

  useEffect(() => {
    if (referralCode) {
      verifyReferralCode(referralCode);
    }
  }, [referralCode]);

  const verifyReferralCode = async (code) => {
    if (!code || code.length < 3) return;
    setReferralLoading(true);
    setReferralError('');
    setReferrerName('');

    try {
      const res = await fetch(`https://masonshop.in/api/check_referral?id=${code}`);
      const data = await res.json();
      if (data.status === 'success') {
        setReferrerName(data.name); 
      } else {
        setReferralError('Invalid Referral Code');
      }
    } catch (e) {
      console.log('Referral Check Error', e);
    } finally {
      setReferralLoading(false);
    }
  };

  const handleReferralChange = (text) => {
    setReferralCode(text);
    if (referrerName) setReferrerName('');
    if (referralError) setReferralError('');
    if (text.length === 7) {
      verifyReferralCode(text);
      Keyboard.dismiss();
    }
  };

  const handleReferralBlur = () => {
    if (referralCode.length > 0 && !referrerName && !referralLoading) {
      verifyReferralCode(referralCode);
    }
  };

  /* ===== 2. Fetch States ===== */
  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    setStateLoading(true);
    try {
      const res = await fetch('https://masonshop.in/api/getAllStatesData');
      const json = await res.json();
      setStatesData(json);
      setStateItems(json.map(item => ({ label: item.state, value: item.state })));
    } catch (e) {
      console.log('State fetch error', e);
    } finally {
      setStateLoading(false);
    }
  };

  /* ===== 3. Selection Handlers with Alphabetical Sorting ===== */
  const handleStateSelect = (val) => {
    setStateValue(val);
    setDistrictValue(null);
    setCityValue(null);
    setPincode('');

    const selectedState = statesData.find(s => s.state === val);
    if (selectedState) {
      const districts = selectedState.districts.map(d => ({ label: d.district, value: d.district }));
      districts.sort((a, b) => a.label.localeCompare(b.label));
      setDistrictItems(districts);
    }
  };

  const handleDistrictSelect = (val) => {
    setDistrictValue(val);
    setCityValue(null);
    setPincode('');

    const selectedState = statesData.find(s => s.state === stateValue);
    const selectedDistrict = selectedState?.districts.find(d => d.district === val);

    if (selectedDistrict?.offices) {
      const cities = selectedDistrict.offices.map(office => ({
        label: office.officename,
        value: office.officename,
      }));
      const uniqueCities = [...new Map(cities.map(item => [item['value'], item])).values()];
      
      uniqueCities.sort((a, b) => a.label.localeCompare(b.label));
      setCityItems(uniqueCities);
    }
  };

  const handleCitySelect = (val) => {
    setCityValue(val);
    const selectedState = statesData.find(s => s.state === stateValue);
    const selectedDistrict = selectedState?.districts.find(d => d.district === districtValue);
    const selectedOffice = selectedDistrict?.offices.find(o => o.officename === val);

    if (selectedOffice) {
      setPincode(String(selectedOffice.pincode));
    }
  };

  /* ===== Save Logic ===== */
  const handleSaveDetails = async () => {
    if (!name || !address || !stateValue || !districtValue || !cityValue || !pincode) {
      showAlert("Missing Information", "Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("https://masonshop.in/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone, name, email, referral_code: referralCode, address,
          state: stateValue, district: districtValue, city: cityValue, pincode,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem('user_id', String(data.user_id));
        
        showAlert("Success", "Registration Successful! Welcome to MasonShop.", () => {
          // Changed to 'WelcomePage' and used replace to prevent modal crash
          navigation.replace('WelcomePage');
        });
      } else {
        showAlert("Error", data.message || "Registration failed");
      }
    } catch (error) {
      showAlert("Error", "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (title, message, onConfirm = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    alertConfirmActionRef.current = onConfirm; 
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
    
    // Increased timeout to 500ms to ensure the Modal completely finishes closing
    // before we try to navigate away from this screen.
    if (alertConfirmActionRef.current) {
      setTimeout(() => {
        if (alertConfirmActionRef.current) {
          alertConfirmActionRef.current();
          alertConfirmActionRef.current = null; 
        }
      }, 500); 
    }
  };

  const customTheme = {
    colors: { primary: '#fff', text: '#fff', onSurface: '#fff', background: 'transparent' },
    roundness: 15,
  };

  return (
    <ImageBackground source={require('../assets/bg.png')} style={styles.background}>
      <View style={styles.overlay}>
        <View style={styles.topContainer}>
          <Image source={require('../assets/splash.png')} style={styles.logo} />
        </View>

        <LinearGradient colors={['#f41b3b', '#e9003f']} style={styles.detailsContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

            <Text style={styles.heading}>Complete Your Profile</Text>

            {/* REFERRAL CODE SECTION */}
            <Text style={styles.fieldLabel}>Referral Code (Optional)</Text>
            <View>
              <TextInput 
                value={referralCode} onChangeText={handleReferralChange} onBlur={handleReferralBlur}
                maxLength={7} mode="outlined" style={styles.input} outlineColor="#fff" theme={customTheme}
                right={referralLoading ? <TextInput.Icon icon={() => <ActivityIndicator size="small" color="#fff" />} /> : null}
              />
              {referrerName ? <View style={styles.referrerBox}><Text style={styles.successText}>Referred by: {referrerName}</Text></View> : null}
              {referralError ? <Text style={styles.errorText}>{referralError}</Text> : null}
            </View>

            <Text style={styles.fieldLabel}>Full Name *</Text>
            <TextInput value={name} onChangeText={setName} mode="outlined" style={styles.input} outlineColor="#fff" theme={customTheme} />

            <Text style={styles.fieldLabel}>Email Address </Text>
            <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" mode="outlined" style={styles.input} outlineColor="#fff" theme={customTheme} />

            <Text style={styles.fieldLabel}>Full Address *</Text>
            <TextInput value={address} onChangeText={setAddress} mode="outlined" multiline numberOfLines={3} style={styles.inputMultiline} outlineColor="#fff" theme={customTheme} />

            {/* STATE PICKER */}
            <Text style={styles.fieldLabel}>State *</Text>
            {stateLoading ? (
              <ActivityIndicator color="#fff" style={{ marginVertical: 10 }} />
            ) : (
              <TouchableOpacity style={styles.pickerTrigger} onPress={() => setStateModalVisible(true)}>
                <Text style={styles.pickerTriggerText}>{stateValue || "Select State"}</Text>
              </TouchableOpacity>
            )}

            {/* DISTRICT PICKER */}
            <Text style={styles.fieldLabel}>District *</Text>
            <TouchableOpacity 
              style={[styles.pickerTrigger, !stateValue && { opacity: 0.5 }]} 
              onPress={() => stateValue && setDistrictModalVisible(true)}
            >
              <Text style={styles.pickerTriggerText}>{districtValue || "Select District"}</Text>
            </TouchableOpacity>

            {/* CITY PICKER */}
            <Text style={styles.fieldLabel}>City / Post Office (A-Z Search) *</Text>
            <TouchableOpacity 
              style={[styles.pickerTrigger, !districtValue && { opacity: 0.5 }]} 
              onPress={() => districtValue && setCityModalVisible(true)}
            >
              <Text style={styles.pickerTriggerText}>{cityValue || "Select City"}</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Pincode</Text>
            <TextInput value={pincode} editable={false} mode="outlined" style={[styles.input, { opacity: 0.8 }]} outlineColor="#fff" theme={customTheme} />

            <Button mode="contained" onPress={handleSaveDetails} loading={isLoading} contentStyle={styles.buttonContent} labelStyle={styles.buttonLabel} style={styles.button}>
              Save and Continue
            </Button>

          </ScrollView>
        </LinearGradient>

        {/* MODAL PICKERS */}
        <SearchableModal 
          visible={stateModalVisible} data={stateItems} title="Select State" placeholder="Search state..."
          onSelect={handleStateSelect} onClose={() => setStateModalVisible(false)} 
        />
        <SearchableModal 
          visible={districtModalVisible} data={districtItems} title="Select District" placeholder="Search district..."
          onSelect={handleDistrictSelect} onClose={() => setDistrictModalVisible(false)} 
        />
        <SearchableModal 
          visible={cityModalVisible} data={cityItems} title="Select City" placeholder="Search city..."
          onSelect={handleCitySelect} onClose={() => setCityModalVisible(false)} 
        />

        <AwesomeAlert
          show={alertVisible}
          title={alertTitle}
          message={alertMessage}
          showConfirmButton={true}
          confirmText="OK"
          confirmButtonColor="#01d74c"
          closeOnTouchOutside={false}         
          closeOnHardwareBackPress={false}    
          onConfirmPressed={hideAlert}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1 },
  topContainer: { alignItems: 'center', marginTop: 50 },
  logo: { width: 90, height: 90 },
  detailsContainer: { flex: 1, marginTop: 20, borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  scrollContent: { padding: 40, paddingBottom: 100 },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
  fieldLabel: { color: '#fff', marginBottom: 5, marginTop: 10, fontSize: 13, fontWeight: '600' },
  input: { marginBottom: 5, backgroundColor: 'transparent' }, 
  inputMultiline: { marginBottom: 10, backgroundColor: 'transparent', minHeight: 80 },
  button: { borderRadius: 15, backgroundColor: '#fff', marginTop: 25 },
  buttonContent: { height: 50 },
  buttonLabel: { fontSize: 16, fontWeight: 'bold', color: '#c20f0c' },
  referrerBox: { marginBottom: 5, marginTop: 2 },
  successText: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' },
  errorText: { color: '#FFCCCB', fontSize: 12, marginBottom: 5, fontWeight: 'bold' },
  
  // Custom Picker Trigger Style
  pickerTrigger: {
    borderWidth: 1.5,
    borderColor: '#fff',
    borderRadius: 15,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 5,
  },
  pickerTriggerText: { color: '#fff', fontSize: 15 },

  // Search Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' },
  modalContent: { backgroundColor: '#fff', margin: 25, borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333', textAlign: 'center' },
  searchBar: { marginBottom: 15, backgroundColor: '#f5f5f5', borderRadius: 10 },
  itemRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemText: { fontSize: 16, color: '#333' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#999' }
});