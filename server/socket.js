const { Server } = require('socket.io');
let IO;

const SESSION_PREFIX = 'session';

const SESSION_CLIENT_EVENTS = {
  JOIN_SESSION: 'join-session',
  LEAVE_SESSION: 'leave-session',
  SEND_OFFER: 'send-offer',
  SEND_ANSWER: 'send-answer',
  SEND_ICE_CANDIDATES: 'send-ice-candidates',
  DISCONNECT: 'disconnect'
};

const SESSION_SERVER_EVENTS = {
  JOIN_USER: 'join-user',
  LEAVE_USER: 'leave-user',
  RECEIVED_OFFER: 'received-offer',
  RECEIVED_ANSWER: 'received-answer',
  RECEIVED_ICE_CANDIDATE: 'received-ice-candidate'
};

const sessionStringFactory = sessionId => `${SESSION_PREFIX}-${sessionId}`;

const onUserLeave = socket => {
  if (socket?.user && socket?.sessionId) {
    const sessionTopic = sessionStringFactory(socket.sessionId);
    socket.to(sessionTopic).emit(SESSION_SERVER_EVENTS.LEAVE_USER, {
      user: socket.user
    });
    console.log(`${socket.user} disconnected`);
  }
};

module.exports.initIO = httpServer => {
  IO = new Server(httpServer);

  IO.use((socket, next) => {
    if (socket.handshake.query) {
      let user = socket.handshake.query.user;
      socket.user = user;
      next();
    }
  });

  IO.on('connection', socket => {
    console.log(`${socket.user} connected`);
    socket.join(socket.user);

    socket.on(SESSION_CLIENT_EVENTS.JOIN_SESSION, data => {
      const { sessionId } = data;
      const sessionTopic = sessionStringFactory(sessionId);

      socket.sessionId = sessionId;

      socket.to(sessionTopic).emit(SESSION_SERVER_EVENTS.JOIN_USER, {
        user: socket.user
      });

      socket.join(sessionTopic);
    });

    socket.on(SESSION_CLIENT_EVENTS.LEAVE_SESSION, () => {
      onUserLeave(socket);
    });

    socket.on(SESSION_CLIENT_EVENTS.SEND_OFFER, data => {
      const { offer, user } = data;
      console.log(`Send offer to ${user} from ${socket.user}`);
      socket.to(user).emit(SESSION_SERVER_EVENTS.RECEIVED_OFFER, {
        user: socket.user,
        offer
      });
    });

    socket.on(SESSION_CLIENT_EVENTS.SEND_ANSWER, data => {
      const { answer, user } = data;
      console.log(`Send answer to ${user} from ${socket.user}`);
      socket.to(user).emit(SESSION_SERVER_EVENTS.RECEIVED_ANSWER, {
        user: socket.user,
        answer
      });
    });

    socket.on(SESSION_CLIENT_EVENTS.SEND_ICE_CANDIDATES, data => {
      const { candidate, user } = data;
      console.log(`Send ice candidates to ${user} from ${socket.user}`);
      socket.to(user).emit(SESSION_SERVER_EVENTS.RECEIVED_ICE_CANDIDATE, {
        user: socket.user,
        candidate
      });
    });

    socket.on(SESSION_CLIENT_EVENTS.DISCONNECT, () => {
      onUserLeave(socket);
    });
  });
};

module.exports.getIO = () => {
  if (!IO) {
    throw Error('IO not initilized.');
  } else {
    return IO;
  }
};
