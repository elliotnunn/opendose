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

function pharmacodynamicReport(scenario) {
  var y = scenario.tTogether_etaApart;
  var num_eta = scenario.stdout.length - 1;
  var num_t = scenario.stdout[1].length - 1;

  var ary = [];

  ary.push('PHARMACODYNAMICS. Target is 400 < AUC < 650.');

  /* Calc bottom target */
  var btm_auc = 400;
  supplied_mic = parseFloat(document.querySelector('#OD-pd').value);
  if (!isNaN(supplied_mic)) {
    btm_auc *= supplied_mic;
    ary[0] = ary[0].replace('400', '400*MIC');
  }

  /* Calc top target */
  var top_auc = 650;

  /* Simplification: all AUCs work... */
  var pd_start = scenario.dose_times[0];
  var pd_stop = gX[gX.length - 1];
  var step = 24;
  for (var dnum = 1, start = pd_start; start + step <= pd_stop; dnum++, start += step) {
    var dose_str = '24h period #' + dnum;

    var aucs = new Float64Array(num_eta);
    for (var j = 0; j < num_eta; j++) {
      var slice = y.slice(j * num_t, (j + 1) * num_t);
      aucs[j] = calcAUC(gX, slice, start, start+step);
    }
    aucs.sort();

    // Am I calculating the right AUCs here? Just do it...

    var percent_btm = pctileOf(btm_auc, aucs);
    var percent_top = pctileOf(top_auc, aucs);
    var result_str = [];
    // result_str.push('AUC[95%CI]=' + Math.round(pctileFrom(2.5, aucs)) + '-' + Math.round(pctileFrom(97.5, aucs)));
    result_str.push('AUC[50%]=' + Math.round(pctileFrom(50, aucs)));
    result_str.push('P(low)=' + percent_btm + '%');
    result_str.push('P(high)=' + (100-percent_top) + '%');
    ary.push(dose_str + ': ' + result_str.join(', '));
  }

  return ary.join('\n');
}
