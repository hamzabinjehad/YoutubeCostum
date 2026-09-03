(function () {
  'use strict';
  const Costum = self.Costum;

  // createMediaElementSource can only ever be called once per element, and it
  // permanently reroutes that element's audio — so the graph is built lazily
  // and only when the user actually asked for something non-neutral.
  const graphs = new WeakMap();
  let context = null;

  function neutral(a) {
    return a.boost === 1 && a.bass === 0 && !a.normalize && !a.monoDownmix;
  }

  /* Safari will not start an AudioContext without a user gesture, and routing a
     video through a suspended context does not degrade to "no effect" — it
     degrades to silence. So the graph is never built until the context is
     actually running; until then the video keeps its own audio path. */
  function ensureContext() {
    const Ctor = self.AudioContext || self.webkitAudioContext;
    if (!Ctor) return null;
    if (!context) {
      context = new Ctor();
      self.CostumAudioContext = context;   // read-only, for diagnostics
    }
    if (context.state === 'running') return context;
    context.resume().catch(() => {});
    return context.state === 'running' ? context : null;
  }

  /* Try again the next time the reader touches the page, which is the only
     moment Safari will let the context start.
     The retry deliberately does not close over the settings it was armed with:
     a gesture can be minutes later, and moving the boost slider in between is
     exactly the gesture most likely to be the one that arrives. */
  let armed = false;
  let latest = null;
  function armForGesture(video) {
    if (armed) return;
    armed = true;
    const retry = () => {
      armed = false;
      if (latest) applyTo(video, latest);
    };
    ['pointerdown', 'keydown'].forEach((type) =>
      window.addEventListener(type, retry, { once: true, capture: true }));
  }

  function build(video, ctxAudio) {
    let graph = graphs.get(video);
    if (graph) return graph;

    try {
      const source = ctxAudio.createMediaElementSource(video);
      const bass = ctxAudio.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 160;

      const compressor = ctxAudio.createDynamicsCompressor();
      compressor.threshold.value = -28;
      compressor.knee.value = 24;
      compressor.ratio.value = 8;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.22;

      const gain = ctxAudio.createGain();

      /* Mono is a gain node told to accept exactly one channel: the graph then
         averages left and right into it on the way in, and the destination
         copies that single channel back out to both ears. A ChannelMerger was
         created here before and never connected to anything, so the setting
         did nothing at all. */
      const mono = ctxAudio.createGain();
      mono.channelCount = 1;
      mono.channelCountMode = 'explicit';
      mono.channelInterpretation = 'speakers';

      graph = { source, bass, compressor, gain, mono };
      graphs.set(video, graph);
      return graph;
    } catch (e) {
      return null;
    }
  }

  function wire(graph, a) {
    const dest = context.destination;
    [graph.source, graph.bass, graph.compressor, graph.gain, graph.mono]
      .forEach((n) => { try { n.disconnect(); } catch (e) {} });

    let node = graph.source;
    node.connect(graph.bass); node = graph.bass;
    if (a.normalize) { node.connect(graph.compressor); node = graph.compressor; }
    node.connect(graph.gain); node = graph.gain;
    // Last in the chain, so the boost and the shelf are summed before the two
    // channels are folded together rather than after.
    if (a.monoDownmix) { node.connect(graph.mono); node = graph.mono; }
    node.connect(dest);

    graph.bass.gain.value = a.bass;
    graph.gain.gain.value = Math.max(0, Math.min(10, a.boost));
  }

  function applyTo(video, s) {
    latest = s;
    const a = s.audio;
    const existing = graphs.get(video);

    // Once an element has been through createMediaElementSource its audio only
    // reaches the speakers through our graph, so an existing one must always be
    // rewired — leaving it disconnected is silence, not neutrality.
    if (existing) { wire(existing, a); return; }

    if (neutral(a)) return;   // never touch audio we were not asked to touch

    const ctxAudio = ensureContext();
    if (!ctxAudio) { armForGesture(video); return; }

    const graph = build(video, ctxAudio);
    if (graph) wire(graph, a);
  }

  Costum.register({
    name: 'audio',
    apply(s, ctx) {
      const video = ctx.video();
      if (video) applyTo(video, s);
    },
    onVideo(video, s) {
      applyTo(video, s);
    },
    actions: {
      volumeUp: (ctx) => {
        const player = document.getElementById('movie_player');
        if (!player || !player.getVolume) return;
        const next = Math.min(100, player.getVolume() + 5);
        player.setVolume(next);
        ctx.toast(Math.round(next) + '%');
      },
      volumeDown: (ctx) => {
        const player = document.getElementById('movie_player');
        if (!player || !player.getVolume) return;
        const next = Math.max(0, player.getVolume() - 5);
        player.setVolume(next);
        ctx.toast(Math.round(next) + '%');
      }
    }
  });
})();
