import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card, Avatar, Button ,Linking} from "react-native-paper";
import MapView, { Marker, Polyline } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GOOGLE_API_KEY = "AIzaSyDkX_g6KhxPkOKrqLK5JuI1B-yEJ8uFuLA"; // Replace with your key

export default function OrderTracking() {
  const mapRef = useRef(null);

  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [timeMin, setTimeMin] = useState(0);
  const [routeCoords, setRouteCoords] = useState([]);

  const shopLocation = {
    latitude: 13.048748,
    longitude: 80.221317,
    label: "Shop",
  };
  
  useEffect(() => {
    const loadAddress = async () => {
      try {
        const phone = await AsyncStorage.getItem("phone");
        if (!phone) return;

        const saved = await AsyncStorage.getItem(`selected_address_${phone}`);
        if (!saved) return;

        const chosen = JSON.parse(saved);
        setDeliveryAddress(chosen);

        // ✅ Call Google Directions API
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${shopLocation.latitude},${shopLocation.longitude}&destination=${chosen.latitude},${chosen.longitude}&key=${GOOGLE_API_KEY}&mode=driving`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes.length > 0) {
          const route = data.routes[0];

          // Distance & ETA
          setDistanceKm((route.legs[0].distance.value / 1000).toFixed(2));
          setTimeMin(Math.round(route.legs[0].duration.value / 60));

          // Decode polyline
          const points = decodePolyline(route.overview_polyline.points);
          setRouteCoords(points);

          // Fit map to markers
          if (mapRef.current) {
            mapRef.current.fitToCoordinates(
              [
                { latitude: shopLocation.latitude, longitude: shopLocation.longitude },
                { latitude: chosen.latitude, longitude: chosen.longitude },
              ],
              { edgePadding: { top: 100, right: 50, bottom: 300, left: 50 }, animated: true }
            );
          }
        }
      } catch (err) {
        console.log("Error loading map/distance:", err);
      }
    };

    loadAddress();
  }, []);

  // Decode Google polyline
  const decodePolyline = (t, e) => {
    let points = [];
    let index = 0,
      lat = 0,
      lng = 0;
    e = e || 5;

    while (index < t.length) {
      let b, shift = 0, result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  if (!deliveryAddress) {
    return (
      <View style={styles.center}>
        <Text>No delivery address selected</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
        
     <MapView
  ref={mapRef}
  style={{ flex: 1 }}
  initialRegion={{
    latitude: shopLocation.latitude,
    longitude: shopLocation.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }}
>
  {/* Shop Marker with Custom Logo */}
  <Marker
    coordinate={shopLocation}
    title={shopLocation.label}
    description="Mason"
    
    image={require('../assets/mason-icon.png')} // <-- Your custom logo
  />

  {/* Delivery Marker */}
  <Marker
    coordinate={deliveryAddress}
    title={deliveryAddress.label || "Delivery Address"}
    // optional: custom logo for delivery
    image={require('../assets/user.png')}
  />

  {/* Route Polyline */}
  {routeCoords.length > 0 && (
    <Polyline coordinates={routeCoords} strokeColor="#FFD700" strokeWidth={4} />
  )}
</MapView>


      {/* Bottom Info Card */}
      <Card style={styles.infoCard}>
  <Card.Content>
    <View style={styles.row}>
      <Text>Distance: </Text>
      <Text style={{ fontWeight: "bold", color: "red", marginRight: 15 }}>
        {distanceKm} km
      </Text>

      <Text>Time: </Text>
      <Text style={{ fontWeight: "bold", color: "red" }}>
        {timeMin >= 60
          ? `${Math.floor(timeMin / 60)} hr ${timeMin % 60} min`
          : `${timeMin} min`}
      </Text>
    </View>

    <Text style={{ marginTop: 10, fontWeight: "600" }}>Delivery Man</Text>
    <View style={styles.deliveryRow}>
    <Avatar.Image
  size={40}
  source={require('../assets/splash.png')}
/>
      <View style={{ marginLeft: 10 }}>
        <Text style={{ fontSize: 16 }}>Karuppu Samy</Text>
        <Text style={{ color: "orange" }}>⭐⭐⭐⭐⭐</Text>
      </View>
      <View style={{ flexDirection: "row", marginLeft: "auto" }}>
        <Button icon="chat" compact onPress={() => alert("Chat pressed")} />
        <Button
  icon="phone"
  compact
  onPress={() => {
    const phoneNumber = "9843860940";
    Linking.openURL(`tel:${phoneNumber}`);
  }}
/>
      </View>
    </View>
  </Card.Content>
</Card>

    </View>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    borderRadius: 20,
    padding: 10,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  deliveryRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
