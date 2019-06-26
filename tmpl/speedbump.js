/* Return SVG code to make an inline "speedbump": */
/* a bell curve with a tick at each member of zscores */
function mkSpeedbump(zwidth, zscores) {
  var height_px = 15;
  var narrowest = 3.5; /* min stdevs above and below the bell */

  var lreach = Math.floor(Math.min(-narrowest, ...zscores)) * zwidth - 1;
  var rreach = Math.ceil(Math.max(narrowest, ...zscores)) * zwidth + 1;

  console.log(lreach); console.log(rreach);

  var pt_ary = []; var cmd = "M";
  for (var i = lreach + 0.5; i <= rreach + 0.25; i++) {
    pt_ary.push(cmd); cmd = "L";
    pt_ary.push(-lreach + i);

    var z = i / zwidth;
    var df = Math.exp(-z*z/2); /* Poor man's normal distribution */
    pt_ary.push((height_px - 1) * (1 - df) + 0.5);
  };
  pt_ary = pt_ary.join(" ");

  var elems = [];

  elems.push('<svg class="speedbump" style="stroke:black;stroke-width:1;fill:none" width="' + (-lreach + rreach) + '" height="' + height_px + '">');
  elems.push('<path class="speedbump-bell" style="stroke:#888" d="' + pt_ary + '" />');

  zscores.forEach(function (z) {
    var x = -lreach + z*zwidth;
    elems.push('<line style="" class="speedbump-nick" y1="4.5" y2="10.5" x1="?" x2="?" />'.split('?').join(x));
  });

  if (zscores.length >= 2) {
    var x1 = -lreach + Math.min(...zscores) * zwidth;
    var x2 = -lreach + Math.max(...zscores) * zwidth;
    elems.push('<line style="" class="speedbump-line" y1="7.5" y2="7.5" x1="' + x1 + '" x2="' + x2 + '" />');
  }

  elems.push('</svg>');
  elems = elems.join("");

  return elems;
}
