import React, { useState } from 'react';
import Share from 'react-native-share';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    RefreshControl,
    ScrollView
} from "react-native";
import { useQuery } from '@tanstack/react-query'; // NEW
import Ionicons from 'react-native-vector-icons/Ionicons';
import Clipboard from '@react-native-clipboard/clipboard';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get("window");

// Constants
const STALE_TIME = 5 * 60 * 1000; // 5 Minutes
const COLORS = {
    primary: "#3f229eff",
    bg: "#FFFFFF",
    white: "#FFFFFF",
    lightBg: "#F4F7FA",
    textMain: "#1F2937",
    textSub: "#6B7280",
};

const DVCQR = ({ navigation }) => {
    const [refreshing, setRefreshing] = useState(false);

    /* ========================= DATA FETCHING ========================= */

    const { data: userData, isLoading, refetch } = useQuery({
        queryKey: ['user_qr_data'],
        queryFn: async () => {
            const storedUserId = await AsyncStorage.getItem('user_id');
            if (!storedUserId) throw new Error("No user session found");

            const res = await fetch(`https://masonshop.in/api/get_templates?user_id=${storedUserId}`);
            const json = await res.json();

            if (json.data && json.data.length > 0) {
                return json.data[0];
            }
            return null;
        },
        staleTime: STALE_TIME,
        onError: (err) => {
            Alert.alert("Error", "Failed to load QR details. Please try again.");
            console.error(err);
        }
    });

    /* ========================= ACTIONS ========================= */

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const copyToClipboard = () => {
        if (userData?.link) {
            Clipboard.setString(userData.link);
            Alert.alert('Copied!', `Link has been copied to clipboard.`);
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
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <FontAwesome size={20} name="arrow-left" style={{ color: "white" }} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Back</Text>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
            >
                {isLoading && !refreshing ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
                ) : (
                    <View style={styles.contentWrapper}>
                        <Text style={styles.titleText}>Download and Share your QR</Text>

                        {/* QR Code Container */}
                        <View style={styles.qrContainer}>
                            {userData?.qr_code ? (
                                <Image
                                    style={styles.qrImage}
                                    source={{ uri: userData.qr_code }}
                                    resizeMode="contain"
                                />
                            ) : (
                                <Text style={{ color: COLORS.textSub }}>No QR Code Available</Text>
                            )}
                            <Text style={styles.scanMeText}>Scan Me</Text>
                        </View>

                        {/* Dynamic Referral Code / Link */}
                        <Text style={styles.referralText}>Referral Code : {userData?.link || "N/A"}</Text>

                        {/* Action Buttons Row */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity onPress={copyToClipboard} style={styles.actionBtn}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="copy" size={20} color={COLORS.primary} />
                                </View>
                                <Text style={styles.actionText}>Copy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionBtn}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="download" size={20} color={COLORS.primary} />
                                </View>
                                <Text style={styles.actionText}>Download</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={shareDVC} style={styles.actionBtn}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="share-social-sharp" size={20} color={COLORS.primary} />
                                </View>
                                <Text style={styles.actionText}>Share</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* MINIMAL FLOATING BOTTOM NAV */}
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.lightBg },
    header: {
        height: 60,
        width: "100%",
        alignItems: "center",
        backgroundColor: COLORS.primary,
        flexDirection: "row",
        paddingHorizontal: 20,
    },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "700", marginLeft: 15 },
    scrollContent: { flexGrow: 1, paddingBottom: 120 },
    contentWrapper: { alignItems: 'center', width: '100%' },
    titleText: {
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 40,
        color: "#2c2c2cff",
    },
    qrContainer: {
        marginVertical: 30,
        padding: 20,
        borderWidth: 3,
        borderRadius: 20,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    qrImage: { width: 180, height: 180 },
    scanMeText: { fontSize: 22, fontWeight: "bold", color: COLORS.primary, marginTop: 15 },
    referralText: { fontSize: 14, color: COLORS.textMain, fontWeight: '600', paddingHorizontal: 20, textAlign: 'center' },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "center",
        gap: 30,
        width: '80%',
        marginVertical: 30,
    },
    actionBtn: { alignItems: 'center', gap: 8 },
    iconCircle: {
        padding: 10,
        borderWidth: 2,
        borderRadius: 50,
        borderColor: COLORS.primary,
        backgroundColor: 'white'
    },
    actionText: { color: COLORS.textMain, fontSize: 12 },
    bottomNavWrapper: { position: 'absolute', bottom: 25, left: 0, right: 0, alignItems: 'center' },
    bottomNav: {
        width: width * 0.9,
        height: 70,
        backgroundColor: COLORS.white,
        borderRadius: 35,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        alignItems: 'center',
        elevation: 15,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 15,
    },
    bNavItem: { alignItems: 'center', flex: 1 },
    bNavText: { fontSize: 10, color: COLORS.textSub, marginTop: 4 },
    centerSearch: {
        backgroundColor: COLORS.primary,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -10,
        elevation: 5
    }
});

export default DVCQR;