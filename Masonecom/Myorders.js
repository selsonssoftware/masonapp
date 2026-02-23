import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Text, Card } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRIMARY_COLOR = "#E64A19";
const TEXT_COLOR = "#333333";
const SECONDARY_TEXT_COLOR = "#757575";
const BACKGROUND_COLOR = "#f9f9f9";
const CARD_BACKGROUND = "#ffffff";

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("user_id");
      if (!userId) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://masonshop.in/api/order_details?user_id=${userId}`
      );
      const data = await response.json();

      if (data.success === true && data.data) {
        setOrders(data.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load order history.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const unsubscribe = navigation.addListener("focus", fetchOrders);
    return unsubscribe;
  }, [navigation]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "#4CAF50";
      case "pending":
        return "#FF9800";
      case "cancelled":
        return "#F44336";
      case "shipped":
        return "#2196F3";
      case "processing":
        return "#FFC107";
      default:
        return "#757575";
    }
  };

  const renderOrderCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate("OrderDetails", { orderId: item.order_id })
      }
    >
      <Card style={styles.orderCard}>
        {/* HEADER - ORDER ID + STATUS */}
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item.order_id}</Text>

          <View
            style={[
              styles.orderStatusContainer,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.orderStatusText}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* BODY - DATE + AMOUNT */}
        <View style={styles.cardBody}>
          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Order Date</Text>
            <View style={styles.infoRow}>
              <Icon
                name="calendar-month-outline"
                size={18}
                color={SECONDARY_TEXT_COLOR}
              />
              <Text style={styles.infoText}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Total Amount</Text>
            <Text style={styles.orderAmount}>
              ₹{Number(item.final_amount).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate("Invoice", { orderId: item.order_id });
            }}
          >
            <Icon name="file-pdf-box" size={20} color={PRIMARY_COLOR} />
            <Text style={styles.detailsButtonText}>View Invoice</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={{ marginTop: 10, color: SECONDARY_TEXT_COLOR }}>
          Loading Orders...
        </Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={TEXT_COLOR} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>

        <View style={styles.emptyContainer}>
          <Icon name="package-variant-closed" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No orders yet</Text>
          <Text style={{ color: SECONDARY_TEXT_COLOR, marginTop: 5 }}>
            Start shopping now!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={TEXT_COLOR} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {/* LIST */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR,paddingVertical:50 },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
    color: TEXT_COLOR,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 15,
    color: TEXT_COLOR,
  },

  listContent: { padding: 10 },

  orderCard: {
    marginVertical: 10,
    borderRadius: 14,
    backgroundColor: CARD_BACKGROUND,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingBottom: 10,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  orderId: { fontSize: 16, fontWeight: "800", color: TEXT_COLOR },

  orderStatusContainer: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  orderStatusText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
  },

  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  infoGroup: {},

  infoLabel: {
    fontSize: 12,
    color: SECONDARY_TEXT_COLOR,
    marginBottom: 4,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  infoText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: TEXT_COLOR,
  },

  orderAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: PRIMARY_COLOR,
  },

  cardFooter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f2f2f2",
  },

  detailsButton: {
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: PRIMARY_COLOR,
    paddingVertical: 10,
    borderRadius: 8,
  },

  detailsButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "700",
    color: PRIMARY_COLOR,
  },
});

export default OrdersScreen;
