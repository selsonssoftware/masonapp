import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from '@react-navigation/native'; // Added for back action

// --- Helper: Income Type Color ---
const getTypeColor = (type) => {
  switch (type) {
    case 'Referral': return '#E91E63';
    case 'Sales': return '#4CAF50';
    case 'Point': return '#2196F3';
    default: return '#222';
  }
};

// --- Header (Fixed Back Button) ---
const AppHeader = () => {
  const navigation = useNavigation(); // Hook for navigation

  return (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()} // This fix makes the arrow work
      >
        <Ionicons name="chevron-back" size={26} color="black" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Income Type</Text>
      <View style={{ width: 40 }} /> 
    </View>
  );
};

// --- Summary Card ---
const SummaryCard = ({ amount, title }) => (
  <View style={styles.card}>
    <Text style={[styles.cardAmount, { color: getTypeColor(title) }]}>
      ₹{amount}
    </Text>
    <Text style={styles.cardTitle}>{title} Income</Text>
  </View>
);

// --- Transaction Item ---
const TransactionItem = ({ item }) => (
  <View style={styles.transactionItem}>
    <View style={styles.profileWrapper}>
      <Image
        source={{
          uri: item.profile_url || "https://i.pravatar.cc/150?u=" + item.user_id,
        }}
        style={styles.profilePic}
      />
    </View>

    <View style={styles.transactionDetails}>
      <Text style={styles.transactionName}>{item.user_name}</Text>
      <Text style={styles.transactionSubText}>ID: {item.user_id}</Text>
      <View style={styles.dateBadge}>
        <Ionicons name="time-outline" size={12} color="#888" />
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
    </View>

    <View style={styles.transactionAmountContainer}>
      <Text style={styles.transactionAmount}>+₹{item.amount}</Text>
      <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '15' }]}>
        <Text style={[styles.transactionType, { color: getTypeColor(item.type) }]}>
          {item.type}
        </Text>
      </View>
    </View>
  </View>
);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ referral: 0, sales: 0, point: 0 });
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchIncomeData();
  }, []);

  const fetchIncomeData = async () => {
    try {
      const userId = await AsyncStorage.getItem("user_id");
      if (!userId) return;
      const res = await fetch(`https://masonshop.in/api/income-details?user_id=${userId}`);
      const json = await res.json();
      if (json.status) {
        setSummary({ referral: json.Referral || 0, sales: json.sales || 0, point: json.point || 0 });
        setList(json.data || []);
      }
    } catch (e) {
      console.log("API ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredList = list.filter(item => 
    item.user_name.toLowerCase().includes(search.toLowerCase()) || 
    item.user_id.toString().includes(search)
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AppHeader />

      <FlatList
        data={filteredList}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.summaryContainer}>
              <SummaryCard amount={summary.referral} title="Referral" />
              <SummaryCard amount={summary.sales} title="Sales" />
              <SummaryCard amount={summary.point} title="Point" />
            </View>

            <View style={styles.searchSection}>
              <Text style={styles.todayTitle}>Recent Transactions</Text>
              <View style={styles.centeredSearchBox}>
                <Ionicons name="search-outline" size={20} color="#999" style={{marginLeft: 12}} />
                <TextInput 
                  placeholder="Search by name or ID..." 
                  style={styles.searchInput} 
                  placeholderTextColor="#999"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
            </View>
          </>
        }
        renderItem={({ item }) => <TransactionItem item={item} />}
        ListEmptyComponent={<Text style={styles.emptyTxt}>No income found</Text>}
        ListFooterComponent={
          <TouchableOpacity style={styles.seeMoreBtn}>
            <Text style={styles.seeMoreText}>See More History</Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff',paddingVertical:20 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#000' },
  summaryContainer: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 10 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderRadius: 16,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardAmount: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  cardTitle: { fontSize: 12, color: '#888', fontWeight: '600' },
  searchSection: { paddingHorizontal: 16, marginTop: 25, marginBottom: 15 },
  todayTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15, color: '#333' },
  centeredSearchBox: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    height: 50,
  },
  searchInput: { flex: 1, paddingHorizontal: 10, fontSize: 15, color: '#000' },
  transactionItem: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#f5f5f5',
    alignItems: 'center',
  },
  profilePic: { width: 50, height: 50, borderRadius: 15 },
  transactionDetails: { flex: 1, paddingLeft: 12 },
  transactionName: { fontSize: 15, fontWeight: '700', color: '#333' },
  transactionSubText: { fontSize: 12, color: '#999', marginTop: 2 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dateText: { fontSize: 11, color: '#888', marginLeft: 4 },
  transactionAmountContainer: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 16, fontWeight: '800', color: '#000' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 6 },
  transactionType: { fontSize: 10, fontWeight: '700' },
  seeMoreBtn: { padding: 20, alignItems: 'center' },
  seeMoreText: { color: '#E91E63', fontWeight: '700', fontSize: 14 },
  emptyTxt: { textAlign: 'center', marginTop: 30, color: '#999' }
});