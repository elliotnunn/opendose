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
      var zscores = [2.5, 50, 97.5].map(function (pctile) {
        return pctileFrom(pctile, biglist[i]) / Math.sqrt(OMEGA[i][i]);
      });

      str += mkSpeedbump(13, zscores);
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