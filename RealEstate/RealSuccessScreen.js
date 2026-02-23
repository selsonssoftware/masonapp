import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
// NOTE: You would typically import { useNavigation } from '@react-navigation/native';

const { height } = Dimensions.get('window');

// --- Mock Data for Success Message ---
const mockSuccessData = {
    title: 'Booking Confirmed!',
    message: 'Your property viewing request has been successfully submitted to the owner.',
    referenceId: 'NB-2025-478923',
    ownerContactStatus: 'The owner has been notified and will contact you shortly.',
    date: 'Dec 15, 2025',
};

const SuccessScreen = ({ navigation }) => {
    // In a real app, you might receive data via route.params
    const successData = mockSuccessData; 

    // Placeholder functions for navigation actions
    const handleViewDetails = () => {
            
              navigation.navigate('RealEstateHome');
    };

    const handleGoHome = () => {
         navigation.navigate('RealEstateHome');  
        alert('Returning to Home Screen');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                
                {/* 1. Success Icon and Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.iconCircle}>
                        {/* Use a large, distinct success emoji or icon */}
                        <Text style={styles.iconText}>🎉</Text> 
                    </View>
                    <Text style={styles.successTitle}>{successData.title}</Text>
                    <Text style={styles.successMessage}>{successData.message}</Text>
                </View>
                
                {/* 2. Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryHeader}>Booking Summary</Text>
                    
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Reference ID:</Text>
                        <Text style={styles.detailValue}>{successData.referenceId}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Booking Date:</Text>
                        <Text style={styles.detailValue}>{successData.date}</Text>
                    </View>

                    <View style={styles.statusBox}>
                        <Text style={styles.statusText}>
                            ✅ {successData.ownerContactStatus}
                        </Text>
                    </View>
                </View>
                
                {/* 3. Action Buttons */}
                <View style={styles.buttonContainer}>
                    
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.primaryButton]}
                        onPress={handleViewDetails}
                    >
                        <Text style={styles.primaryButtonText}>View Booking Details</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={handleGoHome}
                    >
                        <Text style={styles.secondaryButtonText}>Go to Home</Text>
                    </TouchableOpacity>

                </View>
            </View>
        </SafeAreaView>
    );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        justifyContent: 'space-between', // Distribute content vertically
        alignItems: 'center',
        padding: 25,
    },
    
    // --- Header & Icon Styles ---
    headerContainer: {
        alignItems: 'center',
        marginTop: height * 0.1, // Push down from the top
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#5CB85C', // Green color for success
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    iconText: {
        fontSize: 60,
    },
    successTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    successMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    
    // --- Summary Card Styles ---
    summaryCard: {
        width: '100%',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 20,
        borderLeftWidth: 5,
        borderLeftColor: '#5CB85C', // Green highlight
        marginBottom: 40,
    },
    summaryHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#777',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBox: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#e6ffec', // Very light green background
        borderRadius: 6,
    },
    statusText: {
        fontSize: 13,
        color: '#1e731e', // Darker green text
        textAlign: 'center',
        fontWeight: '500',
    },

    // --- Button Styles ---
    buttonContainer: {
        width: '100%',
        marginBottom: 20,
    },
    actionButton: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    primaryButton: {
        backgroundColor: '#D9534F', // Use your main brand color (Red)
        shadowColor: '#D9534F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 3,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default SuccessScreen;