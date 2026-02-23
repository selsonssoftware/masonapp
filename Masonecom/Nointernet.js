import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';

const { width } = Dimensions.get('window');

export default function NoInternetScreen({ onRetry, isChecking }) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/no-internet.png')}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>No Internet Connection</Text>
      <Text style={styles.subtitle}>Please check your internet connection and try again</Text>
      
      {isChecking ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button
          mode="contained"
          onPress={onRetry}
          style={styles.button}
          contentStyle={{ paddingVertical: 5 }}
        >
          Retry Connection
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC857',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    width: 200,
    borderRadius: 8,
  },
});