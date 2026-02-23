import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const MembershipSuccess = ({ navigation }) => {

 useEffect(() => {
  const timer = setTimeout(() => {
    navigation.replace('UserResale');
  }, 5000);

  return () => clearTimeout(timer);
}, [navigation]);


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Icon
        name="check-circle-outline"
        size={90}
        color="#2e7d32"
      />

      <Text style={styles.title}>Membership Activated</Text>

      <Text style={styles.subtitle}>
        Your membership has been activated successfully.
      </Text>

      <Text style={styles.redirectText}>
        Redirecting to home page in 5 seconds...
      </Text>
    </SafeAreaView>
  );
};

export default MembershipSuccess;

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
    color: '#2e7d32',
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
