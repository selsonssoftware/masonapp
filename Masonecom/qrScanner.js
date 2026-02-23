import React, { useState, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from "react-native-vision-camera";
import Ionicons from "react-native-vector-icons/Ionicons";

const QRScanner = ({ onRead }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const device = useCameraDevice("back");

  const codeScanner = useCodeScanner({
    codeTypes: ["qr"],
    onCodeScanned: (codes) => {
      if (codes.length > 0) {
        const scannedUrl = codes[0].value;
        console.log("Scanned URL:", scannedUrl);

        const vendorId = scannedUrl.split("/").pop(); // Extract vendor_id
        console.log("Extracted vendor ID:", vendorId);

        onRead(vendorId); // Send vendor ID to parent
      }
    },
  });

  useEffect(() => {
    setRefresh(!refresh);
  }, [device, hasPermission]);

  useEffect(() => {
    const requestCameraPermission = async () => {
      const permission = await Camera.requestCameraPermission();
      console.log("Camera permission:", permission);
      setHasPermission(permission === "granted");
    };

    requestCameraPermission();

    // Auto-close after 15 seconds
    const timer = setTimeout(() => {
      onRead(null);
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  if (device == null || !hasPermission) {
    return (
      <View style={styles.page2}>
        <Text style={{ backgroundColor: "white", padding: 10 }}>
          Camera not available or not permitted
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.page2}>
      <Camera
        codeScanner={codeScanner}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
      />
      <View style={styles.backHeader}>
        <TouchableOpacity
          style={{ padding: 10 }}
          onPress={() => onRead(null)}
        >
          <Ionicons name={"arrow-back-outline"} size={25} color={"snow"} />
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => onRead(null)}
        >
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default QRScanner;

const styles = StyleSheet.create({
  page2: {
    flex: 1,
    position: "absolute",
    top: 0,
    height: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  backHeader: {
    backgroundColor: "#00000090",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: "2%",
    height: "5%",
    width: "100%",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  footer: {
    backgroundColor: "#00000090",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "10%",
    height: "20%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "snow",
    alignItems: "center",
  },
  closeText: {
    color: "snow",
    fontSize: 14,
  },
});
