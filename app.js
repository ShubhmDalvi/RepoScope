/* =========================
   RepoScope — app.js
   ========================= */

/** Elements */
const hero = document.getElementById('hero');
const results = document.getElementById('results');
const repoMeta = document.getElementById('repoMeta');
const treeWrap = document.getElementById('treeWrap');
const footnote = document.getElementById('footnote');

const searchForm = document.getElementById('searchForm');
const repoInput = document.getElementById('repoInput');
const searchBtn = document.getElementById('searchBtn');

const loader = document.getElementById('loader');
const loaderText = document.getElementById('loaderText');
const toast = document.getElementById('toast');

const collapseAllBtn = document.getElementById('collapseAll');
const expandAllBtn = document.getElementById('expandAll');
const backHomeBtn = document.getElementById('backHome');

const bgA = document.getElementById('bgA');
const bgB = document.getElementById('bgB');

/* =========================
   Animated dark gradient background
   ========================= */
function randomDarkColor() {
  const h = Math.floor(Math.random() * 360);
  const s = 50 + Math.floor(Math.random() * 40);
  const v = 18 + Math.floor(Math.random() * 20);
  return hsvToRgbCss(h, s / 100, v / 100);
}
function hsvToRgbCss(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r=0,g=0,b=0;
  if (h < 60) [r,g,b] = [c,x,0];
  else if (h < 120) [r,g,b] = [x,c,0];
  else if (h < 180) [r,g,b] = [0,c,x];
  else if (h < 240) [r,g,b] = [0,x,c];
  else if (h < 300) [r,g,b] = [x,0,c];
  else [r,g,b] = [c,0,x];
  const R = Math.round((r + m) * 255);
  const G = Math.round((g + m) * 255);
  const B = Math.round((b + m) * 255);
  return `rgb(${R}, ${G}, ${B})`;
}

function randomDarkRGB() {
  const h = Math.floor(Math.random() * 360);
  const s = 55 + Math.floor(Math.random() * 35); // 55–90% saturation
  const v = 22 + Math.floor(Math.random() * 18); // 22–40% value (dark but visible)
  // hsv -> rgb
  const c = (v/100) * (s/100);
  const x = c * (1 - Math.abs(((h/60) % 2) - 1));
  const m = (v/100) - c;
  let r=0,g=0,b=0;
  if (h < 60) [r,g,b] = [c,x,0];
  else if (h < 120) [r,g,b] = [x,c,0];
  else if (h < 180) [r,g,b] = [0,c,x];
  else if (h < 240) [r,g,b] = [0,x,c];
  else if (h < 300) [r,g,b] = [x,0,c];
  else [r,g,b] = [c,0,x];
  const R = Math.round((r + m) * 255);
  const G = Math.round((g + m) * 255);
  const B = Math.round((b + m) * 255);
  return [R, G, B];
}


function paintGradient(el) {
  // three dark hues, each with a bit of alpha so blends are smooth (no banding)
  const [r1,g1,b1] = randomDarkRGB();
  const [r2,g2,b2] = randomDarkRGB();
  const [r3,g3,b3] = randomDarkRGB();

  const c1 = `rgba(${r1}, ${g1}, ${b1}, 0.45)`;
  const c2 = `rgba(${r2}, ${g2}, ${b2}, 0.38)`;
  const c3 = `rgba(${r3}, ${g3}, ${b3}, 0.32)`;

  // large, soft radial spots + a super soft vignette + base linear
  el.style.background = `
    radial-gradient(1600px 1200px at 20% 25%, ${c1} 0%, rgba(0,0,0,0) 72%),
    radial-gradient(1500px 1100px at 78% 78%, ${c2} 0%, rgba(0,0,0,0) 72%),
    radial-gradient(1200px 1000px at 30% 80%, ${c3} 0%, rgba(0,0,0,0) 68%),
    radial-gradient(1200px 900px at 50% 50%, rgba(0,0,0,0.25), rgba(0,0,0,0) 70%),
    linear-gradient(120deg, #0a0f12 0%, #0b0f14 100%)
  `;
}

