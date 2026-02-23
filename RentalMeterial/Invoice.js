import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RNPrint from 'react-native-print';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { ToastAndroid } from 'react-native';



// API Configuration 
const INVOICE_API_URL_BASE = 'https://masonshop.in/api/get_user_order_items';

const InvoiceScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId } = route.params; 

  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Utility to format date/time strings ---
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const datePart = dateString.split(' ')[0];
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year.substring(2)}`; 
  };


  const showDownloadNotification = async () => {

  // create channel (Android)
  const channelId = await notifee.createChannel({
    id: 'invoice',
    name: 'Invoice Downloads',
    importance: AndroidImportance.HIGH,
  });

  // show notification
  await notifee.displayNotification({
    title: 'Invoice Downloaded ✅',
    body: 'Your invoice PDF is ready.',
    android: {
      channelId,
      smallIcon: 'ic_launcher', // default icon
      pressAction: {
        id: 'default',
      },
    },
  });
};

const showToast = () => {
  ToastAndroid.show(
    "Invoice PDF Downloaded ✅",
    ToastAndroid.SHORT
  );
};



  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const timePart = dateString.split(' ')[1];
    return timePart.substring(0, 5); 
  };

  // --- PDF Generation Logic ---
  const downloadInvoicePDF = async () => {
    try {
      if (!invoiceData) return;

      // Map items to HTML table rows for the PDF
      const tableRows = invoiceData.items.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0;">
            <div style="font-size: 14px; font-weight: bold; color: #333;">${item.product_title}</div>
            <div style="font-size: 11px; color: #3498db; margin: 2px 0;">${item.rental_duration_text}</div>
            <div style="font-size: 11px; color: #666; font-style: italic;">
              ₹${item.per_price.toLocaleString('en-IN')} / ${item.duration_unit.substring(0,3)} x ${item.duration_value} ${item.duration_unit} x ${item.quantity} unit
            </div>
          </td>
          <td style="text-align: right; padding: 10px 0; font-weight: bold; font-size: 14px;">
            ₹${item.item_total_amount.toLocaleString('en-IN')}
          </td>
        </tr>
      `).join('');

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; padding: 30px; }
              .header { border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; }
              .header-title { font-size: 28px; font-weight: bold; color: #333; margin: 0; }
              .order-meta { display: flex; justify-content: space-between; margin-top: 10px; font-size: 13px; }
              .section-title { font-size: 16px; font-weight: bold; background: #f0f0f0; padding: 5px 10px; margin-top: 25px; border-radius: 4px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              .address-box { font-size: 12px; color: #444; line-height: 1.6; margin-top: 10px; padding: 10px; border: 1px hide #eee; background: #fafafa; }
              .bill-details { margin-top: 30px; width: 100%; }
              .bill-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
              .grand-total { border-top: 2px solid #3498db; margin-top: 10px; padding-top: 10px; font-size: 18px; font-weight: bold; color: #3498db; }
              .footer { text-align: center; font-size: 10px; color: #999; margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="header-title">INVOICE</h1>
              <div class="order-meta">
                <span><strong>Order ID:</strong> #${invoiceData.order_id}</span>
                <span><strong>Date:</strong> ${invoiceData.order_date[0]}</span>
              </div>
            </div>

            <div class="section-title">Items Rented</div>
            <table>
              <thead>
                <tr style="text-align: left; border-bottom: 1px solid #333;">
                  <th style="padding-bottom: 8px;">Description</th>
                  <th style="text-align: right; padding-bottom: 8px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>

            <div class="section-title">Delivery Details</div>
            <div class="address-box">${invoiceData.delivery_address}</div>

            <div class="bill-details">
              <div class="bill-row"><span>Rental Subtotal</span><span>₹${invoiceData.final_amount.toLocaleString('en-IN')}</span></div>
              <div class="bill-row"><span>Delivery Fee</span><span>₹${(invoiceData.delivery_fee || 0).toLocaleString('en-IN')}</span></div>
              <div class="bill-row grand-total"><span>Grand Total</span><span>₹${invoiceData.final_amount.toLocaleString('en-IN')}</span></div>
              <div class="bill-row" style="color: #27ae60; margin-top: 10px;"><span>Advance Paid</span><span>- ₹${invoiceData.advance_amount.toLocaleString('en-IN')}</span></div>
              <div class="bill-row" style="color: #e74c3c; font-weight: bold; font-size: 16px;"><span>Balance Due</span><span>₹${invoiceData.pending_amount.toLocaleString('en-IN')}</span></div>
            </div>

            <div class="footer">
              Thank you for renting with MasonShop.<br/>
              For support, please contact us with Order ID #${invoiceData.order_id}.
            </div>
          </body>
        </html>
      `;

      await RNPrint.print({ html: htmlContent });
      

// 🔥 SHOW TOP NOTIFICATION
await showDownloadNotification();

showToast();

    } catch (e) {
      Alert.alert("Error", "Failed to generate PDF: " + e.message);
    }
  };

  // --- API Fetch Logic ---
  const fetchInvoiceDetails = async () => {
    setLoading(true);
    setError(null);
    const API_URL = `${INVOICE_API_URL_BASE}?order_id=${bookingId}`; 

    try {
      const response = await fetch(API_URL);
      const json = await response.json();

      if (json && json.status === true && Array.isArray(json.products)) {
        const combinedData = {
          order_status: json.order_status,
          delivery_address: json.address,
          advance_amount: parseFloat(json.advance_amount || 0),
          final_amount: parseFloat(json.final_amount || 0),
          pending_amount: parseFloat(json.pending_amount || 0),
          order_id: bookingId,
          order_date: json.date, 
          delivery_fee: 0, 
          
          items: json.products.map(item => {
             const isHourRental = item.order_type === 'hour';
             const durationValue = isHourRental ? parseInt(item.total_hours || 0) : parseInt(item.total_days || 0);
             const durationUnit = isHourRental ? 'Hours' : 'Days';

             let rentalText = isHourRental 
                ? `Time: ${formatTime(item.start_date)} - ${formatTime(item.close_date)}`
                : `Date: ${formatDate(item.start_date)} - ${formatDate(item.close_date)}`;
             
             return {
                product_title: item.rmp_name,
                image_url: item.rmp_image,
                quantity: parseInt(item.quantity || 1), 
                item_status: item.item_status,
                item_total_amount: parseFloat(item.total_price || 0), 
                per_price: parseFloat(item.per_price || 0),
                rental_duration_text: rentalText, 
                duration_value: durationValue, 
                duration_unit: durationUnit,   
             };
          })
        };
        setInvoiceData(combinedData); 
      } else {
        throw new Error(json.message || "Order details not found.");
      }
    } catch (e) {
      setError("Failed to load invoice.");
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetails();
  }, [bookingId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading Order #{bookingId}...</Text>
      </View>
    );
  }

  if (error || !invoiceData) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={40} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchInvoiceDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const order = invoiceData;

  const renderItemRow = (item, index) => (
    <View key={index} style={styles.itemRow}>
        <Image source={{ uri: item.image_url }} style={styles.itemImage} resizeMode="cover" />
        <View style={styles.itemNameContainer}>
             <Text style={styles.itemName} numberOfLines={2}>{item.product_title}</Text>
             <Text style={styles.itemDuration}>{item.rental_duration_text}</Text>
             <Text style={styles.itemCalculation}>
                ₹{item.per_price.toLocaleString('en-IN')} / {item.duration_unit.substring(0, 3)}. x {item.duration_value} {item.duration_unit} x {item.quantity} unit
             </Text>
        </View>
        <View style={styles.itemPriceContainer}>
            <Text style={styles.itemStatusBadge}>{item.item_status.toUpperCase()}</Text>
            <Text style={styles.itemPrice}>₹{item.item_total_amount.toLocaleString('en-IN')}</Text>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9F9" />
      
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Invoice</Text>
        <TouchableOpacity onPress={downloadInvoicePDF} style={styles.pdfButton}>
            <Ionicons name="download-outline" size={26} color="#3498db" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <DetailLine label="Order ID" value={`#${order.order_id}`} bold />
            <DetailLine label="Order Status" value={order.order_status} status={order.order_status} />
            <DetailLine label="Order Date" value={order.order_date[0] || 'N/A'} />
        </View>

        <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Items Rented</Text>
            {order.items.map(renderItemRow)}
            <View style={styles.separator} />
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            <Text style={styles.addressText}>{order.delivery_address || 'N/A'}</Text>
        </View>
        
        <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Bill Details</Text>
            <DetailLine label="Rental Subtotal" value={order.final_amount.toLocaleString('en-IN')} bold />
            <DetailLine label="Delivery Fee" value={`₹${(order.delivery_fee || 0).toLocaleString('en-IN')}`} />
            <View style={styles.separator} />
            <View style={styles.totalRow}>
                <Text style={styles.totalText}>Grand Total</Text>
                <Text style={styles.totalText}>₹{order.final_amount.toLocaleString('en-IN')}</Text>
            </View>
        </View>
        
        <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <DetailLine label="Advance Paid" value={`₹${order.advance_amount.toLocaleString('en-IN')}`} color="#2ecc71" />
            <View style={styles.separator} />
            <DetailLine 
                label="Amount Due (Pending)" 
                value={`₹${order.pending_amount.toLocaleString('en-IN')}`} 
                bold 
                color={order.pending_amount > 0 ? '#e74c3c' : '#2ecc71'} 
            />
        </View>

        <Text style={styles.footerNote}>
            Thank you for renting with us. For support, please contact us with Order ID #{order.order_id}.
        </Text>
      </ScrollView>

      {/* Floating Action Button for better visibility */}
      <TouchableOpacity style={styles.fab} onPress={downloadInvoicePDF}>
        <Ionicons name="print" size={24} color="#FFF" />
        <Text style={styles.fabText}>DOWNLOAD PDF</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const DetailLine = ({ label, value, bold, color, status }) => {
    const statusLower = (status || '').toLowerCase();
    const statusStyle = statusLower === 'pending' ? styles.statusPending : 
                        statusLower === 'active' ? styles.statusActive : 
                        statusLower === 'cancelled' ? styles.statusCancelled : styles.statusDefault;

    return (
        <View style={styles.detailLine}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={[styles.detailValue, bold && { fontWeight: 'bold' }, color && { color: color }, status && [styles.statusBase, statusStyle]]}>
                {value}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9F9F9', }, 
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center'},
    loadingText: { marginTop: 10, color: '#666' },
    errorText: { color: '#e74c3c', marginVertical: 10 },
    retryButton: { backgroundColor: '#3498db', padding: 10, borderRadius: 20 },
    retryButtonText: { color: '#FFF' },
    
    screenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#FFF', elevation: 2 ,paddingVertical:40 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    backButton: { padding: 5 },
    pdfButton: { padding: 5 },

    scrollContent: { padding: 15, paddingBottom: 100 },
    sectionCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 10 },
    
    detailLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    detailLabel: { fontSize: 14, color: '#666' },
    detailValue: { fontSize: 14, color: '#333' },
    addressText: { fontSize: 13, color: '#444', backgroundColor: '#F9F9F9', padding: 10, borderRadius: 8 },

    itemRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    itemImage: { width: 50, height: 50, borderRadius: 6, marginRight: 12 },
    itemNameContainer: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: 'bold' },
    itemCalculation: { fontSize: 11, color: '#888', marginTop: 4 },
    itemDuration: { fontSize: 12, color: '#3498db', marginTop: 2 },
    itemPriceContainer: { alignItems: 'flex-end' },
    itemStatusBadge: { fontSize: 9, fontWeight: 'bold', color: '#27ae60', backgroundColor: '#e8f5e9', padding: 3, borderRadius: 4 },
    itemPrice: { fontSize: 15, fontWeight: 'bold', marginTop: 5 },

    separator: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10 },
    totalText: { fontSize: 16, fontWeight: 'bold' },
    
    statusBase: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, fontSize: 12, overflow: 'hidden' },
    statusActive: { backgroundColor: '#E8F5E9', color: '#2ecc71' }, 
    statusPending: { backgroundColor: '#FFF3E0', color: '#f39c12' }, 
    statusCancelled: { backgroundColor: '#FFEBEE', color: '#F44336' },
    statusDefault: { backgroundColor: '#EEE', color: '#333' },
    footerNote: { fontSize: 11, color: '#999', textAlign: 'center', marginTop: 10 },

    fab: { position: 'absolute', bottom: 20, right: 20, left: 20, backgroundColor: '#3498db', height: 50, borderRadius: 25, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 5 },
    fabText: { color: '#FFF', fontWeight: 'bold', marginLeft: 10 }
});

export default InvoiceScreen;