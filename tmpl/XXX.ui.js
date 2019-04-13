function parse_time(in_str)
{
  return parseFloat(in_str.substr(0, 2)) + parseFloat(in_str.substr(2, 4)) / 60;
}

function mkPath(x, y) {
  var cmd = "M";
  var accum = [];
  for (var i = 0; i < x.length; i++) {
    accum.push(cmd); cmd = "L";
    accum.push(x[i].toString());
    accum.push((-y[i]).toString());
  }
  accum = accum.join(" ");
  newEl = document.createElementNS('http://www.w3.org/2000/svg',"path");
  newEl.setAttributeNS(null, "d", accum);
  return newEl;
}

function scrape()
{
  /* Marshal a bayes input file from the history */
  var ary = [];

  /* Overall settings */
  ary.push("MAX 50");
  ary.push("TRY 10000000");

  /* Marshal covariates (this must be made generic) */
  var covars = document.querySelectorAll(".OD-input-covariate");
  ary.push("PARAM creatinine clearance " + covars[0].value + " mL/min");
  ary.push("PARAM total body weight " + covars[1].value + " kg");

  var maxTime = 0; /* How far out to take our graph */

  /* Marshal doses (this format will change) */
  var lines = document.querySelectorAll(".OD-inputline-dose");
  for (var i = 0; i < lines.length; i++) {
    function X(cls) {return lines[i].getElementsByClassName(cls)[0].value;}

    var t = (X("OD-input-date") - 1) * 24 + parse_time(X("OD-input-time"));
    maxTime = Math.max(maxTime, t);
    var dur = parseFloat(X("OD-input-dosepush"));
    var rate = parseFloat(X("OD-input-dose")) / dur;

    ary.push(t.toString() + " h EV " + rate.toString() + " " + MOD_DRUG_UNIT + "/" + MOD_TIME_UNIT);
    ary.push((t+dur).toString() + " h EV 0 " + MOD_DRUG_UNIT + "/" + MOD_TIME_UNIT);
  }

  /* Marshal levels */
  var lines = document.querySelectorAll(".OD-inputline-level");
  for (var i = 0; i < lines.length; i++) {
    function X(cls) {return lines[i].getElementsByClassName(cls)[0].value;}

    var t = (X("OD-input-date") - 1) * 24 + parse_time(X("OD-input-time"));
    maxTime = Math.max(maxTime, t);
    var level = parseFloat(X("OD-input-level"));

    ary.push(t.toString() + " h LEVEL " + level.toString() + " " + MOD_OB_UNIT);
  }

  var xWidth = Math.ceil(maxTime / 24 + 2) * 24;

  /* How many time points would we like for our graph? */
  var numPoints = 501;
  x = []
  for (var i = 0; i < numPoints; i++) {
    var hour = xWidth / (numPoints - 1) * i;
    x.push(hour);
    ary.push(hour.toString() + " h GET");
  }

  ary.push(""); // trailing newline needed
  query = ary.join("\n");

  etas = []; for (var i = 0; i < 4; i++) etas.push([]);
  points = []; for (var i = 0; i < numPoints; i++) points.push([]);
  isFirstChunk = true;

  document.getElementById("plot").innerHTML = "";

  if (typeof hardWorker != 'undefined') hardWorker.terminate();
  hardWorker = new Worker("XXX.worker.js");

  hardWorker.onmessage = function (msg) {
    outputChunk = msg.data;
    if (isFirstChunk) {
      isFirstChunk = false;
      return;
    }

    newEta = outputChunk[0].split(' ').slice(1).map(Number);
    for (var i = 0; i < newEta.length; i++) {
      etas[i].push(newEta[i]);
    }

    newPoints = []
    for (var i = 0; i < outputChunk.length - 1; i++) {
      thisLine = outputChunk[i + 1];
      thisVal = thisLine.split(' ')[3];
      newPoints.push(thisVal);
    }
    for (var i = 0; i < newPoints.length; i++) {
      points[i].push(newPoints[i]);
    }

    thePath = mkPath(x, newPoints);
    thePath.setAttributeNS(null, "fill", "transparent");
    thePath.setAttributeNS(null, "stroke", "blue");
    thePath.setAttributeNS(null, "stroke-width", "0.05px");
    document.getElementById("plot").appendChild(thePath);
  }

  hardWorker.onclose = function () {
    console.log('Completed baypk run in Web Worker');
  }

  hardWorker.postMessage(query);

  /* next task: get ajaxing!! */
}


