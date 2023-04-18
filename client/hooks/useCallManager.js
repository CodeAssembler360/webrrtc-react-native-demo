import {useEffect, useRef, useState} from 'react';
import {omit} from 'lodash';
import InCallManager from 'react-native-incall-manager';
import SocketIOClient from 'socket.io-client';
import {mediaDevices, RTCPeerConnection} from 'react-native-webrtc';
import useEvent from 'react-use-event-hook';

import {
  RTC_CONFIG,
  SESSION_CLIENT_EVENTS,
  SESSION_SERVER_EVENTS,
} from '../consts';
import {generateRandomUser} from '../utils';

const SOCKET_URL = 'https://rvekz.localtonet.com';

const RANDOM_USER = generateRandomUser();

const DEFAULT_USER_STATE = {
  id: RANDOM_USER,
  micEnabled: true,
  cameraEnabled: true,
  stream: null,
};

const DEFAULT_MAP_STATE = {};

export const useCallManager = sessionId => {
  const socket = useRef(null);
  const remoteUsersRtc = useRef(DEFAULT_MAP_STATE);
  const [user, setUser] = useState(DEFAULT_USER_STATE);
  const [remoteUsers, setRemoteUsers] = useState(DEFAULT_MAP_STATE);

  const onJoinSession = () => {
    socket.current.emit(SESSION_CLIENT_EVENTS.JOIN_SESSION, {sessionId});
  };

  const onSwitchCamera = () => {
    for (const videoTrack of user.stream?.getVideoTracks()) {
      videoTrack._switchCamera();
    }
  };

  const onToggleCamera = () => {
    const nextState = !user.cameraEnabled;
    for (const videoTrack of user.stream?.getVideoTracks()) {
      videoTrack.enabled = nextState;
    }
    setUser({...user, cameraEnabled: nextState});
  };

  const onToggleMic = () => {
    const nextState = !user.micEnabled;
    for (const audioTrack of user.stream?.getAudioTracks()) {
      audioTrack.enabled = nextState;
    }
    setUser({...user, micEnabled: nextState});
  };

  const onStartLocalStream = async () => {
    try {
      let isFront = false;
      const devices = await mediaDevices.enumerateDevices();
      const videoSourceId = devices.find(
        device =>
          device.kind == 'videoinput' &&
          device.facing == (isFront ? 'user' : 'environment'),
      )?.deviceId;

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          mandatory: {
            minWidth: 500,
            minHeight: 300,
            minFrameRate: 30,
          },
          facingMode: isFront ? 'user' : 'environment',
          optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
        },
      });

      setUser({...user, stream});
    } catch (error) {
      console.warn(error);
    }
  };

  const createRTCConnection = useEvent(remoteUser => {
    const rtc = new RTCPeerConnection(RTC_CONFIG);

    rtc.addStream(user.stream);

    rtc.onicecandidate = event => {
      if (event.candidate) {
        socket.current.emit(SESSION_CLIENT_EVENTS.SEND_ICE_CANDIDATES, {
          user: remoteUser,
          candidate: {
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
          },
        });
      }
    };

    rtc.onaddstream = event => {
      setRemoteUsers(remoteUsers => ({
        ...remoteUsers,
        [remoteUser]: {
          id: remoteUser,
          stream: event.stream,
        },
      }));
    };

    return rtc;
  });

  const onJoinUser = useEvent(async data => {
    const user = data.user;
    const rtc = createRTCConnection(user);
    remoteUsersRtc.current = {...remoteUsersRtc.current, [user]: rtc};
    const offer = await rtc.createOffer();
    await rtc.setLocalDescription(offer);
    setRemoteUsers({
      ...remoteUsers,
      [user]: {
        id: user,
        stream: null,
      },
    });
    socket.current.emit(SESSION_CLIENT_EVENTS.SEND_OFFER, {user, offer});
  });

  const onLeaveUser = useEvent(async data => {
    const {user} = data;
    const remoteUserRtc = remoteUsersRtc.current[user];
    if (remoteUserRtc) {
      await remoteUserRtc.close();
      delete remoteUsersRtc.current[user];
      setRemoteUsers(omit(remoteUsers, user));
    }
  });

  const onReceiveOffer = useEvent(async data => {
    const {user, offer} = data;
    const rtc = createRTCConnection(user);
    remoteUsersRtc.current = {...remoteUsersRtc.current, [user]: rtc};
    await rtc.setRemoteDescription(offer);
    const answer = await rtc.createAnswer();
    await rtc.setLocalDescription(answer);
    socket.current.emit(SESSION_CLIENT_EVENTS.SEND_ANSWER, {user, answer});
  });

  const onReceiveAnswer = useEvent(async data => {
    const {user, answer} = data;
    const remoteUserRtc = remoteUsersRtc.current[user];
    if (remoteUserRtc) {
      await remoteUserRtc.setRemoteDescription(answer);
    }
  });

  const onReceiveIceCandidate = useEvent(async data => {
    const {user, candidate} = data;
    const remoteUserRtc = remoteUsersRtc.current[user];
    if (remoteUsersRtc) {
      try {
        await remoteUserRtc.addIceCandidate(candidate);
      } catch (error) {
        console.warn(error);
      }
    }
  });

  const onResetState = useEvent(() => {
    if (user.stream) {
      for (const track of user.stream.getTracks()) {
        track.stop();
      }
    }
    remoteUsersRtc.current = {};
    setUser(DEFAULT_USER_STATE);
    setRemoteUsers([]);
  });

  useEffect(() => {
    if (user.stream) {
      onJoinSession();
    }
  }, [user.stream]);

  useEffect(() => {
    const initCallManager = async () => {
      // Initializing local stream
      await onStartLocalStream();

      // Registering in-call manager events
      InCallManager.start();
      InCallManager.setKeepScreenOn(true);
      InCallManager.setForceSpeakerphoneOn(true);

      // Initializing socket
      socket.current = SocketIOClient(SOCKET_URL, {
        transports: ['websocket'],
        query: {
          user: user.id,
        },
      });

      // New user joined the session
      socket.current.on(SESSION_SERVER_EVENTS.JOIN_USER, onJoinUser);
      // User left the session
      socket.current.on(SESSION_SERVER_EVENTS.LEAVE_USER, onLeaveUser);
      // User received an offer from other user
      socket.current.on(SESSION_SERVER_EVENTS.RECEIVED_OFFER, onReceiveOffer);
      // User received an answer from other user
      socket.current.on(SESSION_SERVER_EVENTS.RECEIVED_ANSWER, onReceiveAnswer);
      // User received an ice candidate
      socket.current.on(
        SESSION_SERVER_EVENTS.RECEIVED_ICE_CANDIDATE,
        onReceiveIceCandidate,
      );
    };

    initCallManager();

    return () => {
      // Un-registering in-call manager events
      InCallManager.stop();

      // Disconnecting from socket
      socket.current.disconnect();

      // Reseting state
      onResetState();
    };
  }, [sessionId]);

  return {
    remoteUsers,
    user,
    onSwitchCamera,
    onToggleCamera,
    onToggleMic,
  };
};
