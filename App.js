import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { getInstallReferrer } from 'react-native-play-install-referrer';
import { Linking } from 'react-native';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

import { Alert } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Import your screens
import SplashScreen from './Masonecom/SplashScreen';
import LoginScreen from './Masonecom/LoginScreen';
import VerificationPage from './Masonecom/VerificationPage';
import RegisterScreen from './Masonecom/RegisterScreen';
import WelcomePage from './Masonecom/WelcomePage';
import HomeScreen from './Masonecom/Home';
import AllCategory from './Masonecom/AllCategory.js';
import ViewCart from './Masonecom/ViewCart';

import Profile from './Masonecom/Profile';
import Membership from './Masonecom/Membership';
import MembershipPaymentScreen from './Masonecom/MembershipPaymentScreen.js';
import Membershipsuccess from './Masonecom/Membershipsuccess';
import Membershipfailed from './Masonecom/Membershipfailed';
import MyOrders from './Masonecom/Myorders';
import SuccessScreen from './Masonecom/SuccessScreen';
import FailedScreen from './Masonecom/FailedScreen';
import Locationscreen from './Masonecom/location';
import NoInternetScreen from './Masonecom/Nointernet';
import Coupons from './Masonecom/Coupons';
import ShopPage from './Masonecom/ShopPage';
import Invoice from './Masonecom/Invoice';
import ProductDetail from './Masonecom/ProductDetails';
import Myrefferal from './Masonecom/Myrefferal';
import Kyc from './Masonecom/Kyc';
import Refferalincome from './Masonecom/Refferalincome';

import Mydesign from './Masonecom/Mydesign';

import ScannerScreen from './Masonecom/ScannerScreen.js';
import PaymentScreen from './Masonecom/PaymentScreen.js';
import WhislistScreen from './Masonecom/WhislistScreen.js';





import RentalMeterialHome from './RentalMeterial/Home';
import RentalMeterialShop from './RentalMeterial/Shop';
import RentalMeterialProductDetails from './RentalMeterial/ProductDetails';
import RentalMeterialCartScreen from './RentalMeterial/CartScreen';
import RentalSuccess from './RentalMeterial/RentalSuccess';
import MyBooking from './RentalMeterial/MyBooking';
import RentalInvoice from './RentalMeterial/Invoice';
import WhisleList from './RentalMeterial/RentalWhishlist.js';



import HomeScreenVehicle from './RentalVechile/HomeScreenVehicle.js';
import CategoriesScreen from './RentalVechile/CategoriesScreen.js';
import BookingScreen from './RentalVechile/BookingScreen.js';
import DetailsScreen from './RentalVechile/ViewBookingDetailsScreen.js';
import VehicleScreen from './RentalVechile/VehicleScreen.js';
import FinalVendorScreen from './RentalVechile/FinalVendorScreen.js';



import RealEstateHome from './RealEstate/Home';
import RealEstateCategory from './RealEstate/CategoryScreen';
import PropertyDetails from './RealEstate/PropertyDetails.js';
import RealSuccessScreen from './RealEstate/RealSuccessScreen.js';
import RealBookingScreen from './RealEstate/RealBookingScreen.js';
import UserBookings from './RealEstate/MyBookings.js';
import Interested from './RealEstate/Interested.js';


import RealVendorCategory from './RealEstateVendor/RealVendorCategory.js';
import ApartmentUpload from './RealEstateVendor/ApartmentUpload.js';
import ApartmentSuccess from './RealEstateVendor/ApartmentSuccess.js';

import MyListing from './RealEstateVendor/MyListing.js';
import RealDashboard from './RealEstateVendor/RealDashboard.js';
import RealMembership from './RealEstateVendor/RealMemberShip.js';

import RealMembersuccess from './RealEstateVendor/RealMembersuccess.js';
import RealMemberfailed from './RealEstateVendor/RealMemberfailed.js';

import ViewDetails from './RealEstate/ViewDetails.js';




import StoreDashboard from './Vendorpage/Storedashboard.js';
import CreateStore from './Vendorpage/CreateStore';
import KycFormstore from './Vendorpage/KycFormstore.js';
import GenerateCoupons from './Vendorpage/GenerateCoupons.js';
import AllCoupons from './Vendorpage/AllCoupons.js';
import ReedemHistory from './Vendorpage/ReedemHistory.js';
import StoreEditProfile from './Vendorpage/EditProfile.js';
import CouponsDetails from './Vendorpage/CouponsDetails.js';



import VechileDashboard from './Vendorpage/VechileDashboard';
import RegisterVehicle from './Vendorpage/RegisterVechile';
import Kycformvechile from './Vendorpage/Kycformvechile';
import AddVechile from './Vendorpage/AddVechile';
import VendorVechileDetails from './Vendorpage/VendorVechileDetails';

import VechileBookingDetails from './Vendorpage/VechileBookingDetails';
import VechileBookingAllDetails from './Vendorpage/VechileBookingAllDetails';
import VendorAllVechiles from './Vendorpage/VendorAllVechiles';
import CouponGateway from './Vendorpage/CouponGateway.js';


