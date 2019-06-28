/*
  This file is part of Open Dose.

  Copyright (C) 2019 Elliot Nunn

  This program is free software: you can redistribute it and/or  modify
  it under the terms of the GNU Affero General Public License, version 3,
  as published by the Free Software Foundation.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
