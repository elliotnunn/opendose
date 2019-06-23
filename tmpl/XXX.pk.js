function pharmacokineticReport (scenario) {
  var num_eta = scenario.stdout.length - 1;
  var num_t = scenario.stdout[1].length - 1;
  var num_vec = scenario.stdout[1][0].split(' ').length - 1;

  var biglist = [];
  for (var i = 0; i < num_vec; i++) {
    biglist.push(new Float64Array(num_eta));
  }
  for (var i = 0; i < num_eta; i++) {
    var splitup = scenario.stdout[i + 1][0].split(' ').slice(1);
    for (var j = 0; j < splitup.length; j++) {
      biglist[j][i] = parseFloat(splitup[j]);
    }
  }
  biglist.forEach(function (l) {l.sort()});

  console.log(biglist);

  OMEGA = [
    #define X(...) [__VA_ARGS__],
    MOD_OMEGA
    #undef X
  ]

  ary = [];

  ary.push('PHARMACOKINETICS.');

  function reportX(i, dep, indep) {
    var lo = pctileFrom(2.5, biglist[i]);
    var hi = pctileFrom(97.5, biglist[i]);

    var str = dep.toUpperCase();
    if (indep.length > 0) {
      str += ' (given ' + indep + ')';
    }
    str += ': ';

    if (scenario.levels.length > 0) {
      var median_eta = pctileFrom(50, biglist[i]);
      var zscore = median_eta / Math.sqrt(OMEGA[i][i]);
      str += 'ETA=' + median_eta.toFixed(2) + ' Z=' + zscore.toFixed(1);

      var result = 'normal range';
      if (lo > 0) result = 'high, *p<0.05';
      if (hi < 0) result = 'low, *p<0.05';
      str += ' (' + result + ')';

    } else {
      str += 'presumed normal range';
    }

    ary.push(str);
  }

  #define X(a,b,c) reportX(a,b,c);
  MOD_X_THETA
  #undef X

  return ary.join('\n');
}