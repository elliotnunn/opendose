kEnoughSims = 401; /* make this an odd number for the median calculation */

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

  gX = new Float64Array(401);
  var t = parseInt(document.querySelector(".OD-input-period").value) * 24;
  for (var i = 0; i < gX.length; i++) {
    gX[i] = t * i / (gX.length - 1);
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

  gX.forEach(function (x) {
    ary.push(x.toString() + " h GET");
  })

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

  if (sims_done == sims_wanted) {
    /* done! hooray! */
    for (var i = 0; i < scenario_array.length; i++) {
      calcDescriptiveStats(scenario_array[i]);
    }

    document.querySelectorAll(".ephem").forEach(function (el) {el.remove()});

    updateYAxis(Math.max(...window.gScenarioArray[0].hconf));
    updateXAxis(parseFloat(document.querySelector(".OD-input-period").value) * 24);
    
    var colours = ["black", "red", "green", "blue", "orange", "purple"];

    for (var i = 0; i < scenario_array.length; i++) {
      var colour = colours[i % colours.length];
      blatPath(colour, gX, scenario_array[i].median);
      blatStreet(colour, gX, scenario_array[i].lconf, scenario_array[i].hconf);
    }
  }
}

function calcDescriptiveStats(scenario)
{
  var num_eta = scenario.stdout.length - 1;
  var num_t = scenario.stdout[1].length - 1;
  var ary_len = num_eta * num_t;

  /* flat array... */
  var tTogether_etaApart = new Float64Array(ary_len);
  var etaTogether_tApart = new Float64Array(ary_len);

  for (var eta = 0; eta < num_eta; eta++) {
    for (var t = 0; t < num_t; t++) {
      var the_number = scenario.stdout[eta+1][t+1].split(" ")[3];
      tTogether_etaApart[eta * num_t + t] = the_number;
      etaTogether_tApart[t * num_eta + eta] = the_number;
    }
  }

  var etaTogetherSorted_tApart = new Float64Array(ary_len);
  for (var t = 0; t < num_t; t++) {
    var base = t * num_eta;
    var my_slice = etaTogether_tApart.slice(base, base + num_eta);
    my_slice.sort();
    etaTogetherSorted_tApart.set(my_slice, base);
  }

  function rip_index(x)
  {
    var median = new Float64Array(num_t);
    for (var t = 0; t < num_t; t++) {
      median[t] = etaTogetherSorted_tApart[t * num_eta + x];
    }
    return median;
  }


  scenario.lconf = rip_index(10);
  scenario.median = rip_index(200);
  scenario.hconf = rip_index(390);
}

function mkChartControlObject(scenario_array)
{
  var obj = {
    // labels: ['a', 'b', 'c'],
    series: []
  };

  for (var i = 0; i < scenario_array.length; i++) {
    obj.series.push(Array.from(scenario_array[i].lconf));
    obj.series.push(Array.from(scenario_array[i].median));
    obj.series.push(Array.from(scenario_array[i].hconf));
    // obj.series.push([1,2,3]);
  }

  console.log(obj);

  /* fill obj out a bit */

  return obj;
}
