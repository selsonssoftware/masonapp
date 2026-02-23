import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

/* --- MOCK DATA --- */
const mockPropertyData = {
  id: 'L-1',
  price: '20,000',
  type: 'For Sale',
  title: 'Luxury 2BHK Apartment in Prime Location',
  location: '7th Main Road, Anna Nagar West, Chennai',
  description:
    'A beautifully designed 2BHK apartment offering modern amenities, excellent connectivity, and a serene living environment.',
  ownerName: 'Mr. Rajesh K.',
  features: [
    'Modular Kitchen',
    'Reserved Parking',
    '24/7 Security',
    'Power Backup',
    'Gymnasium Access',
    'Balcony/Patio',
  ],
  details: {
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1000,
    age: '2 Years',
  },
  image: {
    uri: 'https://via.placeholder.com/600x350?text=Property+Image',
  },
};

/* --- SMALL COMPONENT --- */
const DetailPill = ({ icon, label, value }) => (
  <View style={styles.detailPill}>
    <Text style={styles.detailIcon}>{icon}</Text>
    <Text style={styles.detailValue}>{value}</Text>
    <Text style={styles.detailLabel}>{label}</Text>
  </View>
);

/* --- MAIN SCREEN --- */
const PropertyDetailsScreen = () => {
  const navigation = useNavigation(); // ✅ FIX
  const property = mockPropertyData;

  const handleContactOwner = () => {
    navigation.navigate('RealSuccessScreen'); // ✅ WILL WORK
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        {/* IMAGE */}
        <View style={styles.imageContainer}>
          <Image source={property.image} style={styles.mainImage} />

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{'<'}</Text>
          </TouchableOpacity>

          <View style={styles.imageBadge}>
            <Text style={styles.imageBadgeText}>{property.type}</Text>
          </View>
        </View>

        {/* CONTENT */}
        <View style={styles.contentContainer}>
          <Text style={styles.priceText}>₹{property.price}</Text>
          <Text style={styles.propertyTitle}>{property.title}</Text>
          <Text style={styles.locationText}>{property.location}</Text>

          <View style={styles.quickDetailsRow}>
            <DetailPill icon="🛌" label="Beds" value={property.details.bedrooms} />
            <DetailPill icon="🚿" label="Baths" value={property.details.bathrooms} />
            <DetailPill icon="📐" label="Sq.ft" value={property.details.sqft} />
            <DetailPill icon="🏗️" label="Age" value={property.details.age} />
          </View>

          <Text style={styles.sectionHeader}>Description</Text>
          <Text style={styles.descriptionText}>{property.description}</Text>

          <Text style={styles.sectionHeader}>Amenities</Text>
          <View style={styles.featuresGrid}>
            {property.features.map((item, i) => (
              <View key={i} style={styles.featurePill}>
                <Text style={styles.featureText}>✅ {item}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* STICKY BUTTON */}
      <View style={styles.stickyContactBar}>
        <TouchableOpacity
          style={styles.stickyContactButton}
          onPress={handleContactOwner}
        >
          <Text style={styles.stickyContactButtonText}>
            CONTACT OWNER NOW
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default PropertyDetailsScreen;

/* --- STYLES --- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  imageContainer: { width, height: width * 0.6 },
  mainImage: { width: '100%', height: '100%' },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 35,
    height: 35,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { color: '#fff', fontSize: 18 },
  imageBadge: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 6,
  },
  imageBadgeText: { color: '#fff', fontWeight: 'bold' },
  contentContainer: { padding: 15 },
  priceText: { fontSize: 24, fontWeight: 'bold' },
  propertyTitle: { fontSize: 18, fontWeight: '600' },
  locationText: { color: '#666', marginBottom: 15 },
  quickDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailPill: { width: '24%', alignItems: 'center' },
  detailIcon: { fontSize: 22 },
  detailValue: { fontWeight: 'bold' },
  detailLabel: { fontSize: 12, color: '#777' },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  descriptionText: { color: '#555', lineHeight: 22 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  featurePill: {
    backgroundColor: '#f0faff',
    padding: 6,
    borderRadius: 14,
    marginRight: 6,
    marginBottom: 6,
  },
  featureText: { fontSize: 13 },
  stickyContactBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  stickyContactButton: {
    backgroundColor: '#D9534F',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  stickyContactButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
