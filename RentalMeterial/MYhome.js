
import React from 'react';
import {View ,Text,StyleSheet,Image,TouchableOpacity} from 'react-native';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
 


export default function Home(){

    const Navitems = [

             {id:1,tittle:'car',icon:require('../assets/car.png')},
             {id:2,tittle:'taxi',icon:require('../assets/car.png')},
             {id:3,tittle:'roller',icon:require('../assets/car.png')},
             {id:4,tittle:'jcb',icon:require('../assets/car.png')},
             {id:5,tittle:'bike',icon:require('../assets/car.png')},
             {id:6,tittle:'cycle',icon:require('../assets/car.png')},

          
    ]


  return(
         <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
           <LinearGradient
  colors={['#719cddff', '#cdebffff']}   // dark → light blue
  start={{ x: 0, y: 0 }}            // top
  end={{ x: 1, y: 1 }}              // bottom
  style={styles.gradient}
>
   {/* Your content */}


        <View style={styles.Container}>


            <View style={styles.Header}>
              <View style={{ flex: 1 }}> 
              <Text style={styles.Home}>Home</Text>
              <Text style={styles.Address} numberOfLines={1} ellipsizeMode='tail'>1/55 a south street Rayampuram</Text>
              </View>
              <View style={styles.IconRow}>
              <Icon name="cart-outline" size={28} color="blue" style={{marginRight:15,backgroundColor:'white',padding:5,borderRadius:10}}></Icon>
              <Icon name="account-circle-outline" size={28} color="blue" style={{backgroundColor:'white',padding:5,borderRadius:10}}></Icon>
              </View>
             </View>



             <View style={styles.Search}>
              <TextInput placeholder='Search' style={styles.Input}></TextInput>
             </View>


             <View style={styles.nav}>
                <ScrollView horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>

                   {Navitems.map((item)=>(
                    <View style={styles.item} key={item.id}>
                    <Image source={item.icon} style={styles.Navimage}>
                  </Image>
                    <Text>{item.tittle}</Text>
                    </View>
                   ))}
                </ScrollView>
             </View>
 
        </View>
        </LinearGradient>
        
         
               <LinearGradient
  colors={['#0A2E63', '#4DB8FF']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.Card}
>
  <Image source={require('../assets/car.png')} style={styles.icon} />

  <View style={styles.content}>
    <Text style={styles.heading}>Rental Material</Text>
    <Text style={styles.sub}>Rental Your Material Daily or Hourly</Text>
    <Text style={styles.link}>Rent Now</Text>
  </View>
</LinearGradient>

<View style={styles.category}>
<Text style={{fontSize:17,fontFamily:'Times new roman'}}>Categories</Text>

<View style={styles.catcard} >
   { Navitems.map((item) => ( 
    <View style={styles.pack} key={item.id}>
        <Image source={item.icon} style={styles.catimage}></Image>
        <Text style={styles.cattext}>{item.tittle}</Text>
    </View>
    ))}
</View>

</View>

<View style={styles.category}>
   <Text style={{fontSize:17,fontFamily:'Times new roman'}}>Product</Text>
     
    <View style={styles.productcard}>
        <ScrollView horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>

         {Navitems.map((item)=>(
         <View style={styles.product} key={item.id}>
            <Image source={require('../assets/car.png')} style={styles.productimage}></Image>
            <Text>Driller</Text>
            <Text>Rs.2000</Text>
            <Text>XXXXXXX</Text>
            <TouchableOpacity style={styles.outlineBtn}>
  <Text style={styles.outlineText}>Rent</Text>
</TouchableOpacity>

         </View>
))}

         </ScrollView>
    </View>
</View>
               
       </ScrollView>
  );


};

const styles=StyleSheet.create({

  Container:{
          flex: 1,
    padding: 10,
     
  },
   Home:{
      
    fontSize:18,
    color:'black',
    paddingBottom:4, 
        
   },
   Address:{

        fontSize:15,
        color:'black',
   },
   Header:{
         marginTop: 40,
         flexDirection:'row',
         justifyContent: 'space-between',
         alignItems: 'center',
         paddingVertical: 10,
   },
   IconRow:{

       flexDirection:'row',
   },
   Input:{

        borderWidth:1,
        borderColor:'gray',
        backgroundColor:'white', 
        borderRadius:10,
        padding:15,
        fontSize:17,
        color:'black',
   },
   Navimage:{

        width:70,
        height:70,
        marginBottom:5,
        marginTop:5,
   }
   ,
   wrapper:{
        
         alignItems:'start',
         justifyContent:'center'
     
   },
   box:{

       flexDirection:'row',
   },
   row: {
    paddingHorizontal: 12,
    flexDirection:'row',
  },
  item:{
       
       flexDirection:'column',
       alignItems:'center',
       justifyContent:'center',
       marginRight:20,
  },
  Card:{
      flexDirection:'row',
      justifyContent:'flex-start',
      backgroundColor:'blue',
      padding:15,
      borderRadius:10,
      marginVertical:15,
      marginHorizontal:5,
  },
  icon:{

        width:150,
        height:150,
       
  },
  content:{

         alignItems:'center',
         justifyContent:'center',
         padding:15,
         marginRight:10,
  },
  heading: {
  fontSize: 16,
  fontWeight: 'bold',
  marginBottom: 10,
  color: '#ffffffff',
},

sub: {
  fontSize: 14,
  color: '#ffffffff',
 marginBottom: 10,
},

link: {
  fontSize: 14,
  color: '#ffffffff',
},
category:{

     padding:10,
},
catcard:{

       flexDirection:'row',
       flexWrap:'wrap',
       justifyContent: 'space-between',
       padding:10,
},
pack:{

      width:'23%', 
      backgroundColor:'white',
      padding:5,
      borderRadius:10,
     
      alignItems:'center',
      marginBottom:15,
      elavation:6,
},
catimage:{

    width:50,
    height:50,
},
cattext:{

       fontSize:15,
},
productcard:{
      
    flexDirection:'row',
    padding:10,
    

},
product:{
    width:'180',
    borderwidth:2,
    borderColor:'gray',
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:'white',
    elavation:6,
    padding:10,
    borderRadius:20,
    marginRight:15,
},
productimage:{

       width:100,
       height:100,
},
outlineBtn:{
     marginTop:10,
     borderWidth: 2,
  borderColor: 'gray',      // outline color
  paddingVertical: 5,
  paddingHorizontal: 20,
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
}

});