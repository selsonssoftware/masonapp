import React, { useState } from "react";
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, Platform,
} from "react-native";
import { Text, TextInput, Button, Menu } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { launchImageLibrary } from "react-native-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function CreateCoupon() {
  const navigation = useNavigation();

  // --- STATES ---
  const [discountType, setDiscountType] = useState("fixed");
  const [couponName, setCouponName] = useState("");
  const [numCoupons, setNumCoupons] = useState("");
  const [fixedValue, setFixedValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateLabel, setDateLabel] = useState("Select Date");
  const [imageFile, setImageFile] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedPercent, setSelectedPercent] = useState("Select %");

  const payAmount = numCoupons ? (parseInt(numCoupons) * 0.02).toFixed(2) : "0.00";

  // --- ACTIONS ---
  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (response) => {
      if (!response.didCancel && response.assets) {
        setImageFile(response.assets[0]);
      }
    });
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setDateLabel(`${year}-${month}-${day}`);
    }
  };

  const handleProceed = () => {
    if (!couponName || !numCoupons || !imageFile || (discountType === 'fixed' && !fixedValue) || (discountType === 'percent' && selectedPercent === "Select %")) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    if(numCoupons < 100){

         Alert.alert("Error", "Minimum 100 Coupons Create");
      return;  
    }

    // Navigate to Payment Screen with Data
    navigation.navigate("CouponGateway", {
      couponData: {
        coupon_name: couponName,
        no_of_coupons: numCoupons,
        discount_value: discountType === "percent" ? selectedPercent : fixedValue,
        coupon_type: discountType === "fixed" ? "FLAT" : "PERCENTAGE",
        min_order: minOrder || "0",
        experied_date: dateLabel === "Select Date" ? "" : dateLabel,
        amount: payAmount,
        image: imageFile, 
      }
    });
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={30} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Coupon</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.typeRow}>
          <TouchableOpacity 
            style={[styles.typeBox, discountType === 'fixed' && styles.activeTypeBox]}
            onPress={() => setDiscountType('fixed')}>
            <Text style={[styles.typeText, discountType === 'fixed' && styles.activeTypeText]}>Fixed Discount</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeBox, discountType === 'percent' && styles.activeTypeBox]}
            onPress={() => setDiscountType('percent')}>
            <Text style={[styles.typeText, discountType === 'percent' && styles.activeTypeText]}>Percentage</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Coupon Name *</Text>
          <TextInput mode="outlined" style={styles.input} value={couponName} onChangeText={setCouponName} />

          <Text style={styles.label}>Number of Coupons *</Text>
          <TextInput mode="outlined" keyboardType="numeric" style={styles.input} value={numCoupons} onChangeText={setNumCoupons} />

          <Text style={styles.label}>Discount Value *</Text>
          {discountType === 'percent' ? (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <TouchableOpacity style={styles.dropdown} onPress={() => setMenuVisible(true)}>
                  <Text>{selectedPercent}</Text>
                  <Icon name="percent" size={20} color="#2E7D32" />
                </TouchableOpacity>
              }>
              <Menu.Item onPress={() => {setSelectedPercent("10"); setMenuVisible(false)}} title="10%" />
              <Menu.Item onPress={() => {setSelectedPercent("20"); setMenuVisible(false)}} title="20%" />
              <Menu.Item onPress={() => {setSelectedPercent("50"); setMenuVisible(false)}} title="50%" />
            </Menu>
          ) : (
            <TextInput mode="outlined" keyboardType="numeric" style={styles.input} value={fixedValue} onChangeText={setFixedValue} />
          )}

          <Text style={styles.label}>Minimum Order Amount</Text>
          <TextInput mode="outlined" keyboardType="numeric" style={styles.input} value={minOrder} onChangeText={setMinOrder} placeholder="0" />

          <Text style={styles.label}>Valid Date *</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowDatePicker(true)}>
            <Text>{dateLabel}</Text>
            <Icon name="calendar" size={20} color="#999" />
          </TouchableOpacity>
          {showDatePicker && <DateTimePicker value={date} mode="date" onChange={onDateChange} />}

          <Text style={styles.label}>Gallery *</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            {imageFile ? (
              <Image source={{ uri: imageFile.uri }} style={styles.preview} />
            ) : (
              <>
                <Icon name="image-plus" size={30} color="#999" />
                <Text style={{color:'#999'}}>Upload</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Your Total Amount</Text>
          <Text style={styles.totalValue}>₹{payAmount}</Text>
        </View>
        <Button mode="contained" onPress={handleProceed} style={styles.payBtn}>
          Proceed to Payment
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, paddingTop: 50, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  typeBox: { flex: 0.48, height: 48, borderWidth: 1, borderColor: '#eee', borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9F9F9' },
  activeTypeBox: { borderColor: '#2E7D32', borderWidth: 2, backgroundColor: '#fff' },
  activeTypeText: { color: '#2E7D32', fontWeight: 'bold' },
  label: { fontSize: 13, fontWeight: 'bold', marginTop: 15 },
  input: { backgroundColor: '#fff', height: 45, marginTop: 5 },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 48, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, paddingHorizontal: 10, marginTop: 5 },
  uploadBox: { width: 100, height: 100, borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed', borderRadius: 8, marginTop: 10, justifyContent: 'center', alignItems: 'center' },
  preview: { width: '100%', height: '100%', borderRadius: 8 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFBEB', padding: 15, borderRadius: 10, marginBottom: 10 },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#065F46' },
  payBtn: { backgroundColor: '#065F46', paddingVertical: 5 }
});