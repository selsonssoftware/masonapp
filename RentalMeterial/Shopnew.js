import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const CATEGORY_COLUMN_WIDTH = 100;
const CART_STORAGE_KEY = 'materialcart'; 

// --- Mock Data (for fallback) ---
// Note: rmp_category_id must match the 'id' field in the category API response (e.g., '6')
const MATERIALS = [
  { id: '1', rmp_category_id: '6', rmp_name: 'Trowel', rmp_description: 'Standard construction trowel.', rmp_price_day: 150, rmp_price_hour: 20, rmp_rate_type: 'Per Day', rmp_rating: 4, rmp_image: 'https://via.placeholder.com/100/3498db/ffffff?text=TROWEL' },
  { id: '2', rmp_category_id: '7', rmp_name: 'Drill Machine', rmp_description: '750 watt drilling machine.', rmp_price_day: 600, rmp_price_hour: 100, rmp_rate_type: 'Per Day', rmp_rating: 5, rmp_image: 'https://masonshop.in/public/uploads/Rental_Material/product/1743664074_67ee33cadfa5e.png' },
  { id: '3', rmp_category_id: '6', rmp_name: 'Bucket', rmp_description: '20L plastic bucket.', rmp_price_day: 50, rmp_price_hour: 10, rmp_rate_type: 'Per Day', rmp_rating: 3, rmp_image: 'https://via.placeholder.com/100/3498db/ffffff?text=BUCKET' },
  { id: '4', rmp_category_id: '7', rmp_name: 'Jigsaw', rmp_description: 'Electric handheld Jigsaw.', rmp_price_day: 450, rmp_price_hour: 80, rmp_rate_type: 'Per Day', rmp_rating: 4, rmp_image: 'https://via.placeholder.com/100/2ecc71/ffffff?text=JIGSAW' },
];

// =================================================================
// --- PRODUCT QUICK VIEW MODAL COMPONENT (SIMPLIFIED) ---
// =================================================================
 

