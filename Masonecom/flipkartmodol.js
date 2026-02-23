// ProductScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://masonshop.in/api/product_api";
const CART_KEY = "cart";

export default function ProductScreen() {

  
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  const [membership, setMembership] = useState(null);
  const [userId, setUserId] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAttributeModal, setShowAttributeModal] = useState(false);

  useEffect(() => {
    fetchProducts();
    loadCart();
    fetchMembership();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      if (json.status) setProducts(json.data);
    } catch (e) {
      console.log("API ERROR:", e);
    }
    setLoading(false);
  };

  const loadCart = async () => {
    const raw = await AsyncStorage.getItem(CART_KEY);
    setCart(raw ? JSON.parse(raw) : []);
  };

  const saveCart = async (newCart) => {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(newCart));
    setCart(newCart);
  };

  const fetchMembership = async () => {
    try {
      const storedUserId = (await AsyncStorage.getItem("user_id")) || "M0001";
      setUserId(storedUserId);

      const res = await fetch(
        `https://masonshop.in/api/check_subscription?user_id=${storedUserId}`
      );
      const data = await res.json();
      setMembership(data);
    } catch (error) {
      console.error("Membership check failed:", error);
    }
  };

  const getUserType = () => membership?.data?.subscription_name || null;

  const getPrice = (item) => {
    const t = getUserType();
    if (t === "vip") return item.vip || item.selling;
    if (t === "platinum") return item.platinum || item.selling;
    if (t === "premium") return item.premium || item.selling;
    return item.selling;
  };

  const getAttrPrice = (attr) => {
    const t = getUserType();
    if (t === "vip") return attr.vip || attr.selling;
    if (t === "platinum") return attr.platinum || attr.selling;
    if (t === "premium") return attr.premium || attr.selling;
    return attr.selling;
  };

  const firstImage = (img) => (img ? img.split(",")[0] : "");

  const findCartIndex = (pid, aid) =>
    cart.findIndex(
      (c) =>
        Number(c.product_id) === Number(pid) &&
        (aid === null
          ? c.attribute_id === null
          : Number(c.attribute_id) === Number(aid))
    );

  const getQty = (pid, aid = null) => {
    const idx = findCartIndex(pid, aid);
    return idx === -1 ? 0 : cart[idx].qty;
  };

  const addToCartInitial = async (product, attribute = null) => {
    const pid = product.id;
    const aid = attribute ? attribute.id : null;

    const price = attribute ? getAttrPrice(attribute) : getPrice(product);

    const newItem = {
      product_id: pid,
      attribute_id: aid,
      attribute_name: attribute ? attribute.attr_name : null,
      name: product.name,
      image: firstImage(product.image),
      price,
      qty: 1,
    };

    let newCart = [...cart];
    const idx = findCartIndex(pid, aid);

    if (idx === -1) newCart.push(newItem);
    else newCart[idx].qty += 1;

    saveCart(newCart);
  };

  const updateQty = async (pid, aid, delta) => {
    let newCart = [...cart];
    const idx = findCartIndex(pid, aid);
    if (idx === -1) return;

    newCart[idx].qty += delta;

    if (newCart[idx].qty <= 0) newCart.splice(idx, 1);

    saveCart(newCart);
  };

  const QtyBox = ({ pid, aid }) => {
    const qty = getQty(pid, aid);

    if (qty === 0) {
      const product = products.find((p) => p.id === pid);
      return (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => addToCartInitial(product, null)}
        >
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.qtyRow}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => updateQty(pid, aid, -1)}
        >
          <Text style={styles.qtyBtnText}>-</Text>
        </TouchableOpacity>

        <View style={styles.qtyValueBox}>
          <Text style={styles.qtyValueText}>{qty}</Text>
        </View>

        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => updateQty(pid, aid, 1)}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleAddPress = (product) => {
    if (product.attributes.length === 0) {
      addToCartInitial(product);
    } else {
      setSelectedProduct(product);
      setShowAttributeModal(true);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#d10061" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          padding: 6,
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        {products.map((item) => {
          const addedAttr = cart.find(
            (c) => Number(c.product_id) === Number(item.id)
          );

          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: firstImage(item.image) }}
                  style={styles.productImage}
                />
              </View>

              <Text style={styles.productName} numberOfLines={2}>
                {item.name}
              </Text>

              {item.attributes.length === 0 ? (
                <View style={{ flexDirection: "row", marginTop: 4 }}>
                  <Text style={styles.marketPrice}>₹{item.market}</Text>
                  <Text style={styles.productPrice}>₹{getPrice(item)}</Text>
                </View>
              ) : (
                <Text style={styles.attributeTag}>Multiple Options</Text>
              )}

              {item.attributes.length === 0 ? (
                <QtyBox pid={item.id} aid={null} />
              ) : (
                <TouchableOpacity
                  style={styles.selectBtn}
                  onPress={() => handleAddPress(item)}
                >
                  <Text style={styles.selectBtnText}>
                    {addedAttr ? `${addedAttr.qty} item ▼` : "Select ▼"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* ATTRIBUTE MODAL */}
      <Modal visible={showAttributeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
            </View>

            <ScrollView>
              {selectedProduct?.attributes?.map((attr) => {
                const pid = selectedProduct.id;
                const aid = attr.id;
                const qty = getQty(pid, aid);

                return (
                  <View key={aid} style={styles.attrCard}>
                    <Image
                      source={{ uri: firstImage(selectedProduct.image) }}
                      style={styles.attrImage}
                    />

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.attrName}>{attr.attr_name}</Text>

                      <View style={{ flexDirection: "row", marginTop: 3 }}>
                        <Text style={styles.marketPrice}>₹{attr.market}</Text>
                        <Text style={styles.attrPrice}>
                          ₹{getAttrPrice(attr)}
                        </Text>
                      </View>
                    </View>

                    {qty === 0 ? (
                      <TouchableOpacity
                        style={styles.modalAddBtn}
                        onPress={() =>
                          addToCartInitial(selectedProduct, attr)
                        }
                      >
                        <Text style={styles.modalAddText}>Add</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.qtyRow}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQty(pid, aid, -1)}
                        >
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>

                        <View style={styles.qtyValueBox}>
                          <Text style={styles.qtyValueText}>{qty}</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQty(pid, aid, 1)}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowAttributeModal(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 10,
    margin: "1%",
    borderRadius: 12,
    elevation: 4,
  },

  imageWrapper: {
    backgroundColor: "#f9f9f9",
    padding: 8,
    borderRadius: 12,
  },

  productImage: { width: "100%", height: 120, borderRadius: 12 },

  productName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
  },

  marketPrice: {
    textDecorationLine: "line-through",
    color: "gray",
    marginRight: 6,
  },

  productPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#d10061",
  },

  attributeTag: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#e6f3ff",
    color: "#0066cc",
    borderRadius: 6,
  },

  selectBtn: {
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: "#d10061",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff2f8",
  },

  selectBtnText: {
    textAlign: "center",
    color: "#d10061",
    fontWeight: "700",
  },

  addBtn: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: "#d10061",
    paddingVertical: 6,
    borderRadius: 8,
  },

  addBtnText: {
    textAlign: "center",
    color: "#d10061",
    fontWeight: "700",
  },

  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#d10061",
    borderRadius: 8,
  },

  qtyBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  qtyBtnText: { color: "#d10061", fontSize: 18, fontWeight: "700" },

  qtyValueBox: { minWidth: 36, alignItems: "center" },
  qtyValueText: { fontWeight: "700", fontSize: 16 },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  modalBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "65%",
  },

  modalHeader: {
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingBottom: 10,
  },

  modalTitle: { fontSize: 18, fontWeight: "800" },

  attrCard: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fafafa",
    borderRadius: 12,
    marginBottom: 10,
  },

  attrImage: { width: 55, height: 55, borderRadius: 8 },

  attrName: { fontSize: 14, fontWeight: "700" },

  attrPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#d10061",
  },

  modalAddBtn: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#d10061",
    backgroundColor: "#fff0f7",
  },

  modalAddText: {
    color: "#d10061",
    fontWeight: "700",
  },

  closeBtn: { paddingVertical: 10 },
  closeText: { color: "red", fontSize: 16, textAlign: "center" },
});
