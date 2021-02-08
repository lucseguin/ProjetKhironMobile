//import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import {
  TouchableHighlight,
  View,
  StyleSheet
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Colors from '../constants/Colors';
import useColorScheme from '../hooks/useColorScheme';
import BearerScreen from '../screens/BearerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CleanerScreen from '../screens/CleanerScreen';
import { BottomTabParamList, BearerParamList, TabTwoParamList, SettingsParamList } from '../types';
import * as Heartbeat from '../components/Heartbeat';
import * as ModuleSettings from '../components/ModuleSettings'
import MaterialCommunityIcon from 'react-native-vector-icons/dist/MaterialCommunityIcons';
import { logoutUser } from '../components/Authentication';

const globalAny:any = global

const BottomTab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
  const colorScheme = useColorScheme();

  return (
    
    <BottomTab.Navigator
      initialRouteName="TabOne"
      tabBarOptions={{ activeTintColor: Colors[colorScheme].tint }}>
      
      {globalAny.settings.options&ModuleSettings.MODULE_BEARER_VIEW?<BottomTab.Screen
        name="TabOne"
        component={BearerNavigator}
        options={{
          tabBarLabel: "Brancarderie",
          tabBarIcon: ({ color }) =>  <Icon name="transfer-within-a-station" size={30} style={{ marginBottom: -3 }} color={color} />,
        }}
      />:null}

      {globalAny.settings.options&ModuleSettings.MODULE_CLEANER_VIEW?
      <BottomTab.Screen
        name="TabTwo"
        component={CleanerNavigator}
        options={{
          tabBarLabel: "Nettoyage",
          tabBarIcon: ({ color }) => <MaterialCommunityIcon name="spray" size={30} color={color} />,
        }}
      />
      :null}

      <BottomTab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          tabBarLabel: "Configuration",
          tabBarIcon: ({ color }) => <Icon name="settings" size={30} style={{ marginBottom: -3 }} color={color} />,
        }}
      />
    </BottomTab.Navigator>
  );
}

// You can explore the built-in icon families and icons on the web at:
// https://icons.expo.fyi/
function TabBarIcon(props: { name: string; color: string }) {
  return <Icon size={30} style={{ marginBottom: -3 }} {...props} />;
}

// Each tab has its own navigation stack, you can read more about this pattern here:
// https://reactnavigation.org/docs/tab-based-navigation#a-stack-navigator-for-each-tab
const BearerStack = createStackNavigator<BearerParamList>();

function BearerNavigator() {
  const colorScheme = useColorScheme();

  async function handleLogout() {
    Heartbeat.heartbeat('offline');
    await logoutUser("cognito");
  }
  return (
    <BearerStack.Navigator>
      <BearerStack.Screen
        name="BearerScreen"
        component={BearerScreen}
        options={{ 
          headerTitle: 'Demandes brancarderie',
          headerRight: () => (
            <View style={{ marginRight:10}}>
            <TouchableHighlight
              onPress={() => handleLogout()
              }
            >
              <AntDesign name="logout" color={Colors[colorScheme].tint} size={25} style={{ marginBottom: -3, marginRight:5}} />
            </TouchableHighlight>
          </View>
          ),
        }}

      />
    </BearerStack.Navigator>
  );
}

const CleanerStack = createStackNavigator<TabTwoParamList>();

function CleanerNavigator() {
  const colorScheme = useColorScheme();
  async function handleLogout() {
    Heartbeat.heartbeat('offline');
    await logoutUser("cognito");
  }
  return (
    <CleanerStack.Navigator>
      <CleanerStack.Screen
        name="CleanerScreen"
        component={CleanerScreen}
        options={{ headerTitle: 'Nettoyage et salubrité',
        headerRight: () => (
          <View style={{ marginRight:10}}>
            <TouchableHighlight
              onPress={() => handleLogout()
              }
            >
              <AntDesign name="logout" color={Colors[colorScheme].tint}  size={25} style={{ marginBottom: -3, marginRight:5}} />
            </TouchableHighlight>
          </View>
        ) }}
      />
    </CleanerStack.Navigator>
  );
}

const SettingsStack = createStackNavigator<SettingsParamList>();

function SettingsNavigator() {
  const colorScheme = useColorScheme();
  async function handleLogout() {
    Heartbeat.heartbeat('offline');
    await logoutUser("cognito");
  }
  return (
    <BearerStack.Navigator>
      <BearerStack.Screen
        name="BearerScreen"
        component={SettingsScreen}
        options={{ headerTitle: 'Configuration',
        headerRight: () => (
          <View style={{ marginRight:10}}>
            <TouchableHighlight
              onPress={() => handleLogout()
              }
            >
              <AntDesign name="logout" color={Colors[colorScheme].tint}  size={25} style={{ marginBottom: -3, marginRight:5}} />
            </TouchableHighlight>
          </View>
        ) }}
      />
    </BearerStack.Navigator>
  );
}

const styles = StyleSheet.create({
  openButton: {
    backgroundColor: "#F194FF",
    borderRadius: 20,
    padding: 10,
    elevation: 2
  },
});
