import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 30;

/* ================= API ================= */
const LIST_API =
  'https://masonshop.in/api/uploadsrealestate_user';

const UPDATE_STATUS_API =
  'https://masonshop.in/api/realestate_status';

const DELETE_PROPERTY_API =
  'https://masonshop.in/api/realestate_delete';

const MEMBERSHIP_API =
  'https://masonshop.in/api/check_subscription';

const MyPropertyListing = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('unpublished');
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState(null);

  useEffect(() => {
    fetchUserProperties();
    fetchMembership();
  }, []);

  const fetchUserProperties = async () => {
  try {
    setLoading(true);

    // ✅ user_id properly get
    const storedUserId = (await AsyncStorage.getItem('user_id')) || 'M0001';

    const res = await fetch(`${LIST_API}?user_id=${storedUserId}`);
    const json = await res.json();

    if (json.success && Array.isArray(json.data)) {
      setAllProperties(
        json.data.map(item => ({
          id: item.id?.toString(),
          property_id: item.property_id,
          project_name: item.project_name,
          status: item.status,
          price: item.price || item.sqftprice,
          type: item.type,
          bedrooms: item.bhk,
          bathrooms: item.bathrooms,
          description: item.description,
          address: item.area ?? 'No Address',
          image:
            item.images && item.images.length > 0
              ? item.images[0]
              : 'https://via.placeholder.com/400x300?text=No+Image',
        }))
      );
    } else {
      setAllProperties([]);
    }
  } catch (error) {
    console.log('Property fetch error:', error);
    Alert.alert('Error', 'Failed to load properties');
  } finally {
    setLoading(false);
  }
};


  const fetchMembership = async () => {
    try {
      const userId =
        (await AsyncStorage.getItem('user_id')) || 'M0001';

      const res = await fetch(
        `${MEMBERSHIP_API}?user_id=${userId}`
      );
      const data = await res.json();
      setMembership(data);
    } catch {}
  };

  const filteredData = useMemo(
    () => allProperties.filter(p => p.status === activeTab),
    [activeTab, allProperties]
  );

const updateStatus = async (property_id, status) => {
  // 🔒 CHECK SUBSCRIPTION
  if (!membership || membership.status !== 'active') {
    Alert.alert(
      'Membership Required',
      'You need an active subscription to publish this property.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go to Membership',
          onPress: () => navigation.navigate('RealMembership'),
        },
      ]
    );
    return;
  }

  try {
    await fetch(UPDATE_STATUS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id, status }),
    });

    fetchUserProperties();
  } catch (error) {
    Alert.alert('Error', 'Failed to publish property');
  }
};


   

  const deleteProperty = property_id => {
    Alert.alert('Delete Property', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await fetch(
            `${DELETE_PROPERTY_API}?property_id=${property_id}`
          );
          fetchUserProperties();
        },
      },
    ]);
  };

  /* ================= CARD ================= */
  const renderProperty = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.image }} style={styles.propertyImg} />

          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.projectText}>{item.project_name}</Text>

          {/* ROW 1 */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Icon name="bed-king-outline" size={18} color="#555" />
              <Text style={styles.colText}>
                {item.bedrooms || 0} Beds
              </Text>
            </View>

            <View style={styles.colRight}>
              <Icon name="shower" size={18} color="#555" />
              <Text style={styles.colText}>
                {item.bathrooms || 0} Baths
              </Text>
            </View>
          </View>

          {/* ROW 2 */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Icon name="home-city-outline" size={18} color="#555" />
              <Text style={styles.colText}>{item.type}</Text>
            </View>

            <View style={styles.colRight}>
              <Icon name="currency-inr" size={18} color="#555" />
              <Text style={styles.colText}>₹ {item.price}</Text>
            </View>
          </View>

          {/* LOCATION */}
          <View style={styles.locationRow}>
            <Icon name="map-marker" size={16} color="#700b33" />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.address}
            </Text>
          </View>

          {/* DESCRIPTION */}
          <Text style={styles.descText} numberOfLines={2}>
            {item.description || 'No description available'}
          </Text>

          {/* ACTIONS */}
         {/* ACTIONS */}
<View style={styles.actionRow}>

  {/* ✅ ONLY in UNPUBLISHED tab → Publish */}
  {activeTab === 'unpublished' && (
    <TouchableOpacity
      style={styles.publishBtn}
      onPress={() => updateStatus(item.property_id, 'published')}
    >
      <Text style={styles.btnTextWhite}>Publish</Text>
    </TouchableOpacity>
  )}

  {/* ✅ ONLY in PUBLISHED tab → Soldout */}
  {activeTab === 'published' && (
    <TouchableOpacity
      style={styles.publishBtn}
      onPress={() => updateStatus(item.property_id, 'soldout')}
    >
      <Text style={styles.btnTextWhite}>Soldout</Text>
    </TouchableOpacity>
  )}

  {/* ❌ Always allow delete */}
  <TouchableOpacity
    style={styles.deleteBtn}
    onPress={() => deleteProperty(item.property_id)}
  >
    <Icon name="trash-can-outline" size={18} color="red" />
  </TouchableOpacity>

</View>

        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.headerTitle}>My Property</Text>

      <View style={styles.tabBar}>
        {['unpublished', 'published', 'soldout'].map(t => (
          <TouchableOpacity
            key={t}
            style={[
              styles.tab,
              activeTab === t && styles.activeTab,
            ]}
            onPress={() => setActiveTab(t)}>
            <Text
              style={[
                styles.tabText,
                activeTab === t && styles.activeTabText,
              ]}>
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderProperty}
          keyExtractor={i => i.id}
        />
      )}
    </SafeAreaView>
  );
};

export default MyPropertyListing;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, backgroundColor: '#f5f5f5' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },

  tabBar: { flexDirection: 'row', justifyContent: 'space-around' },
  tab: { padding: 10 },
  activeTab: { borderBottomWidth: 3, borderColor: '#700b33' },
  tabText: { color: '#666' },
  activeTabText: { color: '#700b33', fontWeight: 'bold' },

  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 12,
    elevation: 3,
  },

  imageWrapper: { position: 'relative' },
  propertyImg: { height: 160, borderTopLeftRadius: 12, borderTopRightRadius: 12 },

  typeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#700b33',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  detailsContainer: { padding: 10 },
  projectText: { fontSize: 15, fontWeight: '600' },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },

  col: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48%',
  },

  colRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48%',
    justifyContent: 'flex-end',
  },

  colText: { fontSize: 12, color: '#333', fontWeight: '500' },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },

  addressText: { fontSize: 12, color: '#555', flex: 1 },

  descText: {
    fontSize: 12,
    color: '#777',
    marginTop: 6,
    lineHeight: 16,
  },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },

  publishBtn: {
    flex: 1,
    backgroundColor: '#700b33',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },

  deleteBtn: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
  },

  btnTextWhite: { color: '#fff', fontSize: 12 },
});
