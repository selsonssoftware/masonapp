import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// --- Mock Wishlist Data ---
// Items should match the structure of your API products (rmp_name, rmp_image, price, etc.)
const MOCK_WISHLIST = [
  {
    id: 'P101',
    rmp_name: 'Radial Arm Saw',
    price: 3500,
    rateType: '/Day',
    rating: 4,
    rmp_image: 'https://cdn-icons-png.flaticon.com/512/866/866299.png',
  },
  {
    id: 'P102',
    rmp_name: 'Concrete Vibrator',
    price: 1500,
    rateType: '/Hr',
    rating: 5,
    rmp_image: 'https://cdn-icons-png.flaticon.com/512/7631/7631174.png',
  },
  {
    id: 'P103',
    rmp_name: 'Electric Paint Sprayer',
    price: 1200,
    rateType: '/Day',
    rating: 4,
    rmp_image: 'https://cdn-icons-png.flaticon.com/512/3241/3241480.png',
  },
];

const WishlistScreen = () => {
  const navigation = useNavigation();
  // In a real app, this would be managed by global state or an API call
  const [wishlistItems, setWishlistItems] = useState(MOCK_WISHLIST); 

  // --- Logic to Remove an Item ---
  const removeItemFromWishlist = (itemId) => {
    // In a real app: Call API to remove item from user's list
    console.log(`Removing item: ${itemId}`);
    const updatedList = wishlistItems.filter(item => item.id !== itemId);
    setWishlistItems(updatedList);
  };

  // --- Render Helpers ---

  const renderStars = (rating) => {
    return (
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {[...Array(rating)].map((_, i) => (
          <Ionicons key={i} name="star" size={12} color="#f1c40f" />
        ))}
      </View>
    );
  };

  const renderWishlistItem = ({ item }) => (
    <View style={styles.wishlistCard}>
      
      {/* Remove Button (Heart with a line through it) */}
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeItemFromWishlist(item.id)}
      >
        <Ionicons name="heart-dislike-outline" size={24} color="#F44336" />
      </TouchableOpacity>
      
      <View style={styles.cardContent}>
        <Image 
          source={{ uri: item.rmp_image }} 
          style={styles.productImage} 
          resizeMode="contain" 
        />
        
        <View style={styles.detailsContainer}>
          <Text style={styles.productName}>{item.rmp_name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>₹ {item.price}</Text>
            <Text style={styles.rateType}>{item.rateType}</Text>
          </View>
          {renderStars(item.rating)}
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.rentBtn} 
          onPress={() => navigation.navigate('MeterialShop', { product: item })}
        >
          <Text style={styles.rentBtnText}>RENT NOW</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist ({wishlistItems.length})</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {/* --- Wishlist List --- */}
      <FlatList
        data={wishlistItems}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={renderWishlistItem}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>Your Wishlist is empty.</Text>
            <Text style={styles.subEmptyText}>Save materials here to rent them later!</Text>
            <TouchableOpacity 
                style={styles.browseButton}
                onPress={() => navigation.navigate('MeterialShop')}
            >
                <Text style={styles.browseButtonText}>Start Browsing</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

// --- Stylesheet ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  wishlistCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productImage: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  detailsContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
  },
  rateType: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
    marginBottom: 2,
  },
  rentBtn: {
    backgroundColor: '#3498db',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginLeft: 10,
    height: 38,
    justifyContent: 'center',
  },
  rentBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
  },
  subEmptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  browseButton: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 25,
    elevation: 3,
  },
  browseButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  }
});

export default WishlistScreen;