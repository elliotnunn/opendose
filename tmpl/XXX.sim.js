kEnoughSims = 401; /* make this an odd number for the median calculation */
kEnoughTimes = 401;

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

  gX = [];
  var t = parseInt(document.querySelector("#OD-duration").value) * 24;
  for (var i = 0; i < kEnoughTimes; i++) {
    gX.push(t * i / (kEnoughTimes - 1));
  }

  /* Load user input (quite involved) */
  var scenario_array = divideDomIntoScenarios(this); 

  /* Do one-off input parsing for each calculated scenario */
  /* Calculates stdin and level members */
  for (var i = 0; i < scenario_array.length; i++) {
    parseDomScenario(scenario_array[i]);
  }

  /* parseDomScenario edited gX but left it unsorted */
  gX.sort((a, b) => a - b);
  for (var i = gX.length - 2; i >= 0; i--) {
    if (gX[i] == gX[i+1]) gX.splice(i+1, 1);
  }

  var tstrings = [];
  gX.forEach(function (x) {
    tstrings.push(x.toString() + " " + MOD_TIME_UNIT + " GET");
  });
  tstrings.push(""); tstrings = tstrings.join("\n");
  scenario_array.forEach(function (scenario) {
    scenario.stdin += tstrings;
  });


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
  user_input_element = document;

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

function parseDomScenario(scenario)
{
  var dom = scenario.dom;
  scenario.levels = [];
  scenario.dose_times = [];

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
  var orderChecker = 0;

  var rows = dom.querySelectorAll("section.history tr");
  for (var i = 1; i < rows.length; i++) {
    var cols = rows[i].querySelectorAll("input"); /* day time level dose */

    if (cols[0].value == '.' || cols[1].value == '.') continue;

    var t = (cols[0].value - 1) * 24 + parse_time(cols[1].value);
    if (t < orderChecker) {
      alert('History lines not in order');
      throw false;
    }
    orderChecker = t;

    maxTime = Math.max(maxTime, t);

    if (cols[2].value != '' && cols[2].value != '.') {
      ary.push(t.toString() + " h LEVEL " + cols[2].value + " " + MOD_OB_UNIT);
      scenario.levels.push([t, parseFloat(cols[2].value)]);
    }

    if (cols[3].value != '' && cols[3].value != '.') {
      var dur = 1; /* everything pushed over one hour for now */
      var rate = cols[3].value / dur;

      ary.push(t.toString() + " h EV " + rate.toString() + " " + MOD_DRUG_UNIT + "/" + MOD_TIME_UNIT);
      ary.push((t+dur).toString() + " h EV 0 " + MOD_DRUG_UNIT + "/" + MOD_TIME_UNIT);

      /* Guarantee that every peak and trough get a time point (better check this later) */
      gX.push(t);
      gX.push(t+dur);

      /* Notify the pharmacodynamic module of dose times */
      scenario.dose_times.push(t);

      maxTime = Math.max(maxTime, t+dur);
      orderChecker = t+dur;
    }
  }

  ary.push(""); // trailing newline needed
  scenario.stdin = ary.join("\n");
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


  var progress_bar = document.querySelector("#do-it");

  if (sims_done == 0 || sims_done == sims_wanted) {
    progress_bar.innerHTML = progress_bar.innerHTML.split(' ')[0];
  } else {
    var rounded = Math.floor(10 * sims_done / sims_wanted) * 10;
    progress_bar.innerHTML = progress_bar.innerHTML.split(' ')[0] + ' (' + rounded + '%)';
  }

  if (sims_done == sims_wanted) {
    /* done! hooray! */
    for (var i = 0; i < scenario_array.length; i++) {
      calcDescriptiveStats(scenario_array[i]);
    }

    document.querySelectorAll(".ephem").forEach(function (el) {el.remove()});

    updateYAxis(Math.max(...window.gScenarioArray[0].hconf));
    updateXAxis(parseFloat(document.querySelector("#OD-duration").value) * 24);
    
    var colours = ["black", "red", "green", "blue", "orange", "purple"];

    for (var i = 0; i < scenario_array.length; i++) {
      var colour = colours[i % colours.length];
      blatPath(colour, gX, scenario_array[i].median);
      blatStreet(colour, gX, scenario_array[i].lconf, scenario_array[i].hconf);
      blatLevels(colour, scenario_array[i].levels);
    }
  }
}

function calcDescriptiveStats(scenario)
{
  console.log(scenario.stdout);
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
