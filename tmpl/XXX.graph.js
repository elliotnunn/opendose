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

function updateYAxis(highest)
{
  var scale_obj = verticalAxis(highest);

  var x1 = document.querySelector(".plotarea").x.baseVal.value;
  var x2 = document.querySelector(".plotarea").width.baseVal.value + x1;

  var lowest = 100 - 8;
  var highest = 4;

  var plot = document.querySelector("#plot");

  for (var i = 0; i <= scale_obj.mantissa; i++) {
    var y = lowest + (highest - lowest) * i / scale_obj.mantissa;

    if (i > 0) {
      var html = '<line class="ephem gridmark" vector-effect="non-scaling-stroke" x1="' + x1 + '" x2="' + x2 + '" y1="' + y + '" y2="' + y + '" />';
      plot.querySelector("#ticks").insertAdjacentHTML("beforeend", html);
    }

    if (i == 0) {
      var str = "0";
    } else {
      var str = parseFloat(i + "e" + scale_obj.exponent);
    }

    var html = '<text class="ephem" text-anchor="end" style="font-size: 4px" x="7" y="' + (y+1) + '">' + str + '</text>';
    plot.querySelector("#ticks").insertAdjacentHTML("beforeend", html);
  }

  plot.odgYminpx = lowest;
  plot.odgYmaxpx = highest;
  plot.odgYscale = (highest - lowest) / parseFloat(scale_obj.mantissa + "e" + scale_obj.exponent);
}

function updateXAxis(highest)
{
  var plot = document.querySelector("#plot");

  var higher = Math.ceil(highest / 24) * 24;

  plot.odgXminpx = document.querySelector(".plotarea").x.baseVal.value;
  plot.odgXmaxpx = document.querySelector("#plot").viewBox.baseVal.width;
  plot.odgXscale = (plot.odgXmaxpx - plot.odgXminpx) / higher;

  var y1 = document.querySelector(".plotarea").y.baseVal.value;
  var y2 = document.querySelector(".plotarea").height.baseVal.value + y1;

  for (var i = 24; i <= higher; i+=24) {
    var x = plot.odgXminpx + i * plot.odgXscale;

    if (i < higher) {
      var html = '<line class="ephem gridmark" vector-effect="non-scaling-stroke" x1="' + x + '" x2="' + x + '" y1="' + y1 + '" y2="' + y2 + '" />';
      plot.querySelector("#ticks").insertAdjacentHTML("beforeend", html);
    }

    var str = higher > 240 ? "D" : "Day "
    str += i / 24
    var html = '<text class="ephem" text-anchor="middle" style="font-size: 4px" x="' + (x - plot.odgXscale*12) + '" y="' + (y2+5) + '">' + str + '</text>';
    plot.querySelector("#ticks").insertAdjacentHTML("beforeend", html);
  }
}

function blatPath(colour, x, y) {
  var plot = document.querySelector("#plot");

  var cmd = "M";
  var accum = [];
  for (var i = 0; i < x.length; i++) {
    accum.push(cmd); cmd = "L";
    accum.push((plot.odgXminpx + x[i]*plot.odgXscale).toString());
    accum.push((plot.odgYminpx + y[i]*plot.odgYscale).toString());
  }
  accum = accum.join(" ");

  var el = document.createElementNS('http://www.w3.org/2000/svg',"path");
  el.setAttributeNS(null, "d", accum);
  el.setAttributeNS(null, "vector-effect", "non-scaling-stroke");
  el.setAttributeNS(null, "stroke", colour);
  el.setAttributeNS(null, "class", "median ephem");

  plot.querySelector("#lines").insertAdjacentElement("beforeend", el);
}

function blatStreet(colour, _x, y1, y2) {
  var x = new Float64Array(_x.length * 2);
  x.set(_x);
  x.reverse();
  x.set(_x);

  var y = new Float64Array(x.length);
  y.set(y2);
  y.reverse();
  y.set(y1);

  var plot = document.querySelector("#plot");

  var cmd = "M";
  var accum = [];
  for (var i = 0; i < x.length; i++) {
    accum.push(cmd); cmd = "L";
    accum.push((plot.odgXminpx + x[i]*plot.odgXscale).toString());
    accum.push((plot.odgYminpx + y[i]*plot.odgYscale).toString());
  }
  accum = accum.join(" ");

  var el = document.createElementNS('http://www.w3.org/2000/svg',"path");
  el.setAttributeNS(null, "d", accum);
  el.setAttributeNS(null, "fill", colour);
  el.setAttributeNS(null, "class", "street ephem");

  plot.querySelector("#streets").insertAdjacentElement("beforeend", el);
}
