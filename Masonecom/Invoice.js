import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNPrint from 'react-native-print';
import notifee, { AndroidImportance } from '@notifee/react-native';

/* ================= COLORS ================= */
const PRIMARY_COLOR = '#E64A19';
const BACKGROUND_COLOR = '#ECEFF4';
const CARD_BG_GLASS = 'rgba(255,255,255,0.95)';
const TEXT_DARK = '#263238';
const TEXT_MUTED = '#78909C';
const BORDER_COLOR = 'rgba(255,255,255,0.7)';

const InvoiceScreen = ({ navigation, route }) => {
  const { orderId } = route.params;

  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [invoiceDetails, setInvoiceDetails] = useState({
    invoiceNumber: `#INV${orderId}`,
    status: 'Paid',
    invoiceFrom: {
      name: 'MyShop Mason',
      address: 'No.29, NH1, Maraimalai Nagar, Tamil Nadu',
      email: 'support@masonshop.in',
      phone: '+91 98765 43210',
    },
    payTo: { name: 'Customer', address: '' },
    payment_option: 'full',
    coupon_type: 'discount', 
    coupon_code: '',
    item_total: 0,
    discount_amount: 0,
    wallet_amount: 0,
    booking_amount: 0,
    remaining_amount: 0,
    final_amount: 0,
  });

  /* ================= FETCH LOGIC ================= */
  const fetchOrderItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://masonshop.in/api/order_items?order_id=${orderId}`);
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const itemsFromApi = data.data || [];
        setItems(itemsFromApi);
        const first = itemsFromApi?.[0] || {};
        
        // Use API total_amount if available, otherwise calculate from items
        const calculatedTotal = itemsFromApi.reduce((sum, item) => sum + Number(item.total || (item.price * item.quantity) || 0), 0);
        const apiItemTotal = Number(data.total_amount) || calculatedTotal;

        setDeliveryAddress(first.delivery_address || first.address || '');
        
        setInvoiceDetails(prev => ({
          ...prev,
          payment_option: data.payment_option || 'full',
          coupon_type: (data.coupon_type || '').toLowerCase(),
          coupon_code: data.coupon_code || '',
          item_total: apiItemTotal,
          // Mapping exact API response keys with fallbacks
          discount_amount: Number(data.coupon_amt || data.discount_amount || 0),
          wallet_amount: Number(data.mason_wallet || data.wallet_amount_used || data.wallet_amount || 0),
          booking_amount: Number(data.booking_amount || 0),
          remaining_amount: Number(data.remaining_amount || 0),
          final_amount: Number(data.final_amount || 0),
          payTo: {
            name: first.customer_name || first.user_name || 'Customer',
            address: first.billing_address || first.delivery_address || 'Address not available',
          },
        }));
      } else {
        setError('Failed to load invoice');
      }
    } catch (err) {
      setError('Error fetching invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrderItems(); }, [orderId]);

  const isCashback = invoiceDetails.coupon_type === 'cashback';

  /* ================= NOTIFICATION LOGIC ================= */
  const requestPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
    return true;
  };

  const showNotification = async () => {
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });
    await notifee.displayNotification({
      title: 'Invoice Generated',
      body: `Your invoice ${invoiceDetails.invoiceNumber} is ready.`,
      android: { channelId, smallIcon: 'ic_launcher', color: PRIMARY_COLOR },
    });
  };

  /* ================= PDF WITH TABLE DESIGN ================= */
  const handleDownloadInvoice = async () => {
    try {
      setIsDownloading(true);
      await requestPermission();

      const tableRows = items.map((item, index) => `
        <tr style="border-bottom: 1px solid #edeff2;">
          <td style="padding: 12px 8px; text-align: center; color: #555;">${index + 1}</td>
          <td style="padding: 12px 8px;">
            <div style="font-weight: bold; color: #263238; font-size: 14px;">${item.product_name}</div>
          </td>
          <td style="padding: 12px 8px; text-align: center; color: #555;">${item.quantity}</td>
          <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: #263238;">₹${Number(item.total || (item.amount * item.quantity)).toFixed(2)}</td>
        </tr>
      `).join('');

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; color: #263238; margin: 0; padding: 40px; }
              .header-table { width: 100%; margin-bottom: 40px; }
              .invoice-title { color: ${PRIMARY_COLOR}; font-size: 32px; font-weight: bold; margin: 0; }
              .info-box { width: 100%; margin-bottom: 30px; }
              .info-column { width: 50%; vertical-align: top; }
              .label { color: #78909C; font-size: 10px; text-transform: uppercase; margin-bottom: 5px; font-weight: bold; }
              
              /* ITEMS TABLE DESIGN */
              .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .items-table th { background-color: #f8f9fa; color: #78909C; font-size: 11px; text-transform: uppercase; padding: 12px 8px; border-bottom: 2px solid ${PRIMARY_COLOR}; }
              
              .summary-table { width: 100%; margin-top: 30px; }
              .summary-row { display: flex; justify-content: flex-end; }
              .summary-box { width: 280px; background-color: #fefefe; border: 1px solid #edeff2; border-radius: 8px; padding: 15px; border-left: 4px solid ${PRIMARY_COLOR}; }
              .total-line { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
              .grand-total { border-top: 1px solid #edeff2; padding-top: 10px; margin-top: 10px; font-weight: bold; color: ${PRIMARY_COLOR}; font-size: 16px; }
              .footer { text-align: center; margin-top: 50px; color: #78909C; font-size: 11px; border-top: 1px solid #edeff2; padding-top: 20px; }
            </style>
          </head>
          <body>
            <table class="header-table">
              <tr>
                <td>
                  <h1 class="invoice-title">INVOICE</h1>
                  <div style="color: #78909C; font-size: 14px;">${invoiceDetails.invoiceNumber}</div>
                </td>
                <td style="text-align: right;">
                  <div style="background: #4CAF50; color: white; padding: 6px 15px; border-radius: 20px; display: inline-block; font-size: 12px; font-weight: bold;">PAID</div>
                </td>
              </tr>
            </table>

            <table class="info-box">
              <tr>
                <td class="info-column">
                  <div class="label">Invoice From</div>
                  <div style="font-weight: bold;">${invoiceDetails.invoiceFrom.name}</div>
                  <div style="font-size: 12px; color: #555; width: 200px;">${invoiceDetails.invoiceFrom.address}</div>
                </td>
                <td class="info-column" style="text-align: right;">
                  <div class="label">Billed To</div>
                  <div style="font-weight: bold;">${invoiceDetails.payTo.name}</div>
                  <div style="font-size: 12px; color: #555; width: 200px; margin-left: auto;">${invoiceDetails.payTo.address}</div>
                </td>
              </tr>
            </table>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 50px;">#</th>
                  <th style="text-align: left;">Item Description</th>
                  <th style="width: 80px;">Qty</th>
                  <th style="width: 100px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>

            <div class="summary-row" style="margin-top: 30px; text-align: right;">
               <div style="display: inline-block; text-align: left;" class="summary-box">
                  <div class="total-line"><span>Item Total:</span><span>₹${invoiceDetails.item_total.toFixed(2)}</span></div>
                  
                  ${invoiceDetails.wallet_amount > 0 ? `<div class="total-line"><span>Wallet Used:</span><span style="color: #D32F2F">- ₹${invoiceDetails.wallet_amount.toFixed(2)}</span></div>` : ''}
                  
                  ${invoiceDetails.discount_amount > 0 && !isCashback ? `<div class="total-line"><span>Coupon Discount ${invoiceDetails.coupon_code ? `(${invoiceDetails.coupon_code})` : ''}:</span><span style="color: #D32F2F">- ₹${invoiceDetails.discount_amount.toFixed(2)}</span></div>` : ''}
                  
                  ${invoiceDetails.booking_amount > 0 ? `<div class="total-line"><span>Advance Paid:</span><span style="color: #D32F2F">- ₹${invoiceDetails.booking_amount.toFixed(2)}</span></div>` : ''}
                  
                  <div class="total-line grand-total">
                    <span>${invoiceDetails.payment_option === 'booking' ? 'Balance Due' : 'Grand Total'}</span>
                    <span>₹${invoiceDetails.payment_option === 'booking' ? invoiceDetails.remaining_amount.toFixed(2) : invoiceDetails.final_amount.toFixed(2)}</span>
                  </div>

                  ${isCashback && invoiceDetails.discount_amount > 0 ? `
                  <div class="total-line" style="color: #2E7D32; margin-top: 10px; font-weight: bold; font-size: 14px; border-top: 1px dashed #ccc; padding-top: 5px;">
                    <span>Cashback Pending:</span><span>+ ₹${invoiceDetails.discount_amount.toFixed(2)}</span>
                  </div>` : ''}

               </div>
            </div>

            <div class="footer">
              Thank you for business with MyShop Mason!<br/>
              This is a system-generated document.
            </div>
          </body>
        </html>
      `;

      await RNPrint.print({ html: htmlContent });
      await showNotification();
    } catch (err) {
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  /* ================= APP UI ================= */
  if (loading) return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} color={PRIMARY_COLOR} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Invoice</Text>
          <Text style={styles.headerSubtitle}>Order ID: {orderId}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleDownloadInvoice} style={styles.actionButton}>
            {isDownloading ? <ActivityIndicator size="small" color={PRIMARY_COLOR} /> : <Icon name="printer-eye" size={26} color={PRIMARY_COLOR} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.glassCard, styles.invoiceHeaderCard]}>
          <View>
            <Text style={styles.invoiceLabel}>Invoice Number</Text>
            <Text style={styles.invoiceNumber}>{invoiceDetails.invoiceNumber}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Icon name="check-circle-outline" size={16} color="#fff" />
            <Text style={styles.statusText}>Paid</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.glassCard, styles.flexCard]}>
            <Text style={styles.cardLabel}>Invoice From</Text>
            <Text style={styles.infoText}>{invoiceDetails.invoiceFrom.name}</Text>
            <Text style={styles.infoSubText}>{invoiceDetails.invoiceFrom.address}</Text>
          </View>
          <View style={[styles.glassCard, styles.flexCard]}>
            <Text style={styles.cardLabel}>Billed To</Text>
            <Text style={styles.infoText}>{invoiceDetails.payTo.name}</Text>
            <Text style={styles.infoSubText}>{invoiceDetails.payTo.address}</Text>
          </View>
        </View>

        {deliveryAddress ? (
          <View style={styles.glassCard}>
            <Text style={styles.cardLabel}>Delivery Address</Text>
            <Text style={styles.infoSubText}>{deliveryAddress}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Order Items</Text>
        {items.map((item, index) => (
          <View key={item.id || index} style={styles.itemCard}>
            <View style={styles.itemMainRow}>
              <Image source={{ uri: item.product_image?.split(',')[0] || 'https://via.placeholder.com/80' }} style={styles.itemImage} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.muted}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemTotal}>₹{Number(item.total || (item.amount * item.quantity)).toFixed(2)}</Text>
            </View>
          </View>
        ))}

        {/* --- INVOICE BREAKDOWN --- */}
        <View style={[styles.glassCard, styles.totalCard]}>
          <Row label="Item Total" value={invoiceDetails.item_total} prefix="₹" />
          
          {invoiceDetails.wallet_amount > 0 && (
              <Row label="Wallet Used" value={invoiceDetails.wallet_amount} prefix="- ₹" color="#D32F2F" />
          )}

          {invoiceDetails.discount_amount > 0 && !isCashback && (
              <Row label={`Coupon Discount ${invoiceDetails.coupon_code ? `(${invoiceDetails.coupon_code})` : ''}`} value={invoiceDetails.discount_amount} prefix="- ₹" color="#D32F2F" />
          )}

          {invoiceDetails.booking_amount > 0 && (
              <Row label="Advance Paid" value={invoiceDetails.booking_amount} prefix="- ₹" color="#D32F2F" />
          )}

          <View style={styles.divider} />
          
          <Row
            label={invoiceDetails.payment_option === 'booking' ? 'Balance Due' : 'Grand Total'}
            value={invoiceDetails.payment_option === 'booking' ? invoiceDetails.remaining_amount : invoiceDetails.final_amount}
            prefix="₹"
            bold
          />

          {isCashback && invoiceDetails.discount_amount > 0 && (
             <View style={{marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#eee'}}>
                <Row label="Cashback Earned (Pending)" value={invoiceDetails.discount_amount} prefix="+ ₹" color="#2E7D32" bold />
             </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// Reusable Row Component for Total Breakdown
const Row = ({ label, value, bold, prefix = "", color }) => (
  <View style={styles.totalRow}>
    <Text style={[styles.totalLabel, bold && { fontWeight: '800', color: TEXT_DARK }, color && { color }]}>
        {label}
    </Text>
    <Text style={[styles.totalValue, bold && { fontSize: 21, color: PRIMARY_COLOR }, color && { color }]}>
        {prefix}{Number(value).toFixed(2)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR, paddingVertical: 20 },
  header: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', alignItems: 'center', elevation: 2 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TEXT_DARK },
  headerSubtitle: { fontSize: 11, color: TEXT_MUTED },
  headerActions: { flexDirection: 'row' },
  actionButton: { marginLeft: 10, padding: 4 },
  scrollContent: { padding: 14 },
  glassCard: { backgroundColor: CARD_BG_GLASS, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: BORDER_COLOR },
  invoiceHeaderCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invoiceLabel: { fontSize: 12, color: TEXT_MUTED },
  invoiceNumber: { fontSize: 20, fontWeight: '800', color: PRIMARY_COLOR },
  statusBadge: { flexDirection: 'row', backgroundColor: '#4CAF50', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20 },
  statusText: { color: '#fff', marginLeft: 4, fontWeight: '600' },
  row: { flexDirection: 'row' },
  flexCard: { flex: 1, marginRight: 8 },
  cardLabel: { fontSize: 12, color: TEXT_MUTED, marginBottom: 4 },
  infoText: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  infoSubText: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginVertical: 8, color: TEXT_DARK },
  itemCard: { backgroundColor: CARD_BG_GLASS, borderRadius: 14, padding: 10, marginBottom: 8 },
  itemMainRow: { flexDirection: 'row', alignItems: 'center' },
  itemImage: { width: 64, height: 64, borderRadius: 12, marginRight: 10 },
  itemDetails: { flex: 1 },
  itemName: { fontWeight: '700', color: TEXT_DARK },
  muted: { color: TEXT_MUTED, fontSize: 12 },
  itemTotal: { fontWeight: '700', color: PRIMARY_COLOR },
  totalCard: { borderLeftWidth: 4, borderLeftColor: PRIMARY_COLOR },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 },
  totalLabel: { fontSize: 14, color: TEXT_MUTED },
  totalValue: { fontWeight: '700', color: TEXT_DARK, fontSize: 16 },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 8 },
});

export default InvoiceScreen;