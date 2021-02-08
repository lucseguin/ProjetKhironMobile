import React, {useState, useEffect} from 'react';

//import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { withAuthenticator } from './components/Authentication';

import Amplify, { Auth }  from 'aws-amplify';
import awsconfig from './aws-exports';
import AWS from 'aws-sdk';
import axios from "axios"
import moment from 'moment';
import {
  Alert,
  Modal,
  Button,
  Platform,
  AppState,
  Appearance,
} from "react-native";

import { Text, View } from './components/Themed';
import PushNotificationIOS from "@react-native-community/push-notification-ios"
var PushNotification = require("react-native-push-notification");

import useCachedResources from './hooks/useCachedResources';
import Navigation from './navigation';
import DropDownPicker from 'react-native-dropdown-picker';
import {useTheme, themes}  from './components/ThemeContext'
import { Spinner } from 'native-base'
import BackgroundFetch from "react-native-background-fetch";
import * as Heartbeat from './components/Heartbeat'
import * as ModuleSettings from './components/ModuleSettings'
import EventCoordinator from './components/EventCoordinator';
import * as UserData from './components/UserData';

const globalAny:any = global

Amplify.configure({
  ...awsconfig,
  Analytics: {
    disabled: true,
  },
});

AWS.config.apiVersions = {
  sns: '2010-03-31',
  // other service API versions
};
AWS.config.credentials = { "accessKeyId": "", "secretAccessKey": "", "region": "us-east-1" };
AWS.config.update({region: "us-east-1"});

axios.defaults.baseURL = "";

axios.interceptors.request.use(function (config) {
    return Auth.currentSession()
      .then(session => {
        if(globalAny.user) {
          config.headers.Tenant = globalAny.user.tenant
        }
        // User is logged in. Set auth header on all requests
        config.headers.Authorization = session.getIdToken().getJwtToken();
        return Promise.resolve(config)
      })
      .catch(() => {
        // No logged-in user: don't set auth header
        return Promise.resolve(config)
      })
}) 

//const useForceUpdate = () => useState()[1];

