import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Share,
  Clipboard,
  ActivityIndicator
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// --- API Fetchers ---
const fetchProfile = async ({ queryKey }) => {
  const [_, userId] = queryKey;
  if (!userId) return null;
  const response = await fetch(`https://masonshop.in/api/get_profile_details?id=${userId}`);
  return await response.json();
};

const fetchVendorStatus = async ({ queryKey }) => {
  const [_, userId] = queryKey;
  if (!userId) return null;
  const response = await fetch(`https://masonshop.in/api/vendor_check?user_id=${userId}`);
  return await response.json();
};

const fetchMembership = async ({ queryKey }) => {
  const [_, userId] = queryKey;
  if (!userId) return null;
  const response = await fetch(`https://masonshop.in/api/check_subscription?user_id=${userId}`);
  return await response.json();
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState(null);

  // 1. Get User ID on Mount
  useEffect(() => {
    const loadUser = async () => {
      const id = await AsyncStorage.getItem("user_id");
      if (id) setUserId(id);
      else navigation.replace('LoginScreen');
    };
    loadUser();
  }, []);

  // 2. React Query Hooks (Enabled only when userId exists)
  const { data: profileData, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: fetchProfile,
    enabled: !!userId,
  });

  const { data: vendorData, isLoading: vendorLoading, refetch: refetchVendor } = useQuery({
    queryKey: ['vendor', userId],
    queryFn: fetchVendorStatus,
    enabled: !!userId,
  });

  const { data: memberData, isLoading: memberLoading, refetch: refetchMember } = useQuery({
    queryKey: ['membership', userId],
    queryFn: fetchMembership,
    enabled: !!userId,
  });

  // 3. Refresh Data on Screen Focus
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        refetchProfile();
        refetchVendor();
        refetchMember();
      }
    }, [userId])
  );

  // --- Derived Data ---
  const profile = profileData?.data || {};
  const walletBalance = Number(profileData?.mason_wallet || 0);
  const income = Number(profileData?.income || 0);
  
  const accountType = (vendorData?.status === true && vendorData?.vendor) ? vendorData.vendor.type : null;
  
  const membershipName = memberData?.status === "active" ? memberData.data.subscription_name : "Not Membership";
  const memberStatus = memberData?.status || "inactive";

  const inviteUrl = `https://masonshop.in/share?ref=${userId}`;

  // Membership Image Logic
  let membershipImage = require("../assets/notmember.webp"); 
  if (membershipName === "platinum") membershipImage = require("../assets/platinum.jpeg");
  else if (membershipName === "premium") membershipImage = require("../assets/premium.png");
  else if (membershipName === "vip") membershipImage = require("../assets/vip.png");

  // Actions Logic
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['phone', 'user_id', 'isLoggedIn']);
      // Clear Queries on Logout
      queryClient.removeQueries(); 
      navigation.replace('LoginScreen');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on this app! Download here: ${inviteUrl}`,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  const actions = [
    { label: 'Withdraw', image: require('../assets/Withdraw-image.png'), screen: 'WithdrawScreen' },
    { label: 'Coupon', image: require('../assets/Coupon-image.png'), screen: 'Coupons' },
    { label: 'Transfer', image: require('../assets/Transfer-image.png'), screen: 'TransferScreen' },
    { label: 'Referral', image: require('../assets/Referral-List.png'), screen: 'Myrefferal' },
  ];

  if (profileLoading || vendorLoading || memberLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#e0004f" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Page Navigation */}
      <View style={styles.pageNavigation}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Profile Screen</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: profile?.profile || 'https://img.freepik.com/free-vector/smiling-redhaired-boy-illustration_1308-176664.jpg' }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.name}>{profile?.name ?? "User"}</Text>
            <Text style={styles.phone}>{profile?.phone ?? "N/A"}</Text>
            <Text style={styles.id}>{profile?.user_id}</Text>
          </View>
        </View>
        <View style={styles.helpSection}>
          <Image source={membershipImage} style={styles.premium} />
        </View>
      </View>

      {/* Membership Buttons */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Membership')}
          style={[
            styles.memberBtn,
            memberStatus === "active" ? styles.memberGreen : styles.memberRed
          ]}
        >
          <Text style={styles.memberText}>
            <Text style={styles.memberSmallText}>You Are A</Text>
            {'\n'}
            {membershipName}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('Kyc')}>
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Store / Vehicle Buttons */}
      <View style={styles.row}>
        {accountType === "store" && (
          <TouchableOpacity
            style={styles.box}
            onPress={() => navigation.navigate("StoreDashboard")}
          >
            <Icon name="storefront" size={28} color="#007bff" />
            <Text style={styles.boxText}>Store Dashboard</Text>
          </TouchableOpacity>
        )}

        {accountType === "vehicle" && (
          <TouchableOpacity
            style={styles.box}
            onPress={() => navigation.navigate("VechileDashboard")}
          >
            <Icon name="car" size={28} color="#28a745" />
            <Text style={styles.boxText}>Vehicle Dashboard</Text>
          </TouchableOpacity>
        )}

        {!accountType && (
          <>
            <TouchableOpacity
              style={styles.box}
              onPress={() => navigation.navigate("CreateStore")}
            >
              <Icon name="storefront" size={28} color="#007bff" />
              <Text style={styles.boxText}>Create Store</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.box}
              onPress={() => navigation.navigate("RegisterVechile")}
            >
              <Icon name="car" size={28} color="#28a745" />
              <Text style={styles.boxText}>Register Vehicle</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Invite Link */}
      <Text style={styles.sectionTitle}>Invite Link</Text>
      <View style={styles.inviteBox}>
        <Text style={styles.inviteLink} numberOfLines={1}>{inviteUrl}</Text>
        <TouchableOpacity onPress={() => {
            Clipboard.setString(inviteUrl);
            alert("Link copied!");
        }}>
          <Icon name="copy-outline" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.share} onPress={handleShare}>
          <Icon name="share-social-outline" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Earnings */}
      <View style={styles.card}>
        <View>
          <Text style={styles.cardLabel}>Total Earnings</Text>
          <Text style={styles.cardValue}>₹{income}</Text>
        </View>
        <Text style={styles.todayEarning}>Today Earnings - ₹0.00</Text>
      </View>

      {/* Mason Wallet */}
      <View style={styles.card}>
        <View>
          <Text style={styles.cardLabel}>Mason Wallet</Text>
          <Text style={styles.cardValue}>₹{walletBalance}</Text>
        </View>
        <Text style={styles.todayEarning}>Used Amount - ₹0.00</Text>
      </View>

      {/* Actions Grid */}
      <LinearGradient colors={['#ffc3d1', '#dbfffb']} style={styles.actionsRow}>
        {actions.map((item, idx) => (
          <TouchableOpacity 
            style={styles.actionItem} 
            key={idx}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={styles.imageContainer}>
              <Image source={item.image} style={styles.actionImage} resizeMode="contain" />
            </View>
            <Text style={styles.actionText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </LinearGradient>

      {/* Menu Options */}
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Membership')}>
        <View style={styles.menuImageContainer}>
          <Image source={require('../assets/Membership.png')} style={styles.menuItemImage} />
          <Text>Membership</Text>
        </View>
        <Icon style={styles.icon} name="arrow-forward" size={24} color="#000" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Coupons')}>
        <View style={styles.menuImageContainer}>
          <Image source={require('../assets/coupons.png')} style={styles.menuItemImage} />
          <Text>My Coupons</Text>
        </View>
        <Icon style={styles.icon} name="arrow-forward" size={24} color="#000" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Kyc')}>
        <View style={styles.menuImageContainer}>
          <Image source={require('../assets/KYC.png')} style={styles.menuItemImage} />
          <Text>My Account & KYC</Text>
        </View>
        <Icon style={styles.icon} name="arrow-forward" size={24} color="#000" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MyOrders')}>
        <View style={styles.menuImageContainer}>
          <Image source={require('../assets/My-Orders.png')} style={styles.menuItemImage} resizeMode="contain"/>
          <Text>My Orders</Text>
        </View>
        <Icon style={styles.icon} name="arrow-forward" size={24} color="#000" />
      </TouchableOpacity>

      {/* <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Location', { phone: userId })}>
        <View style={styles.menuImageContainer}>
          <Image source={require('../assets/addresses.png')} style={styles.menuItemImage} resizeMode="contain"/>
          <Text>Addresses</Text>
        </View>
        <Icon style={styles.icon} name="arrow-forward" size={24} color="#000" />
      </TouchableOpacity> */}

      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuImageContainer}>
          <Image source={require('../assets/P&R.png')} style={styles.menuItemImage} resizeMode="contain"/>
          <Text>Payment & Refunds</Text>
        </View>
        <Icon style={styles.icon} name="arrow-forward" size={24} color="#000" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Myrefferal')}>
        <View style={styles.menuImageContainer}>
          <Image source={require('../assets/Referral-List.png')} style={styles.menuItemImage} resizeMode="contain"/>
          <Text>Referral List</Text>
        </View>
        <Icon style={styles.icon} name="arrow-forward" size={24} color="#000" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuImageContainer}>
          <Image source={require('../assets/My-Rewards.png')} style={styles.menuItemImage} resizeMode="contain"/>
          <Text>My Rewards</Text>
        </View>
        <Icon style={styles.icon} name="arrow-forward" size={24} color="#000" />
      </TouchableOpacity>
     
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('RefferalIncome')}>
        <View style={styles.menuImageContainer}>
          <Image source={require('../assets/Income-Report.png')} style={styles.menuItemImage} resizeMode="contain"/>
          <Text>Income Report</Text>
        </View>
        <Icon style={styles.icon} name="arrow-forward" size={24} color="#000" />
      </TouchableOpacity>
     
      <TouchableOpacity style={styles.menuItem} onPress={logout}>
        <View style={styles.menuImageContainer}>
          <Image source={require('../assets/logout.png')} style={styles.menuItemImage} resizeMode="contain"/>
          <Text>Logout</Text>
        </View>
        <Icon style={styles.icon} name="arrow-forward" size={24} color="#000" />
      </TouchableOpacity>

      <View style={{height: 50}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom:20,
    padding: 10,
    backgroundColor: '#fff',
    marginBottom:10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: '#ddd',
  },
  helpSection:{
    flexDirection:'row',
    justifyContent:'space-between',
  },
  premium:{
    marginRight:12,
    marginTop:2,
    width: 55,
    height: 55,
    resizeMode: "contain",
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  phone: {
    color: '#555',
  },
  id: {
    fontSize: 12,
    color: '#888',
  },
  buttonsRow: {
    flexDirection: 'row',
    marginVertical: 16,
    justifyContent: 'space-between',
  },
  memberBtn: {
    flex: 1,
    backgroundColor: '#e0004f',
    marginRight: 8,
    padding: 5,
    borderRadius: 10,
  },
  memberText: {
    color: '#fff',
    fontWeight:'bold',
    textAlign: 'center',
  },
  memberSmallText:{
    fontSize:10,
  },
  memberGreen: {
    backgroundColor: '#2ecc71', 
  },
  memberRed: {
    backgroundColor: '#e74c3c', 
  },
  editBtn: {
    backgroundColor: '#e0004f',
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
    borderRadius: 10,
    padding: 10,
  },
  editText: {
    color: '#fff',
    textAlign: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop:15,
  },
  inviteBox: {
    marginTop:10,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inviteLink: {
    color: '#000',
    flex: 1,
    marginRight: 10,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderColor: '#d10048',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardValue: {
    fontSize: 20,
    color: '#d10048',
    marginTop: 5,
  },
  todayEarning: {
    marginTop: 10,
    color: '#333',
    fontSize: 13,
  },
  actionsRow: {
    backgroundColor:'#eb8b8bff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    padding:15,
  },
  actionItem: {
    alignItems: 'center',
    padding:5,
    borderRadius:10,
  },
  actionText: {
    fontSize: 12,
    marginTop: 4,
  },
  menuItem: {
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    marginBottom: 10,
  },
  share:{
    marginLeft:10,
  },
  actionImage: {
    width: 40,
    height: 30,
    marginBottom: 6,
  },
  imageContainer:{
    padding:3,
    borderColor:'red',
    borderWidth:2,
    borderRadius:7,
    backgroundColor:'white',
  },
  menuImageContainer:{
    flexDirection:'row',
    alignItems:"flex-start",
  },
  menuItemImage:{
    marginTop:2,
    marginRight:5,
    height:20,
    width:30,
  },
  pageNavigation:{
    flexDirection:'row',
    paddingBottom:20,
    paddingTop:30,
  },
  pageTitle:{
    fontWeight:'bold',
    fontSize:20,
    flex:1,
    textAlign:'center',
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingHorizontal: 10,
  },
  box: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginHorizontal: 5,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  boxText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});