import Resale from './Resale/Home';
import PostItems from './Resale/PostItems';

import Explore from './Resale/Explore';
import AllProducts from './Resale/AllProducts.js';
import ResaleDetails from './Resale/ResaleDetails.js';
import ChatPage from './Resale/ChatPage.js';
import ChatList from './Resale/ChatList.js';
import UserResale from './Resale/UserResale.js';

import ResaleMembership from './Resale/ResaleMember.js';

import ResaleMembersuccess from './Resale/ResaleMembersuccess.js';
import ResaleMemberfailed from './Resale/ResaleMemberfailed.js';


import StoreCoupons from './Coupons/StoreCoupons.js';
import CouponDetails from './Coupons/CouponDetails.js';
import CouponsHome from './Coupons/CouponsHome.js';
import CouponSuccess from './Coupons/CouponSuccess.js';
import AllReedems from './Coupons/AllReedems.js';

import UserRedeemHistory from './Coupons/ReedemHistory.js';



import DairyList from "./Dairy/HomeScreen.js"
import CategoriesDiary from "./Dairy/CategoriesDiary.js"
import CreateDVC from "./Dairy/CreateDVC.js"
import DVCQR from "./Dairy/DVCQR.js"
import MyDVC from "./Dairy/MyDVC.js"

import AllDVC from "./Dairy/AllDVC.js"
import Myupload from "./Dairy/Myupload.js"

import DVCSubscription from "./Dairy/DVCsubscription.js"
import DVCsuccess from "./Dairy/DVCsuccess.js"
import DVCfailed from "./Dairy/DVCfailed.js"






const Stack = createStackNavigator();