function App() {
 
  const isLoadingComplete = useCachedResources();
  //var colorScheme = useColorScheme();
  //var { theme } = useTheme();
  
   const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());
   const [theme, setTheme] = useState(useTheme());

  const [verificationCompleted, setVerificationCompleted] = useState(false);
  const [verifyingUser, setVerifyingUser] = useState(false);
  const [userValidated, setUserValidated] = useState(false);
  const [needSomeAssignment, setNeedSomeAssignment] = useState(false);
  // const [allFloorDetails, setAllFloorDetails] = useState([]);
  // const [departments, setDepartments] = useState([]);
  const [sectorOptions, setSectorOptions] = useState([]);
  const [shiftsOptions, setShiftsOptions] = useState([]);
  //const [registeredDeviceToken, setRegisteredDeviceToken] = useState(null);

  const [selectedSector, setSelectedSector] = useState();
  const [selectedShift, setSelectedShift] = useState();
  const [currentState, setCurrentState] = useState(AppState.currentState);
  const [loadingMessage, setLoadingMessage] = useState('');


  function onAppearanceChange({ colorScheme }) {
    //console.log("[App] onAppearanceChange colorScheme:"+ colorScheme);
    setColorScheme(Appearance.getColorScheme());
    setTheme(useTheme());
  }

  useEffect(() => {
    globalAny.deviceToken = null;
    globalAny.user = null;
    globalAny.settings = null;
    globalAny.globalSettings = null;

    axios.defaults.baseURL = "https://projetkhiron.com:3000";

    AppState.addEventListener('change', handleAppStateChange);

    Appearance.addChangeListener(onAppearanceChange);

    PushNotification.configure({
      onRegister: function (token) {
        globalAny.deviceToken = token.token;
        
        subscribeToNotificationTopics();
      },
    
      // (required) Called when a remote is received or opened, or local notification is opened
      onNotification: function (notification) {
        console.log("[App] NOTIFICATION:", notification);
    
        // process the notification
        EventCoordinator.signal('notif', notification);

        if(notification.data.tenant === globalAny.user.tenant &&
          (notification.data.type === "bearer"  && globalAny.settings.options&ModuleSettings.MODULE_BEARER_VIEW) || 
           (notification.data.type === "cleaner" && globalAny.settings.options&ModuleSettings.MODULE_CLEANER_VIEW)) {
          if(!(globalAny.settings.options&ModuleSettings.ROLE_MOBILE_HIDE_REQUESTS) || ((globalAny.settings.options&ModuleSettings.ROLE_MOBILE_HIDE_REQUESTS) && UserData.isSilentMode() === false)){
            //var details = {alertBody:notification._data.body, alertTitle:notification._data.title, isSilent:false, soundName:"default"};
            PushNotification.localNotification({
              title: notification.data.title, 
              message: notification.data.body
            });
          }
        } 
    
        if(Platform.OS === 'ios') {
          PushNotificationIOS.getApplicationIconBadgeNumber(num => {
            PushNotificationIOS.setApplicationIconBadgeNumber(num+1);
          });
        }

        // (required) Called when a remote is received or opened, or local notification is opened
        notification.finish(PushNotificationIOS.FetchResult.NewData);
      },
    
      // (optional) Called when Registered Action is pressed and invokeApp is false, if true onNotification will be called (Android)
      onAction: function (notification) {
        //console.log("ACTION:", notification.action);
        //console.log("NOTIFICATION:", notification);
        // process the action
      },
    
      onRegistrationError: function(err) {
        console.log("Device Registration error "+  err.message);
      },
  
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });

    try{
      BackgroundFetch.configure({
        minimumFetchInterval: 15,     // <-- minutes (15 is minimum allowed)
        // Android options
        forceAlarmManager: false,     // <-- Set true to bypass JobScheduler.
        stopOnTerminate: true,
        startOnBoot: false,
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY, // Default
        requiresCharging: false,      // Default
        requiresDeviceIdle: false,    // Default
        requiresBatteryNotLow: false, // Default
        requiresStorageNotLow: false  // Default
      }, async (taskId) => {
        //console.log("[js] Heartbeat background-fetch event: ", taskId);
        Heartbeat.heartbeat();
        //loadRequestData(false);
        BackgroundFetch.finish(taskId);
      }, (error) => {
        console.log("BackgroundFetch failed to start");
        
      });
    } catch(error){
      console.log("BackgroundFetch.configure Error" + error.message);
    }

    BackgroundFetch.status((status) => {
      switch(status) {
        case BackgroundFetch.STATUS_RESTRICTED:
          Alert.alert("Restricted", "BackgroundFetch restricted");
          break;
        case BackgroundFetch.STATUS_DENIED:
          Alert.alert("Denied","BackgroundFetch denied");
          break;
        case BackgroundFetch.STATUS_AVAILABLE:
          //console.log("BackgroundFetch is enabled");
          break;
      }
    });

    if(!verificationCompleted && !verifyingUser) {
      //console.log("    - YES verifyAuthenticatedUser");
      verifyAuthenticatedUser();
    } else {
      //console.log("    - verificationCompleted:"+ verificationCompleted + " verifyingUser:"+ verifyingUser);
    }

    return () => {
      globalAny.deviceToken = null;
      globalAny.user = null;
      globalAny.settings = null;
      globalAny.globalSettings = null;
      Appearance.removeChangeListener(onAppearanceChange);
      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, []);
  
  function handleAppStateChange(nextAppState:any) {
    //console.log('***handleAppStateChange' + nextAppState);
    if (nextAppState === 'active') {
      //console.log('App has come to the foreground!')
      //Heartbeat.startHeartbeat();
      if(Platform.OS !== 'android') {
        PushNotificationIOS.setApplicationIconBadgeNumber(0);
        PushNotificationIOS.removeAllDeliveredNotifications();
      }
    } else {
      //Heartbeat.pauseHeartbeat();
    }
    setCurrentState(nextAppState);
  }

  function subscribeToNotificationTopics() {
    if(globalAny.deviceToken && globalAny.globalSettings) {
      console.log("Subscribing device to AWS SNS");
      //console.log(globalAny.globalSettings.notif);
      
      var sns = new AWS.SNS();

      var params = {
        PlatformApplicationArn: '', /* required */
        Token: globalAny.deviceToken, /* required */
      };

      if(Platform.OS === 'ios') {
        //params.PlatformApplicationArn = 'arn:aws:sns:us-east-1:168782670032:app/APNS_SANDBOX/ProjetKhironMobileDev'; //DEV
        params.PlatformApplicationArn = globalAny.globalSettings.notif.ios; //PROD
      } else if(Platform.OS === 'android') {
        params.PlatformApplicationArn = globalAny.globalSettings.notif.android;
      } else {
        console.log("Unsupported notification platform");
      }

      sns.createPlatformEndpoint(params, function(err, data) {
        if (err) {
          console.log("AWS SNS createPlatformEndpoint" );
          console.log(err, err.stack); // an error occurred
        } else {

          var params = {
            Protocol: 'application', /* required */
            TopicArn: globalAny.globalSettings.notif.bearer, /* required */
            Endpoint: data.EndpointArn,
            ReturnSubscriptionArn: true
          };

          sns.subscribe(params, function(err, data) {
            if (err){ 
              console.log("AWS SNS ProjetKhiron-Bearer-Requests topic subscription !ERROR!");
              console.log(err, err.stack); // an error occurred
            }   
          });
        
          var params = {
            Protocol: 'application', /* required */
            TopicArn: globalAny.globalSettings.notif.cleaner, /* required */
            Endpoint: data.EndpointArn,
            ReturnSubscriptionArn: true
          };
          
          sns.subscribe(params, function(err, data) {
            if (err){ 
              console.log("AWS SNS ProjetKhiron-Cleaner-Requests topic subscription !ERROR!");
              console.log(err, err.stack); // an error occurred
            }  
          });
        }
      });
    } else {
      //console.log("[subscribeToNotificationTopics] don't have device token and/or global settings");
    }
  }

  async function verifyAuthenticatedUser(){
    setVerifyingUser(true);
    setLoadingMessage("Verification du compte.");
    try {
      let authUser = await Auth.currentAuthenticatedUser();
      const response = await axios.get("/projetkhiron/accounts", {
        params: {
            email: authUser.attributes.email
          }
      });
      
      if (response.status === 200 && response.data.length === 1) {
        globalAny.user = response.data[0];//subsequent axios request will be tenant aware
        
        Heartbeat.heartbeat('online');

        UserData.loadUserData();

        setLoadingMessage("Verification du role.");
        const rolesReq = axios.get("/projetkhiron/roles", {
          params: {
              name: globalAny.user.role.name
            }
        });
        const globalSettingsReq = axios.get("/projetkhiron/settings", {
          params: {
              config: "production"
            }
        });

        const responses = await axios.all([rolesReq, globalSettingsReq]);
        if(responses) {
          const rolesRes = responses[0];
          const globalSettingsRes = responses[1];

          if (rolesRes.status === 200 && globalSettingsRes.status === 200 && rolesRes.data.length === 1) {
            globalAny.settings = rolesRes.data[0].settings;
            globalAny.globalSettings = globalSettingsRes.data[0];

            subscribeToNotificationTopics();

            //redirect subsequent calls to appropriate infrastructure,
            //in the future, this value should be obtained as an attribute retreived from cognito upon
            //a successfull login
            axios.defaults.baseURL = "https://"+globalAny.globalSettings.host+":3000";

            if((globalAny.user.role.name==="bearer" || globalAny.user.role.name==="cleaner") && (globalAny.settings.useSectors || globalAny.settings.useShifts)) {
              //console.log("Need sector assignment!");
              if(globalAny.settings.useSectors) {
                setLoadingMessage("Chargement des données de démarrage.");

                let floorList = axios.get("/projetkhiron/floors");
                const responses = await axios.all([floorList]);
                if(responses) {
                  const floorListRes = responses[0];

                  let so = [];
                  globalAny.globalSettings.departments.forEach( department => {
                    so.push({label:department.text, value:department._id, type:'department'});
                  });


                  if (floorListRes.status === 200 ) {
                    floorListRes.data.forEach( floor => {
                      so.push({label:floor.label, value:floor._id, type:'floor',});
                      if(floor.sections && floor.sections.length > 0) {
                        floor.sections.forEach( (section: { label: string; _id: any; }) => {
                          so.push({label:floor.label + " " + section.label, value:section._id, type:'section'});
                        });
                      }
                    });
                  } else {
                    //console.log(floorListRes);
                  }

                  setSectorOptions(so);

                  let shifts = [];
                  globalAny.settings.shifts.forEach( (shift: { from: string; to: string; _id: any; }) => {
                    var hour = moment().add(30, 'm').hour();
                    var fromHour = parseInt(shift.from.split(":")[0]);
                    var toHour = parseInt(shift.to.split(":")[0]);
                    if(toHour === 0)
                      toHour = 24;
                    //console.log("hour:" + hour + " fromHour:"+ fromHour + " toHour:" + toHour);
                    if(hour >= fromHour && hour < toHour)
                      setSelectedShift(shift._id);

                    shifts.push({label:shift.from + "-" + shift.to, value:shift._id});
                  });

                  setShiftsOptions(shifts);
                }
              }

              setNeedSomeAssignment(true);
            }

            setUserValidated(true);
          } else {
            console.log("did not find roles");
            console.log(response);
          }
        }
      } else {
        console.log("did not find user");
        EventCoordinator.signal('auth', {type:'signOut', data:null, message:'Unknown user, kicking out', errorMessage:"Vous n'avez pas encore access à l'application. Veuillez contacter votre administrateur."});
      }
    } catch (err) {
        console.log("[App] Failed user verification" +  err.message);
        EventCoordinator.signal('auth', {type:'signOut', data:null, message:'Failed user verification, kicking out.'});
    } finally {
      //console.log("All verifications complete");
      setVerificationCompleted(true);
      setVerifyingUser(false);
    }
  }
  
  function startApp() {
    globalAny.shift = selectedShift;
    globalAny.sectorOptions = sectorOptions;
    globalAny.shiftsOptions = shiftsOptions;
    setNeedSomeAssignment(false);
  }

  const handleSelectedSector = async (sectorValue:string) => {
    setSelectedSector(sectorValue);
    UserData.updateSector(sectorValue);
  }

  //console.log("needSectorAssignment:"+ needSectorAssignment);
  if (!isLoadingComplete || !userValidated) {
    return  <SafeAreaProvider>
       <View style={{
        flex: 1, 
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor:theme.SystemBackgroundColor,
      }} >
        <Spinner />
        <Text>{loadingMessage}</Text>
      </View>
      </SafeAreaProvider>
      ; //apploading
  } else if (needSomeAssignment) {
    return (
      <SafeAreaProvider>
      <View style={{
        flex: 1, 
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor:theme.SystemBackgroundColor,
      }} >
      <Modal
        animationType="slide"
        transparent={true}
        visible={needSomeAssignment}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
        }}
      >
        <View style={{
            marginTop: 22,
            backgroundColor:theme.SystemBackgroundColor
          }}>
          <View style={{
              justifyContent: 'center',
              alignItems: 'center',
              margin: 20,
              borderRadius: 20,
              padding: 10,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
              backgroundColor:theme.SecondarySystemBackgroundColor
            }}>
          
          {globalAny.settings.useShifts?
            <View style={{
              ...(Platform.OS !== 'android' && {
                  zIndex: 20
              }), padding: 10, width:'100%', justifyContent: 'center', alignItems: 'center',
              backgroundColor:theme.SecondarySystemBackgroundColor
             }}>
              <Text>Quart de travail</Text>
              <DropDownPicker
                  items={shiftsOptions}
                  defaultValue={selectedShift}
                  containerStyle={{height: 40, width:'80%'}}
                  style={{ backgroundColor: theme.TertiarySystemBackgroundColor}}
                  labelStyle={{color:theme.LabelColor,}}
                  itemStyle={{
                      justifyContent: 'flex-start', 
                      width:200,
                      color:theme.LabelColor
                  }}
                  dropDownStyle={{backgroundColor: theme.TertiarySystemBackgroundColor}}
                  onChangeItem={item => setSelectedShift(item.value)}
                  placeholder="Selectionner votre quart de travail"
              />
            </View>
            :null}
          {globalAny.settings.useSectors?
            <View style={{
              ...(Platform.OS !== 'android' && {
                zIndex: 20
            }), padding: 10, width:'100%', justifyContent: 'center', alignItems: 'center',
            backgroundColor:theme.SecondarySystemBackgroundColor
             }}>
              <Text>Secteur assigné</Text>
              <DropDownPicker
                  items={sectorOptions}
                  defaultValue={selectedSector}
                  containerStyle={{height: 40, width:'80%'}}
                  labelStyle={{color:theme.LabelColor,}}
                  searchable
                  style={{backgroundColor: theme.TertiarySystemBackgroundColor}}
                  itemStyle={{
                      justifyContent: 'flex-start',
                      color:theme.LabelColor
                  }}
                  dropDownMaxHeight={300}
                  dropDownStyle={{backgroundColor: theme.TertiarySystemBackgroundColor}}
                  onChangeItem={item => handleSelectedSector(item.value)}
                  placeholder="Selectionner secteur assigé"
              />
            </View>:null}
            <View style={{
                padding: 10,backgroundColor:theme.SecondarySystemBackgroundColor
              }}>
              <Button
                title="Démarer"
                disabled={globalAny.settings.useShifts&&!selectedShift}
                onPress={() => startApp()}
              />
              </View>
          </View>
        </View>
      </Modal>
    </View>
    </SafeAreaProvider>
);
  } else {
    return (
      <SafeAreaProvider>
        <Navigation colorScheme={colorScheme} />
      </SafeAreaProvider>
    );
  }
}

export default withAuthenticator(App, "cognito");