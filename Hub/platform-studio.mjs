/**
 * PropArt™ Creator Space — Platform studio (parametric SVG→3D, AR GLB, ledger, Stripe wallets)
 * Depends on: global Stripe (optional), firebase (optional), addToCart, switchTab
 */
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const EDGE_BEVEL_MM = 0.4;
const WALL_DEPTH_MM = 1.2;
const HANDLE_DEPTH_MM = 5;

let svgText = '';
let lastQuote = 0;
let lastStlBlob = null;
let lastFileHashHex = '';
let paymentRequest = null;
let stripeElements = null;
let prButton = null;

function getTargetWidthMm() {
  const el = document.getElementById('platformSvgWidthMm');
  return el ? parseFloat(el.value, 10) || 40 : 40;
}

function getFirebase() {
  return typeof firebase !== 'undefined' ? firebase : window.firebase;
}

async function sha256HexFromBuffer(buf) {
  const h = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(h))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function buildMeshesFromSvg(svgString) {
  const loader = new SVGLoader();
  const data = loader.parse(svgString);
  const paths = data.paths;
  if (!paths || paths.length === 0) {
    throw new Error('No vector paths found in SVG. Use outlines (not embedded photos).');
  }

  const extrudeSettings = {
    depth: WALL_DEPTH_MM,
    bevelEnabled: true,
    bevelThickness: EDGE_BEVEL_MM * 0.5,
    bevelSize: EDGE_BEVEL_MM * 0.45,
    bevelOffset: 0,
    bevelSegments: 2,
    curveSegments: 12
  };

  const group = new THREE.Group();
  let pathLenEst = 0;

  paths.forEach((path) => {
    pathLenEst += path.subPaths ? path.subPaths.length * 10 : 10;
    const shapes = SVGLoader.createShapes(path);
    shapes.forEach((shape) => {
      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const mat = new THREE.MeshStandardMaterial({ color: 0x9b7ebd, metalness: 0.2, roughness: 0.45 });
      const mesh = new THREE.Mesh(geom, mat);
      group.add(mesh);
    });
  });

  const box = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxW = Math.max(size.x, 0.001);
  const targetW = getTargetWidthMm();
  const scale = targetW / maxW;
  group.scale.set(scale, -scale, scale);
  group.updateMatrixWorld(true);

  const box2 = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box2.getCenter(center);
  group.position.sub(center);
  group.position.y += box2.max.y - center.y;
  group.updateMatrixWorld(true);

  const box3 = new THREE.Box3().setFromObject(group);
  const hx = Math.max(box3.max.x - box3.min.x, 0.01);
  const hz = Math.max(box3.max.z - box3.min.z, 0.01);
  const handleGeom = new THREE.BoxGeometry(hx * 0.92, HANDLE_DEPTH_MM, hz * 0.92);
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x6dd5c3, metalness: 0.15, roughness: 0.5 });
  const handle = new THREE.Mesh(handleGeom, handleMat);
  const handleY = box3.min.y - HANDLE_DEPTH_MM / 2;
  handle.position.set((box3.min.x + box3.max.x) / 2, handleY, (box3.min.z + box3.max.z) / 2);
  group.add(handle);

  group.updateMatrixWorld(true);

  const areaMm2 = hx * hz * scale * scale;
  const quote = Math.max(9, 12 + areaMm2 * 0.012 + pathLenEst * 0.08);

  return { group, quote, areaMm2, pathLenEst };
}

async function exportMergedStl(group) {
  const geoms = [];
  group.traverse((obj) => {
    if (obj.isMesh && obj.geometry) {
      obj.updateMatrixWorld(true);
      const base = obj.geometry.clone();
      base.applyMatrix4(obj.matrixWorld);
      const g = base.index ? base.toNonIndexed() : base;
      Object.keys(g.attributes || {}).forEach((name) => {
        if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
      });
      if (!g.getAttribute('normal')) g.computeVertexNormals();
      geoms.push(g);
    }
  });
  if (geoms.length === 0) throw new Error('Nothing to export');
  const merged = mergeGeometries(geoms, false);
  if (!merged) {
    throw new Error('Could not merge generated geometry. Try a simpler SVG path set.');
  }
  merged.computeVertexNormals();
  const mesh = new THREE.Mesh(merged, new THREE.MeshStandardMaterial());
  const exporter = new STLExporter();
  const data = exporter.parse(mesh, { binary: true });
  return new Blob([data], { type: 'application/octet-stream' });
}

async function exportGlb(group) {
  const exporter = new GLTFExporter();
  const gltf = await exporter.parseAsync(group, { binary: true });
  return new Blob([gltf], { type: 'model/gltf-binary' });
}

