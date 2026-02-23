import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function ResaleDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // 1. Get product ID from navigation params (passed from previous screen)
  // Fallback to 19 for testing if undefined
  const { product } = route.params || {}; 
  const productId = product?.id || 1; 

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  // 2. Fetch Data from API
  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      const url = `https://masonshop.in/api/resale_data?product_id=${productId}`;
      console.log("Fetching URL:", url);
      
      const response = await fetch(url);
      const json = await response.json();

      if (json.status && json.data) {
        setData(json.data);
      } else {
        Alert.alert("Error", "Product not found");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      Alert.alert("Error", "Failed to load product details.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // 4. Prepare Images Array (Main Image + Multiple Images)
  const getImages = () => {
    if (!data) return [];
    let images = [];
    if (data.image) images.push(data.image);
    if (data.multiple_image && Array.isArray(data.multiple_image)) {
      images = [...images, ...data.multiple_image];
    }
    return images;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!data) return null;

  const productImages = getImages();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* TOP NAV (Absolute Positioned) */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.circleBtn}>
            <MaterialIcons name="share" size={22} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.circleBtn, { marginLeft: 10 }]}>
            <MaterialIcons name="favorite-border" size={22} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* IMAGE SLIDER */}
        <View>
          <FlatList
            data={productImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setActiveSlide(index);
            }}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.mainImg} resizeMode="cover" />
            )}
          />
          {/* Pagination Dots */}
          {productImages.length > 1 && (
            <View style={styles.pagination}>
              {productImages.map((_, index) => (
                <View 
                  key={index} 
                  style={[styles.dotIndicator, activeSlide === index && styles.activeDot]} 
                />
              ))}
            </View>
          )}
        </View>

        {/* CONTENT CARD */}
        <View style={styles.contentCard}>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceText}>₹{data.price}</Text>
              {/* Optional: Add logic for original price if API provides it later */}
            </View>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {data.km_drive ? `${data.km_drive} KM` : 'Fresh'}
              </Text>
            </View>
          </View>

          <Text style={styles.productTitle}>{data.project_name}</Text>

          <View style={styles.infoRow}>
            <MaterialIcons name="place" size={16} color="#777" />
            <Text style={styles.infoText}>
              {data.city || data.street_name || "Location Unavailable"}
            </Text>
            <View style={styles.dotSeparator} />
            <Text style={styles.infoText}>{formatDate(data.created_at)}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionHeader}>Description</Text>
          <Text style={styles.descText}>
            {data.description || "No description provided."}
          </Text>

          <View style={styles.divider} />

          {/* Seller Details */}
          <Text style={styles.sectionHeader}>Seller Details</Text>
          <TouchableOpacity style={styles.sellerBox}>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?img=3' }} // Placeholder for User Avatar
              style={styles.avatar} 
            />
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.sellerName}>Seller ID: {data.user_id}</Text>
              <Text style={styles.sellerSub}>Verified Member</Text>
            </View>
            <View style={styles.ratingBox}>
              <MaterialIcons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>4.5</Text>
            </View>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* FIXED BOTTOM BAR */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.chatBtn}
          activeOpacity={0.8}
          // Pass dynamic data to ChatPage
          onPress={() => navigation.navigate('ChatPage', {
            sellerId: data.user_id,
            sellerName: `User ${data.user_id}`,
            productName: data.project_name,
            productPrice: data.price,
            productId: data.id,
            productImage: data.image
          })}
        >
          <MaterialCommunityIcons name="chat-outline" size={24} color="#000" />
          <Text style={styles.chatBtnText}>Chat</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.buyBtn}>
          <Text style={styles.buyBtnText}>Buy Now</Text>
        </TouchableOpacity> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { justifyContent: 'center', alignItems: 'center' },
  
  topNav: { 
    position: 'absolute', top: 50, left: 15, right: 15, zIndex: 10, 
    flexDirection: 'row', justifyContent: 'space-between' 
  },
  circleBtn: { 
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 5
  },
  
  mainImg: { width: width, height: 400, backgroundColor: '#F0F0F0' },
  
  pagination: {
    position: 'absolute', bottom: 40, width: '100%', 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center'
  },
  dotIndicator: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 4
  },
  activeDot: { backgroundColor: '#FFF', width: 10, height: 10, borderRadius: 5 },

  contentCard: { 
    marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, 
    backgroundColor: '#FFF', padding: 20, paddingBottom: 100 
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  priceText: { fontSize: 28, fontWeight: '900', color: '#000' },
  badge: { backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { color: '#2196F3', fontWeight: 'bold', fontSize: 12 },
  
  productTitle: { fontSize: 20, fontWeight: '700', marginTop: 10, color: '#333' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  infoText: { fontSize: 13, color: '#777' },
  dotSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CCC', marginHorizontal: 8 },
  
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 20 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#000' },
  descText: { fontSize: 15, color: '#555', lineHeight: 22 },
  
  sellerBox: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', 
    padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#EEE' 
  },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EEE' },
  sellerName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  sellerSub: { fontSize: 12, color: '#888' },
  ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 5, borderRadius: 8 },
  ratingText: { marginLeft: 4, fontWeight: 'bold', color: '#333' },
  
  footer: { 
    position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', 
    padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE',
    alignItems: 'center'
  },
  chatBtn: { 
    flex: 1, height: 55, borderRadius: 15, borderWidth: 1, borderColor: '#DDD',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginRight: 15 
  },
  chatBtnText: { marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: '#000' },
  buyBtn: { 
    flex: 2, height: 55, borderRadius: 15, backgroundColor: '#000', 
    justifyContent: 'center', alignItems: 'center' 
  },
  buyBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});