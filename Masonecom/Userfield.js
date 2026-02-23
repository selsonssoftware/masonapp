import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { Button } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

export default function EnterNameScreen({ navigation }) {
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('WelcomePage', { name, referralCode });
    }, 1000);
  };

  return (
    <ImageBackground
      source={require('../assets/bg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/splash.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <LinearGradient
        colors={['#f42020', '#c6184e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.formContainer}
      >
        <View style={styles.innerContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.heading}>Enter Name</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>User Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholder=""
                placeholderTextColor="#fff"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Referral Code</Text>
              <TextInput
                value={referralCode}
                onChangeText={setReferralCode}
                style={styles.input}
                placeholder="Optional"
                placeholderTextColor="#fff"
              />
            </View>
          </ScrollView>

          {/* Fixed Bottom Button */}
          <View style={styles.bottomButtonWrapper}>
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 70,
    marginBottom: 10,
  },
  logo: {
    width: 80,
    height: 80,
  },
  formContainer: {
    flex: 1,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 25,
    paddingTop: 20,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: 35,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#f42020',
    paddingHorizontal: 8,
    zIndex: 1,
    fontSize: 14,
    color: 'white',
  },
  input: {
    height: 55,
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 20,
    color: 'white',
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  bottomButtonWrapper: {
    paddingVertical: 20,
  },
  button: {
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c20f0c',
  },
});
