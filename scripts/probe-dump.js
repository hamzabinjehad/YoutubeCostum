/* Reads DECLUTTER out of css.js as data and prints it as JSON, for probe.sh.
   Run by osascript -l JavaScript with the extension's common/ directory as the
   only argument. Evaluating the module is what keeps this in step with what the
   extension ships; a regex over the source drifted the first time it was tried. */
ObjC.import('Foundation');
/* Globals, not locals: the modules attach themselves to `self`, and an eval
   inside run() did not let them find a function-scoped one. */
var self = {}; var window = self;
function run(argv) {
  var root = argv[0].replace(/\/?$/, '/');
  var load = function (f) { return $.NSString.stringWithContentsOfFileEncodingError(root + f, 4, null).js; };
  eval(load('defaults.js')); eval(load('css.js'));
  var D = self.CostumCss.DECLUTTER, out = {};
  Object.keys(D).forEach(function (page) {
    Object.keys(D[page]).forEach(function (leaf) {
      var v = D[page][leaf];
      if (Array.isArray(v) && v.length) out[page + '.' + leaf] = v;
    });
  });
  return JSON.stringify(out);
}