let onA = true;
function cycleGradient() {
  const top = onA ? bgB : bgA;
  paintGradient(top);
  requestAnimationFrame(() => {
    if (onA) { bgB.style.opacity = 0.9; bgA.style.opacity = 0; }
    else { bgA.style.opacity = 0.9; bgB.style.opacity = 0; }
    onA = !onA;
  });
}
paintGradient(bgA); paintGradient(bgB); bgA.style.opacity = 0.9;
setInterval(cycleGradient, 6000);

/* =========================
   UX helpers
   ========================= */
// Ensures the loader is visible for at least MIN_MS so it shows on fast desktop responses
let __loaderShownAt = 0;
const MIN_LOADER_MS = 400;

function showLoader(show, message) {
  if (message) loaderText.textContent = message;

  if (show) {
    __loaderShownAt = performance.now();
    loader.classList.add('active');
    loader.setAttribute('aria-hidden', 'false');
    // force reflow so transition always triggers in some desktop browsers
    void loader.offsetHeight;
    return;
  }

  const elapsed = performance.now() - __loaderShownAt;
  const remaining = Math.max(0, MIN_LOADER_MS - elapsed);

  const hide = () => {
    loader.classList.remove('active');
    loader.setAttribute('aria-hidden', 'true');
  };

  if (remaining > 0) {
    setTimeout(hide, remaining);
  } else {
    hide();
  }
}

