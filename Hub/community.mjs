/**
 * Community: member gallery, design voting, tiering, Pro encrypted locker
 */
function getFirebase() {
  return typeof firebase !== 'undefined' ? firebase : window.firebase;
}

const POLL_ID = 'active';
const OPTION_DEF = [
  { id: 'petal-a', label: 'Petal set A — soft curves' },
  { id: 'petal-b', label: 'Petal set B — pointed tips' },
  { id: 'stem', label: 'Stem & leaves accent pack' }
];

const THEME_POLL_ID = 'theme-roadmap';
const THEME_OPTIONS = [
  { id: 'retro70s', label: '70s Retro' },
  { id: 'deepSea', label: 'Deep Sea' },
  { id: 'geomMin', label: 'Geometric Minimal' }
];

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = String(s || '');
  return d.innerHTML;
}

function getCommunityTier() {
  return localStorage.getItem('communityTier') || 'beginner';
}

async function deriveAesKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
}

async function encryptToBlob(file, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt);
  const plain = await file.arrayBuffer();
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
  const out = new Uint8Array(16 + 12 + ct.byteLength);
  out.set(salt, 0);
  out.set(iv, 16);
  out.set(new Uint8Array(ct), 28);
  return new Blob([out], { type: 'application/octet-stream' });
}

async function syncTierToFirestore(tier) {
  const fb = getFirebase();
  const u = fb.auth().currentUser;
  if (!u) return;
  await fb.firestore().collection('users').doc(u.uid).set({ communityTier: tier }, { merge: true });
}

function wireTierCards() {
  const tier = getCommunityTier();
  document.querySelectorAll('[data-community-tier]').forEach((btn) => {
    const t = btn.getAttribute('data-community-tier');
    btn.classList.toggle('platform-btn', true);
    if (t === tier) btn.classList.add('secondary');
    else btn.classList.remove('secondary');
    btn.onclick = async () => {
      localStorage.setItem('communityTier', t);
      await syncTierToFirestore(t);
      document.getElementById('communityTierBadge').textContent =
        t === 'beginner' ? 'Beginner' : t === 'standard' ? 'Standard' : 'Professional';
      wireTierCards();
      loadLockerList().catch(() => {});
      alert('Your community tier is saved on this device' + (getFirebase().auth().currentUser ? ' and to your account.' : '.'));
    };
  });
  const badge = document.getElementById('communityTierBadge');
  if (badge) {
    badge.textContent =
      tier === 'beginner' ? 'Beginner' : tier === 'standard' ? 'Standard' : 'Professional';
  }
}

async function loadPollMeta() {
  const fb = getFirebase();
  const snap = await fb.firestore().doc(`designPolls/${POLL_ID}`).get();
  const titleEl = document.getElementById('designPollTitle');
  if (snap.exists && snap.data().title && titleEl) {
    titleEl.textContent = snap.data().title;
  }
}

async function submitVote(optionId) {
  const fb = getFirebase();
  const u = fb.auth().currentUser;
  if (!u) {
    alert('Sign in to vote.');
    return;
  }
  try {
    await fb
      .firestore()
      .doc(`designPolls/${POLL_ID}/votes/${u.uid}`)
      .set({ optionId, voterUid: u.uid, votedAt: firebase.firestore.FieldValue.serverTimestamp() });
    alert('Thanks — your vote is recorded.');
    await refreshVoteCounts();
  } catch (e) {
    if (e.code === 'permission-denied') {
      alert('You may have already voted — only one vote per account.');
    } else alert(e.message || e);
  }
}

async function refreshVoteCounts() {
  const fb = getFirebase();
  const snap = await fb.firestore().collection(`designPolls/${POLL_ID}/votes`).get();
  const counts = {};
  OPTION_DEF.forEach((o) => {
    counts[o.id] = 0;
  });
  snap.forEach((d) => {
    const id = d.data().optionId;
    if (id && counts[id] !== undefined) counts[id]++;
  });
  OPTION_DEF.forEach((o) => {
    const el = document.getElementById(`voteCount-${o.id}`);
    if (el) el.textContent = String(counts[o.id] || 0);
  });
}

