import React, {useState, useEffect} from 'react';
import { StyleSheet, AppState, ActivityIndicator, Dimensions, ScrollView, RefreshControl} from 'react-native';
import { Text, View } from '../components/Themed';
import axios from "axios";
import moment from 'moment';
import SkeletonContent from 'react-native-skeleton-content';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Loader from '../components/Loader';
import { Button } from 'react-native-elements';
import { ListItem } from 'native-base'
import {Collapse,CollapseHeader, CollapseBody} from 'accordion-collapse-react-native';
import * as ModuleSettings from '../components/ModuleSettings'
import {useTheme}  from '../components/ThemeContext'
import EventCoordinator from '../components/EventCoordinator';
import * as UserData from '../components/UserData';
import Slider from '@react-native-community/slider';

const globalAny:any = global

export default function BearerScreen() {
  const theme = useTheme();
  const [allRequests, setAllRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [internalLoadingRequests, setInternalLoadingRequests] = useState(false);
  //const [currentState, setCurrentState] = useState(AppState.currentState);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [dateNow, setDateNow] = useState(new Date());
  const [refreshing, setRefreshing] = React.useState(false);

  const [serviceLevel, setServiceLevel] = useState(0);
  const [testServiceLevel, setTestServiceLevel] = useState(0);
  const [dataForServiceLevel, setDataForServiceLevel] = useState(0);
  const [outOfServiceRequests, setOutOfServiceRequests] = useState([]);
  const [filteredOutOfServiceRequests, setFilteredOutOfServiceRequests] = useState([]);

  useEffect(() => {
    //console.log("BearerScreen Mounted");

    EventCoordinator.register('notif', ({ payload }) => {
      //console.log("[BearerScreen] notif signal");
      if(payload.data.type === "bearer") {
        loadRequestData(false);
      }
    });

    if(globalAny.settings.options&ModuleSettings.ROLE_MOBILE_OOS_STATS) {
      initialLoadOOSStats();
    }

    loadRequestData(true);

    //only create timer 
    setDateNow(new Date());
    const ti = setInterval(() => {
      setDateNow(new Date());
    }, 1000);
    return () => {
      clearInterval(ti);
    }
  }, []);

  function handleAcceptRequest(request:any) {
    //console.log("accepting request");
    setIsPerformingAction(true);
    axios.put("/projetkhiron/bearer/request/accept", {
      requestId:request._id,
      userId: globalAny.user._id, 
      userLabel:globalAny.user.firstName, 
      assignedOn:new Date(),
    })
    .then((response) => {
      //console.log(response);
      if (response.status === 200) {
        //console.log("accepted");
        loadRequestData(false);
      }
    }).catch(error => {

    }).finally(() => {
      setIsPerformingAction(false);
    });
  }

  function handleCompletedRequest(request:any) {
    setIsPerformingAction(true);
    axios.put("/projetkhiron/bearer/request/completed", {
      requestId:request._id,
      completedOn:new Date(),
    })
    .then((response) => {
      //console.log(response);
      if (response.status === 200) {
        //console.log("completed");
        loadRequestData(false);
      }
    }).catch(error => {

    }).finally(() => {
      setIsPerformingAction(false);
    });
  }
  
  const initialLoadOOSStats = () => {
    axios.get("/projetkhiron/roles", {
      params: {
          name: "bearer"
        }
    }).then(response => {
      var timeParts = response.data[0].settings.serviceLevel.split(':'); 
      var sLevel = 16;
      if(timeParts.length === 3) {
        sLevel = parseInt(timeParts[0])*60 + parseInt(timeParts[1]);
      }
      setServiceLevel(sLevel);
      setTestServiceLevel(sLevel);

      loadOOSRequests(sLevel, false);
    }).catch(error => {
      console.log("Failed to reteive Bearer role settings for OOS Stats. " + error.message);
    }).finally(() => {

    });
  }

  const loadOOSRequests = (sLevel:number, trackLoading:boolean) => {
    if(trackLoading)
      setIsPerformingAction(true);
    axios.get("/projetkhiron/bearer/analysis", {
      params: {
        type:'outOfService',
        seviceLevel: sLevel
        }
    }).then((response) => {
      if (response.status === 200) {
        setOutOfServiceRequests(response.data);
        setFilteredOutOfServiceRequests(response.data);
        setDataForServiceLevel(sLevel);
      }
    }).catch(error => {

    }).finally(() => {
      if(trackLoading)
        setIsPerformingAction(false);
    });
  }

  const loadRequestData = (trackLoading:boolean) => {
    if(internalLoadingRequests) {
      //console.log("Already loading");
      return;
    }

    setInternalLoadingRequests(true);

    if(trackLoading)
      setLoadingRequests(true);

    axios.get("/projetkhiron/bearer/requests", {
      params: {
          from: moment().subtract(8, 'hours').toDate()
        }
    }).then(response => {
      if(response.status === 200) {
        setAllRequests(response.data);
      }
    }).catch(error => {
      console.log("Failed retrieving requests " + error.message);
    }).finally(() => {
      if(trackLoading)
        setLoadingRequests(false);
      setInternalLoadingRequests(false);
      setRefreshing(false);
    })
  }

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadRequestData(false);
    if(globalAny.settings.options&ModuleSettings.ROLE_MOBILE_OOS_STATS) {
      loadOOSRequests(dataForServiceLevel, false);
    }
  }, []);

  function handleInnerClick (innerIndex:any, headerItem:any, headerIndex:any) {
    //console.log(innerIndex);
  };

  function handleClickItem(data: any) {
    //setAllRequests(data);
  }

  const addZero = (i:number) => {
    if (i < 10) {
      i = "0" + i;
    }
    return ""+i;
  }

  const minutesToString = (minutes:number) => {
    var hours = Math.floor(minutes / 60);
    return addZero(hours) + ":" + addZero(minutes - hours*60) + ":00";
  }
  const MS_PER_MINUTE = 60000;
  const avgRequestDelayInMinutes = (requests:[]) => {
    var now = new Date();
    var totalMinutes = 0;
    requests.map(request => {
      var diffInMs = now.getTime() - new Date(request.requestedOn).getTime();
      totalMinutes = totalMinutes + Math.floor(diffInMs/MS_PER_MINUTE + 0.5);
    });
    return Math.floor(totalMinutes/requests.length + 0.5);
  }

  const medianRequestDelayInMinutes = (requests:[]) => {
    var now = new Date();
    const mid = Math.floor(requests.length / 2);
    var delays: number[] = [];
    requests.map(request => {
      var diffInMs = now.getTime() - new Date(request.requestedOn).getTime();
      delays.push(Math.floor(diffInMs/MS_PER_MINUTE + 0.5));
    });
    delays = delays.sort((a, b) => a - b);
    return requests.length % 2 !== 0 ? delays[mid] : Math.floor((delays[mid - 1] + delays[mid]) / 2 + 0.5);
  }

  const handleTestServiceLevelChange = (value) => {
    setTestServiceLevel(value)
    if(value < dataForServiceLevel) {
      loadOOSRequests(testServiceLevel, true);
    } else {
      setFilteredOutOfServiceRequests(outOfServiceRequests.filter(request => {
        var testDate = new Date(new Date(request.requestedOn).getTime() + value*MS_PER_MINUTE);
        return (testDate < new Date());
      }));
    }
  }

  const handleCancelSLAdjustment = () => {
    setTestServiceLevel(serviceLevel);
    setFilteredOutOfServiceRequests(outOfServiceRequests.filter(request => {
      var testDate = new Date(new Date(request.requestedOn).getTime() + serviceLevel*MS_PER_MINUTE);
      return (testDate < new Date());
    }));
  }

  const handleSavingSLAdjustment = () => {
    setIsPerformingAction(true);
    axios.put("/projetkhiron/serviceLevel", {
      serviceLevel:minutesToString(testServiceLevel),
      forGroup:"bearer",
    })
    .then((response) => {
      if (response.status === 200) {
        setServiceLevel(testServiceLevel);
      }
    }).catch(error => {

    }).finally(() => {
      setIsPerformingAction(false);
    });
  }

  const {height, width} = Dimensions.get('window');

  var oosStatsView = null;
  if(globalAny.settings.options&ModuleSettings.ROLE_MOBILE_OOS_STATS) {
    oosStatsView = <Collapse key="bearer-mobile-oos-stats" style={{borderBottomWidth:1, borderColor:theme.SeparatorColor}}>
      <CollapseHeader style={{ flexDirection:'row',alignItems:'flex-start',padding:10,backgroundColor:theme.SecondarySystemBackgroundColor}}>
        <View style={{width:width-20, alignItems:'flex-start', backgroundColor:theme.SecondarySystemBackgroundColor}}>
          <Text style={{fontWeight:'bold'}}>Statistiques des demandes en attente</Text>
          {filteredOutOfServiceRequests.length > 0?
          <><Text style={{marginLeft:20}}>Vous avez <Text style={{fontWeight:'bold', color:'red'}}>{filteredOutOfServiceRequests.length}</Text>  demandes en attente dépassant le délai de réalisation souhaité!</Text>
            <Text style={{marginLeft:20}}>Moyenne des délais : {minutesToString(avgRequestDelayInMinutes(filteredOutOfServiceRequests))}</Text></>
          :<Text style={{marginLeft:20}}>Vous n'avez aucune demande dépassant le délai de réalisation souhaité.</Text>}
          <Text style={{marginLeft:20}}>Délai de réalisation souhaité : {minutesToString(testServiceLevel)}</Text>
        </View>
      </CollapseHeader>

      {(globalAny.settings.options&ModuleSettings.ROLE_MOBILE_ADJUST_SERVICE_LEVEL)?
      <CollapseBody style={{padding:10, backgroundColor:theme.TertiarySystemBackgroundColor}}>
          <View style={{width:width, alignItems:'flex-start', backgroundColor:theme.TertiarySystemBackgroundColor}}>
            <Text style={{fontWeight:'bold'}}>Ajustement du délai de réalisation souhaité</Text>
            <Slider
              value={testServiceLevel}
              onSlidingComplete={value => handleTestServiceLevelChange(value)}
              onValueChange={value => setTestServiceLevel(value)}
              style={{width: width-20, height: 40}}
              minimumValue={5}
              maximumValue={120}
              step={5}
              minimumTrackTintColor={theme.SecondaryLabelColor}
              maximumTrackTintColor="red"
              disabled={isPerformingAction}
            />
            <View style={{width:width-20, alignItems:'center', alignContent:'space-around', justifyContent:'space-around', flexDirection:'row', backgroundColor:theme.TertiarySystemBackgroundColor}}>
              <Button title="Annuler" buttonStyle={{width:width/2-15}} onPress={() => handleCancelSLAdjustment()} disabled={testServiceLevel===serviceLevel || isPerformingAction}/>
              <Button title="Appliquer" buttonStyle={{width:width/2-15}} onPress={() => handleSavingSLAdjustment()} disabled={testServiceLevel===serviceLevel || isPerformingAction}/>
            </View>
          </View>
      </CollapseBody>
      :null
      }
    </Collapse>;
  }

  var currentRequestsView = null;

  if((globalAny.settings.options&ModuleSettings.ROLE_MOBILE_HIDE_REQUESTS&&UserData.isShowCurrentRequests()) || !(globalAny.settings.options&ModuleSettings.ROLE_MOBILE_HIDE_REQUESTS)) {
    if(allRequests.length>0){
      currentRequestsView = allRequests.map((request) => (
        <Collapse key={request._id} style={{borderBottomWidth:1, borderColor:theme.SeparatorColor}}>
          <CollapseHeader style={{ flexDirection:'row',alignItems:'flex-start',padding:10,backgroundColor:theme.SecondarySystemBackgroundColor}}>
            <View style={{width:40, alignContent:'center', alignItems:'center', justifyContent:'center', backgroundColor:theme.SecondarySystemBackgroundColor}}>
            {(request.completedOn!=='1970-01-01T00:00:00.000Z')?<Icon name="done" size={30} color={theme.LabelColor} />:(request.assignedOn!=='1970-01-01T00:00:00.000Z')?<ActivityIndicator size="small" color={theme.LabelColor} />:<Icon name="play-for-work" color={theme.LabelColor} size={30} />}
            </View>
            <View style={{width:width-60, alignItems:'flex-start', backgroundColor:theme.SecondarySystemBackgroundColor}}>
              <Text>De:   {request.from.label} </Text>
              <Text>Vers: {request.to.label}</Text>
              <Text>Assigné à: {request.assigned?request.assigned.label:null}</Text>
              <Text>{(request.completedOn!=='1970-01-01T00:00:00.000Z')?null
              :<Text>[{new Date(dateNow.getTime() - new Date(request.requestedOn).getTime()).toISOString().substr(11, 8)}]</Text>
              }
              </Text>
            </View>
          </CollapseHeader>
          <CollapseBody style={{backgroundColor:theme.TertiarySystemBackgroundColor}}>
            {request.options && request.options.length > 0?
            <ListItem noBorder style={{backgroundColor:theme.TertiarySystemBackgroundColor}}>
              <Text style={{width:90}}>Options :</Text><View style={{width:'100%',backgroundColor:theme.TertiarySystemBackgroundColor}}>
              {request.options.map(option => (
                <View key={option._id}  style={{width:'100%',flexDirection:'row',alignItems:'flex-start', backgroundColor:theme.TertiarySystemBackgroundColor}} ><Text>{option.label} : </Text><Text>{option.value}</Text></View>
              )
              )}
              </View>
            </ListItem>
            :null}
            <ListItem noBorder style={{backgroundColor:theme.TertiarySystemBackgroundColor}}>
            <Text style={{width:90}}>Demandé le:</Text><Text>{new Date(request.requestedOn).toLocaleString('fr-CA')}</Text>
            </ListItem>
            <ListItem noBorder style={{backgroundColor:theme.TertiarySystemBackgroundColor}}>
            {(request.assignedOn!=='1970-01-01T00:00:00.000Z')?
              <><Text style={{width:90}}>Accepté le:</Text><Text style={{width:160}}>{new Date(request.assignedOn).toLocaleString('fr-CA')}</Text><Text>[{new Date(new Date(request.assignedOn).getTime() - new Date(request.requestedOn).getTime()).toISOString().substr(11, 8)}]</Text></>
            : globalAny.settings.options&ModuleSettings.MODULE_BEARER_UPDATE?<Button icon={<Icon name="directions-run" size={20} color="white" />} title="Accepter" onPress={() => handleAcceptRequest(request)}/>:null 
            }
            </ListItem>
            <ListItem noBorder last style={{backgroundColor:theme.TertiarySystemBackgroundColor}}>
              {(request.completedOn!=='1970-01-01T00:00:00.000Z')?
            <><Text style={{width:90}}>Completé le:</Text><Text style={{width:160}}>{new Date(request.completedOn).toLocaleString('fr-CA')}</Text><Text>[{new Date(new Date(request.completedOn).getTime() - new Date(request.requestedOn).getTime()).toISOString().substr(11, 8)}]</Text></>
            :(request.assignedOn!=='1970-01-01T00:00:00.000Z')?(globalAny.settings.options&ModuleSettings.MODULE_BEARER_UPDATE?<Button icon={<Icon name="done" size={20} color="white" /> } title="Terminer" onPress={() => handleCompletedRequest(request)}/>:null):null}
            </ListItem>
          </CollapseBody>
        </Collapse>
        ));
    } else {
      currentRequestsView = <Collapse style={{borderBottomWidth:1, borderColor:theme.SeparatorColor}}>
        <CollapseHeader style={{ flexDirection:'row',alignItems:'flex-start',padding:10,backgroundColor:theme.SecondarySystemBackgroundColor}}>
          <View style={{width:width-20, alignItems:'flex-start', backgroundColor:theme.SecondarySystemBackgroundColor}}>
            <Text>Aucune demande de brancardie dans les derniers 8 heures</Text>
          </View>
        </CollapseHeader>
      </Collapse>;
    }
  }

  return (
    <View style={styles.container}>
      {loadingRequests?
          <SkeletonContent
          containerStyle={{flex: 1, width: width}}
          animationType="pulse"
          boneColor={theme.SecondarySystemBackgroundColor}
          highlightColor="#333333"
          layout={[
          // long line
          { width: '90%', height: 40, marginBottom: 6, marginLeft:15 },
          { width: '90%', height: 40, marginBottom: 6, marginLeft:15  },
          { width: '90%', height: 40, marginBottom: 6, marginLeft:15  },
          { width: '90%', height: 40, marginBottom: 6, marginLeft:15  },
          { width: '90%', height: 40, marginBottom: 6, marginLeft:15  }, 
          { width: '90%', height: 40, marginBottom: 6, marginLeft:15 },
          { width: '90%', height: 40, marginBottom: 6, marginLeft:15  },
          { width: '90%', height: 40, marginBottom: 6, marginLeft:15  },
          { width: '90%', height: 40, marginBottom: 6, marginLeft:15  },
          { width: '90%', height: 40, marginBottom: 6, marginLeft:15  }, 
          { width: '90%', height: 40, marginBottom: 6, marginLeft:15  },
          { width: '90%', height: 40, marginBottom: 6, marginLeft:15  },
          { width: '90%', height: 40, marginBottom: 6, marginLeft:15  },
          { width: '90%', height: 40, marginBottom: 6, marginLeft:15  }, 
          { width: '90%', height: 40, marginBottom: 6, marginLeft:15  },
          { width: '90%', height: 40, marginBottom: 6, marginLeft:15  }, 
          ]}
          isLoading={loadingRequests}
          />
      :
    <ScrollView horizontal={false} alwaysBounceHorizontal={false} alwaysBounceVertical={true} bounces={true} automaticallyAdjustContentInsets={true}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {oosStatsView}
      {currentRequestsView}
    </ScrollView>
        }
        <Loader isVisible={isPerformingAction} color="green"/>
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
