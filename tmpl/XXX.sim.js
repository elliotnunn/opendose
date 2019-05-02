kEnoughSims = 200;

function seriousMainThingDoer()
{
  /* Terminate any workers that are running */
  try {
    for (var i = 0; i < gScenarioArray.length; i++) {
      gScenarioArray[i].worker.terminate();
    }
    gScenarioArray = undefined;
  } catch {
    /* idempotent, do nothing */
  }

  /* Load user input (quite involved) */
  var scenario_array = divideDomIntoScenarios(this); 

  /* Do one-off input parsing for each calculated scenario */
  for (var i = 0; i < scenario_array.length; i++) {
    scenario_array[i].stdin = parseDomScenario(scenario_array[i].dom);
  }

  /* Callback to update the ui progress bar */
  function update_callback()
  {
    updateUiProgress(scenario_array);
  }

  /* Call it once to zero the progress bar */
  update_callback();

  /* Start the workers */
  for (var i = 0; i < scenario_array.length; i++) {
    simScenario(scenario_array[i], update_callback);
  }

  /* Leave a global around to pick up later */
  gScenarioArray = scenario_array;
}

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
    accum.push(100 - y[i].toString() * 100 / 50);
  }
  accum = accum.join(" ");
  newEl = document.createElementNS('http://www.w3.org/2000/svg',"path");
  newEl.setAttributeNS(null, "d", accum);
  return newEl;
}

function divideDomIntoScenarios()
{
  user_input_element = document.querySelector(".OD-editable");

  var N = 1;

  // okay, now we just need to keep making dupes of the DOM element... easy!
  var every_field = user_input_element.querySelectorAll("input");
  for (var i = 0; i < every_field.length; i++) {
    var text = every_field[i].value;
    N *= text.split("/").length;
  }

  // each dupe of the DOM has a separate permutation of "slashed" fields
  big_array = []
  for (var i = 0; i < N; i++) {
    var name = [];
    var instance = user_input_element.cloneNode(true); /* deep copy of node */
    var shrinkMod = i;
    var shrinkN = N;
    var every_field = instance.querySelectorAll("input");
    for (var j = 0; j < every_field.length; j++) {
      var possibilities = every_field[j].value.split("/");
      var chunk = Math.floor(shrinkN / possibilities.length);
      var choice = possibilities[Math.floor(shrinkMod / chunk)];

      if (possibilities.length > 1) name.push(choice);
      every_field[j].value = choice;

      shrinkMod %= chunk;
      shrinkN /= possibilities.length;
    }
    big_array.push({name: name.join("/"), dom: instance});
  }

  return big_array;
}

function parseDomScenario(dom)
{
  /* Marshal a bayes input file from the history */
  var ary = [];

  /* Overall settings */
  ary.push("MAX " + kEnoughSims.toString());
  ary.push("TRY 10000000");

  /* Marshal covariates */
  #define X(short, long, unit) ary.push("PARAM " + long + " " + dom.querySelector("#" + <DOSTRING>short</DOSTRING>).value + " " + unit);
  MOD_X_PARAMS
  #undef X

  var maxTime = 0; /* How far out to take our graph */

  /* Marshal doses (this format will change) */
  var lines = dom.querySelectorAll(".OD-inputline-dose");
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
  var lines = dom.querySelectorAll(".OD-inputline-level");
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
  for (var i = 0; i < numPoints; i++) {
    var hour = xWidth / (numPoints - 1) * i;
    ary.push(hour.toString() + " h GET");
  }

  ary.push(""); // trailing newline needed
  query = ary.join("\n");
  return query;
}

function simScenario(scenario, callback)
{
  // scenario has members: name, dom, stdin, now worker and soon stdout
  var hardWorker = new Worker("XXX.worker.js");
  scenario.worker = hardWorker;
  scenario.stdout = [];

  hardWorker.onmessage = function (msg) {
    scenario.stdout.push(msg.data);
    callback();
  }

  hardWorker.postMessage(scenario.stdin);
}

function updateUiProgress(scenario_array)
{
  var sims_wanted = kEnoughSims * scenario_array.length;

  var sims_done = 0;
  for (var i = 0; i < scenario_array.length; i++) {
    if (typeof scenario_array[i].stdout != "undefined") {
      sims_done += scenario_array[i].stdout.length - 1;
    }
  }

  var progress_bar = document.querySelector("progress");

  if (sims_done == 0) {
    progress_bar.hidden = true;
  } else if (sims_done == sims_wanted) {
    progress_bar.hidden = true;
  } else {
    progress_bar.max = sims_wanted;
    progress_bar.value = sims_done;
    progress_bar.hidden = false;
  }
}
