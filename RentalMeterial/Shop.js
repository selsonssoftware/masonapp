import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, Image, TouchableOpacity,
  SafeAreaView, StatusBar, Dimensions, FlatList, ActivityIndicator,
  Modal, ScrollView, Alert, Keyboard, Platform
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient();
const { width, height } = Dimensions.get('window');

// --- Layout Calculation for Split Screen ---
const LEFT_SIDEBAR_WIDTH = width * 0.25; 
const RIGHT_CONTENT_WIDTH = width * 0.75;
const CARD_WIDTH = (RIGHT_CONTENT_WIDTH - 30) / 2; // 30 is total horizontal padding

const CART_STORAGE_KEY = 'materialcart'; 
const WISHLIST_STORAGE_KEY = 'material_wishlist'; 

// --- Mock Data ---
const MATERIALS = [
  { id: '1', rmp_category_id: '6', rmp_name: 'Trowel', rmp_description: 'Standard construction trowel.', rmp_price_day: 150, rmp_price_hour: 20, rmp_rate_type: 'Per Day', rmp_rating: 4, rmp_image: 'https://via.placeholder.com/100/3498db/ffffff?text=TROWEL' },
  { id: '2', rmp_category_id: '7', rmp_name: 'Drill Machine', rmp_description: '750 watt drilling machine.', rmp_price_day: 600, rmp_price_hour: 100, rmp_rate_type: 'Per Day', rmp_rating: 5, rmp_image: 'https://masonshop.in/public/uploads/Rental_Material/product/1743664074_67ee33cadfa5e.png' },
];

// =================================================================
// --- API FETCHERS FOR REACT QUERY ---
// =================================================================

const fetchCategories = async () => {
  const res = await fetch("https://masonshop.in/api/rental-material-categories");
  const json = await res.json();
  const allCat = { id: "all", rmc_name: "All", rmc_image: "https://cdn-icons-png.flaticon.com/512/731/731962.png" }; // Better fallback icon
  
  let apiCats = [];
  if (json?.status && Array.isArray(json.Rental_Material_categories)) {
    apiCats = json.Rental_Material_categories.map(cat => ({
        ...cat,
        id: cat.id ? cat.id.toString() : Math.random().toString(), 
    }));
  }
  return [allCat, ...apiCats];
};

const fetchAllProducts = async () => {
  const res = await fetch("https://masonshop.in/api/rent_mat_product_api");
  const json = await res.json();

  let fetchedProducts = [];
  if (json?.status && Array.isArray(json.Rental_Material_products)) {
    fetchedProducts = json.Rental_Material_products;
  } else if (json?.status && Array.isArray(json.Rental_Material_product)) {
    fetchedProducts = json.Rental_Material_product;
  }
  
  return (fetchedProducts.length > 0 ? fetchedProducts : MATERIALS).map(p => ({
    ...p, 
    id: p.id ? p.id.toString() : p.rmp_id?.toString(),
    rmp_category_id: p.rmp_category_id ? p.rmp_category_id.toString() : undefined 
  }));
};

