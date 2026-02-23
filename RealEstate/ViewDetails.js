import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';


const { width } = Dimensions.get('window');
const THEME = '#00897B';

const PropertyDetailsScreen = ({ route }) => {
  const navigation = useNavigation();
  const { propertyId } = route.params;
  const [contactLoading, setContactLoading] = useState(false);


  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 🔥 Auto-Slide Logic
  const scrollRef = useRef(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetchDetails();
  }, [propertyId]);

  // 🔥 Effect for Auto-sliding images every 3 seconds
  useEffect(() => {
    if (data?.images && data.images.length > 1) {
      const interval = setInterval(() => {
        let nextIndex = activeImage + 1;
        if (nextIndex >= data.images.length) nextIndex = 0;
        
        scrollRef.current?.scrollTo({
          x: nextIndex * width,
          animated: true,
        });
        setActiveImage(nextIndex);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeImage, data]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://masonshop.in/api/publishrealestate_api?property_id=${propertyId}`
      );
      const json = await response.json();
      if (json.status && json.property) setData(json.property);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cleanImageUrl = (item) => {
    if (!item) return null;
    let path = item.replace(/[\[\]\\"]+/g, '');
    if (path.includes('https://masonshop.in/https://')) {
        path = path.replace('https://masonshop.in/', '');
    }
    return path.startsWith('http') ? path : `https://masonshop.in/${path}`;
  };

  const Row = ({ label, value }) => {
    if (!value || value === 'undefined' || value === 'null' || value === '') return null;
    return (
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>{label}</Text>
        <Text style={styles.tableValue}>{value}</Text>
      </View>
    );
  };

  const contactOwner = async () => {
  try {
    const userId = await AsyncStorage.getItem('user_id');

    if (!userId) {
      Alert.alert('Login Required', 'Please login to contact owner');
      return;
    }

    setContactLoading(true);

    // ⏳ Force 4-second loader
    await new Promise(resolve => setTimeout(resolve, 4000));

    const response = await fetch(
      'https://masonshop.in/api/contactPropertyOwner',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          property_id: propertyId,
        }),
      }
    );

    const result = await response.json();

    setContactLoading(false);

    if (result.status) {
      Alert.alert(
        'Request Sent',
        'Your details have been shared with the property owner.',
        [
          {
            text: 'Call Now',
            onPress: () => {
              if (data.mobile) {
                Linking.openURL(`tel:${data.mobile}`);
              }
            },
          },
          { text: 'OK' },
        ]
      );
    } else {
      Alert.alert('Failed', result.message || 'Something went wrong');
    }
  } catch (error) {
    setContactLoading(false);
    console.error(error);
    Alert.alert('Error', 'Unable to contact owner');
  }
};



  /* ================= DYNAMIC FIELDS BY PROPERTY TYPE ================= */
  const renderFields = () => {
    const type = data.type; // Apartment, Plots, Pg, etc.

    

    return (
      <View style={styles.table}>
        {/* Always Show */}
        <Row label="Property Type" value={data.type} />
        <Row label="Listed By" value={data.listed_by} />

        {/* --- Residential (Apartment/Villa) Only --- */}
        {(type === 'Apartment' || type === 'Villa') && (
          <>
            <Row label="BHK" value={data.bhk} />
            <Row label="Bathrooms" value={data.bathrooms} />
            <Row label="Furnishing" value={data.furnishing} />
            <Row label="Construction" value={data.construction_status} />
            <Row label="Total Floors" value={data.total_floors} />
            <Row label="Floor No" value={data.floor_no} />
            <Row label="Parking" value={data.carparking} />
          </>
        )}

        {/* --- Plots Only --- */}
        {type === 'Plots' && (
          <>
            <Row label="Plot Area" value={data.plot_area} />
            <Row label="Plot Type" value={data.plot_type} />
            <Row label="Dimensions" value={data.length !== 'undefined' ? `${data.length}x${data.breadth}` : null} />
          </>
        )}

        {/* --- PG Only --- */}
        {type === 'Pg' && (
          <>
            <Row label="Sharing Type" value={data.sharing_type} />
            <Row label="Food Available" value={data.food_available} />
            <Row label="Total Beds" value={data.total_beds} />
            <Row label="WiFi" value={data.wifi} />
          </>
        )}

        <Row label="Facing" value={data.facing} />
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME} /></View>;
  if (!data) return <View style={styles.center}><Text>Property not found.</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* AUTO-SLIDE IMAGE SLIDER */}
        <View style={{ height: 320 }}>
          <ScrollView 
            ref={scrollRef}
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImage(newIndex);
            }}
          >
            {data.images?.length > 0 ? (
              data.images.map((img, i) => (
                <Image key={i} source={{ uri: cleanImageUrl(img) }} style={styles.detailsImage} />
              ))
            ) : (
              <Image source={require('../assets/ern.png')} style={styles.detailsImage} />
            )}
          </ScrollView>
          
          {/* Pagination Dots */}
          <View style={styles.dotContainer}>
            {data.images?.map((_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i === activeImage ? THEME : '#ccc' }]} />
            ))}
          </View>

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 20 }}>←</Text>
          </TouchableOpacity>
        </View>

        {contactLoading && (
  <View style={styles.loaderOverlay}>
    <View style={styles.loaderBox}>
      <ActivityIndicator size="large" color={THEME} />
      <Text style={styles.loaderText}>
        Please wait…{'\n'}
        Sending your details to the property owner
      </Text>
    </View>
  </View>
)}


        <View style={styles.content}>
            
          <Text style={styles.price}>₹ Rs {data.price || data.sqftprice|| 'Price on Request'}</Text>
          <Text style={styles.title}>{data.project_name || `${data.bhk || ''} ${data.type}`}</Text>
          <Text style={styles.address}>📍 {data.area}, {data.city}</Text>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Key Features</Text>
          {renderFields()}

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descText}>{data.description || 'No description provided.'}</Text>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        
       <TouchableOpacity
  style={[styles.footerBtn, { backgroundColor: THEME }]}
  onPress={contactOwner}
>
  <Text style={{ color: '#fff', fontWeight: 'bold' }}>
    Contact Owner
  </Text>
</TouchableOpacity>

      </View>
    </View>
  );
};

export default PropertyDetailsScreen;

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  detailsImage: { width: width, height: 320, resizeMode: 'cover' },
  dotContainer: { position: 'absolute', bottom: 15, width: '100%', flexDirection: 'row', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  backBtn: { position: 'absolute', top: 50, left: 16, backgroundColor: '#fff', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  price: { fontSize: 28, fontWeight: 'bold', color: '#111' },
  title: { fontSize: 18, color: '#444', marginTop: 4 },
  address: { color: '#666', marginTop: 8 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  table: { borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 10 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tableLabel: { color: '#888' },
  tableValue: { fontWeight: 'bold', color: '#333' },
  descText: { lineHeight: 22, color: '#555' },
  footer: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  footerBtn: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  loaderOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 999,
},
loaderBox: {
  backgroundColor: '#fff',
  padding: 25,
  borderRadius: 14,
  alignItems: 'center',
  width: '80%',
},
loaderText: {
  marginTop: 15,
  textAlign: 'center',
  color: '#444',
  fontSize: 15,
  lineHeight: 22,
},

});