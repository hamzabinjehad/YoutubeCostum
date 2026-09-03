(function () {
  'use strict';
  const Costum = self.Costum;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const FILTER_ID = 'costum-sharpen';

  let kernelNode = null;
  let appliedAmount = -1;

  /* Sharpening has no CSS primitive, so it needs a real convolution. The
     filter lives in the page document because that is where the video is, and
     it is only built the first time someone actually asks for sharpening —
     a convolution runs per frame, so nobody who leaves this at zero should
     pay for it. */
  function ensureSharpen(amount) {
    if (amount === appliedAmount) return;
    appliedAmount = amount;

    if (!kernelNode) {
      const svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('width', '0');
      svg.setAttribute('height', '0');
      svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';

      const filter = document.createElementNS(SVG_NS, 'filter');
      filter.setAttribute('id', FILTER_ID);
      // The video's own pixels, not a resampled copy in some other space.
      filter.setAttribute('color-interpolation-filters', 'sRGB');

      kernelNode = document.createElementNS(SVG_NS, 'feConvolveMatrix');
      kernelNode.setAttribute('order', '3 3');
      kernelNode.setAttribute('divisor', '1');
      kernelNode.setAttribute('edgeMode', 'duplicate');
      // Without this the alpha channel is convolved too and edges go milky.
      kernelNode.setAttribute('preserveAlpha', 'true');

      filter.appendChild(kernelNode);
      svg.appendChild(filter);
      document.documentElement.appendChild(svg);
    }

    kernelNode.setAttribute('kernelMatrix', self.CostumDefaults.sharpenKernel(amount).join(' '));
  }

  function css(p, modesty) {
    const parts = [];
    /* First in the chain: blurring after a sharpen would be absurd, and the
       picture controls and this write the same inline `filter`, so they have
       to be built together rather than fight over the property. */
    if (modesty && modesty.video === 'blur') {
      parts.push('blur(' + Math.max(4, Math.min(40, Number(modesty.strength) || 16)) + 'px)');
    }
    if (p.brightness !== 100) parts.push('brightness(' + p.brightness + '%)');
    if (p.contrast !== 100) parts.push('contrast(' + p.contrast + '%)');
    if (p.saturation !== 100) parts.push('saturate(' + p.saturation + '%)');
    if (p.invert) parts.push('invert(1) hue-rotate(180deg)');
    /* This used to be contrast(100 + sharpen/2), which is not sharpening: it
       multiplied with whatever the contrast slider was already doing, so the
       two controls fought each other and neither did what it said. */
    if (p.sharpen > 0) {
      ensureSharpen(p.sharpen);
      parts.push('url(#' + FILTER_ID + ')');
    }
    return parts.join(' ');
  }

  function applyTo(video, s) {
    const value = css(s.picture, s.modesty);
    video.style.filter = value;
    // Filters on the video alone leave letterbox bars untouched, which is what we want.
  }

  Costum.register({
    name: 'filters',
    apply(s, ctx) { const v = ctx.video(); if (v) applyTo(v, s); },
    onVideo(video, s) { applyTo(video, s); }
  });
})();