async function loadThemePollMeta() {
  const fb = getFirebase();
  const snap = await fb.firestore().doc(`designPolls/${THEME_POLL_ID}`).get();
  const titleEl = document.getElementById('themePollTitle');
  if (snap.exists && snap.data().title && titleEl) {
    titleEl.textContent = snap.data().title;
  }
}

async function submitThemeVote(optionId) {
  const fb = getFirebase();
  const u = fb.auth().currentUser;
  if (!u) {
    alert('Sign in to vote.');
    return;
  }
  try {
    await fb
      .firestore()
      .doc(`designPolls/${THEME_POLL_ID}/votes/${u.uid}`)
      .set({
        optionId,
        voterUid: u.uid,
        votedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    alert('Thanks — your theme vote is recorded.');
    await refreshThemeVoteCounts();
  } catch (e) {
    if (e.code === 'permission-denied') {
      alert('You may have already voted — only one vote per account.');
    } else alert(e.message || e);
  }
}

async function refreshThemeVoteCounts() {
  const fb = getFirebase();
  const snap = await fb.firestore().collection(`designPolls/${THEME_POLL_ID}/votes`).get();
  const counts = {};
  THEME_OPTIONS.forEach((o) => {
    counts[o.id] = 0;
  });
  snap.forEach((d) => {
    const id = d.data().optionId;
    if (id && counts[id] !== undefined) counts[id]++;
  });
  THEME_OPTIONS.forEach((o) => {
    const el = document.getElementById(`voteCount-theme-${o.id}`);
    if (el) el.textContent = String(counts[o.id] || 0);
  });
}

async function loadTechniqueWiki() {
  const host = document.getElementById('techniqueWikiList');
  if (!host) return;
  const fb = getFirebase();
  let snap;
  try {
    snap = await fb.firestore().collection('techniqueWiki').limit(40).get();
  } catch (e) {
    console.warn('techniqueWiki', e);
    return;
  }
  const rows = [];
  snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
  rows.sort((a, b) => {
    const ta =
      a.createdAt && a.createdAt.toMillis
        ? a.createdAt.toMillis()
        : a.createdAt && a.createdAt.seconds
          ? a.createdAt.seconds * 1000
          : 0;
    const tb =
      b.createdAt && b.createdAt.toMillis
        ? b.createdAt.toMillis()
        : b.createdAt && b.createdAt.seconds
          ? b.createdAt.seconds * 1000
          : 0;
    return tb - ta;
  });
  host.innerHTML = '';
  if (!rows.length) {
    host.innerHTML = `
      <p style="font-size:0.78rem;color:var(--text-secondary);margin:0 0 0.5rem;">Sample tips (submit yours when signed in):</p>
      <div style="border-bottom:1px solid rgba(109,213,195,0.35);padding:0.5rem 0;margin-bottom:0.35rem;">
        <strong style="font-size:0.88rem;">Thin Premo sheets in dry winter</strong><br/>
        <span style="font-size:0.75rem;color:var(--text-secondary);">US Midwest · dry heat</span>
        <p style="font-size:0.82rem;margin:0.35rem 0 0;line-height:1.45;">Tent with foil for the first 10 minutes and drop the oven 5°F if edges lift.</p>
      </div>
      <div style="border-bottom:1px solid rgba(109,213,195,0.35);padding:0.5rem 0;margin-bottom:0.35rem;">
        <strong style="font-size:0.88rem;">Sanding after bake — earring scale</strong><br/>
        <span style="font-size:0.75rem;color:var(--text-secondary);">Studio · general</span>
        <p style="font-size:0.82rem;margin:0.35rem 0 0;line-height:1.45;">Wet-sand from 400→1200 under running water; buff with a cotton wheel for a soft glow.</p>
      </div>`;
    return;
  }
  rows.slice(0, 20).forEach((row) => {
    const div = document.createElement('div');
    div.style.cssText =
      'border-bottom:1px solid rgba(109,213,195,0.35);padding:0.5rem 0;margin-bottom:0.35rem;';
    div.innerHTML = `<strong style="font-size:0.88rem;">${escapeHtml(row.title || 'Tip')}</strong><br/><span style="font-size:0.75rem;color:var(--text-secondary);">${escapeHtml(row.climate || '')}</span><p style="font-size:0.82rem;margin:0.35rem 0 0;line-height:1.45;">${escapeHtml(row.body || '')}</p>`;
    host.appendChild(div);
  });
}

async function submitWikiTip() {
  const fb = getFirebase();
  const u = fb.auth().currentUser;
  const title =
    (document.getElementById('wikiTitleInput') && document.getElementById('wikiTitleInput').value.trim()) || '';
  const climate =
    (document.getElementById('wikiClimateInput') && document.getElementById('wikiClimateInput').value.trim()) || '';
  const body =
    (document.getElementById('wikiBodyInput') && document.getElementById('wikiBodyInput').value.trim()) || '';
  if (!u) {
    alert('Sign in to suggest a tip.');
    return;
  }
  if (title.length < 2 || body.length < 5) {
    alert('Add a short title and a tip (5+ characters).');
    return;
  }
  try {
    await fb.firestore().collection('techniqueWiki').add({
      authorUid: u.uid,
      title: title.slice(0, 200),
      climate: climate.slice(0, 120),
      body: body.slice(0, 5000),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    const ti = document.getElementById('wikiTitleInput');
    const ci = document.getElementById('wikiClimateInput');
    const bi = document.getElementById('wikiBodyInput');
    if (ti) ti.value = '';
    if (ci) ci.value = '';
    if (bi) bi.value = '';
    alert('Thank you — tip submitted.');
    await loadTechniqueWiki();
  } catch (e) {
    alert(e.message || e);
  }
}

async function submitSuggestion() {
  const fb = getFirebase();
  const u = fb.auth().currentUser;
  const ta = document.getElementById('designPollSuggestion');
  const text = (ta && ta.value.trim()) || '';
  if (!u) {
    alert('Sign in to suggest a modification.');
    return;
  }
  if (text.length < 3) {
    alert('Add a short suggestion (3+ characters).');
    return;
  }
  try {
    await fb.firestore().collection(`designPolls/${POLL_ID}/suggestions`).add({
      authorUid: u.uid,
      text: text.slice(0, 2000),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    ta.value = '';
    alert('Suggestion submitted. Thank you!');
  } catch (e) {
    alert(e.message || e);
  }
}

async function uploadGalleryPhoto(ev) {
  const file = ev.target.files && ev.target.files[0];
  if (!file || !file.type.startsWith('image/')) {
    alert('Choose an image file.');
    return;
  }
  const fb = getFirebase();
  const u = fb.auth().currentUser;
  if (!u) {
    alert('Sign in to upload to the member gallery.');
    return;
  }
  const caption = (document.getElementById('galleryCaption') && document.getElementById('galleryCaption').value.trim()) || '';
  const productTag = (document.getElementById('galleryProductTag') && document.getElementById('galleryProductTag').value.trim()) || 'general';
  try {
    const path = `gallery/${u.uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const ref = fb.storage().ref(path);
    await ref.put(file);
    const photoUrl = await ref.getDownloadURL();
    await fb.firestore().collection('memberGallery').add({
      authorUid: u.uid,
      photoUrl,
      caption: caption.slice(0, 500),
      productTag: productTag.slice(0, 120),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    ev.target.value = '';
    alert('Photo published to the gallery.');
  } catch (e) {
    console.error(e);
    alert(
      e.code === 'storage/unauthorized'
        ? 'Storage permission denied. Ensure Firebase Storage is enabled and rules are deployed.'
        : e.message || String(e)
    );
  }
}

function renderDemoGalleryCards(host) {
  const demos = [
    {
      url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=480&q=80',
      cap: 'Translucent stack — sample showcase',
      tag: 'Demo · Spring Florals'
    },
    {
      url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=480&q=80',
      cap: 'Finished earrings — Premo + mica',
      tag: 'Demo · community highlight'
    }
  ];
  const note = document.createElement('p');
  note.style.cssText =
    'color:var(--text-secondary);font-size:0.85rem;grid-column:1/-1;margin:0 0 0.65rem;line-height:1.45;';
  note.textContent =
    'Community hub is live. These are sample images; your uploads replace this row for visitors.';
  host.appendChild(note);
  demos.forEach((d) => {
    const card = document.createElement('div');
    card.className = 'platform-card';
    card.style.padding = '0.65rem';
    const img = document.createElement('img');
    img.src = d.url;
    img.alt = '';
    img.loading = 'lazy';
    img.style.cssText = 'width:100%;height:140px;object-fit:cover;border-radius:10px;';
    const cap = document.createElement('p');
    cap.style.cssText = 'font-size:0.78rem;margin:0.5rem 0 0;color:var(--text-secondary);';
    cap.textContent = d.cap;
    const tag = document.createElement('p');
    tag.style.cssText = 'font-size:0.68rem;color:#888;';
    tag.textContent = d.tag;
    card.appendChild(img);
    card.appendChild(cap);
    card.appendChild(tag);
    host.appendChild(card);
  });
}

function renderGallerySnapshot(snap) {
  const host = document.getElementById('memberGalleryGrid');
  if (!host) return;
  host.innerHTML = '';
  if (snap.empty) {
    renderDemoGalleryCards(host);
    return;
  }
  snap.forEach((doc) => {
    const d = doc.data();
    const card = document.createElement('div');
    card.className = 'platform-card';
    card.style.padding = '0.65rem';
    const img = document.createElement('img');
    const url = typeof d.photoUrl === 'string' && d.photoUrl.startsWith('https') ? d.photoUrl : '';
    if (url) {
      img.src = url;
      img.alt = '';
      img.loading = 'lazy';
      img.style.cssText = 'width:100%;height:140px;object-fit:cover;border-radius:10px;';
    }
    const cap = document.createElement('p');
    cap.style.cssText = 'font-size:0.78rem;margin:0.5rem 0 0;color:var(--text-secondary);';
    cap.textContent = d.caption || '';
    const tag = document.createElement('p');
    tag.style.cssText = 'font-size:0.68rem;color:#888;';
    tag.textContent = d.productTag || '';
    card.appendChild(img);
    card.appendChild(cap);
    card.appendChild(tag);
    host.appendChild(card);
  });
}

function subscribeGallery() {
  const fb = getFirebase();
  fb.firestore()
    .collection('memberGallery')
    .orderBy('createdAt', 'desc')
    .limit(24)
    .onSnapshot(
      renderGallerySnapshot,
      () => {
        fb.firestore()
          .collection('memberGallery')
          .limit(24)
          .get()
          .then((q) => renderGallerySnapshot(q));
      }
    );
}

async function uploadLockerFile(ev) {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  if (getCommunityTier() !== 'professional') {
    alert('Encrypted locker uploads are for the Professional tier.');
    return;
  }
  const pass = document.getElementById('lockerPassphrase');
  const pw = pass && pass.value;
  if (!pw || pw.length < 8) {
    alert('Enter a strong passphrase (8+ characters) used to encrypt this file locally before upload.');
    return;
  }
  const fb = getFirebase();
  const u = fb.auth().currentUser;
  if (!u) {
    alert('Sign in to use your locker.');
    return;
  }
  try {
    const encBlob = await encryptToBlob(file, pw);
    const metaId = `${Date.now()}`;
    const path = `users/${u.uid}/locker/${metaId}.enc`;
    const ref = fb.storage().ref(path);
    await ref.put(encBlob);
    const FV = fb.firestore && fb.firestore.FieldValue;
    await fb
      .firestore()
      .collection('users')
      .doc(u.uid)
      .collection('locker')
      .doc(metaId)
      .set({
        fileLabel: file.name.slice(0, 200),
        storagePath: path,
        encrypted: true,
        createdAt: FV ? FV.serverTimestamp() : new Date().toISOString()
      });
    ev.target.value = '';
    pass.value = '';
    alert('Encrypted file stored in your private locker (server stores ciphertext only).');
    loadLockerList();
  } catch (e) {
    console.error(e);
    alert(e.message || String(e));
  }
}

async function loadLockerList() {
  const fb = getFirebase();
  const u = fb.auth && fb.auth() ? fb.auth().currentUser : null;
  const host = document.getElementById('lockerFileList');
  if (!host) return;
  if (!u) {
    host.innerHTML = '<li>Sign in to load your locker list.</li>';
    return;
  }
  if (getCommunityTier() !== 'professional') {
    host.innerHTML = '<li>Upgrade to Professional for a private encrypted locker.</li>';
    return;
  }
  host.innerHTML = '<li>Loading…</li>';
  try {
    const snap = await fb.firestore().collection('users').doc(u.uid).collection('locker').limit(30).get();
    host.innerHTML = '';
    const rows = [];
    snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
    rows.sort((a, b) => {
      const ta =
        a.createdAt && a.createdAt.toMillis
          ? a.createdAt.toMillis()
          : a.createdAt && a.createdAt.seconds
            ? a.createdAt.seconds * 1000
            : 0;
      const tb =
        b.createdAt && b.createdAt.toMillis
          ? b.createdAt.toMillis()
          : b.createdAt && b.createdAt.seconds
            ? b.createdAt.seconds * 1000
            : 0;
      return tb - ta;
    });
    if (!rows.length) {
      host.innerHTML = '<li>No files yet.</li>';
      return;
    }
    rows.slice(0, 20).forEach((row) => {
      const li = document.createElement('li');
      li.textContent = row.fileLabel || row.id;
      host.appendChild(li);
    });
  } catch (e) {
    console.error(e);
    host.innerHTML =
      '<li>Could not refresh locker list. Check your connection or try again in a moment.</li>';
  }
}

function wireCommunity() {
  if (window.__craftCommunityWired) return;
  window.__craftCommunityWired = true;
  wireTierCards();
  loadPollMeta().catch(() => {});
  refreshVoteCounts().catch(() => {});
  loadThemePollMeta().catch(() => {});
  refreshThemeVoteCounts().catch(() => {});
  loadTechniqueWiki().catch(() => {});

  const up = document.getElementById('galleryFileInput');
  if (up) up.addEventListener('change', uploadGalleryPhoto);

  OPTION_DEF.forEach((o) => {
    const btn = document.getElementById(`voteBtn-${o.id}`);
    if (btn) btn.addEventListener('click', () => submitVote(o.id));
  });

  THEME_OPTIONS.forEach((o) => {
    const btn = document.getElementById(`voteBtn-theme-${o.id}`);
    if (btn) btn.addEventListener('click', () => submitThemeVote(o.id));
  });

  const wikiBtn = document.getElementById('wikiSubmitBtn');
  if (wikiBtn) wikiBtn.addEventListener('click', () => submitWikiTip().catch(() => {}));

  const sug = document.getElementById('designPollSuggestBtn');
  if (sug) sug.addEventListener('click', submitSuggestion);

  const lockerIn = document.getElementById('lockerFileInput');
  if (lockerIn) lockerIn.addEventListener('change', uploadLockerFile);

  const fb = getFirebase();
  if (fb.auth) {
    fb.auth().onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const doc = await fb.firestore().collection('users').doc(user.uid).get();
          const t = doc.data() && doc.data().communityTier;
          if (t && ['beginner', 'standard', 'professional'].indexOf(t) >= 0) {
            localStorage.setItem('communityTier', t);
          }
        } catch (e) {}
      }
      wireTierCards();
      loadLockerList().catch(() => {});
    });
  }

  try {
    subscribeGallery();
  } catch (e) {
    console.warn('Gallery subscription', e);
  }

  const lockerRefresh = document.getElementById('communityRefreshLocker');
  if (lockerRefresh) {
    lockerRefresh.addEventListener('click', () => {
      loadLockerList().catch((err) => console.error(err));
    });
  }
}

function bootCommunity() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireCommunity, { once: true });
  } else {
    wireCommunity();
  }
}

bootCommunity();
