import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { Text, Button, Card } from "react-native-paper";

export default function PaymentFailedScreen({ route, navigation }) {
  const { package_name, amount } = route.params || {};
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shake animation for fail effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Failed Symbol */}
      <Animated.View
        style={[
          styles.failCircle,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        <Text style={styles.failX}>✖</Text>
      </Animated.View>

      <Text style={styles.failedText}>Payment Failed</Text>

      {/* Membership details */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.planText}>Membership: { package_name|| "N/A"}</Text>
          <Text style={styles.amountText}>Amount: ₹{amount || "0.00"}</Text>
        </Card.Content>
      </Card>

      {/* Retry button */}
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.goBack()}
      >
        Try Again
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  failCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ff4d4d",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  failX: {
    fontSize: 50,
    color: "#fff",
    fontWeight: "bold",
  },
  failedText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ff3333",
    marginBottom: 20,
  },
  card: {
    width: "90%",
    marginBottom: 20,
    borderRadius: 15,
    elevation: 3,
    backgroundColor: "#fff5f5",
  },
  planText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  amountText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e60000",
  },
  button: {
    backgroundColor: "#ff3333",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
});
