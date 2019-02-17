# Overview of Readme

- How to use a binary (to do)
- How to change the source and compile (in progress below)
- How to use the sources to build high-level wrapping software (to do)

### What every model file should do

Most *model files* (`mod_*.inc`) should use a *solution file* (`#include "sol_*.inc"`) to perform a simulation. Solution files contain low-level instructions for evolving a model of an individual from event to event, using code structured according to the [list of definitions and declarations below](#sol). However, if a model requires a solution that cannot possibly be generalised to other pharmacokinetic models, then this solution code could reasonably be included directly in the model file.

A key distinction is that models are aware of physical units, while solutions deal in dimensionless quantities.

Declare these structs.

- `mod_params`: a member for each fixed input to the model, e.g. `tbw` for total body weight
- `mod_eta`: one member `vector[]` the length of an eta vector

Declare these constants.

- `mod_omega[]`: a covariance matrix describing the multivariate normal distribution of eta vectors between subjects. The matrix is flattened into a single C array in row-major form, with the covariances in the lower triangle and zeros in the upper triangle. Remember that the diagonal (upper left to lower right) contains variances, not standard deviations. Likewise, the lower triangle contains covariances, not correlation coefficients. Lastly, note that the mean value of each element of eta is zero, so this covariance matrix is sufficient to describe the eta distribution without a "mean vector".

Declare these functions.

- `struct sol_params mod_theta(struct mod_params, struct mod_eta)`: based on the fixed model parameters and an eta describing an individual, and returns a `sol_params` struct to be passed into the pharmacokinetic solver
- `double mod_observe(struct sol_params, struct sol_cmts)`: returns the observation expected given this state
- `mod_pdf()`: accepts observed and predicted values (there is assumed to be only one observable compartment), and applies the residual unexplained variability (RUV) model of the scenario to return the natural logarithm of the probability density of the observed value. For speed, this should be scaled so that a perfect match will return 0.0.

Define these macros. They allow `opendose` to expose the characteristics of the model in natural language, and also to parse text input files. User-facing applications can also take advantage of these macros if they are built with access to these sources and a C preprocessor. An understanding of [X-macros](https://en.wikipedia.org/wiki/X_Macro) is useful here.

- `MOD_DRUG` (string literal): an International Nonproprietary Name
- `MOD_POPULATION` (string literal): a brief natural-language description of the population in which the model is validated, e.g. "Australian hospital patients receiving vancomycin"
- `MOD_REFERENCE` (string literal): Vancouver-format reference to a paper describing the model
- `MOD_DRUG_UNIT` (string literal): the drug units (e.g. "mg")
- `MOD_TIME_UNIT` (string literal): the time units ("h" very strongly encouraged)
- `MOD_X_PARAMS` (X-macro): an `X(member_name, natural_name_literal, unit_literal)` macro call for each member of `mod_params`
- `MOD_X_THETA` (X-macro): an `X(index, dependent_var_literal, independent_vars_literal)` macro call for each element of eta, describing the model variable that depends on that element of eta, and any independent model parameters that also contribute to that same dependent variable. The `independent_vars_literal` should be delimited like `"one fish, two fish"`, or be an empty string `""` if necessary.
- `MOD_OB_UNIT` (string literal): the unit that observations are made in

### <a name="sol"></a>What every solution file should do

Solution files are factored out from model files because they are typically generic and reusable. For example, many published pharmacokinetic models are simple one- or two-compartment models with first-order absorption and/or first-order elimination. A solution file simulates such a model using closed- or open-form computation, while a more specific *model file* knowing anything about the between-subjects variability or residual unexplained variation in pharmacokinetic parameters.

Declare these structs.

- `sol_params`: a member for each parameter that does not vary within an individual simulation. Unlike `mod_params`, this information describes the pharmacokinetic parameters of an individual.
- `sol_cmts`: a member for each variable that changes throughout the simulation (typically, the amount of drug in each compartment).

Declare these functions.

- `struct sol_cmts sol_evolve(struct sol_params, struct sol_cmts, double /*deltatime*/, double /*rate*/)`: returns the result of the simulation after a period of time

Define these macros. As above, they allow other parts of `opendose`, and user software, to make sense of the underlying computation.

- `SOL_DESCRIPTION` (string literal): a short phrase (e.g. "one-compartment model")
- `SOL_REFERENCE` (string literal): Vancouver-format reference to a paper describing the solution