function showToast(msg, timeout = 3500) {
  toast.textContent = msg;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), timeout);
}
function parseRepoInput(text) {
  try {
    text = text.trim();
    if (!text) return null;

    if (!text.includes('://') && text.split('/').length === 2) {
      const [owner, repo] = text.split('/');
      return { owner, repo, branch: null };
    }

    const url = new URL(text);
    if (url.hostname !== 'github.com') return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;

    let owner = parts[0];
    let repo = parts[1].replace(/\.git$/,'');
    let branch = null;

    const treeIdx = parts.indexOf('tree');
    if (treeIdx > -1 && parts[treeIdx + 1]) {
      branch = decodeURIComponent(parts[treeIdx + 1]);
    }
    if (!branch && url.hash) branch = decodeURIComponent(url.hash.replace(/^#/, ''));

    return { owner, repo, branch };
  } catch {
    return null;
  }
}

/* =========================
   GitHub API calls
   ========================= */
const GH = {
  async repoMeta(owner, repo) {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!r.ok) throw await asApiError(r);
    return r.json();
  },
  async getTree(owner, repo, sha) {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(sha)}?recursive=1`);
    if (!r.ok) throw await asApiError(r);
    return r.json();
  }
};
async function asApiError(res) {
  let payload = {};
  try { payload = await res.json(); } catch {}
  const msg = payload && payload.message ? payload.message : res.statusText;
  return new Error(`${res.status} ${msg}`);
}

/* =========================
   Build hierarchy from flat tree
   ========================= */
function buildHierarchy(tree) {
  const root = { name: '', type: 'tree', children: new Map() };
  for (const item of tree) {
    const parts = item.path.split('/');
    let node = root;
    parts.forEach((part, idx) => {
      const isLeaf = idx === parts.length - 1;
      if (isLeaf) {
        if (item.type === 'tree') {
          node.children.set(part, { name: part, type: 'tree', children: new Map() });
        } else {
          node.children.set(part, { name: part, type: 'blob', size: item.size || 0 });
        }
      } else {
        if (!node.children.has(part)) {
          node.children.set(part, { name: part, type: 'tree', children: new Map() });
        }
        node = node.children.get(part);
      }
    });
  }
  return root;
}

/* --- Mobile-only compaction: collapse linear folder chains into one label --- */
function compactLinearChains(node) {
  // Only apply on mobile widths; desktop remains unchanged.
  if (window.innerWidth > 768) return node;
  if (!node || !node.children) return node;

  const newChildren = new Map();
  for (const [name, child] of node.children) {
    if (child.type === 'tree') {
      let chainName = name;
      let curr = child;
      // Walk single-child folder chains
      while (curr.type === 'tree' && curr.children && curr.children.size === 1) {
        const [[nextName, nextChild]] = [...curr.children];
        if (!nextChild || nextChild.type !== 'tree') break;
        chainName += '/' + nextName;
        curr = nextChild;
      }
      // Recurse inside the final node
      const compacted = compactLinearChains(curr);
      // Preserve the subtree at the chain end, but display as a single label
      newChildren.set(chainName, { ...compacted, name: chainName });
    } else {
      newChildren.set(name, child);
    }
  }
  node.children = newChildren;
  return node;
}

function mapToSortedArray(node) {
  const arr = [...node.children.values()];
  const folders = arr.filter(n => n.type === 'tree').sort((a,b)=>a.name.localeCompare(b.name));
  const files = arr.filter(n => n.type === 'blob').sort((a,b)=>a.name.localeCompare(b.name));
  return [...folders, ...files];
}

/* =========================
   Render tree
   ========================= */
function renderTree(node, path = '') {
  const ul = document.createElement('ul');
  ul.setAttribute('role', 'group');

  for (const child of mapToSortedArray(node)) {
    const li = document.createElement('li');
    li.setAttribute('role', 'treeitem');
    li.setAttribute('aria-expanded', child.type === 'tree' ? 'false' : 'true');

    const row = document.createElement('div');
    row.className = 'node';

    const toggle = document.createElement('div');
    toggle.className = 'toggle';
    toggle.title = child.type === 'tree' ? 'Expand / collapse' : '';
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('tabindex', child.type === 'tree' ? '0' : '-1');
    toggle.innerHTML = child.type === 'tree' ? chevron('right') : spacer();
    row.appendChild(toggle);

    const name = document.createElement('div');
    name.className = 'name';
    name.innerHTML = `${icon(child)}<span>${sanitize(child.name)}</span>`;
    row.appendChild(name);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = child.type === 'blob' ? formatSize(child.size) : '';
    row.appendChild(meta);

    li.appendChild(row);

    if (child.type === 'tree') {
      const subtree = renderTree(child, path + '/' + child.name);
      subtree.hidden = true;
      li.appendChild(subtree);

      const toggleAction = () => {
        const expanded = li.getAttribute('aria-expanded') === 'true';
        li.setAttribute('aria-expanded', String(!expanded));
        subtree.hidden = expanded;
        toggle.innerHTML = expanded ? chevron('right') : chevron('down');
      };

      toggle.addEventListener('click', toggleAction);
      toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleAction(); }
      });
      name.addEventListener('click', toggleAction);
      name.style.cursor = 'pointer';
    }

    ul.appendChild(li);
  }
  ul.className = 'tree';
  return ul;
}

function icon(node) {
  if (node.type === 'tree') {
    return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v1H3V6zm0 3h18v7a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/></svg>`;
  }
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm1 7V3.5L19.5 8H15z"/></svg>`;
}
function chevron(dir) {
  if (dir === 'down') {
    return `<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>`;
  }
  return `<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M10 17l5-5-5-5z"/></svg>`;
}
function spacer(){ return `<span style="display:inline-block;width:16px;height:16px;"></span>`; }
function sanitize(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
function formatSize(bytes=0){
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  const units = ['B','KB','MB','GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length-1){ bytes /= 1024; i++; }
  return `${bytes.toFixed(bytes >= 1024 ? 1 : 0)} ${units[i]}`;
}

/* =========================
   High-level flow
   ========================= */
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const parsed = parseRepoInput(repoInput.value);
  if (!parsed) return showToast('Please paste a valid GitHub repo URL, or format owner/repo.');

  const { owner, repo, branch } = parsed;
  await loadRepository(owner, repo, branch);
});

