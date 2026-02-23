import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  SafeAreaView,
  Dimensions,
  TouchableWithoutFeedback,
  FlatList,
  Keyboard,
  BackHandler
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute, useIsFocused } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useQuery, useQueryClient } from '@tanstack/react-query';

const API_URL = "https://masonshop.in/api/product_api";
const CART_KEY = "cart";
const SEARCH_HISTORY_KEY = "search_history_v1";
const PRIMARY_COLOR = "#DA1F49"; 
const { width: screenWidth } = Dimensions.get("window");

// --- API Fetchers ---
const fetchProducts = async () => {
  const res = await fetch(API_URL);
  const json = await res.json();
  return json.status ? (json.data || []) : [];
};

const fetchMembership = async () => {
  const userId = (await AsyncStorage.getItem("user_id")) || "M0001";
  const res = await fetch(`https://masonshop.in/api/check_subscription?user_id=${userId}`);
  return await res.json();
};

export default function ProductScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();
  
  // Params
  const passedCategoryId = route.params?.category_id || "all";
  const passedSearchQuery = route.params?.searchQuery || "";

  // State
  const [search, setSearch] = useState(passedSearchQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  
  const [selectedCategory, setSelectedCategory] = useState(passedCategoryId);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAttrModal, setShowAttrModal] = useState(false);
  
  // --- LAYOUT STATES ---
  const [isCategoryVisible, setIsCategoryVisible] = useState(false); // Sidebar Hidden by default
  const [viewType, setViewType] = useState('grid'); 
  const [sortType, setSortType] = useState('default');
  const [showSortModal, setShowSortModal] = useState(false);

  

  // Pagination
  const [limit, setLimit] = useState(20); 

  const leftWidth = 90; 

  // --- React Query ---
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
  });

  const { data: membership } = useQuery({
    queryKey: ['membership'],
    queryFn: fetchMembership,
  });

  // Extract Categories
  const categories = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      if (p.category_id != null && !map.has(p.category_id)) {
        map.set(p.category_id, {
          name: p.category_name || `Category ${p.category_id}`,
          image: p.image ? String(p.image).split(",")[0].trim() : "",
        });
      }
    });
    return Array.from(map.entries()).map(([id, data]) => ({ id, name: data.name, image: data.image }));
  }, [products]);

  // --- Effects ---
  useEffect(() => {
    if(isFocused) {
        loadCart();
        loadSearchHistory();
        queryClient.invalidateQueries(['membership']);
    }
  }, [isFocused]);

  useEffect(() => {
    const backAction = () => {
      if (isSearching) {
        setIsSearching(false);
        Keyboard.dismiss();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [isSearching]);

  useEffect(() => {
    if (route.params?.searchQuery) {
        setSearch(route.params.searchQuery);
        setSelectedCategory("all"); 
    }
  }, [route.params?.searchQuery]);

  // --- Search Logic ---
  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) setSearchHistory(JSON.parse(history));
    } catch (e) { console.log(e); }
  };

  const saveSearchHistory = async (query) => {
    if (!query || !query.trim()) return;
    try {
      let newHistory = [query, ...searchHistory.filter(h => h.toLowerCase() !== query.toLowerCase())].slice(0, 10);
      setSearchHistory(newHistory);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (e) { console.log(e); }
  };

  const deleteHistoryItem = async (index) => {
    const newHistory = [...searchHistory];
    newHistory.splice(index, 1);
    setSearchHistory(newHistory);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  const handleSearchSubmit = () => {
    saveSearchHistory(search);
    Keyboard.dismiss();
    setIsSearching(false);
    setSelectedCategory("all");
    setLimit(20);
  };

  const handleHistoryClick = (item) => {
    setSearch(item);
    saveSearchHistory(item);
    Keyboard.dismiss();
    setIsSearching(false); 
    setSelectedCategory("all");
    setLimit(20);
  };

  const handleSuggestionClick = (item) => {
    setSearch(item.name);
    saveSearchHistory(item.name);
    Keyboard.dismiss();
    setIsSearching(false);
    setSelectedCategory("all");
    setLimit(20);
  };

  // --- Cart Logic ---
  const loadCart = async () => {
    try {
      const raw = await AsyncStorage.getItem(CART_KEY);
      setCart(raw ? JSON.parse(raw) : []);
    } catch (e) { console.log(e); }
  };

  const saveCart = async (newCart) => {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(newCart));
    setCart(newCart);
  };

  const addToCart = (product, attribute = null) => {
    const newItem = {
      product_id: product.id,
      attribute_id: attribute ? attribute.id : null,
      attribute_name: attribute ? attribute.attr_name : null,
      name: product.name,
      price: attribute ? getAttrPrice(attribute) : getPrice(product),
      image: firstImg(product.image),
      qty: 1,
    };
    let newCart = [...cart];
    const idx = findIndexCart(product.id, newItem.attribute_id);
    if (idx === -1) newCart.push(newItem);
    else newCart[idx].qty += 1;
    saveCart(newCart);
  };

  const updateQty = (pid, aid, delta) => {
    let newCart = [...cart];
    const idx = findIndexCart(pid, aid);
    if (idx === -1) return;
    newCart[idx].qty += delta;
    if (newCart[idx].qty <= 0) newCart.splice(idx, 1);
    saveCart(newCart);
  };

  const findIndexCart = (pid, aid) =>
    cart.findIndex((c) => Number(c.product_id) === Number(pid) && (aid === null ? c.attribute_id === null : Number(c.attribute_id) === Number(aid)));

  const getQty = (pid, aid = null) => {
    const idx = findIndexCart(pid, aid);
    return idx === -1 ? 0 : cart[idx].qty;
  };

  // --- Helpers ---
  const getUserType = () => membership?.data?.subscription_name?.toLowerCase() || null;

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

  const getDiscount = (market, selling) => {
    if (!market || !selling || market <= selling) return null;
    const diff = ((market - selling) / market) * 100;
    return Math.round(diff) + "% OFF";
  };

  const firstImg = (img) => img ? String(img).split(",")[0].trim() : "";

  // --- FILTERING & SORTING ---
  const processedProducts = useMemo(() => {
    let filtered = products.filter((p) => {
      const term = search.toLowerCase();
      const nameMatch = String(p.name).toLowerCase().includes(term);
      const catMatch = String(p.category_name || "").toLowerCase().includes(term);
      const catFilter = String(selectedCategory) === "all" || String(p.category_id) === String(selectedCategory);
      return (nameMatch || catMatch) && catFilter;
    });

    if (sortType !== 'default') {
        filtered.sort((a, b) => {
            const priceA = getPrice(a);
            const priceB = getPrice(b);
            return sortType === 'asc' ? priceA - priceB : priceB - priceA;
        });
    }
    return filtered;
  }, [products, search, selectedCategory, sortType, membership]);

  const displayedProducts = useMemo(() => {
    return processedProducts.slice(0, limit);
  }, [processedProducts, limit]);

  // --- Load More ---
  const loadMoreProducts = () => {
    if (limit < processedProducts.length) {
      setTimeout(() => setLimit(prev => prev + 20), 500); 
    }
  };

  const cartTotalQty = cart.reduce((acc, item) => acc + item.qty, 0);
  const cartTotalPrice = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const toggleLayout = () => {
      setViewType(prev => prev === 'grid' ? 'list' : 'grid');
  };

  const handleSort = (type) => {
      setSortType(type);
      setShowSortModal(false);
      setLimit(20);
  };

  if (productsLoading) return (
    <View style={styles.centered}><ActivityIndicator size="large" color={PRIMARY_COLOR} /></View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. TOP HEADER (Search & Cart) */}
      <View style={styles.header}>
        <TouchableOpacity 
            onPress={() => {
                if (isSearching) {
                    setIsSearching(false);
                    Keyboard.dismiss();
                } else {
                    navigation.goBack();
                }
            }} 
            style={styles.backBtn}
        >
            <Icon name="arrow-left" size={26} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
            <Icon name="magnify" size={20} color="#666" style={{marginLeft: 8}} />
            <TextInput
                placeholder="Search..."
                value={search}
                onFocus={() => { setIsSearching(true); loadSearchHistory(); }}
                onChangeText={(t) => { setSearch(t); }} 
                onSubmitEditing={handleSearchSubmit}
                style={styles.searchInput}
                placeholderTextColor="#888"
            />
            {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")} style={{padding: 5}}>
                    <Icon name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
            )}
        </View>

        {!isSearching && (
            <TouchableOpacity onPress={() => navigation.navigate("ViewCart")} style={styles.cartBtn}>
                <Icon name="cart-outline" size={26} color="#333" />
                {cartTotalQty > 0 && (
                    <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartTotalQty}</Text></View>
                )}
            </TouchableOpacity>
        )}
      </View>

      {/* 2. SUB-HEADER (Filter, Sort, Layout) - Only Show when not searching */}
      {!isSearching && (
        <View style={styles.subHeader}>
            {/* Left: Filter Toggle */}
            <TouchableOpacity 
                style={[styles.filterBtn, isCategoryVisible && styles.activeFilterBtn]} 
                onPress={() => setIsCategoryVisible(!isCategoryVisible)}
            >
                <Icon name="filter-variant" size={20} color={isCategoryVisible ? "#fff" : "#333"} />
                <Text style={[styles.filterText, isCategoryVisible && {color:'#fff'}]}>
                    {isCategoryVisible ? "Hide Filter" : "Filter"}
                </Text>
            </TouchableOpacity>

            {/* Right: Tools */}
            <View style={{flexDirection: 'row'}}>
                <TouchableOpacity onPress={() => setShowSortModal(true)} style={styles.toolIcon}>
                    <Icon name="sort" size={24} color="#555" />
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleLayout} style={styles.toolIcon}>
                    <Icon 
                        name={viewType === 'grid' ? "view-list" : "view-grid"} 
                        size={24} 
                        color="#555" 
                    />
                </TouchableOpacity>
            </View>
        </View>
      )}

      {/* --- CONTENT --- */}
      {isSearching ? (
        <View style={styles.searchOverlay}>
            <ScrollView keyboardShouldPersistTaps="handled">
                {search.length === 0 ? (
                    <View style={styles.historyContainer}>
                        <View style={styles.historyHeader}>
                            <Text style={styles.historyTitle}>Recent Searches</Text>
                            {searchHistory.length > 0 && (
                                <TouchableOpacity onPress={() => {setSearchHistory([]); AsyncStorage.removeItem(SEARCH_HISTORY_KEY)}}>
                                    <Text style={styles.clearText}>Clear All</Text>
                                </TouchableOpacity>
                            )}
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
                    <View>
                        <TouchableOpacity style={styles.suggestionRow} onPress={handleSearchSubmit}>
                            <View style={styles.searchIconBox}><Icon name="magnify" size={22} color="#555" /></View>
                            <Text style={styles.suggestionText}>Search for "<Text style={{fontWeight: 'bold', color: '#000'}}>{search}</Text>"</Text>
                            <Icon name="arrow-top-left" size={20} color="#ccc" style={{marginLeft: 'auto', transform: [{rotate: '180deg'}]}} />
                        </TouchableOpacity>
                        {processedProducts.slice(0, 8).map((item) => (
                            <TouchableOpacity key={item.id} style={styles.suggestionRow} onPress={() => handleSuggestionClick(item)}>
                                <Image source={{ uri: firstImg(item.image) }} style={styles.suggestionImage} />
                                <View style={{flex: 1, marginLeft: 10, justifyContent: 'center'}}>
                                    <Text style={styles.suggestionTitle} numberOfLines={1}>{item.name}</Text>
                                </View>
                                <Icon name="arrow-top-left" size={24} color="#ccc" style={{transform: [{rotate: '180deg'}]}} />
                            </TouchableOpacity>
                        ))}
                        <View style={{height: 300}} /> 
                    </View>
                )}
            </ScrollView>
        </View>
      ) : (
        <View style={styles.contentWrap}>
            {/* Left Sidebar (Only visible if toggled ON) */}
            {isCategoryVisible && (
            <View style={[styles.leftBar, { width: leftWidth }]}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 60}}>
                <TouchableOpacity 
                    style={[styles.categoryItem, String(selectedCategory) === "all" && styles.activeCat]} 
                    onPress={() => { setSelectedCategory("all"); setLimit(20); setSearch(""); Keyboard.dismiss(); }}
                >
                    <View style={[styles.catCircle, String(selectedCategory) === "all" && styles.activeCatCircle]}>
                        <Icon name="apps" size={20} color={String(selectedCategory) === "all" ? "#fff" : PRIMARY_COLOR} />
                    </View>
                    <Text style={[styles.catText, String(selectedCategory) === "all" && styles.activeCatText]}>All</Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                    <TouchableOpacity 
                    key={cat.id} 
                    style={[styles.categoryItem, String(selectedCategory) === String(cat.id) && styles.activeCat]} 
                    onPress={() => { setSelectedCategory(cat.id); setLimit(20); setSearch(""); Keyboard.dismiss(); }}
                    >
                    <View style={[styles.catImageContainer, String(selectedCategory) === String(cat.id) && styles.activeCatCircle]}>
                        <Image source={{ uri: cat.image }} style={styles.catImage} />
                    </View>
                    <Text numberOfLines={2} style={[styles.catText, String(selectedCategory) === String(cat.id) && styles.activeCatText]}>{cat.name}</Text>
                    </TouchableOpacity>
                ))}
                </ScrollView>
            </View>
            )}

            <View style={[styles.rightSide, { width: isCategoryVisible ? screenWidth - leftWidth : screenWidth }]}>
            <FlatList
                key={viewType} // Force re-render on layout change
                data={displayedProducts}
                keyExtractor={(item) => item.id.toString()}
                numColumns={viewType === 'grid' ? 2 : 1}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.gridWrap}
                
                onEndReached={loadMoreProducts}
                onEndReachedThreshold={0.5} 
                
                renderItem={({ item }) => {
                const hasAttr = item.attributes?.length > 0;
                const qty = hasAttr 
                    ? cart.filter(c => Number(c.product_id) === Number(item.id)).reduce((s, i) => s + i.qty, 0)
                    : getQty(item.id, null);
                
                const price = getPrice(item);
                const discount = getDiscount(item.market, price);

                // --- Grid View Card ---
                if (viewType === 'grid') {
                    return (
                        <TouchableOpacity 
                            activeOpacity={0.9} 
                            style={styles.gridCard} 
                            onPress={() => navigation.navigate("ProductDetails", { product_id: item.id })}
                        >
                            {discount && <View style={styles.discountBadge}><Text style={styles.discountText}>{discount}</Text></View>}
                            <TouchableOpacity style={styles.wishlistIcon}><Icon name="heart-outline" size={18} color="#999" /></TouchableOpacity>

                            <View style={styles.gridImgContainer}>
                                <Image source={{ uri: firstImg(item.image) }} style={styles.pImg} resizeMode="contain" />
                            </View>
                            
                            <View style={styles.details}>
                                <Text numberOfLines={1} style={styles.pName}>{item.name}</Text>
                                <View style={styles.priceRow}>
                                  {price > 0 && ( 
                                    <Text style={styles.selling}>₹{price}</Text>
                                    )}
                                    {item.market > price && <Text style={styles.market}>₹{item.market}</Text>}
                                </View>
                                <View style={{marginTop: 5}}>
                                    {hasAttr ? (
                                        <TouchableOpacity style={styles.optionsBtn} onPress={() => { setSelectedProduct(item); setShowAttrModal(true); }}>
                                            <Text style={styles.optionsBtnText}>{qty > 0 ? `${qty} Added` : "Select"}</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        qty === 0 ? (
                                            <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                                                <Text style={styles.addBtnTxt}>ADD</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={styles.qtyControl}>
                                                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, null, -1)}><Text style={styles.qtySign}>-</Text></TouchableOpacity>
                                                <Text style={styles.qtyVal}>{qty}</Text>
                                                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, null, 1)}><Text style={styles.qtySign}>+</Text></TouchableOpacity>
                                            </View>
                                        )
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                } 
                
                // --- List View Card ---
                return (
                    <TouchableOpacity 
                        activeOpacity={0.9} 
                        style={styles.listCard} 
                        onPress={() => navigation.navigate("ProductDetails", { product_id: item.id })}
                    >
                        {discount && <View style={styles.discountBadge}><Text style={styles.discountText}>{discount}</Text></View>}
                        
                        <View style={styles.listImgContainer}>
                            <Image source={{ uri: firstImg(item.image) }} style={styles.pImg} resizeMode="contain" />
                        </View>
                        
                        <View style={styles.listDetails}>
                            <Text numberOfLines={2} style={styles.pName}>{item.name}</Text>
                            <View style={styles.priceRow}>
                              {price > 0 && ( 
                                    <Text style={styles.selling}>₹{price}</Text>
                                    )}
                                {item.market > price && <Text style={styles.market}>₹{item.market}</Text>}
                            </View>
                            
                            <View style={{marginTop: 8, alignSelf: 'flex-start', minWidth: 100}}>
                                {hasAttr ? (
                                    <TouchableOpacity style={styles.optionsBtn} onPress={() => { setSelectedProduct(item); setShowAttrModal(true); }}>
                                        <Text style={styles.optionsBtnText}>{qty > 0 ? `${qty} Added` : "Select"}</Text>
                                    </TouchableOpacity>
                                ) : (
                                    qty === 0 ? (
                                        <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                                            <Text style={styles.addBtnTxt}>ADD +</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.qtyControl}>
                                            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, null, -1)}><Text style={styles.qtySign}>-</Text></TouchableOpacity>
                                            <Text style={styles.qtyVal}>{qty}</Text>
                                            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, null, 1)}><Text style={styles.qtySign}>+</Text></TouchableOpacity>
                                        </View>
                                    )
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>
                );

                }}
                
                ListFooterComponent={() => (
                <View style={{ paddingBottom: cart.length > 0 ? 80 : 20, alignItems:'center', justifyContent:'center', height: 60 }}>
                    {limit < processedProducts.length ? (
                        <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                    ) : (
                        processedProducts.length > 0 && <Text style={{color: '#ccc', fontSize: 12}}>You've reached the end</Text>
                    )}
                </View>
                )}
                
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Icon name="emoticon-sad-outline" size={50} color="#ccc" />
                        <Text style={{color: '#999', marginTop: 10}}>No products found.</Text>
                    </View>
                )}
            />
            </View>
        </View>
      )}

      {/* BOTTOM CART BAR */}
      {!isSearching && cart.length > 0 && (
        <View style={styles.bottomBar}>
            <View style={styles.bottomBarLeft}>
                <Text style={styles.bottomBarQty}>{cartTotalQty} Items</Text>
                <Text style={styles.bottomBarTotal}>₹{cartTotalPrice}</Text>
            </View>
            <TouchableOpacity style={styles.viewCartBtn} onPress={() => navigation.navigate("ViewCart")}>
                <Text style={styles.viewCartText}>View Cart</Text>
                <Icon name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
      )}

      {/* SORT MODAL */}
      <Modal visible={showSortModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowSortModal(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.sortModalBox}>
                    <Text style={styles.sortHeader}>Sort By</Text>
                    <TouchableOpacity style={styles.sortOption} onPress={() => handleSort('default')}>
                        <Text style={[styles.sortText, sortType === 'default' && styles.activeSortText]}>Relevance (Default)</Text>
                        {sortType === 'default' && <Icon name="check" size={20} color={PRIMARY_COLOR} />}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sortOption} onPress={() => handleSort('asc')}>
                        <Text style={[styles.sortText, sortType === 'asc' && styles.activeSortText]}>Price: Low to High</Text>
                        {sortType === 'asc' && <Icon name="check" size={20} color={PRIMARY_COLOR} />}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sortOption} onPress={() => handleSort('desc')}>
                        <Text style={[styles.sortText, sortType === 'desc' && styles.activeSortText]}>Price: High to Low</Text>
                        {sortType === 'desc' && <Icon name="check" size={20} color={PRIMARY_COLOR} />}
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ATTRIBUTE MODAL */}
      <Modal visible={showAttrModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowAttrModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalBox}>
                <View style={styles.modalHeader}>
                    <View style={styles.modalTitleContainer}>
                        <Image source={{ uri: firstImg(selectedProduct?.image) }} style={styles.modalProductImg} />
                        <Text style={styles.modalTitle} numberOfLines={2}>{selectedProduct?.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowAttrModal(false)}><Icon name="close" size={24} /></TouchableOpacity>
                </View>
                <ScrollView>
                  {selectedProduct?.attributes?.map((attr) => {
                    const qty = getQty(selectedProduct.id, attr.id);
                    return (
                      <View key={attr.id} style={styles.attrRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: "600", color: '#333', fontSize: 15 }}>{attr.attr_name}</Text>
                            <Text style={{color: PRIMARY_COLOR, fontWeight: 'bold', fontSize: 13}}>₹{getAttrPrice(attr)}</Text>
                        </View>
                        {qty === 0 ? (
                          <TouchableOpacity style={styles.modalAdd} onPress={() => addToCart(selectedProduct, attr)}>
                              <Text style={{ color: "#fff", fontWeight: 'bold' }}>ADD</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.qtyControlModal}>
                              <TouchableOpacity style={styles.qtyBtnModal} onPress={() => updateQty(selectedProduct.id, attr.id, -1)}><Text style={styles.qtySignModal}>-</Text></TouchableOpacity>
                              <View style={styles.qtyValBoxModal}><Text style={styles.qtyValModal}>{qty}</Text></View>
                              <TouchableOpacity style={styles.qtyBtnModal} onPress={() => updateQty(selectedProduct.id, attr.id, 1)}><Text style={styles.qtySignModal}>+</Text></TouchableOpacity>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2",paddingVertical:20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  // --- Header ---
  header: { 
    flexDirection: "row", alignItems: "center", justifyContent: 'space-between',
    paddingHorizontal: 10, paddingVertical: 10, backgroundColor: "#fff", 
    elevation: 2 
  },
  backBtn: { padding: 5 },
  searchContainer: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', 
    backgroundColor: "#f5f5f5", borderRadius: 8, marginHorizontal: 10, height: 40 
  },
  searchInput: { flex: 1, paddingHorizontal: 8, color: '#333' },
  cartBtn: { position: 'relative', padding: 5 },
  cartBadge: { 
    position: "absolute", top: -4, right: -4, 
    backgroundColor: "red", borderRadius: 10, 
    paddingHorizontal: 4, minWidth: 16, alignItems:'center' 
  },
  cartBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },

  // --- Sub Header (Filter/Sort) ---
  subHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 15,
    borderBottomWidth: 1, borderBottomColor: '#eee',
    elevation: 1
  },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1, borderColor: '#ddd',
    backgroundColor: '#f9f9f9'
  },
  activeFilterBtn: { backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR },
  filterText: { marginLeft: 5, fontSize: 13, fontWeight: '600', color: '#333' },
  toolIcon: { marginLeft: 20, padding: 4 },

  // Layout
  contentWrap: { flexDirection: "row", flex: 1 },
  leftBar: { backgroundColor: "#fff", borderRightWidth: 1, borderColor: "#eee" },
  rightSide: { flex: 1 },
  
  // Categories
  categoryItem: { paddingVertical: 15, alignItems: "center", borderBottomWidth: 1, borderColor: '#f9f9f9' },
  activeCat: { backgroundColor: '#fff5f7', borderRightWidth: 3, borderRightColor: PRIMARY_COLOR },
  catCircle: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  activeCatCircle: { backgroundColor: PRIMARY_COLOR },
  catImageContainer: { width: 45, height: 45, borderRadius: 25, overflow: 'hidden', marginBottom: 5, backgroundColor: '#f0f0f0', padding: 2 },
  catImage: { width: '100%', height: '100%', borderRadius: 25 },
  catText: { fontSize: 11, textAlign: "center", color: '#555', paddingHorizontal: 2 },
  activeCatText: { color: PRIMARY_COLOR, fontWeight: 'bold' },
  
  // Grid vs List Layout Styles
  gridWrap: { padding: 6 },
  
  // Grid Card (2 columns)
  gridCard: { 
    width: "47%", 
    backgroundColor: "#fff", borderRadius: 8, marginBottom: 10, marginHorizontal: "1.5%", 
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, paddingBottom: 8
  },
  gridImgContainer: { height: 120, justifyContent: 'center', alignItems: 'center', padding: 10 },
  
  // List Card (1 column - Horizontal)
  listCard: { 
    width: "96%", 
    flexDirection: 'row', 
    backgroundColor: "#fff", borderRadius: 8, marginBottom: 10, marginHorizontal: "2%", 
    elevation: 2, padding: 10, alignItems: 'center'
  },
  listImgContainer: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  listDetails: { flex: 1 },

  // Common Card Styles
  discountBadge: { position: 'absolute', top: 0, left: 0, backgroundColor: '#26a541', paddingHorizontal: 6, paddingVertical: 2, borderBottomRightRadius: 8, zIndex: 1 },
  discountText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  wishlistIcon: { position: 'absolute', top: 6, right: 6, zIndex: 1, backgroundColor: '#fff', borderRadius: 15, padding: 4, elevation: 2 },
  pImg: { width: "100%", height: "100%" },
  
  details: { paddingHorizontal: 8 },
  pName: { fontSize: 13, color: '#333', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 },
  selling: { color: "#000", fontWeight: "bold", fontSize: 15, marginRight: 6 },
  market: { textDecorationLine: "line-through", color: "#999", fontSize: 11 },
  
  // Buttons
  addBtn: { backgroundColor: "#fff", borderWidth: 1, borderColor: PRIMARY_COLOR, borderRadius: 4, paddingVertical: 5, alignItems: 'center' },
  addBtnTxt: { color: PRIMARY_COLOR, fontWeight: "bold", fontSize: 13 },
  optionsBtn: { backgroundColor: "#0dbeea35", borderWidth: 1, borderColor: "#ccc", borderRadius: 4, paddingVertical: 5, alignItems: 'center' },
  optionsBtnText: { color: "#069852ff", fontWeight: "600", fontSize: 12 },

  qtyControl: { flexDirection: "row", alignItems: "center", justifyContent: 'space-between', backgroundColor: '#f2f2f2', borderRadius: 4 },
  qtyBtn: { width: 30, height: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: PRIMARY_COLOR, borderRadius: 4 },
  qtySign: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  qtyVal: { fontWeight: "bold", fontSize: 13, color: '#333' },

  // Sort Modal
  sortModalBox: { backgroundColor: '#fff', width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 40 ,position:'absolute,'},
  sortHeader: { fontSize: 18, fontWeight: 'bold',  color: '#333' },
  sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sortText: { fontSize: 16, color: '#555' },
  activeSortText: { color: PRIMARY_COLOR, fontWeight: 'bold' },

  // Search Overlay
  searchOverlay: { flex: 1, backgroundColor: '#fff', zIndex: 999 },
  historyContainer: { padding: 15 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  historyTitle: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  clearText: { color: 'red', fontSize: 12 },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
  historyText: { marginLeft: 10, fontSize: 14, color: '#444' },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#f0f0f0', backgroundColor: '#fff' },
  suggestionImage: { width: 40, height: 40, resizeMode: 'contain', marginRight: 10 },
  suggestionTitle: { fontSize: 14, color: '#333', flex: 1, fontWeight: '500' },
  searchIconBox: { width: 40, alignItems: 'center' },
  suggestionText: { fontSize: 15, color: '#444' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },

  // Bottom Bar
  bottomBar: { position: 'absolute', bottom: 20, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderTopWidth: 1, borderColor: '#eee', elevation: 10 ,padding:30},
  bottomBarLeft: { flexDirection: 'column' },
  bottomBarQty: { fontSize: 12, color: '#666' },
  bottomBarTotal: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  viewCartBtn: { backgroundColor: PRIMARY_COLOR, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  viewCartText: { color: '#fff', fontWeight: 'bold', marginRight: 5 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#fff", paddingBottom: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  modalTitleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  modalProductImg: { width: 40, height: 40, borderRadius: 4, marginRight: 10, backgroundColor: '#f0f0f0' },
  modalTitle: { fontSize: 16, fontWeight: "bold", color: '#333', flex: 1 },
  attrRow: { flexDirection: "row", alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: "#f5f5f5" },
  modalAdd: { backgroundColor: PRIMARY_COLOR, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 4 },
  qtyControlModal: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: PRIMARY_COLOR, borderRadius: 4, height: 32 },
  qtyBtnModal: { width: 32, justifyContent: 'center', alignItems: 'center' },
  qtySignModal: { color: PRIMARY_COLOR, fontSize: 18, fontWeight: 'bold' },
  qtyValBoxModal: { width: 32, alignItems: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: PRIMARY_COLOR },
  qtyValModal: { fontWeight: 'bold', color: '#333' }
});