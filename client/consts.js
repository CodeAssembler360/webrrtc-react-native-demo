export const APP_VIEW = {
  HOME: 'home',
  IN_SESSION: 'in-session',
};

export const SESSION_CLIENT_EVENTS = {
  JOIN_SESSION: 'join-session',
  LEAVE_SESSION: 'leave-session',
  SEND_OFFER: 'send-offer',
  SEND_ANSWER: 'send-answer',
  SEND_ICE_CANDIDATES: 'send-ice-candidates',
};

export const SESSION_SERVER_EVENTS = {
  JOIN_USER: 'join-user',
  LEAVE_USER: 'leave-user',
  RECEIVED_OFFER: 'received-offer',
  RECEIVED_ANSWER: 'received-answer',
  RECEIVED_ICE_CANDIDATE: 'received-ice-candidate',
};

export const RTC_CONFIG = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'stun:stun1.l.google.com:19302',
    },
    {
      urls: 'stun:stun2.l.google.com:19302',
    },
  ],
};
