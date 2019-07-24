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

#pragma once

#include <stdint.h>
#include <stdlib.h>

struct event {
    double t;
    double rate;
};

struct sol_cmts *simulate(struct sol_params params, const struct event *events, size_t event_cnt, const double *times, size_t time_cnt)
{
    struct sol_cmts *retval = malloc(time_cnt * sizeof(*retval));

    struct sol_cmts sol_cmts;
    double rate = 0.0;
    double t = 0.0;

    size_t i_e = 0;

    /* Iterate over the time points at which an observation is to be made */
    for (size_t i_t = 0; i_t < time_cnt; i_t++) {
        /* Advance to the event immediately preceding this observation */
        while (i_e < event_cnt && events[i_e].t <= times[i_t]) {
            sol_cmts = sol_evolve(params, sol_cmts, events[i_e].t - t, rate);
            rate = events[i_e].rate;
            t = events[i_e].t;
            i_e++;
        }

        /* Make the observation */
        if (times[i_t] == t) {
            retval[i_t] = sol_cmts;
        } else {
            retval[i_t] = sol_evolve(params, sol_cmts, times[i_t] - t, rate);
        }
    }

    return retval;
}
