import React from 'react';
import AsyncStorage from '@react-native-community/async-storage';

const globalAny:any = global

export const loadUserData = () => {
    var userData = null;
    var storageKey = '@'+globalAny.user._id+'_'+globalAny.user.role.name+'_Key';

    AsyncStorage.getItem(storageKey)
    .then(jsonValue => {
      if(jsonValue === null) {
        //setting defaults
        userData = { silentMode:false, sector:'', showCurrentRequests:false};
        globalAny.userData = userData;
        AsyncStorage.setItem(storageKey, JSON.stringify(userData)).catch(e => {
          console.log("[SettingsScreen] loadUserData AsyncStorage.setItem Error " + e.message);
        })
      } else {
        userData = JSON.parse(jsonValue);
        globalAny.userData = userData;
      }
    })
    .catch(e => {
      console.log("[SettingsScreen] loadUserData AsyncStorage.getItem Error " + e.message);
      userData = { silentMode:false, sector:'', showCurrentRequests:false};
      globalAny.userData = userData;
      AsyncStorage.setItem(storageKey, JSON.stringify(globalAny.userData)).catch(e => {
        console.log("[SettingsScreen] loadUserData AsyncStorage.setItem Error " + e.message);
      })
    })
  }  

export const updateSilentMode = (silentMode:boolean) => {
    globalAny.userData.silentMode = silentMode;
    var storageKey = '@'+globalAny.user._id+'_'+globalAny.user.role.name+'_Key';
    try {
      AsyncStorage.setItem(storageKey, JSON.stringify(globalAny.userData)).catch(e => {
        console.log("[SettingsScreen] updateSilentMode AsyncStorage.setItem Error " + e.message);
      });
    } catch(e) {
      console.log("[UserData] updateSilentMode AsyncStorage.setItem Error " + e.message);
    }
}
export const isSilentMode = () => {
  if(globalAny.userData)
    return globalAny.userData.silentMode;
  else
    return false;
}

export const updateSector = (sector:string) => {
    globalAny.userData.sector = sector;
    var storageKey = '@'+globalAny.user._id+'_'+globalAny.user.role.name+'_Key';
    try {
      AsyncStorage.setItem(storageKey, JSON.stringify(globalAny.userData)).catch(e => {
        console.log("[SettingsScreen] updateSector AsyncStorage.setItem Error " + e.message);
      });
    } catch(e) {
      console.log("[UserData] updateSector AsyncStorage.setItem Error " + e.message);
    }
}
export const getSector = () => {
  if(globalAny.userData)
    return globalAny.userData.sector;
  else
    return '';
}

export const updateShowCurrentRequests = (showCurrentRequests:boolean) => {
    globalAny.userData.showCurrentRequests = showCurrentRequests;
    var storageKey = '@'+globalAny.user._id+'_'+globalAny.user.role.name+'_Key';
    try {
      AsyncStorage.setItem(storageKey, JSON.stringify(globalAny.userData)).catch(e => {
        console.log("[SettingsScreen] updateShowCurrentRequests AsyncStorage.setItem Error " + e.message);
      });
    } catch(e) {
      console.log("[UserData] updateShowCurrentRequests AsyncStorage.setItem Error " + e.message);
    }
}

export const isShowCurrentRequests = () => {
  if(globalAny.userData)
    return globalAny.userData.showCurrentRequests;
  else
    return false;
}