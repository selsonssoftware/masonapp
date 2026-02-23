import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// --- Mock Data ---
const listingImagePlaceholder = { uri: 'https://via.placeholder.com/600x300?text=Property+View' }; 

const mockBookings = [
    {
        id: 'B-1',
        propertyTitle: 'Luxury 2BHK Apartment',
        location: '7th Main Road, Anna Nagar West, Chennai',
        bookingDate: 'Dec 20, 2025',
        bookingTime: '11:00 AM',
        status: 'Confirmed', // Other options: Pending, Cancelled, Completed
        referenceId: 'NB-2025-478923',
        propertyImage: listingImagePlaceholder,
    },
    {
        id: 'B-2',
        propertyTitle: 'Spacious 3BHK Villa',
        location: 'ECR, Neelankarai, Chennai',
        bookingDate: 'Dec 18, 2025',
        bookingTime: '03:00 PM',
        status: 'Pending',
        referenceId: 'NB-2025-478924',
        propertyImage: listingImagePlaceholder,
    },
    {
        id: 'B-3',
        propertyTitle: 'Modern Studio Flat',
        location: 'OMR Road, Sholinganallur',
        bookingDate: 'Dec 10, 2025',
        bookingTime: '05:30 PM',
        status: 'Completed',
        referenceId: 'NB-2025-478925',
        propertyImage: listingImagePlaceholder,
    },
];

// --- Helper Components ---

// Function to get styles based on booking status
const getStatusStyle = (status) => {
    switch (status) {
        case 'Confirmed': return { color: '#fff', backgroundColor: '#5CB85C' }; // Green
        case 'Pending': return { color: '#333', backgroundColor: '#FFC107' }; // Yellow
        case 'Cancelled': return { color: '#fff', backgroundColor: '#D9534F' }; // Red
        case 'Completed': return { color: '#fff', backgroundColor: '#007AFF' }; // Blue
        default: return { color: '#333', backgroundColor: '#eee' };
    }
};

const BookingCard = ({ booking, onViewProperty, onModifyBooking }) => {
    const statusStyle = getStatusStyle(booking.status);
    const isActionable = booking.status === 'Confirmed' || booking.status === 'Pending';

    return (
        <View style={styles.bookingCard}>
            <View style={styles.cardHeader}>
                {/* Image and Basic Info */}
                <Image source={booking.propertyImage} style={styles.cardImage} />
                <View style={styles.infoContainer}>
                    <Text style={styles.propertyTitle}>{booking.propertyTitle}</Text>
                    <Text style={styles.locationText}>{booking.location}</Text>
                    <View style={styles.badgeContainer}>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                            <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>
                                {booking.status}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Date and Time Details */}
            <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeItem}>
                    <Text style={styles.detailIcon}>🗓️</Text>
                    <Text style={styles.detailValue}>{booking.bookingDate}</Text>
                </View>
                <View style={styles.dateTimeItem}>
                    <Text style={styles.detailIcon}>⏱️</Text>
                    <Text style={styles.detailValue}>{booking.bookingTime}</Text>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
                <TouchableOpacity 
                    style={styles.viewPropertyButton}
                    onPress={() => onViewProperty(booking)}
                >
                    <Text style={styles.viewPropertyText}>View Property</Text>
                </TouchableOpacity>

                {isActionable && (
                    <TouchableOpacity 
                        style={[styles.actionButton, isActionable ? styles.actionPrimary : styles.actionDisabled]}
                        onPress={() => onModifyBooking(booking)}
                        disabled={!isActionable}
                    >
                        <Text style={styles.actionButtonText}>
                            {booking.status === 'Confirmed' ? 'Modify/Cancel' : 'Confirm Now'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// --- Main Screen Component ---
const MyBookingsScreen = ({ navigation }) => {
    // State for filtering (e.g., 'Upcoming', 'Past', 'All')
    const [filter, setFilter] = React.useState('Upcoming');

    const filteredData = mockBookings.filter(b => {
        if (filter === 'Upcoming') return b.status === 'Confirmed' || b.status === 'Pending';
        if (filter === 'Past') return b.status === 'Completed';
        return true;
    });

    const handleViewProperty = (booking) => {
        // Real App: navigation.navigate('PropertyDetails', { id: booking.propertyId });
        alert(`Navigating to property: ${booking.propertyTitle}`);
    };

    const handleModifyBooking = (booking) => {
        // Real App: navigation.navigate('BookingModification', { booking: booking });
        alert(`Opening modification for: ${booking.referenceId}`);
    };

    const renderBooking = ({ item }) => (
        <BookingCard 
            booking={item} 
            onViewProperty={handleViewProperty} 
            onModifyBooking={handleModifyBooking}
        />
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Property Viewings</Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabs}>
                {['Upcoming', 'Past', 'All'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[
                            styles.filterTab, 
                            filter === tab && styles.filterTabSelected
                        ]}
                        onPress={() => setFilter(tab)}
                    >
                        <Text style={[
                            styles.filterTabText,
                            filter === tab && styles.filterTabTextSelected
                        ]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredData}
                keyExtractor={(item) => item.id}
                renderItem={renderBooking}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No {filter} bookings found.</Text>
                        <Text style={styles.emptySubText}>Book your first viewing today!</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
};


// --- Stylesheet ---
const CARD_MARGIN = 15;
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8f8f8' },
    
    // --- Header ---
    header: { paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },

    // --- Filter Tabs ---
    filterTabs: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    filterTab: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
    filterTabSelected: { backgroundColor: '#ffe6e6' }, // Light red background
    filterTabText: { fontSize: 14, color: '#666', fontWeight: '500' },
    filterTabTextSelected: { color: '#D9534F', fontWeight: 'bold' }, // Red color

    // --- List Container ---
    listContainer: { paddingHorizontal: CARD_MARGIN, paddingVertical: 10, minHeight: Dimensions.get('window').height - 150 },

    // --- Booking Card ---
    bookingCard: {
        width: width - (CARD_MARGIN * 2),
        backgroundColor: '#fff',
        borderRadius: 10,
        elevation: 3, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginBottom: CARD_MARGIN,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        padding: 15,
        paddingBottom: 10,
    },
    cardImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        resizeMode: 'cover',
    },
    infoContainer: {
        flex: 1,
        marginLeft: 10,
        justifyContent: 'center',
    },
    propertyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    locationText: {
        fontSize: 12,
        color: '#888',
        marginBottom: 5,
    },
    badgeContainer: {
        flexDirection: 'row',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    
    // --- Divider & Date/Time ---
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 15,
    },
    dateTimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dateTimeItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailIcon: {
        fontSize: 14,
        marginRight: 5,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
    },

    // --- Action Row ---
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#fafafa',
    },
    viewPropertyButton: {
        paddingVertical: 10,
    },
    viewPropertyText: {
        fontSize: 13,
        color: '#007AFF', // Blue link
        fontWeight: '500',
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        marginLeft: 10,
    },
    actionPrimary: {
        backgroundColor: '#D9534F', // Main action color (Red)
    },
    actionDisabled: {
        backgroundColor: '#ccc',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },

    // --- Empty State ---
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 50,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
    }
});

export default MyBookingsScreen;