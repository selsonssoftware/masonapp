import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { Text, TextInput, Checkbox, Button } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { launchImageLibrary } from "react-native-image-picker";

export default function KycPaymentForm({ navigation, route }) {
  const { VechileData } = route.params; // ✅ correctly get store data

  const [holderName, setHolderName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upi, setUpi] = useState("");
  const [idProof, setIdProof] = useState(null);
  const [gstCert, setGstCert] = useState(null);
  const [agree, setAgree] = useState(false);

  const pickFile = (setFile) => {
    const options = { mediaType: "photo", quality: 1 };
    launchImageLibrary(options, (response) => {
      if (response.assets && response.assets.length > 0) {
        setFile(response.assets[0]);
      }
    });
  };

  const handleSubmit = async () => {
    if (!agree) {
      Alert.alert("Error", "Please agree to terms");
      return;
    }

    if (!holderName || !bankAccount || !ifsc || !idProof || !gstCert) {
      Alert.alert("Error", "Please fill all required fields and upload files");
      return;
    }

    try {
      const formData = new FormData();

      // Append store data from first page
      for (const key in VechileData) {
        if (key === "logo" && VechileData.logo) {
          formData.append("logo", {
            uri: VechileData.logo.uri,
            type: VechileData.logo.type || "image/jpeg",
            name: VechileData.logo.fileName || "store_logo.jpg",
          });
        } else {
          formData.append(key, VechileData[key]);
        }
      }

      // Append KYC fields
      formData.append("holder_name", holderName);
      formData.append("account_no", bankAccount);
      formData.append("ifsc_code", ifsc);
      formData.append("upi_id", upi);

      if (idProof) {
        formData.append("id_proof", {
          uri: idProof.uri,
          type: idProof.type || "image/jpeg",
          name: idProof.fileName || "id_proof.jpg",
        });
      }

      if (gstCert) {
        formData.append("gst_image", {
          uri: gstCert.uri,
          type: gstCert.type || "image/jpeg",
          name: gstCert.fileName || "gst_cert.jpg",
        });
      }

      const response = await fetch("https://masonshop.in/api/vechile_register", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (response.ok) {
        Alert.alert(
          "Success", 
          "Store created successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                // ✅ Only run this AFTER user clicks OK
                navigation.reset({
                  index: 0,
                  routes: [{ name: "StoreDashboard" }],
                });
              }
            }
          ]
        );
      } else {
        Alert.alert("Error", data.message || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to create store");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC & Payment Setup</Text>
        <View style={{ width: 28 }} />
      </View>

      <Text style={styles.subtitle}>
        Verify vendor and enable payment transfers
      </Text>

      {/* Holder Name */}
      <TextInput
        label="Holder Name *"
        value={holderName}
        onChangeText={setHolderName}
        mode="flat"
        style={styles.input}
      />

      {/* Bank Account */}
      <TextInput
        label="Bank Account Number *"
        value={bankAccount}
        onChangeText={setBankAccount}
        mode="flat"
        style={styles.input}
      />

      {/* IFSC */}
      <TextInput
        label="IFSC Code *"
        value={ifsc}
        onChangeText={setIfsc}
        mode="flat"
        style={styles.input}
      />

      {/* UPI */}
      <TextInput
        label="UPI ID (optional)"
        value={upi}
        onChangeText={setUpi}
        mode="flat"
        style={styles.input}
      />

      {/* ID Proof */}
      <Text>ID Proof *</Text>
      <View style={styles.uploadRow}>
        <View style={styles.uploadBox}>
          {idProof ? (
            <Image source={{ uri: idProof.uri }} style={styles.uploadPreview} />
          ) : (
            <Text>Upload file below 2MB</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => pickFile(setIdProof)}>
          <Icon name="folder-upload" size={20} color="red" />
        </TouchableOpacity>
      </View>

      {/* GST Certificate */}
      <Text>GST Certificate *</Text>
      <View style={styles.uploadRow}>
        <View style={styles.uploadBox}>
          {gstCert ? (
            <Image source={{ uri: gstCert.uri }} style={styles.uploadPreview} />
          ) : (
            <Text>Upload file below 2MB</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => pickFile(setGstCert)}>
          <Icon name="folder-upload" size={20} color="red" />
        </TouchableOpacity>
      </View>

      {/* Checkbox */}
      <View style={styles.checkboxRow}>
        <Checkbox
          status={agree ? "checked" : "unchecked"}
          onPress={() => setAgree(!agree)}
        />
        <Text>I agree to payment & KYC terms</Text>
      </View>

      <Button mode="contained" onPress={handleSubmit} style={styles.nextBtn}>
        Create
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  subtitle: { textAlign: "center", color: "gray", marginBottom: 20 },

  label: { fontWeight: "bold", marginTop: 15 },
  required: { color: "red" },

  input: {
    marginTop: 10,
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  uploadRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  uploadBox: {
    flex: 1,
    height: 60,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  uploadText: { fontSize: 12, color: "gray" },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff2f2",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "red",
  },
  uploadBtnText: {
    marginLeft: 5,
    color: "red",
    fontWeight: "bold",
  },
  uploadPreview: { width: 50, height: 50, borderRadius: 8 },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  nextBtn: {
    borderRadius: 25,
    paddingVertical: 2,
    backgroundColor: "#DA1F49",
    marginBottom: 35,
  },
});
