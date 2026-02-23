import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform, // Import Platform for OS-specific adjustments
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// --- Mock Data (unchanged) ---

const PRODUCT_DATA = {
  name: 'Professional Grade Shovel',
  price: 1000,
  rateType: 'Day',
  rating: 4.2,
  reviews: 100,
  image: 'https://cdn-icons-png.flaticon.com/512/9379/9379669.png',
  description: 'JCB 3DX Backhoe Loader is a very popular name in the heavy construction equipment segment. It is designed with the best segment specifications, which helps provide better work efficiency.',
};

const SPECIFICATIONS = [
  { label: 'Length', value: '48 Inches', icon: 'ruler-square' },
  { label: 'Blade Material', value: '14-Gauge', icon: 'layers' },
  { label: 'Grip Type', value: '14-Gauge', icon: 'layers' },
  { label: 'Grip Type', value: 'D-Grip', icon: 'hand-left' },
];

const SERVICE_PROVIDER = {
  name: 'Pradeep Engineres',
  location: 'Chennai',
  avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
};

const ProductDetailScreen = () => {
  // --- Render Helpers (unchanged) ---

  const navigation=useNavigation();

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={16} color="#f1c40f" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={16} color="#f1c40f" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={16} color="#f1c40f" />);
      }
    }
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };

  const renderSpecification = ({ label, value, icon }) => (
    <View style={styles.specCard}>
      <View style={styles.specIconBox}>
        <MaterialCommunityIcons name={icon} size={24} color="#3498db" />
      </View>
      <Text style={styles.specValue}>{value}</Text>
      <Text style={styles.specLabel}>{label}</Text>
    </View>
  );

  return (
    // 1. Remove padding from SafeAreaView by using a style (only for iOS)
    <SafeAreaView style={styles.container}>
      {/* 2. Make Status Bar translucent/transparent to allow content to go behind it */}
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#FFF" 
        translucent={true} // Key change for Android
      />

      {/* --- Image and Floating Header --- */}
      <View style={styles.imageHeaderContainer}>
        <Image
          source={{ uri: PRODUCT_DATA.image }}
          style={styles.mainImage}
          resizeMode="cover"
        />
        {/* Floating Header Bar */}
        <View style={styles.floatingHeader}>
          <TouchableOpacity style={styles.iconBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{PRODUCT_DATA.name}</Text>
          <TouchableOpacity style={styles.iconShare}>
            <Ionicons name="send-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        {/* Image Action Button (Camera Icon) */}
        <TouchableOpacity style={styles.imageActionButton}>
          <MaterialCommunityIcons name="camera" size={20} color="#FFF" />
          <Text style={{color: '#FFF', fontSize: 12, marginLeft: 2}}>2</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ... (rest of the content) ... */}
        
        {/* --- Pricing and Rating --- */}
        <View style={styles.pricingSection}>
          <View style={styles.priceDetails}>
            <Text style={styles.priceText}>₹ {PRODUCT_DATA.price}</Text>
            <Text style={styles.rateTypeText}> / {PRODUCT_DATA.rateType}</Text>
            <View style={styles.ratingDetails}>
              <Text style={styles.ratingValue}>({PRODUCT_DATA.rating})</Text>
              {renderStars(PRODUCT_DATA.rating)}
              <Text style={styles.reviewCount}>{PRODUCT_DATA.reviews} Reviews</Text>
            </View>
          </View>
          
          <View style={styles.rateToggle}>
            <TouchableOpacity style={[styles.rateToggleBtn, styles.rateToggleBtnActive]}>
              <Text style={styles.rateToggleTextActive}>Day</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rateToggleBtn}>
              <Text style={styles.rateToggleText}>Hour</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- About Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.descriptionText}>{PRODUCT_DATA.description}</Text>
        </View>

        {/* --- Specifications Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specifications</Text>
          <View style={styles.specificationsContainer}>
            {SPECIFICATIONS.map((spec, index) => (
              <React.Fragment key={index}>
                {renderSpecification(spec)}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* --- Service Providers Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Providers</Text>
          <View style={styles.providerCard}>
            <Image source={{ uri: SERVICE_PROVIDER.avatar }} style={styles.providerAvatar} />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{SERVICE_PROVIDER.name}</Text>
              <View style={styles.providerLocation}>
                <Ionicons name="location-outline" size={14} color="#777" />
                <Text style={styles.providerLocationText}>{SERVICE_PROVIDER.location}</Text>
              </View>
            </View>
            <View style={styles.providerActions}>
              <TouchableOpacity style={styles.actionIcon}>
                <MaterialCommunityIcons name="message-text-outline" size={22} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIcon}>
                <Ionicons name="call-outline" size={22} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* --- Floating Footer/Rent Now Button --- */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.rentNowButton} onPress={() => navigation.navigate('RentalSuccess')}>
          <Text style={styles.rentNowButtonText}>Rent Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // 3. Optional: Add paddingTop for Android if not using translucent status bar, 
    // but translucent is better for edge-to-edge design.
  },
  scrollContent: {
    paddingBottom: 100,
  },
  // --- Image & Header Styles ---
  imageHeaderContainer: {
    width: '100%',
    height: width * 0.7,
    marginBottom: 10,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  floatingHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    // 4. KEY CHANGE: Use device-specific height to push content below the status bar/notch area
    paddingTop: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight + 10, 
  },
  iconBack: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 5,
    elevation: 3,
    shadowOpacity: 0.1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  iconShare: {
    padding: 5,
  },
  imageActionButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // --- Pricing & Rating Styles (unchanged) ---
  pricingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  priceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  rateTypeText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginTop: 5,
  },
  ratingDetails: {
    position: 'absolute',
    top: 35,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 14,
    color: '#333',
    marginRight: 5,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  rateToggle: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    padding: 2,
  },
  rateToggleBtn: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  rateToggleBtnActive: {
    backgroundColor: '#3498db',
    elevation: 2,
  },
  rateToggleText: {
    fontSize: 14,
    color: '#666',
  },
  rateToggleTextActive: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: 'bold',
  },
  // --- Generic Section Styles (unchanged) ---
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  // --- Specifications Styles (unchanged) ---
  specificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  specCard: {
    width: (width - 50) / 4,
    alignItems: 'center',
    marginVertical: 5,
  },
  specIconBox: {
    width: 60,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  specValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  specLabel: {
    fontSize: 11,
    color: '#777',
    textAlign: 'center',
  },
  // --- Service Provider Styles (unchanged) ---
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  providerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  providerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  providerLocationText: {
    fontSize: 14,
    color: '#777',
    marginLeft: 4,
  },
  providerActions: {
    flexDirection: 'row',
  },
  actionIcon: {
    backgroundColor: '#EAEAEA',
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  // --- Footer Styles (unchanged) ---
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  rentNowButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rentNowButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProductDetailScreen;