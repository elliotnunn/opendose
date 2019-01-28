#pragma once

#include <stdint.h>
#include <stdlib.h>

struct event {
    double t;
    double rate;
};

struct sol_cmts *simulate(struct sol_params sparms, const double *times, size_t time_cnt, const struct event *events, size_t event_cnt)
{
    struct sol_cmts *retval = malloc(time_cnt * sizeof(*retval));

    struct sol_cmts sol_cmts = {};
    double rate = 0.0;
    double t = 0.0;

    size_t i_e = 0;

    /* Iterate over the time points at which an observation is to be made */
    for (size_t i_t = 0; i_t < time_cnt; i_t++) {
        /* Advance to the event immediately preceding this observation */
        while (i_e < event_cnt && events[i_e].t <= times[i_t]) {
            sol_cmts = evolve(sol_cmts, events[i_e].t - t, rate, sparms);
            rate = events[i_e].rate;
            t = events[i_e].t;
            i_e++;
        }

        /* Make the observation */
        if (times[i_t] == t) {
            retval[i_t] = sol_cmts;
        } else {
            retval[i_t] = evolve(sol_cmts, times[i_t] - t, rate, sparms);
        }
    }

    return retval;
}

double simulate_and_compare(struct sol_params sparms, const double *ob_times, const double *obs, size_t ob_cnt, const struct event *events, size_t event_cnt)
{
    double accum = 0.0;

    struct sol_cmts *expects = simulate(sparms, ob_times, ob_cnt, events, event_cnt);

    for (size_t i = 0; i < ob_cnt; i++) {
        accum += ob_pdf(obs[i], SOL_OBSERVE(expects[i], sparms));
    }

    return accum;
}
