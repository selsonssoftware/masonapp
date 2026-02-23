import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Text, Chip, Button } from "react-native-paper";
import Icon from "react-native-vector-icons/Ionicons";
import Modal from "react-native-modal";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CouponCard = ({
  onPress,
  image,
  logo,
  title,
  validity,
  type,
  amount,
  code,
  color,
  tag,
  disabled,
  min_order_amount,
  finalAmount,
}) => {
  const remaining = Math.max(0, min_order_amount - finalAmount);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.9}
      disabled={disabled}
    >
      <View style={[styles.cardContainer, disabled && { opacity: 0.4 }]}>
        <View style={styles.cardLeft}>
          <Image source={{ uri: image }} style={styles.cardImage} />
          {tag && (
            <Chip style={styles.tagChip} textStyle={styles.tagChipText}>
              {tag}
            </Chip>
          )}
        </View>
        <View style={styles.cardMiddle}>
          <Image
            source={{ uri: logo }}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardValidity}>{validity}</Text>

          {disabled && (
            <Text style={styles.unlockText}>
              Add ₹{remaining} more to unlock
            </Text>
          )}
        </View>
        <View
          style={[
            styles.cardRight,
            { backgroundColor: disabled ? "#aaa" : color || "#d32f2f" },
          ]}
        >
          <Text style={styles.couponType}>{type}</Text>
          <Text style={styles.couponAmount}>{amount}</Text>
          <Text style={styles.couponCode}>{code}</Text>
          <TouchableOpacity
            style={[
              styles.getCodeBtn,
              disabled && { backgroundColor: "#eee" },
            ]}
            disabled={disabled}
          >
            <Text
              style={[
                styles.getCodeText,
                disabled && { color: "#888" },
              ]}
            >
              {disabled ? "Not Eligible" : "Get Code"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const CouponListPage = ({ navigation }) => {
  const route = useRoute();
  const finalAmount = route.params?.finalAmount || 0;

  const [filter, setFilter] = useState("All");
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const userId = await AsyncStorage.getItem("user_id"); // ✅ get session user_id
      if (!userId) {
        console.warn("⚠️ No user_id found in session");
        return;
      }
  
      const res = await fetch(
        `https://masonshop.in/api/coupons_customer?id=${userId}` // ✅ use template literal
      );
      const data = await res.json();

      let allCoupons = [];

      if (data.discount_type) {
        allCoupons = [
          ...allCoupons,
          ...data.discount_type.map((c) => ({
            id: c.id,
            image: c.image,
            logo: c.profile,
            title: c.coupon_name,
            desc: c.coupon_desc,
            validity: c.expires_at
              ? `Valid Till ${new Date(c.expires_at).toLocaleDateString()}`
              : "Valid Now",
            type: c.coupon_type?.toUpperCase() || "COUPON",
            amount: c.discount_amount,
            code: c.coupon_code,
            color: "#d32f2f",
            tag: c.status === "reedemed" ? "Redeemed" : "Active",
            status: c.status,
            min_order_amount: Number(c.min_order_amount || 0),
            terms: [
              `Flat ${c.discount_amount} Off`,
              `Valid till ${new Date(c.expires_at).toLocaleDateString()}`,
              `Redeem once per user`,
            ],
          })),
        ];
      }

      setCoupons(allCoupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCoupons = coupons.filter((c) => {
    if (filter === "Redeemed") return c.status === "reedemed";
    if (filter === "Non Redeemed") return c.status === "not_used";
    return true;
  });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Banner Section */}
        <View style={styles.bannerWrapper}>
          <Image
            source={require("../assets/couponlist/banner.png")}
            style={styles.banner}
          />
          <View style={styles.bannerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.totalTextOverlay}>
              <Text style={{ fontWeight: "bold", color: "white" }}>
                ₹ {finalAmount}
              </Text>{" "}
              Total
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {["All", "Redeemed", "Non Redeemed"].map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setFilter(item)}
              style={[styles.tabItem, filter === item && styles.tabItemActive]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  filter === item && styles.tabLabelActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Your Coupon</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#d32f2f"
            style={{ marginTop: 20 }}
          />
        ) : filteredCoupons.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              marginVertical: 20,
              color: "#666",
            }}
          >
            No Coupons Found
          </Text>
        ) : (
          filteredCoupons.map((coupon) => {
            const disabled = finalAmount < coupon.min_order_amount;
            return (
              <CouponCard
                key={coupon.id}
                {...coupon}
                finalAmount={finalAmount}
                disabled={disabled}
                onPress={() => !disabled && setSelectedCoupon(coupon)}
              />
            );
          })
        )}
      </ScrollView>

      {/* Coupon Bottom Modal */}
      <Modal
        isVisible={!!selectedCoupon}
        onBackdropPress={() => setSelectedCoupon(null)}
        style={styles.bottomModal}
      >
        {selectedCoupon && (
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => setSelectedCoupon(null)}
              style={styles.modalClose}
            >
              <Icon name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>

            <Image
              source={{ uri: selectedCoupon.image }}
              style={styles.modalImage}
            />
         <View style={{ padding: 10 }}>
  <Image
    source={{ uri: selectedCoupon.logo }}
    style={styles.modalLogo}
  />
  <Text style={styles.modalTitle}>{selectedCoupon.title}</Text>
  <Text style={styles.modalDesc}>{selectedCoupon.desc}</Text>

  <TouchableOpacity style={styles.codeButton}>
    <Text style={styles.codeText}>
      Coupon Code: {selectedCoupon.code}
    </Text>
  </TouchableOpacity>

  <Text style={styles.detailsHeading}>Details</Text>
  {selectedCoupon.terms.map((t, i) => (
    <Text key={i} style={styles.detailItem}>
      • {t}
    </Text>
  ))}

  {/* ✅ Show Min Order Amount */}
  <Text style={styles.detailItem}>
    • Minimum Order Amount: ₹{selectedCoupon.min_order_amount}
  </Text>

  {/* <Button
    mode="contained"
    style={styles.redeemBtn}
    onPress={() => alert("Coupon Redeemed")}
  >
    Redeem
  </Button> */}
</View>

          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  bannerWrapper: { position: "relative", marginTop: "13%" },
  banner: { width: "100%", height: 160, resizeMode: "cover" },
  bannerContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    paddingTop: 20,
  },
  backButton: { marginRight: 10 },
  totalTextOverlay: {
    fontSize: 20,
    color: "#fff",
    marginLeft: 5,
    fontWeight: "700",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 10,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: "#d32f2f" },
  tabLabel: { fontSize: 15, fontWeight: "700", color: "#999" },
  tabLabelActive: { color: "#d32f2f", fontWeight: "bold" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cardContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardLeft: { width: 80, padding: 8, position: "relative" },
  cardImage: { width: 100, height: 100, borderRadius: 8 },
  tagChip: {
    position: "absolute",
    top: 14,
    left: 12,
    backgroundColor: "#fbf9f9",
    borderRadius: 12,
  },
  tagChipText: { fontSize: 6, color: "#F60138" },
  cardMiddle: {
    maxWidth: 150,
    flex: 1,
    justifyContent: "center",
    paddingLeft: 30,
    padding: 10,
  },
  logo: { height: 18, width: 90, marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: "500", color: "#000" },
  cardValidity: { fontSize: 12, color: "#888", marginTop: 4 },
  unlockText: { fontSize: 12, color: "#d32f2f", marginTop: 4 },
  cardRight: {
    width: 100,
    borderTopLeftRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  couponType: { color: "#fff", fontSize: 12, fontWeight: "600", marginBottom: 4 },
  couponAmount: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  couponCode: {
    fontSize: 12,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 6,
  },
  getCodeBtn: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  getCodeText: { fontSize: 10, fontWeight: "bold", color: "#d32f2f" },

  // Modal Styles
  bottomModal: { justifyContent: "flex-end", margin: 0 },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  modalClose: { padding: 10 },
  modalImage: {
    width: "100%",
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalLogo: { height: 30, width: 120, marginVertical: 10 },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  modalDesc: { fontSize: 14, color: "#666", marginVertical: 8 },
  codeButton: {
    backgroundColor: "#f50057",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },
  codeText: { color: "#fff", fontWeight: "bold" },
  detailsHeading: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  detailItem: { fontSize: 14, marginVertical: 2, color: "#444" },
  redeemBtn: {
    marginTop: 20,
    backgroundColor: "#f50057",
    borderRadius: 8,
  },
});

export default CouponListPage;