export default function App() {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  // ✅ Create client
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 0, // 5 min cache default
        cacheTime: 1000 * 60 * 5, // 24 hrs keep cache
      },
    },
  });

  // ✅ Persist cache to device storage
  const persister = createAsyncStoragePersister({
    storage: AsyncStorage,
  });

  // ✅ Save cache even after app close
  persistQueryClient({
    queryClient,
    persister,
  });

  useEffect(() => {

    const handleLink = async (url) => {
      if (!url) return;

      console.log("URL:", url);

      const ref = url.split('ref/')[1];

      if (ref) {
        console.log("Referral:", ref);
        await AsyncStorage.setItem('referral', ref);
      }
    };

    // when app closed
    Linking.getInitialURL().then(handleLink);

    // when app open
    const sub = Linking.addEventListener('url', e => handleLink(e.url));

    return () => sub.remove();

  }, []);


  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const handleRetry = () => {
    setIsChecking(true);
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
      setIsChecking(false);
    });
  };

  if (!isConnected) {
    return <NoInternetScreen onRetry={handleRetry} isChecking={isChecking} />;
  }

  // Show your app when connected
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <NavigationContainer>

          <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false,animation: 'fade' }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="VerificationPage" component={VerificationPage} />
            <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
            <Stack.Screen name="WelcomePage" component={WelcomePage} />
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="AllCategory" component={AllCategory} />


            <Stack.Screen name="ViewCart" component={ViewCart} />
            <Stack.Screen name="Membership" component={Membership} />
            <Stack.Screen name="MembershipPaymentScreen" component={MembershipPaymentScreen} />
            <Stack.Screen name="MembershipSuccess" component={Membershipsuccess} />
            <Stack.Screen name="Membershipfailed" component={Membershipfailed} />
            <Stack.Screen name="MyOrders" component={MyOrders} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="SuccessScreen" component={SuccessScreen} />
            <Stack.Screen name="FailedScreen" component={FailedScreen} />
            <Stack.Screen name="Location" component={Locationscreen} />
            <Stack.Screen name="Invoice" component={Invoice} />
            <Stack.Screen name="Coupons" component={Coupons} />
            <Stack.Screen name="ShopPage" component={ShopPage} />
            <Stack.Screen name="ProductDetails" component={ProductDetail} />
            <Stack.Screen name="Myrefferal" component={Myrefferal} />
            <Stack.Screen name="WhisListScreen" component={WhislistScreen} />



            <Stack.Screen name="Kyc" component={Kyc} />
            <Stack.Screen name="RefferalIncome" component={Refferalincome} />
            <Stack.Screen name="Mydesign" component={Mydesign} />
            <Stack.Screen name="ScannerScreen" component={ScannerScreen} />
            <Stack.Screen name="PaymentScreen" component={PaymentScreen} />

            <Stack.Screen name="MeterialHome" component={RentalMeterialHome} />
            <Stack.Screen name="MeterialShop" component={RentalMeterialShop} />
            <Stack.Screen name="MeterialProductDetails" component={RentalMeterialProductDetails} />
            <Stack.Screen name="CartScreen" component={RentalMeterialCartScreen} />
            <Stack.Screen name="RentalSuccess" component={RentalSuccess} />
            <Stack.Screen name="MyBooking" component={MyBooking} />
            <Stack.Screen name="RentalInvoice" component={RentalInvoice} />
            <Stack.Screen name="WhisleList" component={WhisleList} />






            <Stack.Screen name="HomeVechile" component={HomeScreenVehicle} />
            <Stack.Screen name="CategoriesScreen" component={CategoriesScreen} />
            <Stack.Screen name="BookingScreen" component={BookingScreen} />
            <Stack.Screen name="VechileScreen" component={VehicleScreen} />
            <Stack.Screen name="FinalVendorScreen" component={FinalVendorScreen} />
            <Stack.Screen name="DetailsScreen" component={DetailsScreen} />


            <Stack.Screen name="RealEstateHome" component={RealEstateHome} />
            <Stack.Screen name="RealEstateCategory" component={RealEstateCategory} />
            <Stack.Screen name="PropertyDetails" component={PropertyDetails} />
            <Stack.Screen name="RealSuccessScreen" component={RealSuccessScreen} />
            <Stack.Screen name="RealBookingScreen" component={RealBookingScreen} />
            <Stack.Screen name="UserBookings" component={UserBookings} />
            <Stack.Screen name="Interested" component={Interested} />

            <Stack.Screen name="RealVendorCategory" component={RealVendorCategory} />
            <Stack.Screen name="ApartmentUpload" component={ApartmentUpload} />
            <Stack.Screen name="ApartmentSuccess" component={ApartmentSuccess} />
            <Stack.Screen name="MyListing" component={MyListing} />
            <Stack.Screen name="RealDashboard" component={RealDashboard} />
            <Stack.Screen name="RealMembership" component={RealMembership} />
            <Stack.Screen name="RealMembersuccess" component={RealMembersuccess} />
            <Stack.Screen name="RealMemberfailed" component={RealMemberfailed} />
            <Stack.Screen name="ViewDetails" component={ViewDetails} />





            {/* <Stack.Screen name="OrderTracking" component={OrderTracking} /> */}



            <Stack.Screen name="StoreDashboard" component={StoreDashboard} />
            <Stack.Screen name="CreateStore" component={CreateStore} />
            <Stack.Screen name="Kycformstore" component={KycFormstore} />
            <Stack.Screen name="GenerateCoupons" component={GenerateCoupons} />
            <Stack.Screen name="AllCoupons" component={AllCoupons} />
            <Stack.Screen name="ReedemHistory" component={ReedemHistory} />
            <Stack.Screen name="StoreEditProfile" component={StoreEditProfile} />
            <Stack.Screen name="CouponsDetails" component={CouponsDetails} />
                 <Stack.Screen name="CouponGateway" component={CouponGateway} />

            <Stack.Screen name="RegisterVechile" component={RegisterVehicle} />
            <Stack.Screen name="VechileDashboard" component={VechileDashboard} />
            <Stack.Screen name="Kycformvechile" component={Kycformvechile} />

            <Stack.Screen name="AddVechile" component={AddVechile} />
            <Stack.Screen name="VendorVechileDetails" component={VendorVechileDetails} />
            <Stack.Screen name="VechileBookingAllDetails" component={VechileBookingAllDetails} />
            <Stack.Screen name="VechileBookingDetails" component={VechileBookingDetails} />


            <Stack.Screen name="VendorAllVechiles" component={VendorAllVechiles} />



            <Stack.Screen name="Resale" component={Resale} />
            <Stack.Screen name="PostItems" component={PostItems} />
            <Stack.Screen name="Explore" component={Explore} />
            <Stack.Screen name="AllProducts" component={AllProducts} />
            <Stack.Screen name="ResaleDetails" component={ResaleDetails} />
            <Stack.Screen name="ChatList" component={ChatList} />
            <Stack.Screen name="ResaleMembership" component={ResaleMembership} />
            <Stack.Screen name="ResaleMembersuccess" component={ResaleMembersuccess} />
            <Stack.Screen name="ResaleMemberfailed" component={ResaleMemberfailed} />

            <Stack.Screen name="ChatPage" component={ChatPage} />


            <Stack.Screen name="StoreCoupons" component={StoreCoupons} />
            <Stack.Screen name="CouponDetailScreen" component={CouponDetails} />
            <Stack.Screen name="CouponsHome" component={CouponsHome} />
            <Stack.Screen name="CouponSuccess" component={CouponSuccess} />
            <Stack.Screen name="AllReedems" component={AllReedems} />

            <Stack.Screen name="UserReedemHistory" component={UserRedeemHistory} />

            <Stack.Screen name="UserResale" component={UserResale} />


            <Stack.Screen name="DairyList" component={DairyList} />
            <Stack.Screen name="CreateDVC" component={CreateDVC} />
            <Stack.Screen name="Diary" component={CategoriesDiary} />
            <Stack.Screen name="DVCQR" component={DVCQR} />
            <Stack.Screen name="MyDVC" component={MyDVC} />
            <Stack.Screen name="AllDVC" component={AllDVC} />
            <Stack.Screen name="Myupload" component={Myupload} />
            <Stack.Screen name="DVCsubscription" component={DVCSubscription} />
            <Stack.Screen name="DVCsuccess" component={DVCsuccess} />
            <Stack.Screen name="DVCfailed" component={DVCfailed} />



          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </QueryClientProvider>
  );
}