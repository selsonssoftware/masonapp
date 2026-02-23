import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  Appbar,
  Card,
  Text,
  Button,
  Portal,
  Modal,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CFEnvironment,
  CFSession,
  CFThemeBuilder,
  CFDropCheckoutPayment,
} from "cashfree-pg-api-contract";
import { CFPaymentGatewayService } from "react-native-cashfree-pg-sdk";

const MembershipScreen = ({ navigation }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [expiryDate, setExpiryDate] = useState(null);
  const [startDate, setStartDate] = useState(null); // 👈 added start date
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUserId = (await AsyncStorage.getItem("user_id")) || "M0001";
      setUserId(storedUserId);

      // Check user subscription
      const checkRes = await fetch(
        `https://masonshop.in/api/check_subscription?user_id=${storedUserId}`
      );
      const checkJson = await checkRes.json();
      if (checkJson.status === "active" && checkJson.data) {
        setActivePlan(checkJson.data.subscription_name?.toLowerCase());
        setExpiryDate(checkJson.data.subscription_expiry);
        setStartDate(checkJson.data.subscription_start); // 👈 save start date
      }

      fetchSubscriptions();
    } catch (err) {
      console.error("Error loading user:", err);
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("https://masonshop.in/api/subscriptionAPi");
      const json = await response.json();
      if (json.status && json.subscription) {
        setSubscriptions(json.subscription);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Payment Integration
  const startPayment = async (item) => {
    try {
      const totalAmount = Number(item.sub_amt);

      if (isNaN(totalAmount) || totalAmount <= 0) {
        Alert.alert("Invalid amount", "Subscription amount is invalid.");
        return;
      }

      const orderPayload = {
        order_amount: totalAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: userId,
          customer_name: "Test User",
          customer_email: "samy9843@gmail.com",
          customer_phone: "9843860940",
        },
      };

      const res = await fetch("https://sandbox.cashfree.com/pg/orders", {
        method: "POST",
        headers: {
             "x-client-id": Config.CASHFREE_CLIENT_ID,
    "x-client-secret": Config.CASHFREE_CLIENT_SECRET,

          "x-api-version": "2023-08-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!data.payment_session_id) throw new Error(JSON.stringify(data));

      const { payment_session_id, order_id } = data;
      const session = new CFSession(
        payment_session_id,
        order_id,
        CFEnvironment.SANDBOX
      );

      const theme = new CFThemeBuilder()
        .setNavigationBarBackgroundColor("#E64A19")
        .setNavigationBarTextColor("#FFFFFF")
        .setButtonBackgroundColor("#FFC107")
        .setButtonTextColor("#FFFFFF")
        .setPrimaryTextColor("#212121")
        .setSecondaryTextColor("#757575")
        .build();

      const dropPayment = new CFDropCheckoutPayment(session, null, theme);
      CFPaymentGatewayService.doPayment(dropPayment);

      // Simulate callback (replace with actual SDK callback)
      setTimeout(async () => {
        try {
          const apiResponse = await fetch(
            "https://masonshop.in/api/sub_active",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: userId,
                amount: totalAmount,
                transaction_id: order_id,
                subscription_id: item.sub_id,
              }),
            }
          );

          const apiData = await apiResponse.json();

          if (apiData?.status === "success") {
            if (apiData.data?.transaction_id && apiData.data?.subscription_start) {
              await AsyncStorage.setItem(
                "active_subscription",
                JSON.stringify(item)
              );
              setActivePlan(item.sub_name.toLowerCase());
              setStartDate(apiData.data.subscription_start);
              setExpiryDate(apiData.data.subscription_expiry);

              navigation.replace("DVCsuccess", {
                user_id: userId,
                session: payment_session_id,
                package_name: item.sub_name,
                package_image: item.sub_image,
                amount: totalAmount,
                status: "success",
              });
            } else {
              navigation.replace("DVCfailed", {
                package_name: item.sub_name,
                package_image: item.sub_image,
                amount: totalAmount,
                status: "failed",
                message: "Plan already active",
              });
            }
          } else {
            navigation.replace("DVCfailed", {
              package_name: item.sub_name,
              package_image: item.sub_image,
              amount: totalAmount,
              status: "failed",
              message: apiData.message || "Payment failed",
            });
          }
        } catch (apiErr) {
          console.error("Backend API Error:", apiErr);
          navigation.replace("DVCfailed", {
            package_name: item.sub_name,
            package_image: item.sub_image,
            amount: totalAmount,
            status: "failed",
          });
        }
      }, 2000);
    } catch (err) {
      console.error("Payment Error:", err);
      navigation.replace("DVCfailed", {
        package_name: item.sub_name,
        package_image: item.sub_image,
        amount: item.sub_amt,
        status: "failed",
      });
    }
  };

  // Helpers
  const getPlanIndex = (planName) =>
    subscriptions.findIndex(
      (s) => s.sub_name.toLowerCase() === planName.toLowerCase()
    );

  return (
    <View style={styles.container}>
      <Appbar.Header style={{ backgroundColor: "#fff" }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#000" />
        <Appbar.Content
          title="Membership Details"
          titleStyle={{ fontSize: 18, fontWeight: "bold" }}
        />
        <Button compact mode="text" textColor="red">
          Help
        </Button>
      </Appbar.Header>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="red" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 15 }}>
          {subscriptions.map((item, index) => {
            const isActive = activePlan === item.sub_name.toLowerCase();
            const isLower =
              activePlan &&
              getPlanIndex(activePlan) > getPlanIndex(item.sub_name);
            const isHigher =
              activePlan &&
              getPlanIndex(activePlan) < getPlanIndex(item.sub_name);

            return (
              <Card
              key={index}
              style={[
                styles.card,
                isActive && styles.activeCard,
                isLower && styles.disabledCard,
              ]}
              onPress={() => isHigher && setSelectedSub(item)}
            >
              <View style={styles.row}>
                <View style={styles.leftBox}>
                  <Image source={{ uri: item.sub_image }} style={styles.icon} />
                </View>
            
                <View style={styles.rightBox}>
                  <Text style={styles.title}>
                    {item.sub_name.charAt(0).toUpperCase() + item.sub_name.slice(1)} Member
                  </Text>
            
                  <Text style={styles.subtitle} numberOfLines={2}>
                    {item.sub_description}
                  </Text>
                  <Text style={styles.price}>₹ {item.sub_amt}</Text>
            
                  {isActive ? (
                    <Button
                      mode="contained"
                      style={styles.activatedBtn}
                      labelStyle={{ fontSize: 13, color: "white" }}
                    >
                      Already Active
                    </Button>
                  ) : isLower ? (
                    <Button
                      mode="outlined"
                      disabled
                      style={styles.disabledBtn}
                      labelStyle={{ fontSize: 13, color: "gray" }}
                    >
                      Not Available
                    </Button>
                  ) : isHigher ? (
                    <Button
                      mode="outlined"
                      textColor="red"
                      style={styles.renewBtn}
                      labelStyle={{ fontSize: 13, color: "red" }}
                      onPress={() => startPayment(item)}
                    >
                      Upgrade
                    </Button>
                  ) : (
                    <Button
                      mode="outlined"
                      textColor="red"
                      style={styles.renewBtn}
                      labelStyle={{ fontSize: 13, color: "red" }}
                      onPress={() => startPayment(item)}
                    >
                      Activate
                    </Button>
                  )}
                </View>
              </View>
            
              {/* ✅ Modern Badge Bottom-Right */}
              {isActive && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {startDate ? `Start: ${formatDate(startDate)}` : ""}
                  </Text>
                  <Text style={styles.badgeText}>
                    {expiryDate ? `End: ${formatDate(expiryDate)}` : ""}
                  </Text>
                </View>
              )}
            </Card>
            
            );
          })}
        </ScrollView>
      )}

      {/* Modal */}
      <Portal>
        <Modal
          visible={!!selectedSub}
          onDismiss={() => setSelectedSub(null)}
          contentContainerStyle={styles.modal}
        >
          {selectedSub && (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Image
                source={{ uri: selectedSub.sub_image }}
                style={styles.modalImage}
              />
              <Text style={styles.modalTitle}>{selectedSub.sub_name}</Text>
              <Text style={styles.modalPrice}>
                Rs. {selectedSub.sub_amt} / Annual
              </Text>

              {activePlan === selectedSub.sub_name.toLowerCase() && (
  <View style={{ marginTop: 10 }}>
    {(startDate || expiryDate) && (
      <View style={styles.badgeContainer}>
        {startDate && (
          <Text style={styles.badgeText}>
            Start: {formatDate(startDate)}
          </Text>
        )}
        {expiryDate && (
          <Text style={styles.badgeText}>
            Expiry: {formatDate(expiryDate)}
          </Text>
        )}
      </View>
    )}
  </View>
)}


              <View style={{ marginTop: 12 }}>
                {selectedSub.sub_description.split(",").map((line, idx) => (
                  <Text key={idx} style={styles.modalDesc}>
                    • {line.trim()}
                  </Text>
                ))}
              </View>

              {activePlan === selectedSub.sub_name.toLowerCase() ? (
                <Button mode="contained" style={{ marginTop: 20 }}>
                  Already Active
                </Button>
              ) : (
                <Button
                  mode="contained"
                  style={{ marginTop: 20 }}
                  onPress={() => {
                    setSelectedSub(null);
                    startPayment(selectedSub);
                  }}
                >
                  Activate Now
                </Button>
              )}
              <Button
                mode="outlined"
                style={{ marginTop: 10 }}
                onPress={() => setSelectedSub(null)}
              >
                Close
              </Button>
            </ScrollView>
          )}
        </Modal>
      </Portal>
    </View>
  );
};

