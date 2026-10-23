/* Harness-only runner: ?test=1 exercises the in-memory extension stub.
   Report after the suite finishes so its UI never changes layout assertions. */
(function () {
  'use strict';
  if (!new URLSearchParams(location.search).has('test')) return;
  addEventListener('load', () => {
    setTimeout(async () => {
      const result = await self.CostumUiTests.run();
      document.title = result.failed ? 'FAIL: Costum UI tests' : 'PASS: Costum UI tests';
      const report = document.createElement('pre');
      report.id = 'test-report';
      report.textContent = JSON.stringify(result, null, 2);
      document.body.replaceChildren(report);
      document.body.style.cssText = 'width:auto;height:auto;overflow:auto;padding:16px';
    }, 2000);
  });
})();
