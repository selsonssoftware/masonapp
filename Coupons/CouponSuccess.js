import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
  StatusBar,
} from 'react-native';

// Simple SVG-free Icon component
const CheckIcon = () => (
  <View style={styles.iconContainer}>
    <Text style={styles.checkSymbol}>✓</Text>
  </View>
);

const { width } = Dimensions.get('window');

// 1. Pass navigation and route here
const RedemptionSuccess = ({ navigation, route }) => {
  
  // 2. Safely extract the couponcode from the previous screen
  // We use "|| {}" to prevent crashing if params are empty
  const { couponcode,totalsave } = route.params || { couponcode: 'No Code' };
  
  // Animation Values
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.poly(4)),
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
        delay: 200,
      }),
    ]).start();
  }, []);

  // 3. Handle the close action
  const handleClose = () => {
    // Go back to the previous screen or Cart
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback if there is no back history
      navigation.navigate('Home'); 
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" />
      
      <Animated.View
        style={[
          styles.card,
          {
            opacity: opacityValue,
            transform: [{ translateY: cardTranslateY }],
          },
        ]}
      >
        {/* Header Section */}
        <View style={styles.cardHeader}>
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <CheckIcon />
          </Animated.View>
          <Text style={styles.successTitle}>Redeemed!</Text>
          <Text style={styles.successSubtitle}>Coupon applied successfully</Text>
        </View>

        {/* Separator */}
        <View style={styles.dashedLineContainer}>
          <View style={styles.circleLeft} />
          <View style={styles.dashedLine} />
          <View style={styles.circleRight} />
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          {/* <View style={styles.row}>
            <Text style={styles.label}>Total Saved</Text>
            
            <Text style={styles.value}>{totalsave}</Text> 
          </View> */}
          
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>CODE APPLIED:</Text>
            <Text style={styles.couponCode}>{couponcode}</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleClose}>
            <Text style={styles.buttonText}>Awesome!</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)', // Darker background for focus
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: width * 0.85,
    backgroundColor: 'transparent',
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#4CAF50',
    paddingVertical: 40,
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#ffffff',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  checkSymbol: {
    fontSize: 40,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 10,
  },
  successSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
  },
  dashedLineContainer: {
    height: 30,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  circleLeft: {
    position: 'absolute',
    left: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1a1a1a', // Dark color to match container background
    zIndex: 1,
  },
  circleRight: {
    position: 'absolute',
    right: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1a1a1a', // Dark color to match container background
    zIndex: 1,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 1,
    marginHorizontal: 25,
  },
  cardBody: {
    backgroundColor: '#ffffff',
    padding: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#757575',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  codeContainer: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '100%',
    alignItems: 'center',
    marginBottom: 25,
    borderStyle: 'dashed',
  },
  codeLabel: {
    fontSize: 10,
    color: '#9E9E9E',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  couponCode: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  button: {
    backgroundColor: '#212121',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RedemptionSuccess;