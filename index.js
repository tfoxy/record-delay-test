(function() {
'use strict';


const form = document.getElementById('form');
const delayValueInput = document.getElementById('delayValueInput');
const playButton = document.getElementById('playButton');

let delay = 0;
let timeoutId;
const context = new AudioContext();
const buffersData = [];

form.onsubmit = changeDelay;
delayValueInput.value = delay;
navigator.mediaDevices.getUserMedia({ audio: true }).then(handleStream);


function handleStream(stream) {
  const streamSource = context.createMediaStreamSource(stream);
  const node = context.createScriptProcessor(4096, 2, 2);
  node.onaudioprocess = processData;
  streamSource.connect(node);
  node.connect(context.destination);
}

function processData(event) {
  const inputBuffer = event.inputBuffer;
  const channel0 = new Float32Array(inputBuffer.length);
  const channel1 = new Float32Array(inputBuffer.length);
  inputBuffer.copyFromChannel(channel0, 0);
  inputBuffer.copyFromChannel(channel1, 1);
  const eventBufferData = {
    timeStamp: event.timeStamp,
    channel0,
    channel1,
  };
  buffersData.push(eventBufferData);
  let currentBufferData = buffersData[0];
  let auxBufferData = null;
  while (currentBufferData && eventBufferData.timeStamp - currentBufferData.timeStamp >= delay) {
    auxBufferData = buffersData.shift();
    currentBufferData = buffersData[0];
  }
  if (auxBufferData) {
    const audioBuffer = context.createBuffer(inputBuffer.numberOfChannels, inputBuffer.length, inputBuffer.sampleRate);
    audioBuffer.copyToChannel(auxBufferData.channel0, 0);
    audioBuffer.copyToChannel(auxBufferData.channel1, 1);
    const bufferSource = context.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.connect(context.destination);
    bufferSource.start();
  }
}

function changeDelay(event) {
  event.preventDefault();
  delay = delayValueInput.valueAsNumber;
}

})();