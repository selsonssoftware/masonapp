import React from 'react';
import {View,Text,StyleSheet,Image} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function Mydesign(){

    return(
          <View style={styles.container}>
            <View style={styles.Header}>
              <View style={styles.left}>
             <Text>Address : 1/55a south street keelarayampuram</Text>
             </View>
             <View>
              <Icon name="Home"/>
             </View>
           </View>
         </View>
    );
}

const styles = StyleSheet.create({
        container:{

               flex: 1,
    backgroundColor: 'white',

      // vertical center
    alignItems: 'center', 
        },
        Header:{

               flex:1,
               
        },
        heading:{

               fontsize:20,
               color:'red',
        },
       Image:{

           width: 70,
height: 70,
resizeMode: 'cover',

       }
        
});