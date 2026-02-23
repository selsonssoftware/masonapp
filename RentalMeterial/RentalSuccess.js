import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SuccessScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    
    // Extract parameters passed from the CartScreen's startPayment
    const { orderId, amount } = route.params || {};

    // Determine the main payment message
    const paidAmount = Number(amount || 0);
    const isCOD = paidAmount <= 1; // Assuming COD if the amount paid is negligible
    
    const paymentMessage = isCOD 
        ? "Payment: Cash On Delivery (COD)"
        : `Advance Paid: ₹${paidAmount.toFixed(2)}`;

    // Prevent going back to the cart after success
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (navigation.isFocused()) {
                // If the user tries to swipe back/use hardware back, stop it
                e.preventDefault(); 
            }
        });
        return unsubscribe;
    }, [navigation]);

    const handleGoHome = () => {
        // Navigate back to the main shop page
        navigation.popToTop(); // Go back to the very first screen
        navigation.navigate('MeterialShop'); 
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#2ecc71" barStyle="light-content" />

            <View style={styles.contentBox}>
                <Ionicons name="checkmark-circle-outline" size={120} color="#2ecc71" />
                
                <Text style={styles.title}>
                    Your Rental Materials Placed Successfully!
                </Text>

                <Text style={styles.message}>
                    Thank you for your order. Your rental request has been received and is being processed.
                </Text>
                
                {/* Order Details Card */}
                <View style={styles.detailCard}>
                    <Text style={styles.detailTitle}>Order Details</Text>
                    <Text style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Order ID:</Text> 
                        <Text style={styles.detailValue}> #{orderId || 'N/A'}</Text>
                    </Text>
                    <Text style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status:</Text> 
                        <Text style={styles.detailValueSuccess}> Confirmed</Text>
                    </Text>
                    <Text style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Payment:</Text> 
                        <Text style={styles.detailValue}> {paymentMessage}</Text>
                    </Text>
                </View>

                <TouchableOpacity 
                    style={styles.homeButton}
                    onPress={handleGoHome}
                >
                    <Ionicons name="storefront-outline" size={20} color="#FFF" style={{ marginRight: 10 }} />
                    <Text style={styles.homeButtonText}>Continue Shopping</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    contentBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 25,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
        marginTop: 20,
    },
    message: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
        marginVertical: 15,
    },
    detailCard: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 10,
        width: '100%',
        marginVertical: 20,
        borderLeftWidth: 5,
        borderLeftColor: '#2ecc71',
        elevation: 3,
    },
    detailTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#34495e',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
    },
    detailRow: {
        fontSize: 14,
        marginVertical: 3,
    },
    detailLabel: {
        fontWeight: '600',
        color: '#34495e',
    },
    detailValue: {
        color: '#2c3e50',
    },
    detailValueSuccess: {
        color: '#2ecc71',
        fontWeight: 'bold',
    },
    homeButton: {
        flexDirection: 'row',
        backgroundColor: '#3498db',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        marginTop: 30,
        alignItems: 'center',
        elevation: 5,
    },
    homeButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default SuccessScreen;