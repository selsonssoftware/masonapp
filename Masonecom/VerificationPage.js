import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AwesomeAlert from 'react-native-awesome-alerts';

const { width } = Dimensions.get('window');

const OtpScreen = ({ route }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputs = useRef([]);
  const navigation = useNavigation();
  const phonenumber = route.params?.phone || 'guest';
  const [errorMsg, setErrorMsg] = useState('');

  // Alert states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');

  const showAlert = (title, message, type = 'error') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const hideAlert = () => setAlertVisible(false);

  // 🔥 CLEAR OTP BOXES FULLY
  const clearOtp = () => {
    setOtp(['', '', '', '']);
    setTimeout(() => inputs.current[0]?.focus(), 80);
  };

  // 🔥 FIXED OTP INPUT HANDLER
  const handleOtpChange = (text, index) => {
    let newOtp = [...otp];

    if (text === '') {
      // Backspace: move previous + clear
      newOtp[index] = '';

      if (index > 0 && otp[index] === '') {
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputs.current[index - 1]?.focus();
        return;
      }

      setOtp(newOtp);
      return;
    }

    // Accept only 0-9
    if (/^\d$/.test(text)) {
      newOtp[index] = text;

      // Clear all remaining boxes so old OTP doesn't remain
      for (let i = index + 1; i < 4; i++) {
        newOtp[i] = '';
      }

      setOtp(newOtp);

      // Move next
      if (index < 3) {
        inputs.current[index + 1]?.focus();
      }
    }
  };

  // 🔥 OTP VERIFY
  const verifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 4) return;

    const phone = phonenumber;

    try {
      const response = await fetch('https://masonshop.in/api/verify_OTP', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: phone, otp: enteredOtp }),
      });

      const data = await response.json();

      if (response.ok && data?.status !== 'error') {
        await AsyncStorage.setItem('phone', phone);

        let userIsNew = true;

        try {
          const userResponse = await fetch(
            `https://masonshop.in/api/getUserIdByPhone?phone=${phone}`
          );

          const userData = await userResponse.json();

          if (
            userResponse.ok &&
            userData?.status === 'success' &&
            userData?.users?.user_id
          ) {
            await AsyncStorage.setItem('user_id', userData.users.user_id);

            if (userData.users.name) {
              await AsyncStorage.setItem('name', userData.users.name);
              userIsNew = false;
            }
          }
        } catch (userErr) {
          console.error('user id fetch error:', userErr);
        }

        showAlert('Success', 'OTP Verified Successfully!', 'success');
        setTimeout(() => {
          hideAlert();
          navigation.navigate(userIsNew ? 'RegisterScreen' : 'WelcomePage', {
            phone,
          });
        }, 1500);
      } else {
        // ❗ INVALID OTP → CLEAR ALL 4 BOXES
        clearOtp();

        const msg = data?.message || 'Invalid OTP. Please try again.';
        setErrorMsg(msg);
        showAlert('Invalid OTP', msg);
      }
    } catch (error) {
      console.error('otp error:', error);

      // Clear on network error also
      clearOtp();

      showAlert('Network Error', 'Something went wrong. Please try again.');
    }
  };

  // Auto verify when 4 digits filled
  useEffect(() => {
    if (otp.every((d) => d !== '')) {
      const delay = setTimeout(() => verifyOtp(), 150);
      return () => clearTimeout(delay);
    }
  }, [otp]);

  return (
    <ImageBackground source={require('../assets/bg.png')} style={styles.background}>
      <View style={styles.container}>
        <Image source={require('../assets/splash.png')} style={styles.logo} resizeMode="contain" />

        <LinearGradient colors={['#ED1C24', '#D4145A']} style={styles.card}>
          <Text style={styles.title}>Enter Verification Code</Text>

          <View style={styles.row}>
            <Text style={styles.sentText}>Sent to +91 {phonenumber}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
              <Icon name="pencil" size={18} color="white" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>

          {/* OTP BOXES */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                style={styles.otpInput}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                ref={(ref) => (inputs.current[index] = ref)}
              />
            ))}
          </View>

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>
              Didn’t receive OTP?{' '}
              <Text style={styles.resendLink} onPress={() => console.log('Resend OTP')}>
                Resend code
              </Text>
            </Text>
          </View>
        </LinearGradient>

        {/* Alert */}
        <AwesomeAlert
          show={alertVisible}
          showProgress={false}
          title={alertTitle}
          message={alertMessage}
          closeOnTouchOutside={true}
          showConfirmButton={true}
          confirmText="OK"
          confirmButtonColor={alertType === 'success' ? '#4CAF50' : '#f41b3b'}
          onConfirmPressed={hideAlert}
        />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, resizeMode: 'cover' },
  container: { flex: 1, alignItems: 'center', paddingTop: 80 },
  logo: { width: 100, height: 100, marginBottom: 10 },
  card: {
    width: width,
    flex: 1,
    marginTop: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 20,
    alignItems: 'center',
  },
  title: { color: 'white', fontSize: 22, fontWeight: 'bold', marginTop: 20 },
  sentText: { color: 'white', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  otpContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 20 },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 30,
    textAlign: 'center',
    fontSize: 20,
    backgroundColor: '#fff',
    color: '#000',
    marginHorizontal: 8,
  },
  resendRow: { alignItems: 'center', marginBottom: 30 },
  resendText: { color: '#fff', fontSize: 14 },
  resendLink: { color: '#fff', textDecorationLine: 'underline', fontWeight: 'bold' },
});

export default OtpScreen;
