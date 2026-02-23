import React from 'react';
import Share from 'react-native-share';
import {
    View, Text, StyleSheet, Image, TouchableOpacity,
    Dimensions, Alert, SafeAreaView, ScrollView, Linking, ActivityIndicator
} from "react-native";
import { useQuery } from '@tanstack/react-query'; // NEW
import Ionicons from 'react-native-vector-icons/Ionicons';
import Clipboard from '@react-native-clipboard/clipboard';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get("window");

const STALE_TIME = 5 * 60 * 1000; // 5 Minutes
const COLORS = {
    primary: "#3f229eff",
    accent: "#6366F1",
    bg: "#F8FAFC",
    white: "#FFFFFF",
    textMain: "#1F2937",
    textSub: "#6B7280",
    cardBg: "#FFFFFF",
    border: "#E5E7EB"
};

const MyDVC = ({ navigation }) => {

    /* ========================= DATA FETCHING ========================= */

    const { data: userData, isLoading, refetch } = useQuery({
        queryKey: ['my_template_data'],
        queryFn: async () => {
            const storedUserId = await AsyncStorage.getItem('user_id');
            if (!storedUserId) return null;

            const res = await fetch(`https://masonshop.in/api/get_templates?user_id=${storedUserId}`);
            const json = await res.json();

            if (json.data && json.data.length > 0) {
                return json.data[0];
            }
            return null;
        },
        staleTime: STALE_TIME,
    });

    /* ========================= ACTIONS ========================= */

    const copyToClipboard = () => {
        if (userData?.link) {
            Clipboard.setString(userData.link);
            Alert.alert('Copied!', 'Link has been copied to the clipboard.');
        }
    };

    const openInBrowser = async () => {
        const link = userData?.link;
        if (link) {
            const supported = await Linking.canOpenURL(link);
            if (supported) {
                await Linking.openURL(link);
            } else {
                Alert.alert("Error", "Cannot open this URL.");
            }
        }
    };

    const shareDVC = async () => {
        try {
            await Share.open({
                title: 'Share Digital Visiting Card',
                message: 'Check out my Digital Visiting Card!',
                url: userData?.link || userData?.qr_code,
            });
        } catch (err) {
            console.log(err);
        }
    };

    /* ========================= RENDER ========================= */

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <FontAwesome size={18} name="arrow-left" color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Digital Card</Text>
            </View>

            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Profile Section */}
                    <View style={styles.profileCard}>
                        <View style={styles.profileInfo}>
                            <Text style={styles.greeting}>Hello,</Text>
                            <Text style={styles.userName}>
                                {userData?.profile?.person_name || "User Name"}
                            </Text>
                            <Text style={styles.userBio}>
                                {userData?.profile?.jobroll || "No job description provided."}
                            </Text>
                        </View>
                        <Image
                            source={{ uri: "https://thumbs.dreamstime.com/b/carpenter-workshop-work-working-wood-91282856.jpg" }}
                            style={styles.profileImage}
                        />
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{userData?.total_viewers || "0"}</Text>
                            <Text style={styles.statLabel}>Views</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>
                                {userData?.status == "1" ? "Active" : "Inactive"}
                            </Text>
                            <Text style={styles.statLabel}>Status</Text>
                        </View>
                    </View>

                    {/* Info Section */}
                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                            <View style={styles.infoTextGroup}>
                                <Text style={styles.infoLabel}>Subscription Date</Text>
                                <Text style={styles.infoValue}>{userData?.subscriptiondate || "-"}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="time-outline" size={20} color="#EF4444" />
                            <View style={styles.infoTextGroup}>
                                <Text style={styles.infoLabel}>Expiry Date</Text>
                                <Text style={styles.infoValue}>{userData?.expirydate || "-"}</Text>
                            </View>
                        </View>
                    </View>

                    {/* QR & Share Section */}
                    <View style={styles.qrCard}>
                        <Text style={styles.actionTitle}>Share Your Card</Text>
                        <Text style={styles.actionSub}>Scan or share the link below</Text>

                        <View style={styles.qrContainer}>
                            {userData?.qr_code ? (
                                <Image source={{ uri: userData.qr_code }} style={styles.qrImage} resizeMode="contain" />
                            ) : (
                                <View style={styles.qrPlaceholder}>
                                    <Text style={styles.infoLabel}>QR Not Available</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.linkBox}>
                            <Text style={styles.linkText} numberOfLines={1}>
                                {userData?.link || "No link found"}
                            </Text>
                        </View>

                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity style={styles.actionBtn} onPress={copyToClipboard}>
                                <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                                    <Ionicons name="copy-outline" size={22} color={COLORS.primary} />
                                </View>
                                <Text style={styles.actionBtnText}>Copy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionBtn} onPress={shareDVC}>
                                <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                                    <Ionicons name="share-social-outline" size={22} color={COLORS.primary} />
                                </View>
                                <Text style={styles.actionBtnText}>Share</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionBtn} onPress={openInBrowser}>
                                <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                                    <Ionicons name="globe-outline" size={22} color="#16A34A" />
                                </View>
                                <Text style={styles.actionBtnText}>Open</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            )}

            {/* Bottom Navigation */}
            <View style={styles.bottomNavWrapper}>
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.bNavItem} onPress={() => navigation.navigate("DairyList")}>
                        <Ionicons name="home" size={22} color={COLORS.primary} />
                        <Text style={styles.bNavText}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bNavItem} onPress={() => navigation.navigate("CreateDVC")}>
                        <FontAwesome name="plus-circle" size={22} color={COLORS.primary} />
                        <Text style={styles.bNavText}>Create</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.centerSearch}>
                        <FontAwesome name="search" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bNavItem} onPress={() => navigation.navigate("MyDVC")}>
                        <FontAwesome name="qrcode" size={22} color={COLORS.primary} />
                        <Text style={styles.bNavText}>QR Code</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bNavItem} onPress={() => navigation.navigate("Myupload")}>
                        <FontAwesome name="id-card-o" size={22} color={COLORS.primary} />
                        <Text style={[styles.bNavText, { color: COLORS.primary, fontWeight: '700' }]}>My DVC</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

