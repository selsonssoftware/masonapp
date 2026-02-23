import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

export default function CategoriesScreen() {
  const navigation = useNavigation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('https://masonshop.in/api/resale_categoryapi');
      const json = await response.json();
      
      if (json.status && json.data) {
        setCategories(json.data);
      } else {
        // Handle API success=false if needed
        console.log("API Error message:", json.message);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert("Error", "Failed to load categories. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Categories</Text>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {categories.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.categoryItem}
            // Pass the category ID and Name, or subcategory flag if you need logic for that later
            onPress={() => navigation.navigate('AllProducts', { 
              category: item.name, 
              categoryId: item.id,
              hasSubcategory: item.subcategory_avaiable 
            })}
          >
            {/* Image Container - Defaulting to a light gray background since API doesn't send color */}
            <View style={[styles.iconContainer, { backgroundColor: '#F5F5F5' }]}>
              <Image 
                source={{ uri: item.image }} 
                style={styles.categoryImage}
                resizeMode="contain"
              />
            </View>
            
            <Text style={styles.categoryName}>{item.name}</Text>
            
            {/* Right Arrow */}
            <MaterialIcons name="chevron-right" size={24} color="#CCC" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', paddingTop: 40 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#000' },
  listContent: { padding: 15 },
  categoryItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 12, 
    borderRadius: 15, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  iconContainer: { 
    width: 55, 
    height: 55, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden' // Ensures image respects border radius
  },
  categoryImage: {
    width: 40,
    height: 40,
  },
  categoryName: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '600', color: '#333' },
});