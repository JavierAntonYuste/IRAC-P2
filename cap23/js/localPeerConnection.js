// JavaScript variables holding stream and connection information
var localStream, localPeerConnection, remotePeerConnection;

// JavaScript variables associated with HTML5 video elements in the page
var constraints = {audio: true, video: true};
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

// JavaScript variables assciated with call management buttons in the page
var startButton = document.getElementById("startButton");
var callButton = document.getElementById("callButton");
var hangupButton = document.getElementById("hangupButton");

// Just allow the user to click on the 'Call' button at start-up
startButton.disabled = false;
callButton.disabled = true;
hangupButton.disabled = true;

// Associate JavaScript handlers with click events on the buttons
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

// Utility function for logging information to the JavaScript console
function log(text) {
  console.log("At time: " + (performance.now() / 1000).toFixed(3) + " --> " + text);
}

// Callback in case of success of the getUserMedia() call
function successCallback(stream){
  log("Received local stream");

  localVideo.srcObject = stream;
  localStream = stream;

  // We can now enable the 'Call' button
  callButton.disabled = false;
}

// Function associated with clicking on the 'Start' button
// This is the event triggering all other actions
function start() {
  log("Requesting local stream");
  // First of all, disable the 'Start' button on the page
  startButton.disabled = true;

  function handleError(error) {
    log("navigator.getUserMedia error: ", error);
  }

  navigator.mediaDevices.getUserMedia(constraints).then(successCallback).catch(handleError);

}


// Function associated with clicking on the 'Call' button
// This is enabled upon successful completion of the 'Start' button handler
function call() {
  // First of all, disable the 'Call' button on the page...
  callButton.disabled = true;
  // ...and enable the 'Hangup' button
  hangupButton.disabled = false;
  log("Starting call");

  log("RTCPeerConnection object: " + RTCPeerConnection);

  // This is an optional configuration string, associated with NAT traversal setup
  var servers = null;

  // Create the local PeerConnection object
  localPeerConnection = new RTCPeerConnection(servers);
  log("Created local peer connection object localPeerConnection");
  // Add a handler associated with ICE protocol events
  localPeerConnection.onicecandidate = gotLocalIceCandidate;

  // Create the remote PeerConnection object
  remotePeerConnection = new RTCPeerConnection(servers);
  log("Created remote peer connection object remotePeerConnection");
  // Add a handler associated with ICE protocol events...
  remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
  // ...and a second handler to be activated as soon as the remote stream becomes available
  remotePeerConnection.ontrack = gotRemoteStream;

  // Add the local stream (as returned by getUserMedia() to the local PeerConnection
  localPeerConnection.addStream(localStream);
  log("Added localStream to localPeerConnection");

  // We're all set! Create an Offer to be 'sent' to the callee as soon as the local SDP is ready
  localPeerConnection.createOffer(gotLocalDescription, onSignalingError);
}

function onSignalingError(error) {
	console.log('Failed to create signaling message : ' + error.name);
}

// Handler to be called when the 'local' SDP becomes available
function gotLocalDescription(description){
  // Add the local description to the local PeerConnection
  localPeerConnection.setLocalDescription(description);
  log("Offer from localPeerConnection: \n" + description.sdp);

  // ...do the same with the 'pseudo-remote' PeerConnection
  // Note well: this is the part that will have to be changed if you want the communicating peers to become
  // remote (which calls for the setup of a proper signaling channel)
  remotePeerConnection.setRemoteDescription(description);

  // Create the Answer to the received Offer based on the 'local' description
  remotePeerConnection.createAnswer(gotRemoteDescription, onSignalingError);
}

// Handler to be called when the 'remote' SDP becomes available
function gotRemoteDescription(description){
  // Set the 'remote' description as the local description of the remote PeerConnection
  remotePeerConnection.setLocalDescription(description);
  log("Answer from remotePeerConnection: \n" + description.sdp);
  // Conversely, set the 'remote' description as the remote description of the local PeerConnection
  localPeerConnection.setRemoteDescription(description);
}

// Handler to be called when hanging up the call
function hangup() {
  log("Ending call");
  // Close PeerConnection(s)
  localPeerConnection.close();
  remotePeerConnection.close();
  // Reset local variables
  localPeerConnection = null;
  remotePeerConnection = null;
  // Disable 'Hangup' button
  hangupButton.disabled = true;
  // Enable 'Call' button to allow for new calls to be established
  callButton.disabled = false;
}

// Handler to be called as soon as the remote stream becomes available
function gotRemoteStream(event){
  // Associate the remote video element with the retrieved stream
  remoteVideo.srcObject = event.streams[0];
  log("Received remote stream");
}

// Handler to be called whenever a new local ICE candidate becomes available
function gotLocalIceCandidate(event){
  if (event.candidate) {
	// Add candidate to the remote PeerConnection
    remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
    log("Local ICE candidate: \n" + event.candidate.candidate);
  }
}

// Handler to be called whenever a new 'remote' ICE candidate becomes available
function gotRemoteIceCandidate(event){
  if (event.candidate) {
	// Add candidate to the local PeerConnection
    localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
    log("Remote ICE candidate: \n " + event.candidate.candidate);
  }
}