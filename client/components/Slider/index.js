import React from 'react';
import {View} from 'react-native';

import ReactSlider from '@react-native-community/slider';

export const Slider = ({onChangeValue}) => (
  <View
    style={{
      height: '100%',
      width: '100%',
      transform: [
        {scaleX: Platform.OS == 'ios' ? 0.5 : 1},
        {scaleY: Platform.OS == 'ios' ? 0.5 : 1},
      ],
    }}>
    <ReactSlider
      value={100}
      minimumValue={0}
      maximumValue={1}
      step={0.1}
      onValueChange={onChangeValue}
      minimumTrackTintColor="#FFFFFF"
      maximumTrackTintColor="#818289"
      style={{
        flex: 1,
        height: '100%',
        width: Platform.OS == 'ios' ? '200%' : '100%',
        alignSelf: 'center',
      }}
    />
  </View>
);
