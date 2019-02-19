#include <stdint.h>
#include <stdio.h>
#include <math.h>

#include "drive.inc"
#include "norm.inc"
#include "prng.inc"

#define APPEND(array, size, el) {array = realloc(array, (size + 1) * sizeof(*array)); array[size] = el;}
#define ETA_LEN (sizeof (struct mod_eta){0}.vector / sizeof (struct mod_eta){0}.vector[0])
#define FLOAT_OUT_FMT "%.17g"

void print_eta(struct mod_eta eta)
{
    printf("ETA");
    for (size_t i = 0; i < ETA_LEN; i++) {
        printf(" " FLOAT_OUT_FMT, eta.vector[i]);
    }
    printf("\n");
}

void sim_and_print(struct sol_params s_params, struct event *ev_list, size_t ev_count, double *get_times, size_t get_count)
{
    struct sol_cmts *sim = simulate(s_params, ev_list, ev_count, get_times, get_count);

    for (size_t i = 0; i < get_count; i++) {
        double observation = mod_observe(s_params, sim[i]);
        printf("# " FLOAT_OUT_FMT " " MOD_TIME_UNIT " " FLOAT_OUT_FMT " " MOD_OB_UNIT "\n", get_times[i], observation);
    }

    free(sim);
}

int main(void)
{
    /* Immutable parameters of the model (PARAM directives) */
    struct mod_params m_params = {0};

    /* Array of dosing events (EV directives) */
    struct event *ev_list = NULL; size_t ev_count = 0;

    /* Array of time points to be simulated (GET directives) */
    double *get_times = NULL; size_t get_count = 0;

    /* 0 for LEVEL/TRY/MAX, 1 for ETA (set by MANUAL directive) */
    int manual = 0;

    /* Array of levels to inform Bayes estimation (LEVEL directives) */
    double *level_times = NULL, *level_list = NULL; size_t level_count = 0;

    /* Array of explicit etas instead of Bayes est (ETA directives) */
    struct mod_eta *eta_list = NULL; size_t eta_count = 0;

    size_t max_try = SIZE_MAX, max_win = SIZE_MAX;

    /* Temp variables for reading lines */
    char linebuf[1024];
    size_t linectr = 0;
    char discard[2]; /* room for a newline and a null */

    while (fgets(linebuf, sizeof(linebuf), stdin)) {
        linectr++;

        if (linebuf[0] == '#' || linebuf[0] == '\n') continue;

        /* Temp variables for the sscanf calls below */
        double t, this;
        struct mod_eta eta;

        if (!strcmp(linebuf, "MANUAL\n") && !level_count) {
            manual = 1;
            continue;
        }

        if (sscanf(linebuf, "%lf " MOD_TIME_UNIT " EV %lf " MOD_DRUG_UNIT "/" MOD_TIME_UNIT "%1[\n]", &t, &this, discard) == 3) {
            APPEND(ev_list, ev_count, ((struct event){.t=t, .rate=this}));
            ev_count++;
            continue;
        }

        if (sscanf(linebuf, "%lf " MOD_TIME_UNIT " GET%1[\n]", &t, discard) == 2) {
            APPEND(get_times, get_count, t);
            get_count++;
            continue;
        }

        if (sscanf(linebuf, "%lf " MOD_TIME_UNIT " LEVEL %lf " MOD_OB_UNIT "%1[\n]", &t, &this, discard) == 3 && !manual && !eta_count) {
            APPEND(level_times, level_count, t);
            APPEND(level_list, level_count, this);
            level_count++;
            continue;
        }

        if(manual && !level_count && ETA_LEN + 1 == sscanf(linebuf, "ETA "

/* Description of this technique: https://en.wikipedia.org/wiki/X_Macro */
#define X(idx, dep, indep) " %lf"
MOD_X_THETA
#undef X

        "%1[\n]",

#define X(idx, dep, indep) &eta.vector[idx],
MOD_X_THETA
#undef X
/* The next parens close the sscanf and the if */

        discard)) {
            APPEND(eta_list, eta_count, eta);
            eta_count++;
            continue;
        }

#define X(vname, human, unit) if (sscanf(linebuf, "PARAM " human " %lf " unit "%1[\n]", &m_params.vname, discard) == 2) {continue;}
MOD_X_PARAMS
#undef X

        if (sscanf(linebuf, "TRY %zu%1[\n]", &max_try, discard) == 2 && !manual && !eta_count) {
            continue;
        }

        if (sscanf(linebuf, "MAX %zu%1[\n]", &max_win, discard) == 2 && !manual && !eta_count) {
            continue;
        }

        printf("Error: %zu: %s", linectr, linebuf); exit(1);
    } /* end of per-line loop */

    /* The first chunk must be a header */
#define X(vname, human, unit) printf("PARAM %s " FLOAT_OUT_FMT " %s\n", human, m_params.vname, unit);
MOD_X_PARAMS
#undef X

    for (size_t i = 0; i < ev_count; i++) {
        printf(FLOAT_OUT_FMT " %s EV " FLOAT_OUT_FMT " %s\n", ev_list[i].t, MOD_TIME_UNIT, ev_list[i].rate, MOD_DRUG_UNIT "/" MOD_TIME_UNIT);
    }

    for (size_t i = 0; i < get_count; i++) {
        printf(FLOAT_OUT_FMT " %s GET\n", get_times[i], MOD_TIME_UNIT);
    }

    printf("MANUAL\n");
    printf("\n");

    /* Subsequent output is chunked per-eta */
    if (manual) {
        for (size_t i = 0; i < eta_count; i++) {
            struct sol_params s_params = mod_theta(m_params, eta_list[i]);

            print_eta(eta_list[i]);
            sim_and_print(s_params, ev_list, ev_count, get_times, get_count);
            printf("\n");
        }
    } else {
        /* Population of estimated etas */
        /* Limit attempts, to prevent computation from taking an arbitrary time */
        size_t try_cnt = 0, win_cnt = 0;
        while (try_cnt < max_try && win_cnt < max_win) {
            try_cnt++;

            /* Select an eta vector to accept or reject */
            struct mod_eta eta;
#define X(...) __VA_ARGS__,
            const double omega[] = {MOD_OMEGA};
#undef X
            mvnorm(omega, eta.vector, ETA_LEN);
            struct sol_params s_params = mod_theta(m_params, eta);

            /* Check only the time points where LEVEL directives are supplied */
            struct sol_cmts *level_sim = simulate(s_params, ev_list, ev_count, level_times, level_count);

            /* Assess the likelihood of these LEVEL directives */
            double logpdf = 0.0;
            for (size_t i = 0; i < level_count; i++) {
                logpdf += mod_pdf(level_list[i], mod_observe(s_params, level_sim[i]));
            }
            free(level_sim);

            /* If the likelihood exceeds a random threshold, accept this eta vector */
            if (exp(logpdf) >= (double)prng64() / (double)UINT64_MAX) {
                win_cnt++;

                print_eta(eta);
                sim_and_print(s_params, ev_list, ev_count, get_times, get_count);
                printf("\n");
            }
        }
    }

    return 0;
}