function drawSvgPreview(svgString) {
  const canvas = document.getElementById('platformPreviewCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#f0eef5';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(109,213,195,0.35)';
  for (let x = 0; x < w; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  const img = new Image();
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  img.onload = () => {
    ctx.drawImage(img, 16, 16, w - 32, h - 32);
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    ctx.fillStyle = '#5a4a6e';
    ctx.font = '14px system-ui';
    ctx.fillText('SVG loaded (preview failed — still can build 3D)', 16, h / 2);
  };
  img.src = url;
}

function updateClayGuide() {
  const brand = document.getElementById('platformClayBrand')?.value || 'premo';
  const complexity = parseInt(document.getElementById('platformComplexity')?.value || '3', 10);
  const out = document.getElementById('platformClayGuideOut');
  if (!out) return;

  const tips = {
    premo: 'Premo is medium-firm with good memory. Use a light cornstarch dust on complex cutters; release straight down, then roll.',
    fimo: 'Fimo Professional is firmer and springy. Less cornstarch; watch for edge chipping on deep undercuts — favor simpler curves at high complexity.',
    souffle: 'Soufflé is softer and more compressible. More release powder on intricate shapes; avoid aggressive twisting on removal.',
    cernit: 'Cernit can be very firm depending on batch. Warm the slab slightly; use minimal powder and steady vertical lift.',
    kato: 'Kato is dense and firm. Excellent detail; use a sharp blade cleanup pass on the slab edge before lifting.'
  };

  const cx = ['Very simple outline', 'Gentle curves', 'Moderate detail', 'Tight corners / holes', 'Lace-like or nested cuts'][complexity - 1];
  out.innerHTML =
    `<strong>${tips[brand] || tips.premo}</strong><br/><br/>` +
    `<strong>Complexity ${complexity}/5:</strong> ${cx}. ` +
    (complexity >= 4
      ? 'Chill the slab 2–3 minutes for cleaner edges; consider a two-stage press.'
      : 'Standard press-and-release is usually enough.');
}

async function onBuild() {
  const status = document.getElementById('platformSvgStatus');
  if (!svgText) {
    if (status) status.textContent = 'Upload an SVG first.';
    return;
  }
  try {
    if (status) status.textContent = 'Building mesh…';
    const { group, quote, areaMm2 } = buildMeshesFromSvg(svgText);
    lastQuote = Math.round(quote * 100) / 100;

    lastStlBlob = await exportMergedStl(group);
    lastFileHashHex = await sha256HexFromBuffer(await lastStlBlob.arrayBuffer());

    const glbBlob = await exportGlb(group);
    const mv = document.getElementById('platformModelViewer');
    if (mv) {
      const old = mv.src;
      if (old && old.startsWith('blob:')) URL.revokeObjectURL(old);
      mv.src = URL.createObjectURL(glbBlob);
      mv.ar = true;
      mv.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
    }

    const hashEl = document.getElementById('platformHashOut');
    if (hashEl) {
      hashEl.style.display = 'block';
      hashEl.textContent = 'SHA-256 (STL): ' + lastFileHashHex;
    }

    const quoteBox = document.getElementById('platformQuoteBox');
    if (quoteBox) {
      quoteBox.style.display = 'block';
      quoteBox.innerHTML =
        `<strong>Instant quote (estimate):</strong> $${lastQuote.toFixed(2)} — includes digital prep review. ` +
        `Approx. plan area ~${areaMm2.toFixed(0)} mm² (scaled). ` +
        `Production print &amp; ship is quoted separately when you connect fulfillment.`;
    }

    document.getElementById('platformDownloadStlBtn').disabled = false;
    document.getElementById('platformAddQuoteCartBtn').disabled = false;
    document.getElementById('platformRegisterLedgerBtn').disabled = !getFirebase()?.auth?.()?.currentUser;

    if (status) status.textContent = '3D ready — AR preview updated. STL fingerprint recorded.';
    await updateStripePaymentRequest(lastQuote);

    try {
      if (typeof window.logFirstRun === 'function') {
        window.logFirstRun('platform_mesh_built', { quote: lastQuote, hash: lastFileHashHex.slice(0, 16) });
      }
    } catch (e) {}
  } catch (e) {
    console.error(e);
    if (status) status.textContent = 'Build failed: ' + (e.message || e);
    alert('Build failed: ' + (e.message || e));
  }
}

async function updateStripePaymentRequest(amountUsd) {
  const mount = document.getElementById('platformPaymentMount');
  if (!mount || typeof window.Stripe !== 'function') return;
  const pk = window.localStorage.getItem('CRAFT_STRIPE_PK') || '';
  if (!pk || !pk.startsWith('pk_')) {
    mount.innerHTML =
      '<p style="font-size:0.8rem;color:var(--text-secondary);margin:0;">Wallet buttons appear when a Stripe publishable key is set (see note below).</p>';
    return;
  }
  try {
    if (prButton) {
      prButton.unmount();
      prButton = null;
    }
    mount.innerHTML = '';
    const stripe = window.Stripe(pk);
    const cents = Math.max(50, Math.round(amountUsd * 100));
    paymentRequest = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: { label: 'Custom cutter (platform)', amount: cents },
      requestPayerName: true,
      requestPayerEmail: true
    });
    const result = await paymentRequest.canMakePayment();
    if (!result) {
      mount.innerHTML =
        '<p style="font-size:0.8rem;color:var(--text-secondary);">Apple Pay / Google Pay not available in this browser session.</p>';
      return;
    }
    stripeElements = stripe.elements();
    prButton = stripeElements.create('paymentRequestButton', {
      paymentRequest,
      style: { paymentRequestButton: { type: 'default', theme: 'dark', height: '48px' } }
    });
    paymentRequest.on('paymentmethod', async (ev) => {
      ev.complete('success');
      alert(
        'Wallet authorized (demo). Connect a server endpoint to capture this PaymentIntent securely. Amount: $' +
          (cents / 100).toFixed(2)
      );
    });
    prButton.mount('#platformPaymentMount');
  } catch (e) {
    console.warn(e);
    mount.innerHTML =
      '<p style="font-size:0.8rem;color:#c0392b;">Could not init Stripe wallets: ' + (e.message || e) + '</p>';
  }
}

