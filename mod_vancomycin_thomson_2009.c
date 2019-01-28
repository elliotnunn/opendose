/* This is the mathematical model for which we produce population-distributed parameters */

#include <math.h>

#include "sol2c.inc"

#define X_MOD_PARAMS \
    X(tbw, "total body weight", "kg") \
    X(crcl, "creatinine clearance", "mL/min") \

struct mod_params {
#define X(a, b, c) double a;
X_MOD_PARAMS
#undef X
};

#define ETA_LEN 4
const double OMEGA[] = {
    0.0729, 0.0,    0.0,    0.0,
    0.0,    0.0225, 0.0,    0.0,
    0.0,    0.0,    1.69,   0.0,
    0.0,    0.0,    0.0,    0.2401
};

struct sol_params getparams(double *eta, struct mod_params mparm)
{
    struct sol_params retval;

    double CL = exp(eta[0]) * 2.99 * (1.0 + (mparm.crcl - 66) * 0.0154);
    double V1 = exp(eta[1]) * 0.675 * mparm.tbw;
    double V2 = exp(eta[2]) * 0.732 * mparm.tbw;
    double Q = exp(eta[3]) * 2.28;

    retval.V = V1;
    retval.k10 = CL / V1;
    retval.k12 = Q / V1;
    retval.k21 = Q / V2;

    return retval;
}

double ob_pdf(double observed, double expected)
{
    double variance = pow(1.6, 2) + pow(0.15*expected, 2);
    double zscore = (observed - expected) / sqrt(variance);
    return -0.5 * zscore * zscore;
}
