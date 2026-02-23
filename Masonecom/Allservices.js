        
import React, { useState } from 'react';
import { View, FlatList, Image, StyleSheet } from 'react-native';
import { Text, Searchbar, Card, Appbar } from 'react-native-paper';

const AllServicesScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState([
    { id: '1', name: 'Plumbing', image: require('../assets/cement.webp') },
    { id: '2', name: 'Electrician', image: require('../assets/cement.webp') },
    { id: '3', name: 'Cleaning', image: require('../assets/cement.webp') },
    { id: '4', name: 'Painting', image: require('../assets/cement.webp') },
    { id: '5', name: 'AC Repair', image: require('../assets/cement.webp') },
    { id: '6', name: 'More Services', image: require('../assets/cement.webp') },
  ]);

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="All Services" titleStyle={styles.appBarTitle} />
      </Appbar.Header>

      <Searchbar
        placeholder="Search Services"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => {
            if (item.name === 'More Services') {
              navigation.navigate('AnotherPage'); // Replace with your screen name
            } else {
              // Handle other services
            }
          }}>
            <Card.Content style={styles.cardContent}>
              <Image source={item.image} style={styles.cardIcon} />
              <Text style={styles.cardText}>{item.name}</Text>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
};

export default AllServicesScreen;


const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    appBar: {
      backgroundColor: '#fff',
      elevation: 0,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    appBarTitle: {
      textAlign: 'center',
      fontSize: 18,
      fontWeight: 'bold',
    },
    searchBar: {
      margin: 10,
      borderRadius: 10,
    },
    card: {
      marginHorizontal: 10,
      marginBottom: 10,
      borderRadius: 10,
      elevation: 2,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardIcon: {
      width: 40,
      height: 40,
      marginRight: 15,
      resizeMode: 'contain',
    },
    cardText: {
      fontSize: 16,
    },
  });
  
  