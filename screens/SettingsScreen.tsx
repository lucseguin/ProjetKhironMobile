import React, {useState, useEffect}  from 'react';
import { StyleSheet, Platform, Switch,Appearance } from 'react-native';
import { Text, View } from '../components/Themed';
import DropDownPicker from 'react-native-dropdown-picker';
import {useTheme}  from '../components/ThemeContext'
import AsyncStorage from '@react-native-community/async-storage';
import * as ModuleSettings from '../components/ModuleSettings'
import * as UserData from '../components/UserData';

const globalAny:any = global

export default function SettingsScreen() {
  //const { theme } = useTheme();
  const [theme, setTheme] = useState(useTheme());
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedShift, setSelectedShift] = useState(globalAny.shift);
  
  function onAppearanceChange({ colorScheme }) {
    //console.log("[SettingsScree] onAppearanceChange colorScheme:"+ colorScheme);
    setTheme(useTheme());
  }

  const [isSilentMode, setSilentMode] = useState(false);
  const toggleSilentMode = async () => {
    UserData.updateSilentMode(!isSilentMode);
    setSilentMode(mode => !mode);
  }

  const [showCurrentRequests, setShowCurrentRequests] = useState(false);
  const toggleShowCurrentRequests = async () => {
    UserData.updateShowCurrentRequests(!showCurrentRequests);
    setShowCurrentRequests(show => !show);
  }

  useEffect(() => {
    //console.log("SettingsScreen Mounted");
    Appearance.addChangeListener(onAppearanceChange);

    setSilentMode(UserData.isSilentMode());
    setShowCurrentRequests(UserData.isShowCurrentRequests());
    setSelectedSector(UserData.getSector());

    return () => {
      Appearance.removeChangeListener(onAppearanceChange);
    };
  }, []);

const handleSelectedSector = async (sectorValue:string) => {
  setSelectedSector(sectorValue);
  UserData.updateSector(sectorValue)
}

  return (
    <View style={styles.container}>

      <View style={{
              zIndex: 10, padding: 10, width:'100%', justifyContent: 'center', alignItems: 'center', flexDirection:'column'
          }}>
            <Text style={{fontSize:16, fontWeight:'bold'}}>{globalAny.globalSettings.name}</Text>
      </View>

      {(globalAny.settings.options&ModuleSettings.ROLE_MOBILE_SILENCE_NOTIFICATIONS)?
      <View style={{
              zIndex: 10, padding: 10, width:'100%', justifyContent: 'center', alignItems: 'center', flexDirection:'column'
          }}>
            <Text>Mode Silence</Text>
            <Switch
              onValueChange={toggleSilentMode}
              value={isSilentMode}
            />
      </View>:null}

      {(globalAny.settings.options&ModuleSettings.ROLE_MOBILE_HIDE_REQUESTS )?
      <View style={{
              zIndex: 10, padding: 10, width:'100%', justifyContent: 'center', alignItems: 'center', flexDirection:'column' 
          }}>
            <Text>Afficher demandes courrantes</Text>
            <Switch
              onValueChange={toggleShowCurrentRequests}
              value={showCurrentRequests}
            />
      </View>:null}

      {globalAny.settings.useShifts?
            <View style={{
              ...(Platform.OS !== 'android' && {
                  zIndex: 20
              }), padding: 10, width:'100%', justifyContent: 'center', alignItems: 'center',
              
             }}>
              <Text>Quart de travail</Text>
              <DropDownPicker
                  items={globalAny.shiftsOptions}
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
            
           }}>
              <Text>Secteur assigné</Text>
              <DropDownPicker
                  items={globalAny.sectorOptions}
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