export default MembershipScreen;


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  card: {
    marginBottom: 15,
    padding: 10,
    borderRadius: 12,
    elevation: 3,
  },
  row: { flexDirection: "row", alignItems: "center" },
  leftBox: { width: "40%", alignItems: "center", justifyContent: "center" },
  rightBox: { width: "60%", paddingLeft: 10 },
  icon: { width: "100%", height: 100, resizeMode: "contain" },
  title: { fontSize: 16, fontWeight: "bold" },
  subtitle: { fontSize: 12, color: "#555", marginTop: 2 },
  price: { fontSize: 14, fontWeight: "bold", marginTop: 6 },
  activatedBtn: {
    marginTop: 6,
    backgroundColor: "green",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 0,
    borderRadius: 6,
    minHeight: 26,
  },
  renewBtn: {
    marginTop: 6,
    borderColor: "red",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 0,
    borderRadius: 6,
    minHeight: 26,
  },

  // Modal Styles
  modal: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 12,
  },
  modalImage: {
    width: "100%",
    height: 120,
    resizeMode: "contain",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 4,
    textTransform: "capitalize",
  },
  modalPrice: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginTop: 6,
  },
  modalDesc: { fontSize: 14, color: "#333", marginVertical: 4 },
  badgeContainer: {
    flexDirection: "row",        // row layout
    justifyContent: "space-between", // space between start and end
    alignItems: "center",
    backgroundColor: "#E8F5E9",  // light green background
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    marginTop: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E7D32", // green text
  },
  
  
});
