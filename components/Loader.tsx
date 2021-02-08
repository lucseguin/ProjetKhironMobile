import React, { Component } from 'react';

import { View , ActivityIndicator,Dimensions } from 'react-native';
import { Spinner } from 'native-base'

type AdditionalProps = {
    isVisible?: boolean;
    color?:any;
  };

export type LoaderProps = AdditionalProps & View['props'];

export default function Loader(props: LoaderProps) {
    const { isVisible } = props;

    const fullHeight = Dimensions.get('window').height;
    const fullWidth = Dimensions.get('window').width;

    let conponentRender = null;
    if(isVisible) {
        conponentRender = <View style={{ backgroundColor: 'transparent', position: 'absolute', height: fullHeight, width:  fullWidth, justifyContent: 'center', alignItems: 'center' }}><Spinner /></View> ;
    }

    return (conponentRender);
} 