const socket = io(); // Requires backend running on Node.js + Socket.IO
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;

const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
  });

function startCall() {
  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = e => {
    remoteVideo.srcObject = e.streams[0];
  };

  peerConnection.onicecandidate = e => {
    if (e.candidate) socket.emit('candidate', e.candidate);
  };

  peerConnection.createOffer().then(offer => {
    peerConnection.setLocalDescription(offer);
    socket.emit('offer', offer);
  });
}

socket.on('offer', offer => {
  peerConnection = new RTCPeerConnection(config);
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.createAnswer().then(answer => {
    peerConnection.setLocalDescription(answer);
    socket.emit('answer', answer);
  });

  peerConnection.ontrack = e => {
    remoteVideo.srcObject = e.streams[0];
  };

  peerConnection.onicecandidate = e => {
    if (e.candidate) socket.emit('candidate', e.candidate);
  };
});

socket.on('answer', answer => peerConnection.setRemoteDescription(new RTCSessionDescription(answer)));
socket.on('candidate', candidate => peerConnection.addIceCandidate(new RTCIceCandidate(candidate)));
