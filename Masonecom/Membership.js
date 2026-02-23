import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { Appbar, Card, Text, Button, Portal, Modal } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// --- 1. Define API Fetchers ---

const fetchSubscriptions = async () => {
  const response = await fetch("https://masonshop.in/api/subscriptionAPi");
  const json = await response.json();
  return json.status && json.subscription ? json.subscription : [];
};

const fetchUserStatus = async ({ queryKey }) => {
  const [_, userId] = queryKey;
  if (!userId) return null;
  const response = await fetch(
    `https://masonshop.in/api/check_subscription?user_id=${userId}`
  );
  return await response.json();
};

const MembershipScreen = ({ navigation }) => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);

  // --- 2. Load User ID Once on Mount ---
  useEffect(() => {
    const getUserId = async () => {
      const storedId = (await AsyncStorage.getItem("user_id")) || "M0001";
      setUserId(storedId);
    };
    getUserId();
  }, []);

  // --- 3. React Query Hooks ---

  // Fetch All Subscription Plans
  const { 
    data: subscriptions = [], 
    isLoading: loadingSubs 
  } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: fetchSubscriptions,
  });

  // Fetch Specific User Status (Dependent on userId)
  const { 
    data: userData, 
    isLoading: loadingUser 
  } = useQuery({
    queryKey: ["userSubscription", userId],
    queryFn: fetchUserStatus,
    enabled: !!userId, // Only run if userId exists
  });

  // --- 4. Derived State ---
  const activePlan = userData?.status === "active" ? userData?.data?.subscription_name?.toLowerCase() : null;
  const expiryDate = userData?.data?.subscription_expiry;
  const startDate = userData?.data?.subscription_start;
  
  const loading = loadingSubs || (!!userId && loadingUser);

  // --- Helper Functions ---
  
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPlanIndex = (planName) =>
    subscriptions.findIndex(
      (s) => s.sub_name.toLowerCase() === planName?.toLowerCase()
    );

  const goToPayment = (item) => {
    navigation.navigate("MembershipPaymentScreen", {
      planData: item,
      userId: userId,
    });
  };

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
            
            // Logic to disable lower plans if a higher plan is active
            const currentPlanIdx = activePlan ? getPlanIndex(activePlan) : -1;
            const thisPlanIdx = getPlanIndex(item.sub_name);
            
            const isLower = activePlan && currentPlanIdx > thisPlanIdx;
            const isHigher = !activePlan || currentPlanIdx < thisPlanIdx;

            return (
              <Card
                key={index}
                style={[
                  styles.card,
                  isActive && styles.activeCard,
                  isLower && styles.disabledCard,
                ]}
                onPress={() => isHigher && !isActive && setSelectedSub(item)}
              >
                <View style={styles.row}>
                  <View style={styles.leftBox}>
                    <Image source={{ uri: item.sub_image }} style={styles.icon} />
                  </View>

                  <View style={styles.rightBox}>
                    <Text style={styles.title}>
                      {item.sub_name.charAt(0).toUpperCase() +
                        item.sub_name.slice(1)}{" "}
                      Member
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
                    ) : (
                      <Button
                        mode="outlined"
                        textColor="red"
                        style={styles.renewBtn}
                        labelStyle={{ fontSize: 13, color: "red" }}
                        onPress={() => goToPayment(item)}
                      >
                        {activePlan ? "Upgrade" : "Activate"}
                      </Button>
                    )}
                  </View>
                </View>

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

              <View style={{ marginTop: 12 }}>
                {selectedSub.sub_description.split(",").map((line, idx) => (
                  <Text key={idx} style={styles.modalDesc}>
                    • {line.trim()}
                  </Text>
                ))}
              </View>

              <Button
                mode="contained"
                style={{ marginTop: 20, backgroundColor: 'red' }}
                onPress={() => {
                  setSelectedSub(null);
                  goToPayment(selectedSub);
                }}
              >
                Activate Now
              </Button>

              <Button
                mode="outlined"
                style={{ marginTop: 10, borderColor: 'red' }}
                textColor="red"
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
  card: { marginBottom: 15, padding: 10, borderRadius: 12, elevation: 3, backgroundColor: 'white' },
  activeCard: { borderColor: 'green', borderWidth: 1, backgroundColor: '#f9fff9' },
  disabledCard: { opacity: 0.6, backgroundColor: '#f5f5f5' },
  row: { flexDirection: "row", alignItems: "center" },
  leftBox: { width: "35%", alignItems: "center", justifyContent: "center" },
  rightBox: { width: "65%", paddingLeft: 10 },
  icon: { width: 80, height: 80, resizeMode: "contain" },
  title: { fontSize: 16, fontWeight: "bold", textTransform: 'capitalize' },
  subtitle: { fontSize: 12, color: "#555", marginTop: 2 },
  price: { fontSize: 16, fontWeight: "bold", marginTop: 6, color: '#333' },
  activatedBtn: {
    marginTop: 8,
    backgroundColor: "green",
    alignSelf: "flex-start",
    borderRadius: 6,
  },
  renewBtn: {
    marginTop: 8,
    borderColor: "red",
    alignSelf: "flex-start",
    borderRadius: 6,
  },
  disabledBtn: {
    marginTop: 8,
    borderColor: "gray",
    alignSelf: "flex-start",
    borderRadius: 6,
  },
  modal: { backgroundColor: "white", margin: 20, borderRadius: 12, maxHeight: '80%' },
  modalImage: { width: "100%", height: 150, resizeMode: "contain", marginBottom: 10 },
  modalTitle: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginTop: 4, textTransform: "capitalize" },
  modalPrice: { fontSize: 18, color: "red", textAlign: "center", marginTop: 6, fontWeight: 'bold' },
  modalDesc: { fontSize: 14, color: "#333", marginVertical: 4 },
  badgeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  badgeText: { fontSize: 11, fontWeight: "600", color: "#2E7D32" },
});