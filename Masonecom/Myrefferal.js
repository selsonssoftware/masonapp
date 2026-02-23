import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from "@react-navigation/native";
import { useQuery } from '@tanstack/react-query';

// --- API Constants ---
const BASE_API_URL = 'https://masonshop.in/api/referred_user_details';

// --- API Fetcher ---
const fetchReferrals = async ({ queryKey }) => {
  const [_, userId] = queryKey;
  if (!userId) return null;

  const response = await fetch(`${BASE_API_URL}?referred_by=${userId}`);
  const json = await response.json();

  if (json.status && json.data) {
    return json.data;
  }
  return { ref: [], total_referrals: 0, today_referrals: 0, active_referrals: 0 };
};

// --- Sub-Components ---

const AppHeader = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Referral List</Text>
      <TouchableOpacity style={styles.searchIcon}>
        <Icon name="search" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const InviteLink = ({ userId }) => {
  const referralLink = userId ? `https://masonshop.in/share?ref=${userId}` : 'Loading...';

  const onCopy = () => {
    Clipboard.setString(referralLink);
    Alert.alert("Link Copied", "Your referral link is ready to paste!");
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Join me on Mason! Download the app using my link:\n${referralLink}`,
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <View style={styles.inviteContainer}>
      <Text style={styles.inviteTitle}>Invite Link</Text>
      <View style={styles.linkRow}>
        <View style={styles.linkBox}>
         <Text style={styles.linkText} numberOfLines={1}>{referralLink}</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={onCopy}>
          <Icon name="copy-outline" size={22} color="#E91E63" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={onShare}>
          <Icon name="share-social-outline" size={22} color="#E91E63" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SummaryCard = ({ title, count }) => (
  <View style={styles.card}>
    <Text style={styles.cardCount}>{count}</Text>
    <Text style={styles.cardTitle}>{title}</Text>
  </View>
);

const ReferralItem = ({ item }) => {
  const status = 'Active'; 
  const statusColor = '#81C784'; 
  const profileImage = item.profileImageUrl 
    ? { uri: item.profileImageUrl } 
    : { uri: 'https://i.imgur.com/3fK9xVl.png' }; 

  return (
    <View style={styles.itemContainer}>
      <Image source={profileImage} style={styles.avatar} />
      <View style={styles.infoContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDetails}>+91 {item.phone}</Text>
        <Text style={styles.itemDetails}>ID-{item.user_id}</Text>
      </View>
      <View style={styles.statusContainer}>
        <Text style={[styles.itemStatus, { color: statusColor }]}>{status}</Text>
        <Text style={styles.itemDetails}>N/A</Text> 
      </View>
    </View>
  );
};

// --- Main Screen ---
const ReferralScreen = () => {
  const [userId, setUserId] = useState(null);

  // 1. Get User ID on Mount
  useEffect(() => {
    const loadUser = async () => {
      const id = await AsyncStorage.getItem('user_id');
      if (id) setUserId(id);
    };
    loadUser();
  }, []);

  // 2. React Query Hook
  const { data, isLoading, isError } = useQuery({
    queryKey: ['referrals', userId],
    queryFn: fetchReferrals,
    enabled: !!userId, // Only fetch if userId exists
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
  });

  // 3. Derived State
  const referralList = data?.ref || [];
  const summary = {
    total: data?.total_referrals || 0,
    today: data?.today_referrals || 0,
    active: data?.active_referrals || 0,
  };

  const renderListHeader = () => (
    <>
      <InviteLink userId={userId} />
      <View style={styles.summaryContainer}>
        <SummaryCard title="Total Referral" count={summary.total} />
        <SummaryCard title="Today Referrals" count={summary.today} />
        <SummaryCard title="Active Referral" count={summary.active} />
      </View>
      <Text style={styles.listHeader}>New Referral</Text>
    </>
  );

  // --- Render States ---
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerScreen]}>
        <ActivityIndicator size="large" color="#E91E63" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerScreen]}>
        <Icon name="alert-circle-outline" size={40} color="#E57373" />
        <Text style={styles.errorText}>Failed to load data.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader />
      <FlatList
        data={referralList}
        renderItem={({ item }) => <ReferralItem item={item} />}
        keyExtractor={item => item.user_id.toString()}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={() => (
            referralList.length > 0 ? (
                <TouchableOpacity style={styles.footerButton}>
                    <Text style={styles.footerText}>See More...</Text>
                </TouchableOpacity>
            ) : null
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyList}>No referrals found yet.</Text>}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F8F8', paddingVertical: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#333' },
  searchIcon: { backgroundColor: '#E91E63', borderRadius: 20, padding: 6 },
  listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  inviteContainer: { marginTop: 16, marginBottom: 20 },
  inviteTitle: { fontSize: 16, fontWeight: '600', color: '#555', marginBottom: 8 },
  linkRow: { flexDirection: 'row', alignItems: 'center' },
  linkBox: { flex: 1, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, backgroundColor: '#FFF' },
  linkText: { fontSize: 16, color: '#E91E63', fontWeight: 'bold' },
  iconButton: { marginLeft: 12, padding: 8, borderWidth: 1, borderColor: '#EEE', borderRadius: 8, backgroundColor: '#FFF' },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  card: { width: '31%', backgroundColor: '#FFF', borderRadius: 12, padding: 12, alignItems: 'center', elevation: 3 },
  cardCount: { fontSize: 22, fontWeight: 'bold', color: '#E91E63' },
  cardTitle: { fontSize: 11, color: '#777', marginTop: 4, textAlign: 'center' },
  listHeader: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 },
  itemContainer: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 12, alignItems: 'center', elevation: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  infoContainer: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  itemDetails: { fontSize: 12, color: '#888' },
  statusContainer: { alignItems: 'flex-end' },
  itemStatus: { fontSize: 14, fontWeight: 'bold' },
  footerButton: { paddingVertical: 16, alignItems: 'center' },
  footerText: { fontSize: 16, fontWeight: 'bold', color: '#E91E63' },
  centerScreen: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  errorText: { marginTop: 10, fontSize: 14, color: '#E57373', textAlign: 'center' },
  emptyList: { textAlign: 'center', marginTop: 50, fontSize: 14, color: '#999' }
});

export default ReferralScreen;