const ProductQuickViewModal = ({ isVisible, onClose, product, addToCart, navigation }) => {
  if (!product) return null;

  const rentPriceDay = Number(product.rmp_price_day || 0);
  const rentPriceHour = Number(product.rmp_price_hour || 0);
  
  // --- CORRECTED: Define necessary product properties for the handler ---
  const productId = product.id || product.rmp_id;
  const productName = product.rmp_name || product.name;
  // ----------------------------------------------------------------------


  const handleAddToCart = useCallback(async () => {
    
    const rentalDetails = {
      // Use the correctly mapped and defined properties
      productId: productId, 
      productName: productName,
      productImage: product.rmp_image || product.image,
      
      rmp_price_day: rentPriceDay, 
      rmp_price_hour: rentPriceHour,

      quantity: 1, 
      // --- CORRECTED: Include missing fields from full cart structure ---
      
    };

   const added = await addToCart(rentalDetails);

    if (added) {
        Alert.alert(
            "Item Added", 
            `${productName} was added to your cart.`,
            [{ text: "Go to Cart", onPress: () => navigation.navigate('CartScreen') }, { text: "OK" }]
        );
    } else {
         Alert.alert(
            "Already in Cart", 
            `${productName} is already present in your cart.`,
            [{ text: "Go to Cart", onPress: () => navigation.navigate('CartScreen') }, { text: "OK" }]
        );
    }
    onClose();
    
    // --- CORRECTED DEPENDENCY ARRAY ---
    // Ensure all variables used inside useCallback are listed, including the newly defined ones.
  }, [product, rentPriceDay, rentPriceHour, addToCart, navigation, onClose, productId, productName]); 
  // ----------------------------------

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Modal Header */}
            <View style={modalStyles.headerRow}>
              <Text style={modalStyles.modalTitle}>{product.rmp_name || product.name}</Text>
              <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                <Ionicons name="close-circle-outline" size={30} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Product Info */}
            <View style={modalStyles.productInfoContainer}>
              <Image
                source={{ uri: product.rmp_image || product.image }}
                style={modalStyles.productImage}
                resizeMode="contain"
              />
              <View style={modalStyles.productText}>
                <Text style={modalStyles.productDesc}>{product.rmp_description || "No description provided."}</Text>
                
                {/* Display Base Prices */}
                <View style={modalStyles.priceRow}>
                  <Text style={modalStyles.priceText}>Day Rate: ₹{rentPriceDay.toFixed(2)}</Text>
                  <Text style={modalStyles.priceText}>Hour Rate: ₹{rentPriceHour.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            <Text style={modalStyles.subTitle}>Select quantity and duration on the Cart screen.</Text>

          </ScrollView>

          {/* Footer/Action Button */}
          <TouchableOpacity
            style={modalStyles.rentNowBtn}
            onPress={handleAddToCart}
          >
            <Text style={modalStyles.rentNowBtnText}>ADD TO CART (QTY: 1)</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 10 }} />
          </TouchableOpacity>
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

  // States
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Holds ALL fetched products
  const [loading, setLoading] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState([]);

  const routeCatId = route.params?.cat_id;
  
  // --- Bottom Navigation Component ---
  const BottomNav = ({ navigation }) => {
    return (
      <View style={styles.bottomNavContainer}>
        {/* HOME */}
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("MeterialHome")}>
          <Ionicons name="home" size={22} color="#404040" />
          <Text style={styles.navBtnText}>Home</Text>
        </TouchableOpacity>
  
        {/* CATEGORIES */}
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("MeterialShop")}>
          <Ionicons name="grid-outline" size={22} color="#404040" />
          <Text style={styles.navBtnText}>Meterial</Text>
        </TouchableOpacity>
  
        {/* BOOKING */}
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("MyBooking")}>
          <Ionicons name="calendar-outline" size={22} color="#404040" />
          <Text style={styles.navBtnText}>Booking</Text>
        </TouchableOpacity>
  
        {/* WISHLIST */}
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("WhisleList")}>
          <Ionicons name="bookmark-outline" size={22} color="#404040" />
          <Text style={styles.navBtnText}>Wishlist</Text>
        </TouchableOpacity>
      </View>
    );
  };
  // --- End Bottom Navigation ---

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const saved = await AsyncStorage.getItem(CART_STORAGE_KEY);
        const items = saved ? JSON.parse(saved) : [];
        setCartItems(items);
      } catch (err) {
        console.log("Error loading cart on mount:", err);
      }
    };
    loadCart();
  }, []);

  // Function to add item to cart (stores in AsyncStorage and updates state)
  const addToCart = useCallback(async (itemDetails) => {
    try {
      const existing = await AsyncStorage.getItem(CART_STORAGE_KEY);
      let cart = existing ? JSON.parse(existing) : [];

      const newItem = {
        ...itemDetails,
        cartItemId: `${itemDetails.productId}_${Date.now()}`
      };

      cart.push(newItem);

      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));

      // Update local state
      setCartItems(cart);
    } catch (error) {
      console.log("Error saving to materialcart:", error);
      Alert.alert("Error", "Failed to add item to cart.");
    }
  }, []);

  const handleProductClick = useCallback((productItem) => {
    setSelectedProduct(productItem);
    setModalVisible(true);
  }, []);

  // --- Data Fetching ---

  const fetchCategories = async () => {
    try {
      const res = await fetch("https://masonshop.in/api/rental-material-categories");
      const json = await res.json();
      
      let apiCats = [];

      if (json?.status && Array.isArray(json.Rental_Material_categories)) {
        // Map API categories: Use 'id' from API and ensure it's a string
        apiCats = json.Rental_Material_categories.map(cat => ({
            ...cat,
            // Use 'id' as the unique key for comparison
            id: cat.id ? cat.id.toString() : Math.random().toString(), 
        }));
      }

      // Create the 'All' category object
      const allCat = { 
          id: "all", 
          rmc_name: "All", 
          rmc_image: "https://via.placeholder.com/30/000000/fff?text=ALL" 
      };
      
      // Set the state with 'All' first, followed by API categories
      setCategories([allCat, ...apiCats]);

    } catch (err) {
      console.error("Category Fetch Error:", err);
      // Fallback: only 'All' category
      setCategories([{ id: "all", rmc_name: "All", rmc_image: "https://via.placeholder.com/30/000000/fff?text=ALL" }]);
    }
  };


  // FETCH ALL PRODUCTS ONCE
  const fetchAllProducts = async () => {
    // This API should ideally return all products when no category ID is passed.
    const url = "https://masonshop.in/api/rent_mat_product_api"; 

    try {
      setLoading(true);
      const res = await fetch(url);
      const json = await res.json();

      let fetchedProducts = [];
      if (json?.status && Array.isArray(json.Rental_Material_products)) {
        fetchedProducts = json.Rental_Material_products;
      } else if (json?.status && Array.isArray(json.Rental_Material_product)) {
        // Handle case where product array might be named differently
        fetchedProducts = json.Rental_Material_product;
      }
      
      const finalProducts = (fetchedProducts.length > 0 ? fetchedProducts : MATERIALS).map(p => ({
        ...p, 
        id: p.id ? p.id.toString() : p.rmp_id.toString(),
        // Ensure rmp_category_id is also a string for comparison
        rmp_category_id: p.rmp_category_id ? p.rmp_category_id.toString() : undefined 
      }));

      setAllProducts(finalProducts); 
    } catch (err) {
      console.error("Products Fetch Error:", err);
      setAllProducts(MATERIALS.map(p => ({...p, rmp_category_id: p.rmp_category_id.toString()}))); 
    } finally {
      setLoading(false);
    }
  };

  // --- Effects ---
  
  // 1. Initial Load: Fetch categories, fetch ALL products, and set initial active category.
  useEffect(() => {
    fetchCategories();
    fetchAllProducts(); 
    
    // Set initial category from route param if present
    const initialCategoryId = routeCatId ? routeCatId.toString() : 'all';
    setActiveCategoryId(initialCategoryId);
  }, []); 


  // --- Filtering Logic (Client-Side Category & Search) ---
  
  // 1. Filter by Category (Client-Side)
  const categoryFilteredProducts = useMemo(() => {
    if (activeCategoryId === 'all') {
      return allProducts; // Show all products
    }
    
    // Filter the full list based on the active category ID (string comparison)
    return allProducts.filter(product => 
      product.rmp_category_id === activeCategoryId
    );
  }, [allProducts, activeCategoryId]); // Re-calculates when the full list or category changes

  
  // 2. Filter the result by Search Term
  const filteredProducts = useMemo(() => {
    if (searchTerm.length === 0) {
      return categoryFilteredProducts; // Return list filtered by category only
    }

    const lowerCaseSearch = searchTerm.toLowerCase();

    // Filter the category-filtered list using the search term
    return categoryFilteredProducts.filter(product => {
      const productName = (product.rmp_name || product.name || '').toLowerCase();
      const productDesc = (product.rmp_description || '').toLowerCase();
      
      return productName.includes(lowerCaseSearch) || productDesc.includes(lowerCaseSearch); 
    });
  }, [categoryFilteredProducts, searchTerm]); // Re-calculates when category filter or search term changes


  // --- Handlers ---
  const handleCategoryPress = (categoryId) => {
    // This updates the state, triggering the useMemo filters.
    setActiveCategoryId(categoryId.toString());
    setSearchTerm(''); // Clear search when switching categories
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // --- Render Helpers ---
  const renderStars = (rating) => {
    const numRating = Math.max(0, Math.min(5, Math.round(Number(rating))));
    return (
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {[...Array(5)].map((_, i) => (
          <Ionicons
            key={i}
            name={i < numRating ? "star" : "star-outline"}
            size={12}
            color="#f1c40f"
          />
        ))}
      </View>
    );
  };

  const renderProductItem = ({ item }) => (
    <View style={styles.productCard}>
      <TouchableOpacity style={styles.favoriteButton}>
        <Ionicons name="heart-outline" size={20} color="#999" />
      </TouchableOpacity>

      <Image
        source={{ uri: item.rmp_image || item.image }}
        style={styles.productImage}
        resizeMode="contain"
      />

      <Text style={styles.productName}>{item.rmp_name || item.name}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.productPrice}>₹ {item.rmp_price_day || 'N/A'}</Text>
        <Text style={styles.rateType}>/Day</Text>
      </View>

      {renderStars(item.rmp_rating || 0)}

      <TouchableOpacity
        style={styles.rentBtn}
        onPress={() => handleProductClick(item)}
      >
        <Text style={styles.rentBtnText}>add rent cart</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCategoryItem = ({ item }) => {
    // Uses the mapped 'id' field for reliable comparison
    const itemId = item.id?.toString(); 
    if (!itemId) return null;

    const isActive = itemId === activeCategoryId;

    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          isActive && styles.activeCategoryItem
        ]}
        onPress={() => handleCategoryPress(itemId)} 
      >
        <View style={[styles.categoryIconBox, isActive && styles.activeCategoryIconBox]}>
          <Image
            source={{ uri: item.rmc_image }}
            style={styles.categoryImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.categoryLabel}>{item.rmc_name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* --- Header/Search Bar --- */}
      <View style={styles.header}>
        <Text style={styles.allTitle}>Shop</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#999" style={{ marginRight: 8 }} />
          <TextInput
            placeholder='Search products...'
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close" size={20} color="#333" />
            </TouchableOpacity>
          )}
        </View>
        {/* --- Cart Icon with Count --- */}
        <TouchableOpacity
          style={styles.cartIconContainer}
          onPress={() => navigation.navigate('CartScreen')} 
        >
          <Ionicons name="cart-outline" size={26} color="#333" />
          {cartItems.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* --- Main Content Area (Categories + Products) --- */}
      <View style={styles.contentArea}>

        {/* Left: Vertical Categories List - Filter Menu */}
        <View style={styles.categoryColumn}>
          <FlatList
            data={categories}
            keyExtractor={item => item.id || Math.random().toString()}
            showsVerticalScrollIndicator={false}
            renderItem={renderCategoryItem}
          />
        </View>

        {/* Right: Product Grid (Filtered/Searched Content) */}
        <View style={styles.productGridColumn}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3498db" />
              <Text style={{ marginTop: 10 }}>Loading Products...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts} 
              keyExtractor={item => item.id || Math.random().toString()}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={styles.row}
              renderItem={renderProductItem}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchTerm.length > 0
                      ? `No results found for "${searchTerm}" in this category.`
                      : "No products found in this category."}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
        
      </View>

      {/* --- Product Modal Render --- */}
      {selectedProduct && (
        <ProductQuickViewModal
          isVisible={modalVisible}
          onClose={() => setModalVisible(false)}
          product={selectedProduct}
          addToCart={addToCart}
          navigation={navigation}
        />
      )}
      
       <BottomNav navigation={navigation} />
    </SafeAreaView>
  );
};

