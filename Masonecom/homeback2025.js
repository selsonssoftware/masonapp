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
  Modal,
  TouchableWithoutFeedback,
  ToastAndroid,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Keyboard
} from 'react-native';
import { Text, IconButton, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
import LinearGradient from "react-native-linear-gradient";
import { useQuery, useQueryClient } from '@tanstack/react-query';

const { width } = Dimensions.get('window');
const CART_KEY = "cart";
const SEARCH_HISTORY_KEY = "search_history_v1"; // Unique key for history

// --- API Fetchers ---
const fetchProducts = async () => {
  const res = await fetch("https://masonshop.in/api/product_api");
  const json = await res.json();
  return json.data || [];
};

const fetchSliders = async () => {
  const res = await fetch('https://masonshop.in/api/slider_api');
  const json = await res.json();
  return (json.slider || []).map((i) => ({ uri: i.image }));
};

const fetchCategories = async () => {
  const res = await fetch('https://masonshop.in/api/category_api');
  const json = await res.json();
  return json.data || [];
};

const fetchMembership = async ({ queryKey }) => {
  const [_, userId] = queryKey;
  if (!userId) return null;
  const res = await fetch(`https://masonshop.in/api/check_subscription?user_id=${userId}`);
  return await res.json();
};

const fetchVendorStatus = async ({ queryKey }) => {
  const [_, userId] = queryKey;
  // If no userId, return a default "false" status immediately
  if (!userId) return { status: false }; 

  try {
    const res = await fetch(`https://masonshop.in/api/vendor_check?user_id=${userId}`);
    const json = await res.json();
    
    // Ensure we return the data even if the API structure is nested
    return json || { status: false };
  } catch (error) {
    console.error("Vendor check failed:", error);
    return { status: false }; // Return false on network error
  }
};

export default function HomeScreen({ navigation }) {
  const queryClient = useQueryClient();
  const isFocused = useIsFocused();
  const flatListRef = useRef();

  // --- State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cart, setCart] = useState([]);
  const [userId, setUserId] = useState(null);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [activeTab, setActiveTab] = useState("Shop");
  const [refreshing, setRefreshing] = useState(false);

  const WISHLIST_KEY = "wishlist";
const [wishlist, setWishlist] = useState([]);

// Load Wishlist
const loadWishlist = async () => {
  try {
    const stored = await AsyncStorage.getItem(WISHLIST_KEY);
    if (stored) setWishlist(JSON.parse(stored));
  } catch (e) { console.log(e); }
};

useEffect(() => {
  if (isFocused) loadWishlist();
}, [isFocused]);

// Toggle Logic
const toggleWishlist = async (product) => {
  let updatedWishlist = [...wishlist];
  const index = updatedWishlist.findIndex(item => item.id === product.id);

  if (index > -1) {
    // Remove
    updatedWishlist.splice(index, 1);
    ToastAndroid.show("Removed from Wishlist", ToastAndroid.SHORT);
  } else {
    // Add
    updatedWishlist.push(product);
    ToastAndroid.show("Added to Wishlist", ToastAndroid.SHORT);
  }

  setWishlist(updatedWishlist);
  await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(updatedWishlist));
};

// Check if in wishlist (Helper)
const isInWishlist = (id) => wishlist.some(item => item.id === id);

  // --- Location Permissions ---
  const requestLocationPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        if (granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permissions granted');
        }
      } catch (err) { console.warn(err); }
    }
  };

  

  // --- Initial Data Loading ---
  useEffect(() => {
    const loadUserData = async () => {
      const storedUserId = (await AsyncStorage.getItem("user_id")) || "M0001";
      const storedPhone = (await AsyncStorage.getItem("phone")) || "guest";
      const storedAddress = await AsyncStorage.getItem(`selected_address_${storedPhone}`);
      
      
      setUserId(storedUserId);
      setPhone(storedPhone);
      if (storedAddress) setAddress(JSON.parse(storedAddress));
      
      loadCart();
      loadSearchHistory(); // Load history on mount
    };

    if (isFocused) {
      loadUserData();
      requestLocationPermissions();
    }
  }, [isFocused]);

  // --- React Query ---
  const { data: products = [], isLoading: productsLoading } = useQuery({ queryKey: ['products'], queryFn: fetchProducts, staleTime: 1000 * 60 * 5 });
  const { data: sliderImages = [] } = useQuery({ queryKey: ['sliders'], queryFn: fetchSliders, staleTime: 1000 * 60 * 60 });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories, staleTime: 1000 * 60 * 60 });
  const { data: membership } = useQuery({ queryKey: ['membership', userId], queryFn: fetchMembership, enabled: !!userId });
  const { data: vendorData } = useQuery({ queryKey: ['vendorStatus', userId], queryFn: fetchVendorStatus, enabled: !!userId });

  // --- Logic ---
  const isStore = vendorData?.status === true && vendorData?.vendor?.type === 'store';
  const isVehicle = vendorData?.status === true && vendorData?.vendor?.type === 'vehicle';

  // ** Search History Logic **
  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (e) { console.log("Error loading history", e); }
  };

  const saveSearchHistory = async (query) => {
    if (!query || !query.trim()) return;
    try {
      // Create new history array: Add new query to top, remove duplicates, limit to 10
      let newHistory = [query, ...searchHistory.filter(h => h.toLowerCase() !== query.toLowerCase())].slice(0, 10);
      setSearchHistory(newHistory);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (e) { console.log("Error saving history", e); }
  };

  const deleteHistoryItem = async (index) => {
    const newHistory = [...searchHistory];
    newHistory.splice(index, 1);
    setSearchHistory(newHistory);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  // ** Navigation Handling **
  
  // 1. Submit form (Enter key or "Search for...")
  const handleSearchSubmit = () => {
    saveSearchHistory(searchQuery);
    Keyboard.dismiss();
    setIsSearching(false);
    navigation.navigate('ShopPage', { searchQuery: searchQuery });
  };

  


  // 2. Click specific history item
  const handleHistoryClick = (item) => {
    setSearchQuery(item);
    saveSearchHistory(item); // Refresh position in history
    Keyboard.dismiss();
    setIsSearching(false);
    navigation.navigate('ShopPage', { searchQuery: item });
  };

  // 3. Click specific product suggestion
  const handleProductClick = (item) => {
    saveSearchHistory(item.name);
    navigation.navigate('ShopPage', { category_id: item.category_id });
  };

  const filteredProducts = products.filter((item) => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const homeProducts = filteredProducts.slice(0, 10);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries(['products']),
      queryClient.invalidateQueries(['sliders']),
      queryClient.invalidateQueries(['categories']),
      queryClient.invalidateQueries(['membership']),
      queryClient.invalidateQueries(['vendorStatus']),
      loadCart(),
      loadSearchHistory()
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const loadCart = async () => {
    const raw = await AsyncStorage.getItem(CART_KEY);
    setCart(raw ? JSON.parse(raw) : []);
  };
  const saveCart = async (newCart) => {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(newCart));
    setCart(newCart);
  };

  useEffect(() => {
    if (!sliderImages.length) return;
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % sliderImages.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    }, 3000);
    return () => clearInterval(interval);
  }, [sliderImages, activeIndex]);

  // Pricing
  const getUserType = () => membership?.data?.subscription_name?.toLowerCase() || null;
  const getPrice = (item) => {
    const t = getUserType();
    if (t === "vip") return item.vip || item.selling;
    if (t === "platinum") return item.platinum || item.selling;
    return item.selling;
  };
  const getAttrPrice = (attr) => {
    const t = getUserType();
    if (t === "vip") return attr.vip || attr.selling || attr.attr_amount;
    return attr.attr_amount || attr.selling;
  };
  const firstImage = (img) => Array.isArray(img) ? img[0] : String(img || '').split(',')[0];
  const findCartIndex = (pid, aid) => cart.findIndex(c => Number(c.product_id) === Number(pid) && (aid === null ? c.attribute_id === null : Number(c.attribute_id) === Number(aid)));
  const getQty = (pid, aid = null) => { const idx = findCartIndex(pid, aid); return idx === -1 ? 0 : cart[idx].qty; };
  
  const updateQty = async (pid, aid = null, delta = 1) => {
    let newCart = [...cart];
    const idx = findCartIndex(pid, aid);
    if (idx === -1) return;
    newCart[idx].qty += delta;
    if (newCart[idx].qty <= 0) newCart.splice(idx, 1);
    await saveCart(newCart);
  };

  const addToCartInitial = async (product, attribute = null) => {
    const newItem = {
      product_id: product.id,
      attribute_id: attribute?.id || null,
      attribute_name: attribute?.attr_name || null,
      name: product.name,
      image: firstImage(product.image),
      price: attribute ? getAttrPrice(attribute) : getPrice(product),
      qty: 1,
    };
    let newCart = [...cart];
    const idx = findCartIndex(product.id, newItem.attribute_id);
    if (idx === -1) newCart.push(newItem); else newCart[idx].qty += 1;
    await saveCart(newCart);
    ToastAndroid.show("Added to cart", ToastAndroid.SHORT);
  };

  const getDiscount = (market, selling) => {
    if (!market || !selling || market <= selling) return null;
    const diff = ((market - selling) / market) * 100;
    return Math.round(diff) + "% OFF";
  };

  const services = [
    { name: 'Shop', image: require('../assets/shop.png'), screen: "HomeScreen" },
    { name: 'RentalVehicle', image: require('../assets/rental.png'), screen: "HomeVechile" },
    { name: 'RentalMaterial', image: require('../assets/rental-meterial.png'), screen: "MeterialHome" },
    { name: 'Real Estate', image: require('../assets/real-estate.png'), screen: "RealEstateHome" },
    { name: 'Diary', image: require('../assets/diary.png'), screen: "DairyList" },
    { name: 'Resale', image: require('../assets/resale.png'), screen: "Resale" },
       { name: 'Coupon', image: require('../assets/coupons.png'), screen: "CouponsHome" },
    { name: 'Insurance', image: require('../assets/insurence.png') },
    { name: 'Others', image: require('../assets/cement.webp') },
 
  ];

  if (productsLoading) return <View style={styles.centerLoad}><ActivityIndicator size="large" color="#DA1F49" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Search Bar - Sticky */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
           {!isSearching && (
             <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <TouchableOpacity onPress={() => navigation.navigate('Location', { phone })} style={styles.addressTouchable}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="home" size={20} color="#DA1F49" />
                    <Text style={styles.addressLabel}>Home</Text>
                    <Icon name="chevron-down" size={18} color="#DA1F49" />
                  </View>
                  <Text style={styles.addressLine} numberOfLines={1}>{address?.fullAddress || "Select Address..."}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.headerRight}>
                   <TouchableOpacity onPress={() => navigation.navigate('WhisListScreen')} style={styles.cartWrapper}>
                  <IconButton icon="heart-outline" iconColor="white" containerColor="#DA1F49" size={20} style={styles.iconBtn} />
                  {wishlist.length > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{wishlist.length}</Text></View>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('ViewCart')} style={styles.cartWrapper}>
                  <IconButton icon="cart" iconColor="white" containerColor="#DA1F49" size={20} style={styles.iconBtn} />
                  {cart.length > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cart.length}</Text></View>}
                </TouchableOpacity>
                <IconButton icon="account" iconColor="white" containerColor="#DA1F49" size={20} style={styles.iconBtn} onPress={() => navigation.navigate('Profile')} />
              </View>
            </View>
           )}
        </View>

        {/* Search Input */}
        <View style={styles.searchWrapper}>
          {isSearching && (
            <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(''); Keyboard.dismiss(); }}>
              <Icon name="arrow-left" size={24} color="#555" style={{marginRight: 10}} />
            </TouchableOpacity>
          )}
          <Searchbar 
            placeholder="Search products..." 
            style={[styles.search, isSearching && {flex: 1, margin: 0}]} 
            inputStyle={{minHeight: 0}}
            value={searchQuery} 
            onFocus={() => { setIsSearching(true); loadSearchHistory(); }}
            onChangeText={setSearchQuery} 
            onSubmitEditing={handleSearchSubmit}
          />
        </View>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#DA1F49"]} />} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* --- STATE 1: SEARCHING (Overlay Mode) --- */}
        {isSearching ? (
           <View style={{minHeight: Dimensions.get('window').height, backgroundColor: '#fff'}}>
              
              {/* Case A: History (No text typed yet) */}
              {searchQuery.length === 0 ? (
                <View style={styles.historyContainer}>
                   <View style={styles.historyHeader}>
                      <Text style={styles.historyTitle}>Recent Searches</Text>
                      {searchHistory.length > 0 && <TouchableOpacity onPress={() => {setSearchHistory([]); AsyncStorage.removeItem(SEARCH_HISTORY_KEY)}}><Text style={styles.clearText}>Clear All</Text></TouchableOpacity>}
                   </View>
                   {searchHistory.map((item, index) => (
                     <TouchableOpacity key={index} style={styles.historyItem} onPress={() => handleHistoryClick(item)}>
                        <Icon name="clock-outline" size={20} color="#999" />
                        <Text style={styles.historyText}>{item}</Text>
                        <TouchableOpacity onPress={() => deleteHistoryItem(index)} style={{marginLeft: 'auto', padding: 5}}>
                           <Icon name="close" size={18} color="#999" />
                        </TouchableOpacity>
                     </TouchableOpacity>
                   ))}
                </View>
              ) : (
                /* Case B: Search Suggestions (Flipkart List Style - NO PRICE) */
                <View>
                   {/* 1. "Search for..." Link */}
                   <TouchableOpacity style={styles.suggestionRow} onPress={handleSearchSubmit}>
                      <View style={styles.searchIconBox}><Icon name="magnify" size={22} color="#555" /></View>
                      <Text style={styles.suggestionText}>Search for "<Text style={{fontWeight: 'bold', color: '#000'}}>{searchQuery}</Text>"</Text>
                      <Icon name="arrow-top-left" size={20} color="#ccc" style={{marginLeft: 'auto', transform: [{rotate: '180deg'}]}} />
                   </TouchableOpacity>

                   {/* 2. Product Matches List (Image + Name + Arrow) */}
                   {filteredProducts.map((item) => (
                      <TouchableOpacity key={item.id} style={styles.suggestionRow} onPress={() => handleProductClick(item)}>
                         <Image source={{ uri: firstImage(item.image) }} style={styles.suggestionImage} />
                         <View style={{flex: 1, marginLeft: 10, justifyContent: 'center'}}>
                            <Text style={styles.suggestionTitle} numberOfLines={1}>{item.name}</Text>
                            {/* Price Removed as per request */}
                         </View>
                         <Icon name="arrow-top-left" size={24} color="#ccc" style={{transform: [{rotate: '180deg'}]}} />
                      </TouchableOpacity>
                   ))}
                   
                   <View style={{height: 300}} /> 
                </View>
              )}
           </View>
        ) : (
          /* --- STATE 2: HOME PAGE (Normal View) --- */
          <View>
             {/* Services */}
            <View style={styles.wrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                {services.map((item) => (
                  <TouchableOpacity key={item.name} style={styles.itemBox} onPress={() => { setActiveTab(item.name); if(item.screen) navigation.navigate(item.screen); }}>
                    <Image source={item.image ? item.image : { uri: 'https://via.placeholder.com/100' }} style={styles.iconImage} />
                    <Text style={[styles.label, item.name === activeTab && styles.labelActive]}>{item.name}</Text>
                    {item.name === activeTab && <View style={styles.activeLine} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <FlatList ref={flatListRef} data={sliderImages} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => <Image source={item} style={styles.bannerImage} />}
              onMomentumScrollEnd={(e) => setActiveIndex(Math.floor(e.nativeEvent.contentOffset.x / width))}
              style={styles.sliderContainer} />

            {!isVehicle && (
              <LinearGradient colors={["#c9e8ff", "#e7f6ff"]} style={styles.gradientCard}>
                <View style={styles.cardLeft}>
                  <Text style={styles.title}>{isStore ? "Store Dashboard" : "Create a Store"}</Text>
                  <TouchableOpacity onPress={() => navigation.navigate(isStore ? 'StoreDashboard' : 'CreateStore')}><Text style={styles.linkText}>{isStore ? "Open Dashboard" : "Register Now"}</Text></TouchableOpacity>
                </View>
                <Image source={require("../assets/shop-register.png")} style={styles.cardImage} resizeMode="contain" />
              </LinearGradient>
            )}
            {!isStore && (
              <LinearGradient colors={["#ffb47a", "#ffdbb0"]} style={styles.gradientCard}>
                <View style={styles.cardLeft}>
                  <Text style={styles.title}>{isVehicle ? "Vehicle Dashboard" : "Vehicle Owner"}</Text>
                  <TouchableOpacity onPress={() => navigation.navigate(isVehicle ? 'VechileDashboard' : 'RegisterVechile')}><Text style={styles.linkText}>{isVehicle ? "Open Dashboard" : "Register Vehicle"}</Text></TouchableOpacity>
                </View>
                <Image source={require("../assets/vechile-register.png")} style={styles.cardImage} resizeMode="contain" />
              </LinearGradient>
            )}

            <View style={styles.cat}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AllCategory')}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
              {categories.map((item, index) => (
                <TouchableOpacity key={index} style={styles.categoryItem} onPress={() => navigation.navigate("ShopPage", { category_id: item.id })}>
                  <View style={styles.categoryCircle}><Image source={item.image ? item.image : { uri: 'https://via.placeholder.com/100' }} style={styles.categoryIcon} /></View>
                  <Text style={styles.categoryText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.cat}>
              <Text style={styles.sectionTitle}>Top Products</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ShopPage')}><Text style={styles.seeAll}>View All</Text></TouchableOpacity>
            </View>
            
            {/* Top Products Grid (Home View) */}
            <View style={styles.productsWrapper}>
  {homeProducts.map((item) => {
    // 1. Calculate Total Quantity for this product (Sum of all variants + base item)
    const totalQty = cart
      .filter((c) => Number(c.product_id) === Number(item.id))
      .reduce((sum, c) => sum + c.qty, 0);

    // 2. Specific Qty for base item (for direct add/minus buttons)
    const baseQty = getQty(item.id, null);
    
    const sellingPrice = getPrice(item);
    const discount = getDiscount(item.market, sellingPrice);
    const hasAttributes = item.attributes?.length > 0;

    return (
      <TouchableOpacity 
        key={item.id} 
        style={styles.card} 
        activeOpacity={0.95} 
        onPress={() => navigation.navigate('ProductDetails', { product_id: item.id })}
      >
        {discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}</Text>
          </View>
        )}
        
       <TouchableOpacity 
  style={styles.wishlistIcon} 
  onPress={() => toggleWishlist(item)}
>
  <Icon 
    name={isInWishlist(item.id) ? "heart" : "heart-outline"} 
    size={20} 
    color={isInWishlist(item.id) ? "red" : "#666"} 
  />
</TouchableOpacity>

        <View style={styles.imageContainer}>
          <Image source={{ uri: firstImage(item.image) }} style={styles.productImage} resizeMode="contain" />
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          
          <View style={styles.priceRow}>
            {sellingPrice > 0 && <Text style={styles.productPrice}>₹{sellingPrice}</Text>}
            {item.market > sellingPrice && <Text style={styles.marketPrice}>₹{item.market}</Text>}
          </View>

          <View style={styles.actionContainer}>
            {hasAttributes ? (
              // CASE 1: Product WITH Attributes -> Show "Select" or "X Added"
              <TouchableOpacity 
                style={[styles.actionBtnOutline, totalQty > 0 && { backgroundColor: '#fff5f5', borderColor: 'red' }]} 
                onPress={() => { setSelectedProduct(item); setShowAttributeModal(true); }}
              >
                <Text style={[styles.actionBtnTextOutline, totalQty > 0 && { color: 'red', fontWeight:'bold' }]}>
                  {totalQty > 0 ? `${totalQty} Added` : "Add +"}
                </Text>
              </TouchableOpacity>
            ) : (
              // CASE 2: Simple Product -> Show ADD or +/- Control
              baseQty === 0 ? (
                <TouchableOpacity style={styles.addBtn} onPress={() => addToCartInitial(item)}>
                  <Text style={styles.addBtnText}>ADD +</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.qtyControl}>
                  <TouchableOpacity onPress={() => updateQty(item.id, null, -1)} style={styles.qtyBox}>
                    <Text style={styles.qtySign}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{baseQty}</Text>
                  <TouchableOpacity onPress={() => updateQty(item.id, null, 1)} style={styles.qtyBox}>
                    <Text style={styles.qtySign}>+</Text>
                  </TouchableOpacity>
                </View>
              )
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  })}
</View>
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Attribute Modal */}
      <Modal visible={showAttributeModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowAttributeModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalBox}>
                <View style={styles.modalHeader}>
                   <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
                   <TouchableOpacity onPress={() => setShowAttributeModal(false)}><Icon name="close" size={24} color="#333"/></TouchableOpacity>
                </View>
                <ScrollView>
                  {selectedProduct?.attributes?.map((attr) => {
                    const qty = getQty(selectedProduct.id, attr.id);
                    return (
                      <View key={attr.id} style={styles.attrCard}>
                        <View style={{flexDirection: 'row', alignItems:'center', flex:1}}>
                           <Image source={{ uri: firstImage(selectedProduct.image) }} style={styles.attrImage} />
                           <View style={{ marginLeft: 12 }}>
                             <Text style={styles.attrName}>{attr.attr_name}</Text>
                             <Text style={styles.attrPrice}>₹{getAttrPrice(attr)}</Text>
                           </View>
                        </View>
                        {qty === 0 ? (
                          <TouchableOpacity style={styles.modalAddBtn} onPress={() => addToCartInitial(selectedProduct, attr)}><Text style={styles.modalAddText}>ADD</Text></TouchableOpacity>
                        ) : (
                          <View style={styles.qtyRowModal}>
                            <TouchableOpacity style={styles.qtyBtnModal} onPress={() => updateQty(selectedProduct.id, attr.id, -1)}><Text style={styles.qtyBtnTextModal}>-</Text></TouchableOpacity>
                            <View style={styles.qtyValueBoxModal}><Text style={styles.qtyValueText}>{qty}</Text></View>
                            <TouchableOpacity style={styles.qtyBtnModal} onPress={() => updateQty(selectedProduct.id, attr.id, 1)}><Text style={styles.qtyBtnTextModal}>+</Text></TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <IconButton icon="home" iconColor="#DA1F49" />
        <IconButton icon="view-grid" onPress={() => navigation.navigate('ShopPage')} />
        <IconButton icon="qrcode-scan" onPress={() => navigation.navigate('ScannerScreen')} />
        <TouchableOpacity onPress={() => navigation.navigate('ViewCart')} style={styles.cartWrapper}>
          <IconButton icon="cart" />
          {cart.length > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cart.length}</Text></View>}
        </TouchableOpacity>
        <IconButton icon="account" onPress={() => navigation.navigate('Profile')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  centerLoad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { backgroundColor: '#fff', paddingBottom: 10, borderBottomWidth: 1, borderColor: '#eee' },
  header: { padding: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flex: 1, paddingRight: 10 },
  addressLabel: { color: '#DA1F49', fontWeight: 'bold', fontSize: 16, marginLeft: 5 },
  addressLine: { color: '#444', fontSize: 13, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  
  // Search Styles
  searchWrapper: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  search: { margin: 0, borderRadius: 8, backgroundColor: '#f0f0f0', elevation: 0, height: 45, width: '100%' },
  historyContainer: { padding: 15 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  historyTitle: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  clearText: { color: 'red', fontSize: 12 },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
  historyText: { marginLeft: 10, fontSize: 14, color: '#444' },

  // Suggestion Styles (Flipkart Model - No Price)
  suggestionRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#f0f0f0', backgroundColor: '#fff' },
  suggestionImage: { width: 40, height: 40, resizeMode: 'contain', marginRight: 10 },
  suggestionTitle: { fontSize: 14, color: '#333', flex: 1, fontWeight: '500' },
  searchIconBox: { width: 40, alignItems: 'center' },
  suggestionText: { fontSize: 15, color: '#444' },

  wrapper: { backgroundColor: "#fff", paddingVertical: 10, marginBottom: 8 },
  row: { paddingHorizontal: 12, alignItems: "center" },
  itemBox: { width: 90, alignItems: "center", marginHorizontal: 6 },
  iconImage: { width: 40, height: 40, marginBottom: 3, resizeMode: "contain" },
  label: { fontSize: 12, color: "#777" },
  labelActive: { color: "#007BFF", fontWeight: "bold" },
  activeLine: { width: "50%", height: 3, backgroundColor: "#007BFF", marginTop: 5, borderRadius: 20 },
  
  sliderContainer: { height: 160, marginBottom: 10 },
  bannerImage: { width: width, height: 160, resizeMode: 'cover' },
  
  gradientCard: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 15, marginHorizontal: 10, marginBottom: 15 },
  cardLeft: { width: "65%" },
  title: { fontSize: 16, fontWeight: "700", color: "#000" },
  linkText: { color: "#0078FF", fontWeight: "700", marginTop: 8 },
  cardImage: { width: 120, height: 120 },
  
  cat: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  seeAll: { color: '#DA1F49', fontWeight: '600', fontSize: 13 },
  
  categories: { paddingLeft: 10, marginBottom: 15 },
  categoryItem: { marginRight: 15, alignItems: "center", width: 70 },
  categoryCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 2, marginBottom: 5 },
  categoryIcon: { width: 35, height: 35, resizeMode: "contain" },
  categoryText: { fontSize: 11, fontWeight: "500", color: "#333", textAlign: "center" },

  // --- Professional Card Styles ---
  productsWrapper: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, justifyContent: 'space-between' },
  card: { 
    width: (width / 2) - 14, 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    marginBottom: 12,
    elevation: 3, 
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
    overflow: 'hidden',
    paddingBottom: 8
  },
  wishlistIcon: { position: 'absolute', top: 8, right: 8, zIndex: 10, backgroundColor: '#fff', borderRadius: 20, padding: 5, elevation: 2 },
  discountBadge: { position: 'absolute', top: 0, left: 0, zIndex: 10, backgroundColor: '#2eb82e', paddingHorizontal: 6, paddingVertical: 2, borderBottomRightRadius: 8 },
  discountText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  
  imageContainer: { height: 140, justifyContent: 'center', alignItems: 'center', padding: 8, backgroundColor: '#fff' },
  productImage: { width: "100%", height: "100%" },
  
  detailsContainer: { paddingHorizontal: 10, paddingVertical: 6 },
  productName: { fontSize: 14, fontWeight: "500", color: "#333", marginBottom: 4 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 8 },
  productPrice: { fontSize: 16, fontWeight: "700", color: "#111", marginRight: 6 },
  marketPrice: { textDecorationLine: "line-through", color: "#999", fontSize: 12 },
  
  actionContainer: { marginTop: 4 },
  addBtn: { borderWidth: 1, borderColor: '#DA1F49', borderRadius: 6, paddingVertical: 6, alignItems: 'center', backgroundColor: '#fff' },
  addBtnText: { color: '#DA1F49', fontWeight: '700', fontSize: 13 },
  actionBtnOutline: { borderWidth: 1, borderColor: '#DA1F49', borderRadius: 6, paddingVertical: 6, alignItems: 'center', backgroundColor: '#fff'},
  actionBtnTextOutline: { color: "#DA1F49", fontWeight: "700", fontSize: 12 },
  
  qtyControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f5f5f5', borderRadius: 6 },
  qtyBox: { width: 32, height: 30, justifyContent: 'center', alignItems: 'center', backgroundColor: '#DA1F49', borderRadius: 6 },
  qtySign: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  qtyText: { fontWeight: '700', color: '#333' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  attrCard: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderColor: '#f5f5f5' },
  attrImage: { width: 45, height: 45, borderRadius: 4 },
  attrName: { fontSize: 14, color: '#333' },
  attrPrice: { fontSize: 14, fontWeight: '700', color: '#000', marginTop: 2 },
  modalAddBtn: { backgroundColor: "#DA1F49", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 4 },
  modalAddText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  qtyRowModal: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#DA1F49", borderRadius: 4, height: 30 },
  qtyBtnModal: { width: 30, justifyContent: 'center', alignItems: 'center' },
  qtyBtnTextModal: { color: "#DA1F49", fontWeight: "bold" },
  qtyValueBoxModal: { width: 30, alignItems: "center", borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#DA1F49' },
  
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee', paddingVertical: 4 },
  cartBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: 'red', borderRadius: 10, paddingHorizontal: 5, minWidth: 18, alignItems:'center' },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' }
});