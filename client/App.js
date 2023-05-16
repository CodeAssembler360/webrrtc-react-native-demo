import React, {useEffect, useState} from 'react';
import {
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import TextInputContainer from './components/TextInputContainer';
import {FlatGrid} from 'react-native-super-grid';
import {toArray} from 'lodash';
import {RTCView} from 'react-native-webrtc';
import {Dimensions} from 'react-native';
const {width, height} = Dimensions.get('window');

import CallEnd from './asset/CallEnd';
import MicOn from './asset/MicOn';
import MicOff from './asset/MicOff';
import VideoOn from './asset/VideoOn';
import VideoOff from './asset/VideoOff';
import CameraSwitch from './asset/CameraSwitch';
import IconContainer from './components/IconContainer';
import {APP_VIEW} from './consts';
import {useCallManager} from './hooks/useCallManager';
import {generateLocalSessionId} from './utils';
import {Slider} from './components/Slider';

const VIDEO_DIMENSIONS_PX = 170;

const LOCAL_SESSION_ID = generateLocalSessionId();

const DEFAULT_APP_STATE = {
  view: APP_VIEW.HOME,
  sessionId: null,
};

export default function App() {
  const [appState, setAppState] = useState(DEFAULT_APP_STATE);

  const onJoinSession = sessionId => {
    setAppState({view: APP_VIEW.IN_SESSION, sessionId});
  };

  const onResetState = () => {
    setAppState(DEFAULT_APP_STATE);
  };

  switch (appState.view) {
    case APP_VIEW.HOME:
      return <JoinScreen onJoinSession={onJoinSession} />;
    case APP_VIEW.IN_SESSION:
      return (
        <WebrtcRoomScreen
          sessionId={appState.sessionId}
          onResetState={onResetState}
        />
      );
    default:
      return <Fallback />;
  }
}

const JoinScreen = ({onJoinSession}) => {
  const [sessionIdInput, setSessionIdInput] = useState('');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{
        flex: 1,
        backgroundColor: '#050A0E',
        justifyContent: 'center',
        paddingHorizontal: 42,
      }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <>
          <View
            style={{
              padding: 35,
              backgroundColor: '#1A1C22',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 14,
            }}>
            <Text
              style={{
                fontSize: 18,
                color: '#D0D4DD',
              }}>
              Your Session IDs
            </Text>
            <View
              style={{
                flexDirection: 'row',
                marginTop: 12,
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontSize: 32,
                  color: '#ffff',
                  letterSpacing: 6,
                }}>
                {LOCAL_SESSION_ID}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => onJoinSession(LOCAL_SESSION_ID)}
              style={{
                height: 50,
                width: 200,
                backgroundColor: '#5568FE',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 12,
                marginTop: 16,
              }}>
              <Text
                style={{
                  fontSize: 16,
                  color: '#FFFFFF',
                }}>
                Join my session
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={{
              backgroundColor: '#1A1C22',
              padding: 40,
              marginTop: 25,
              justifyContent: 'center',
              borderRadius: 14,
            }}>
            <Text
              style={{
                fontSize: 18,
                color: '#D0D4DD',
              }}>
              Join another session
            </Text>
            <TextInputContainer
              placeholder={'Enter Session ID'}
              value={sessionIdInput}
              setValue={setSessionIdInput}
              keyboardType={'number-pad'}
            />
            <TouchableOpacity
              onPress={() => onJoinSession(sessionIdInput)}
              style={{
                height: 50,
                backgroundColor: '#5568FE',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 12,
                marginTop: 16,
              }}>
              <Text
                style={{
                  fontSize: 16,
                  color: '#FFFFFF',
                }}>
                Join Session
              </Text>
            </TouchableOpacity>
          </View>
        </>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const WebrtcRoomScreen = ({sessionId, onResetState}) => {
  const {
    user,
    remoteUsers,
    onSwitchCamera,
    onToggleCamera,
    onToggleMic,
    onAdjustVolume,
  } = useCallManager(sessionId);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#000000',
      }}>
      <View
        style={{
          width: width,
          height: height - 120,

          paddingTop: 40,
        }}>
        <FlatGrid
          style={{flex: 1}}
          itemDimension={VIDEO_DIMENSIONS_PX}
          data={[user, ...toArray(remoteUsers)]}
          renderItem={({item}) => (
            <VideoCard user={item} onAdjustVolume={onAdjustVolume} />
          )}
        />
      </View>
      <View
        style={{
          width: width,
          height: 120,
          padding: 15,
          alignItems: 'center',
          backgroundColor: '#151921',
          flexDirection: 'row',
          borderTopRightRadius: 15,
          borderTopLeftRadius: 15,
          justifyContent: 'space-evenly',
        }}>
        <IconContainer
          backgroundColor={'red'}
          onPress={onResetState}
          Icon={() => <CallEnd height={26} width={26} fill="#FFF" />}
        />
        <IconContainer
          style={{
            borderWidth: 1.5,
            borderColor: '#2B3034',
          }}
          backgroundColor={!user.micEnabled ? '#fff' : 'transparent'}
          onPress={onToggleMic}
          Icon={() =>
            user.micEnabled ? (
              <MicOn height={24} width={24} fill="#FFF" />
            ) : (
              <MicOff height={28} width={28} fill="#1D2939" />
            )
          }
        />
        <IconContainer
          style={{
            borderWidth: 1.5,
            borderColor: '#2B3034',
          }}
          backgroundColor={!user.cameraEnabled ? '#fff' : 'transparent'}
          onPress={onToggleCamera}
          Icon={() =>
            user.cameraEnabled ? (
              <VideoOn height={24} width={24} fill="#FFF" />
            ) : (
              <VideoOff height={36} width={36} fill="#1D2939" />
            )
          }
        />
        <IconContainer
          style={{
            borderWidth: 1.5,
            borderColor: '#2B3034',
          }}
          backgroundColor={'transparent'}
          onPress={onSwitchCamera}
          Icon={() => <CameraSwitch height={24} width={24} fill="#FFF" />}
        />
      </View>
    </View>
  );
};

