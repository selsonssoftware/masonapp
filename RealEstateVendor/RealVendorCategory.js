import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
// Import useNavigation from React Navigation
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

// Get screen width to calculate card sizes dynamically if needed
const { width } = Dimensions.get('window');

const categories = [
  {
    id: '1',
    name: 'Apartment',
    image: 'https://cdn-icons-png.flaticon.com/512/2858/2858276.png',
    targetScreen: 'ApartmentUpload', // <-- Dedicated screen for Apartments
  },
  {
    id: '2',
    name: 'Plots',
    image: 'https://cdn-icons-png.flaticon.com/512/8267/8267761.png',
    targetScreen: 'ApartmentUpload', // <-- Dedicated screen for Plots
  },
  {
    id: '3',
    name: 'Villa',
    image: 'https://cdn-icons-png.flaticon.com/512/4604/4604719.png',
    targetScreen: 'ApartmentUpload', // <-- Dedicated screen for Villas
  },
  {
    id: '4',
    name: 'Office',
    image: 'https://cdn-icons-png.flaticon.com/512/3079/3079140.png',
    targetScreen: 'ApartmentUpload', // <-- Dedicated screen for Commercial properties
  },
  // ... continue for other categories
  {
    id: '5',
    name: 'Pg',
    image: 'https://cdn-icons-png.flaticon.com/512/2362/2362243.png',
    targetScreen: 'ApartmentUpload', // Can reuse Apartment form
  },
  // ...
];

const CategoryScreen = () => {
  const navigation = useNavigation();

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      // NEW: Use the targetScreen property from the item object
      onPress={() => {
        if (item.targetScreen) {
          navigation.navigate(item.targetScreen, {
            propertyType: item.name, // Still pass the type for pre-filling
          });
        } else {
          // Fallback or a default screen if targetScreen is not defined
          console.warn(`No target screen defined for ${item.name}`);
          navigation.navigate('DefaultUploadScreen', { propertyType: item.name });
        }
      }}
    >
      <View style={styles.iconContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.cardImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.cardText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    // ... rest of the component (remains the same)
    <SafeAreaView style={styles.container}>
      {/* ... Header and FlatList setup ... */}
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Category</Text>
      </View>

      {/* Grid */}
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// ... (Your existing styles remain the same)
// ... (The rest of your styles.js content)

 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical:50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 10,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 30,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 15, // Spacing between rows
  },
  card: {
    backgroundColor: '#FFF0F5', // The light pink background color
    width: (width / 2) - 25, // Calculate width: (screen width / 2) - padding adjustments
    aspectRatio: 1, // Keeps the card square
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    // Optional: Add shadow if you want depth
    // elevation: 2, 
    // shadowColor: '#000',
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // shadowOffset: { width: 0, height: 2 },
  },
  iconContainer: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: 60,
    height: 60,
  },
  cardText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginTop: 5,
  },
});

export default CategoryScreen;