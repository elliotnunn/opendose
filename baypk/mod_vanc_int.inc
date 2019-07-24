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

/* For pow() and exp() */
#include <math.h>

/* Use two-compartment pharmacokinetic solution */
#include "sol_2c.inc"

/* Basic information */
#define MOD_DRUG "vancomycin"

#define MOD_POPULATION "British hospital patients receiving vancomycin by intermittent infusion"

#define MOD_REFERENCE \
"Thomson AH, Staatz CE, Tobin CM, Gall M, Lovering AM. \
Development and evaluation of vancomycin dosage guidelines \
designed to achieve new target concentrations. \
Journal of antimicrobial chemotherapy. \
2009 Mar 19;63(5):1050-7."

#define MOD_DRUG_UNIT "mg"
#define MOD_TIME_UNIT "h"

/* The fixed parameters of the model */
struct mod_params {
    double tbw;
    double crcl;
};

/* Describe each parameter in natural language */
#define MOD_X_PARAMS \
    X(tbw, "total body weight", "kg") \
    X(crcl, "creatinine clearance", "mL/min") \

/* The between-subjects variation of this model */
#define MOD_OMEGA \
    X(0.0729, 0.0,    0.0,    0.0) \
    X(0.0,    0.0225, 0.0,    0.0) \
    X(0.0,    0.0,    1.69,   0.0) \
    X(0.0,    0.0,    0.0,    0.2401)

/* An individual sample from that variation */
struct mod_eta {
    double vector[4];
};

/* X-macro explaining theta in natural language */
#define MOD_X_THETA \
    X(0, "drug clearance", "creatinine clearance") \
    X(1, "central compartment", "total body weight") \
    X(2, "peripheral compartment", "total body weight") \
    X(3, "inter-compartmental clearance", "") \

/* Prepare for a simulation, given our fixed params and a random vector ("eta") */
struct sol_params mod_theta(struct mod_params mod_params, struct mod_eta eta)
{
    struct sol_params sol_params;

    /* First interpret the eta to get individual PK parameters */
    double CL = exp(eta.vector[0]) * 2.99 * (1.0 + (mod_params.crcl - 66) * 0.0154);
    double V1 = exp(eta.vector[1]) * 0.675 * mod_params.tbw;
    double V2 = exp(eta.vector[2]) * 0.732 * mod_params.tbw;
    double Q = exp(eta.vector[3]) * 2.28;

    /* Then convert these into the micro-rate form used by our 2-cmt solution */
    sol_params.V = V1;
    sol_params.k10 = CL / V1;
    sol_params.k12 = Q / V1;
    sol_params.k21 = Q / V2;

    return sol_params;
}

#define MOD_OB_UNIT "mg/L"

/* Interpret the dimensionless output of the solution */
double mod_observe(struct sol_params params, struct sol_cmts cmts)
{
    return cmts.cent / params.V;
}

/* Get the pdf of an observed concentration, given the predicted one */
double mod_pdf(double observed, double expected)
{
    double variance = pow(0.15*expected, 2);
    double zscore = (observed - expected) / sqrt(variance);
    return -0.5 * zscore * zscore;
}