// =================================================================
// --- STYLES ---
// (No changes to styles, kept as is)
// =================================================================

const modalStyles = StyleSheet.create({
  centeredView: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
      width: '100%',
      maxHeight: height * 0.5, 
      backgroundColor: 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
  },
  headerRow: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      paddingBottom: 10,
  },
  modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
  },
  closeButton: {
      padding: 5,
  },
  productInfoContainer: {
      width: '100%',
      flexDirection: 'row',
      marginBottom: 20,
      alignItems: 'center',
  },
  productImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginRight: 15,
      borderWidth: 1,
      borderColor: '#ddd'
  },
  productText: {
      flex: 1,
  },
  productDesc: {
      fontSize: 14,
      color: '#666',
      marginBottom: 10,
  },
  priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 5,
  },
  priceText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#2ecc71',
  },
  subTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#e74c3c',
      width: '100%',
      paddingVertical: 10,
      textAlign: 'center',
  },
  rentNowBtn: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#3498db',
      padding: 15,
      borderRadius: 10,
      marginTop: 10,
  },
  rentNowBtnText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical:50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  allTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 15,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    marginRight: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 0,
  },
  cartIconContainer: { 
    padding: 5,
    position: 'relative', 
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contentArea: {
    flex: 1,
    flexDirection: 'row',
  },
  categoryColumn: {
    width: CATEGORY_COLUMN_WIDTH,
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  categoryItem: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  activeCategoryItem: {
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  categoryIconBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F7FA',
    marginBottom: 5,
    overflow: 'hidden',
  },
  activeCategoryIconBox: {
    backgroundColor: '#3498db',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  productGridColumn: {
    flex: 1,
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  productCard: {
    width: (width - CATEGORY_COLUMN_WIDTH - 30) / 2,
    height: 250,
    backgroundColor: '#FFF',
    borderRadius: 10,
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  productImage: {
    width: '80%',
    height: 80,
    marginBottom: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rateType: {
    fontSize: 10,
    color: '#666',
    marginLeft: 3,
  },
  rentBtn: {
    marginTop: 10,
    backgroundColor: '#3498db', 
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  rentBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  // Bottom Nav Styles
  bottomNavContainer: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  navBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnText: {
    fontSize: 10,
    color: '#404040',
    marginTop: 4,
  },
});

export default ProductListingScreen;




import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Range Date Picker from react-native-paper-dates
import { DatePickerModal } from 'react-native-paper-dates';

const { width, height } = Dimensions.get('window');
const CATEGORY_COLUMN_WIDTH = 100;

// --- Mock Data (for fallback) ---
const MATERIALS = [
  { id: '1', rmp_category_id: 1, rmp_name: 'Trowel', rmp_description: 'Standard construction trowel.', rmp_price_day: 150, rmp_price_hour: 20, rmp_rate_type: 'Per Day', rmp_rating: 4, rmp_image: 'https://via.placeholder.com/100/3498db/ffffff?text=TROWEL' },
  { id: '2', rmp_category_id: 2, rmp_name: 'Drill Machine', rmp_description: '750 watt drilling machine.', rmp_price_day: 600, rmp_price_hour: 100, rmp_rate_type: 'Per Day', rmp_rating: 5, rmp_image: 'https://masonshop.in/public/uploads/Rental_Material/product/1743664074_67ee33cadfa5e.png' },
];

// =================================================================
// --- PRODUCT QUICK VIEW MODAL COMPONENT (with Range Date Picker)
// =================================================================

const ProductQuickViewModal = ({ isVisible, onClose, product, addToCart }) => {
  if (!product) return null;

  // Range date state (startDate & endDate are JS Date objects)
  const [range, setRange] = useState({ startDate: null, endDate: null });
  const [openRangePicker, setOpenRangePicker] = useState(false);

  const [isHourly, setIsHourly] = useState(false);
  const [hours, setHours] = useState('1');
  const [calculatedAmount, setCalculatedAmount] = useState(0);

  const rentPriceDay = Number(product.rmp_price_day || 0);
  const rentPriceHour = Number(product.rmp_price_hour || 0);

  // Reset modal state when opened/closed or product changes
  useEffect(() => {
    if (isVisible) {
      setRange({ startDate: null, endDate: null });
      setOpenRangePicker(false);
      setIsHourly(false);
      setHours('1');
      setCalculatedAmount(0);
    }
  }, [isVisible, product]);

  // Calculate days between two dates (count at least 1 day)
  const calculateDaysDifference = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const diffMs = e - s;
    const oneDay = 24 * 60 * 60 * 1000;
    const days = Math.ceil(diffMs / oneDay);
    return days > 0 ? days : 1;
  };

  // Recalculate amount whenever inputs change
  useEffect(() => {
    let price = 0;
    if (isHourly) {
      const h = Number(hours) || 0;
      price = h * rentPriceHour;
    } else {
      const days = calculateDaysDifference(range.startDate, range.endDate);
      price = days * rentPriceDay;
    }
    setCalculatedAmount(price);
  }, [range, isHourly, hours, rentPriceDay, rentPriceHour]);

  // handle adding to AsyncStorage via the addToCart prop
  const handleAddToCart = async () => {
    if (!isHourly && (!range.startDate || !range.endDate)) {
      Alert.alert("Error", "Please select a valid date range.");
      return;
    }
    if (calculatedAmount <= 0) {
      Alert.alert("Error", "Calculated amount should be greater than zero.");
      return;
    }


    const rentalDetails = {
      productId: product.id || product.rmp_id,
      productName: product.rmp_name || product.name,
      productImage: product.rmp_image || product.image,
      durationType: isHourly ? 'Hourly' : 'Daily',
      duration: isHourly ? Number(hours) : calculateDaysDifference(range.startDate, range.endDate),
      amount: calculatedAmount,
      dateRange: isHourly ? null : { from: range.startDate, to: range.endDate },
      unitPrice: isHourly ? rentPriceHour : rentPriceDay,
    };

    // call the parent addToCart which will handle AsyncStorage and state
    await addToCart(rentalDetails);

    Alert.alert("Success", `${product.rmp_name} added to your cart for ₹${calculatedAmount.toFixed(2)}.`);
    onClose();
  };

  return (
    <>
      {/* Range DatePickerModal */}
      <DatePickerModal
        locale="en"
        mode="range"
        visible={openRangePicker}
        onDismiss={() => setOpenRangePicker(false)}
        startDate={range.startDate}
        endDate={range.endDate}
        onConfirm={({ startDate, endDate }) => {
          setRange({ startDate, endDate });
          setOpenRangePicker(false);
        }}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={onClose}
      >
        <View style={modalStyles.centeredView}>
          <View style={modalStyles.modalView}>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Modal Header */}
              <View style={modalStyles.headerRow}>
                <Text style={modalStyles.modalTitle}>{product.rmp_name || product.name}</Text>
                <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                  <Ionicons name="close-circle-outline" size={30} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Product Info */}
              <View style={modalStyles.productInfoContainer}>
                <Image
                  source={{ uri: product.rmp_image || product.image }}
                  style={modalStyles.productImage}
                  resizeMode="contain"
                />
                <View style={modalStyles.productText}>
                  <Text style={modalStyles.productDesc}>{product.rmp_description || "No description provided."}</Text>
                  <View style={modalStyles.priceRow}>
                    <Text style={modalStyles.priceText}>Day Rate: ₹{rentPriceDay}</Text>
                    <Text style={modalStyles.priceText}>Hour Rate: ₹{rentPriceHour}</Text>
                  </View>
                </View>
              </View>

              <Text style={modalStyles.subTitle}>Select Rental Period</Text>

              {/* Rental Type Switch */}
              <View style={modalStyles.switchContainer}>
                <TouchableOpacity
                  style={[modalStyles.switchBtn, !isHourly && modalStyles.activeSwitchBtn]}
                  onPress={() => setIsHourly(false)}
                >
                  <Text style={[modalStyles.switchText, !isHourly && modalStyles.activeSwitchText]}>By Day</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modalStyles.switchBtn, isHourly && modalStyles.activeSwitchBtn]}
                  onPress={() => setIsHourly(true)}
                >
                  <Text style={[modalStyles.switchText, isHourly && modalStyles.activeSwitchText]}>By Hour</Text>
                </TouchableOpacity>
              </View>

              {/* Date/Hour Input */}
              {!isHourly ? (
                <View style={{ width: '100%', marginBottom: 10 }}>
                  <TouchableOpacity style={modalStyles.dateInput} onPress={() => setOpenRangePicker(true)}>
                    <Ionicons name="calendar-outline" size={20} color="#3498db" />
                    <Text style={modalStyles.dateText}>
                      {range.startDate && range.endDate
                        ? `${range.startDate.toDateString()} → ${range.endDate.toDateString()}`
                        : 'Select rental date range'}
                    </Text>
                  </TouchableOpacity>
                  {range.startDate && range.endDate && (
                    <Text style={{ marginTop: 6, color: '#666', fontSize: 13 }}>
                      {calculateDaysDifference(range.startDate, range.endDate)} day(s)
                    </Text>
                  )}
                </View>
              ) : (
                <View style={modalStyles.hourContainer}>
                  <TextInput
                    style={modalStyles.hourInput}
                    keyboardType="numeric"
                    value={hours}
                    onChangeText={(text) => setHours(text.replace(/[^0-9]/g, ''))}
                    placeholder="Enter hours"
                  />
                  <Text style={modalStyles.hourLabel}>Hours @ ₹{rentPriceHour}/hr</Text>
                </View>
              )}

              {/* Amount Calculation */}
              <View style={modalStyles.amountContainer}>
                <Text style={modalStyles.amountLabel}>Calculated Rent Amount:</Text>
                <Text style={modalStyles.finalAmountText}>₹{calculatedAmount.toFixed(2)}</Text>
                {!isHourly && range.startDate && range.endDate && calculatedAmount > 0 && (
                  <Text style={modalStyles.rentalDurationText}>
                    ({calculateDaysDifference(range.startDate, range.endDate)} Day(s) @ ₹{rentPriceDay}/Day)
                  </Text>
                )}
              </View>
            </ScrollView>

            {/* Footer/Action Button */}
            <TouchableOpacity
              style={[modalStyles.rentNowBtn, calculatedAmount <= 0 && { backgroundColor: '#ccc' }]}
              onPress={handleAddToCart}
              disabled={calculatedAmount <= 0}
            >
              <Text style={modalStyles.rentNowBtnText}>ADD TO RENT NOW</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

// =================================================================
// --- PRODUCT LISTING SCREEN ---
// =================================================================

const ProductListingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // States
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState([]);

  const routeCatId = route.params?.cat_id;



    const BottomNav = ({ navigation }) => {
      return (
        <View style={styles.bottomNavContainer}>
          {/* HOME */}
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("MeterialHome")}>
            <Ionicons name="home" size={22} color="#404040" />
            <Text style={styles.navBtnText}>Home</Text>
          </TouchableOpacity>
    
          {/* CATEGORIES */}
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("MeterialShop")}>
            <Ionicons name="grid-outline" size={22} color="#404040" />
            <Text style={styles.navBtnText}>Meterial</Text>
          </TouchableOpacity>
    
          {/* BOOKING */}
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("MyBooking")}>
            <Ionicons name="calendar-outline" size={22} color="#404040" />
            <Text style={styles.navBtnText}>Booking</Text>
          </TouchableOpacity>
    
          {/* WISHLIST */}
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("WhisleList")}>
            <Ionicons name="bookmark-outline" size={22} color="#404040" />
            <Text style={styles.navBtnText}>Wishlist</Text>
          </TouchableOpacity>
        </View>
      );
    };

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const saved = await AsyncStorage.getItem('materialcart');
        const items = saved ? JSON.parse(saved) : [];
        setCartItems(items);
      } catch (err) {
        console.log("Error loading cart on mount:", err);
      }
    };
    loadCart();
  }, []);

  // Function to add item to cart (stores in AsyncStorage and updates state)
  const addToCart = useCallback(async (itemDetails) => {
    try {
      const existing = await AsyncStorage.getItem('materialcart');
      let cart = existing ? JSON.parse(existing) : [];

      const newItem = {
        ...itemDetails,
        cartItemId: `${itemDetails.productId}_${Date.now()}`
      };

      cart.push(newItem);

      await AsyncStorage.setItem('materialcart', JSON.stringify(cart));

      // Update local state
      setCartItems(cart);
    } catch (error) {
      console.log("Error saving to materialcart:", error);
      Alert.alert("Error", "Failed to add item to cart.");
    }
  }, []);

  const handleProductClick = useCallback((productItem) => {
    setSelectedProduct(productItem);
    setModalVisible(true);
  }, []);

  // --- Data Fetching ---

  const fetchCategories = async () => {
    try {
      const res = await fetch("https://masonshop.in/api/rental-material-categories");
      const json = await res.json();
      let apiCats = [];
      if (json?.status && Array.isArray(json.Rental_Material_categories)) {
        apiCats = json.Rental_Material_categories;
      }
      const allCat = { rmc_id: "all", rmc_name: "All", rmc_image: "https://via.placeholder.com/30/000000/fff?text=ALL" };
      setCategories([allCat, ...apiCats]);
    } catch (err) {
      console.error("Category Fetch Error:", err);
      setCategories([{ rmc_id: "all", rmc_name: "All", rmc_image: "https://via.placeholder.com/30/000000/fff?text=ALL" }]);
    }
  };

  const fetchProducts = async (categoryId) => {
    let url = "https://masonshop.in/api/rent_mat_product_api";

    if (categoryId && categoryId !== 'all') {
      url = `https://masonshop.in/api/rental-material-products?rmp_category_id=${categoryId}`;
    }

    try {
      setLoading(true);
      const res = await fetch(url);
      const json = await res.json();

      let fetchedProducts = [];
      if (json?.status && Array.isArray(json.Rental_Material_products)) {
        fetchedProducts = json.Rental_Material_products;
      } else if (json?.status && Array.isArray(json.Rental_Material_product)) {
        fetchedProducts = json.Rental_Material_product;
      }

      setProducts(fetchedProducts.length > 0 ? fetchedProducts : MATERIALS);
    } catch (err) {
      console.error("Products Fetch Error:", err);
      setProducts(MATERIALS);
    } finally {
      setLoading(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    fetchCategories();
    fetchProducts(routeCatId || 'all');
  }, []);

  useEffect(() => {
    if (routeCatId) {
      const id = routeCatId.toString();
      setActiveCategoryId(id);
      fetchProducts(id);
    }
  }, [routeCatId]);

  useEffect(() => {
    if (activeCategoryId) {
      fetchProducts(activeCategoryId);
    }
  }, [activeCategoryId]);

  // --- Filtering Logic (Search Only) ---
  const filteredProducts = useMemo(() => {
    if (searchTerm.length === 0) {
      return products;
    }

    const lowerCaseSearch = searchTerm.toLowerCase();

    return products.filter(product => {
      const productName = (product.rmp_name || product.name || '').toLowerCase();
      return productName.includes(lowerCaseSearch);
    });
  }, [products, searchTerm]);

  // --- Handlers ---
  const handleCategoryPress = (categoryId) => {
    setActiveCategoryId(categoryId.toString());
    setSearchTerm('');
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // --- Render Helpers ---
  const renderStars = (rating) => {
    const numRating = Math.max(0, Math.min(5, Math.round(Number(rating))));
    return (
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {[...Array(5)].map((_, i) => (
          <Ionicons
            key={i}
            name={i < numRating ? "star" : "star-outline"}
            size={12}
            color="#f1c40f"
          />
        ))}
      </View>
    );
  };

  const renderProductItem = ({ item }) => (
    <View style={styles.productCard}>
      <TouchableOpacity style={styles.favoriteButton}>
        <Ionicons name="heart-outline" size={20} color="#999" />
      </TouchableOpacity>

      <Image
        source={{ uri: item.rmp_image || item.image }}
        style={styles.productImage}
        resizeMode="contain"
      />

      <Text style={styles.productName}>{item.rmp_name || item.name}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.productPrice}>₹ {item.rmp_price_day || 'N/A'}</Text>
        <Text style={styles.rateType}>/Day</Text>
      </View>

      {renderStars(item.rmp_rating || 0)}

      <TouchableOpacity
        style={styles.rentBtn}
        onPress={() => handleProductClick(item)}
      >
        <Text style={styles.rentBtnText}>add rent cart</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCategoryItem = ({ item }) => {
    const itemId = item.rmc_id ? item.rmc_id.toString() : item.id?.toString();
    if (!itemId) return null;

    const isActive = itemId === activeCategoryId;

    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          isActive && styles.activeCategoryItem
        ]}
        onPress={() => handleCategoryPress(itemId)}
      >
        <View style={[styles.categoryIconBox, isActive && styles.activeCategoryIconBox]}>
          <Image
            source={{ uri: item.rmc_image }}
            style={styles.categoryImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.categoryLabel}>{item.rmc_name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* --- Header/Search Bar --- */}
      <View style={styles.header}>
        <Text style={styles.allTitle}>Shop</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#999" style={{ marginRight: 8 }} />
          <TextInput
            placeholder='Search products...'
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close" size={20} color="#333" />
            </TouchableOpacity>
          )}
        </View>
        {/* --- Cart Icon with Count --- */}
        <TouchableOpacity
          style={styles.cartIconContainer}
          onPress={() => navigation.navigate('CartScreen')} // CartScreen reads from AsyncStorage
        >
          <Ionicons name="cart-outline" size={26} color="#333" />
          {cartItems.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* --- Main Content Area (Categories + Products) --- */}
      <View style={styles.contentArea}>

        {/* Left: Vertical Categories List */}
        <View style={styles.categoryColumn}>
          <FlatList
            data={categories}
            keyExtractor={item => (item.rmc_id || item.id)?.toString() || Math.random().toString()}
            showsVerticalScrollIndicator={false}
            renderItem={renderCategoryItem}
          />
        </View>

        {/* Right: Product Grid */}
        <View style={styles.productGridColumn}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3498db" />
              <Text style={{ marginTop: 10 }}>Loading Products...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={item => (item.id)?.toString() || Math.random().toString()}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={styles.row}
              renderItem={renderProductItem}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchTerm.length > 0
                      ? `No results found for "${searchTerm}" in this category.`
                      : "No products found."}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
        
      </View>

      {/* --- Product Modal Render --- */}
      <ProductQuickViewModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        product={selectedProduct}
        addToCart={addToCart}
      />
      
       <BottomNav navigation={navigation} />
    </SafeAreaView>
    
  );
};

