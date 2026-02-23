import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import confetti from '../assets/confetti.png';
import success from '../assets/success.png';

const REDIRECT_DELAY_MS = 4000; // 4 seconds

export default function FinalVendorScreen({ route }) {
  const { vehicleId } = route.params || {};
  const [vendorDetails, setVendorDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  // State to track the countdown for display purposes
  const [countdown, setCountdown] = useState(REDIRECT_DELAY_MS / 1000);

  const handleGoHome = () => {
    try {
      // Navigate to the main tabs, resetting the stack if possible
      navigation.navigate('HomeVechile');
    } catch {
      // Fallback if MainTabs is not directly available in current stack
      navigation.popToTop();
    }
  };

  // --- Automatic Redirect Effect ---
  useEffect(() => {
    // Start countdown for display
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set the timeout for navigation
    const timer = setTimeout(handleGoHome, REDIRECT_DELAY_MS);

    // Cleanup function to clear the timer and interval if the component unmounts
    // or if the effect re-runs (though vehicleId is static here)
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []); // Empty dependency array means this runs only once on mount

  // --- Data Fetching Effect (Existing Logic) ---
  useEffect(() => {
    if (!vehicleId) {
      setError('Missing vehicle id');
      setLoading(false);
      return;
    }

    const fetchVendorDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`https://masonshop.in/api/getVehicleDetails?id=${vehicleId}`);
        const json = await res.json();
        if (!res.ok || !json || !json.data || !Array.isArray(json.data) || json.data.length === 0) {
          throw new Error(json?.message || 'Invalid response from server');
        }

        setVendorDetails(json.data[0]);
      } catch (err) {
        console.error('Error fetching vendor details:', err);
        setError(err.message || 'Failed to load vendor details');
        setVendorDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorDetails();
  }, [vehicleId]);

  const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value ?? '—'}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={confetti} style={styles.confettiBackground} />

      <View style={styles.header}>
        <Image source={success} style={styles.successIcon} />
        <Text style={styles.title}>Your Booking is Successful!</Text>
        <Text style={styles.subtitle}>You can find the Vendor details below.</Text>
        {/* Display the countdown */}
        <Text style={styles.countdownText}>
            Redirecting to Home in **{countdown}** seconds...
        </Text>
      </View>

      <View style={styles.vendorCard}>
        {loading ? (
          <View style={{ padding: 30, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#ff732e" />
            <Text style={{ marginTop: 10 }}>Loading vendor details...</Text>
          </View>
        ) : error ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#c00', marginBottom: 8 }}>Failed to load details</Text>
            <Text style={{ color: '#666', textAlign: 'center' }}>{error}</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={() => {
              // Quick way to trigger data fetch retry (re-run the effect)
              setLoading(true);
              setError(null);
              setVendorDetails(null); 
            }}>
              <Text style={styles.actionBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Image
              source={{
                uri: vendorDetails?.logo || 'https://commons.wikimedia.org/wiki/File:Portrait_Placeholder.png',
              }}
              style={styles.vendorImage}
            />

            <View style={styles.infoContainer}>
              <Text style={styles.vendorName}>{vendorDetails?.vendor_name ?? 'Vendor'}</Text>

              <View style={styles.detailsGroup}>
                <DetailRow label="Store Name" value={vendorDetails?.store_name?.trim?.() ?? vendorDetails?.store_name} />
                <DetailRow label="Phone/Whatsapp" value={vendorDetails?.phone} />
                <DetailRow label="Vehicle Number" value={vendorDetails?.vehicle_number} />
                <DetailRow label="City" value={vendorDetails?.city} />
                <TouchableOpacity style={styles.goHomeBtn} onPress={handleGoHome}>
                  <Text style={styles.goHomeText}>Go back to Home!</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>

      <View style={{ marginTop: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff8e8ff',
  },
  confettiBackground: {
    position: 'absolute',
    width: '100%',
    height: 300,
    opacity: 0.3,
    top: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  successIcon: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  countdownText: { // New style for the countdown message
    fontSize: 14,
    color: '#ff732e',
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  vendorCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  vendorImage: {
    width: '100%',
    height: 180,
  },
  infoContainer: {
    padding: 20,
  },
  vendorName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  detailsGroup: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  goHomeBtn: {
    alignSelf: 'center',
    backgroundColor: '#ff732e',
    marginTop: 20,
    padding: 12,
    width: '100%',
    borderRadius: 10,
  },
  goHomeText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  actionBtn: {
    marginTop: 14,
    backgroundColor: '#ff732e',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});