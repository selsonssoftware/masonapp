import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery } from '@tanstack/react-query';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';

// --- Constants ---
const CART_KEY = "cart";
const PRIMARY_COLOR = "#DA1F49"; 
const { width: screenWidth } = Dimensions.get("window");

// --- API Fetchers ---
const fetchProductDetails = async ({ queryKey }) => {
  const [_, id] = queryKey;
  if (!id) throw new Error("Product ID is missing");
  
  const res = await fetch(`https://masonshop.in/api/products_get?id=${id}`);
  const json = await res.json();
  
  if (json.success && json.data) {
    return json.data;
  }
  throw new Error("Product not found");
};

const fetchSimilarProducts = async () => {
  const res = await fetch("https://masonshop.in/api/product_api");
  const json = await res.json();
  return json.status ? (json.data || []) : [];
};

const fetchMembership = async ({ queryKey }) => {
  const [_, userId] = queryKey;
  const res = await fetch(`https://masonshop.in/api/check_subscription?user_id=${userId}`);
  return await res.json();
};

// --- Helper Functions ---
const firstImg = (img) => {
  if (!img) return "https://via.placeholder.com/200/cccccc/000000?text=No+Image";
  return Array.isArray(img) ? String(img[0]).trim() : String(img).split(",")[0].trim();
};

const sanitizeHTML = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').trim();
};

