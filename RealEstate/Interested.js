import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Linking,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BookedPropertyScreen = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const sessionUserId = await AsyncStorage.getItem('user_id');
      const response = await fetch(
        `http://masonshop.in/api/booked_details?owner_id=${sessionUserId}`
      );
      const json = await response.json();
      if (json.success) {
        setData(json.properties || json.property || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const makeCall = (phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* LEFT IMAGE - FIXED DIMENSIONS */}
      <Image
        source={{
          uri: item.images?.[0] || 'https://via.placeholder.com/150.png?text=No+Image',
        }}
        style={styles.propertyImage}
      />

      {/* RIGHT CONTENT */}
      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.project_name || item.type}
          </Text>
          <Text style={styles.price}>₹{item.price}</Text>
        </View>

        <Text style={styles.location} numberOfLines={1}>
          📍 {item.area}, {item.city}
        </Text>

        {/* COMPACT INTERESTED USER SECTION */}
        <View style={styles.userBox}>
          <Text style={styles.userLabel}>CONTACTED BY:</Text>
          <View style={styles.userInfoRow}>
            <View style={{flex: 1}}>
              <Text style={styles.userName}>
                {item.booked_by_name}
              </Text>
              <Text style={styles.userPhone}>{item.booked_by_mobile}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.callIconBtn} 
              onPress={() => makeCall(item.booked_by_mobile)}
            >
              <Text style={styles.callIconText}>📞 Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#800040" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topHeader}>
        <Text style={styles.topHeaderTitle}>Interested Leads</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.empty}>No enquiries yet.</Text>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    paddingVertical:50,
  },
  topHeader: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#800040',
  },
  listContainer: {
    padding: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
    overflow: 'hidden',
    height: 130, // FIXED HEIGHT TO PREVENT LARGE CARDS
  },
  propertyImage: {
    width: 100,
    height: 130,
    backgroundColor: '#eee',
  },
  detailsContainer: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 5,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#800040',
  },
  location: {
    fontSize: 11,
    color: '#777',
    marginBottom: 5,
  },
  userBox: {
    backgroundColor: '#FFF0F5',
    padding: 6,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#FFC0CB',
  },
  userLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#800040',
    marginBottom: 2,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  userPhone: {
    fontSize: 11,
    color: '#444',
  },
  callIconBtn: {
    backgroundColor: '#800040',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  callIconText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
  },
});

export default BookedPropertyScreen;