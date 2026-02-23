import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  RefreshControl,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { Text, IconButton, Searchbar, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import RNPickerSelect from 'react-native-picker-select';
import AwesomeAlert from 'react-native-awesome-alerts';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sliderImages, setSliderImages] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const flatListRef = useRef();
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const isFocused = useIsFocused();
  const scaleValue = useRef(new Animated.Value(1)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [membership, setMembership] = useState(null);
  const [userId, setUserId] = useState(null);

  // 🔔 Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'success',
  });

  const showAlert = (title, message, type = 'success') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  useEffect(() => {
    const fetchMembership = async () => {
      try {
        const storedUserId = (await AsyncStorage.getItem('user_id')) || 'M0001';
        setUserId(storedUserId);
        const res = await fetch(
          `https://masonshop.in/api/check_subscription?user_id=${storedUserId}`
        );
        const data = await res.json();
        setMembership(data);
      } catch (error) {
        console.error('Membership check failed:', error);
      }
    };

    fetchMembership();
  }, []);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) checkAndSetAddress();
  }, [isFocused]);

  const onPressIn = () => {
    Animated.spring(scaleValue, { toValue: 1.1, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };

  const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';

  const checkAndSetAddress = async () => {
    try {
      const savedPhone = await AsyncStorage.getItem('phone');
      const phone = savedPhone || 'guest';
      setPhone(phone);

      const savedAddress = await AsyncStorage.getItem(`selected_address_${phone}`);
      if (savedAddress) {
        const parsed = JSON.parse(savedAddress);
        setAddress(parsed);
        return;
      }

      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
              const result = data.results[0];
              const exactAddress = {
                fullAddress: result.formatted_address,
                placeId: result.place_id,
                latitude,
                longitude,
              };

              await AsyncStorage.setItem(
                `selected_address_${phone}`,
                JSON.stringify(exactAddress)
              );

              setAddress(exactAddress);
              showAlert('Detected Address', exactAddress.fullAddress, 'success');
            } else {
              showAlert('Address Not Found', 'Could not detect exact address', 'warning');
            }
          } catch (error) {
            console.error('Google Geocoding failed:', error);
            showAlert('Error', 'Failed to get address from Google API', 'error');
          }
        },
        (error) => {
          console.error('❌ Location Error:', error.message);
          showAlert('Location Error', error.message, 'error');
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    } catch (error) {
      console.error('Address fetch error:', error);
      showAlert('Error', 'Failed to fetch saved or current address', 'error');
    }
  };

  // Fetch Data
  useEffect(() => {
    fetch('https://masonshop.in/api/slider_api')
      .then((res) => res.json())
      .then((data) => {
        if (data.slider) setSliderImages(data.slider.map((i) => ({ uri: i.image })));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (sliderImages.length) {
        const nextIndex = (activeIndex + 1) % sliderImages.length;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        setActiveIndex(nextIndex);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeIndex, sliderImages]);

  useEffect(() => {
    fetch('https://masonshop.in/api/category_api')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.data)) setCategories(data.data);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const fetchDataAndCart = async () => {
      try {
        const response = await fetch('https://masonshop.in/api/product_api');
        const data = await response.json();
        if (Array.isArray(data?.data)) {
          setProducts(data.data);
          setFilteredProducts(data.data);
        }

        const savedCart = await AsyncStorage.getItem('cart');
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          setCartItems(parsed || []);
          const count = parsed.reduce((sum, item) => sum + (item.quantity || 1), 0);
          setCartCount(count);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDataAndCart();
  }, []);

  // --- CART METHODS ---
  const addToCart = async (product, selectedAttribute = null) => {
    try {
      const existingCart = await AsyncStorage.getItem('cart');
      let updatedCart = existingCart ? JSON.parse(existingCart) : [];

      const attribute =
        selectedAttribute ||
        (product.attributes && product.attributes.length > 0
          ? product.attributes[0]
          : null);

      const attributeId = attribute ? attribute.id : null;
      const attributeName = attribute ? attribute.attr_name : null;
      let displayPrice = attribute ? attribute.attr_amount : product.selling;

      if (membership?.status === 'active') {
        const plan = membership?.data?.subscription_name?.toLowerCase();
        if (plan === 'platinum' && product.platinum) displayPrice = product.platinum;
        else if (plan === 'premium' && product.premium) displayPrice = product.premium;
        else if (plan === 'vip' && product.vip) displayPrice = product.vip;
      }

      const existingIndex = updatedCart.findIndex(
        (item) => item.id === product.id && item.attributeId === attributeId
      );

      if (existingIndex !== -1) {
        updatedCart[existingIndex].quantity += 1;
        showAlert('Cart Updated', `${product.name} quantity increased.`, 'success');
      } else {
        updatedCart.push({
          id: product.id,
          name: product.name,
          image: Array.isArray(product.image) ? product.image[0] : product.image,
          selling: product.selling,
          market: product.market,
          attributeId,
          attributeName,
          price: displayPrice,
          quantity: 1,
        });
        showAlert('Added to Cart', `${product.name} added successfully!`, 'success');
      }

      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
      setCartItems(updatedCart);
      setCartCount(updatedCart.reduce((sum, item) => sum + item.quantity, 0));
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Failed to add item to cart.', 'error');
    }
  };

  const updateQuantity = async (productId, change, attributeId = null) => {
    try {
      const existingCart = await AsyncStorage.getItem('cart');
      let updatedCart = existingCart ? JSON.parse(existingCart) : [];

      const index = updatedCart.findIndex(
        (item) => item.id === productId && (item.attributeId ?? null) === (attributeId ?? null)
      );

      if (index !== -1) {
        updatedCart[index].quantity += change;

        if (updatedCart[index].quantity <= 0) {
          const removedItem = updatedCart[index];
          updatedCart.splice(index, 1);
          showAlert('Item Removed', `${removedItem.name} removed from cart`, 'error');
        } else {
          showAlert('Quantity Updated', `Now ${updatedCart[index].quantity} in cart`, 'success');
        }
      }

      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
      setCartItems(updatedCart);
      setCartCount(updatedCart.reduce((sum, item) => sum + item.quantity, 0));
    } catch (e) {
      console.error('updateQuantity error:', e);
      showAlert('Error', 'Something went wrong while updating cart.', 'error');
    }
  };


  // --- UI ---
  const services = [
    { name: 'Coupon', image: require('../assets/coupons.png') },
    { name: 'Rent Vehicle', image: require('../assets/rental.png') ,screen: "RentalVechile"},
    { name: 'Rent Material', image: require('../assets/rental-meterial.png') ,screen: "RentalMeterial"},
    { name: 'Diary', image: require('../assets/diary.png') ,screen: "DairyList"},
    { name: 'Real Estate', image: require('../assets/real-estate.png') ,screen: "Realestate"},
    { name: 'Resale', image: require('../assets/resale.png') ,screen: "Resale"},
    { name: 'Insurance', image: require('../assets/insurence.png') },
    { name: 'Others', image: require('../assets/cement.webp') },
  ];

  return (
    <SafeAreaView style={styles.container}>
     <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#DA1F49"]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => navigation.navigate('Location', { phone })} style={styles.addressTouchable}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="home" size={20} color="#DA1F49" />
                  <Text style={styles.addressLabel}>Home</Text>
                  <Icon name="chevron-down" size={20} color="#DA1F49" />
                </View>
                <Text style={styles.addressLine} numberOfLines={1} ellipsizeMode="tail">
  {address?.fullAddress || `${address?.area || address?.sublocality}, ${address?.locality}`}
</Text>



              </TouchableOpacity>
            </View>

            <View style={styles.headerRight}>
              <IconButton icon="translate" iconColor="white" containerColor="#DA1F49" style={styles.iconBtn} />
              <View style={{ position: 'relative' }}>
                <TouchableOpacity onPress={() => navigation.navigate('ViewCart')}>
                  <IconButton icon="cart" iconColor="white" containerColor="#DA1F49" style={styles.iconBtn} />
                </TouchableOpacity>
                {cartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartCount}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <IconButton icon="account" iconColor="white" containerColor="#DA1F49" style={styles.iconBtn} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search */}
        <Searchbar
          placeholder="Search"
          style={styles.search}
          iconColor="red"
          value={searchQuery}
          onChangeText={(query) => {
            setSearchQuery(query);
            setFilteredProducts(products.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())));
          }}
        />

        {/* Slider */}
        <FlatList
          ref={flatListRef}
          data={sliderImages}
          horizontal
          pagingEnabled
          keyExtractor={(_, index) => index.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => <Image source={item} style={styles.bannerImage} />}
          onMomentumScrollEnd={(e) => setActiveIndex(Math.floor(e.nativeEvent.contentOffset.x / width))}
          style={styles.sliderContainer}
        />

        {/* Categories */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
          {categories.map((item, index) => (
            <View style={styles.categoryItem} key={index}>
              <View style={styles.categoryCircle}>
                <Image source={{ uri: item.image }} style={styles.categoryIcon} resizeMode="contain" />
              </View>
              <Text style={styles.categoryText}>{item.name}</Text>
            </View>
          ))}
        </ScrollView>

       {/* Services */}
<Text style={styles.sectionTitle}>Our Service</Text>
<View style={styles.serviceGrid}>
  {services.map((item, index) => (
    <View key={index} style={styles.serviceItem}>
      {index === 7 ? (
        // Last "See All" card
        <TouchableOpacity
          onPress={() => navigation.navigate("Allservices")}
          style={styles.serviceCard}
        >
          <Image
            source={require("../assets/aerrow-right.png")}
            style={styles.serviceIcon1}
          />
        </TouchableOpacity>
      ) : (
        // Each Service Card clickable
        <TouchableOpacity
          onPress={() => navigation.navigate(item.screen)}  // 👈 navigate to screen dynamically
          style={styles.serviceCard}
        >
          <Image source={item.image} style={styles.serviceIcon} />
        </TouchableOpacity>
      )}
      <Text style={styles.serviceLabel}>{item.name}</Text>
    </View>
  ))}
</View>

        {/* Products */}
{/* Products */}
<View style={styles.productsWrapper}>
  {filteredProducts.map((item, index) => {
    const hasAttributes =
      Array.isArray(item.attributes) && item.attributes.length > 0;
    const selectedAttr =
      selectedAttrs[item.id] || (hasAttributes ? item.attributes[0] : null);

    // ✅ Base price
    let displayPrice = selectedAttr
      ? selectedAttr.attr_amount
      : item.selling;

    // ✅ Membership override pricing
    if (membership?.status === "active") {
      const plan = membership?.data?.subscription_name?.toLowerCase();

      if (plan === "platinum" && item.platinum) {
        displayPrice = item.platinum;
      } else if (plan === "premium" && item.premium) {
        displayPrice = item.premium;
      } else if (plan === "vip" && item.vip) {
        displayPrice = item.vip;
      }
    }

    // ✅ Cart check
    const cartItem = cartItems.find(
      (ci) =>
        ci.id === item.id &&
        ci.attributeId === (selectedAttr ? selectedAttr.id : null)
    );
    const quantity = cartItem ? cartItem.quantity : 0;

    return (
      <Card style={styles.productCard} key={index}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate("ProductDetails", { productId: item.id })
          }
        >
          <Card.Cover
            source={{
              uri: Array.isArray(item.image)
                ? item.image[0]
                : item.image?.split(",")[0], // ✅ first image
            }}
          />
        </TouchableOpacity>

        <Card.Content>
          <Text style={styles.productname}>{item.name}</Text>
          <Text style={styles.description}>{item.description}</Text>

          {/* Attribute Dropdown */}
          {hasAttributes && (
            <RNPickerSelect
              onValueChange={(value) => {
                const attr = item.attributes.find((a) => a.id === value);
                setSelectedAttrs((prev) => ({ ...prev, [item.id]: attr }));
              }}
              items={item.attributes.map((attr) => ({
                label: `${attr.attr_name} - ₹${attr.attr_amount}`,
                value: attr.id,
              }))}
              value={selectedAttr ? selectedAttr.id : null}
              placeholder={{ label: "Select option", value: null }}
              useNativeAndroidPickerStyle={false}
              style={{
                inputAndroid: {
                  color: "#111",
                  fontSize: 14,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 6,
                  backgroundColor: "#F0F8FF",
                },
                inputIOS: {
                  color: "#111",
                  fontSize: 14,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 6,
                  backgroundColor: "#fafafa",
                },
                placeholder: {
                  color: "#888",
                  fontSize: 14,
                },
                iconContainer: {
                  top: 10,
                  right: 10,
                },
              }}
              Icon={() => (
                <Icon name="chevron-down" size={18} color="#666" />
              )}
            />
          )}

          {/* Price with strike-through market price */}
          <Text style={styles.Marketprice}>
            ₹{displayPrice}{" "}
            <Text style={styles.oldPrice}>₹{item.market}</Text>
          </Text>
        </Card.Content>

        {/* Cart buttons */}
        {quantity === 0 ? (
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <TouchableOpacity
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              onPress={() => addToCart(item, selectedAttr)}
              style={styles.cartIconButton}
            >
              <Icon name="cart-plus" size={24} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              onPress={() =>
                updateQuantity(
                  item.id,
                  -1,
                  selectedAttr ? selectedAttr.id : null
                )
              }
              style={styles.quantityButton}
            >
              <Icon name="minus" size={20} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.quantityText}>{quantity}</Text>

            <TouchableOpacity
              onPress={() =>
                updateQuantity(
                  item.id,
                  1,
                  selectedAttr ? selectedAttr.id : null
                )
              }
              style={styles.quantityButton}
            >
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  })}
</View>

  <AwesomeAlert
        show={alertVisible}
        showProgress={false}
        title={alertConfig.title}
        message={alertConfig.message}
        closeOnTouchOutside={true}
        closeOnHardwareBackPress={false}
        showConfirmButton={true}
        confirmText="OK"
        confirmButtonColor={
          alertConfig.type === 'error'
            ? '#D9534F'
            : alertConfig.type === 'warning'
            ? '#FFC107'
            : '#4BB543'
        }
        onConfirmPressed={() => setAlertVisible(false)}
      />


        {/* Bottom Banner */}
        <Card style={styles.banner}>
          <Card.Cover source={require('../assets/banner3.jpg')} />
        </Card>
        
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <IconButton icon="home" />
        <IconButton icon="view-grid" onPress={() => navigation.navigate('ShopPage')} />
        <IconButton icon="qrcode-scan" />
        <IconButton icon="cart" />
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <IconButton icon="account" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- Styles (same as your design, no change)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flex: 1, paddingRight: 10 },
  addressTouchable: { maxWidth: '100%' },
  addressLabel: { marginLeft: 5, marginRight: 5, color: '#DA1F49', fontWeight: 'bold', fontSize: 16 },
  addressLine: { color: '#444', fontSize: 13, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { borderRadius: 30, marginHorizontal: 2 },
  cartBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 4 },
  cartBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#DA1F49' },
  search: { margin: 10, borderRadius: 10 },
  sliderContainer: { height: 180, marginBottom: 10 },
  bannerImage: { width: width, height: 180, resizeMode: 'cover' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', margin: 10 },
  categories: { paddingLeft: 10, marginBottom: 10 },
  categoryItem: { alignItems: 'center', marginRight: 15 },
  categoryCircle: { width: 80, height: 80, borderRadius: 50, borderWidth: 1, borderColor: 'pink', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  categoryIcon: { width: 40, height: 40, resizeMode: 'contain' },
  categoryText: { marginTop: 5, fontSize: 12, textAlign: 'center' },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: 'aliceblue' },
  serviceItem: { width: '23%', alignItems: 'center', marginBottom: 15 },
  serviceCard: { width: '100%', aspectRatio: 1, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  serviceIcon: { width: '60%', height: '60%', resizeMode: 'contain' },
  serviceIcon1: { width: '60%', height: '60%', resizeMode: 'contain' },
  serviceLabel: { fontSize: 12, textAlign: 'center', marginTop: 6 },
  bannerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10 },
  infoCard: { flex: 1, marginHorizontal: 5, borderRadius: 20, elevation: 3 },
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftSide: { flex: 1, paddingRight: 10 },
  title: { fontSize: 13, fontWeight: 'bold', color: '#000' },
  description: { fontSize: 12, color: 'gray', marginVertical: 5 },
  link: { fontSize: 11, color: 'red', fontWeight: 'bold', marginTop: 5 },
  image: { width: 60, height: 60 },
  productsWrapper: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 10 },
  productCard: { width: '47%', marginVertical: 10 },
  oldPrice: { textDecorationLine: 'line-through', color: 'red', fontSize: 12 },
  productname: { color: 'Pink', fontSize: 16, marginTop: 10 },
  Marketprice: { color: 'green', fontSize: 14, marginTop: 5 },
  cartIconButton: { backgroundColor: '#DA1F49', padding: 0, width: 150, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', margin: 10, position: 'relative', bottom: 5, right: 10, top: 5, zIndex: 1 },
  cartIconText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 5, // if you have icon + text
  },
  quantityContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 10 },
  quantityButton: { backgroundColor: '#DA1F49', padding: 6, borderRadius: 20, marginHorizontal: 10 },
  quantityText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', paddingVertical: 10, borderTopWidth: 1, borderColor: '#ddd' },
  banner: { margin: 10, borderRadius: 10, overflow: 'hidden' },
  attrBox: {
    marginLeft: 6,
    backgroundColor: "#f2f2f2",
    borderRadius: 4,
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  attrText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  
  
});