// Code to edit the dosing history
function OD_new_dose (caller) {
  while (!caller.classList.contains("OD-editable")) caller = caller.parentElement;

  caller = caller.querySelectorAll(".OD-appendtome")[0];

  html = 
    '<div class="list-group-item OD-inputline-dose"><form class="form-inline">' +
      '<div class="input-group input-group-sm mx-1">' +
        '<button class="btn btn-danger btn-sm OD-editmode" onclick="this.parentNode.parentNode.parentNode.remove()">Del</button>' +
      '</div>' +
      '<div class="input-group input-group-sm mx-1">' +
        '<div class="input-group-prepend">' +
          '<span class="input-group-text">day/time</span>' +
        '</div>' + 
        '<input type="text" class="form-control OD-input-date" size="4" value="1"></input>' +
        '<input type="text" class="form-control OD-input-time" size="4" value="0000"></input>' +
      '</div>' +
      '<div class="input-group input-group-sm mx-1">' +
        '<input type="text" class="form-control OD-input-dose" size="4" value="1000"></input>' +
        '<div class="input-group-append">' +
          '<span class="input-group-text">' + MOD_DRUG_UNIT + '</span>' +
        '</div>' + 
      '</div>' +
      '<div class="input-group input-group-sm mx-1">' +
        '<div class="input-group-prepend">' +
          '<span class="input-group-text">given over</span>' +
        '</div>' + 
        '<input type="text" class="form-control OD-input-dosepush" size="4" value="1"></input>' +
        '<div class="input-group-append">' +
          '<span class="input-group-text">' + MOD_TIME_UNIT + '</span>' +
        '</div>' + 
      '</div>' +
    '</form></div>';

  caller.insertAdjacentHTML("beforeend", html);
}

function OD_new_level (caller) {
  while (!caller.classList.contains("OD-editable")) caller = caller.parentElement;

  caller = caller.querySelectorAll(".OD-appendtome")[0];

  html = 
    '<div class="list-group-item OD-inputline-level"><form class="form-inline">' +
      '<div class="input-group input-group-sm mx-1">' +
        '<button class="btn btn-danger btn-sm OD-editmode" onclick="this.parentNode.parentNode.parentNode.remove()">Del</button>' +
      '</div>' +
      '<div class="input-group input-group-sm mx-1">' +
        '<div class="input-group-prepend">' +
          '<span class="input-group-text">day/time</span>' +
        '</div>' + 
        '<input type="text" class="form-control OD-input-date" size="4" value="1"></input>' +
        '<input type="text" class="form-control OD-input-time" size="4" value="0000"></input>' +
      '</div>' +
      '<div class="input-group input-group-sm mx-1">' +
        '<div class="input-group-prepend">' +
          '<span class="input-group-text">TDM level</span>' +
        '</div>' + 
        '<input type="text" class="form-control OD-input-level" size="3" value="0"></input>' +
        '<div class="input-group-append">' +
          '<span class="input-group-text">mg/L</span>' +
        '</div>' + 
      '</div>' +
    '</form></div>';

  caller.insertAdjacentHTML("beforeend", html);
}

function OD_enter_editmode(caller, validator) {
  while (!caller.classList.contains("OD-editable")) caller = caller.parentElement;
  console.log("Entering edit mode");

  /* Switch off "readOnly" on all editable fields */
  var list = caller.querySelectorAll("input");
  for (var i = 0; i < list.length; i++) {
    list[i].readOnly = false;
  }

  /* Switch off "disabled" on OD-editmode buttons */
  var list = caller.querySelectorAll(".OD-editmode");
  for (var i = 0; i < list.length; i++) {
    list[i].disabled = false;
  }

  /* Switch on "disabled" on OD-noteditmode buttons */
  var list = caller.querySelectorAll(".OD-noteditmode");
  for (var i = 0; i < list.length; i++) {
    list[i].disabled = true;
  }
}

function OD_exit_editmode(caller, validator) {
  while (!caller.classList.contains("OD-editable")) caller = caller.parentElement;
  console.log("Exiting edit mode");

  /* Switch on "readOnly" on all editable fields */
  var list = caller.querySelectorAll("input");
  for (var i = 0; i < list.length; i++) {
    list[i].readOnly = true;
  }

  /* Switch on "disabled" on OD-editmode buttons */
  var list = caller.querySelectorAll(".OD-editmode");
  for (var i = 0; i < list.length; i++) {
    list[i].disabled = true;
  }

  /* Switch off "disabled" on OD-noteditmode buttons */
  var list = caller.querySelectorAll(".OD-noteditmode");
  for (var i = 0; i < list.length; i++) {
    list[i].disabled = false;
  }
}
