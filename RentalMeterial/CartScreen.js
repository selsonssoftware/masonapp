import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform, 
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Date Picker & Paper Imports ---
import { DatePickerModal } from 'react-native-paper-dates';
import { 
    Provider as PaperProvider, 
    Portal, 
    Button 
} from 'react-native-paper'; 

// --- Time Picker Import ---
import RNDateTimePicker from '@react-native-community/datetimepicker'; 

// --- CASHFREE IMPORTS ---
import {
  CFEnvironment,
  CFSession,
  CFThemeBuilder,
  CFDropCheckoutPayment,
} from "cashfree-pg-api-contract";
import { CFPaymentGatewayService } from "react-native-cashfree-pg-sdk";

const { width, height } = Dimensions.get('window');
const CART_STORAGE_KEY = 'materialcart';
const MINIMUM_ADVANCE = 200; 

 
const CASHFREE_ORDER_URL = "https://sandbox.cashfree.com/pg/orders"; 
const MASONSHOP_ORDER_URL = "https://masonshop.in/api/ren_orders_get_cart"; 

const normalizeCartItems = (items) => items;

// --- Helper functions ---
const formatTimeForPayload = (date) => {
    if (!date) return null;
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
};
const formatTimeForDisplay = (date) => {
    if (!date) return 'Select Time';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const calculateItemDetails = (item, orderType, dateRange, timeRange) => {
    const isDay = orderType === 'day';
    let durationUnits = 0;
    let basePriceKey = isDay ? 'rmp_price_day' : 'rmp_price_hour';
    const unitPrice = Number(item[basePriceKey] || 0);
    const itemQuantity = Number(item.quantity || 1); 
    
    let rentalFrom = null;
    let rentalTo = null;

    if (isDay && dateRange?.startDate && dateRange?.endDate) {
        const start = dateRange.startDate.getTime();
        const end = dateRange.endDate.getTime();
        const dayDifference = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        durationUnits = Math.max(1, dayDifference);
        
        rentalFrom = dateRange.startDate.toISOString().split('T')[0]; 
        rentalTo = dateRange.endDate.toISOString().split('T')[0];
    } else if (!isDay && timeRange?.from && timeRange?.to) {
        let diffMs = timeRange.to.getTime() - timeRange.from.getTime();
        if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
        durationUnits = Math.ceil(diffMs / (1000 * 60 * 60)); 
        
        rentalFrom = formatTimeForPayload(timeRange.from); 
        rentalTo = formatTimeForPayload(timeRange.to);
    }
    
    const amount = unitPrice * durationUnits * itemQuantity;

    return {
        ...item,
        orderType: orderType,
        baseRateUsed: unitPrice,
        duration: durationUnits, 
        itemTotalAmount: amount,
        startDate: isDay ? rentalFrom : null,
        endDate: isDay ? rentalTo : null,
        startTime: !isDay ? rentalFrom : null,
        endTime: !isDay ? rentalTo : null,
        quantity: itemQuantity, 
    };
};

const CartScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [initialCartItems, setInitialCartItems] = useState([]); 
  const [calculatedCartItems, setCalculatedCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedOrderType, setSelectedOrderType] = useState('day');
  
  const [timeRange, setTimeRange] = useState({ 
      from: new Date(new Date().setHours(9, 0, 0, 0)),
      to: new Date(new Date().setHours(17, 0, 0, 0)),
  }); 
  const [showTimePicker, setShowTimePicker] = useState(null); 

  const [selectedAddress, setSelectedAddress] = useState(null); 
  const [phone, setPhone] = useState('guest');

  const [paymentOption, setPaymentOption] = useState('Advance'); 
  const [advanceAmountInput, setAdvanceAmountInput] = useState(MINIMUM_ADVANCE.toString()); 
  
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [dateRange, setDateRange] = useState({ 
      startDate: new Date(), 
      endDate: new Date(Date.now() + 86400000)
  }); 

  // FIXED: Using a ref to store the latest payload for the Cashfree callback
  const orderPayloadRef = useRef(null);

  const loadCarts = async () => {
    try {
      setLoading(true);
      const savedPhone = await AsyncStorage.getItem("phone");
      const phoneNumber = savedPhone || "guest"; 
      setPhone(phoneNumber); 
      
      const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      let parsed = savedCart ? JSON.parse(savedCart) : [];
      setInitialCartItems(normalizeCartItems(parsed)); 

      const selected = await AsyncStorage.getItem(`selected_address_${phoneNumber}`);
      setSelectedAddress(selected ? JSON.parse(selected) : null);
    } catch (error) {
      console.log("Error loading cart:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadCarts();
    const unsubscribe = navigation.addListener("focus", loadCarts);
    return unsubscribe;
  }, [navigation]);

  // FIXED: Register Cashfree Callbacks ONCE when component mounts
  useEffect(() => {
      CFPaymentGatewayService.setCallback({
          async onVerify(cashfreeOrderID) {
              setLoading(true); 
              if (orderPayloadRef.current) {
                  const finalPayload = { 
                      ...orderPayloadRef.current, 
                      cashfree_order_id: cashfreeOrderID, 
                      payment_status: 'paid',
                  }; 
                  await postOrderToServer(finalPayload);
              }
              setLoading(false);
          },
          onError(err, orderID) {
              Alert.alert("Payment Failed", err.message || "Transaction was cancelled or failed.");
              setLoading(false);
          },
      });

      return () => {
          CFPaymentGatewayService.removeCallback();
      };
  }, []);

  const onDismissDate = useCallback(() => setIsDatePickerVisible(false), []);

  const onConfirmDate = useCallback(({ startDate, endDate }) => {
      setIsDatePickerVisible(false);
      if (startDate && endDate) setDateRange({ startDate, endDate });
  }, []);
  
  const handleTimeChange = (event, selectedDate) => {
    setShowTimePicker(null); 
    if (selectedDate && showTimePicker) {
        setTimeRange(prev => ({ ...prev, [showTimePicker]: new Date(selectedDate) }));
    }
  };

  const updateQuantity = async (cartItemId, type) => {
      const updatedItems = initialCartItems.map(item => {
          if (item.cartItemId === cartItemId) {
              const currentQty = Number(item.quantity || 1);
              let newQty = type === 'plus' ? currentQty + 1 : currentQty - 1;
              return { ...item, quantity: Math.max(1, newQty) };
          }
          return item;
      });
      setInitialCartItems(updatedItems);
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedItems));
  };

  const recalculateCart = useCallback(() => {
    if (initialCartItems.length === 0) {
      setCalculatedCartItems([]);
      return;
    }
    const updatedItems = initialCartItems.map(item => calculateItemDetails(item, selectedOrderType, dateRange, timeRange));
    setCalculatedCartItems(updatedItems);
  }, [initialCartItems, selectedOrderType, dateRange, timeRange]);

  useEffect(() => {
    recalculateCart(); 
  }, [recalculateCart, initialCartItems]); 

  const subtotal = useMemo(() => calculatedCartItems.reduce((sum, item) => sum + (item.itemTotalAmount || 0), 0), [calculatedCartItems]);
  const finalAmount = subtotal; 
  const amountToPayNow = paymentOption === 'Full' ? finalAmount : Number(advanceAmountInput);

  const removeItem = async (cartItemId) => {
    const filtered = initialCartItems.filter(i => i.cartItemId !== cartItemId);
    setInitialCartItems(filtered);
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(filtered));
  };

  const postOrderToServer = async (payload) => {
    try {
        const response = await fetch(MASONSHOP_ORDER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.status === true) { 
            await AsyncStorage.removeItem(CART_STORAGE_KEY);
            navigation.replace("RentalSuccess", { 
                orderId: data.order_id || 'LOCAL-ID', 
                amount: payload.advance_amount
            });
            return true;
        } else {
            Alert.alert("Server Error", data.message || "Something went wrong on the server.");
            return false;
        }
    } catch (e) {
        Alert.alert("Network Error", "Could not connect to the server.");
        return false;
    }
  };

  const handlePlaceOrder = async () => {
    if (calculatedCartItems.length === 0) { Alert.alert("Empty Cart", "Please add items to continue."); return; }
    if (!selectedAddress) { Alert.alert("Address Required", "Please select a valid delivery address."); return; }
    
    if (calculatedCartItems[0]?.duration === 0) { 
        Alert.alert("Duration Missing", `Please select valid ${selectedOrderType === 'day' ? 'dates' : 'times'}.`); 
        return; 
    }
    
    if (paymentOption === 'Advance') {
        const inputAmount = Number(advanceAmountInput);
        if (isNaN(inputAmount) || inputAmount < MINIMUM_ADVANCE) {
            Alert.alert("Invalid Advance Amount", `Minimum advance amount is ₹${MINIMUM_ADVANCE}.`);
            return;
        }
        if (inputAmount > finalAmount) {
            Alert.alert("Invalid Amount", `Advance cannot exceed the Final Amount of ₹${finalAmount.toFixed(2)}.`);
            return;
        }
    } 

    const userId = await AsyncStorage.getItem("user_id") || "cust_001";
    
    // Setup and store payload in Ref for access inside callback
    orderPayloadRef.current = {
        user_id: userId,
        order_type: selectedOrderType,
        delivery_address: selectedAddress.fullAddress, 
        pincode: selectedAddress.pincode,
        advance_amount: amountToPayNow, 
        final_amount: finalAmount.toFixed(2),
        items: calculatedCartItems.map((item) => {
            const isDay = item.orderType === "day";
            return {
                product_id: item.productId,
                order_type: item.orderType, 
                per_price: item.baseRateUsed.toFixed(2),
                quantity: item.quantity, 
                rental_duration: item.duration, 
                item_total_amount: item.itemTotalAmount.toFixed(2),
                ...(isDay
                    ? { start_date: item.startDate, end_date: item.endDate }
                    : { start_time: item.startTime, end_time: item.endTime }
                )
            };
        }),
    };

    setLoading(true);
    try {
        // Cashfree rejects invalid phone lengths. Use a safe fallback if user is "guest".
        const safePhone = (phone && phone !== 'guest' && phone.length >= 10) ? phone : "9999999999";

        const cashfreeOrderData = {
            order_amount: Number(amountToPayNow.toFixed(2)), // FIXED: Strictly passed as a Number
            order_currency: "INR",
            customer_details: {
                customer_id: userId,
                customer_name: "Customer", 
                customer_email: "test@example.com", 
                customer_phone: safePhone, 
            },
        };

        const res = await fetch(CASHFREE_ORDER_URL, {
            method: "POST",
            headers: {
                   "x-client-id": Config.CASHFREE_CLIENT_ID,
    "x-client-secret": Config.CASHFREE_CLIENT_SECRET,

                "x-api-version": "2023-08-01",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(cashfreeOrderData),
        });

        const data = await res.json();

        if (!res.ok || !data.payment_session_id) {
            throw new Error(data.message || "Failed to create Cashfree session. Check API Keys.");
        }

        const session = new CFSession(data.payment_session_id, data.order_id, CFEnvironment.SANDBOX);
        const theme = new CFThemeBuilder().setNavigationBarBackgroundColor("#DA1F49").setButtonBackgroundColor("#DA1F49").build();
        const drop = new CFDropCheckoutPayment(session, null, theme);

        // Hide local loader, trigger native Cashfree UI
        setLoading(false); 
        CFPaymentGatewayService.doPayment(drop);

    } catch (e) {
        Alert.alert("Payment Gateway Error", e.message);
        setLoading(false);
    }
  };

  // --- UI Components ---

  const renderPaymentControls = () => {
    const predefinedAmounts = [200, 300, 400, 1000];
    const amountToPay = Number(advanceAmountInput);

    return (
      <View style={styles.paymentControlBox}>
        <Text style={styles.controlTitle}>
          <Ionicons name="wallet-outline" size={18} color="#333" /> Choose Payment Option
        </Text>

        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[styles.typeButton, paymentOption === 'Advance' && styles.activeTypeButton]}
            onPress={() => setPaymentOption('Advance')}
          >
            <Text style={paymentOption === 'Advance' && styles.activeTypeButtonText}>Advance Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, paymentOption === 'Full' && styles.activeTypeButton]}
            onPress={() => setPaymentOption('Full')}
          >
            <Text style={paymentOption === 'Full' && styles.activeTypeButtonText}>Full Payment</Text>
          </TouchableOpacity>
        </View>

        {paymentOption === 'Advance' && (
          <View style={styles.advanceDetailsContainer}>
            <Text style={styles.advanceLabel}>Minimum Advance: ₹{MINIMUM_ADVANCE}</Text>
            
            <View style={styles.amountButtonsContainer}>
                {predefinedAmounts.map(amount => (
                    <TouchableOpacity
                        key={amount}
                        style={[styles.amountButton, amountToPay === amount && styles.activeAmountButton]}
                        onPress={() => setAdvanceAmountInput(amount.toString())}
                    >
                        <Text style={[styles.amountButtonText, amountToPay === amount && styles.activeAmountButtonText]}>
                            ₹{amount}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.durationLabel}>Custom Advance Amount:</Text>
           <TextInput
    style={styles.timeInput}
    keyboardType='numeric'
    value={advanceAmountInput}
    placeholder={`Min. ₹${MINIMUM_ADVANCE}`}
    // FIX: Added 'g' to the regex /[^0-9]/g
    onChangeText={text => setAdvanceAmountInput(text.replace(/[^0-9]/g, ''))} 
/>
            <Text style={styles.durationWarning}>
                *The remaining amount (₹{(finalAmount - amountToPay).toFixed(2)}) will be collected at the time of delivery.
            </Text>
          </View>
        )}

        {paymentOption === 'Full' && (
             <View style={[styles.advanceDetailsContainer, {backgroundColor: '#2ecc7130', borderColor: '#2ecc71'}]}>
                <Text style={[styles.durationLabel, {color: '#27ae60'}]}>
                    You have chosen to pay the **Full Amount**. 
                </Text>
                <Text style={[styles.durationWarning, {color: '#27ae60'}]}>
                    *You will pay ₹{finalAmount.toFixed(2)} now. No dues at the time of delivery.
                </Text>
             </View>
        )}
      </View>
    );
  };
  
  const renderCartItem = ({ item }) => {
    const isDay = selectedOrderType === 'day';
    const rateKey = isDay ? 'rmp_price_day' : 'rmp_price_hour';
    const baseRate = item[rateKey] || 0;
    const durationText = isDay ? `${item.duration} days` : `${item.duration} hrs`;

    return (
      <View style={styles.cartItemContainer}>
          <Image source={{ uri: item.productImage || 'https://via.placeholder.com/60/ccc' }} style={styles.itemImage} resizeMode="contain" />

          <View style={styles.itemDetails}>
              <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
              <Text style={styles.infoText}>Rate: ₹{Number(baseRate).toFixed(2)} / {isDay ? 'Day' : 'Hour'}</Text>
              <Text style={styles.infoText}>Duration: {durationText}</Text>
              <Text style={styles.priceText}>Item Total: ₹{(item.itemTotalAmount || 0).toFixed(2)}</Text>
          </View>

          <View style={styles.itemRightAction}>
              <TouchableOpacity onPress={() => removeItem(item.cartItemId)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color="#e74c3c" />
              </TouchableOpacity>
              
              <View style={styles.quantityContainer}>
                  <TouchableOpacity onPress={() => updateQuantity(item.cartItemId, 'minus')} style={styles.qtyBtn}>
                      <Ionicons name="remove" size={16} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity || 1}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.cartItemId, 'plus')} style={styles.qtyBtn}>
                      <Ionicons name="add" size={16} color="#FFF" />
                  </TouchableOpacity>
              </View>
          </View>
      </View>
    );
  };

  const renderRentalControls = () => {
      const displayFromDate = dateRange.startDate ? dateRange.startDate.toLocaleDateString() : 'Select Start Date';
      const displayToDate = dateRange.endDate ? dateRange.endDate.toLocaleDateString() : 'Select End Date';
      const totalUnits = calculatedCartItems[0]?.duration || 0;

      return (
        <View style={styles.rentalControlBox}>
            <Text style={styles.controlTitle}>
                 <Ionicons name="options-outline" size={18} color="#333" /> Select Rental Duration Type
            </Text>
            
            <View style={styles.typeSelector}>
                <TouchableOpacity style={[styles.typeButton, selectedOrderType === 'day' && styles.activeTypeButton]} onPress={() => setSelectedOrderType('day')}>
                    <Text style={selectedOrderType === 'day' && styles.activeTypeButtonText}>Daily Rental</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeButton, selectedOrderType === 'hour' && styles.activeTypeButton]} onPress={() => setSelectedOrderType('hour')}>
                    <Text style={selectedOrderType === 'hour' && styles.activeTypeButtonText}>Hourly Rental</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.durationInputContainer}>
                {selectedOrderType === 'day' ? (
                    <>
                        <Text style={styles.durationLabel}>Rental Period (Dates):</Text>
                        <TouchableOpacity onPress={() => setIsDatePickerVisible(true)} style={styles.dateSelectionButton}>
                            <Text style={styles.dateSelectionText}>{displayFromDate} <Text style={{fontWeight: 'normal', color: '#666'}}>to</Text> {displayToDate}</Text>
                            <Ionicons name="calendar-outline" size={20} color="#3498db" />
                        </TouchableOpacity>
                        <Text style={styles.durationSummary}>Total Days: {totalUnits}</Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.durationLabel}>Rental Period (Times):</Text>
                        <View style={styles.timeInputRow}>
                            <TouchableOpacity style={styles.timeSelectionButton} onPress={() => openTimePicker('from')}>
                                <Text style={styles.timeSelectionText}>{formatTimeForDisplay(timeRange.from)}</Text>
                                <Ionicons name="time-outline" size={20} color="#3498db" />
                            </TouchableOpacity>
                            <Text style={styles.timeSeparator}>to</Text>
                            <TouchableOpacity style={styles.timeSelectionButton} onPress={() => openTimePicker('to')}>
                                <Text style={styles.timeSelectionText}>{formatTimeForDisplay(timeRange.to)}</Text>
                                <Ionicons name="time-outline" size={20} color="#3498db" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.durationSummary}>Total Hours Calculated: {totalUnits}</Text>
                    </>
                )}
            </View>
        </View>
      );
  };

  const renderAddressBox = () => (
    <View style={styles.addressBox}>
        <Text style={styles.addressTitle}>
            <Ionicons name="location-outline" size={18} color="#333" /> Delivery Address
        </Text>
        {selectedAddress ? (
            <View style={styles.addressDisplay}>
              <Text style={styles.addressText}>{selectedAddress.fullAddress}</Text>
              <Text style={styles.addressPin}>{selectedAddress.pincode || ""}</Text>
            </View>
          ) : (
            <Text style={styles.noAddressText}>No address selected. Please choose one.</Text>
          )}

          <Button mode="contained" style={{ backgroundColor: '#e74c3c', marginTop: 10 }} onPress={() => navigation.navigate("Location", { phone })}>
            Change/Select Address
          </Button>
    </View>
  );

  return (
    <PaperProvider>
    <Portal.Host> 
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFF" barStyle="dark-content" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart ({initialCartItems.length})</Text>
          <View style={{ width: 24 }} />
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={{marginTop: 10}}>Communicating with Payment Gateway...</Text>
          </View>
        ) : (
          <FlatList
              data={calculatedCartItems}
              keyExtractor={item => item.cartItemId.toString()}
              renderItem={renderCartItem}
              ListHeaderComponent={() => calculatedCartItems.length > 0 ? <Text style={styles.itemsTitle}>Your Items:</Text> : null}
              ListFooterComponent={() => initialCartItems.length > 0 && (
                <View style={styles.listFooterContainer}>
                    {renderRentalControls()}
                    {renderAddressBox()}
                    {renderPaymentControls()} 
                </View>
              )} 
              contentContainerStyle={{ padding: 15, paddingBottom: 150 }}
              ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                      <Ionicons name="cart-outline" size={80} color="#ccc" />
                      <Text style={styles.emptyText}>Your cart is empty</Text>
                  </View>
              )}
          />
        )}

        <DatePickerModal
            locale="en" mode="range" visible={isDatePickerVisible} onDismiss={onDismissDate}
            startDate={dateRange.startDate} endDate={dateRange.endDate} onConfirm={onConfirmDate} validRange={{ startDate: new Date() }}
        />
        
        {showTimePicker && (
            <RNDateTimePicker
                value={showTimePicker === 'from' ? timeRange.from : timeRange.to} mode="time" is24Hour={true} 
                display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleTimeChange}
            />
        )}

        {initialCartItems.length > 0 && (
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Grand Total (Payable: ₹{finalAmount.toFixed(2)}):</Text>
              <Text style={styles.totalAmount}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.checkoutButton, loading && styles.checkoutButtonDisabled]} 
              onPress={handlePlaceOrder}
              disabled={loading || !selectedAddress || calculatedCartItems[0]?.duration === 0}
            >
              <Text style={styles.checkoutText}>
                  {loading ? 'PROCESSING...' : `PAY ₹${amountToPayNow.toFixed(2)} NOW`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
      </Portal.Host>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    itemsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    cartItemContainer: { flexDirection: 'row', backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 12, elevation: 2, alignItems: 'center' },
    itemImage: { width: 70, height: 70, borderRadius: 8, marginRight: 12, backgroundColor: '#f9f9f9' },
    itemDetails: { flex: 1, justifyContent: 'center' },
    itemName: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    infoText: { fontSize: 12, color: '#666', marginBottom: 2 },
    priceText: { fontSize: 14, fontWeight: 'bold', color: '#3498db', marginTop: 4 },
    itemRightAction: { alignItems: 'flex-end', justifyContent: 'space-between' },
    quantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 6, paddingVertical: 4, marginTop: 10 },
    qtyBtn: { backgroundColor: '#3498db', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    qtyText: { marginHorizontal: 10, fontSize: 14, fontWeight: 'bold', color: '#333' },
    deleteBtn: { padding: 4 },
    addressBox: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginTop: 10, marginBottom: 10, elevation: 2, borderLeftWidth: 5, borderLeftColor: '#2ecc71' },
    addressTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    addressDisplay: { paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 10 },
    addressText: { fontSize: 14, color: '#333', fontWeight: '500' },
    addressPin: { fontSize: 12, color: '#777', marginTop: 2 },
    noAddressText: { fontSize: 14, color: '#e74c3c', paddingVertical: 10 },
    rentalControlBox: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginTop: 5, marginBottom: 10, elevation: 2, borderLeftWidth: 5, borderLeftColor: '#3498db' },
    controlTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    typeSelector: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#f5f5f5', borderRadius: 8, padding: 3 },
    typeButton: { flex: 1, padding: 10, borderRadius: 6, alignItems: 'center' },
    activeTypeButton: { backgroundColor: '#3498db' },
    activeTypeButtonText: { color: '#FFF', fontWeight: 'bold' },
    durationInputContainer: { marginBottom: 10 },
    durationLabel: { fontSize: 14, fontWeight: '600', marginBottom: 5 },
    dateSelectionButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 40, borderWidth: 1, borderColor: '#3498db', borderRadius: 5, paddingHorizontal: 10, backgroundColor: '#ecf0f130' },
    dateSelectionText: { fontSize: 14, fontWeight: 'bold', color: '#3498db' },
    timeInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    timeSelectionButton: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 40, borderWidth: 1, borderColor: '#3498db', borderRadius: 5, paddingHorizontal: 10, backgroundColor: '#ecf0f130' },
    timeSelectionText: { fontSize: 14, fontWeight: 'bold', color: '#3498db' },
    timeSeparator: { marginHorizontal: 10, fontSize: 16, color: '#666' },
    durationSummary: { fontSize: 12, color: '#7f8c8d', marginTop: 5 },
    durationWarning: { fontSize: 12, color: '#e74c3c', fontStyle: 'italic', marginTop: 5 },
    paymentControlBox: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginTop: 5, marginBottom: 10, elevation: 2, borderLeftWidth: 5, borderLeftColor: '#DA1F49' },
    advanceDetailsContainer: { borderWidth: 1, borderColor: '#3498db', padding: 10, borderRadius: 8, backgroundColor: '#3498db10' },
    advanceLabel: { fontSize: 14, fontWeight: 'bold', color: '#c0392b', marginBottom: 8 },
    amountButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    amountButton: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff' },
    activeAmountButton: { borderColor: '#3498db', backgroundColor: '#3498db' },
    amountButtonText: { color: '#333', fontSize: 14 },
    activeAmountButtonText: { color: '#fff', fontWeight: 'bold' },
    timeInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, backgroundColor: '#fff', fontSize: 16 },
    emptyContainer: { alignItems: 'center', marginTop: height * 0.25 },
    emptyText: { fontSize: 16, color: '#999', marginVertical: 10 },
    listFooterContainer: { marginTop: 10 },
    footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 15, backgroundColor: '#FFF', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 5, borderTopWidth: 1, borderTopColor: '#eee' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    totalLabel: { fontSize: 14, color: '#333', fontWeight: '600' },
    totalAmount: { fontSize: 22, fontWeight: 'bold', color: '#e74c3c' },
    checkoutButton: { backgroundColor: '#2ecc71', padding: 15, borderRadius: 10, alignItems: 'center' },
    checkoutButtonDisabled: { backgroundColor: '#95a5a6' },
    checkoutText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

export default CartScreen;