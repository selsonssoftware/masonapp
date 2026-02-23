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
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const OtpScreen = ({ route }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputs = useRef([]);
  const navigation = useNavigation();
  const phonenumber = route.params?.phone || 'guest';
  const [errorMsg, setErrorMsg] = useState('');

  const handleOtpChange = (text, index) => {
    if (/^\d$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      if (index < 3) inputs.current[index + 1]?.focus();
    } else if (text === '') {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
    }
  };

  const verifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 4) return;

    const phone = phonenumber;
    if (!phone) {
      Alert.alert("Error", "Phone number missing. Please login again.");
      navigation.navigate('LoginScreen');
      return;
    }

    try {
      const response = await fetch('https://masonshop.in/api/verify_OTP', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: phone, otp: enteredOtp }),
      });

      const data = await response.json();

      if (response.ok && data?.status !== 'error') {
        await AsyncStorage.setItem('phone', phone);

        // Fetch user info after OTP success
        try {
          const userResponse = await fetch(
            `https://masonshop.in/api/getUserIdByPhone?phone=${phone}`,
            { method: 'GET' }
          );

          const userData = await userResponse.json();

          if (
            userResponse.ok &&
            userData?.status === 'success' &&
            userData?.users?.user_id
          ) {
            await AsyncStorage.setItem('user_id', userData.users.user_id);
            await AsyncStorage.setItem('name', userData.users.name);
            await AsyncStorage.setItem('phone', phone);
            console.log('User ID saved:', userData.users.user_id);
          } else {
            console.warn('User ID not found:', userData);
          }
        } catch (userErr) {
          console.error('Error fetching user_id:', userErr);
        }

        Alert.alert(
          'Success',
          'OTP Verified Successfully',
          [{ text: 'Continue', onPress: () => navigation.navigate('WelcomePage') }],
          { cancelable: false }
        );
      } else {
        setErrorMsg(data.message || 'Invalid OTP. Please try again.');
        Alert.alert('Invalid OTP', errorMsg);
      }
    } catch (error) {
      console.error('OTP Verification Error:', error);
      Alert.alert('Network Error', 'Something went wrong. Please try again.');
    }
  };

  useEffect(() => {
    if (otp.every((d) => d !== '')) {
      const delay = setTimeout(() => verifyOtp(), 150);
      return () => clearTimeout(delay);
    }
  }, [otp]);

  return (
    <ImageBackground
      source={require('../assets/bg.png')}
      style={styles.background}
    >
      <View style={styles.container}>
        <Image
          source={require('../assets/splash.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <LinearGradient colors={['#ED1C24', '#D4145A']} style={styles.card}>
          <Text style={styles.title}>Enter Verification Code</Text>

          <View style={styles.row}>
            <Text style={styles.sentText}>Sent to +91 {phonenumber}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
              <Icon name="pencil" size={18} color="white" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>

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
              Don’t receive OTP?{' '}
              <Text
                style={styles.resendLink}
                onPress={() => console.log('Resend OTP')}
              >
                Resend code
              </Text>
            </Text>
          </View>
        </LinearGradient>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  card: {
    width: width,
    flex: 1,
    marginTop: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  sentText: {
    color: 'white',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
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
  resendRow: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resendText: {
    color: '#fff',
    fontSize: 14,
  },
  resendLink: {
    color: '#fff',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
});

export default OtpScreen;
