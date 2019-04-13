stdinStr = "";
stdinCtr = 0;

lineAccum = [];

function stdinFunc() {
  if (stdinCtr < stdinStr.length) {
    return stdinStr.charCodeAt(stdinCtr++);
  } else {
    return null;
  }
}

function stdoutFunc(line) {
  if (line) {
    lineAccum.push(line);
  } else {
    postMessage(lineAccum);
    lineAccum = [];
  }
}

Module = {
  print: stdoutFunc,
  preRun: function() {FS.init(stdinFunc, null, null);},
  postRun: close
}

onmessage = function (msg) {
  stdinStr = msg.data;
  importScripts("XXX.js");
}
