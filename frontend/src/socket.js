import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
// const socket = io('http://localhost:5000', {
  autoConnect: false, // We connect it manually when the user logs in
});

export default socket;
