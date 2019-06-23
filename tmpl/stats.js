function calcAUC(x, y, start, stop) {
  /* Just use the TRIANGLEY algoritm */
  var accum = 0;
  for (var i = 0; i < x.length - 1; i++) {
    if (x[i] < start) continue;
    if (x[i] >= stop) break;
    accum += (x[i+1] - x[i]) * (y[i] + y[i+1]) / 2;
  }
  return accum;
}

function pctileOf(ref, list) {
  for (var i = 0; i < list.length; i++) {
    if (ref <= list[i]) break;
  }
  return Math.round(100 * i / list.length);
}

function pctileFrom(pctile, list) {
  return list[Math.round((list.length - 1) * pctile / 100)];
}
