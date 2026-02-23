import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { launchImageLibrary } from 'react-native-image-picker'; 
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- API Fetcher Functions ---

const fetchAccountDetails = async ({ queryKey }) => {
  const [_, userId] = queryKey;
  if (!userId) throw new Error("User ID missing");
  
  const response = await fetch(`https://masonshop.in/api/user_accoount_details?user_id=${userId}`);
  const json = await response.json();
  
  if (json.status === true && json.data) {
    return { ...json.data, sponsorName: json.sponser_name?.name || '' };
  }
  throw new Error("Failed to fetch data");
};

const updateUserProfile = async (formData) => {
  const response = await fetch('https://masonshop.in/api/user-update', {
    method: 'POST',
    body: formData,
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Update failed");
  return json;
};

const AccountKycScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState(null);

  // --- Alert State ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', success: true });

  // Form State
  const [form, setForm] = useState({
    name: '',
    accountHolder: '',
    email: '',
    accountNumber: '',
    bankName: '',
    ifsc: '',
    branch: '',
    pan: '',
    sponsorName: '',
    sponsorId: ''
  });
  
  const [newProfileImage, setNewProfileImage] = useState(null); 

  // --- 1. Load User ID on Mount ---
  useEffect(() => {
    const loadUser = async () => {
      const id = await AsyncStorage.getItem('user_id');
      if (id) setUserId(id);
    };
    loadUser();
  }, []);

  // --- 2. React Query: Fetch Data ---
  const { data: userData, isLoading: isFetching } = useQuery({
    queryKey: ['accountKyc', userId],
    queryFn: fetchAccountDetails,
    enabled: !!userId,
  });

  // --- 3. Populate Form ---
  useEffect(() => {
    if (userData) {
      setForm({
        name: userData.name || '',
        accountHolder: userData.account_holder_name || '',
        email: userData.email || '',
        accountNumber: userData.account_no || '',
        bankName: userData.bank_name || '',
        ifsc: userData.ifsc_code || '',
        branch: userData.branch || '',
        pan: userData.pan_number || '',
        sponsorId: userData.sponsor_id || '',
        sponsorName: userData.sponsorName || '',
      });
    }
  }, [userData]);

  // --- 4. React Query: Mutation ---
  const mutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      setAlertConfig({ title: 'Success', message: 'Profile updated successfully!', success: true });
      setAlertVisible(true);
      queryClient.invalidateQueries(['accountKyc', userId]);
    },
    onError: (error) => {
      setAlertConfig({ title: 'Error', message: error.message, success: false });
      setAlertVisible(true);
    }
  });

  // --- Handlers ---
  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleChoosePhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.assets && response.assets.length > 0) {
        setNewProfileImage(response.assets[0]);
      }
    });
  };

  const handleSubmit = () => {
    if (!userId) return;

    const data = new FormData();
    data.append('user_id', userId);
    data.append('account_holder_name', form.accountHolder);
    data.append('email', form.email);
    data.append('account_no', form.accountNumber);
    data.append('bank_name', form.bankName);
    data.append('ifsc_code', form.ifsc);
    data.append('branch', form.branch);
    data.append('pan_number', form.pan);
    data.append('sponsor_id', form.sponsorId);

    if (newProfileImage) {
      data.append('profile', {
        uri: newProfileImage.uri,
        type: newProfileImage.type,
        name: newProfileImage.fileName,
      });
    }

    mutation.mutate(data);
  };

  if (isFetching) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#E60023" />
        <Text>Loading Account Details...</Text>
      </SafeAreaView>
    );
  }

  const displayImageUri = newProfileImage 
    ? newProfileImage.uri 
    : (userData?.profile || 'https://img.freepik.com/free-vector/smiling-redhaired-boy-illustration_1308-176664.jpg');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back-outline" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Account & KYC</Text>
        </View>

        <ScrollView 
            style={styles.container} 
            keyboardShouldPersistTaps="handled" 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
                {/* --- Profile Card --- */}
                <View style={styles.profileCard}>
                    <View style={styles.profileTextContainer}>
                        <Text style={styles.profileName}>{form.name || 'N/A'}</Text>
                        <Text style={styles.profileInfo}>{form.email || 'N/A'}</Text>
                        <Text style={styles.profileInfo}>ID-{userId || 'N/A'}</Text>
                    </View>
                    
                    <View style={styles.profileImageContainer}>
                        <Image source={{ uri: displayImageUri }} style={styles.profileImage} />
                        <TouchableOpacity style={styles.uploadIconWrapper} onPress={handleChoosePhoto}>
                        <Text style={styles.uploadIconText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- Form Section --- */}
                <View style={styles.formContainer}>
                    <Text style={styles.sectionTitle}>Bank Details</Text>

                    <Text style={styles.label}>Name</Text>
                    <TextInput style={styles.input} placeholder="Account Holder Name" value={form.accountHolder} onChangeText={(t) => handleInputChange('accountHolder', t)} />

                    <Text style={styles.label}>Email</Text>
                    <TextInput style={styles.input} placeholder="Enter Email" value={form.email} onChangeText={(t) => handleInputChange('email', t)} keyboardType="email-address" />

                    <Text style={styles.label}>Account Number</Text>
                    <TextInput style={styles.input} placeholder="Account Number" value={form.accountNumber} onChangeText={(t) => handleInputChange('accountNumber', t)} keyboardType="numeric" />

                    <Text style={styles.label}>Bank Name</Text>
                    <TextInput style={styles.input} placeholder="Enter Bank Name" value={form.bankName} onChangeText={(t) => handleInputChange('bankName', t)} />

                    <View style={styles.row}>
                        <View style={styles.inputGroup}>
                        <Text style={styles.label}>IFSC</Text>
                        <TextInput style={styles.input} placeholder="IFSC Code" value={form.ifsc} onChangeText={(t) => handleInputChange('ifsc', t)} />
                        </View>
                        <View style={styles.inputGroup}>
                        <Text style={styles.label}>Branch</Text>
                        <TextInput style={styles.input} placeholder="Branch" value={form.branch} onChangeText={(t) => handleInputChange('branch', t)} />
                        </View>
                    </View>

                    <Text style={styles.label}>PAN Number</Text>
                    <TextInput style={styles.input} placeholder="Pan Number" value={form.pan} onChangeText={(t) => handleInputChange('pan', t)} />

                    <View style={styles.row}>
                        <View style={styles.inputGroup}>
                        <Text style={styles.label}>Sponsor Name</Text>
                        <TextInput style={[styles.input, {backgroundColor: '#eee'}]} placeholder="Sponsor Name" value={form.sponsorName} editable={false} />
                        </View>
                        <View style={styles.inputGroup}>
                        <Text style={styles.label}>Sponsor ID</Text>
                        <TextInput style={[styles.input, {backgroundColor: '#eee'}]} placeholder="Sponsor ID" value={form.sponsorId} editable={false} />
                        </View>
                    </View>
                </View>

                {/* --- Submit Button --- */}
                <TouchableOpacity 
                    style={styles.submitButton} 
                    onPress={handleSubmit}
                    disabled={mutation.isPending}
                >
                    {mutation.isPending ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Update</Text>
                    )}
                </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- DESIGNER CUSTOM ALERT --- */}
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.customAlert}>
            <View style={[styles.alertIconBg, { backgroundColor: alertConfig.success ? '#4CAF50' : '#E60023' }]}>
              <Icon name={alertConfig.success ? "checkmark-circle" : "alert-circle"} size={50} color="#fff" />
            </View>
            <Text style={styles.alertTitleTxt}>{alertConfig.title}</Text>
            <Text style={styles.alertMsgTxt}>{alertConfig.message}</Text>
            <TouchableOpacity style={[styles.alertOkBtn, {backgroundColor: alertConfig.success ? '#4CAF50' : '#E60023'}]} onPress={() => setAlertVisible(false)}>
              <Text style={styles.alertOkBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems:'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 50
  },
  backBtn:{
    position:'absolute',
    left:16,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  container: { flex: 1 },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  profileCard: {
    backgroundColor: '#E60023',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  profileTextContainer: { flex: 1 },
  profileName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileInfo: {
    color: '#fff',
    fontSize: 14,
  },
  profileImageContainer: {
    position: 'relative',
    marginLeft: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#eee',
  },
  uploadIconWrapper: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  uploadIconText: {
    color: '#E60023',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  formContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    width: '48%',
  },
  submitButton: {
    backgroundColor: '#E60023',
    paddingVertical: 14,
    marginHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    elevation: 3,
    minHeight: 50,
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // --- Custom Alert Styles ---
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  customAlert: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center'
  },
  alertIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  alertTitleTxt: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333'
  },
  alertMsgTxt: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20
  },
  alertOkBtn: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  alertOkBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default AccountKycScreen;