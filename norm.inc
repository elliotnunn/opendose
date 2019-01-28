#pragma once

#include <stdint.h>
#include <stdlib.h>
#include <math.h>

#include "prng.inc"

/* Draw a single number from the standard normal distribution */
/* Marsaglia algorithm */
double norm()
{
    double x, y, rsq, f;
    do {
        x = 2.0 * prng64() / (double)UINT64_MAX - 1.0;
        y = 2.0 * prng64() / (double)UINT64_MAX - 1.0;
        rsq = x * x + y * y;
    } while(rsq >= 1. || rsq == 0.);
    f = sqrt(-2.0 * log(rsq) / rsq);
    return x * f;
    //discard y * f;
}

/* The Cholesky decomposition of the covariance matrix is applied to impose correlation on a vector */
/* Lower triangular */
double *cholesky(const double *A, size_t n)
{
    double *L = (double *)calloc(n * n, sizeof(double));
 
    for (size_t i = 0; i < n; i++)
        for (size_t j = 0; j < (i+1); j++) {
            double s = 0;

            for (size_t k = 0; k < j; k++) {
                s += L[i * n + k] * L[j * n + k];
            }

            L[i * n + j] = (i == j) ?
                sqrt(A[i * n + i] - s) :
                (1.0 / L[j * n + j] * (A[i * n + j] - s));
        }
 
    return L;
}

double *mvnorm(const double *omega, size_t dim)
{
    double *ary = (double *)malloc(dim * sizeof(*ary));

    /* Initially, a vector of samples from the standard normal */
    for (size_t i = 0; i < dim; i++) {
        ary[i] = norm();
    }

    /* Take the Cholesky transform of omega (please compiler please partial) */
    double *chol = cholesky(omega, dim);

    /* Dirty work of matrix multiplication */
    double *ary2 = (double *)malloc(dim * sizeof(*ary2));

    for (size_t row = 0; row < dim; row++) {
        ary2[row] = 0.0;
        for (size_t col = 0; col < dim; col++) {
            ary2[row] += ary[col] * chol[dim * row + col];
        }
    }

    free(ary);
    free(chol);

    return ary2;
}
