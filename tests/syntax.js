ObjC.import('Foundation');

function read(p) {
  return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError($(p), $.NSUTF8StringEncoding, null));
}

var files = read('/tmp/costum-jsfiles.txt').split('\n').filter(Boolean);
var bad = 0;

files.forEach(function (file) {
  try {
    new Function(read(file));
  } catch (e) {
    bad++;
    console.log('  SYNTAX ERROR ' + file + ' :: ' + e);
  }
});

console.log(bad === 0 ? '  ' + files.length + ' files parse' : '  ' + bad + ' file(s) failed');
if (bad) { $.exit(1); }
