import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ToastAndroid,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useIsFocused, useNavigation } from "@react-navigation/native";

const WISHLIST_KEY = "wishlist";
const CART_KEY = "cart";
const PRIMARY_COLOR = "#DA1F49";
const { width } = Dimensions.get("window");

export default function WishlistScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  
  const [wishlist, setWishlist] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAttrModal, setShowAttrModal] = useState(false);

  useEffect(() => {
    if (isFocused) loadWishlist();
  }, [isFocused]);

  const loadWishlist = async () => {
    try {
      const stored = await AsyncStorage.getItem(WISHLIST_KEY);
      if (stored) setWishlist(JSON.parse(stored));
    } catch (e) { console.log(e); }
  };

  const removeFromWishlist = async (id) => {
    const updated = wishlist.filter((item) => item.id !== id);
    setWishlist(updated);
    await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
    ToastAndroid.show("Removed", ToastAndroid.SHORT);
  };

  // --- LOGIC FIX: CHECK PRICE BEFORE ADDING ---
  const handleMoveToCartClick = (item) => {
    // 1. Check if product has variants (Attributes)
    if (item.attributes && item.attributes.length > 0) {
        setSelectedProduct(item);
        setShowAttrModal(true);
        return;
    }

    // 2. Check if Price is Valid (Prevents 0 Price Add)
    const price = Number(item.selling || item.price || 0);
    
    if (price <= 0) {
        // If price is 0, it means data is incomplete or it requires selection.
        // Redirect to Details page instead of adding garbage to cart.
        ToastAndroid.show("Please select options", ToastAndroid.SHORT);
        navigation.navigate("ProductDetails", { product_id: item.id });
    } else {
        // Valid simple product, add directly
        executeAddToCart(item, null);
    }
  };

  const executeAddToCart = async (product, attribute) => {
    try {
        const storedCart = await AsyncStorage.getItem(CART_KEY);
        let cart = storedCart ? JSON.parse(storedCart) : [];

        const pid = product.id;
        const aid = attribute ? attribute.id : null;
        
        // Ensure we get a valid number for price
        const finalPrice = Number(attribute ? (attribute.selling || attribute.price) : (product.selling || product.price || 0));

        if (finalPrice <= 0) {
             ToastAndroid.show("Error: Price unavailable", ToastAndroid.SHORT);
             return;
        }

        const exists = cart.find(c => Number(c.product_id) === Number(pid) && c.attribute_id === aid);

        if (exists) {
            exists.qty += 1;
        } else {
            const newItem = {
                product_id: pid,
                attribute_id: aid,
                attribute_name: attribute ? attribute.attr_name : null,
                name: product.name,
                price: finalPrice,
                image: Array.isArray(product.image) ? product.image[0] : (String(product.image).split(',')[0]),
                qty: 1
            };
            cart.push(newItem);
        }

        await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart));
        ToastAndroid.show("Moved to Cart", ToastAndroid.SHORT);
        removeFromWishlist(pid);
        setShowAttrModal(false);

    } catch (e) {
        console.log("Error moving to cart", e);
    }
  };

  const firstImg = (img) => Array.isArray(img) ? img[0] : (String(img).split(',')[0]);
  const getAttrPrice = (attr) => attr.selling || attr.price;

  const renderItem = ({ item }) => {
    const price = Number(item.selling || item.price || 0);
    
    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        style={styles.card} 
        onPress={() => navigation.navigate("ProductDetails", { product_id: item.id })}
      >
        <Image source={{ uri: firstImg(item.image) }} style={styles.image} resizeMode="contain" />
        
        <View style={styles.details}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          
          {/* Show Price or 'View Details' if 0 */}
          {price > 0 ? (
             <Text style={styles.price}>₹{price.toFixed(2)}</Text>
          ) : (
             <Text style={styles.viewDetailsText}>View Details for Price</Text>
          )}
          
          <TouchableOpacity style={styles.cartBtn} onPress={() => handleMoveToCartClick(item)}>
            <Text style={styles.cartBtnText}>MOVE TO CART</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.deleteBtn} onPress={() => removeFromWishlist(item.id)}>
            <Icon name="delete-outline" size={24} color="#999" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>My Wishlist ({wishlist.length})</Text>
        <View style={{width: 24}} /> 
      </View>

      {wishlist.length === 0 ? (
        <View style={styles.emptyContainer}>
            <Icon name="heart-broken" size={60} color="#ddd" />
            <Text style={styles.emptyText}>Your wishlist is empty</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate("ShopPage")}>
                <Text style={styles.shopBtnText}>Start Shopping</Text>
            </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Attribute Selection Modal */}
      <Modal visible={showAttrModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowAttrModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalBox}>
                <View style={styles.modalHeader}>
                    <View style={styles.modalTitleContainer}>
                        <Image source={{ uri: selectedProduct ? firstImg(selectedProduct.image) : '' }} style={styles.modalProductImg} />
                        <Text style={styles.modalTitle} numberOfLines={2}>{selectedProduct?.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowAttrModal(false)}>
                        <Icon name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.modalSubTitle}>Select Option:</Text>

                <ScrollView style={{maxHeight: 250}}>
                  {selectedProduct?.attributes?.map((attr) => (
                      <View key={attr.id} style={styles.attrRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.attrName}>{attr.attr_name}</Text>
                            <Text style={styles.attrPrice}>₹{getAttrPrice(attr)}</Text>
                        </View>
                        <TouchableOpacity style={styles.modalAddBtn} onPress={() => executeAddToCart(selectedProduct, attr)}>
                            <Text style={styles.modalAddText}>ADD</Text>
                        </TouchableOpacity>
                      </View>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" ,paddingVertical:50},
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', elevation: 2 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  list: { padding: 10 },
  
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, padding: 12, elevation: 2, alignItems:'center' },
  image: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f0f0f0' },
  details: { flex: 1, marginLeft: 15 },
  name: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  price: { fontSize: 16, fontWeight: 'bold', color: PRIMARY_COLOR, marginBottom: 10 },
  viewDetailsText: { fontSize: 12, color: '#f39c12', marginBottom: 10, fontWeight: '600' },
  
  cartBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: PRIMARY_COLOR, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, alignSelf: 'flex-start' },
  cartBtnText: { color: PRIMARY_COLOR, fontSize: 11, fontWeight: 'bold' },
  deleteBtn: { padding: 10 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -50 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 15, marginBottom: 20 },
  shopBtn: { backgroundColor: PRIMARY_COLOR, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  shopBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#fff", paddingBottom: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  modalTitleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  modalProductImg: { width: 40, height: 40, borderRadius: 4, marginRight: 10, backgroundColor: '#f0f0f0' },
  modalTitle: { fontSize: 14, fontWeight: "bold", color: '#333', flex: 1 },
  modalSubTitle: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 5, fontSize: 14, color: '#666', fontWeight:'600' },
  attrRow: { flexDirection: "row", alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: "#f5f5f5" },
  attrName: { fontWeight: "600", color: '#333', fontSize: 15 },
  attrPrice: { color: PRIMARY_COLOR, fontWeight: 'bold', fontSize: 13, marginTop: 2 },
  modalAddBtn: { backgroundColor: PRIMARY_COLOR, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 4 },
  modalAddText: { color: "#fff", fontWeight: 'bold', fontSize: 12 }
});