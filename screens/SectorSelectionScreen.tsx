import React, {useEffect} from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '../components/Themed';
import axios from "axios";


export default function SectorSelectionScreen() {
    useEffect(() => {
        axios.get("/projetkhiron/floors")
        .then((response) => {
          if(response.status === 200) {
            //this.setState({allFloorDetails: response.data, loadingFloors:false});
          }
        }, (error) => {
          console.log(error);
        });
    }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sector Selection Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