export default function ProductDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  
  const [currentProductId, setCurrentProductId] = useState(route.params?.product_id);
  const [userId, setUserId] = useState(null);

  // --- Local State ---
  const [cart, setCart] = useState([]);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  
  // --- CAROUSEL STATE ---
  const [activeIndex, setActiveIndex] = useState(0);
  const slideRef = useRef(null);

  // --- 1. Load User ID ---
  useEffect(() => {
    const loadUser = async () => {
      const id = await AsyncStorage.getItem("user_id") || "M0001";
      setUserId(id);
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (route.params?.product_id) {
        setCurrentProductId(route.params.product_id);
        setActiveIndex(0); 
    }
  }, [route.params?.product_id]);

  // --- 2. React Query Hooks ---
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['productDetails', currentProductId],
    queryFn: fetchProductDetails,
    enabled: !!currentProductId, 
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['similarProducts'],
    queryFn: fetchSimilarProducts,
    staleTime: 1000 * 60 * 10,
  });

  const { data: membership } = useQuery({
    queryKey: ['membership', userId],
    queryFn: fetchMembership,
    enabled: !!userId,
  });

  // --- 3. Process Images & Auto Scroll ---
  const images = useMemo(() => {
    if (!product?.image) return [];
    return Array.isArray(product.image) 
        ? product.image 
        : String(product.image).split(",").map(img => img.trim()).filter(img => img);
  }, [product]);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
        let nextIndex = activeIndex + 1;
        if (nextIndex >= images.length) nextIndex = 0;
        slideRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        setActiveIndex(nextIndex);
    }, 3000); 
    return () => clearInterval(interval);
  }, [activeIndex, images.length]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index);
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const onThumbnailPress = (index) => {
      slideRef.current?.scrollToIndex({ index, animated: true });
      setActiveIndex(index);
  };

  // --- 4. Cart & Pricing Logic ---
  useEffect(() => {
    if (product && product.attributes && product.attributes.length > 0) {
      setSelectedAttribute(product.attributes[0]);
    } else {
      setSelectedAttribute(null);
    }
    loadCart();
  }, [product]);

  const loadCart = async () => {
    try {
      const raw = await AsyncStorage.getItem(CART_KEY);
      setCart(raw ? JSON.parse(raw) : []);
    } catch (e) { setCart([]); }
  };

  const saveCart = async (newCart) => {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(newCart));
    setCart(newCart);
  };

  const getUserType = () => membership?.data?.subscription_name || null;

  const getPrice = (item) => {
    const t = getUserType();
    const parse = (v) => Number(v || item.selling || 0);
    if (t === "vip") return parse(item.vip);
    if (t === "platinum") return parse(item.platinum);
    return parse(item.selling);
  };

  const getAttrPrice = (attr) => {
    const t = getUserType();
    const parse = (v) => Number(v || attr.selling || 0);
    if (t === "vip") return parse(attr.vip);
    return parse(attr.selling);
  };

  const getQty = (pid, aid = null) => {
    const idx = cart.findIndex(c => Number(c.product_id) === Number(pid) && (aid === null ? c.attribute_id === null : Number(c.attribute_id) === Number(aid)));
    return idx === -1 ? 0 : cart[idx].qty;
  };

  const totalItems = useMemo(() => cart.reduce((total, item) => total + item.qty, 0), [cart]);

  const addToCart = (product, attribute) => {
    const pid = product.id;
    const aid = attribute ? attribute.id : null;
    const newItem = {
      product_id: pid,
      attribute_id: aid,
      attribute_name: attribute ? attribute.attr_name : null,
      name: product.name,
      price: attribute ? getAttrPrice(attribute) : getPrice(product),
      image: firstImg(product.image),
      qty: 1,
    };
    let newCart = [...cart];
    const idx = cart.findIndex(c => Number(c.product_id) === Number(pid) && (aid === null ? c.attribute_id === null : Number(c.attribute_id) === Number(aid)));
    if (idx === -1) newCart.push(newItem); else newCart[idx].qty += 1;
    saveCart(newCart);
  };

  const updateQty = (pid, aid, delta) => {
    let newCart = [...cart];
    const idx = cart.findIndex(c => Number(c.product_id) === Number(pid) && (aid === null ? c.attribute_id === null : Number(c.attribute_id) === Number(aid)));
    if (idx === -1) return;
    newCart[idx].qty += delta;
    if (newCart[idx].qty <= 0) newCart.splice(idx, 1);
    saveCart(newCart);
  };

  // --- 5. RENDER ITEMS ---
  const renderMainImage = ({ item }) => (
    <View style={{ width: screenWidth, alignItems: 'center' }}>
        <Image source={{ uri: item }} style={styles.mainProductImage} resizeMode="contain" />
    </View>
  );

  const renderThumbnail = ({ item, index }) => (
    <TouchableOpacity onPress={() => onThumbnailPress(index)}>
        <Image 
            source={{ uri: item }} 
            style={[styles.thumbnailImage, activeIndex === index && styles.activeThumbnail]} 
        />
    </TouchableOpacity>
  );

  // --- FIXED SIMILAR PRODUCT CARD (PRICE LOGIC) ---
  const renderSimilarItem = ({ item }) => {
    let finalSellingPrice = 0;
    let finalMarketPrice = 0;

    // Check if attributes exist (prevent 0 price)
    if (item.attributes && item.attributes.length > 0) {
        finalSellingPrice = getAttrPrice(item.attributes[0]);
        finalMarketPrice = Number(item.attributes[0].market || 0);
    } else {
        finalSellingPrice = getPrice(item);
        finalMarketPrice = Number(item.market || 0);
    }

    const hasDiscount = finalMarketPrice > finalSellingPrice;
    const discountPercent = hasDiscount 
        ? Math.round(((finalMarketPrice - finalSellingPrice) / finalMarketPrice) * 100) 
        : 0;

    return (
        <TouchableOpacity 
            style={styles.similarCard}
            onPress={() => navigation.push("ProductDetails", { product_id: item.id })}
        >
            <Image source={{ uri: firstImg(item.image) }} style={styles.similarImg} />
            <View style={{padding: 4}}>
                <Text numberOfLines={2} style={styles.similarTitle}>{item.name}</Text>
                
                {/* Price Row */}
                <View style={styles.similarPriceRow}>
                    <Text style={styles.similarSellingPrice}>₹{finalSellingPrice}</Text>
                    {hasDiscount && (
                        <Text style={styles.similarMarketPrice}>₹{finalMarketPrice}</Text>
                    )}
                </View>
                
                {/* Discount Percentage */}
                {hasDiscount && (
                    <Text style={styles.similarDiscountText}>{discountPercent}% off</Text>
                )}
            </View>
        </TouchableOpacity>
    );
  };

  if (productLoading) return <View style={styles.centered}><ActivityIndicator size="large" color={PRIMARY_COLOR} /></View>;
  if (!product) return <View style={styles.centered}><Text>Product Not Found</Text></View>;

  // Data Calculations
  const hasAttributes = product.attributes && product.attributes.length > 0;
  const displayAttr = hasAttributes ? selectedAttribute : null;
  const currentPrice = displayAttr ? getAttrPrice(displayAttr) : getPrice(product);
  const marketPrice = displayAttr ? displayAttr.market : product.market;
  const currentQty = getQty(product.id, displayAttr ? displayAttr.id : null);
  
  // Similar Products List
  const similarProducts = allProducts.filter(p => p.category_id === product.category_id && Number(p.id) !== Number(product.id)).slice(0, 30);

  return (
    <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}><Icon name="arrow-left" size={24} color="#000" /></TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
            <TouchableOpacity onPress={() => navigation.navigate("ViewCart")} style={styles.iconButton}>
                <Icon name="cart-outline" size={24} color="#000" />
                {totalItems > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{totalItems}</Text></View>}
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Images */}
            <View style={styles.carouselContainer}>
                <FlatList
                    ref={slideRef}
                    data={images}
                    renderItem={renderMainImage}
                    keyExtractor={(item, index) => index.toString()}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    scrollEventThrottle={32}
                />
                <View style={styles.dotContainer}>
                    {images.map((_, i) => (
                        <View key={i} style={[styles.dot, activeIndex === i ? styles.activeDot : null]} />
                    ))}
                </View>
            </View>

            {/* Thumbnails */}
            {images.length > 1 && (
                <View style={styles.thumbnailRow}>
                    <FlatList
                        data={images}
                        renderItem={renderThumbnail}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 10 }}
                    />
                </View>
            )}

            <View style={styles.sectionDivider} />

            {/* Main Info */}
            <View style={styles.section}>
                <Text style={styles.productBrand}>{product.brand_name || 'Generic'}</Text>
                <Text style={styles.productName}>{product.name}</Text>
                <View style={styles.priceContainer}>
                    {marketPrice && Number(marketPrice) > Number(currentPrice) && (
                        <Text style={styles.marketPrice}>₹{marketPrice}</Text>
                    )}
                    <Text style={styles.sellingPrice}>₹{currentPrice}</Text>
                    <Text style={styles.unitText}>/{product.unit}</Text>
                </View>
            </View>

            {/* Variants */}
            {hasAttributes && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Variant</Text>
                    <View style={styles.attrSelectorContainer}>
                        {product.attributes.map((attr) => (
                            <TouchableOpacity
                                key={attr.id}
                                style={[styles.attrPill, attr.id === selectedAttribute?.id ? styles.activeAttrPill : null]}
                                onPress={() => setSelectedAttribute(attr)}
                            >
                                <Text style={[styles.attrPillText, attr.id === selectedAttribute?.id ? styles.activeAttrPillText : null]}>
                                    {attr.attr_name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <View style={styles.sectionDivider} />

            {/* Details */}
            <View style={styles.tabSection}>
              <Text style={styles.sectionTitle}>Product Details</Text>
              {!!product?.description && (
                <View style={styles.detailBlock}>
                  <RenderHtml contentWidth={width} source={{ html: product.description }} tagsStyles={{ p: { color: '#555' } }} />
                </View>
              )}
              {!!product?.specification && (
                <View style={styles.detailBlock}>
                  <Text style={styles.detailTitle}>Specifications</Text>
                  <RenderHtml contentWidth={width} source={{ html: product.specification }} />
                </View>
              )}
            </View>

            <View style={styles.sectionDivider} />

            {/* Similar Products */}
            {similarProducts.length > 0 && (
                <View style={styles.similarSection}>
                    <Text style={styles.sectionTitle}>Similar Products</Text>
                    <FlatList
                        data={similarProducts}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        renderItem={renderSimilarItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{paddingRight: 20}}
                    />
                </View>
            )}
        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
            <View style={styles.bottomBarPrice}>
                <Text style={styles.bottomBarLabel}>Price:</Text>
                <Text style={styles.bottomBarAmount}>₹{currentPrice}</Text>
            </View>

            {currentQty === 0 ? (
                <TouchableOpacity style={styles.mainAddBtn} onPress={() => addToCart(product, displayAttr)}>
                    <Text style={styles.mainAddBtnTxt}>ADD TO CART</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.qtyControl}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(product.id, displayAttr ? displayAttr.id : null, -1)}>
                        <Text style={styles.qtyTxt}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyVal}>{currentQty}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(product.id, displayAttr ? displayAttr.id : null, 1)}>
                        <Text style={styles.qtyTxt}>+</Text>
                    </TouchableOpacity>
                </View>
            )}
             <TouchableOpacity onPress={() => navigation.navigate("ViewCart")} style={styles.iconButton}>
                <Icon name="cart-outline" size={24} color="#000" />
                {totalItems > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{totalItems}</Text></View>}
            </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
}

