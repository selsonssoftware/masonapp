// VehicleDetailScreen.js

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; 

// We'll enrich the data for display purposes
const VEHICLE_EXTRA_SPECS = {
    'V001': {
        transmission: 'Automatic',
        features: ['ABS', 'Airbags', 'GPS', 'Bluetooth'],
        description: 'A reliable and comfortable SUV perfect for city and highway use. Well-maintained and recently serviced.',
    },
    'V002': {
        transmission: 'Manual',
        features: ['7 Seater', 'Climate Control', 'Cruise Control'],
        description: 'The standard for large family travel. Spacious, powerful, and excellent for long-distance trips.',
    },
    'V003': {
        transmission: 'Automatic',
        features: ['Keyless Entry', 'Power Steering', 'Reverse Camera'],
        description: 'An economical and zippy hatchback, ideal for navigating city traffic and easy parking.',
    },
};

const VehicleDetailScreen = ({ route }) => {
    // 1. Get the vehicle data passed from VendorVehiclesScreen
    const { vehicleData } = route.params; 

    // 2. Combine the base data with extra specs (simulating a full data fetch)
    const fullVehicleData = {
        ...vehicleData,
        ...VEHICLE_EXTRA_SPECS[vehicleData.id],
    };

    // Helper component for detail rows
    const DetailRow = ({ label, value, iconName }) => (
        <View style={styles.detailRow}>
            <Icon name={iconName} size={20} color="#757575" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>{label}:</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Available': return '#4CAF50';
            case 'Booked': return '#FF9800';
            case 'Maintenance': return '#F44336';
            default: return '#757575';
        }
    };

    return (
        <ScrollView style={styles.container}>
            
            {/* --- Vehicle Image --- */}
            <Image 
                source={{ uri: fullVehicleData.image }} 
                style={styles.vehicleImage}
            />

            {/* --- Header and Status --- */}
            <View style={styles.header}>
                <View style={styles.headerTextGroup}>
                    <Text style={styles.headerTitle}>{fullVehicleData.make} {fullVehicleData.model}</Text>
                    <Text style={styles.headerSubtitle}>{fullVehicleData.type} - {fullVehicleData.year}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: getStatusColor(fullVehicleData.status) }]}>
                    <Text style={styles.statusTextPill}>{fullVehicleData.status.toUpperCase()}</Text>
                </View>
            </View>

            {/* --- PRICING & REGISTRATION CARD --- */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Pricing & Info</Text>
                <View style={styles.priceContainer}>
                    <Icon name="attach-money" size={24} color="#4CAF50" />
                    <Text style={styles.priceText}>{fullVehicleData.dailyRate} / Day</Text>
                </View>
                <DetailRow label="Registration No" value={fullVehicleData.regNumber} iconName="credit-card" />
                <DetailRow label="ID" value={fullVehicleData.id} iconName="receipt" />
            </View>

            {/* --- SPECIFICATIONS CARD --- */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Detailed Specifications</Text>
                <DetailRow label="Fuel Type" value={fullVehicleData.fuelType} iconName="local-gas-station" />
                <DetailRow label="Transmission" value={fullVehicleData.transmission} iconName="speed" />
                <DetailRow label="Color" value={fullVehicleData.color} iconName="palette" />
            </View>

            {/* --- FEATURES CARD --- */}
            {fullVehicleData.features && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Key Features</Text>
                    <View style={styles.featuresContainer}>
                        {fullVehicleData.features.map((feature, index) => (
                            <View key={index} style={styles.featurePill}>
                                <Icon name="check" size={14} color="#4CAF50" style={{ marginRight: 5 }} />
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* --- DESCRIPTION CARD --- */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Vendor Description</Text>
                <Text style={styles.descriptionText}>{fullVehicleData.description}</Text>
            </View>
            
            {/* --- Action Button --- */}
            <TouchableOpacity style={styles.editButton} onPress={() => console.log('Edit vehicle: ' + fullVehicleData.id)}>
                <Icon name="edit" size={20} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.editButtonText}>Edit Vehicle Details</Text>
            </TouchableOpacity>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    // --- Image Section ---
    vehicleImage: {
        width: '100%',
        height: 250,
        resizeMode: 'cover',
    },
    // --- Header Section ---
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginBottom: 10,
    },
    headerTextGroup: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    statusPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginLeft: 10,
    },
    statusTextPill: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    // --- Cards ---
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginHorizontal: 15,
        marginBottom: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 15,
        color: '#D32F2F', 
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
    },
    // --- Detail Rows ---
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailIcon: {
        marginRight: 10,
    },
    detailLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#555',
        width: 140, 
    },
    detailValue: {
        fontSize: 15,
        color: '#333',
        flex: 1,
    },
    // --- Price ---
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    priceText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginLeft: 5,
    },
    // --- Features Section ---
    featuresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    featurePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    featureText: {
        fontSize: 13,
        color: '#333',
    },
    // --- Description ---
    descriptionText: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
    // --- Action Button ---
    editButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#D32F2F', 
        marginHorizontal: 15,
        paddingVertical: 15,
        borderRadius: 12,
        marginBottom: 20,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
});

export default VehicleDetailScreen;