backHomeBtn.addEventListener('click', () => {
  results.hidden = true;
  hero.style.display = 'grid';
  repoInput.focus();
  history.replaceState({}, '', location.pathname);
});

collapseAllBtn.addEventListener('click', () => setAllFolders(false));
expandAllBtn.addEventListener('click', () => setAllFolders(true));

async function loadRepository(owner, repo, branchHint) {
  showLoader(true, 'Fetching the repo tree…');
  try {
    const meta = await GH.repoMeta(owner, repo);
    const defaultBranch = meta.default_branch;
    const branch = branchHint || defaultBranch;

    const treeData = await GH.getTree(owner, repo, branch);

    // Build hierarchy and compact linear folder chains (mobile-only)
    const root = buildHierarchy(treeData.tree || []);
    compactLinearChains(root);

    treeWrap.innerHTML = '';
    const treeEl = renderTree(root);
    treeWrap.appendChild(treeEl);

    hero.style.display = 'none';
    results.hidden = false;

    const repoUrl = `https://github.com/${owner}/${repo}`;
    repoMeta.innerHTML = `
      <span class="name">
        <a href="${repoUrl}" target="_blank" rel="noopener" style="color: var(--text); text-decoration: none; border-bottom: 1px dashed rgba(255,255,255,0.25)">${sanitize(owner)}/${sanitize(repo)}</a>
      </span>
      <span class="branch">branch: ${sanitize(branch)}</span>
      <span class="branch" title="Items returned by GitHub API">items: ${treeData.tree ? treeData.tree.length : 0}</span>
    `;

    footnote.innerHTML = '';
    if (treeData.truncated) {
      const warn = document.createElement('div');
      warn.className = 'hint';
      warn.innerHTML = `⚠️ GitHub returned a truncated tree for this very large repo. Some files/folders may be omitted.`;
      footnote.appendChild(warn);
    }

    // Mobile-only: auto-collapse massive repos to avoid overwhelming scroll
    if (window.innerWidth <= 768 && (treeData.tree?.length || 0) > 2000) {
      setAllFolders(false);
      showToast('Large repo detected — folders collapsed for mobile readability.');
    }

    history.replaceState({}, '', `#${owner}/${repo}#${encodeURIComponent(branch)}`);
  } catch (err) {
    console.error(err);
    let msg = String(err.message || err);
    if (msg.includes('404')) msg = 'Repository not found (or private).';
    if (msg.includes('403')) msg = 'Rate limit reached. Try again later or add a GitHub token in code.';
    showToast(`Error: ${msg}`);
  } finally {
    showLoader(false);
  }
}

/* Expand / collapse helpers */
function setAllFolders(expand) {
  const items = treeWrap.querySelectorAll('li[aria-expanded]');
  items.forEach(li => {
    const subtree = li.querySelector(':scope > ul');
    const toggle = li.querySelector(':scope .toggle');
    if (!subtree || !toggle) return;
    li.setAttribute('aria-expanded', String(expand));
    subtree.hidden = !expand;
    toggle.innerHTML = expand ? chevron('down') : chevron('right');
  });
}

/* Initial page-load splash */
window.addEventListener('DOMContentLoaded', () => {
  const hash = decodeURIComponent(location.hash || '').replace(/^#/, '');
  if (!hash) {
    showLoader(true, 'Booting the repo graph…');
    setTimeout(() => showLoader(false), 900);
    return;
  }

  const parts = hash.split('#');
  const repoPart = parts[0] || '';
  const branch = parts[1] || null;
  const [owner, repo] = repoPart.split('/');
  if (owner && repo) {
    repoInput.value = `https://github.com/${owner}/${repo}${branch ? `#${branch}` : ''}`;
    loadRepository(owner, repo, branch);
  }
});

/* Optional: GitHub token for higher rate limits (local dev only) */
// const GITHUB_TOKEN = ''; // put token here for local testing ONLY
// async function authedFetch(url) {
//   return fetch(url, { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } });
// }
