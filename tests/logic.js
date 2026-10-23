ObjC.import('Foundation');
// $.exit lives in stdlib; without it a failing run crashed with a TypeError
// instead of exiting 1, and was only reported as failing by accident.
ObjC.import('stdlib');
function read(p){ return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError($(p), $.NSUTF8StringEncoding, null)); }

var ROOT = ObjC.unwrap($.NSProcessInfo.processInfo.environment.objectForKey('COSTUM_ROOT')) + '/extension/';
var scope = {};
new Function('self', read(ROOT + 'common/defaults.js'))(scope);
new Function('self', read(ROOT + 'common/css.js'))(scope);
new Function('self', read(ROOT + 'common/lock.js'))(scope);
new Function('self', read(ROOT + 'common/bookmarks.js'))(scope);

var D = scope.CostumDefaults, C = scope.CostumCss;
var pass = 0, fail = 0;

function ok(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  → ' + detail : '')); }
}

// ---- settings model ----
var base = D.withDefaults(null);
ok('withDefaults fills a null store', base.playback.defaultSpeed === 1 && base.audio.boost === 1);
ok('withDefaults keeps stored values', D.withDefaults({ audio: { boost: 4 } }).audio.boost === 4);
ok('withDefaults fills siblings of a stored value', D.withDefaults({ audio: { boost: 4 } }).audio.bass === 0);

var merged = D.merge(base, { picture: { brightness: 80 } });
ok('merge is deep', merged.picture.brightness === 80 && merged.picture.contrast === 100);
ok('merge does not mutate its input', base.picture.brightness === 100,
   'base.picture.brightness became ' + base.picture.brightness);
ok('merge does not mutate DEFAULTS', D.DEFAULTS.picture.brightness === 100);

var arrays = D.merge(base, { playback: { speedPresets: [1, 2] } });
ok('arrays replace rather than merge element-wise',
   arrays.playback.speedPresets.length === 2, JSON.stringify(arrays.playback.speedPresets));

// ---- modesty filter ----
var M = function (patch) { return C.buildModestyCss(D.merge(base, { modesty: patch })); };