async function onRegisterLedger() {
  const fb = getFirebase();
  const auth = fb?.auth?.();
  const db = fb?.firestore?.();
  if (!auth?.currentUser || !db) {
    alert('Sign in first (Profile), then register your certificate.');
    return;
  }
  if (!lastFileHashHex) {
    alert('Build a mesh first so we have an STL hash.');
    return;
  }
  try {
    const prevSnap = await db.collection('certificates').orderBy('createdAt', 'desc').limit(1).get();
    let parentHash = 'GENESIS';
    if (!prevSnap.empty) {
      const d = prevSnap.docs[0].data();
      parentHash = d.blockHash || d.fileHash || parentHash;
    }
    const blockData = new TextEncoder().encode(
      parentHash + '|' + lastFileHashHex + '|' + auth.currentUser.uid
    );
    const blockHash = await sha256HexFromBuffer(blockData);

    const fv = fb?.firestore?.FieldValue;
    await db.collection('certificates').add({
      fileHash: lastFileHashHex,
      parentHash,
      blockHash,
      ownerUid: auth.currentUser.uid,
      createdAt: fv ? fv.serverTimestamp() : new Date().toISOString(),
      product: 'custom-cutter-stl'
    });
    alert('Certificate registered. Block hash: ' + blockHash.slice(0, 24) + '…');
  } catch (e) {
    console.error(e);
    alert('Ledger error: ' + (e.message || e));
  }
}

function wireUi() {
  const inp = document.getElementById('platformSvgInput');
  const wRange = document.getElementById('platformSvgWidthMm');
  const wLabel = document.getElementById('platformSvgWidthLabel');
  if (wRange && wLabel) {
    wRange.addEventListener('input', () => {
      wLabel.textContent = wRange.value + ' mm';
    });
  }
  if (inp) {
    inp.addEventListener('change', (ev) => {
      const f = ev.target.files && ev.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        svgText = typeof reader.result === 'string' ? reader.result : '';
        const st = document.getElementById('platformSvgStatus');
        if (st) st.textContent = 'SVG loaded — tap "Build 3D & quote".';
        document.getElementById('platformBuildMeshBtn').disabled = false;
        drawSvgPreview(svgText);
      };
      reader.readAsText(f);
    });
  }
  const buildBtn = document.getElementById('platformBuildMeshBtn');
  if (buildBtn) buildBtn.addEventListener('click', onBuild);
  const dl = document.getElementById('platformDownloadStlBtn');
  if (dl) {
    dl.addEventListener('click', () => {
      if (!lastStlBlob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(lastStlBlob);
      a.download = 'propart-cutter.stl';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
  }
  const cartBtn = document.getElementById('platformAddQuoteCartBtn');
  if (cartBtn) {
    cartBtn.addEventListener('click', () => {
      if (typeof window.addToCart === 'function' && lastQuote > 0) {
        window.addToCart('Custom cutter — platform quote (STL)', lastQuote);
        if (typeof window.openCartPanel === 'function') window.openCartPanel();
      }
    });
  }
  const reg = document.getElementById('platformRegisterLedgerBtn');
  if (reg) reg.addEventListener('click', onRegisterLedger);

  ['platformClayBrand', 'platformComplexity'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', updateClayGuide);
  });
  updateClayGuide();
  updateStripePaymentRequest(0);
}

wireUi();

(function refreshRegisterBtn() {
  const fb = getFirebase();
  if (!fb?.auth) return;
  fb.auth().onAuthStateChanged(() => {
    const el = document.getElementById('platformRegisterLedgerBtn');
    if (!el) return;
    el.disabled = !(fb.auth().currentUser && lastFileHashHex);
  });
})();
