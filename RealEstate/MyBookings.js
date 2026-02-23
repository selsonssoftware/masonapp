import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
 import AsyncStorage from '@react-native-async-storage/async-storage';

const MyBookingsScreen = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation=useNavigation();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
  try {
    setLoading(true);

    const sessionUserId = await AsyncStorage.getItem('user_id');

    if (!sessionUserId) {
      console.log('User ID not found in session');
      setLoading(false);
      return;
    }

    const response = await fetch(
      `https://masonshop.in/api/getBookedProperty?user_id=${sessionUserId}`
    );

    const json = await response.json();

    if (json.success) {
      setData(json.property);
    } else {
      setData([]);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    setLoading(false);
  }
};

  const renderProperty = ({ item }) => {
    // FIX: Fallback for missing prices or images
    const price = item.price ? `₹${Number(item.price).toLocaleString()}` : "Price on Request";
    const mainImage = item.images && item.images.length > 0 
      ? item.images[0] 
      : 'https://via.placeholder.com/300'; // Fallback image

    return (
      <View style={styles.card}>
        <Image source={{ uri: mainImage }} style={styles.image} />
        
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.typeTag}>{item.type || 'Property'}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{item.admin_status === 'on' ? '● Active' : 'Offline'}</Text>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {item.project_name || item.type || "New Property"}
          </Text>
          
          <Text style={styles.area} numberOfLines={1}>📍 {item.area}</Text>

          <View style={styles.footer}>
            <Text style={styles.price}>{price}</Text>
          <TouchableOpacity 
  style={styles.detailBtn} 
  onPress={() => navigation.navigate('ViewDetails', { propertyId: item.property_id })}
>
  <Text style={styles.detailBtnText}>View Details</Text>
</TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>My Bookings ({data?.length || 0})</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProperty}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', paddingHorizontal: 15,paddingVertical:50 },
  screenTitle: { fontSize: 22, fontWeight: 'bold', marginVertical: 20, color: '#1A1C1E' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  image: { width: '100%', height: 180 },
  content: { padding: 15 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  typeTag: { color: '#3498db', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  statusText: { color: '#2ecc71', fontSize: 12, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: '#333' },
  area: { fontSize: 13, color: '#7f8c8d', marginTop: 4 },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 10
  },
  price: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  detailBtn: { backgroundColor: '#1A1C1E', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  detailBtnText: { color: '#FFF', fontWeight: '600', fontSize: 12 }
});

export default MyBookingsScreen;