// ... Styles remain identical to your provided code ...
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { height: 60, backgroundColor: COLORS.primary, flexDirection: "row", alignItems: "center", paddingHorizontal: 20 },
    backBtn: { marginRight: 15 },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "700" },
    scrollContent: { padding: 20, paddingBottom: 120 },
    profileCard: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 15, padding: 20, alignItems: 'center', elevation: 2 },
    profileInfo: { flex: 1, paddingRight: 10 },
    greeting: { fontSize: 14, color: COLORS.textSub },
    userName: { fontSize: 24, fontWeight: '800', color: COLORS.textMain, marginVertical: 4 },
    userBio: { fontSize: 13, color: COLORS.textSub, lineHeight: 18 },
    profileImage: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eee' },
    statsRow: { flexDirection: 'row', gap: 15, marginVertical: 20 },
    statBox: { flex: 1, backgroundColor: COLORS.white, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    statNumber: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
    statLabel: { fontSize: 12, color: COLORS.textSub, marginTop: 4 },
    infoSection: { backgroundColor: COLORS.white, borderRadius: 15, padding: 15, marginBottom: 20 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    infoTextGroup: { marginLeft: 15 },
    infoLabel: { fontSize: 12, color: COLORS.textSub },
    infoValue: { fontSize: 15, fontWeight: '600', color: COLORS.textMain },
    qrCard: { backgroundColor: COLORS.white, borderRadius: 15, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, elevation: 2 },
    actionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textMain },
    actionSub: { fontSize: 13, color: COLORS.textSub, textAlign: 'center', marginTop: 5, marginBottom: 15 },
    qrContainer: { width: 200, height: 200, justifyContent: 'center', alignItems: 'center', marginBottom: 20, backgroundColor: '#f0f0f0', borderRadius: 10, padding: 10 },
    qrImage: { width: '100%', height: '100%' },
    qrPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    linkBox: { backgroundColor: '#F3F4F6', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 20 },
    linkText: { color: COLORS.textMain, fontWeight: '500', fontSize: 14 },
    actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingHorizontal: 10 },
    actionBtn: { alignItems: 'center', justifyContent: 'center' },
    iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    actionBtnText: { fontSize: 12, color: COLORS.textMain, fontWeight: '600' },
    bottomNavWrapper: { position: 'absolute', bottom: 25, left: 0, right: 0, alignItems: 'center' },
    bottomNav: { width: width * 0.9, height: 70, backgroundColor: COLORS.white, borderRadius: 35, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, alignItems: 'center', elevation: 15 },
    bNavItem: { alignItems: 'center', flex: 1 },
    bNavText: { fontSize: 10, color: COLORS.textSub, marginTop: 4 },
    centerSearch: { backgroundColor: COLORS.primary, width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: -10, elevation: 5 }
});

export default MyDVC;