// =================================================================
// --- STYLES ---
// (unchanged from your design, only minor layout kept)
// =================================================================

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '100%',
    maxHeight: height * 0.85,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  productInfoContainer: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  productText: {
    flex: 1,
  },
  productDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    width: '100%',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  switchContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 20,
    padding: 4,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeSwitchBtn: {
    backgroundColor: '#3498db',
  },
  switchText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activeSwitchText: {
    color: '#FFF',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  dateInput: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
  },
  dateText: {
    marginLeft: 10,
    color: '#333',
  },
  hourContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  hourInput: {
    width: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    textAlign: 'center',
    marginRight: 10,
    height: 40,
  },
  hourLabel: {
    fontSize: 16,
    color: '#666',
  },
  amountContainer: {
    width: '100%',
    padding: 15,
    backgroundColor: '#E0F7FA',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  amountLabel: {
    fontSize: 14,
    color: '#333',
  },
  finalAmountText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3498db',
    marginTop: 5,
  },
  rentalDurationText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  rentNowBtn: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  rentNowBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 50,
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  allTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 15,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    marginRight: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 0,
  },
  cartIconContainer: {
    padding: 5,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contentArea: {
    flex: 1,
    flexDirection: 'row',
  },
  categoryColumn: {
    width: CATEGORY_COLUMN_WIDTH,
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  categoryItem: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  activeCategoryItem: {
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  categoryIconBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F7FA',
    marginBottom: 5,
    overflow: 'hidden',
  },
  activeCategoryIconBox: {
    backgroundColor: '#3498db',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  productGridColumn: {
    flex: 1,
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  productCard: {
    width: (width - CATEGORY_COLUMN_WIDTH - 30) / 2,
    height: 250,
    backgroundColor: '#FFF',
    borderRadius: 10,
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  productImage: {
    width: '80%',
    height: 80,
    marginBottom: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rateType: {
    fontSize: 10,
    color: '#666',
    marginLeft: 3,
  },
  rentBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 20,
  },
  rentBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3498db',
  },
  bottomNavContainer: {
  position: "absolute",
  bottom: 20,
  left: 20,
  right: 20,
  height: 70,
  backgroundColor: "#FFFFFF",
  borderRadius: 40,
  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "center",
  elevation: 10,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
},

navBtn: {
  alignItems: "center",
  justifyContent: "center",
},

navBtnText: {
  fontSize: 11,
  color: "#555",
  marginTop: 4,
},
});

export default ProductListingScreen;
