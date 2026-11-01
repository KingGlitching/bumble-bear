/* Spotify connection for Bumble (PKCE login — no secret stored anywhere).
   Plays songs on the phone's Spotify app via Spotify Connect. Explicit songs are always skipped. */
window.BumbleSpotify = (() => {
  'use strict';
  const KEY = 'bumble-spotify';
  const SCOPES = 'user-read-playback-state user-modify-playback-state';
  const redirectUri = () => location.origin + location.pathname.replace(/index\.html$/, '');

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  let state = load();

  const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const randStr = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return b64url(a).slice(0, n); };

  function setClientId(id) { state.clientId = (id || '').trim(); save(state); }
  const clientId = () => state.clientId || '';
  const connected = () => !!(state.refresh || state.access);

  async function login() {
    if (!clientId()) throw new Error('no-client-id');
    const verifier = randStr(64);
    const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    const st = randStr(16);
    state.verifier = verifier; state.oauthState = st; save(state);
    const p = new URLSearchParams({
      client_id: clientId(), response_type: 'code', redirect_uri: redirectUri(),
      code_challenge_method: 'S256', code_challenge: challenge, scope: SCOPES, state: st,
    });
    location.href = 'https://accounts.spotify.com/authorize?' + p.toString();
  }

  async function tokenRequest(body) {
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error_description || j.error || ('token ' + r.status));
    state.access = j.access_token;
    state.exp = Date.now() + (j.expires_in - 60) * 1000;
    if (j.refresh_token) state.refresh = j.refresh_token;
    save(state);
  }

  /* Call once on page load: finishes the login if Spotify just sent us back. */
  async function handleRedirect() {
    const q = new URLSearchParams(location.search);
    if (!q.has('code') && !q.has('error')) return null;
    const clean = () => history.replaceState(null, '', redirectUri());
    if (q.get('error')) { clean(); return 'denied'; }
    if (q.get('state') !== state.oauthState) { clean(); return 'failed'; }
    try {
      await tokenRequest({ grant_type: 'authorization_code', code: q.get('code'), redirect_uri: redirectUri(), client_id: clientId(), code_verifier: state.verifier });
      delete state.verifier; delete state.oauthState; save(state);
      clean(); return 'connected';
    } catch (e) { clean(); return 'failed'; }
  }

  async function token() {
    if (state.access && Date.now() < state.exp) return state.access;
    if (!state.refresh) throw new Error('not-connected');
    await tokenRequest({ grant_type: 'refresh_token', refresh_token: state.refresh, client_id: clientId() });
    return state.access;
  }

  async function api(path, opts = {}, retry = true) {
    const r = await fetch('https://api.spotify.com/v1' + path, {
      ...opts, headers: { Authorization: 'Bearer ' + (await token()), 'Content-Type': 'application/json', ...(opts.headers || {}) },
    });
    if (r.status === 401 && retry) { state.exp = 0; save(state); return api(path, opts, false); }
    return r;
  }

  /* Find a non-explicit track. Returns {id, uri, name, artist, image, url} or null. */
  async function search(q) {
    const r = await api('/search?' + new URLSearchParams({ q, type: 'track', limit: '10' }));
    if (!r.ok) throw new Error('search ' + r.status);
    const j = await r.json();
    const items = ((j.tracks && j.tracks.items) || []).filter((t) => t && !t.explicit);
    const t = items[0];
    if (!t) return null;
    const imgs = (t.album && t.album.images) || [];
    return {
      id: t.id, uri: t.uri, name: t.name,
      artist: (t.artists || []).map((a) => a.name).join(', '),
      image: (imgs[1] || imgs[0] || {}).url || '',
      url: (t.external_urls && t.external_urls.spotify) || ('https://open.spotify.com/track/' + t.id),
    };
  }

  /* Returns 'playing' | 'no-device' | 'premium' | 'error' */
  async function play(track) {
    const d = await api('/me/player/devices');
    if (!d.ok) return 'error';
    const devices = ((await d.json()).devices || []).filter((x) => !x.is_restricted);
    if (!devices.length) return 'no-device';
    const dev = devices.find((x) => x.is_active) || devices.find((x) => /smartphone/i.test(x.type)) || devices[0];
    const r = await api('/me/player/play?device_id=' + encodeURIComponent(dev.id), { method: 'PUT', body: JSON.stringify({ uris: [track.uri] }) });
    if (r.ok) return 'playing';
    if (r.status === 403) return 'premium';
    return 'error';
  }

  async function pause() {
    try { const r = await api('/me/player/pause', { method: 'PUT' }); return r.ok; } catch (e) { return false; }
  }

  function disconnect() { const id = state.clientId; state = { clientId: id }; save(state); }

  return { redirectUri, setClientId, clientId, connected, login, handleRedirect, search, play, pause, disconnect };
})();
