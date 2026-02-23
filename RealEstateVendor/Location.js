import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';

import Geolocation from '@react-native-community/geolocation';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const App = () => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [mapUrl, setMapUrl] = useState('');

  /* ================= LOCATION PERMISSION ================= */
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Location</Text>

      {latitude && longitude && (
        <>
          <Text style={styles.text}>Latitude  : {latitude}</Text>
          <Text style={styles.text}>Longitude : {longitude}</Text>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => Linking.openURL(mapUrl)}>
            <Text style={styles.btnText}>Open in Google Maps</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    marginVertical: 4,
  },
  btn: {
    marginTop: 20,
    backgroundColor: '#800040',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
