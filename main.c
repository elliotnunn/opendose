#include <stdint.h>
#include <stdio.h>
#include <math.h>

#include "drive.inc"
#include "norm.inc"
#include "prng.inc"

int main(void)
{
    /* Final results of reading the input text */
    double *tbuf = NULL, *obuf = NULL; size_t tcount = 0;
    struct event *ebuf = NULL; size_t ecount = 0;
    double eta[ETA_LEN] = {0};
    struct mod_params mparms = {0};
    size_t max_tries = 0, max_succeeds = 0;

    /* Temp variables for reading lines */
    char linebuf[1024];
    size_t linectr = 0;

    while (fgets(linebuf, sizeof(linebuf), stdin)) {
        linectr++;

        /* Temp variables for the sscanf calls below */
        double t, this;
        size_t idx;

#ifdef BAYES
        if (sscanf(linebuf, "OB %lf %lf", &t, &this) == 2) {
            tcount++;
            tbuf = realloc(tbuf, tcount * sizeof(*tbuf)); tbuf[tcount - 1] = t;
            obuf = realloc(obuf, tcount * sizeof(*obuf)); obuf[tcount - 1] = this;
            continue;
        }
#else
        if (sscanf(linebuf, "OB %lf", &t) == 1) {
            tcount++;
            tbuf = realloc(tbuf, tcount * sizeof(*tbuf)); tbuf[tcount - 1] = t;
            continue;
        }
#endif

        if (sscanf(linebuf, "EV %lf %lf", &t, &this) == 2) {
            ecount++;
            ebuf = realloc(ebuf, ecount * sizeof(*ebuf)); ebuf[ecount - 1] = (struct event){.t=t, .rate=this};
            continue;
        }

#ifndef BAYES
        if (sscanf(linebuf, "ETA %zu %lf", &idx, &this) == 2 && idx < ETA_LEN) {
            eta[idx] = this;
            continue;
        }
#endif

#define X(vname, human, unit) if (sscanf(linebuf, "PARAM " #vname " %lf", &mparms.vname) == 1) {continue;}
X_MOD_PARAMS
#undef X

#ifdef BAYES
        if (sscanf(linebuf, "TRY %zu", &max_tries) == 1) {
            continue;
        }

        if (sscanf(linebuf, "MAX %zu", &max_succeeds) == 1) {
            continue;
        }
#endif

        printf("Error: %zu: %s", linectr, linebuf); exit(1);
    } /* end of per-line loop */

#ifdef BAYES
    for (size_t tries = 0, succeeds = 0; (tries < max_tries || !max_tries) && (succeeds < max_succeeds || !max_succeeds); tries++) {
        /* calculate a representative eta vector to test against these results */
        double *test_eta = mvnorm(OMEGA, ETA_LEN);
        struct sol_params sparms = getparams(test_eta, mparms);
        double logpdf = simulate_and_compare(sparms, tbuf, obuf, tcount, ebuf, ecount);
        if (exp(logpdf) >= (double)prng64() / (double)UINT64_MAX) {
            for (size_t j = 0; j < ETA_LEN; j++) {
                printf("ETA %zu %lf\n", j, test_eta[j]);
            }
            printf("\n");
            succeeds++;
        }
    }
#else
    /* Now solve the guts of the problem */
    struct sol_params sparms = getparams(eta, mparms);

    struct sol_cmts *result = simulate(sparms, tbuf, tcount, ebuf, ecount);

    for (size_t i = 0; i < tcount; i++) printf("%lf %lf\n", tbuf[i], SOL_OBSERVE(result[i], sparms));
#endif

    return 0;
}
