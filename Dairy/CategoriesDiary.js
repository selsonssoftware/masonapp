import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { AntDesign } from '@react-native-vector-icons/ant-design';
const { width } = Dimensions.get("window");
const COLORS = {
    navy: "#1A2E44",
    accent: "#6366F1",
    bg: "#FFFFFF",
    white: "#FFFFFF",
    lightBg: "#F4F7FA",
    textMain: "#1F2937",
    textSub: "#6B7280",
    primary: "#3f229eff",
};
const CategoriesDiary = ({ navigation }) => {
  useEffect(() => {
    
  }, []);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
                      <TouchableOpacity onPress={() => navigation.goBack()}>
                          <FontAwesome size={20} name="arrow-left" style={{ color: "white" }} />
                      </TouchableOpacity>
                      <Text style={styles.headerTitle}>Back</Text>
                  </View>
      <Text>Hello, world! 🎉</Text>
       {/* MINIMAL FLOATING BOTTOM NAV */}
             <View style={styles.bottomNavWrapper}>
                             <View style={styles.bottomNav}>
                               <TouchableOpacity style={styles.bNavItem} onPress={() => navigation.navigate("DairyList")}>
                                           <Ionicons name="home" size={22} color={COLORS.primary} />
                                           <Text style={styles.bNavText}>Home</Text>
                                         </TouchableOpacity>
                                 <TouchableOpacity style={styles.bNavItem} onPress={() => navigation.navigate("CreateDVC")}>
                                     <FontAwesome name="plus-circle" size={22} color={COLORS.primary} />
                                     <Text style={styles.bNavText}>Create</Text>
                                 </TouchableOpacity>
                                 <TouchableOpacity style={styles.centerSearch}>
                                     <FontAwesome name="search" size={20} color="white" />
                                 </TouchableOpacity>
                                 <TouchableOpacity style={styles.bNavItem} onPress={() => navigation.navigate("MyDVC")}>
                                             <FontAwesome name="qrcode" size={22} color={COLORS.primary} />
                                             <Text style={styles.bNavText}>QR Code</Text>
                                           </TouchableOpacity>
                                           <TouchableOpacity style={styles.bNavItem} onPress={() => navigation.navigate("Myupload")}>
                                             <FontAwesome name="id-card-o" size={22} color={COLORS.primary} />
                                             <Text style={[styles.bNavText, { color: COLORS.primary, fontWeight: '700' }]}>My DVC</Text>
                                           </TouchableOpacity>
                             </View>
                         </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
        flex: 1,
        alignItems: 'center', // Centers content horizontally
        backgroundColor: COLORS.lightBg,
    },
    header: { height: 68, width: "100%", alignItems: "center", backgroundColor: COLORS.primary, flexDirection: "row", gap: 10, padding: 20, paddingBottom: 10 },
    back: { color: COLORS.white, fontSize: 22, marginRight: 12 },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "700" },

bottomNavWrapper: { position: 'absolute', bottom: 25, left: 0, right: 0, alignItems: 'center' },
    bottomNav: {
        width: width * 0.9,
        height: 70,
        backgroundColor: COLORS.white,
        borderRadius: 35,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        alignItems: 'center',
        elevation: 15,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 15,
    },
    bNavItem: { alignItems: 'center', flex: 1 },
    bNavText: { fontSize: 10, color: COLORS.textSub, marginTop: 4 },
    centerSearch: {
        backgroundColor: COLORS.primary,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -10,
        elevation: 5
    }
});

export default CategoriesDiary;