ok('off by default emits nothing', C.buildModestyCss(base) === '');
ok('blurring images covers more than thumbnails',
   /ytd-thumbnail img/.test(M({ images: 'blur' })) && /#avatar img/.test(M({ images: 'blur' })));
ok('the strength setting reaches the rule', /blur\(25px\)/.test(M({ images: 'blur', strength: 25 })));
ok('a silly strength is clamped, not trusted',
   /blur\(40px\)/.test(M({ images: 'blur', strength: 900 })) &&
   /blur\(4px\)/.test(M({ images: 'blur', strength: -5 })));
ok('hover reveal is emitted only when asked for',
   /:hover img/.test(M({ images: 'blur', reveal: 'hover' })) &&
   !/:hover img/.test(M({ images: 'blur', reveal: 'never' })));
ok('hiding images does not also emit a blur',
   /visibility: hidden/.test(M({ images: 'hide' })) && !/blur\(/.test(M({ images: 'hide' })));
ok('audio-only hides the picture rather than blurring it',
   /opacity: 0/.test(M({ video: 'audio' })) && !/blur\(/.test(M({ video: 'audio' })));
ok('every emitted rule has a selector in front of it',
   M({ images: 'blur', video: 'audio' }).split('\n\n').every(function (r) { return /^[^{]+\{/.test(r.trim()); }));

// ---- sharpen kernel ----
var K = D.sharpenKernel;
var sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };

ok('zero sharpen is the identity kernel', K(0).join(',') === '0,0,0,0,1,0,0,0,0');
ok('the weights always sum to 1, so brightness is unchanged',
   Math.abs(sum(K(0)) - 1) < 1e-9 && Math.abs(sum(K(45)) - 1) < 1e-9 && Math.abs(sum(K(100)) - 1) < 1e-9);
ok('the centre grows and the neighbours go negative', K(100)[4] > 1 && K(100)[1] < 0);
ok('corners stay zero (a plus-shaped kernel, not a box)',
   K(100)[0] === 0 && K(100)[2] === 0 && K(100)[6] === 0 && K(100)[8] === 0);
ok('out-of-range input is clamped, not trusted',
   sum(K(500)) - 1 < 1e-9 && K(-20).join(',') === '0,0,0,0,1,0,0,0,0');

// ---- how a shortcut reads ----
var F = D.formatShortcut;
ok('a letter key loses its Key prefix', F('Shift+KeyC') === '\u21E7C');
ok('bracket codes become brackets', F('Shift+BracketLeft') === '\u21E7[');
ok('digits lose their Digit prefix', F('Shift+Digit0') === '\u21E70');
ok('arrows become arrows', F('Shift+ArrowUp') === '\u21E7\u2191');
ok('punctuation codes become punctuation', F('Shift+Period') === '\u21E7.');
ok('modifiers use Apple order, not press order',
   F('Meta+Shift+Alt+Ctrl+KeyK') === '\u2303\u2325\u21E7\u2318K', F('Meta+Shift+Alt+Ctrl+KeyK'));
ok('a bare key needs no modifier', F('KeyJ') === 'J');
ok('an unset shortcut formats to nothing', F('') === '' && F(null) === '');
ok('an unknown code is shown as-is', F('Shift+MediaPlayPause') === '\u21E7MediaPlayPause');

// ---- what may leave the device ----
var withKey = D.merge(base, { summary: { apiKey: 'sk-ant-secret' }, audio: { boost: 3 } });

ok('the API key is stripped before sync', D.forSync(withKey).summary.apiKey === '');
ok('everything else still syncs', D.forSync(withKey).audio.boost === 3);
ok('forSync does not mutate the settings it was handed', withKey.summary.apiKey === 'sk-ant-secret');
ok('the focus password hash does sync on purpose',
   D.forSync(D.merge(base, { focus: { passwordHash: 'abc$def' } })).focus.passwordHash === 'abc$def');

var incoming = D.forSync(withKey);
ok('a synced copy carries no key', incoming.summary.apiKey === '');
ok('pulling keeps the key this device already had',
   D.fromSync(incoming, withKey).summary.apiKey === 'sk-ant-secret');
ok('pulling still takes everything else from the cloud',
   D.fromSync(D.merge(incoming, { audio: { boost: 7 } }), withKey).audio.boost === 7);
ok('pulling onto a device with no key leaves it empty',
   D.fromSync(incoming, base).summary.apiKey === '');

// ---- profiles are reversible ----
var mine = D.merge(base, { playback: { defaultSpeed: 1.25 }, declutter: { shorts: 'show' }, audio: { boost: 3 } });

var onStudy = D.applyProfile(mine, 'study');
ok('a profile still applies its own values', onStudy.playback.defaultSpeed === 1.5 && onStudy.profile === 'study');
ok('a profile records what it displaced', onStudy.profileUndo.playback.defaultSpeed === 1.25);
ok('it records only what it touches', onStudy.profileUndo.audio === undefined);

var back = D.applyProfile(onStudy, 'default');
ok('deselecting restores the value the profile overwrote', back.playback.defaultSpeed === 1.25,
   'got ' + back.playback.defaultSpeed);
ok('deselecting restores every displaced key', back.declutter.shorts === 'show');
ok('deselecting leaves untouched settings alone', back.audio.boost === 3);
ok('deselecting clears the profile name and the undo', back.profile === 'default' && back.profileUndo === null);

// switching profiles should still lead home, not to the previous profile
var onMusic = D.applyProfile(onStudy, 'music');
var home = D.applyProfile(onMusic, 'default');
ok('switching profiles then deselecting returns to what you started with',
   home.playback.defaultSpeed === 1.25 && home.declutter.shorts === 'show',
   'speed ' + home.playback.defaultSpeed + ', shorts ' + home.declutter.shorts);

ok('settings saved before this existed just lose the label',
   D.applyProfile(D.merge(base, { profile: 'study' }), 'default').profile === 'default');
ok('applying a profile does not mutate its input', mine.playback.defaultSpeed === 1.25);
ok('revertProfile is reachable on its own', typeof D.revertProfile === 'function');

// ---- A-B loop ----
var L = D.loopTarget;
var LOOP = { enabled: true, start: 10, end: 20, videoId: 'abc' };

ok('loop seeks back to A once past B', L(LOOP, 'abc', 20.5) === 10);
ok('loop seeks back to A when you scrub before it', L(LOOP, 'abc', 3) === 10);
ok('loop leaves playback alone inside the range', L(LOOP, 'abc', 15) === null);
ok('a small scrub back inside A is tolerated', L(LOOP, 'abc', 9.7) === null);

// the bug this was written for: a loop set on one video followed you to the next
ok('a loop set on another video does not apply here', L(LOOP, 'different', 25) === null);
ok('a loop with no recorded video still applies',
   L({ enabled: true, start: 10, end: 20, videoId: '' }, 'abc', 25) === 10);

// marking B before A used to leave end < start, which fired forever
ok('B marked before A still loops, not freezes',
   L({ enabled: true, start: 20, end: 10, videoId: 'abc' }, 'abc', 25) === 10);

// A and B on the same frame is a zero-length loop
ok('a zero-length loop is ignored',
   L({ enabled: true, start: 12, end: 12, videoId: 'abc' }, 'abc', 30) === null);

ok('a disabled loop is ignored', L({ enabled: false, start: 10, end: 20, videoId: 'abc' }, 'abc', 30) === null);
ok('a half-set loop is ignored', L({ enabled: true, start: 10, end: null, videoId: 'abc' }, 'abc', 30) === null);
ok('loop defaults carry a videoId field', base.playback.loop.videoId === '');

// ---- profiles ----
var study = D.applyProfile(base, 'study');
ok('study profile sets its own keys', study.playback.defaultSpeed === 1.5 && study.declutter.shorts === 'hide');
ok('study profile records its name', study.profile === 'study');
ok('study profile leaves untouched keys alone', study.audio.boost === 1);
ok('unknown profile falls back to default', D.applyProfile(base, 'nope').profile === 'default');
ok('applying a profile does not mutate the source', base.playback.defaultSpeed === 1);

// ---- declutter CSS ----
ok('defaults produce no hiding CSS', C.buildDeclutterCss(base) === '', JSON.stringify(C.buildDeclutterCss(base)));

var hidden = D.merge(base, { declutter: { shorts: 'hide', watch: { comments: true } } });
var css = C.buildDeclutterCss(hidden);
ok('hiding comments emits its selector', css.indexOf('ytd-comments#comments') !== -1);
ok('hiding shorts emits its selector', css.indexOf('ytd-reel-shelf-renderer') !== -1);
ok('hiding uses display:none !important', css.indexOf('display: none !important') !== -1);

var shortsCss = C.buildDeclutterCss(D.merge(base, { declutter: { shorts: 'hide' } }));
ok('hiding shorts also hides the way in', shortsCss.indexOf('ytm-pivot-bar-item-renderer') !== -1);
ok('hiding shorts covers the newer lockup tags', shortsCss.indexOf('shorts-lockup-view-model-v2') !== -1);

ok('shorts:asVideo does not hide shorts',
   C.buildDeclutterCss(D.merge(base, { declutter: { shorts: 'asVideo' } })).indexOf('ytd-reel-shelf-renderer') === -1);

var blur = C.buildDeclutterCss(D.merge(base, { declutter: { thumbnails: 'blur' } }));
ok('blurred thumbnails blur', blur.indexOf('blur(14px)') !== -1);
ok('blurred thumbnails clear on hover', blur.indexOf(':hover') !== -1);
ok('grayscale thumbnails do not blur',
   C.buildDeclutterCss(D.merge(base, { declutter: { thumbnails: 'grayscale' } })).indexOf('blur(') === -1);

// ---- layout CSS ----
ok('defaults produce no layout CSS', C.buildLayoutCss(base) === '');
var cinema = C.buildLayoutCss(D.merge(base, { layout: { cinema: true, cinemaDim: 70 } }));
ok('cinema dim 70% becomes opacity 0.30', cinema.indexOf('opacity: 0.30') !== -1, cinema.slice(0, 160));
ok('cinema is gated behind the html attribute', cinema.indexOf('html[costum-cinema]') !== -1);
var maxDim = C.buildLayoutCss(D.merge(base, { layout: { cinema: true, cinemaDim: 200 } }));
ok('an out-of-range dim is clamped, never negative opacity', maxDim.indexOf('-') === -1 || maxDim.indexOf('opacity: -') === -1);

// ---- the regex guard contentblock relies on ----
function compileGuard(pattern) { try { return new RegExp(pattern, 'i'); } catch (e) { return null; } }
ok('a valid block regex compiles', compileGuard('(clickbait|shocking)') !== null);
ok('a broken block regex is dropped, not thrown', compileGuard('(unclosed') === null);

// ---- page-scoped declutter ----
ok('every declutter group has a matching settings group',
   Object.keys(C.DECLUTTER).every(function (g) { return base.declutter[g] !== undefined; }),
   Object.keys(C.DECLUTTER).filter(function (g) { return base.declutter[g] === undefined; }).join(','));

ok('every selector key has a matching default',
   Object.keys(C.DECLUTTER).every(function (g) {
     return Object.keys(C.DECLUTTER[g]).every(function (k) { return base.declutter[g][k] !== undefined; });
   }));

var missing = [];
Object.keys(C.DECLUTTER).forEach(function (g) {
  Object.keys(base.declutter[g]).forEach(function (k) {
    var selectors = C.DECLUTTER[g][k];
    var styleOnly = (C.STYLE_ONLY[g] || []).indexOf(k) !== -1;
    if (styleOnly) return;
    if (!Array.isArray(selectors) || selectors.length === 0) missing.push(g + '.' + k);
  });
});
ok('every setting has a rule behind it — selectors, or a declared style rule',
   missing.length === 0, missing.join(', '));

/* Probed on live youtube.com: the consent wall renders as a direct child of
   ytd-app, so the wrapped `ytd-popup-container tp-yt-paper-dialog:has(...)`
   form matched nothing and the switch hid no consent dialog at all. Keeping
   the bare tag pinned is the difference between a switch that works and one
   that only looks like it does. */
/* Probed live: the related column is yt-lockup-view-model now, with not one id
   inside it, and 26 cards on a watch page matched none of the id-based card
   selectors — all nine "Video cards" switches did nothing there. Search still
   draws the old ytd-video-renderer with its ids. Every card part has to know
   both shapes until the migration finishes. */
['title', 'channelAvatar', 'channelName', 'meta', 'duration', 'menu'].forEach(function (part) {
  var sels = C.DECLUTTER.cards[part].join(' ');
  ok('cards.' + part + ' reaches the new lockup card',
     sels.indexOf('yt-lockup-view-model') !== -1, sels);
  ok('cards.' + part + ' still reaches the old renderer',
     C.DECLUTTER.cards[part].some(function (s) { return s.indexOf('yt-lockup-view-model') === -1; }), sels);
});

ok('hiding popups reaches the consent wall by its own tag',
   C.DECLUTTER.global.popups.indexOf('ytd-consent-bump-v2-lightbox') !== -1,
   C.DECLUTTER.global.popups.join(', '));

ok('no setting claims to be style-only without a style rule to show for it',
   Object.keys(C.STYLE_ONLY).every(function (g) {
     return C.STYLE_ONLY[g].every(function (k) {
       return base.declutter[g] ? base.declutter[g][k] !== undefined : base[g][k] !== undefined;
     });
   }));

var logoCss = C.buildLayoutCss(D.merge(base, { declutter: { header: { logoWord: true } } }));
ok('the wordmark switch clips the logo rather than hiding it', logoCss.indexOf('overflow: hidden') !== -1);
var linkCss = C.buildLayoutCss(D.merge(base, { declutter: { header: { logoLink: true } } }));
ok('disabling the logo link kills pointer events', linkCss.indexOf('pointer-events: none') !== -1);

ok('the search suggestion rule targets the element that exists today',
   C.DECLUTTER.search.suggestions.indexOf('.ytSearchboxComponentSuggestionsContainer') !== -1);
ok('no rule still points at the retired ytd-searchbox',
   JSON.stringify(C.DECLUTTER).indexOf('ytd-searchbox') === -1);

var watchOnly = C.buildDeclutterCss(D.merge(base, { declutter: { watch: { playNext: true } } }));
ok('a watch-page switch emits only its own rule', watchOnly.indexOf('.ytp-next-button') !== -1 && watchOnly.split('display: none').length === 2);

var chanCss = C.buildDeclutterCss(D.merge(base, { declutter: { channel: { community: true } } }));
// YouTube renamed this tab from Community to Posts, so the rule carries both,
// and at least one non-Latin title since tab-title follows the interface language.
ok('the posts tab is matched under its current name', chanCss.indexOf('tab-title="Posts"') !== -1, chanCss);
ok('the old Community name is kept as a fallback', chanCss.indexOf('tab-title="Community"') !== -1);
ok('channel tabs are matched in more than one language',
   /tab-title="[^"\x00-\x7F][^"]*"/.test(chanCss), chanCss);

ok('the channel header uses the element that exists today',
   C.DECLUTTER.channel.avatar.join(' ').indexOf('yt-page-header-renderer') !== -1);
ok('nothing still points at the retired c4 tabbed header',
   JSON.stringify(C.DECLUTTER).indexOf('ytd-c4-tabbed-header-renderer') === -1);

ok('the watch page reports the watch group', C.currentPages('/watch?v=x').indexOf('watch') !== -1);
ok('the watch page does not report home', C.currentPages('/watch?v=x').indexOf('home') === -1);
ok('the home path reports home', C.currentPages('/').indexOf('home') !== -1);
ok('a handle URL reports channel', C.currentPages('/@someone').indexOf('channel') !== -1);
ok('search results report search', C.currentPages('/results?search_query=x').indexOf('search') !== -1);
ok('global applies on every page', C.currentPages('/anything').indexOf('global') !== -1);

// ---- the newer switches ----
var rec = D.applyProfile(base, 'recommended');
ok('the recommended profile hides Shorts and stops the endless feed',
   rec.declutter.shorts === 'hide' && rec.declutter.global.infiniteScroll === true);
ok('the recommended profile leaves playback alone', rec.playback.defaultSpeed === 1);

ok('scrolling between Shorts is allowed by default', base.declutter.shortsScroll === true);
var lock = C.buildLayoutCss(D.merge(base, { declutter: { shortsScroll: false } }));
ok('locking the Shorts scroll emits touch-action none', lock.indexOf('touch-action: none') !== -1);
ok('leaving it on emits nothing', C.buildLayoutCss(base).indexOf('touch-action') === -1);

var nativeCss = C.buildLayoutCss(D.merge(base, { playback: { nativePlayer: true } }));
ok('the native player hides YouTube own video element', nativeCss.indexOf('html[costum-native]') !== -1);
ok('it emits nothing while switched off', C.buildLayoutCss(base).indexOf('costum-native') === -1);

ok('ad skipping is off out of the box', base.playback.skipAds === false);
ok('the native player is off out of the box', base.playback.nativePlayer === false);
ok('no session limit out of the box', base.focus.sessionMinutes === 0);
ok('no standing block out of the box', base.focus.blockUntil === 0);

// ---- Shorts containment: the rules that decide what gets hidden ----
// A tiny stand-in DOM. cardFor only ever reads tagName, parentElement and
// querySelector, so this is enough to pin the behaviour that once blanked
// an entire search results page.
function node(tag, opts) {
  opts = opts || {};
  return {
    tagName: tag.toUpperCase(),
    parentElement: null,
    _watchLinks: opts.watchLinks || 0,
    querySelector: function (sel) {
      return sel.indexOf('/watch') !== -1 && this._watchLinks > 0 ? {} : null;
    }
  };
}
function chain(nodes) {
  for (var i = 0; i < nodes.length - 1; i++) nodes[i].parentElement = nodes[i + 1];
  return nodes[0];
}

scope.Costum = { register: function () {}, modules: [] };
new Function('self', read(ROOT + 'content/modules/shorts.js'))(scope);
var S = scope.CostumShortsInternals;

var link = node('a');
var card = node('ytd-rich-item-renderer');
var list = node('ytm-item-section-renderer', { watchLinks: 3 });
chain([link, card, list]);
ok('the shorts card is what gets hidden, not the list around it',
   S.cardFor(link) === card, S.cardFor(link).tagName);

var loneLink = node('a');
var bar = node('ytm-pivot-bar-renderer');
chain([loneLink, bar]);
ok('a nav link with no card of its own falls back to itself',
   S.cardFor(loneLink) === loneLink);

var link2 = node('a');
var wrapper = node('some-wrapper-renderer', { watchLinks: 5 });
chain([link2, wrapper]);
ok('an ancestor holding other videos is never chosen, whatever it is called',
   S.cardFor(link2) === link2, S.cardFor(link2).tagName);

ok('a container holding /watch links reports as a list', S.holdsOtherVideos(list) === true);
ok('a lone card does not', S.holdsOtherVideos(card) === false);

// ---- the library page ----
ok('the You page reports the library group', C.currentPages('/feed/you').indexOf('library') !== -1);
ok('history counts as library too', C.currentPages('/feed/history').indexOf('library') !== -1);
ok('the watch page is not library', C.currentPages('/watch?v=x').indexOf('library') === -1);

var lib = C.buildDeclutterCss(D.merge(base, { declutter: { library: { watchLater: true, likedVideos: true } } }));
ok('watch-later is matched by its playlist id, not its heading text', lib.indexOf('list=WL') !== -1);
ok('liked videos likewise', lib.indexOf('list=LL') !== -1);
ok('library rules are scoped to the library page',
   lib.split('\n').filter(function (l) { return l.indexOf('ytd-item-section-renderer') !== -1; })
      .every(function (l) { return l.indexOf('page-subtype="library"') !== -1; }));

// ---- home grid density ----
ok('the home grid is left alone by default',
   base.layout.homeColumns === 0 && base.layout.homeRows === 0);
ok('setting columns drives YouTube own grid variable',
   C.buildLayoutCss(D.merge(base, { layout: { homeColumns: 3 } })).indexOf('--ytd-rich-grid-items-per-row: 3') !== -1);
ok('leaving columns at default emits no grid CSS',
   C.buildLayoutCss(base).indexOf('items-per-row') === -1);
ok('row count is not a CSS rule — it needs measurement',
   C.buildLayoutCss(D.merge(base, { layout: { homeRows: 2 } })).indexOf('homeRows') === -1);

var newsCss = C.buildDeclutterCss(D.merge(base, { declutter: { home: { news: true } } }));
ok('the news shelves rule targets feed sections', newsCss.indexOf('ytd-rich-section-renderer') !== -1);
var bannerCss = C.buildDeclutterCss(D.merge(base, { declutter: { home: { banners: true } } }));
ok('the banners rule covers surveys and promos',
   bannerCss.indexOf('ytd-statement-banner-renderer') !== -1 && bannerCss.indexOf('survey') !== -1);

// ---- the Shorts player and the font ----
ok('the shorts player is its own page group', C.currentPages('/shorts/abc').indexOf('shortsPlayer') !== -1);
ok('it does not apply on the watch page', C.currentPages('/watch?v=x').indexOf('shortsPlayer') === -1);

var shortsOverlay = C.buildDeclutterCss(D.merge(base, { declutter: { shortsPlayer: { overlay: true } } }));
ok('the overlay rule targets the reel overlay', shortsOverlay.indexOf('ytd-reel-player-overlay-renderer') !== -1);

// The desktop Shorts player carries ytp-hide-controls: those buttons are never
// rendered, so shipping switches for them would ship switches that do nothing.
ok('no shorts rule pretends the ytp player controls exist there',
   JSON.stringify(C.DECLUTTER.shortsPlayer).indexOf('.ytp-') === -1);

ok('no font is forced by default', base.declutter.font === '');
ok('choosing a font restyles the whole app',
   C.buildLayoutCss(D.merge(base, { declutter: { font: 'Georgia, serif' } })).indexOf('font-family: Georgia') !== -1);
ok('leaving the font alone emits nothing', C.buildLayoutCss(base).indexOf('font-family') === -1);

// ---- the redirect Safari cannot do at the network layer ----
/* Safari implements static rulesets but not updateDynamicRules, so the home
   redirect must also exist as a content-script path or it silently does
   nothing on the extension's main platform. */
var declutterSource = read(ROOT + 'content/modules/declutter.js');
ok('the home redirect has a content-script path, not only a network rule',
   declutterSource.indexOf('homeRedirectPath') !== -1 && declutterSource.indexOf('location.replace') !== -1,
   'declutter.js no longer performs the redirect itself');
ok('both paths agree on what the destination is, via one helper',
   typeof D.homeRedirectPath === 'function');

// ---- one switch for one task ----
ok('zen is off out of the box', base.layout.zen === false);
var zen = C.buildLayoutCss(D.merge(base, { layout: { zen: true } }));
ok('zen hides the header', zen.indexOf('#masthead-container') !== -1);
ok('zen hides the related column', zen.indexOf('#secondary') !== -1);
ok('zen hides everything under the player', zen.indexOf('#below') !== -1);
ok('zen is gated behind the attribute, so it never applies off a watch page',
   zen.split('\n').filter(function (l) { return l.indexOf('display: none') !== -1; })
      .every(function (l) { return l.indexOf('costum-zen') !== -1 || l.trim().indexOf('html[costum-zen]') === 0; })
   || zen.indexOf('html[costum-zen]') !== -1);
ok('leaving zen off emits none of it', C.buildLayoutCss(base).indexOf('costum-zen') === -1);

// ---- the unread count in the tab title ----
scope.Costum = { register: function () {}, modules: [] };
new Function('self', read(ROOT + 'content/modules/tabtitle.js'))(scope);
var T = scope.CostumTitleInternals;
ok('a count is stripped', T.stripCount('(3) Video — YouTube') === 'Video — YouTube');
ok('a double-digit count too', T.stripCount('(12) Video') === 'Video');
ok('a title without one is untouched', T.stripCount('Video — YouTube') === 'Video — YouTube');
ok('a bracket that is not a count survives',
   T.stripCount('(Official Video) Song') === '(Official Video) Song');
ok('a count in the middle is left alone', T.stripCount('Song (3) live') === 'Song (3) live');
ok('nothing in, nothing out', T.stripCount('') === '' && T.stripCount(null) === '');
ok('stripping twice changes nothing',
   T.stripCount(T.stripCount('(3) Video')) === 'Video');

// ---- undoing a whole-group flip ----
/* Applying a profile has always been undoable; flipping a group of thirty-three
   switches was not, though it displaces far more. Both use the same pair:
   pluck what is about to be overwritten, merge it back to restore. */
var groupPaths = ['declutter.sidebar.home', 'declutter.sidebar.shortsButton', 'declutter.sidebar.history'];
var handSet = D.merge(base, { declutter: { sidebar: { shortsButton: true } } });
var displaced = D.pluck(handSet, groupPaths);

ok('what gets kept is only the paths the flip will touch',
   Object.keys(displaced).length === 1 && Object.keys(displaced.declutter.sidebar).length === 3);
ok('and it holds the values as they were',
   displaced.declutter.sidebar.shortsButton === true &&
   displaced.declutter.sidebar.home === false);

var flipped = handSet;
groupPaths.forEach(function (path) {
  flipped = D.merge(flipped, path.split('.').reverse().reduce(function (acc, k) {
    var step = {}; step[k] = acc; return step;
  }, true));
});
ok('the flip turns the whole group on',
   groupPaths.every(function (p) { return p.split('.').reduce(function (o, k) { return o[k]; }, flipped) === true; }));

var undone = D.merge(flipped, displaced);
ok('undo restores exactly what was there, not the defaults',
   undone.declutter.sidebar.shortsButton === true &&
   undone.declutter.sidebar.home === false &&
   undone.declutter.sidebar.history === false);
ok('undo leaves settings outside the group alone',
   undone.playback.defaultSpeed === base.playback.defaultSpeed);

// ---- grid layout, driven through YouTube's own custom properties ----
ok('the grid is untouched by default',
   base.layout.feedWidth === 0 && base.layout.cardMinWidth === 0 &&
   base.layout.rowGap === 0 && base.layout.relatedLimit === 0);
ok('nothing about the grid is emitted at defaults',
   C.buildLayoutCss(base).indexOf('--ytd-rich-grid') === -1);

var wide = C.buildLayoutCss(D.merge(base, { layout: { feedWidth: 1200 } }));
ok('a width cap sets YouTube own max-width variable',
   wide.indexOf('--ytd-rich-grid-content-max-width: 1200px') !== -1, wide);
var big = C.buildLayoutCss(D.merge(base, { layout: { cardMinWidth: 400 } }));
ok('a card floor sets the min-width variable',
   big.indexOf('--ytd-rich-grid-item-min-width: 400px') !== -1);
var airy = C.buildLayoutCss(D.merge(base, { layout: { rowGap: 48 } }));
ok('row spacing sets the row margin variable',
   airy.indexOf('--ytd-rich-grid-row-margin: 48px') !== -1);
ok('three settings at once share one rule block',
   C.buildLayoutCss(D.merge(base, { layout: { feedWidth: 1200, cardMinWidth: 400, rowGap: 48 } }))
     .split('ytd-rich-grid-renderer {').length === 2);

// ---- the floating button has to clear YouTube own navigation ----
scope.Costum = { register: function () {}, modules: [] };
scope.CostumCss = C;
new Function('self', read(ROOT + 'content/panel.js'))(scope);
var Panel = scope.CostumPanelInternals;

ok('a collapsed rail against the left edge is space to avoid',
   Panel.railWidth({ width: 72, left: 0, right: 72 }) === 72);
ok('an open drawer is wider, and still counted',
   Panel.railWidth({ width: 240, left: 0, right: 240 }) === 240);
ok('a drawer slid off-screen is not counted',
   Panel.railWidth({ width: 240, left: -240, right: 0 }) === 0);
ok('a drawer floating away from the edge is not counted',
   Panel.railWidth({ width: 240, left: 300, right: 540 }) === 0);
ok('no rail at all means no offset', Panel.railWidth(null) === 0);
ok('a zero-width rail means no offset', Panel.railWidth({ width: 0, left: 0, right: 0 }) === 0);

// ---- the custom stylesheet ----
ok('no custom CSS by default', base.declutter.customCss === '');
var custom = C.buildLayoutCss(D.merge(base, { declutter: { customCss: 'ytd-app { opacity: .5 }' } }));
ok('custom CSS is emitted', custom.indexOf('ytd-app { opacity: .5 }') !== -1);
ok('and emitted last, so it wins over the switches',
   custom.trim().endsWith('ytd-app { opacity: .5 }'), custom.slice(-90));
ok('whitespace alone emits nothing',
   C.buildLayoutCss(D.merge(base, { declutter: { customCss: '   \n  ' } })).indexOf('/* custom */') === -1);

// ---- ad handling ----
var adRules = JSON.parse(read(ROOT + 'rules/ads.json'));
ok('the ad ruleset parses and is not empty', Array.isArray(adRules) && adRules.length > 0);
ok('every ad rule blocks rather than redirects',
   adRules.every(function (r) { return r.action.type === 'block'; }));
ok('rule ids are unique',
   new Set(adRules.map(function (r) { return r.id; })).size === adRules.length);

/* The one rule that must never exist: /youtubei/ carries the player response.
   Blocking it stops ads and the video with them. */
ok('nothing blocks the playback endpoint',
   adRules.every(function (r) { return r.condition.urlFilter.indexOf('youtubei') === -1; }),
   JSON.stringify(adRules.map(function (r) { return r.condition.urlFilter; })));
ok('no rule blocks a document or media request',
   adRules.every(function (r) {
     return (r.condition.resourceTypes || []).every(function (t) {
       return t !== 'main_frame' && t !== 'media';
     });
   }));

ok('ad request blocking is off out of the box', base.playback.blockAdRequests === false);
ok('ad skipping is off out of the box', base.playback.skipAds === false);

// ---- muting an ad has to be undone ----
scope.Costum = { register: function () {}, modules: [] };
new Function('self', read(ROOT + 'content/modules/ads.js'))(scope);
var Ads = scope.CostumAdsInternals;

var fakeVideo = { muted: false, playbackRate: 1.25 };
Ads.takeOver(fakeVideo);
ok('an ad is muted and run at speed', fakeVideo.muted === true && fakeVideo.playbackRate === 16);
Ads.takeOver(fakeVideo);   // a second ad in the same break must not overwrite what we held
Ads.handBack(fakeVideo);
ok('the viewer gets their own sound back', fakeVideo.muted === false);
ok('and their own playback rate, not 1x',
   fakeVideo.playbackRate === 1.25, String(fakeVideo.playbackRate));
Ads.handBack(fakeVideo);
ok('handing back twice changes nothing', fakeVideo.muted === false && fakeVideo.playbackRate === 1.25);

var alreadyMuted = { muted: true, playbackRate: 1 };
Ads.takeOver(alreadyMuted);
Ads.handBack(alreadyMuted);
ok('someone who was already muted stays muted', alreadyMuted.muted === true);

// ---- selectors that a live check has already disproved once ----
var all = JSON.stringify(C.DECLUTTER);
ok('nothing points at the retired ytd-searchbox', all.indexOf('ytd-searchbox') === -1);
ok('the search sidebar is scoped to ytd-search, not ytd-browse',
   C.DECLUTTER.search.rightSidebar.join(' ').indexOf('ytd-browse') === -1);
ok('related videos are matched by their current element',
   all.indexOf('yt-lockup-view-model') !== -1);
ok('comment timestamps use the id, not the class',
   C.DECLUTTER.watch.commentTime.join(' ').indexOf('#published-time-text') !== -1);
ok('the sidebar Shorts entry is matched by title, since it has no href',
   C.DECLUTTER.sidebar.shortsButton.join(' ').indexOf('a[title="Shorts"]') !== -1);
// The CSS table was not the last place naming it: the shortcut module's guard
// against firing while someone types still asked for the retired element too.
ok('the typing guard names the current search box element',
   /closest\('#search, yt-searchbox,/.test(read(ROOT + 'content/modules/shortcuts.js')));

// ---- a page group must not reach off its own page ----
/* The Search tab's rules were written with bare element names, so "hide
   shelves" also emptied the channel page and the watch page's "more from
   channel", "hide playlists" took the home feed's playlists and mixes with it,
   and "hide chips" hid the home chip bar — an element that never appears on a
   results page at all. Checked live: everything search renders, it renders
   inside ytd-search. */
var HEADER_SCOPED = ['suggestions', 'previousSearches'];   // the header dropdown, which is not inside ytd-search
Object.keys(C.DECLUTTER.search).forEach(function (key) {
  if (HEADER_SCOPED.indexOf(key) !== -1) return;
  C.DECLUTTER.search[key].forEach(function (sel) {
    ok('search.' + key + ' stays on the results page',
       // ytm-search is the same page on m.youtube.com, checked live.
       sel.indexOf('ytd-search') === 0 || sel.indexOf('ytm-search ') === 0
       || sel.indexOf('ytd-two-column-search-results-renderer') === 0, sel);
  });
});
ok('the home chip bar is named by the home group and only reached there',
   C.DECLUTTER.home.chips.join(' ').indexOf('ytd-feed-filter-chip-bar-renderer') !== -1
   && C.DECLUTTER.search.chips.join(' ').indexOf('ytd-search ytd-feed-filter-chip-bar-renderer') !== -1);
ok('the channel page keeps its own claim on ytd-shelf-renderer',
   C.DECLUTTER.channel.shelves.join(' ').indexOf('page-subtype="channels"') !== -1);

// ---- "hide watched" must not hide barely-started videos ----
var watched = C.buildDeclutterCss(D.merge(base, { block: { hideWatched: true } }));
ok('a nearly finished video counts as watched', watched.indexOf('width: 95') !== -1);
ok('a finished video counts as watched', watched.indexOf('width: 100') !== -1);
// the bug: [style*="width: 9"] matches "width: 90%" .. "width: 99%" — and "width: 9%"
ok('a video watched nine per cent does not count as watched',
   watched.indexOf('width: 9"') === -1, watched.slice(0, 120));
ok('nothing is emitted while hide-watched is off',
   C.buildDeclutterCss(base).indexOf('#progress') === -1);

// ---- the mini player switch had no stylesheet behind it ----
var mini = C.buildLayoutCss(D.merge(base, { layout: { miniOnScroll: true } }));
ok('turning it on emits rules that read the attribute layout.js sets',
   mini.indexOf('costum-mini') !== -1);
ok('the pinned player leaves the flow', /position: fixed/.test(mini));
ok('the column it left is held open, or pinning would scroll the page and un-pin it',
   mini.indexOf('--costum-mini-hold') !== -1);
ok('leaving it off emits nothing', C.buildLayoutCss(base).indexOf('costum-mini') === -1);

/* Every attribute a module puts on <html> has to be read by a stylesheet, or
   the feature behind it is a switch wired to nothing. This is the check that
   turned the mini player up: layout.js had been setting costum-mini since the
   beginning and no rule had ever mentioned it. */
var everythingOn = D.merge(base, {
  layout: { cinema: true, miniOnScroll: true },
  playback: { nativePlayer: true }
});
var allCss = C.buildLayoutCss(everythingOn) + C.buildDeclutterCss(everythingOn) + C.buildModestyCss(everythingOn);
['costum-cinema', 'costum-mini', 'costum-native'].forEach(function (attr) {
  ok(attr + ' is read by a stylesheet, not only set by a module', allCss.indexOf(attr) !== -1);
});

// ---- the home redirect, as a network rule ----
var R = function (target) { return D.homeRedirectRule(D.merge(base, { declutter: { redirectHome: target } })); };
var P = function (target) { return D.homeRedirectPath(D.merge(base, { declutter: { redirectHome: target } })); };

ok('no redirect configured means no rule', R('') === null);
ok('a bare path is read as an absolute one', P('feed/subscriptions') === '/feed/subscriptions');
ok('surrounding space is not part of the path', P('  /feed/subscriptions  ') === '/feed/subscriptions');
// redirecting the home page to the home page is a loop the browser breaks by
// giving up on the navigation
ok('redirecting home to home is not a rule', R('/') === null && P('/') === '');

// the bug this section was written for: '||youtube.com/' matches every path on
// the site, so switching the redirect on sent every watch page, every search
// and every channel to the target too
var homeRule = R('/feed/subscriptions');
ok('the filter is anchored to the site root, not to the whole domain',
   homeRule.condition.urlFilter === '||youtube.com/|', homeRule.condition.urlFilter);
ok('the filter ends where a path would begin',
   homeRule.condition.urlFilter.charAt(homeRule.condition.urlFilter.length - 1) === '|');
ok('only top-level navigations are redirected',
   homeRule.condition.resourceTypes.join(',') === 'main_frame');
ok('the redirect keeps the host, so m.youtube.com stays where it is',
   homeRule.action.redirect.transform.path === '/feed/subscriptions'
   && homeRule.action.redirect.url === undefined);
ok('a query in the target is split out rather than smuggled into the path',
   R('/results?search_query=lofi').action.redirect.transform.path === '/results'
   && R('/results?search_query=lofi').action.redirect.transform.query === '?search_query=lofi');
ok('the rule carries the id the background removes before adding',
   homeRule.id === D.HOME_RULE_ID);

// ---- the focus gates have to ring on their own ----
// apply() runs on load and on a settings change and nothing else, so anything
// that becomes true with time needs its own wake-up. nextGateAt says when.
new Function('self', read(ROOT + 'content/modules/focus.js'))(scope);
var G = scope.CostumFocusInternals;
var NOON = new Date(2026, 0, 15, 12, 0, 0).getTime();
var focusOf = function (patch) { return D.merge(base, { focus: patch }).focus; };

ok('a time of day parses to minutes', G.minutes('09:30') === 570 && G.minutes('00:00') === 0);
ok('nothing pending means no wake-up', G.nextGateAt(base.focus, NOON) === 0);

// the bug: a fifteen-minute session ran until the next navigation, which on a
// thirty-minute video is never
ok('a running session schedules its own end',
   G.nextGateAt(focusOf({ sessionMinutes: 15, sessionEndsAt: NOON + 900000 }), NOON) === NOON + 900000);
ok('a session already over needs no further wake-up',
   G.nextGateAt(focusOf({ sessionMinutes: 15, sessionEndsAt: NOON - 1000 }), NOON) === 0);
ok('a session length with no session running schedules nothing',
   G.nextGateAt(focusOf({ sessionMinutes: 15 }), NOON) === 0);

ok('a standing block schedules the moment it lifts',
   G.nextGateAt(focusOf({ blockUntil: NOON + 60000 }), NOON) === NOON + 60000);
ok('an expired block schedules nothing', G.nextGateAt(focusOf({ blockUntil: NOON - 1 }), NOON) === 0);

var window9to5 = focusOf({ scheduleEnabled: true, scheduleFrom: '09:00', scheduleTo: '17:00' });
ok('a schedule wakes at its next edge',
   G.nextGateAt(window9to5, NOON) === new Date(2026, 0, 15, 17, 0, 0).getTime());
ok('past both edges, the next one is tomorrow morning',
   G.nextGateAt(window9to5, new Date(2026, 0, 15, 20, 0, 0).getTime())
     === new Date(2026, 0, 16, 9, 0, 0).getTime());
ok('a schedule that is switched off wakes nothing',
   G.nextGateAt(focusOf({ scheduleFrom: '09:00', scheduleTo: '17:00' }), NOON) === 0);
ok('the soonest of several marks is the one taken',
   G.nextGateAt(focusOf({ scheduleEnabled: true, scheduleFrom: '09:00', scheduleTo: '17:00',
                          sessionMinutes: 15, sessionEndsAt: NOON + 60000 }), NOON) === NOON + 60000);

// ---- the manifest has to satisfy two browsers with opposite requirements ----
var manifest = JSON.parse(read(ROOT + 'manifest.json'));
ok('the shipped manifest keeps a background page for Safari',
   Array.isArray(manifest.background.scripts) && manifest.background.scripts.length > 0);
ok('the shipped manifest keeps a service worker for Chrome',
   typeof manifest.background.service_worker === 'string');
ok('the service worker is one of the background scripts, so both paths run the same code',
   manifest.background.scripts.indexOf(manifest.background.service_worker) !== -1,
   manifest.background.service_worker + ' vs ' + manifest.background.scripts.join(','));
ok('the persistent key is gone — Safari warns about it',
   manifest.background.persistent === undefined);
ok('the page bridge is web accessible, or Chrome will not inject it',
   manifest.web_accessible_resources[0].resources.indexOf('content/page/bridge.js') !== -1);

// ---- the settings file: an envelope that can be refused, migrated and previewed ----
var exported = D.packageExport(withKey, '1.0.0');
ok('an export names its format and version', exported.format === 'costum-settings' && exported.version === D.EXPORT_VERSION);
ok('an export carries no API key', exported.settings.summary.apiKey === '' && exported.settings.audio.boost === 3);
ok('a valid export is accepted whole', D.validateImport(exported).ok === true);
ok('an unrelated JSON file is refused', D.validateImport({ hello: 'world' }).error === 'not-costum'
   && D.validateImport(null).error === 'not-costum' && D.validateImport([1, 2]).error === 'not-costum');
ok('a file from a newer Costum is refused, not half-read',
   D.validateImport(D.merge(exported, { version: D.EXPORT_VERSION + 1 })).error === 'newer-version');
var legacy = D.validateImport(D.forSync(withKey));
ok('the old bare-settings export still imports', legacy.ok && legacy.version === 1 && legacy.settings.audio.boost === 3);
var corrupt = D.validateImport(D.merge(exported, { settings: { audio: { boost: 'loud' } } }));
ok('one value of the wrong type refuses the whole file', corrupt.ok === false && corrupt.error === 'invalid-value' && corrupt.path === 'audio.boost');
ok('a group that is not a group is refused', D.validateImport(D.merge(exported, { settings: { picture: 7 } })).error === 'invalid-value');
var extra = D.validateImport(D.merge(exported, { settings: { futureThing: true, playback: { futureSpeed: 2 } } }));
ok('unknown settings are reported and left out', extra.ok && extra.unknown.join(',') === 'futureThing,playback.futureSpeed' && extra.settings.futureThing === undefined);
ok('a loop with null marks is still a valid loop', D.validateImport(D.merge(exported, { settings: { playback: { loop: { start: null, end: 12 } } } })).ok);
ok('an import keeps the key this device already had',
   D.fromSync(D.validateImport(exported).settings, withKey).summary.apiKey === 'sk-ant-secret');

var changes = D.diffPaths(base, D.merge(base, { audio: { boost: 2 }, declutter: { watch: { comments: true } } }));
ok('a diff names every leaf that would change', changes.join(',') === 'audio.boost,declutter.watch.comments');
ok('a diff of equals is empty', D.diffPaths(base, D.withDefaults(null)).length === 0);
ok('a diff sees a replaced array', D.diffPaths(base, D.merge(base, { playback: { speedPresets: [1] } })).join(',') === 'playback.speedPresets');

// ---- modes of your own ----
var tuned = D.merge(base, { playback: { defaultSpeed: 1.5, loop: { enabled: true, start: 1, end: 5, videoId: 'x' } },
  declutter: { watch: { comments: true } }, summary: { apiKey: 'sk-secret' }, focus: { openDelay: 9 }, enabled: false });
var saved = D.saveCustomMode(tuned, '  Lectures  ');
var lectures = saved.customModes[0];
ok('saving a mode records only what differs from the defaults',
   lectures.patch.playback.defaultSpeed === 1.5 && lectures.patch.declutter.watch.comments === true
   && lectures.patch.picture === undefined, JSON.stringify(lectures.patch));
ok('the name is tidied', lectures.name === 'Lectures');
ok('a mode never carries credentials, the master switch, focus or a loop',
   lectures.patch.summary === undefined && lectures.patch.enabled === undefined
   && lectures.patch.focus === undefined && (lectures.patch.playback.loop === undefined));
ok('saving makes it the active mode, with nothing to undo',
   saved.profile === 'custom:' + lectures.id && saved.profileUndo === null);
ok('an empty name saves nothing', D.saveCustomMode(tuned, '   ') === tuned);

var elsewhere = D.merge(D.withDefaults(saved), { profile: 'default', playback: { defaultSpeed: 2 }, picture: { brightness: 60 }, declutter: { watch: { comments: false } } });
var previewed = D.modePreview(elsewhere, 'custom:' + lectures.id);
ok('a preview names what the mode would change, including what it resets',
   previewed.indexOf('playback.defaultSpeed') !== -1 && previewed.indexOf('picture.brightness') !== -1
   && previewed.indexOf('declutter.watch.comments') !== -1, previewed.join(','));
ok('a preview of the mode already in force is empty', D.modePreview(saved, 'custom:' + lectures.id).length === 0);
ok('a preview of a built-in mode still works', D.modePreview(base, 'study').indexOf('playback.defaultSpeed') !== -1);

var applied = D.applyProfile(elsewhere, 'custom:' + lectures.id);
ok('applying a custom mode sets its values and resets the rest of its scope',
   applied.playback.defaultSpeed === 1.5 && applied.picture.brightness === 100 && applied.declutter.watch.comments === true);
ok('applying leaves what is out of scope alone', applied.focus.openDelay === 9 && applied.enabled === false && applied.summary.apiKey === 'sk-secret');
var undone = D.applyProfile(applied, 'default');
ok('deselecting a custom mode restores what it displaced',
   undone.playback.defaultSpeed === 2 && undone.picture.brightness === 60 && undone.declutter.watch.comments === false);

var renamed = D.renameCustomMode(saved, lectures.id, 'Talks');
ok('renaming keeps the identity', renamed.customModes[0].id === lectures.id && renamed.customModes[0].name === 'Talks' && renamed.profile === saved.profile);
var updated = D.saveCustomMode(D.merge(saved, { audio: { boost: 3 } }), 'ignored', lectures.id);
ok('updating a mode by id replaces its patch and keeps its name',
   updated.customModes.length === 1 && updated.customModes[0].patch.audio.boost === 3 && updated.customModes[0].name === 'Lectures');
var doubled = D.duplicateCustomMode(saved, lectures.id);
ok('duplicating makes a second mode with the same patch and a new id',
   doubled.customModes.length === 2 && doubled.customModes[1].id !== lectures.id
   && JSON.stringify(doubled.customModes[1].patch) === JSON.stringify(lectures.patch) && doubled.customModes[1].name === 'Lectures 2');
var deleted = D.deleteCustomMode(saved, lectures.id);
ok('deleting the active mode keeps the settings and clears the label',
   deleted.customModes.length === 0 && deleted.profile === 'default' && deleted.playback.defaultSpeed === 1.5);
ok('deleting a mode that is not active changes nothing else', D.deleteCustomMode(doubled, doubled.customModes[1].id).profile === saved.profile);
ok('an unknown mode name is a revert, not a crash', D.applyProfile(saved, 'custom:nope').profile === 'default');
ok('a mode survives the export check', D.validateImport(D.packageExport(saved)).ok && D.validateImport(D.packageExport(saved)).settings.customModes.length === 1);

// ---- one channel, its own way ----
ok('a /channel/ link yields the id', D.channelKey('/channel/UCabcdefghij123') === 'UCabcdefghij123'
   && D.channelKey('https://www.youtube.com/channel/UCabcdefghij123/videos') === 'UCabcdefghij123');
ok('a handle is accepted, lower-cased', D.channelKey('/@Some.Creator') === '@some.creator');
ok('a bare name is not a key', D.channelKey('Some Creator') === '' && D.channelKey('') === '' && D.channelKey(null) === '');

var withChan = D.setChannelPrefs(base, 'UC1', 'Lectures Channel', { speed: 1.5 });
ok('a channel speed lands under its id', withChan.channelPrefs.UC1.speed === 1.5 && withChan.channelPrefs.UC1.name === 'Lectures Channel');
var eff = D.withChannel(withChan, 'UC1');
ok('on that channel the effective speed is the override', eff.playback.defaultSpeed === 1.5);
ok('on another channel it is the global preference', D.withChannel(withChan, 'UC2').playback.defaultSpeed === 1
   && D.withChannel(withChan, '') === withChan);
ok('the override does not touch the stored settings', withChan.playback.defaultSpeed === 1);
var withAudio = D.setChannelPrefs(withChan, 'UC1', '', { audio: { boost: 2, normalize: true, bass: 0, monoDownmix: false }, watch: { comments: true, related: false, liveChat: false, endScreens: false } });
var effAll = D.withChannel(withAudio, 'UC1');
ok('sound and clutter overrides apply too', effAll.audio.boost === 2 && effAll.audio.normalize === true && effAll.declutter.watch.comments === true);
ok('an override never reaches the master switch, credentials or the lock',
   D.withChannel(D.merge(withAudio, { enabled: false, summary: { apiKey: 'k' }, focus: { passwordHash: 'h' } }), 'UC1').enabled === false
   && effAll.summary.apiKey === '' && effAll.focus.passwordHash === '');
var modeOnTop = D.applyProfile(withAudio, 'study');
ok('a mode sets the global speed and the channel still wins on its own channel',
   modeOnTop.playback.defaultSpeed === 1.5 && D.withChannel(D.setChannelPrefs(modeOnTop, 'UC1', '', { speed: 0.75 }), 'UC1').playback.defaultSpeed === 0.75);
var cleared = D.setChannelPrefs(withAudio, 'UC1', '', { speed: 0, audio: null, watch: null });
ok('clearing every part removes the entry', cleared.channelPrefs.UC1 === undefined);
ok('clearing one part keeps the others', D.setChannelPrefs(withAudio, 'UC1', '', { speed: 0 }).channelPrefs.UC1.audio.boost === 2);
ok('a mode does not capture channel preferences', D.saveCustomMode(withAudio, 'x').customModes[0].patch.channelPrefs === undefined);
ok('channel preferences pass the export check', D.validateImport(D.packageExport(withAudio)).ok);

// ---- bookmarks: a moment, a note, and a file of their own ----
var BM = scope.CostumBookmarks;
var mark = BM.normalize({ videoId: 'dQw4w9WgXcQ', at: 83.7, note: '  the good bit  ', title: 'A   video' }, 1000);
ok('a bookmark is tidied on the way in', mark.at === 83 && mark.note === 'the good bit' && mark.title === 'A video' && mark.createdAt === 1000 && /^b/.test(mark.id));
ok('a bookmark without a video is refused', BM.normalize({ at: 3 }) === null && BM.normalize({ videoId: 'not a valid id!', at: 3 }) === null);
ok('a negative or missing time is refused', BM.normalize({ videoId: 'dQw4w9WgXcQ', at: -1 }) === null && BM.normalize({ videoId: 'dQw4w9WgXcQ' }) === null);
ok('a note is clipped to the limit', BM.normalize({ videoId: 'dQw4w9WgXcQ', at: 1, note: 'x'.repeat(900) }).note.length === BM.LIMITS.note);
ok('a link opens the video at the second', BM.link(mark) === 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=83s');
ok('the clock reads like YouTube', BM.clock(83) === '1:23' && BM.clock(3725) === '1:02:05');
var library = [
  BM.normalize({ id: 'one', videoId: 'dQw4w9WgXcQ', at: 10, note: 'Intro', title: 'Talk', channel: 'Physics', createdAt: 1 }),
  BM.normalize({ id: 'two', videoId: 'dQw4w9WgXcQ', at: 5, note: 'Setup', title: 'Talk', createdAt: 2 }),
  BM.normalize({ id: 'three', videoId: 'aaaaaaaaaaa', at: 40, note: 'Chorus', title: 'Song', createdAt: 3 })
];
ok('a video lists its own marks in time order', BM.forVideo(library, 'dQw4w9WgXcQ').map(function (b) { return b.id; }).join() === 'two,one');
ok('search covers title, channel and note, newest first',
   BM.search(library, 'phys').map(function (b) { return b.id; }).join() === 'one'
   && BM.search(library, 'chorus')[0].id === 'three' && BM.search(library, '').map(function (b) { return b.id; }).join() === 'three,two,one');
var bmFile = BM.packageExport(library);
ok('the bookmark file names its own format', bmFile.format === 'costum-bookmarks' && bmFile.version === BM.VERSION && bmFile.items.length === 3);
ok('a settings file is not a bookmark file, and vice versa',
   BM.validateImport(D.packageExport(base)).error === 'not-bookmarks' && D.validateImport(bmFile).error === 'not-costum');
ok('a newer bookmark file is refused', BM.validateImport(D.merge(bmFile, { version: 99 })).error === 'newer-version');
var checked = BM.validateImport({ format: 'costum-bookmarks', version: 1, items: [library[0], { junk: true }, { videoId: 'aaaaaaaaaaa', at: 40, note: 'dup by moment' }, { videoId: 'bbbbbbbbbbb', at: 1 }] });
ok('unreadable entries are counted, not imported', checked.ok && checked.items.length === 3 && checked.skipped === 1);
var mergedBm = BM.mergeImport(library, checked.items);
ok('a merge skips the same id and the same moment, and adds the rest',
   mergedBm.added === 1 && mergedBm.duplicates === 2 && mergedBm.items.length === 4);
var fullLib = [];
for (var i = 0; i < BM.LIMITS.items; i++) fullLib.push(BM.normalize({ videoId: 'v' + String(i).padStart(10, '0'), at: i }));
ok('a full library refuses the overflow rather than dropping old entries',
   BM.mergeImport(fullLib, [BM.normalize({ videoId: 'zzzzzzzzzzz', at: 1 })]).refused === 1 && BM.mergeImport(fullLib, [BM.normalize({ videoId: 'zzzzzzzzzzz', at: 1 })]).items.length === BM.LIMITS.items);

// ---- the settings lock ----
var Lock = scope.CostumLock;
ok('a fresh install is not locked', Lock.isLocked(base) === false);
ok('a stored hash locks the settings', Lock.isLocked(D.merge(base, { focus: { passwordHash: 'abc$def' } })) === true);
ok('an empty hash does not lock', Lock.isLocked(D.merge(base, { focus: { passwordHash: '' } })) === false);
ok('a missing settings object does not throw', Lock.isLocked(null) === false);

// ---- the phone: m.youtube.com ----
// Every mobile selector below was matched on live m.youtube.com (home, watch,
// search, a channel, Shorts). Each is pinned so a tidy-up cannot drop it.
ok('page names cover the pages the mobile rules scope to',
   C.pageName('/') === 'home' && C.pageName('/watch') === 'watch' && C.pageName('/results') === 'search'
   && C.pageName('/@mkbhd') === 'channel' && C.pageName('/shorts/abc') === 'shorts'
   && C.pageName('/feed/subscriptions') === 'subscriptions' && C.pageName('/feed/you') === 'library'
   && C.pageName('/premium') === 'other');
ok('only m.youtube.com is the mobile host',
   C.isMobileHost('m.youtube.com') && !C.isMobileHost('www.youtube.com') && !C.isMobileHost('youtube.com') && !C.isMobileHost(''));

ok('on desktop every setting is offered',
   C.worksOn('declutter.sidebar.hideAll', false) && C.worksOn('playback.wheelOnPlayer', false) && C.worksOn('shortcuts.bookmark', false));
ok('on the phone, desktop-only page switches are not offered',
   !C.worksOn('declutter.sidebar.hideAll', true) && !C.worksOn('declutter.watch.playButton', true)
   && !C.worksOn('declutter.search.suggestions', true));
ok('on the phone, mouse, keyboard and desktop-layout settings are not offered',
   !C.worksOn('playback.wheelOnPlayer', true) && !C.worksOn('shortcuts.bookmark', true)
   && !C.worksOn('layout.widePlayer', true) && !C.worksOn('layout.cinema', true));
ok('on the phone, what acts on the video or the whole page is offered',
   C.worksOn('playback.defaultSpeed', true) && C.worksOn('audio.boost', true) && C.worksOn('picture.brightness', true)
   && C.worksOn('declutter.shorts', true) && C.worksOn('block.keywords', true) && C.worksOn('layout.zen', true));

var onMobileMissing = [];
Object.keys(C.ON_MOBILE).forEach(function (g) {
  C.ON_MOBILE[g].forEach(function (k) { if (!C.DECLUTTER[g] || !C.DECLUTTER[g][k]) onMobileMissing.push(g + '.' + k); });
});
ok('every switch offered on the phone exists', onMobileMissing.length === 0, onMobileMissing.join(', '));

// Elements the mobile site shares with desktop (checked live), plus mobile-only ones.
var MOBILE_HANDLES = /ytm-|ad-slot-renderer|reel-action-bar-view-model|comments-entry-point-teaser-view-model|like-button-view-model|yt-tab-shape|yt-tab-group-shape|yt-page-header-renderer|yt-image-banner-view-model|yt-content-metadata-view-model|yt-description-preview-view-model|yt-flexible-actions-view-model|yt-shorts-video-title-view-model|yt-reel-channel-bar-view-model|yt-searchbox|yt-lockup-view-model/;
var noHandle = [];
Object.keys(C.ON_MOBILE).forEach(function (g) {
  C.ON_MOBILE[g].forEach(function (k) {
    var sels = (C.DECLUTTER[g] || {})[k] || [];
    if (!sels.some(function (x) { return MOBILE_HANDLES.test(x); })) noHandle.push(g + '.' + k);
  });
});
ok('every switch offered on the phone has a selector that exists on the mobile page', noHandle.length === 0, noHandle.join(', '));

var PINNED_MOBILE = {
  'watch.comments': 'yt-video-metadata-carousel-view-model:has(comments-entry-point-teaser-view-model)',
  'watch.related': 'ytm-item-section-renderer[section-identifier="related-items"]',
  'watch.actionBar': 'ytm-slim-video-action-bar-renderer .slim_video_action_bar_renderer_button',
  'watch.subscribe': 'ytm-slim-video-action-bar-renderer .slim-subscribe-button',
  'watch.videoTitle': 'ytm-slim-video-information-renderer .slim-video-information-title',
  'watch.viewsAndDate': 'ytm-slim-video-information-renderer .slim-video-information-subtitle',
  'home.feed': 'html[costum-page="home"] ytm-rich-grid-renderer',
  'home.chips': 'html[costum-page="home"] ytm-feed-filter-chip-bar-renderer',
  'search.filters': 'ytm-search ytm-search-sub-menu-renderer',
  'search.channels': 'ytm-search ytm-compact-channel-renderer',
  'shortsPlayer.overlay': 'ytm-reel-player-overlay-renderer',
  'shortsPlayer.actions': 'reel-action-bar-view-model',
  'cards.title': 'ytm-media-item .media-item-headline',
  'cards.channelName': 'ytm-media-item .ytmBadgeAndBylineRendererItemByline:first-child',
  'cards.title_channelPage': 'ytm-compact-video-renderer .YtmCompactMediaItemHeadline',
  'channel.featured': 'ytm-channel-featured-video-renderer',
  'header.hideAll': 'ytm-mobile-topbar-renderer'
};
var unpinned = Object.keys(PINNED_MOBILE).filter(function (key) {
  var parts = key.replace(/_.*$/, '').split('.');
  return (C.DECLUTTER[parts[0]][parts[1]] || []).indexOf(PINNED_MOBILE[key]) === -1;
});
ok('the live-verified mobile selectors are all still there', unpinned.length === 0, unpinned.join(', '));
ok('mobile comments are hidden in both of their entry-point forms (teaser and message, both seen live)',
   C.DECLUTTER.watch.comments.indexOf('yt-video-metadata-carousel-view-model:has(yt-comments-entry-point-message-view-model)') !== -1);
ok('mobile ads are hidden with the other banner ads',
   C.DECLUTTER.global.bannerAds.indexOf('ad-slot-renderer') !== -1 && C.DECLUTTER.global.bannerAds.indexOf('ytm-companion-slot') !== -1);
ok('mobile home rules scope themselves to the home page, not every grid',
   C.DECLUTTER.home.feed.filter(function (x) { return /ytm-/.test(x); }).every(function (x) { return x.indexOf('html[costum-page="home"]') === 0; }));

var zenCss = C.buildLayoutCss(D.merge(base, { layout: { zen: true } }));
ok('"Just the video" clears the mobile watch page too',
   /ytm-mobile-topbar-renderer/.test(zenCss) && /ytm-single-column-watch-next-results-renderer/.test(zenCss));

var blockSrc = read(ROOT + 'content/modules/contentblock.js');
ok('keyword blocking reads titles on mobile channel pages',
   blockSrc.indexOf("'.YtmCompactMediaItemHeadline'") !== -1);
ok('channel blocking reads the channel from the mobile byline',
   blockSrc.indexOf("ytm-badge-and-byline-renderer .ytmBadgeAndBylineRendererItemByline:first-child") !== -1);
var bootSrc = read(ROOT + 'content/boot.js'), routerSrc = read(ROOT + 'content/router.js');
ok('the page is marked at load and on every navigation',
   /setAttribute\('costum-page'/.test(bootSrc) && /markPage\(\)/.test(routerSrc));

// ---- switch health: on, but finding nothing ----
var none = function () { return 0; }, all = function () { return 1; };
var healthOn = D.merge(base, { declutter: { watch: { related: true, liveChat: true, playButton: true } } });
ok('a structural switch that matches nothing is reported',
   C.deadSwitches(healthOn, '/watch', false, none).indexOf('watch.related') !== -1);
ok('a switch that matches is not reported', C.deadSwitches(healthOn, '/watch', false, all).length === 0);
ok('a switch that is off is never reported', C.deadSwitches(base, '/watch', false, none).length === 0);
ok('situational targets (live chat) are not checked — they come and go with the video',
   C.deadSwitches(healthOn, '/watch', false, none).indexOf('watch.liveChat') === -1);
ok('a switch for another page is not checked here',
   C.deadSwitches(healthOn, '/results', false, none).indexOf('watch.related') === -1);
ok('on the phone, desktop-only targets are not checked',
   C.deadSwitches(healthOn, '/watch', true, none).indexOf('watch.playButton') === -1
   && C.deadSwitches(healthOn, '/watch', false, none).indexOf('watch.playButton') !== -1);
ok('one selector matching is enough',
   C.deadSwitches(healthOn, '/watch', true, function (sel) { return /section-identifier="related-items"/.test(sel) ? 1 : 0; }).indexOf('watch.related') === -1);
ok('a selector the browser rejects counts as no match, not a crash',
   C.deadSwitches(healthOn, '/watch', false, function () { throw new Error('bad selector'); }).indexOf('watch.related') !== -1);
var structuralMissing = [];
Object.keys(C.STRUCTURAL).forEach(function (g) { C.STRUCTURAL[g].forEach(function (k) { if (!C.DECLUTTER[g] || !C.DECLUTTER[g][k]) structuralMissing.push(g + '.' + k); }); });
ok('every checked switch exists', structuralMissing.length === 0, structuralMissing.join(', '));

// ---- the panel's first-run welcome ----
var panelSrc = read(ROOT + 'content/panel.js');
ok('the welcome\'s mode buttons have their own control ids, not the Modes section\'s',
   /setAttribute\('data-control-id', 'welcome:' \+ name\)/.test(panelSrc));
ok('the one-time welcome is remembered and never shown over a chosen mode',
   /storage\.local\.set\(\{ welcomed: true \}\)/.test(panelSrc) && /if \(welcomed \|\| s\.profile !== 'default'\) return null;/.test(panelSrc));

console.log('');
console.log(pass + ' passed, ' + fail + ' failed');
if (fail) { $.exit(1); }
