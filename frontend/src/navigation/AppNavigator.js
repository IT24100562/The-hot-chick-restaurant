import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import colors from '../styles/colors';
import { SafeIcon } from '../components/SafeIcon';

// Auth Screens
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Customer Screens
import HomeScreen from '../screens/customer/HomeScreen';
import MenuScreen from '../screens/customer/MenuScreen';
import FoodDetailScreen from '../screens/customer/FoodDetailScreen';
import CartScreen from '../screens/customer/CartScreen';
import OrderScreen from '../screens/customer/OrderScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import PromotionsScreen from '../screens/customer/PromotionsScreen';
import ReservationScreen from '../screens/customer/ReservationScreen';
import DeliveryDashboard from '../screens/customer/DeliveryDashboard';
import ReviewScreen from '../screens/customer/ReviewScreen';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import ManageFoods from '../screens/admin/ManageFoods';
import AddEditFood from '../screens/admin/AddEditFood';
import ManageCategories from '../screens/admin/ManageCategories';
import ManageUsers from '../screens/admin/ManageUsers';
import ManageOrders from '../screens/admin/ManageOrders';
import ManagePromotions from '../screens/admin/ManagePromotions';
import ManageReviews from '../screens/admin/ManageReviews';
import AdminReservations from '../screens/admin/AdminReservations';
import AdminPayments from '../screens/admin/AdminPayments';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Customer Bottom Tabs
function CustomerTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.backgroundLight,
                    borderTopColor: colors.glassBorder,
                    borderTopWidth: 0,
                    paddingBottom: 10,
                    paddingTop: 10,
                    height: 74,
                    position: 'absolute',
                    left: 14,
                    right: 14,
                    bottom: 14,
                    borderRadius: 18,
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.14,
                    shadowRadius: 16,
                    elevation: 10,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Menu') iconName = focused ? 'restaurant' : 'restaurant-outline';
                    else if (route.name === 'Cart') iconName = focused ? 'cart' : 'cart-outline';
                    else if (route.name === 'Orders') iconName = focused ? 'receipt' : 'receipt-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                    return <SafeIcon name={iconName} size={24} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home', tabBarLabel: 'Home' }} />
            <Tab.Screen name="Menu" component={MenuScreen} options={{ title: 'Menu', tabBarLabel: 'Menu' }} />
            <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Cart', tabBarLabel: 'Cart' }} />
            <Tab.Screen name="Orders" component={OrderScreen} options={{ title: 'Orders', tabBarLabel: 'Orders' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile', tabBarLabel: 'Profile' }} />
        </Tab.Navigator>
    );
}

// Admin Bottom Tabs
function AdminTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.backgroundLight,
                    borderTopColor: colors.glassBorder,
                    borderTopWidth: 0,
                    paddingBottom: 10,
                    paddingTop: 10,
                    height: 74,
                    position: 'absolute',
                    left: 14,
                    right: 14,
                    bottom: 14,
                    borderRadius: 18,
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.14,
                    shadowRadius: 16,
                    elevation: 10,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
                    else if (route.name === 'Foods') iconName = focused ? 'fast-food' : 'fast-food-outline';
                    else if (route.name === 'OrdersMgmt') iconName = focused ? 'receipt' : 'receipt-outline';
                    else if (route.name === 'Reviews') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    else if (route.name === 'AdminProfile') iconName = focused ? 'settings' : 'settings-outline';
                    return <SafeIcon name={iconName} size={24} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Dashboard" component={AdminDashboard} options={{ title: 'Dashboard', tabBarLabel: 'Dashboard' }} />
            <Tab.Screen name="Foods" component={ManageFoods} options={{ title: 'Foods', tabBarLabel: 'Foods' }} />
            <Tab.Screen name="OrdersMgmt" component={ManageOrders} options={{ title: 'Orders', tabBarLabel: 'Orders' }} />
            <Tab.Screen name="Reviews" component={ManageReviews} options={{ title: 'Reviews', tabBarLabel: 'Reviews' }} />
            <Tab.Screen name="AdminProfile" component={ProfileScreen} options={{ title: 'Profile', tabBarLabel: 'Profile' }} />
        </Tab.Navigator>
    );
}

// Delivery Bottom Tabs
function DeliveryTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.backgroundLight,
                    borderTopColor: colors.glassBorder,
                    borderTopWidth: 0,
                    paddingBottom: 10,
                    paddingTop: 10,
                    height: 74,
                    position: 'absolute',
                    left: 14,
                    right: 14,
                    bottom: 14,
                    borderRadius: 18,
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.14,
                    shadowRadius: 16,
                    elevation: 10,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Delivery') iconName = focused ? 'bicycle' : 'bicycle-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                    return <SafeIcon name={iconName} size={24} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Delivery" component={DeliveryDashboard} options={{ title: 'Orders', tabBarLabel: 'Orders' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile', tabBarLabel: 'Profile' }} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { user, loading } = useAuth();

    if (loading) {
        return <SplashScreen />;
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: colors.background },
            }}
        >
            {user?.role === 'admin' ? (
                // Admin Stack
                <>
                    <Stack.Screen name="AdminMain" component={AdminTabs} />
                    <Stack.Screen name="AddEditFood" component={AddEditFood} />
                    <Stack.Screen name="ManageCategories" component={ManageCategories} />
                    <Stack.Screen name="ManageUsers" component={ManageUsers} />
                    <Stack.Screen name="ManagePromotions" component={ManagePromotions} />
                    <Stack.Screen name="AdminReservations" component={AdminReservations} />
                    <Stack.Screen name="AdminPayments" component={AdminPayments} />
                    <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
                </>
            ) : user?.role === 'delivery' ? (
                // Delivery Stack
                <>
                    <Stack.Screen name="DeliveryMain" component={DeliveryTabs} />
                </>
            ) : user ? (
                // Authenticated Customer Stack
                <>
                    <Stack.Screen name="CustomerMain" component={CustomerTabs} />
                    <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
                    <Stack.Screen name="Reviews" component={ReviewScreen} />
                    <Stack.Screen name="Promotions" component={PromotionsScreen} />
                    <Stack.Screen name="Reservation" component={ReservationScreen} />
                </>
            ) : (
                // Guest Stack
                <>
                    <Stack.Screen name="CustomerMain" component={CustomerTabs} />
                    <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
                    <Stack.Screen name="Reviews" component={ReviewScreen} />
                    <Stack.Screen name="Promotions" component={PromotionsScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="Splash" component={SplashScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}
