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