const VideoCard = ({user, onAdjustVolume}) => {
  const [stream] = useState(new MediaStream());
  const [hasVideo, setHasVideo] = useState(false);

  const onChangeVolume = volume => {
    onAdjustVolume(user.id, volume);
  };

  useEffect(() => {
    if (user.audioTrack) {
      stream.addTrack(user.audioTrack);
    }
  }, [user.audioTrack]);

  useEffect(() => {
    if (user.videoTrack) {
      stream.addTrack(user.videoTrack);
      setHasVideo(true);
    }
  }, [user.videoTrack]);

  return (
    <>
      <View
        style={{
          position: 'relative',
          backgroundColor: '#000000',
          height: VIDEO_DIMENSIONS_PX,
          borderRadius: 7,
          borderColor: '#2B3034',
          borderWidth: 1,
        }}>
        <View
          style={{
            position: 'absolute',
            bottom: 7,
            left: 7,
            zIndex: 1,
            backgroundColor: '#818289',
            padding: 5,
            borderRadius: 7,
            opacity: 0.8,
            overflow: 'hidden',
          }}>
          <Text
            style={{
              fontSize: 10,
              color: '#FFFFFF',
            }}>
            {user.id}
          </Text>
        </View>
        {stream && hasVideo ? (
          <RTCView
            objectFit={'cover'}
            style={{flex: 1, backgroundColor: '#000000', borderRadius: 7}}
            streamURL={stream.toURL()}
          />
        ) : (
          <Text>No video</Text>
        )}
      </View>
      <View style={{height: 30, width: '100%'}}>
        <Slider onChangeValue={onChangeVolume} />
      </View>
    </>
  );
};

const Fallback = () => (
  <View
    style={{
      backgroundColor: '#1A1C22',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 14,
    }}>
    <Text
      style={{
        fontSize: 18,
        color: '#D0D4DD',
      }}>
      No view was found
    </Text>
  </View>
);
