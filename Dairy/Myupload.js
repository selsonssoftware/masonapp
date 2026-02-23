import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Linking,
  Dimensions
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';

const COLORS = {
  primary: "#3f229eff",
  bg: "#F8FAFC",
  white: "#FFFFFF",
  muted: "#64748B",
  success: "#10B981", // Green
  danger: "#EF4444",  // Red
  warning: "#F59E0B"  // Yellow
};

const MyDVC = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  
  // States for Logic
  const [cardUrl, setCardUrl] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    let storedId = await AsyncStorage.getItem('user_id');
    if (!storedId) storedId = "M583400"; // Default fallback
    setUserId(storedId);
    fetchMyCard(storedId);
  };

  const fetchMyCard = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`https://masonshop.in/api/digitalcard_profile?user_id=${id}`);
      const json = await response.json();

      if (json.success && json.data.length > 0) {
        const userData = json.data[0];
        setProfile(userData);

        // ✅ 1. GET LINK FROM API (Dynamic)
        // If 'dvc_link' is empty, fallback to the standard URL format
        const finalLink = userData.link || `https://masonshop.in/card/${id}`;
        setCardUrl(finalLink);

        // ✅ 2. GET STATUS FROM API
        const status = userData.status || 'unpublished'; 
        setIsPublished(status.toLowerCase() === 'published');
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching card:", error);
      Alert.alert("Error", "Could not load card details");
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     👉 LOGIC: TOGGLE PUBLISH STATUS
  ============================================================ */
  const handleToggleStatus = async () => {
    // 1. If Published -> Just Unpublish (No checks needed)
    if (isPublished) {
        updateStatusAPI("unpublished");
        return;
    }

    // 2. If Unpublished -> Check Subscription First!
    setProcessing(true);
    try {
      const subRes = await fetch(`https://masonshop.in/api/check_subscription?user_id=${userId}`);
      const subData = await subRes.json();

      // Check if plan is active
      const hasActivePlan = subData.status === true || subData.status === "active";

      if (hasActivePlan) {
        updateStatusAPI("published");
      } else {
        setProcessing(false);
        Alert.alert(
          "Subscription Required",
          "You need an active plan to publish your card.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Buy Plan", onPress: () => navigation.navigate("Membership") }
          ]
        );
      }
    } catch (error) {
      setProcessing(false);
      Alert.alert("Error", "Could not verify subscription. Check internet.");
    }
  };

 const updateStatusAPI = async (newStatus) => {
    setProcessing(true);
    try {
      console.log("🔹 Sending Update:", { userId, newStatus });

      const fd = new FormData();
      fd.append("user_id", userId);
      fd.append("status", newStatus);

      const res = await fetch("https://masonshop.in/api/dvc_updateStatus", {
        method: "POST",
        headers: {
            'Accept': 'application/json', // ✅ Good for Laravel/PHP APIs
            // Do NOT set 'Content-Type' for FormData, let fetch handle it
        },
        body: fd
      });

      const json = await res.json(); // ✅ Parse the response
      console.log("🔹 Server Response:", json);

      // ✅ CHECK IF TRUE SUCCESS
      // Adjust 'json.status' or 'json.success' based on your API response structure
      if (json.status === true || json.success === true || json.message === "Status Updated") {
          setIsPublished(newStatus === "published");
          Alert.alert("Success", `Card is now ${newStatus.toUpperCase()}`);
      } else {
          Alert.alert("Failed", json.message || "Server returned an error.");
      }

    } catch (e) {
      console.error("❌ API Error:", e);
      Alert.alert("Error", "Network Request Failed. Check Console.");
    } finally {
      setProcessing(false);
    }
  };
  /* ============================================================
     👉 LOGIC: OPEN IN-APP BROWSER
  ============================================================ */
  const openCard = async () => {
    if (!cardUrl) return;
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(cardUrl, {
          // Android Properties
          showTitle: true,
          toolbarColor: COLORS.primary,
          secondaryToolbarColor: 'black',
          enableUrlBarHiding: true,
          enableDefaultShare: true,
          forceCloseOnRedirection: false,
          // iOS Properties
          dismissButtonStyle: 'close',
          preferredBarTintColor: COLORS.primary,
          preferredControlTintColor: 'white',
          readerMode: false,
          animated: true,
        });
      } else {
        Linking.openURL(cardUrl); // Fallback to external browser
      }
    } catch (error) {
      Linking.openURL(cardUrl);
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */

  if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={styles.center} />;

  if (!profile) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.muted} />
        <Text style={styles.errorText}>No Card Found</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate("CreateDVC")}>
          <Text style={styles.createBtnText}>Create Card</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Digital Card</Text>
        <TouchableOpacity onPress={() => initialize()}>
          <Ionicons name="refresh" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        
        {/* BIG ICON */}
        <Ionicons name="qr-code-outline" size={80} color={COLORS.primary} style={{marginBottom: 10}} />
        
        <Text style={styles.infoText}>
            Your Digital Card is Ready!
        </Text>

        {/* STATUS BANNER */}
        <View style={[styles.statusBanner, { backgroundColor: isPublished ? '#D1FAE5' : '#FEF3C7' }]}>
             <Ionicons name={isPublished ? "eye" : "eye-off"} size={16} color={isPublished ? COLORS.success : COLORS.warning} />
             <Text style={[styles.statusText, { color: isPublished ? '#065F46' : '#92400E' }]}>
                {isPublished ? "Status: LIVE" : "Status: UNPUBLISHED"}
             </Text>
        </View>

        {/* VIEW BUTTON (In-App Browser) */}
        <TouchableOpacity style={styles.viewBtn} onPress={openCard}>
            <Text style={styles.viewBtnText}>View My Card</Text>
            <Ionicons name="open-outline" size={20} color="white" style={{marginLeft: 10}} />
        </TouchableOpacity>

        {/* ACTIONS ROW */}
        <View style={styles.actionContainer}>
            
            {/* PUBLISH TOGGLE */}
            <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: isPublished ? COLORS.danger : COLORS.success }]}
                onPress={handleToggleStatus}
                disabled={processing}
            >
                {processing ? <ActivityIndicator color="white" size="small" /> : (
                    <>
                        <Ionicons name={isPublished ? "pause-circle" : "cloud-upload"} size={20} color="white" />
                        <Text style={styles.actionText}>{isPublished ? "Unpublish" : "Publish"}</Text>
                    </>
                )}
            </TouchableOpacity>

            {/* SHARE */}
            <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: '#E0E7FF' }]} 
                onPress={() => Share.share({ message: `Check out my card: ${cardUrl}` })}
            >
                <Ionicons name="share-social" size={20} color={COLORS.primary} />
                <Text style={[styles.actionText, { color: COLORS.primary }]}>Share</Text>
            </TouchableOpacity>

        </View>
        
        {/* EDIT BUTTON (Separate Row) */}
        <TouchableOpacity 
            style={styles.editBtn} 
            onPress={() => navigation.navigate("CreateDVC", { data: profile })}
        >
            <Ionicons name="create-outline" size={20} color={COLORS.muted} />
            <Text style={styles.editBtnText}>Edit Card Details</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  header: { height: 60, backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, elevation: 5 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "700" },

  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: -50 },

  infoText: { fontSize: 20, color: COLORS.textMain, marginBottom: 15, fontWeight: '700' },

  statusBanner: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  statusText: { marginLeft: 8, fontWeight: '700', fontSize: 13 },

  /* BIG VIEW BUTTON */
  viewBtn: { 
    backgroundColor: COLORS.primary, 
    width: '90%', 
    height: 55, 
    borderRadius: 30, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 8,
    marginBottom: 25,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5
  },
  viewBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  /* ACTIONS */
  actionContainer: { flexDirection: 'row', gap: 15, width: '90%', marginBottom: 15 },
  actionBtn: { 
    flex: 1, 
    height: 50, 
    borderRadius: 12, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 8,
    elevation: 2 
  },
  actionText: { fontWeight: '700', fontSize: 15, color: 'white' },

  /* EDIT BTN */
  editBtn: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  editBtnText: { color: COLORS.muted, fontWeight: '600', marginLeft: 5 },

  /* LOADING / ERROR */
  createBtn: { marginTop: 20, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  createBtnText: { color: 'white', fontWeight: '700' },
  errorText: { marginTop: 16, fontSize: 16, color: COLORS.muted },
});

export default MyDVC;