// ----------------------
// STYLES
// ----------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff",paddingVertical:40},
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  header: { flexDirection: "row", alignItems: "center", justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#eee", elevation: 2 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center', marginHorizontal: 10, color: '#333' },
  iconButton: { padding: 8 },
  cartBadge: { position: "absolute", top: 4, right: 4, backgroundColor: "red", borderRadius: 9, minWidth: 18, height: 18, justifyContent: "center", alignItems: "center" },
  cartBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  
  scrollContent: { paddingBottom: 90 },
  section: { paddingHorizontal: 16, paddingVertical: 12 },
  sectionDivider: { height: 8, backgroundColor: '#f2f2f2' },

  // Carousel
  carouselContainer: { backgroundColor: '#fff', alignItems: 'center', paddingTop: 10 },
  mainProductImage: { width: screenWidth * 0.9, height: screenWidth * 0.8 },
  dotContainer: { flexDirection: 'row', justifyContent: 'center', position: 'absolute', bottom: 10, width: '100%' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc', marginHorizontal: 3 },
  activeDot: { backgroundColor: PRIMARY_COLOR, width: 20 },

  // Thumbnails
  thumbnailRow: { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' },
  thumbnailImage: { width: 60, height: 60, borderRadius: 6, marginHorizontal: 6, borderWidth: 1, borderColor: '#eee' },
  activeThumbnail: { borderColor: PRIMARY_COLOR, borderWidth: 2 },

  // Info
  productBrand: { fontSize: 13, color: '#888', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  productName: { fontSize: 18, fontWeight: '700', color: '#222', lineHeight: 24 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  marketPrice: { textDecorationLine: 'line-through', color: '#999', fontSize: 16, marginRight: 8 },
  sellingPrice: { color: PRIMARY_COLOR, fontSize: 22, fontWeight: '800' },
  unitText: { fontSize: 14, color: '#666', marginLeft: 4 },

  // Variants
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#222' },
  attrSelectorContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  attrPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e0e0e0', marginRight: 10, marginBottom: 10, backgroundColor: '#fff' },
  activeAttrPill: { borderColor: PRIMARY_COLOR, backgroundColor: '#fff5f7' },
  attrPillText: { fontSize: 14, color: '#333' },
  activeAttrPillText: { color: PRIMARY_COLOR, fontWeight: '700' },

  // Details
  tabSection: { paddingHorizontal: 16, paddingVertical: 15 },
  detailBlock: { marginBottom: 15 },
  detailTitle: { fontSize: 14, fontWeight: '700', color: '#444', marginBottom: 4 },

  // Similar Products Styles
  similarSection: { paddingVertical: 15, paddingLeft: 16 },
  similarCard: { width: 140, marginRight: 12, backgroundColor: '#fff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#eee' },
  similarImg: { width: '100%', height: 120, borderRadius: 6, marginBottom: 8, resizeMode: 'contain' },
  similarTitle: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6,  },
  similarPriceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  similarSellingPrice: { fontSize: 14, fontWeight: '700', color: '#222', marginRight: 6 },
  similarMarketPrice: { fontSize: 11, textDecorationLine: 'line-through', color: '#999' },
  similarDiscountText: { fontSize: 11, fontWeight: '700', color: 'green' },

  // Bottom Bar
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, paddingHorizontal: 16, backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#eee", elevation: 20 },
  bottomBarPrice: { flexDirection: 'row', alignItems: 'center' },
  bottomBarLabel: { fontSize: 14, color: '#666', marginRight: 6 },
  bottomBarAmount: { fontSize: 20, fontWeight: '800', color: '#333' },
  mainAddBtn: { backgroundColor: PRIMARY_COLOR, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginLeft: 20, flex: 1 },
  mainAddBtnTxt: { color: "#fff", fontWeight: '700', fontSize: 15 },
  qtyControl: { flexDirection: "row", alignItems: "center", backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, flex: 1, marginLeft: 20, justifyContent: 'space-between', height: 44 },
  qtyBtn: { width: 40, height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  qtyTxt: { fontSize: 18, fontWeight: '600', color: '#333' },
  qtyVal: { fontSize: 16, fontWeight: "700", color: '#000' },
  viewCartButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', marginLeft: 10, borderRadius: 8, backgroundColor: '#f0f0f0' },
});