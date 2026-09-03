(function () {
  'use strict';
  const Costum = self.Costum;

  async function grab(ctx) {
    const video = ctx.video();
    if (!video || !video.videoWidth) return ctx.toast('No video to capture');

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const g = canvas.getContext('2d');

    // Match what the viewer actually sees, filters included.
    g.filter = video.style.filter || 'none';
    g.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return ctx.toast('Capture failed');

    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      ctx.toast('Frame copied · ' + canvas.width + '×' + canvas.height);
      return;
    } catch (e) {
      // Clipboard needs a permission Safari does not always grant; fall back to a file.
    }

    const meta = await ctx.meta();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (meta.title || 'youtube').replace(/[\\/:*?"<>|]/g, '_').slice(0, 80)
      + ' ' + ctx.clock(video.currentTime).replace(/:/g, '.') + '.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    ctx.toast('Frame saved · ' + canvas.width + '×' + canvas.height);
  }

  Costum.register({ name: 'capture', actions: { screenshot: grab } });
})();
