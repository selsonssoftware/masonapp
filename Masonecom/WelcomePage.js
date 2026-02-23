import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const rainRef = useRef(null);
  const timerRef = useRef(null);
  
  // State to delay the animation slightly until screen transition finishes
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait 400ms before showing confetti to prevent UI Thread freezing
    const initTimer = setTimeout(() => setIsReady(true), 400);

    // CLEANUP: Prevents memory leaks and white screens if you navigate away
    return () => {
      clearTimeout(initTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleRainLoop = () => {
    // Clear previous timer just in case
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Safely restart the rain after 200ms
    timerRef.current = setTimeout(() => {
      if (rainRef.current) {
        rainRef.current.start();
      }
    }, 200); 
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require('../assets/background_image.jpeg')} 
        style={styles.background}
        resizeMode="cover"
      >
        {/* Only render Confetti AFTER the screen has safely loaded */}
        {isReady && (
          <>
            {/* 💥 THE BIG BLAST */}
            <ConfettiCannon
              count={300}                
              origin={{ x: width / 2, y: height / 2 }} 
              explosionSpeed={400}
              fallSpeed={3000}
              fadeOut={true}
              autoStart={true}
              colors={['#eb66ef', '#999b84', '#ff9933', '#85bb65', '#ffd700']} 
            />

            {/* 🌧️ THE INFINITE RAIN */}
            <ConfettiCannon
              ref={rainRef}
              count={100}                
              origin={{ x: width / 2, y: -40 }} 
              explosionSpeed={200}
              fallSpeed={6000}           
              fadeOut={true}
              autoStart={true}
              onAnimationEnd={handleRainLoop} 
              colors={['#eb66ef', '#999b84', '#ffd700']} 
            />
          </>
        )}

        <View style={styles.container}>
          <Image
            source={require('../assets/splash.png')} 
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>⭐</Text>
            <Text style={styles.emoji}>👍</Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('HomeScreen')}
          >
            <Text style={styles.buttonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff', 
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10, 
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  emojiContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  emoji: {
    fontSize: 40,
    marginHorizontal: 10,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#D6003D',
    fontSize: 18,
    fontWeight: 'bold',
  },
});