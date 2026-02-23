import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Alert
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import QRScanner from "../Masonecom/qrScanner";
import { useNavigation } from "@react-navigation/native";


const { width: dWidth, height: dHeight } = Dimensions.get("window");
const PRIMARY_COLOR = "#b91018ff"; // Modern Emerald Green
const DARK_BG = "#0F172A"; // Slate 900

const ScanQRPage = () => {
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const navigation = useNavigation();

  const openQRscanner = () => {
    setShowQR(true);
  };

  const onQrRead = (qrtext) => {
    setShowQR(false);
    if (qrtext) {
      const vendorId = qrtext.split("/").pop();
      
      setQrCode(qrtext);
      // Ensure the route name matches exactly what is in your Stack Navigator
      navigation.navigate("StoreCoupons", { vendorId: vendorId });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />
      
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Scan & Redeem</Text>
        <Text style={styles.subtitle}>Align the QR code within the frame to scan</Text>
      </View>

      {/* Center Illustration/Icon Section */}
      <View style={styles.centerSection}>
        <View style={styles.scanWrapper}>
          <Ionicons
            name="scan-outline"
            size={dWidth * 0.6}
            color={PRIMARY_COLOR}
          />
          {/* Animated looking corners */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        
        {qrCode ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Last Scanned ID:</Text>
            <Text style={styles.resultText}>{qrCode.split("/").pop()}</Text>
          </View>
        ) : null}
      </View>

      {/* Action Button Section */}
      <View style={styles.footer}>
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={openQRscanner} 
          style={styles.mainBtn}
        >
          <Ionicons name="qr-code" size={20} color="white" style={{marginRight: 10}} />
          <Text style={styles.mainBtnText}>Start Scanning</Text>
        </TouchableOpacity>
        
        <Text style={styles.infoText}>Supported by Mason Shop</Text>
      </View>

      {/* Scanner Overlay */}
      {showQR && <QRScanner onRead={onQrRead} />}
    </SafeAreaView>
  );
};

export default ScanQRPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scanWrapper: {
    padding: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Visual corners for the scan frame
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: PRIMARY_COLOR,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 15 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 15 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 15 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 15 },

  resultBox: {
    marginTop: 30,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  resultLabel: { color: "#94A3B8", fontSize: 12, textAlign: 'center' },
  resultText: { color: PRIMARY_COLOR, fontWeight: 'bold', fontSize: 16 },

  footer: {
    paddingBottom: 50,
    alignItems: "center",
  },
  mainBtn: {
    flexDirection: 'row',
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 18,
    width: dWidth * 0.8,
    elevation: 8,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  mainBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  infoText: {
    marginTop: 20,
    color: "#475569",
    fontSize: 12,
  }
});