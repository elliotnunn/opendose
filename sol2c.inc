#pragma once

#include <math.h>

#define SOL_OBSERVE(cmts, params) ((cmts).cent / (params).V)

struct sol_params {
    double k12;
    double k21;
    double k10;
    double V;
};

struct sol_cmts {
    double cent;
    double periph;
};

struct sol_cmts evolve(struct sol_cmts C, double t, double R, struct sol_params params)
{

    double E1 = params.k10 + params.k12;
    double E2 = params.k21;

    double A1 = C.cent;
    double A2 = C.periph;

    /* Eq 12. The hybrid rate constants ... are easily obtained from the micro-rate constants. */
    double L1 = ((E1 + E2) + sqrt((E1+E2)*(E1+E2) - 4*(E1*E2-params.k12*params.k21))) / 2;
    double L2 = ((E1 + E2) - sqrt((E1+E2)*(E1+E2) - 4*(E1*E2-params.k12*params.k21))) / 2;

    double common_term = 1/(L1*L2) + exp(-L1*t)/(L1*(L1-L2)) - exp(-L2*t)/(L2*(L1-L2));

    double X1 = 
        (((A1*E2 + R + A2*params.k21) - A1*L1) * exp(-L1*t) - ((A1*E2 + R + A2*params.k21) - A1*L2) * exp(-L2*t))
        /
        (L2 - L1)
        + R * E2 * common_term;

    double X2 =
        (((A2*E1 + A1*params.k12) - A2*L1) * exp(-L1*t) - ((A2*E1 + A1*params.k12) - A2*L2) * exp(-L2*t))
        /
        (L2 - L1)
        + R * params.k12 * common_term;

    struct sol_cmts retval = {X1, X2};
    return retval;
}
