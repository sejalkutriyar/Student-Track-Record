import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  autoConnect: false, // We connect it manually when the user logs in
});

export default socket;
