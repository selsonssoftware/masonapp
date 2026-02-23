import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { TextInput, Button, Checkbox, Modal, Portal, Provider } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import AwesomeAlert from 'react-native-awesome-alerts';

export default function LoginScreen({ navigation }) {
  const [phone, setMobile] = useState('');
  const [checked, setChecked] = useState(false); // Default to false for legal compliance
  const [isLoading, setIsLoading] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const validatePhone = () => /^[6-9]\d{9}$/.test(phone);

  const handleSubmit = async () => {
    if (isLoading) return;
    if (!checked) {
      showAlert('Terms Required', 'Please accept the terms and conditions to proceed.');
      return;
    }
    if (!phone || phone.length !== 10 || !validatePhone()) {
      showAlert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://masonshop.in/api/get_otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: phone }),
      });

      if (response.ok) {
        navigation.navigate('VerificationPage', { phone });
        
      } else {
        showAlert('Error', 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      showAlert('Error', 'Something went wrong. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Provider>
      <ImageBackground source={require('../assets/bg.png')} style={styles.background} resizeMode="cover">
        <View style={styles.overlay}>
          <View style={styles.topContainer}>
            <Image source={require('../assets/splash.png')} style={styles.logo} resizeMode="contain" />
          </View>

          <LinearGradient colors={['#f41b3b', '#e9003f']} style={styles.bottomContainer}>
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
              <View>
                <Text style={styles.heading}>Enter Your Number</Text>
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.prefix}>+91</Text>
                  <TextInput
                    mode="flat"
                    placeholder="98940XXXXX"
                    placeholderTextColor="#fffa"
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={10}
                    value={phone}
                    onChangeText={setMobile}
                    textColor="#fff"
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                  />
                </View>
              </View>

              <View>
                <View style={styles.checkboxRow}>
                  <Checkbox.Android
                    status={checked ? 'checked' : 'unchecked'}
                    onPress={() => setChecked(!checked)}
                    color="#fff"
                  />
                  <TouchableOpacity onPress={() => setTermsVisible(true)}>
                    <Text style={styles.termsText}>
                      I Accept The <Text style={styles.link}>Terms And Conditions</Text>
                    </Text>
                  </TouchableOpacity>
                </View>

                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  style={styles.button}
                  loading={isLoading}
                >
                  Continue
                </Button>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* 📜 Terms & Conditions Modal */}
        <Portal>
          <Modal
            visible={termsVisible}
            onDismiss={() => setTermsVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalText}>
                Welcome to MasonShop. By using this app, you agree to our policies. 
                {"\n\n"}
                1. We collect your phone number for authentication.
                {"\n"}
                2. OTPs are valid for 5 minutes.
                {"\n"}
                3. Your data is secured with industry-standard encryption.
                {"\n"}
                4. Orders are subject to availability.
                {"\n\n"}
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </Text>
            </ScrollView>
            <Button 
              mode="contained" 
              style={styles.modalButton} 
              onPress={() => {
                setChecked(true);
                setTermsVisible(false);
              }}
            >
              Accept & Close
            </Button>
          </Modal>
        </Portal>

        <AwesomeAlert
          show={alertVisible}
          title={alertTitle}
          message={alertMessage}
          showConfirmButton={true}
          confirmText="OK"
          confirmButtonColor="#f41b3b"
          onConfirmPressed={() => setAlertVisible(false)}
        />
      </ImageBackground>
    </Provider>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1 },
  topContainer: { alignItems: 'center', marginTop: 60 },
  logo: { width: 100, height: 100 },
  bottomContainer: {
    flex: 1,
    marginTop: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 40,
  },
  heading: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#fff',
    borderWidth: 1.5,
    borderRadius: 15,
    paddingHorizontal: 10,
  },
  prefix: { fontSize: 16, fontWeight: 'bold', marginRight: 5, color: '#fff' },
  input: { flex: 1, backgroundColor: 'transparent', height: 50 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  termsText: { color: '#fff', fontSize: 14 },
  link: { fontWeight: 'bold', textDecorationLine: 'underline' },
  button: { borderRadius: 15, backgroundColor: '#fff' },
  buttonContent: { height: 50 },
  buttonLabel: { fontSize: 16, fontWeight: 'bold', color: '#c20f0c' },
  
  /* Modal Styles */
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 20,
    maxHeight: '70%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  modalScroll: { marginBottom: 15 },
  modalText: { color: '#666', lineHeight: 20 },
  modalButton: { backgroundColor: '#f41b3b', borderRadius: 10 },
});