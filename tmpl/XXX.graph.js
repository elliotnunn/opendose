function verticalAxis(highest)
{
  /* rule: the loop-doops must fill 80% of the height of the graph */
  var parts = highest.toExponential().split("e");
  var mantissa = parseFloat(parts[0]);
  var exponent = parseInt(parts[1]);

  mantissa = Math.ceil(mantissa);
  if (mantissa == 10) {
    mantissa = 1;
    exponent += 1;
  }

  return {mantissa: mantissa, exponent: exponent};
}
