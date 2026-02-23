import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ImageBackground, 
  Dimensions, 
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons'; 
import { useQuery } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');
const SPACING = 12;
const ITEM_WIDTH = (width - (SPACING * 3)) / 2;

// --- Vibrant Gradient Overlays ---
const OVERLAYS = [
  ['transparent', 'rgba(255, 107, 107, 0.85)'], // Red
  ['transparent', 'rgba(78, 205, 196, 0.85)'],  // Teal
  ['transparent', 'rgba(69, 183, 209, 0.85)'],  // Blue
  ['transparent', 'rgba(255, 160, 122, 0.85)'], // Salmon
  ['transparent', 'rgba(155, 89, 182, 0.85)'],  // Purple
  ['transparent', 'rgba(255, 159, 67, 0.85)'],  // Orange
];

// --- API Fetcher ---
const fetchCategories = async () => {
  const response = await fetch('https://masonshop.in/api/category_api');
  const json = await response.json();
  return Array.isArray(json?.data) ? json.data : [];
};

const AllCategoryPage = () => {
  const navigation = useNavigation();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 60,
  });

  const goBack = () => navigation.goBack();

  const renderItem = ({ item, index }) => {
    // Cycle through overlay colors
    const gradientColors = OVERLAYS[index % OVERLAYS.length];

    return (
      <Animatable.View 
        animation="zoomIn" 
        duration={600} 
        delay={index * 100} 
        style={{ width: ITEM_WIDTH, marginBottom: SPACING }}
      >
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => navigation.navigate("ShopPage", { category_id: item.id })}
          style={styles.cardContainer}
        >
          <ImageBackground
            source={{ uri: item.image }}
            style={styles.imageBackground}
            imageStyle={{ borderRadius: 20 }}
          >
            {/* Colorful Transparent Gradient Overlay */}
            <LinearGradient 
              colors={gradientColors} 
              style={styles.gradientOverlay}
            >
              <View style={styles.textWrapper}>
                <Text style={styles.categoryTitle} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.iconBadge}>
                  <Icon name="arrow-forward" size={14} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Icon name="arrow-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={{width: 26}} />
      </View>

      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
    letterSpacing: 0.5,
  },
  backBtn: {
    padding: 5,
  },

  // List
  listPadding: { 
    padding: SPACING,
    paddingTop: 10,
    paddingBottom: 50,
  },
  row: { 
    justifyContent: 'space-between',
  },

  // Card Structure
  cardContainer: {
    height: ITEM_WIDTH * 1.4, // Tall Portrait Card
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    backgroundColor: '#fff', // Fallback
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'flex-end', // Pushes gradient to bottom
  },
  
  // Overlay
  gradientOverlay: {
    height: '50%', // Covers bottom half
    justifyContent: 'flex-end',
    padding: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  
  // Content
  textWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  categoryTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    textTransform: 'capitalize',
    width: '80%',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
});

export default AllCategoryPage;