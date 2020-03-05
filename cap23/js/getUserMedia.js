
var constraints = {audio: false, video: true};
var video = document.querySelector('video');

function handleSuccess(stream) {
  window.stream = stream; // make stream available to console for inspection
  video.srcObject = stream;
}

function handleError(error) {
  console.log('getUserMedia error: ', error);
}

// Main action: just call getUserMedia() on the navigator object
navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);