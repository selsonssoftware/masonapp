import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const MembershipFailed = ({ navigation }) => {

 useEffect(() => {
   const timer = setTimeout(() => {
     navigation.replace('DairyList');
   }, 5000);
 
   return () => clearTimeout(timer);
 }, [navigation]);
 

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Icon name="close-circle-outline" size={90} color="#d32f2f" />

      <Text style={styles.title}>Membership Failed</Text>

      <Text style={styles.subtitle}>
        Your membership activation was not successful.
      </Text>

      <Text style={styles.redirectText}>
        Redirecting to home page in 5 seconds...
      </Text>
    </SafeAreaView>
  );
};

export default MembershipFailed;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#d32f2f',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginTop: 10,
  },
  redirectText: {
    marginTop: 30,
    fontSize: 12,
    color: '#999',
  },
});
