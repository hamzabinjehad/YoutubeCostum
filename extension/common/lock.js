/* Costum for YouTube — settings lock.
 *
 * The point of a scheduled block is that the version of you who set it up gets
 * to overrule the version of you who wants to watch one more video. That only
 * works if turning it off is harder than turning it on.
 *
 * The password is never stored. What is stored is a salted SHA-256 hash, so
 * reading storage tells an attacker nothing, and neither does reading this. */
(function (root) {
  'use strict';

  const ITERATIONS = 120000;

  function bytesToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function randomSalt() {
    return bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  }

  /* PBKDF2 rather than a bare digest: a four-digit password is guessable in
   * milliseconds against plain SHA-256, and four digits is what people pick. */
  async function derive(password, salt) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: encoder.encode(salt), iterations: ITERATIONS, hash: 'SHA-256' },
      key,
      256
    );
    return bytesToHex(bits);
  }

  async function make(password) {
    const salt = randomSalt();
    return salt + '$' + (await derive(password, salt));
  }

  async function verify(password, stored) {
    if (!stored) return true;
    const parts = String(stored).split('$');
    if (parts.length !== 2) return false;
    const candidate = await derive(password, parts[0]);
    // Constant-time-ish: compare every character, never bail early.
    if (candidate.length !== parts[1].length) return false;
    let diff = 0;
    for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ parts[1].charCodeAt(i);
    return diff === 0;
  }

  function isLocked(settings) {
    return !!(settings && settings.focus && settings.focus.passwordHash);
  }

  root.CostumLock = { make, verify, isLocked };
})(typeof self !== 'undefined' ? self : this);
