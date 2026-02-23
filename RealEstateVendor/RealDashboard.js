import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  FlatList,
  ImageBackground,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - 20;

// --- MOCK DATA ---
const PROPERTIES = [
  {
    id: '1',
    name: 'GreenVista Heights',
    location: 'Anna Nagar',
    price: '₹98 Lakhs',
    address: '7th Main Road, Anna Nagar West, Chennai',
    specs: { bed: '2 Bedroom', car: '1 Car Parking', bath: '2 Bathroom', sqft: '1000 Sq.Ft' },
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500',
    lastEdit: '15Apr',
  },
  {
    id: '2',
    name: 'Skyline Residency',
    location: 'Anna Nagar',
    price: '₹98 Lakhs',
    address: '7th Main Road, Anna Nagar West, Chennai',
    specs: { bed: '2 Bedroom', car: '1 Car Parking', bath: '2 Bathroom', sqft: '1000 Sq.Ft' },
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500',
    lastEdit: '12Apr',
  },
];

export default function App() {
  const [currentTab, setCurrentTab] = useState('Dashboard'); // Toggle between 'Dashboard' and 'MyProperty'
const navigation=useNavigation();
  // --- RENDER DASHBOARD ---
  const renderDashboard = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
      <View style={styles.headerSection}>
        <Text style={styles.helloText}>Hello</Text>
        <Text style={styles.nameText}>Person Name XXXX</Text>
      </View>

      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800' }} 
        style={styles.banner}
        imageStyle={{ borderRadius: 15 }}
      >
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle}>Property Portfolio at a Glance</Text>
          <Text style={styles.bannerSub}>Track all active, sold, and upcoming listings in one centralized dashboard</Text>
        </View>
      </ImageBackground>

      <Text style={styles.sectionTitle}>Key Performance</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        <View style={[styles.statCard, { backgroundColor: '#6200EE' }]}><Text style={styles.statNum}>7</Text><Text style={styles.statLabel}>New Leads For This Week</Text></View>
        <View style={[styles.statCard, { backgroundColor: '#03A9F4' }]}><Text style={styles.statNum}>20</Text><Text style={styles.statLabel}>Active Listings</Text></View>
        <View style={[styles.statCard, { backgroundColor: '#00C853' }]}><Text style={styles.statNum}>18</Text><Text style={styles.statLabel}>Sold Properties</Text></View>
      </ScrollView>

      <Text style={styles.sectionTitle}>Your Properties</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {PROPERTIES.map((item) => (
          <ImageBackground key={item.id} source={{ uri: item.image }} style={styles.previewCard} imageStyle={{ borderRadius: 10 }}>
            <View style={styles.previewOverlay}>
              <Text style={styles.previewText}>{item.name}, {item.location}</Text>
            </View>
          </ImageBackground>
        ))}
      </ScrollView>
    </ScrollView>
  );

  // --- RENDER MY PROPERTY LISTINGS ---
  

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />
      
      {currentTab === 'Dashboard' ? renderDashboard() : renderMyProperty()}

      {/* BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomNav}>
        <TouchableOpacity>
          <Icon name="view-dashboard-outline" size={24} color={currentTab === 'Dashboard' ? '#700b33' : '#999'} />
          <Text style={[styles.navLabel, currentTab === 'Dashboard' && styles.activeLabel]}>Dashboard</Text>
        </TouchableOpacity>
       
        <TouchableOpacity style={styles.navItem} onPress={()=>navigation.navigate('RealVendorCategory')}
        ><Icon name="book-open-outline" size={24} color="#999" /><Text style={styles.navLabel}>Inquiry</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.centerAddBtn} onPress={()=>navigation.navigate('RealVendorCategory')}><Icon name="plus" size={30} color="#fff" /></TouchableOpacity>

        <TouchableOpacity onPress={()=>navigation.navigate('MyListing')}>
          <Icon name="home-city-outline" size={24} color={currentTab === 'MyProperty' ? '#700b33' : '#999'} />
          <Text style={[styles.navLabel, currentTab === 'MyProperty' && styles.activeLabel]}>My Property</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={()=>navigation.navigate('RealMembership')}>
          <Icon name="account-group-outline" size={24} color="#999" /><Text style={styles.navLabel}>Membership</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#fff' ,paddingVertical:50},
  scrollContainer: { flex: 1 },
  headerSection: { padding: 20 },
  helloText: { fontSize: 32, fontWeight: 'bold', color: '#000' },
  nameText: { fontSize: 18, color: '#666' },
  banner: { height: 200, marginHorizontal: 20, marginBottom: 20, overflow: 'hidden' },
  bannerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', padding: 20, justifyContent: 'center' },
  bannerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', width: '70%' },
  bannerSub: { color: '#ddd', fontSize: 13, marginTop: 10, width: '80%' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 15 },
  horizontalScroll: { paddingLeft: 20, marginBottom: 25 },
  statCard: { width: 150, height: 110, borderRadius: 12, padding: 15, marginRight: 15, justifyContent: 'center' },
  statNum: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: '#fff', fontSize: 11, marginTop: 5 },
  previewCard: { width: 150, height: 150, marginRight: 15 },
  previewOverlay: { flex: 1, justifyContent: 'flex-end', padding: 10, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10 },
  previewText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  
  // My Property Styles
  listContainer: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  filterBtn: { padding: 8, backgroundColor: '#f5f5f5', borderRadius: 8 },
  topTabs: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, marginBottom: 15 },
  topTab: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  topTabActive: { backgroundColor: '#700b33' },
  topTabText: { color: '#888', fontWeight: 'bold' },
  topTabTextActive: { color: '#fff', fontWeight: 'bold' },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 12 },
  propertyCard: { width: CARD_WIDTH, backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#eee', overflow: 'hidden' },
  cardImg: { width: '100%', height: 110 },
  editBadge: { position: 'absolute', top: 5, left: 5, backgroundColor: '#fff', padding: 3, borderRadius: 4 },
  editBadgeText: { fontSize: 8, color: '#666' },
  editIconCircle: { position: 'absolute', top: 5, right: 5, backgroundColor: '#fff', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardContent: { padding: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginRight: 4 },
  forSaleText: { fontSize: 10, color: '#666', flex: 1 },
  priceText: { fontSize: 13, fontWeight: 'bold' },
  addressSmall: { fontSize: 9, color: '#999', marginBottom: 8 },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 10 },
  specItem: { flexDirection: 'row', alignItems: 'center', width: '48%' },
  specTxt: { fontSize: 8, color: '#444' },
  cardActions: { flexDirection: 'row', gap: 4 },
  btnPub: { flex: 2, backgroundColor: '#700b33', borderRadius: 6, paddingVertical: 6, alignItems: 'center' },
  btnSold: { flex: 2, borderWidth: 1, borderColor: '#700b33', borderRadius: 6, paddingVertical: 6, alignItems: 'center' },
  btnDel: { flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  btnTextW: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  btnTextB: { color: '#700b33', fontSize: 10, fontWeight: 'bold' },

  // Bottom Nav
  bottomNav: { flexDirection: 'row', height: 75, borderTopWidth: 1, borderColor: '#eee', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#fff' },
  navItem: { alignItems: 'center' },
  navLabel: { fontSize: 10, color: '#999', marginTop: 4 },
  activeLabel: { color: '#700b33' },
  centerAddBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#555', justifyContent: 'center', alignItems: 'center', marginTop: -30, elevation: 5 },
});