const fetchCartItems = async () => {
  const saved = await AsyncStorage.getItem(CART_STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

const fetchWishlistItems = async () => {
  const saved = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

// =================================================================
// --- MODALS ---
// =================================================================

const ProductQuickViewModal = ({ isVisible, onClose, product, addToCart, navigation }) => {
  if (!product) return null;

  const rentPriceDay = Number(product.rmp_price_day || 0);
  const rentPriceHour = Number(product.rmp_price_hour || 0);
  const productId = product.id || product.rmp_id;
  const productName = product.rmp_name || product.name;

  const handleAddToCart = useCallback(async () => {
    const rentalDetails = {
      productId: productId, 
      productName: productName,
      productImage: product.rmp_image || product.image,
      rmp_price_day: rentPriceDay, 
      rmp_price_hour: rentPriceHour,
      quantity: 1, 
    };

    const status = await addToCart(rentalDetails);

    if (status === 'SUCCESS') {
        Alert.alert("Item Added", `${productName} was added to your cart.`,
            [{ text: "Go to Cart", onPress: () => { onClose(); navigation.navigate('CartScreen'); } }, { text: "OK", onPress: onClose }]
        );
    } else if (status === 'EXISTS') {
        Alert.alert("Already in Cart", `${productName} is already in your cart!`,
            [{ text: "Go to Cart", onPress: () => { onClose(); navigation.navigate('CartScreen'); } }, { text: "OK", onPress: onClose }]
        );
    }
  }, [product, rentPriceDay, rentPriceHour, addToCart, navigation, onClose, productId, productName]); 

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={modalStyles.headerRow}>
              <Text style={modalStyles.modalTitle}>{product.rmp_name || product.name}</Text>
              <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                <Ionicons name="close-circle-outline" size={30} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.productInfoContainer}>
              <Image source={{ uri: product.rmp_image || product.image }} style={modalStyles.productImage} resizeMode="contain" />
              <View style={modalStyles.productText}>
                <Text style={modalStyles.productDesc}>{product.rmp_description || "No description provided."}</Text>
                <View style={modalStyles.priceRow}>
                  <Text style={modalStyles.priceText}>Day: ₹{rentPriceDay.toFixed(2)}</Text>
                  <Text style={modalStyles.priceText}>Hour: ₹{rentPriceHour.toFixed(2)}</Text>
                </View>
              </View>
            </View>
            <Text style={modalStyles.subTitle}>Select quantity and duration on the Cart screen.</Text>
          </ScrollView>

          <TouchableOpacity style={modalStyles.rentNowBtn} onPress={handleAddToCart}>
            <Text style={modalStyles.rentNowBtnText}>ADD TO CART (QTY: 1)</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 10 }} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const WishlistModal = ({ isVisible, onClose, wishlistItems, onMoveToCart, onRemove }) => {
  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={modalStyles.centeredView}>
        <View style={[modalStyles.modalView, { height: height * 0.75 }]}>
          <View style={modalStyles.headerRow}>
            <Text style={modalStyles.modalTitle}>My Wishlist ({wishlistItems.length})</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <Ionicons name="close-circle-outline" size={30} color="#666" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={wishlistItems}
            keyExtractor={item => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={<Text style={modalStyles.emptyText}>Your wishlist is empty.</Text>}
            renderItem={({ item }) => (
              <View style={styles.wishlistItem}>
                <Image source={{ uri: item.rmp_image }} style={styles.wishlistImage} resizeMode="contain" />
                <View style={styles.wishlistInfo}>
                  <Text style={styles.wishlistName} numberOfLines={2}>{item.rmp_name}</Text>
                  <Text style={styles.wishlistPrice}>₹{item.rmp_price_day} / Day</Text>
                  
                  <View style={styles.wishlistActions}>
                    <TouchableOpacity style={styles.moveToCartBtn} onPress={() => onMoveToCart(item)}>
                      <Text style={styles.moveToCartText}>MOVE TO CART</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeWishlistBtn} onPress={() => onRemove(item)}>
                      <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

// =================================================================
// --- PRODUCT LISTING SCREEN (MAIN COMPONENT) ---
// =================================================================

const ProductListingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const qClient = useQueryClient();

  // Local UI States
  const [modalVisible, setModalVisible] = useState(false);
  const [wishlistModalVisible, setWishlistModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(route.params?.cat_id?.toString() || 'all');
  
  // Flipkart-Style Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [filteredSearchResults, setFilteredSearchResults] = useState([]);
  const [history, setHistory] = useState([]);

  // --- React Query Data Fetching ---
  const { data: categories = [], isLoading: catLoading } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const { data: allProducts = [], isLoading: prodLoading } = useQuery({ queryKey: ['products'], queryFn: fetchAllProducts });
  const { data: cartItems = [], refetch: refetchCart } = useQuery({ queryKey: ['cartData'], queryFn: fetchCartItems });
  const { data: wishlistItems = [], refetch: refetchWishlist } = useQuery({ queryKey: ['wishlistData'], queryFn: fetchWishlistItems });

  useFocusEffect(useCallback(() => { 
    refetchCart(); 
    refetchWishlist();
    loadHistory();
  }, [refetchCart, refetchWishlist]));

  const loadHistory = async () => {
    const saved = await AsyncStorage.getItem('search_history');
    if (saved) setHistory(JSON.parse(saved));
  };

  // --- MUTATION: ADD TO CART ---
  const addToCartMutation = useMutation({
    mutationFn: async (itemDetails) => {
      const existing = await AsyncStorage.getItem(CART_STORAGE_KEY);
      let cart = existing ? JSON.parse(existing) : [];

      const alreadyExists = cart.some(item => item.productId === itemDetails.productId);
      if (alreadyExists) throw new Error("ALREADY_EXISTS");

      const newItem = { ...itemDetails, cartItemId: `${itemDetails.productId}_${Date.now()}` };
      cart.push(newItem);
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      return cart;
    },
    onSuccess: () => qClient.invalidateQueries({ queryKey: ['cartData'] })
  });

  const addToCart = useCallback(async (itemDetails) => {
    try {
      await addToCartMutation.mutateAsync(itemDetails);
      return 'SUCCESS';
    } catch (error) {
      if (error.message === "ALREADY_EXISTS") return 'EXISTS';
      Alert.alert("Error", "Failed to add item to cart.");
      return 'ERROR';
    }
  }, [addToCartMutation]);

  // --- MUTATION: TOGGLE WISHLIST ---
  const toggleWishlistMutation = useMutation({
    mutationFn: async (product) => {
      const existing = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      let wishlist = existing ? JSON.parse(existing) : [];
      
      const existsIndex = wishlist.findIndex(item => item.id === product.id);
      if (existsIndex > -1) {
        wishlist.splice(existsIndex, 1);
      } else {
        wishlist.push(product);
      }
      
      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
      return wishlist;
    },
    onSuccess: () => qClient.invalidateQueries({ queryKey: ['wishlistData'] })
  });

  const handleMoveToCart = async (product) => {
    const rentalDetails = {
      productId: product.id || product.rmp_id, 
      productName: product.rmp_name || product.name,
      productImage: product.rmp_image || product.image,
      rmp_price_day: Number(product.rmp_price_day || 0), 
      rmp_price_hour: Number(product.rmp_price_hour || 0),
      quantity: 1, 
    };

    const status = await addToCart(rentalDetails);
    
    if (status === 'SUCCESS' || status === 'EXISTS') {
      toggleWishlistMutation.mutate(product);
      if (status === 'SUCCESS') Alert.alert("Success", `${product.rmp_name} moved to Cart.`);
      if (status === 'EXISTS') Alert.alert("Notice", `${product.rmp_name} was already in your Cart.`);
    }
  };

  const handleProductClick = useCallback((productItem) => {
    setSelectedProduct(productItem);
    setModalVisible(true);
  }, []);

  const categoryFilteredProducts = useMemo(() => {
    if (activeCategoryId === 'all') return allProducts;
    return allProducts.filter(product => product.rmp_category_id === activeCategoryId);
  }, [allProducts, activeCategoryId]); 

  // --- SEARCH LOGIC ---
  const handleSearch = (text) => {
    setSearchTerm(text);
    if (text.trim().length > 0) {
      const filtered = allProducts.filter(item => 
        (item.rmp_name || item.name || '').toLowerCase().includes(text.toLowerCase())
      );
      setFilteredSearchResults(filtered);
      setShowResults(true);
    } else {
      setShowResults(history.length > 0);
    }
  };

  const onSelectSearchResult = async (item) => {
    const newHistory = [item, ...history.filter(h => h.id !== item.id)].slice(0, 5);
    setHistory(newHistory);
    await AsyncStorage.setItem('search_history', JSON.stringify(newHistory));
    
    setShowResults(false);
    setSearchTerm('');
    Keyboard.dismiss();
    
    handleProductClick(item);
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem('search_history');
    setShowResults(false);
  };

  const BottomNav = () => (
    <View style={styles.bottomNavContainer}>
      <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("MeterialHome")}>
        <Ionicons name="home" size={22} color="#404040" />
        <Text style={styles.navBtnText}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("MeterialShop")}>
        <Ionicons name="grid-outline" size={22} color="#4a90e2" />
        <Text style={[styles.navBtnText, {color: '#4a90e2', fontWeight: 'bold'}]}>Material</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("MyBooking")}>
        <Ionicons name="calendar-outline" size={22} color="#404040" />
        <Text style={styles.navBtnText}>Booking</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cartIconContainer} onPress={() => navigation.navigate('CartScreen')}>
        <Ionicons name="cart-outline" size={26} color="#333" />
        <Text style={styles.navBtnText}>Cart</Text>
        {cartItems.length > 0 && (
          <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartItems.length}</Text></View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStars = (rating) => {
    const numRating = Math.max(0, Math.min(5, Math.round(Number(rating))));
    return (
      <View style={styles.starsContainer}>
        {[...Array(5)].map((_, i) => (
          <Ionicons key={i} name={i < numRating ? "star" : "star-outline"} size={10} color="#f1c40f" />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4a90e2" />

      {/* FIXED TOP SECTION */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.allTitle}>Shop Materials</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={[styles.cartIconContainer, {marginRight: 10}]} onPress={() => navigation.navigate('WhisleList')}>
              <Ionicons name="heart-outline" size={26} color="#FFF" />
              {wishlistItems.length > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{wishlistItems.length}</Text></View>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cartIconContainer} onPress={() => navigation.navigate('CartScreen')}>
              <Ionicons name="cart-outline" size={26} color="#FFF" />
              {cartItems.length > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartItems.length}</Text></View>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" style={{ marginRight: 8 }} />
          <TextInput 
            placeholder='Search products...' 
            style={styles.searchInput} 
            value={searchTerm} 
            onChangeText={handleSearch}
            onFocus={() => (history.length > 0 || searchTerm !== '') && setShowResults(true)} 
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => {setSearchTerm(''); setShowResults(history.length > 0);}}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* SEARCH OVERLAY */}
      {showResults && (
        <View style={styles.searchResultsOverlay}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>{searchTerm === '' ? 'RECENT SEARCHES' : `RESULTS FOR "${searchTerm.toUpperCase()}"`}</Text>
            {searchTerm === '' && history.length > 0 && (
              <TouchableOpacity onPress={clearHistory}><Text style={styles.clearText}>Clear</Text></TouchableOpacity>
            )}
          </View>
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={searchTerm === '' ? history : filteredSearchResults}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultItem} onPress={() => onSelectSearchResult(item)}>
                <View style={styles.searchIconBg}>
                  {searchTerm === '' ? <Ionicons name="time-outline" size={20} color="#999" /> : <Image source={{ uri: item.rmp_image }} style={styles.searchThumbnail} />}
                </View>
                <View style={styles.searchTextContainer}>
                  <Text style={styles.resultText} numberOfLines={1}>{item.rmp_name}</Text>
                </View>
                <Ionicons name="arrow-up-left" size={18} color="#ccc" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.noResult}>No materials match your search.</Text>}
          />
          <TouchableOpacity style={styles.closeSearchBtn} onPress={() => setShowResults(false)}>
              <Text style={styles.closeSearchText}>Close Search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ========================================================= */}
      {/* INSTAMART STYLE SPLIT LAYOUT */}
      {/* ========================================================= */}
      <View style={styles.splitLayoutContainer}>
        
        {/* LEFT SIDEBAR - CATEGORIES */}
        <View style={styles.leftSidebar}>
            {catLoading ? <ActivityIndicator color="#4a90e2" style={{marginTop: 20}} /> : (
                <FlatList
                    data={categories}
                    keyExtractor={item => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    renderItem={({ item }) => {
                        const isActive = item.id.toString() === activeCategoryId;
                        return (
                            <TouchableOpacity 
                                style={[styles.sidebarItem, isActive && styles.sidebarItemActive]} 
                                onPress={() => { setActiveCategoryId(item.id.toString()); setShowResults(false); }}
                            >
                                <View style={[styles.sidebarImageBg, isActive && styles.sidebarImageBgActive]}>
                                    <Image 
                                        source={{ uri: item.rmc_image || 'https://cdn-icons-png.flaticon.com/512/731/731962.png' }} 
                                        style={styles.sidebarImage} 
                                        resizeMode="contain" 
                                    />
                                </View>
                                <Text style={[styles.sidebarText, isActive && styles.sidebarTextActive]} numberOfLines={2}>
                                    {item.rmc_name}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </View>

        {/* RIGHT CONTENT - PRODUCTS GRID */}
        <View style={styles.rightContent}>
            {prodLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3498db" />
                    <Text style={{ marginTop: 10 }}>Loading...</Text>
                </View>
            ) : (
                <FlatList
                    data={categoryFilteredProducts} 
                    keyExtractor={item => item.id.toString()}
                    numColumns={2}
                    showsVerticalScrollIndicator={false}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 120, paddingTop: 10 }}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No products found.</Text>
                        </View>
                    )}
                    renderItem={({ item }) => {
                        const isWished = wishlistItems.some(w => w.id === item.id);
                        return (
                            <View style={styles.productCard}>
                                <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleWishlistMutation.mutate(item)}>
                                    <Ionicons name={isWished ? "heart" : "heart-outline"} size={20} color={isWished ? "#e74c3c" : "#ccc"} />
                                </TouchableOpacity>
                                
                                <Image source={{ uri: item.rmp_image || item.image }} style={styles.productImage} resizeMode="contain" />
                                
                                <Text style={styles.productName} numberOfLines={2}>{item.rmp_name || item.name}</Text>
                                <View style={styles.priceRow}>
                                    <Text style={styles.productPrice}>₹{item.rmp_price_day || '0'}</Text>
                                    <Text style={styles.rateType}>/Day</Text>
                                </View>
                                
                                {renderStars(item.rmp_rating || 4)}
                                
                                <TouchableOpacity style={styles.rentBtn} onPress={() => handleProductClick(item)}>
                                    <Text style={styles.rentBtnText}>ADD</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    }}
                />
            )}
        </View>

      </View>

      <ProductQuickViewModal isVisible={modalVisible} onClose={() => setModalVisible(false)} product={selectedProduct} addToCart={addToCart} navigation={navigation} />
      <WishlistModal isVisible={wishlistModalVisible} onClose={() => setWishlistModalVisible(false)} wishlistItems={wishlistItems} onMoveToCart={handleMoveToCart} onRemove={(item) => toggleWishlistMutation.mutate(item)} />
      
      <BottomNav />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProductListingScreen />
    </QueryClientProvider>
  );
}

// =================================================================
// --- STYLES ---
// =================================================================

const modalStyles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalView: { width: '100%', maxHeight: height * 0.5, backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  headerRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  closeButton: { padding: 5 },
  productInfoContainer: { width: '100%', flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
  productImage: { width: 80, height: 80, borderRadius: 8, marginRight: 15, borderWidth: 1, borderColor: '#ddd' },
  productText: { flex: 1 },
  productDesc: { fontSize: 14, color: '#666', marginBottom: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 5 },
  priceText: { fontSize: 15, fontWeight: '600', color: '#2ecc71' },
  subTitle: { fontSize: 14, fontWeight: '600', color: '#e74c3c', width: '100%', paddingVertical: 10, textAlign: 'center' },
  rentNowBtn: { width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#3498db', padding: 15, borderRadius: 10, marginTop: 10 },
  rentNowBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 50, fontSize: 16 }
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: Platform.OS === 'ios' ? 0 : 0 },
  
  // Header section
  fixedHeader: { backgroundColor: '#4a90e2', paddingBottom: 15, zIndex: 100 ,paddingVertical:30},
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10 },
  allTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, marginHorizontal: 15, paddingHorizontal: 10, height: 45 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },
  cartIconContainer: { padding: 5, position: 'relative' },
  cartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#e74c3c', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', padding: 2 },
  cartBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  // Flipkart Search Overlay
  searchResultsOverlay: { position: 'absolute', top: 120, left: 15, right: 15, backgroundColor: '#FFF', borderRadius: 8, zIndex: 999, maxHeight: 350, elevation: 15, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, overflow: 'hidden' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderBottomColor: '#eee' },
  historyTitle: { fontSize: 11, color: '#777', fontWeight: 'bold' },
  clearText: { fontSize: 11, color: '#e74c3c', fontWeight: 'bold' },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  searchIconBg: { width: 35, height: 35, backgroundColor: '#f0f0f0', borderRadius: 5, justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  searchThumbnail: { width: 35, height: 35, resizeMode: 'cover' },
  searchTextContainer: { flex: 1 },
  resultText: { fontSize: 14, color: '#333', fontWeight: '500' },
  noResult: { padding: 30, textAlign: 'center', color: '#999', fontSize: 14 },
  closeSearchBtn: { padding: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fafafa' },
  closeSearchText: { color: '#4a90e2', fontWeight: 'bold', fontSize: 13 },

  // --- SPLIT LAYOUT ---
  splitLayoutContainer: { flex: 1, flexDirection: 'row' },
  
  // LEFT SIDEBAR
  leftSidebar: { width: LEFT_SIDEBAR_WIDTH, backgroundColor: '#f0f4f8', borderRightWidth: 1, borderColor: '#e0e0e0' },
  sidebarItem: { paddingVertical: 15, paddingHorizontal: 5, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  sidebarItemActive: { backgroundColor: '#FFF', borderLeftWidth: 4, borderLeftColor: '#4a90e2' },
  sidebarImageBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  sidebarImageBgActive: { borderWidth: 1, borderColor: '#4a90e2' },
  sidebarImage: { width: 30, height: 30 },
  sidebarText: { fontSize: 11, textAlign: 'center', color: '#555' },
  sidebarTextActive: { fontWeight: 'bold', color: '#4a90e2' },

  // RIGHT CONTENT
  rightContent: { width: RIGHT_CONTENT_WIDTH, backgroundColor: '#FFF' },
  row: { justifyContent: 'space-between', marginBottom: 10 },
  
  // Right Content Product Card
  productCard: { width: CARD_WIDTH, backgroundColor: '#FFF', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#f0f0f0', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  favoriteButton: { position: 'absolute', top: 8, right: 8, zIndex: 1, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 15, padding: 2 },
  productImage: { width: '100%', height: 90, marginBottom: 8 },
  productName: { fontSize: 12, fontWeight: 'bold', color: '#333', minHeight: 32 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  productPrice: { fontSize: 14, fontWeight: 'bold', color: '#27ae60' },
  rateType: { fontSize: 10, color: '#7f8c8d', marginLeft: 2 },
  starsContainer: { flexDirection: 'row', marginVertical: 4 },
  rentBtn: { marginTop: 6, backgroundColor: '#f0f8ff', borderWidth: 1, borderColor: '#4a90e2', borderRadius: 6, paddingVertical: 6, alignItems: 'center' },
  rentBtnText: { fontSize: 11, fontWeight: 'bold', color: '#4a90e2' },

  // Utilities & Modals
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center' },
  
  wishlistItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
  wishlistImage: { width: 60, height: 60, borderRadius: 8, borderWidth: 1, borderColor: '#eee', marginRight: 15 },
  wishlistInfo: { flex: 1 },
  wishlistName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 5 },
  wishlistPrice: { fontSize: 14, color: '#27ae60', fontWeight: 'bold', marginBottom: 10 },
  wishlistActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moveToCartBtn: { backgroundColor: '#3498db', paddingVertical: 6, paddingHorizontal: 15, borderRadius: 15 },
  moveToCartText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  removeWishlistBtn: { padding: 5, backgroundColor: '#fcecec', borderRadius: 15, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },

  // Bottom Nav
  bottomNavContainer: { position: "absolute", bottom: 20, left: 10, right: 10, height: 70, backgroundColor: "#FFFFFF", borderRadius: 30, flexDirection: "row", justifyContent: "space-around", alignItems: "center", elevation: 10, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  navBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navBtnText: { fontSize: 10, color: '#404040', marginTop: 4 },
});