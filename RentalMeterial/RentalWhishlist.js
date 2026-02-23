import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  SafeAreaView, StatusBar, FlatList, ActivityIndicator, Alert, Platform
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient();
const CART_STORAGE_KEY = 'materialcart'; 
const WISHLIST_STORAGE_KEY = 'material_wishlist'; 

// =================================================================
// --- API FETCHERS ---
// =================================================================

const fetchCartItems = async () => {
  const saved = await AsyncStorage.getItem(CART_STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

const fetchWishlistItems = async () => {
  const saved = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

// =================================================================
// --- WISHLIST SCREEN COMPONENT ---
// =================================================================

const WishlistScreen = () => {
  const navigation = useNavigation();
  const qClient = useQueryClient();

  // --- React Query Fetching ---
  const { data: cartItems = [], refetch: refetchCart } = useQuery({ queryKey: ['cartData'], queryFn: fetchCartItems });
  const { data: wishlistItems = [], isLoading, refetch: refetchWishlist } = useQuery({ queryKey: ['wishlistData'], queryFn: fetchWishlistItems });

  // Refetch data every time screen opens
  useFocusEffect(useCallback(() => { 
    refetchCart(); 
    refetchWishlist();
  }, [refetchCart, refetchWishlist]));

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

  // --- MUTATION: REMOVE FROM WISHLIST ---
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId) => {
      const existing = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      let wishlist = existing ? JSON.parse(existing) : [];
      
      const updatedWishlist = wishlist.filter(item => (item.id || item.rmp_id) !== productId);
      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updatedWishlist));
      return updatedWishlist;
    },
    onSuccess: () => qClient.invalidateQueries({ queryKey: ['wishlistData'] })
  });

  // --- ACTIONS ---
  const handleRemove = (product) => {
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from your wishlist?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", onPress: () => removeFromWishlistMutation.mutate(product.id || product.rmp_id), style: 'destructive' }
      ]
    );
  };

  const handleMoveToCart = async (product) => {
    const productId = product.id || product.rmp_id;
    const rentalDetails = {
      productId: productId, 
      productName: product.rmp_name || product.name,
      productImage: product.rmp_image || product.image,
      rmp_price_day: Number(product.rmp_price_day || 0), 
      rmp_price_hour: Number(product.rmp_price_hour || 0),
      quantity: 1, 
    };

    try {
      await addToCartMutation.mutateAsync(rentalDetails);
      // If success, remove from wishlist automatically
      removeFromWishlistMutation.mutate(productId);
      Alert.alert("Success", `${product.rmp_name} moved to Cart.`);
    } catch (error) {
      if (error.message === "ALREADY_EXISTS") {
        // If it's already in the cart, just remove it from the wishlist to clean up
        removeFromWishlistMutation.mutate(productId);
        Alert.alert("Notice", `${product.rmp_name} was already in your Cart. Removed from wishlist.`);
      } else {
        Alert.alert("Error", "Failed to move item to cart.");
      }
    }
  };

  // --- RENDER HELPERS ---
  const renderWishlistItem = ({ item }) => (
    <View style={styles.wishlistCard}>
      <Image source={{ uri: item.rmp_image || item.image }} style={styles.productImage} resizeMode="contain" />
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.rmp_name || item.name}</Text>
        <Text style={styles.productPrice}>₹ {item.rmp_price_day || '0'} / Day</Text>
        
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.moveToCartBtn} onPress={() => handleMoveToCart(item)}>
            <Ionicons name="cart-outline" size={16} color="#FFF" style={{marginRight: 5}} />
            <Text style={styles.moveToCartText}>MOVE TO CART</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item)}>
            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4a90e2" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5, marginRight: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wishlist</Text>
        </View>
        
        <TouchableOpacity style={styles.cartIconContainer} onPress={() => navigation.navigate('CartScreen')}>
          <Ionicons name="cart-outline" size={26} color="#FFF" />
          {cartItems.length > 0 && (
            <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartItems.length}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {/* LIST CONTENT */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          keyExtractor={item => (item.id || item.rmp_id).toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={renderWishlistItem}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="heart-dislike-outline" size={60} color="#ccc" />
              </View>
              <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
              <Text style={styles.emptySubText}>Save items you want to rent later.</Text>
              <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('MeterialShop')}>
                <Text style={styles.shopBtnText}>BROWSE MATERIALS</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

// Root Wrapper
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WishlistScreen />
    </QueryClientProvider>
  );
}

// =================================================================
// --- STYLES ---
// =================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', paddingTop: Platform.OS === 'ios' ? 0 : 30 },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#4a90e2', paddingHorizontal: 15, paddingVertical: 15, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  cartIconContainer: { padding: 5, position: 'relative' },
  cartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#e74c3c', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', padding: 2 },
  cartBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  // List
  listContainer: { padding: 15, paddingBottom: 50 },
  wishlistCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  productImage: { width: 90, height: 90, borderRadius: 8, backgroundColor: '#f5f5f5', marginRight: 15, borderWidth: 1, borderColor: '#eee' },
  productInfo: { flex: 1, justifyContent: 'center' },
  productName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 5 },
  productPrice: { fontSize: 15, fontWeight: 'bold', color: '#27ae60', marginBottom: 12 },
  
  // Actions
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moveToCartBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4a90e2', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, flex: 1, justifyContent: 'center', marginRight: 10 },
  moveToCartText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  removeBtn: { backgroundColor: '#fcecec', padding: 8, borderRadius: 20, width: 35, height: 35, alignItems: 'center', justifyContent: 'center' },

  // Empty State
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: '15%' }, // <-- FIX: Changed to percentage string
  emptyIconBg: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  emptySubText: { fontSize: 14, color: '#777', marginBottom: 30 },
  shopBtn: { backgroundColor: '#4a90e2', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, elevation: 3 },
  shopBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
});