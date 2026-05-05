// === GLOBAL FUNCTION DEFINITIONS (Must be defined before HTML loads) ===
// Firebase Auth — resolve lazily so script.js can load before inline Firebase init (window.auth).
function getAuth() {
    try {
        if (typeof window !== 'undefined' && window.auth) return window.auth;
        if (typeof firebase !== 'undefined' && firebase.auth) return firebase.auth();
    } catch (e) {}
    return null;
}

/** Prefer window.auth / getAuth(), then firebase.auth() — avoids rare null currentUser mismatches. */
function getCurrentFirebaseUser() {
    try {
        const a = getAuth();
        if (a && a.currentUser) return a.currentUser;
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const u = firebase.auth().currentUser;
            if (u) return u;
        }
    } catch (e) {}
    return null;
}

/** Escape text for safe insertion into HTML templates (mitigates XSS from stored content). */
function escapeHtml(s) {
    const d = typeof document !== 'undefined' ? document.createElement('div') : null;
    if (!d) return String(s ?? '');
    d.textContent = String(s ?? '');
    return d.innerHTML;
}
window.escapeHtml = escapeHtml;

function safeHttpUrl(url) {
    const u = String(url || '').trim();
    return /^https?:\/\//i.test(u) ? u : '';
}
window.safeHttpUrl = safeHttpUrl;

// Newsletter storage
let newsletterSubscribers = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
let adminProducts = JSON.parse(localStorage.getItem('adminProducts') || '[]');
var adminBlogPosts = JSON.parse(localStorage.getItem('adminBlogPosts') || '[]');
(function seedCraftBlogV3() {
    try {
        if (typeof localStorage === 'undefined') return;
        if (localStorage.getItem('craftBlogSeedV3')) return;
        const hasSeedIds = adminBlogPosts.some(function (p) {
            return p && (p.id === 9001 || p.id === 9002 || p.id === 9003);
        });
        if (hasSeedIds) {
            localStorage.setItem('craftBlogSeedV3', '1');
            return;
        }
        const seed = [
            {
                id: 9001,
                title: 'Conditioning clay for crisp cane work',
                content:
                    'Start with a firm but workable blend. Warm small pieces in your hands before feeding through the pasta machine — never skip the gradual thin passes. Label your stacks by color family so you can rebuild blends months later without guesswork.',
                category: 'Technique',
                image:
                    'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=900&q=80',
                publishDate: new Date('2026-03-15').toISOString(),
                tags: 'cane,conditioning,polymer',
                isDraft: false,
                views: 42,
                likes: 7
            },
            {
                id: 9002,
                title: 'Studio lighting that flatters translucent blends',
                content:
                    'Cross-light your workbench with a neutral LED and a warmer fill. Translucent stacks read differently under warm vs cool light — photograph test slices before you commit to a final bake.',
                category: 'Studio',
                image:
                    'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=900&q=80',
                publishDate: new Date('2026-03-22').toISOString(),
                tags: 'lighting,photo,translucent',
                isDraft: false,
                views: 28,
                likes: 5
            },
            {
                id: 9003,
                title: 'Shipping earrings without springing your findings',
                content:
                    'Sandwich cards between two rigid panels inside a bubble mailer. Add a tiny silica pouch if you ship humid climates — it keeps findings from tarnishing before unboxing.',
                category: 'Business',
                image:
                    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=900&q=80',
                publishDate: new Date('2026-04-01').toISOString(),
                tags: 'shipping,earrings,packaging',
                isDraft: false,
                views: 19,
                likes: 3
            }
        ];
        adminBlogPosts = seed.concat(adminBlogPosts);
        localStorage.setItem('adminBlogPosts', JSON.stringify(adminBlogPosts));
        localStorage.setItem('craftBlogSeedV3', '1');
    } catch (e) {}
})();
let currentEditingBlogId = null;

// Newsletter Functions
function closeNewsletterModal() {
    const modal = document.getElementById('newsletterModal');
    if (modal) modal.style.display = 'none';
}

function notifyInline(message, hint) {
    if (typeof window.showSiteNotice === 'function') {
        window.showSiteNotice(message, hint);
        return;
    }
    try { console.info(message, hint || ''); } catch (e) {}
}

function subscribeNewsletter() {
    const email = (document.getElementById('newsletterEmailModal') || document.getElementById('newsletterEmail') || document.getElementById('newsletterEmailHome'))?.value.trim();
    const name = (document.getElementById('newsletterNameModal') || document.getElementById('newsletterName'))?.value.trim();
    
    if (!email || !email.includes('@')) {
        notifyInline('Please enter a valid email address.');
        return;
    }
    
    if (newsletterSubscribers.find(sub => sub.email === email)) {
        notifyInline('You are already subscribed.');
        return;
    }
    
    newsletterSubscribers.push({
        email: email,
        name: name || 'Anonymous',
        date: new Date().toISOString()
    });
    
    localStorage.setItem('newsletterSubscribers', JSON.stringify(newsletterSubscribers));

    try {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            firebase.firestore().collection('newsletterSubscribers').add({
                email: email,
                name: name || '',
                subscribedAt: firebase.firestore.FieldValue.serverTimestamp(),
                source: 'site_modal'
            });
        }
    } catch (e) {}

    try {
        if (typeof window.logFirstRun === 'function') {
            window.logFirstRun('newsletter_subscribe', { source: 'modal_or_form' });
        }
    } catch (e) {}
    
    notifyInline('Successfully subscribed!', 'Check your email for confirmation.');
    closeNewsletterModal();
    
    // Clear inputs
    const emailInput = document.getElementById('newsletterEmailModal') || document.getElementById('newsletterEmail') || document.getElementById('newsletterEmailHome');
    const nameInput = document.getElementById('newsletterNameModal') || document.getElementById('newsletterName');
    if (emailInput) emailInput.value = '';
    if (nameInput) nameInput.value = '';
}

function wireContactTabForm() {
    const form = document.getElementById('contactTabForm');
    if (!form || form.getAttribute('data-contact-wired') === '1') return;
    form.setAttribute('data-contact-wired', '1');
    form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        if (location.protocol === 'file:') {
            notifyInline(
                'Use the published site to send this form (Firestore and API calls do not work from a local file preview).',
                ''
            );
            return;
        }
        const name = ((document.getElementById('contactFormName') || {}).value || '').trim();
        const email = ((document.getElementById('contactFormEmail') || {}).value || '').trim();
        const message = ((document.getElementById('contactMessage') || {}).value || '').trim();
        const faxEl = document.getElementById('contactFormFax');
        const fax = faxEl ? String(faxEl.value || '').trim() : '';
        if (!name || !email || !message) {
            notifyInline('Please fill in name, email, and message.', '');
            return;
        }
        var btn = form.querySelector('.cta-button[type="submit"]');
        if (btn) {
            btn.disabled = true;
            btn.dataset._prevHtml = btn.innerHTML;
            btn.innerHTML = '<i class=\"fas fa-spinner fa-spin\"></i> Sending…';
        }
        fetch('/api/submitSiteContact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ name, email, message, fax })
        })
            .then(function (r) {
                return r.text().then(function (t) {
                    var body = {};
                    if (t) {
                        try {
                            body = JSON.parse(t);
                        } catch (e) {
                            body = { error: t.slice(0, 200) };
                        }
                    }
                    return { ok: r.ok, body: body };
                });
            })
            .then(function (res) {
                if (!res.ok) {
                    notifyInline(res.body && res.body.error ? String(res.body.error) : 'Could not send.', '');
                    return;
                }
                notifyInline('Message sent.', 'Thank you—we will get back when we can.');
                try {
                    form.reset();
                } catch (e) {}
            })
            .catch(function () {
                notifyInline('Network error.', 'Try again in a moment or email from the inbox link in FAQ.');
            })
            .finally(function () {
                if (btn) {
                    btn.disabled = false;
                    if (btn.dataset._prevHtml !== undefined) {
                        btn.innerHTML = btn.dataset._prevHtml;
                    }
                }
            });
    });
}

// Admin Panel Functions (Firebase owner only — see window.isPegasusOpsAdmin in index.html)
// Exposed on window for inline onclick in index.html (must resolve after this file loads).
function openAdminPanel() {
    if (typeof window.isPegasusOpsAdmin !== 'function' || !window.isPegasusOpsAdmin()) {
        var m = document.getElementById('adminLoginModal');
        if (m) m.style.display = 'flex';
        return;
    }
    if (typeof window.syncMembershipTierWithSession === 'function') window.syncMembershipTierWithSession();
    if (typeof window.syncAdminPaywallOverlays === 'function') window.syncAdminPaywallOverlays();
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'flex';
        loadAdminProducts();
        loadAdminBlogPosts();
        loadSubscribers();
    }
}

function closeAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (panel) panel.style.display = 'none';
}

function addProduct() {
    const name = document.getElementById('newProductName').value.trim();
    const price = parseFloat(document.getElementById('newProductPrice').value);
    const desc = document.getElementById('newProductDesc').value.trim();
    const image = document.getElementById('newProductImage').value.trim();
    
    if (!name || !price || !desc) {
        notifyInline('Please fill in all required fields.');
        return;
    }
    
    const product = {
        id: Date.now(),
        name: name,
        price: price,
        description: desc,
        image: image || '🎨',
        dateAdded: new Date().toISOString()
    };
    
    adminProducts.push(product);
    localStorage.setItem('adminProducts', JSON.stringify(adminProducts));
    
    document.getElementById('newProductName').value = '';
    document.getElementById('newProductPrice').value = '';
    document.getElementById('newProductDesc').value = '';
    document.getElementById('newProductImage').value = '';
    
    loadAdminProducts();
    notifyInline('Product added successfully.');
}

function loadAdminProducts() {
    const container = document.getElementById('productsList');
    if (!container) return;
    
    container.innerHTML = adminProducts.map(product => `
        <div style="background:#fff;padding:15px;border-radius:8px;border:1px solid #ddd;display:flex;justify-content:space-between;align-items:center;">
            <div>
                <strong>${escapeHtml(product.name)}</strong> - $${Number(product.price).toFixed(2)}<br>
                <small style="color:#666;">${escapeHtml(product.description)}</small>
            </div>
            <button onclick="deleteProduct(${product.id})" style="background:#e74c3c;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;">Delete</button>
        </div>
    `).join('');
}

function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    adminProducts = adminProducts.filter(p => p.id !== id);
    localStorage.setItem('adminProducts', JSON.stringify(adminProducts));
    loadAdminProducts();
}

function loadAdminBlogPosts() {
    const container = document.getElementById('adminBlogList');
    if (!container) return;
    
    if (adminBlogPosts.length === 0) {
        container.innerHTML = '<p style="color:#666;">No blog posts yet. Create your first post!</p>';
        return;
    }
    
    container.innerHTML = adminBlogPosts.map(post => `
        <div style="background:#fff;padding:15px;border-radius:8px;border:1px solid #ddd;">
            <h4 style="margin:0 0 10px 0;">${escapeHtml(post.title)}</h4>
            <p style="color:#666;margin:5px 0;">${escapeHtml(post.content.substring(0, 100))}...</p>
            <small style="color:#999;">Published: ${new Date(post.publishDate).toLocaleDateString()}</small>
            <div style="margin-top:10px;display:flex;gap:10px;">
                <button onclick="openBlogEditor(${post.id})" style="background:var(--accent-color);color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;">Edit</button>
                <button onclick="deleteBlogPost(${post.id})" style="background:#e74c3c;color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;">Delete</button>
            </div>
        </div>
    `).join('');
}

function deleteBlogPost(id) {
    if (!confirm('Delete this blog post?')) return;
    adminBlogPosts = adminBlogPosts.filter(p => p.id !== id);
    localStorage.setItem('adminBlogPosts', JSON.stringify(adminBlogPosts));
    loadAdminBlogPosts();
    renderBlogPosts();
}

function sendNewsletter() {
    const subject = document.getElementById('newsletterSubject').value.trim();
    const message = document.getElementById('newsletterMessage').value.trim();
    
    if (!subject || !message) {
        notifyInline('Please fill in subject and message.');
        return;
    }
    
    if (newsletterSubscribers.length === 0) {
        notifyInline('No subscribers yet.');
        return;
    }

    notifyInline(
        `Newsletter "${subject}" sent to ${newsletterSubscribers.length} subscribers.`,
        'In production this would be sent via your email service.'
    );
    
    document.getElementById('newsletterSubject').value = '';
    document.getElementById('newsletterMessage').value = '';
}

function previewNewsletter() {
    const subject = document.getElementById('newsletterSubject').value.trim();
    const message = document.getElementById('newsletterMessage').value.trim();
    
    if (!subject || !message) {
        notifyInline('Please fill in subject and message first.');
        return;
    }

    notifyInline(`Preview ready: ${subject}`, message.slice(0, 120) + (message.length > 120 ? '…' : ''));
}

function loadSubscribers() {
    const container = document.getElementById('subscribersList');
    const count = document.getElementById('subscriberCount');
    if (!container) return;
    
    if (count) count.textContent = newsletterSubscribers.length;
    
    if (newsletterSubscribers.length === 0) {
        container.innerHTML = '<p style="color:#666;">No subscribers yet.</p>';
        return;
    }
    
    container.innerHTML = newsletterSubscribers.map((sub, idx) => `
        <div style="background:#fff;padding:12px;margin-bottom:10px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
            <div>
                <strong>${escapeHtml(sub.name)}</strong><br>
                <small style="color:#666;">${escapeHtml(sub.email)}</small><br>
                <small style="color:#999;">Subscribed: ${new Date(sub.date).toLocaleDateString()}</small>
            </div>
            <button onclick="unsubscribeUser(${idx})" style="background:#e74c3c;color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;">Remove</button>
        </div>
    `).join('');
}

function unsubscribeUser(idx) {
    if (!confirm('Remove this subscriber?')) return;
    newsletterSubscribers.splice(idx, 1);
    localStorage.setItem('newsletterSubscribers', JSON.stringify(newsletterSubscribers));
    loadSubscribers();
}

// Blog Functions
function openBlogEditor(postId = null) {
    const modal = document.getElementById('blogEditorModal');
    const overlay = document.getElementById('blogEditorOverlay');
    const title = document.getElementById('editorTitle');
    
    if (!modal || !overlay) return;
    
    modal.style.display = 'block';
    overlay.style.display = 'block';
    
    if (postId) {
        const post = adminBlogPosts.find(p => p.id === postId);
        if (post) {
            currentEditingBlogId = postId;
            if (title) title.textContent = 'Edit Blog Post';
            document.getElementById('blogPostTitle').value = post.title;
            document.getElementById('blogPostContent').value = post.content;
            document.getElementById('blogPostImage').value = post.image || '';
            document.getElementById('blogPostCategory').value = post.category;
        }
    } else {
        currentEditingBlogId = null;
        if (title) title.textContent = 'New Blog Post';
        document.getElementById('blogPostTitle').value = '';
        document.getElementById('blogPostContent').value = '';
        document.getElementById('blogPostImage').value = '';
        document.getElementById('blogPostCategory').value = 'Clay Crafts';
    }
}

function closeBlogEditor() {
    const modal = document.getElementById('blogEditorModal');
    const overlay = document.getElementById('blogEditorOverlay');
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    currentEditingBlogId = null;
}

function saveBlogDraft() {
    const title = document.getElementById('blogPostTitle').value.trim();
    const content = document.getElementById('blogPostContent').value.trim();
    
    if (!title || !content) {
        notifyInline('Please enter a title and content.');
        return;
    }
    
    const draft = {
        id: currentEditingBlogId || Date.now(),
        title: title,
        content: content,
        image: document.getElementById('blogPostImage').value.trim(),
        category: document.getElementById('blogPostCategory').value,
        isDraft: true,
        lastSaved: new Date().toISOString()
    };
    
    const drafts = JSON.parse(localStorage.getItem('blogDrafts') || '[]');
    const existingIdx = drafts.findIndex(d => d.id === draft.id);
    
    if (existingIdx >= 0) {
        drafts[existingIdx] = draft;
    } else {
        drafts.push(draft);
    }
    
    localStorage.setItem('blogDrafts', JSON.stringify(drafts));
    notifyInline('Draft saved.');
}

function publishBlog() {
    const title = document.getElementById('blogPostTitle').value.trim();
    const content = document.getElementById('blogPostContent').value.trim();
    const image = document.getElementById('blogPostImage').value.trim();
    const category = document.getElementById('blogPostCategory').value;
    
    if (!title || !content) {
        notifyInline('Please enter a title and content.');
        return;
    }
    
    const post = {
        id: currentEditingBlogId || Date.now(),
        title: title,
        content: content,
        image: image || 'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=400',
        category: category,
        publishDate: new Date().toISOString(),
        author: (typeof window.getUserDisplayName === 'function' ? window.getUserDisplayName() : 'Guest')
    };
    
    if (currentEditingBlogId) {
        const idx = adminBlogPosts.findIndex(p => p.id === currentEditingBlogId);
        if (idx >= 0) {
            adminBlogPosts[idx] = post;
        } else {
            adminBlogPosts.push(post);
        }
    } else {
        adminBlogPosts.push(post);
    }
    
    localStorage.setItem('adminBlogPosts', JSON.stringify(adminBlogPosts));
    
    notifyInline('Blog post published successfully.');
    closeBlogEditor();
    renderBlogPosts();
    loadAdminBlogPosts();
}

function renderBlogPosts() {
    const container = document.getElementById('blogPostsContainer');
    if (!container) return;
    
    if (adminBlogPosts.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-secondary);"><i class="fas fa-blog" style="font-size:4rem;margin-bottom:20px;opacity:0.3;display:block;"></i><h3>No blog posts yet</h3><p>Create your first post using the button above!</p></div>';
        return;
    }
    
    container.innerHTML = adminBlogPosts.slice().reverse().map(post => `
        <div class="blog-post-card" style="background:var(--card-bg);border-radius:16px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.1);transition:transform 0.3s;cursor:pointer;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
            <div style="height:200px;background:linear-gradient(135deg,var(--accent-color),var(--accent-hover));overflow:hidden;">
                <img src="${escapeHtml(safeHttpUrl(post.image) || 'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=900&q=80')}" alt="${escapeHtml(post.title)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">
            </div>
            <div style="padding:20px;">
                <span style="color:var(--accent-color);font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${escapeHtml(post.category)}</span>
                <h3 style="margin:10px 0;color:var(--text-primary);font-size:1.3rem;">${escapeHtml(post.title)}</h3>
                <p style="color:var(--text-secondary);line-height:1.6;margin:10px 0;">${escapeHtml(post.content.substring(0, 120))}...</p>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:15px;padding-top:15px;border-top:1px solid rgba(0,0,0,0.1);">
                    <small style="color:var(--text-secondary);"><i class="fas fa-calendar"></i> ${new Date(post.publishDate).toLocaleDateString()}</small>
                    <button onclick="event.stopPropagation();openBlogEditor(${post.id})" style="background:var(--accent-color);color:white;border:none;padding:6px 14px;border-radius:6px;font-size:0.85rem;cursor:pointer;">Read More</button>
                </div>
            </div>
        </div>
    `).join('');
}

function addBlogLink() {
    const url = document.getElementById('blogLinkUrl').value.trim();
    const text = document.getElementById('blogLinkText').value.trim();
    
    if (!url || !text) {
        notifyInline('Please enter both URL and link text');
        return;
    }
    
    const linksContainer = document.getElementById('blogLinks');
    if (!linksContainer) return;
    
    const linkDiv = document.createElement('div');
    linkDiv.style.cssText = 'background:#f0f0f0;padding:8px 12px;border-radius:6px;display:flex;justify-content:space-between;align-items:center;margin-top:6px;';
    linkDiv.innerHTML = `
        <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="color:var(--accent-color);text-decoration:none;">${escapeHtml(text)}</a>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:#999;cursor:pointer;">&times;</button>
    `;
    linksContainer.appendChild(linkDiv);
    
    document.getElementById('blogLinkUrl').value = '';
    document.getElementById('blogLinkText').value = '';
}

// Trending Function
function showTrending() {
    const overlay = document.getElementById('trendingOverlay');
    const modal = document.getElementById('trendingModal');
    if (overlay) overlay.style.display = 'block';
    if (modal) modal.style.display = 'block';
}

// Carousel shift/next/prev: defined in index.html (generic carouselIndex + updateCarousel for all tracks).

// === END GLOBAL FUNCTIONS ===

// --- DOMContentLoaded: Tab and Pill Button Interactivity ---
document.addEventListener('DOMContentLoaded', function() {
    var lavaLampEl = document.getElementById('lavaLamp');
    if (lavaLampEl) makeFloatingDraggable(lavaLampEl);

    document.querySelectorAll('.carousel-btn').forEach(function (btn) {
        if (!btn.getAttribute('type')) btn.setAttribute('type', 'button');
        if (!btn.getAttribute('aria-label')) {
            var txt = (btn.textContent || '').trim();
            if (txt.indexOf('❮') >= 0) btn.setAttribute('aria-label', 'Previous slide');
            else if (txt.indexOf('❯') >= 0) btn.setAttribute('aria-label', 'Next slide');
        }
    });

    // Tab Navigation (Horizontal Tabs)
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            if (!targetTab) return;
            if (targetTab === 'admin') {
                if (typeof window.isPegasusOpsAdmin !== 'function' || !window.isPegasusOpsAdmin()) {
                    var am = document.getElementById('adminLoginModal');
                    if (am) am.style.display = 'flex';
                    return;
                }
            }
            // index.html switchTab() sets inline display; class-only toggles break after that
            if (typeof window.switchTab === 'function') {
                window.switchTab(targetTab);
                try {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } catch (e) {}
                if (targetTab === 'admin' && typeof refreshAdminOrdersSnapshot === 'function') {
                    refreshAdminOrdersSnapshot();
                }
                if (targetTab === 'courses' && typeof updateCourseResumeUI === 'function') {
                    updateCourseResumeUI();
                }
            } else {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                const targetContent = document.getElementById(targetTab);
                if (targetContent) targetContent.classList.add('active');
            }
            
            // Reinitialize carousels when switching to tabs with carousels
            setTimeout(() => {
                if (targetTab === 'shop' && typeof window.shiftFeatured === 'function') {
                    window.shiftFeatured(1);
                }
                if (targetTab === 'courses' && typeof window.shiftCourse === 'function') {
                    window.shiftCourse(0);
                }
                if (targetTab === 'events' && typeof window.shiftEvent === 'function') {
                    window.shiftEvent(1);
                }
                if (targetTab === 'resources' && typeof window.shiftResource === 'function') {
                    window.shiftResource(0);
                }
            }, 50);
        });
    });

    // Initialize carousels on page load
    setTimeout(() => {
        if (typeof window.shiftFeatured === 'function') {
            window.shiftFeatured(1);
        }
        if (typeof window.shiftCourse === 'function') {
            window.shiftCourse(0);
        }
        if (typeof window.shiftEvent === 'function') {
            window.shiftEvent(1);
        }
        if (typeof window.shiftResource === 'function') {
            window.shiftResource(0);
        }
    }, 100);

    try {
        wireContactTabForm();
    } catch (e) {}

    // Pill Buttons (sidebar quick actions)
    const pillMap = [
        { id: 'shopBtn', fn: () => { const btn = document.querySelector('[data-tab="shop"]'); if (btn) btn.click(); } },
        { id: 'badgesBtn', fn: () => { const badges = document.getElementById('badgesPanel') || document.getElementById('badgesModal'); if (badges) badges.style.display = 'block'; } },
        { id: 'screenshotBtn', fn: window.captureProfileScreenshot },
        { id: 'videoBtn', fn: () => { const player = document.getElementById('simpleVideoPlayer'); if (player) { player.style.display = 'flex'; localStorage.setItem('showVideoPlayer', 'true'); } } },
        { id: 'searchToggle', fn: () => { const search = document.getElementById('searchContainer'); if (search) { const open = search.style.display !== 'block'; search.style.display = open ? 'block' : 'none'; const b = document.getElementById('searchToggle'); if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false'); } } },
        { id: 'quizBtn', fn: window.showPersonalityQuiz },
        { id: 'trendingBtn', fn: showTrending },
        { id: 'cartBtn', fn: window.openCartPanel },
        { id: 'chatBtn', fn: () => { const chat = document.getElementById('chatBox'); if (chat) chat.style.display = 'block'; } },
    ];
    pillMap.forEach(pill => {
        const btn = document.getElementById(pill.id);
        if (btn && typeof pill.fn === 'function') {
            btn.addEventListener('click', pill.fn);
        }
    });

    // Cart Panel Close Button
    const closeCartBtn = document.getElementById('closeCartPanel');
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', window.closeCartPanel);
    }

    // Cart Overlay Click to Close
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartOverlay) {
        cartOverlay.addEventListener('click', window.closeCartPanel);
    }

    // Featured Products Carousel (for Quirky Shop) - Click + Hover Navigation
    const featuredCarousel = document.getElementById('featuredProductsCarousel');
    if (featuredCarousel) {
        const slides = featuredCarousel.querySelectorAll('.carousel-slide');
        const prevBtn = featuredCarousel.querySelector('.carousel-prev');
        const nextBtn = featuredCarousel.querySelector('.carousel-next');
        if (slides.length > 0) {
            let currentSlide = 0;

            const positionSlides = () => {
                slides.forEach((slide, idx) => {
                    if (idx === currentSlide) {
                        slide.style.transform = 'translateX(0)';
                    } else if (idx < currentSlide) {
                        slide.style.transform = 'translateX(-100%)';
                    } else {
                        slide.style.transform = 'translateX(100%)';
                    }
                });
            };

            const goNext = () => {
                currentSlide = (currentSlide + 1) % slides.length;
                positionSlides();
            };

            const goPrev = () => {
                currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                positionSlides();
            };

            positionSlides();

            if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); goNext(); });
            if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); goPrev(); });

            featuredCarousel.addEventListener('click', (e) => {
                if (e.target.closest('.carousel-prev') || e.target.closest('.carousel-next')) return;
                goNext();
            });

            featuredCarousel.addEventListener('mouseenter', () => {
                goNext();
            });
        }
    }
    
    // Admin tab switching
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('admin-tab-btn')) {
            document.querySelectorAll('.admin-tab-btn').forEach(btn => {
                btn.style.background = '#ddd';
                btn.style.color = '#333';
                btn.classList.remove('active');
            });
            e.target.style.background = 'var(--accent-color)';
            e.target.style.color = 'white';
            e.target.classList.add('active');
            
            document.querySelectorAll('.admin-content').forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });
            
            const tab = e.target.dataset.adminTab;
            const content = document.getElementById('admin' + tab.charAt(0).toUpperCase() + tab.slice(1));
            if (content) {
                content.style.display = 'block';
                content.classList.add('active');
            }
            
            if (tab === 'subscribers') loadSubscribers();
        }
    });
    
    // Close blog editor with X button
    const closeBlogEditorBtn = document.getElementById('closeBlogEditor');
    if (closeBlogEditorBtn) {
        closeBlogEditorBtn.addEventListener('click', closeBlogEditor);
    }
    
    // Initialize blog posts display
    renderBlogPosts();
    
    // Trending overlay close handler
    const trendingOverlay = document.getElementById('trendingOverlay');
    if (trendingOverlay) {
        trendingOverlay.addEventListener('click', function() {
            this.style.display = 'none';
            const modal = document.getElementById('trendingModal');
            if (modal) modal.style.display = 'none';
        });
    }

    var courseTrack = document.getElementById('coursesCarouselTrack');
    if (courseTrack) {
        courseTrack.addEventListener('click', function (e) {
            var card = e.target.closest('.event-card');
            if (!card) return;
            var cards = courseTrack.querySelectorAll('.event-card');
            var idx = Array.prototype.indexOf.call(cards, card);
            if (idx < 0) return;
            try {
                localStorage.setItem(
                    'courseLastViewed',
                    JSON.stringify({
                        i: idx,
                        title: COURSE_CARD_TITLES[idx] || ('Course ' + (idx + 1)),
                        at: new Date().toISOString()
                    })
                );
            } catch (err) {}
            updateCourseResumeUI();
        });
    }
    var courseResumeGo = document.getElementById('courseResumeGoBtn');
    if (courseResumeGo) {
        courseResumeGo.addEventListener('click', function () {
            if (typeof window.switchTab === 'function') window.switchTab('courses');
            var st = document.querySelector('#courses .events-stage');
            if (st) st.scrollIntoView({ behavior: 'smooth', block: 'center' });
            else {
                var mc = document.getElementById('mini-courses');
                if (mc) mc.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
    updateCourseResumeUI();
    refreshAdminOrdersSnapshot();
});

// ======================
// DRAGGABLE & RESIZABLE ELEMENTS
// ======================
function makeFloatingDraggable(element) {
    if (!element || element.dataset.floatingDraggableInit === 'true') return;
    element.dataset.floatingDraggableInit = 'true';
    element.style.touchAction = 'none';

    let startX = 0, startY = 0, originLeft = 0, originTop = 0;

    function onMouseDown(e) {
        if (e.target.closest('input, textarea, select, button, a, label, option, [contenteditable="true"]')) return;
        const rect = element.getBoundingClientRect();
        originLeft = rect.left;
        originTop = rect.top;
        startX = e.clientX;
        startY = e.clientY;
        element.classList.add('dragging');
        element.style.right = 'auto';
        element.style.bottom = 'auto';
        element.style.left = originLeft + 'px';
        element.style.top = originTop + 'px';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
    }

    function onMouseMove(e) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const rect = element.getBoundingClientRect();
        const maxLeft = Math.max(4, window.innerWidth - rect.width - 4);
        const maxTop = Math.max(4, window.innerHeight - rect.height - 4);
        const nextLeft = Math.min(maxLeft, Math.max(4, originLeft + dx));
        const nextTop = Math.min(maxTop, Math.max(4, originTop + dy));
        element.style.left = nextLeft + 'px';
        element.style.top = nextTop + 'px';
    }

    function onMouseUp() {
        element.classList.remove('dragging');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    element.addEventListener('mousedown', onMouseDown, true);
}

function makeDraggable(element, handleSelector = null) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const handle = handleSelector ? element.querySelector(handleSelector) : element;
    
    if (handle) {
        handle.addEventListener('mousedown', dragMouseDown, true);
    }
    
    function dragMouseDown(e) {
        // Don't drag from resize handle
        if (e.target.closest('.resize-handle')) return;
        // Allow typing and clicking controls inside draggable panels
        if (e.target.closest('input, textarea, select, button, a, label, option, [contenteditable="true"]')) return;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.addEventListener('mousemove', elementDrag);
        document.addEventListener('mouseup', closeDragElement);
    }
    
    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        const newTop = element.offsetTop - pos2;
        const newLeft = element.offsetLeft - pos1;
        
        element.style.top = newTop + 'px';
        element.style.left = newLeft + 'px';
    }
    
    function closeDragElement() {
        document.removeEventListener('mousemove', elementDrag);
        document.removeEventListener('mouseup', closeDragElement);
    }
}

function makeResizable(element) {
    const resizer = document.createElement('div');
    resizer.className = 'resize-handle';
    resizer.style.cssText = 'position:absolute;bottom:0;right:0;width:20px;height:20px;background:radial-gradient(circle at bottom right, var(--accent-color), transparent);cursor:nwse-resize;border-radius:0 0 20px 0;z-index:1000;';
    element.style.position = 'fixed';
    element.appendChild(resizer);
    
    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    
    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(window.getComputedStyle(element).width, 10);
        startHeight = parseInt(window.getComputedStyle(element).height, 10);
        e.preventDefault();
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
    }, true);
    
    const doResize = (e) => {
        if (!isResizing) return;
        element.style.width = Math.max(200, startWidth + (e.clientX - startX)) + 'px';
        element.style.height = Math.max(200, startHeight + (e.clientY - startY)) + 'px';
    };
    
    const stopResize = () => {
        isResizing = false;
        document.removeEventListener('mousemove', doResize);
        document.removeEventListener('mouseup', stopResize);
    };
}

// Apply draggable to elements
document.addEventListener('DOMContentLoaded', () => {
    // Initialize ALL modal-draggable elements
    const allDraggables = document.querySelectorAll('.modal-draggable');
    allDraggables.forEach(element => {
        // Skip if already initialized
        if (element.dataset.draggableInit) return;
        element.dataset.draggableInit = 'true';
        
        // Make draggable - use specific handles for certain elements
        if (element.id === 'themeModal') {
            makeDraggable(element, '.theme-content');
        } else if (element.id === 'badgesPanel') {
            makeDraggable(element, '.badges-header');
            makeResizable(element);
        } else if (element.id === 'chatBox') {
            makeDraggable(element, '.chat-header');
        } else if (element.classList.contains('theme-content') || 
                   element.classList.contains('quick-jump-menu') ||
                   element.classList.contains('settings-pill-content')) {
            makeDraggable(element); // Use whole element as handle for these
        } else {
            // For modals with standard structure, try to find a header
            const header = element.querySelector('h2, h3, .modal-header, .chat-header');
            if (header) {
                makeDraggable(element, header.tagName.toLowerCase());
            } else {
                makeDraggable(element);
            }
        }
        
        // Make resizable if it has resize:both in inline styles or is a resizable type
        if (element.style.resize === 'both' || 
            element.id === 'simpleVideoPlayer' || 
            element.id === 'badgesPanel') {
            makeResizable(element);
        }
    });
    
    // Chat close button functionality
    const chatCloseBtn = document.querySelector('#chatBox .chat-close');
    const chatBox = document.getElementById('chatBox');
    if (chatCloseBtn && chatBox) {
        chatCloseBtn.addEventListener('click', () => {
            chatBox.style.display = 'none';
        });
    }
    
    // Theme modal click outside to close
    const themeOverlay = document.createElement('div');
    themeOverlay.id = 'themeOverlay';
    themeOverlay.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:transparent;z-index:3499;';
    document.body.appendChild(themeOverlay);
    
    themeOverlay.addEventListener('click', () => {
        themeModal.style.display = 'none';
        themeOverlay.style.display = 'none';
    });
    
    // Opposite mode button in theme modal
    const oppositeInModal = document.getElementById('toggleOppositeInModal');
    if (oppositeInModal) {
        oppositeInModal.addEventListener('click', toggleOppositeMode);
    }
});

// ========================================
// LATRESE'S POLYMER CLAY WORLD
// User Personalization & Feature System
// COMPLETE VERSION - ALL FUNCTIONALITY PRESERVED
// ========================================

'use strict';

// ========================================
// GLOBAL VARIABLES & DATA STRUCTURES
// ========================================
let currentUser = null;
const GUEST_CART_KEY = 'craftinardor_guest_cart';

function getCart() {
    if (!window.cart) window.cart = [];
    return window.cart;
}

function persistGuestCart() {
    try {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            try {
                if (firebase.auth().currentUser) return;
            } catch (e2) {}
        }
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(getCart()));
    } catch (e) {}
}

function loadGuestCartFromStorage() {
    try {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            try {
                if (firebase.auth().currentUser) return;
            } catch (e2) {}
        }
        const raw = localStorage.getItem(GUEST_CART_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
            window.cart = parsed;
            if (typeof updateCartBadge === 'function') updateCartBadge();
            if (typeof updateCartPanel === 'function') updateCartPanel();
        }
    } catch (e) {}
}

/** Empty cart in memory, remove guest localStorage, and sync empty cart to Firebase when signed in. */
function clearGuestCart() {
    window.cart = [];
    cartCount = 0;
    try {
        localStorage.removeItem(GUEST_CART_KEY);
    } catch (e) {}
    if (typeof updateCartBadge === 'function') updateCartBadge();
    if (typeof updateCartPanel === 'function') updateCartPanel();
    try {
        const a = getAuth();
        if (a && a.currentUser && typeof window.syncCartToFirebase === 'function') {
            window.syncCartToFirebase();
        }
    } catch (e2) {}
}

window.clearGuestCart = clearGuestCart;

let cartCount = 0;
let unlockedBadges = JSON.parse(localStorage.getItem('unlockedBadges')) || [];
let badgeProgress = JSON.parse(localStorage.getItem('badgeProgress')) || {};
let gamificationData = JSON.parse(localStorage.getItem('gamificationData')) || {
    totalXP: 0,
    streak: 0,
    lastVisit: new Date().toISOString(),
    level: 1,
    achievements: [],
    actions: []
};

let userProfile = JSON.parse(localStorage.getItem('userProfile')) || {
    name: 'Crafter',
    joinDate: new Date().toISOString(),
    skillLevel: 'beginner',
    favoriteColors: [],
    completedProjects: 0,
    totalClayUsed: 0,
    preferences: {
        theme: 'default',
        notifications: true,
        newsletter: false
    }
};

function syncUserProfileFromStorage() {
    try {
        const raw = localStorage.getItem('userProfile');
        if (raw) userProfile = JSON.parse(raw);
    } catch (e) {
        console.warn('syncUserProfileFromStorage', e);
    }
}

let analyticsData = JSON.parse(localStorage.getItem('analyticsData')) || {
    pageViews: {},
    userActions: [],
    sessionStart: new Date().toISOString(),
    sessions: 0
};

let personalizationData = JSON.parse(localStorage.getItem('personalizationData')) || {
    preferences: { contentPreferences: [] }
};

let projects = JSON.parse(localStorage.getItem('clayProjects')) || [];
let clayInventory = JSON.parse(localStorage.getItem('clayInventory')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || {
    patterns: [],
    tutorials: [],
    products: [],
    techniques: []
};

const visitedSections = new Set();
const socialClicks = new Set();
let visitCount = parseInt(localStorage.getItem('visitCount') || '0', 10) + 1;
localStorage.setItem('visitCount', visitCount.toString());

let materials = [];
let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;
let currentBlogPost = null;
let blogFiles = [];

// Initialize badge progress
if (visitCount >= 10) {
    badgeProgress['loyal-visitor'] = 10;
} else {
    badgeProgress['loyal-visitor'] = visitCount;
}
localStorage.setItem('badgeProgress', JSON.stringify(badgeProgress));

// ========================================
// FEATURED PRODUCTS FOR QUIRKY SHOP
// ========================================
const featuredProducts = [
    {
        id: 1,
        name: 'Polymer Clay Starter Kit',
        price: 24.99,
        image: 'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?auto=format&fit=crop&w=300&q=80',
        description: 'Everything you need to begin your clay journey!',
        category: 'clay',
        featured: true
    },
    {
        id: 2,
        name: 'Mica Powder Set (24 Colors)',
        price: 18.99,
        image: 'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?auto=format&fit=crop&w=300&q=80',
        description: 'Add shimmer and shine to your creations.',
        category: 'clay',
        featured: true
    },
    {
        id: 3,
        name: 'Clay Tools Bundle (15pcs)',
        price: 16.99,
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300',
        description: 'Professional sculpting tools for precision work.',
        category: 'tools',
        featured: true
    },
    {
        id: 4,
        name: 'Handmade Polymer Earrings',
        price: 12.99,
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300',
        description: 'Unique handcrafted designs made with love.',
        category: 'jewelry',
        featured: true
    },
    {
        id: 5,
        name: 'Clay Conditioning Machine',
        price: 34.99,
        image: 'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?auto=format&fit=crop&w=300&q=80',
        description: 'Make conditioning clay easier and faster!',
        category: 'tools',
        featured: true
    },
    {
        id: 6,
        name: 'Tutorial E-Book Bundle',
        price: 9.99,
        image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=300&q=80',
        description: 'Learn 50+ clay techniques step-by-step.',
        category: 'digital',
        featured: true
    }
];

// ========================================
// XP & LEVEL SYSTEM
// ========================================
const XP_REWARDS = {
    'visit': 10,
    'blog-read': 50,
    'blog-comment': 100,
    'course-complete': 500,
    'shop-purchase': 150,
    'video-watch': 75,
    'badge-unlock': 200,
    'resource-download': 50,
    'game-played': 75,
    'event-rsvp': 100,
    'follow-user': 25,
    'rate-product': 50
};

const LEVELS = [
    { level: 1, minXP: 0, title: 'Novice Crafter', icon: '🎨', color: '#a8d4ba' },
    { level: 2, minXP: 500, title: 'Craft Apprentice', icon: '👨‍🎨', color: '#9b7ba8' },
    { level: 3, minXP: 1500, title: 'Skilled Artisan', icon: '🧑‍🎨', color: '#6dd5c3' },
    { level: 4, minXP: 3500, title: 'Master Crafter', icon: '👑', color: '#e74c3c' },
    { level: 5, minXP: 7000, title: 'Legendary Creator', icon: '⭐', color: '#f39c12' }
];

function addXP(action, amount = null) {
    const xpAmount = amount || XP_REWARDS[action] || 0;
    if (xpAmount > 0) {
        gamificationData.totalXP += xpAmount;
        gamificationData.actions.push({
            action: action,
            xp: xpAmount,
            timestamp: new Date().toISOString()
        });
        updateLevel();
        updateStreak();
        saveGamificationData();
    }
}

function updateStreak() {
    const lastVisit = new Date(gamificationData.lastVisit);
    const today = new Date();
    const daysDiff = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return;
    if (daysDiff === 1) {
        gamificationData.streak++;
    } else {
        gamificationData.streak = 1;
    }
    
    gamificationData.lastVisit = new Date().toISOString();
    
    if (gamificationData.streak === 7) unlockBadge('week-streak');
    if (gamificationData.streak === 30) unlockBadge('month-streak');
    if (gamificationData.streak === 100) unlockBadge('century-streak');
}

function updateLevel() {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (gamificationData.totalXP >= LEVELS[i].minXP) {
            const oldLevel = gamificationData.level;
            gamificationData.level = LEVELS[i].level;
            if (oldLevel !== gamificationData.level) {
                showLevelUpNotification(LEVELS[i]);
            }
            break;
        }
    }
}

function getCurrentLevel() {
    return LEVELS.find(l => l.level === gamificationData.level) || LEVELS[0];
}

function syncUserStatsDisplays() {
    const s = document.getElementById('streakDisplay');
    const x = document.getElementById('xpDisplay');
    const l = document.getElementById('levelDisplay');
    const f = document.getElementById('followingDisplay');
    if (s) s.textContent = String(gamificationData.streak ?? 0);
    if (x) x.textContent = String(gamificationData.totalXP ?? 0);
    if (l) l.textContent = String(gamificationData.level ?? 1);
    if (f) f.textContent = '0';
}

function saveGamificationData() {
    localStorage.setItem('gamificationData', JSON.stringify(gamificationData));
    syncUserStatsDisplays();
}

function showLevelUpNotification(level) {
    notifyInline(`🎉 Level Up! You are now a ${level.title}!`);
}

// ========================================
// BADGE SYSTEM
// ========================================
const badgeCategories = {
    beginner: {
        title: '🌱 Beginner Clay Crafter',
        icon: 'fas fa-seedling',
        badges: [
            { id: 'first-visit', name: 'Welcome!', icon: 'fas fa-gift', color: '#ff6b6b', tier: 'bronze', desc: 'Visited PropArt™ Creator Space', progress: 0, max: 1 },
            { id: 'profile-view', name: 'Getting to Know You', icon: 'fas fa-user', color: '#4ecdc4', tier: 'bronze', desc: 'Viewed your profile', progress: 0, max: 1 },
            { id: 'first-scroll', name: 'Explorer', icon: 'fas fa-scroll', color: '#9b59b6', tier: 'bronze', desc: 'Scrolled through the entire page', progress: 0, max: 1 },
        ]
    },
    clayCreator: {
        title: '🎨 Clay Creator',
        icon: 'fas fa-palette',
        badges: [
            { id: 'first-project', name: 'First Creation', icon: 'fas fa-star', color: '#e67e22', tier: 'bronze', desc: 'Started your first polymer clay project', progress: 0, max: 1 },
            { id: 'project-finisher', name: 'Project Finisher', icon: 'fas fa-check-circle', color: '#3498db', tier: 'silver', desc: 'Completed 5 projects', progress: 0, max: 5 },
            { id: 'clay-master', name: 'Clay Master', icon: 'fas fa-crown', color: '#f1c40f', tier: 'gold', desc: 'Used 100oz of clay or completed 10 projects', progress: 0, max: 10 },
            { id: 'technique-explorer', name: 'Technique Explorer', icon: 'fas fa-magic', color: '#9b59b6', tier: 'silver', desc: 'Tried 10 different techniques', progress: 0, max: 10 },
        ]
    },
    colorMaster: {
        title: '🎨 Color Master',
        icon: 'fas fa-paint-brush',
        badges: [
            { id: 'color-mixer', name: 'Color Mixer', icon: 'fas fa-palette', color: '#e74c3c', tier: 'bronze', desc: 'Created a custom color palette', progress: 0, max: 1 },
            { id: 'palette-pro', name: 'Palette Pro', icon: 'fas fa-swatchbook', color: '#3498db', tier: 'silver', desc: 'Saved 5 color palettes', progress: 0, max: 5 },
            { id: 'color-collector', name: 'Rainbow Collector', icon: 'fas fa-rainbow', color: '#f39c12', tier: 'gold', desc: 'Added 20 different clay colors to inventory', progress: 0, max: 20 },
        ]
    },
    shopper: {
        title: '🛍️ Shopper',
        icon: 'fas fa-shopping-bag',
        badges: [
            { id: 'first-purchase', name: 'First Purchase', icon: 'fas fa-shopping-cart', color: '#e74c3c', tier: 'bronze', desc: 'Made your first purchase', progress: 0, max: 1 },
            { id: 'tool-collector', name: 'Tool Collector', icon: 'fas fa-toolbox', color: '#9b59b6', tier: 'silver', desc: 'Purchased 5 clay tools', progress: 0, max: 5 },
            { id: 'patron', name: 'Patron of Clay Arts', icon: 'fas fa-gem', color: '#f39c12', tier: 'gold', desc: 'Spent over $100', progress: 0, max: 100 },
            { id: 'vip', name: 'VIP Clay Crafter', icon: 'fas fa-star', color: '#8e44ad', tier: 'platinum', desc: 'Premium member', progress: 0, max: 1 },
        ]
    },
    community: {
        title: '💬 Community Member',
        icon: 'fas fa-users',
        badges: [
            { id: 'chatter', name: 'Chatterbox', icon: 'fas fa-comments', color: '#1abc9c', tier: 'bronze', desc: 'Started a chat', progress: 0, max: 1 },
            { id: 'newsletter', name: 'Subscriber', icon: 'fas fa-envelope-open-text', color: '#3498db', tier: 'bronze', desc: 'Subscribed to newsletter', progress: 0, max: 1 },
            { id: 'social-butterfly', name: 'Social Butterfly', icon: 'fas fa-share-alt', color: '#e74c3c', tier: 'silver', desc: 'Shared on all social platforms', progress: 0, max: 3 },
            { id: 'commenter', name: 'Engaged Member', icon: 'fas fa-comment-dots', color: '#f39c12', tier: 'silver', desc: 'Left 10 comments', progress: 0, max: 10 },
        ]
    },
    collector: {
        title: '⭐ Collector',
        icon: 'fas fa-bookmark',
        badges: [
            { id: 'collector', name: 'Collector', icon: 'fas fa-bookmark', color: '#f39c12', tier: 'bronze', desc: 'Saved 5 favorites', progress: 0, max: 5 },
            { id: 'tutorial-lover', name: 'Tutorial Lover', icon: 'fas fa-video', color: '#e74c3c', tier: 'silver', desc: 'Watched 10 tutorials', progress: 0, max: 10 },
            { id: 'pattern-hoarder', name: 'Pattern Hoarder', icon: 'fas fa-file-pdf', color: '#9b59b6', tier: 'gold', desc: 'Downloaded 20 patterns', progress: 0, max: 20 },
        ]
    },
    organizer: {
        title: '📦 Organizer',
        icon: 'fas fa-box',
        badges: [
            { id: 'stash-builder', name: 'Stash Builder', icon: 'fas fa-boxes', color: '#3498db', tier: 'bronze', desc: 'Added first item to clay inventory', progress: 0, max: 1 },
            { id: 'inventory-master', name: 'Inventory Master', icon: 'fas fa-warehouse', color: '#1abc9c', tier: 'silver', desc: 'Tracked 25 clay items', progress: 0, max: 25 },
            { id: 'organizer-pro', name: 'Organization Pro', icon: 'fas fa-clipboard-list', color: '#f1c40f', tier: 'gold', desc: 'Maintained inventory for 30 days', progress: 0, max: 1 },
        ]
    },
    tools: {
        title: '🛠️ Tool Master',
        icon: 'fas fa-wrench',
        badges: [
            { id: 'tool-user', name: 'Calculator Pro', icon: 'fas fa-calculator', color: '#3498db', tier: 'bronze', desc: 'Used a calculator tool', progress: 0, max: 1 },
            { id: 'time-tracker', name: 'Time Keeper', icon: 'fas fa-clock', color: '#e67e22', tier: 'silver', desc: 'Used the project timer', progress: 0, max: 1 },
            { id: 'playlist-curator', name: 'Playlist Curator', icon: 'fas fa-list', color: '#9b59b6', tier: 'silver', desc: 'Added custom video to playlist', progress: 0, max: 1 },
        ]
    },
    seasonal: {
        title: '🎉 Seasonal & Special',
        icon: 'fas fa-calendar-star',
        badges: [
            { id: 'theme-changer', name: 'Theme Lover', icon: 'fas fa-palette', color: '#9b59b6', tier: 'bronze', desc: 'Changed color theme', progress: 0, max: 1 },
            { id: 'night-owl', name: 'Night Owl', icon: 'fas fa-moon', color: '#34495e', tier: 'silver', desc: 'Used dark mode', progress: 0, max: 1 },
            { id: 'loyal-visitor', name: 'Loyal Visitor', icon: 'fas fa-heart', color: '#e74c3c', tier: 'gold', desc: 'Visited 10 times', progress: 0, max: 10 },
            { id: 'completist', name: 'Completist', icon: 'fas fa-trophy', color: '#f1c40f', tier: 'platinum', desc: 'Unlocked all badges!', progress: 0, max: 1 },
        ]
    }
};

function updateBadgeProgress(badgeId, amount) {
    if (!badgeProgress[badgeId]) {
        badgeProgress[badgeId] = 0;
    }
    
    const badge = getBadgeById(badgeId);
    const maxValue = badge ? badge.max : 1;
    
    badgeProgress[badgeId] = Math.min(badgeProgress[badgeId] + amount, maxValue);
    localStorage.setItem('badgeProgress', JSON.stringify(badgeProgress));
    
    if (badge && badgeProgress[badgeId] >= badge.max) {
        unlockBadge(badgeId);
    }
    
    updateBadgesPanel();
}

function getBadgeById(badgeId) {
    for (const category in badgeCategories) {
        if (badgeCategories.hasOwnProperty(category)) {
            const badge = badgeCategories[category].badges.find(function(b) { return b.id === badgeId; });
            if (badge) return badge;
        }
    }
    return null;
}

function unlockBadge(badgeId) {
    if (unlockedBadges.includes(badgeId)) return;
    
    const badge = getBadgeById(badgeId);
    if (!badge) return;
    
    unlockedBadges.push(badgeId);
    localStorage.setItem('unlockedBadges', JSON.stringify(unlockedBadges));
    
    showBadgeUnlock(badge);
    updateBadgesPanel();
    
    const totalBadges = Object.keys(badgeCategories).reduce(function(sum, cat) {
        return sum + badgeCategories[cat].badges.length;
    }, 0);
    
    if (unlockedBadges.length === totalBadges - 1) {
        setTimeout(function() { unlockBadge('completist'); }, 1000);
    }
}

/** Roll out purchase XP / “First purchase” badge only after `site/metrics.memberCount` ≥ this (see index.html listener). */
function craftPurchaseBadgesRolloutMet() {
    try {
        if (window.__CRAFT_FORCE_PURCHASE_BADGES === true) return true;
        var min = parseInt(window.__CRAFT_PURCHASE_BADGES_MIN_MEMBERS, 10);
        if (isNaN(min) || min < 1) min = 250;
        var n = window.__CRAFT_REPORTED_MEMBER_COUNT;
        if (typeof n !== 'number' || isNaN(n)) return false;
        return n >= min;
    } catch (e) {
        return false;
    }
}

/** Call from Stripe return only — not from add-to-cart. */
function applyVerifiedPurchaseGamification() {
    if (!craftPurchaseBadgesRolloutMet()) return;
    try {
        unlockBadge('first-purchase');
        addXP('shop-purchase');
    } catch (e) {}
}

window.applyVerifiedPurchaseGamification = applyVerifiedPurchaseGamification;

function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f39c12', '#9b59b6', '#e74c3c', '#1abc9c', '#f1c40f'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = Math.random() * 100 + 'vh';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.animationDelay = (Math.random() * 0.5) + 's';
        document.body.appendChild(confetti);
        
        setTimeout(function() {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        }, 3000);
    }
}

function createSparkles() {
    const sparkleEmojis = ['✨', '⭐', '🌟', '💫', '🎉', '🎊', '🎨', '🖌️'];
    const sparkleCount = 20;
    
    for (let i = 0; i < sparkleCount; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.textContent = sparkleEmojis[Math.floor(Math.random() * sparkleEmojis.length)];
        sparkle.style.left = (Math.random() * 80 + 10) + 'vw';
        sparkle.style.top = (Math.random() * 80 + 10) + 'vh';
        sparkle.style.animationDelay = (Math.random() * 0.5) + 's';
        document.body.appendChild(sparkle);
        
        setTimeout(function() {
            if (sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
            }
        }, 2000);
    }
}

function showBadgeUnlock(badge) {
    const unlockDiv = document.getElementById('badgeUnlock');
    const overlay = document.getElementById('badgeOverlay');
    const iconElement = document.getElementById('badgeIcon');
    const tierDisplay = document.getElementById('badgeTierDisplay');
    const nameElement = document.getElementById('badgeUnlockName');
    const descElement = document.getElementById('badgeUnlockDesc');
    
    if (!unlockDiv || !overlay || !iconElement || !tierDisplay || !nameElement || !descElement) return;
    
    iconElement.className = 'badge-unlock-icon ' + badge.icon;
    iconElement.style.color = badge.color;
    
    nameElement.textContent = badge.name;
    descElement.textContent = badge.desc;
    
    tierDisplay.textContent = badge.tier.toUpperCase();
    tierDisplay.className = 'badge-unlock-tier ' + badge.tier;
    
    overlay.style.display = 'block';
    unlockDiv.style.display = 'block';
    
    createConfetti();
    createSparkles();
    
    setTimeout(function() {
        unlockDiv.style.display = 'none';
        overlay.style.display = 'none';
    }, 4000);
}

function updateBadgesPanel() {
    const container = document.getElementById('badgesContainer');
    if (!container) return;
    
    const earnedCount = document.getElementById('earnedCount');
    const progress = document.getElementById('badgeProgress');
    const totalBadgesEl = document.getElementById('totalBadges');
    
    const totalBadges = Object.keys(badgeCategories).reduce(function(sum, cat) {
        return sum + badgeCategories[cat].badges.length;
    }, 0);
    
    if (earnedCount) earnedCount.textContent = unlockedBadges.length.toString();
    if (progress) progress.textContent = Math.round((unlockedBadges.length / totalBadges) * 100) + '%';
    if (totalBadgesEl) totalBadgesEl.textContent = totalBadges.toString();
    
    container.innerHTML = '';
    
    for (const categoryKey in badgeCategories) {
        if (!badgeCategories.hasOwnProperty(categoryKey)) continue;
        
        const category = badgeCategories[categoryKey];
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'badge-category';
        
        const categoryTitle = document.createElement('div');
        categoryTitle.className = 'badge-category-title';
        categoryTitle.innerHTML = '<i class="' + category.icon + '"></i> ' + category.title;
        categoryDiv.appendChild(categoryTitle);
        
        const grid = document.createElement('div');
        grid.className = 'badges-grid';
        
        category.badges.forEach(function(badge) {
            const isUnlocked = unlockedBadges.includes(badge.id);
            const currentProgress = badgeProgress[badge.id] || 0;
            
            const badgeDiv = document.createElement('div');
            badgeDiv.className = 'badge-item ' + (isUnlocked ? '' : 'locked');
            badgeDiv.title = badge.desc;
            
            badgeDiv.innerHTML = 
                (!isUnlocked && badge.tier ? '<div class="badge-tier ' + badge.tier + '">' + badge.tier + '</div>' : '') +
                '<div class="badge-icon"><i class="' + badge.icon + '" style="color: ' + badge.color + ';"></i></div>' +
                '<div class="badge-name">' + badge.name + '</div>' +
                (!isUnlocked && badge.max > 1 ? '<div class="badge-progress">' + currentProgress + '/' + badge.max + '</div>' : '');
            
            grid.appendChild(badgeDiv);
        });
        
        categoryDiv.appendChild(grid);
        container.appendChild(categoryDiv);
    }
}

// ========================================
// PREMIUM CALCULATOR FUNCTIONS
// ========================================
function calculateClayCost() {
    const price = parseFloat(document.getElementById('clayPrice').value);
    const oz = parseFloat(document.getElementById('clayOz').value);
    const resultDiv = document.getElementById('costResult');
    
    if (isNaN(price) || isNaN(oz)) {
        notifyInline('Please enter valid numbers!');
        return;
    }
    
    const total = (price * oz).toFixed(2);
    resultDiv.innerHTML = 'Total Cost: $' + total;
    resultDiv.style.display = 'block';
    
    unlockBadge('tool-user');
}

function mixColors() {
    const color1 = document.getElementById('color1').value;
    const color2 = document.getElementById('color2').value;
    
    const r1 = parseInt(color1.substr(1, 2), 16);
    const g1 = parseInt(color1.substr(3, 2), 16);
    const b1 = parseInt(color1.substr(5, 2), 16);
    
    const r2 = parseInt(color2.substr(1, 2), 16);
    const g2 = parseInt(color2.substr(3, 2), 16);
    const b2 = parseInt(color2.substr(5, 2), 16);
    
    const rMix = Math.round((r1 + r2) / 2);
    const gMix = Math.round((g1 + g2) / 2);
    const bMix = Math.round((b1 + b2) / 2);
    
    const mixedColor = '#' + 
        rMix.toString(16).padStart(2, '0') +
        gMix.toString(16).padStart(2, '0') +
        bMix.toString(16).padStart(2, '0');
    
    document.getElementById('mixedColor').style.background = mixedColor;
    
    unlockBadge('color-mixer');
}

function startTimer() {
    if (timerRunning) return;
    
    timerRunning = true;
    timerInterval = setInterval(function() {
        timerSeconds++;
        updateTimerDisplay();
    }, 1000);
    
    unlockBadge('time-tracker');
}

function pauseTimer() {
    timerRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    pauseTimer();
    timerSeconds = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const hours = Math.floor(timerSeconds / 3600);
    const minutes = Math.floor((timerSeconds % 3600) / 60);
    const seconds = timerSeconds % 60;
    
    const display = 
        hours.toString().padStart(2, '0') + ':' +
        minutes.toString().padStart(2, '0') + ':' +
        seconds.toString().padStart(2, '0');
    
    const displayEl = document.getElementById('timerDisplay');
    if (displayEl) {
        displayEl.textContent = display;
    }
}

function convertTemp() {
    const temp = parseFloat(document.getElementById('tempInput').value);
    const from = document.getElementById('tempFrom').value;
    const resultDiv = document.getElementById('tempResult');
    
    if (isNaN(temp)) {
        notifyInline('Please enter a valid temperature!');
        return;
    }
    
    let result;
    if (from === 'f') {
        result = ((temp - 32) * 5 / 9).toFixed(1);
        resultDiv.innerHTML = temp + '°F = ' + result + '°C';
    } else {
        result = (temp * 9 / 5 + 32).toFixed(1);
        resultDiv.innerHTML = temp + '°C = ' + result + '°F';
    }
    
    resultDiv.style.display = 'block';
}

function addMaterial() {
    const name = document.getElementById('materialName').value;
    const cost = parseFloat(document.getElementById('materialCost').value);
    
    if (!name || isNaN(cost)) {
        notifyInline('Please enter material name and cost!');
        return;
    }
    
    materials.push({ name: name, cost: cost });
    
    document.getElementById('materialName').value = '';
    document.getElementById('materialCost').value = '';
    
    updateMaterialList();
}

function updateMaterialList() {
    const listDiv = document.getElementById('materialList');
    const totalDiv = document.getElementById('materialTotal');
    
    if (materials.length === 0) {
        listDiv.innerHTML = '<em>No materials added yet</em>';
        totalDiv.style.display = 'none';
        return;
    }
    
    let html = '<strong>Materials:</strong><br>';
    let total = 0;
    
    materials.forEach(function(mat, index) {
        html += (index + 1) + '. ' + mat.name + ': $' + mat.cost.toFixed(2) + '<br>';
        total += mat.cost;
    });
    
    listDiv.innerHTML = html;
    totalDiv.innerHTML = 'Total Materials: $' + total.toFixed(2);
    totalDiv.style.display = 'block';
}

function calculateProfit() {
    const materialCost = parseFloat(document.getElementById('materialCostProfit').value);
    const hours = parseFloat(document.getElementById('laborHours').value);
    const rate = parseFloat(document.getElementById('hourlyRate').value);
    const resultDiv = document.getElementById('profitResult');
    
    if (isNaN(materialCost) || isNaN(hours) || isNaN(rate)) {
        notifyInline('Please fill in all fields!');
        return;
    }
    
    const laborCost = hours * rate;
    const totalCost = materialCost + laborCost;
    const suggestedPrice = (totalCost * 2).toFixed(2);
    
    resultDiv.innerHTML = 
        'Material: $' + materialCost.toFixed(2) + '<br>' +
        'Labor: $' + laborCost.toFixed(2) + '<br>' +
        '<strong>Total Cost: $' + totalCost.toFixed(2) + '</strong><br>' +
        '<strong>Suggested Price: $' + suggestedPrice + '</strong>';
    resultDiv.style.display = 'block';
}

// ========================================
// PDF EXPORT FUNCTIONS
// ========================================
function saveColorRecipePDF() {
    const color1 = document.getElementById('color1')?.value;
    const color2 = document.getElementById('color2')?.value;
    const mixedColorEl = document.getElementById('mixedColor');
    
    if (!color1 || !color2 || !mixedColorEl || !mixedColorEl.style.background) {
        notifyInline('❌ Please mix colors first before saving to PDF!');
        return;
    }
    
    const mixedColor = mixedColorEl.style.background;
    
    // Check if jsPDF is available
    if (typeof window.jspdf === 'undefined') {
        notifyInline('❌ PDF library not loaded. Please refresh the page and try again.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(22);
    doc.setTextColor(155, 123, 168);
    doc.text('🎨 Color Mixing Recipe', 105, 20, { align: 'center' });
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Created: ' + new Date().toLocaleDateString(), 105, 28, { align: 'center' });
    
    // Recipe Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Recipe:', 20, 45);
    
    // Color 1
    doc.setFontSize(12);
    doc.text('Color 1:', 30, 60);
    doc.setFillColor(color1);
    doc.rect(70, 53, 30, 10, 'F');
    doc.text(color1.toUpperCase(), 105, 60);
    
    // Plus sign
    doc.setFontSize(16);
    doc.text('+', 95, 80);
    
    // Color 2
    doc.setFontSize(12);
    doc.text('Color 2:', 30, 95);
    doc.setFillColor(color2);
    doc.rect(70, 88, 30, 10, 'F');
    doc.text(color2.toUpperCase(), 105, 95);
    
    // Equals sign
    doc.setFontSize(16);
    doc.text('=', 95, 115);
    
    // Mixed Result
    doc.setFontSize(12);
    doc.text('Mixed Color:', 30, 130);
    
    // Extract RGB from mixed color
    const rgb = mixedColor.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
        doc.setFillColor(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
        doc.rect(70, 123, 30, 10, 'F');
        
        const hexMixed = '#' + 
            parseInt(rgb[0]).toString(16).padStart(2, '0') +
            parseInt(rgb[1]).toString(16).padStart(2, '0') +
            parseInt(rgb[2]).toString(16).padStart(2, '0');
        doc.text(hexMixed.toUpperCase(), 105, 130);
    }
    
    // Notes section
    doc.setFontSize(14);
    doc.text('Notes:', 20, 160);
    doc.setFontSize(10);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 168, 190, 168);
    doc.line(20, 178, 190, 178);
    doc.line(20, 188, 190, 188);
    doc.line(20, 198, 190, 198);
    
    // Tips section
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text('💡 Tips:', 20, 220);
    doc.setFontSize(9);
    doc.text('• Mix equal parts for best results', 25, 230);
    doc.text('• Test on scrap clay first', 25, 238);
    doc.text('• Keep track of ratios for consistency', 25, 246);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text((typeof window.getUserDisplayName === 'function' ? window.getUserDisplayName() : 'Guest') + "'s Clay Studio - Color Mixing Tool", 105, 285, { align: 'center' });
    
    // Save the PDF
    doc.save('color-recipe-' + new Date().getTime() + '.pdf');
    
    notifyInline('✅ Color recipe saved as PDF!');
    unlockBadge('pdf-export');
}

function saveMaterialsPDF() {
    if (materials.length === 0) {
        notifyInline('❌ No materials to export! Add some materials first.');
        return;
    }
    
    // Check if jsPDF is available
    if (typeof window.jspdf === 'undefined') {
        notifyInline('❌ PDF library not loaded. Please refresh the page and try again.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(22);
    doc.setTextColor(155, 123, 168);
    doc.text('📋 Material Cost Report', 105, 20, { align: 'center' });
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Generated: ' + new Date().toLocaleString(), 105, 28, { align: 'center' });
    
    // Project Name (optional)
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const projectNote = document.getElementById('timerNote')?.value || 'Untitled Project';
    doc.text('Project: ' + projectNote, 20, 45);
    
    // Table Header
    doc.setFontSize(11);
    doc.setFillColor(155, 123, 168);
    doc.rect(20, 55, 170, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('#', 25, 62);
    doc.text('Material Name', 40, 62);
    doc.text('Cost', 160, 62, { align: 'right' });
    
    // Table Rows
    doc.setTextColor(0, 0, 0);
    let yPos = 72;
    let total = 0;
    
    materials.forEach((mat, index) => {
        if (yPos > 250) { // Start new page if needed
            doc.addPage();
            yPos = 20;
        }
        
        // Alternating row colors
        if (index % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(20, yPos - 7, 170, 10, 'F');
        }
        
        doc.setFontSize(10);
        doc.text((index + 1).toString(), 25, yPos);
        doc.text(mat.name, 40, yPos);
        doc.text('$' + mat.cost.toFixed(2), 160, yPos, { align: 'right' });
        
        total += mat.cost;
        yPos += 10;
    });
    
    // Total
    yPos += 5;
    doc.setDrawColor(155, 123, 168);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL MATERIALS:', 40, yPos);
    doc.setTextColor(155, 123, 168);
    doc.text('$' + total.toFixed(2), 160, yPos, { align: 'right' });
    
    // Suggested Pricing
    yPos += 15;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text('💰 Pricing Suggestions:', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(9);
    const markup2x = (total * 2).toFixed(2);
    const markup3x = (total * 3).toFixed(2);
    const markup4x = (total * 4).toFixed(2);
    
    doc.text('• 2x Markup (Materials): $' + markup2x, 25, yPos);
    yPos += 7;
    doc.text('• 3x Markup (Standard): $' + markup3x, 25, yPos);
    yPos += 7;
    doc.text('• 4x Markup (Premium): $' + markup4x, 25, yPos);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text((typeof window.getUserDisplayName === 'function' ? window.getUserDisplayName() : 'Guest') + "'s Clay Studio - Material Cost Tracker", 105, 285, { align: 'center' });
    
    // Save the PDF
    doc.save('materials-' + projectNote.replace(/\s+/g, '-').toLowerCase() + '-' + new Date().getTime() + '.pdf');
    
    notifyInline('✅ Materials report exported as PDF!');
    unlockBadge('pdf-export');
}

window.saveColorRecipePDF = saveColorRecipePDF;
window.saveMaterialsPDF = saveMaterialsPDF;

// ========================================
// CART SYSTEM
// ========================================
function showCartToast(message, hint) {
    var el = document.getElementById('cartToast');
    if (!el) return;
    if (hint) {
        el.innerHTML = '<span class="toast-cart__main">' + String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span><span class="toast-cart__hint">' + String(hint).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
    } else {
        el.textContent = message;
    }
    el.classList.add('show');
    setTimeout(function () {
        el.classList.remove('show');
    }, hint ? 3400 : 2400);
}
window.showSiteNotice = showCartToast;

function addToCart(productName, price, productId, stripePriceId) {
    const c = getCart();
    const row = { name: productName, price: price, qty: 1 };
    if (productId && typeof productId === 'string' && productId.trim()) {
        row.productId = productId.trim();
    }
    if (stripePriceId && typeof stripePriceId === 'string' && stripePriceId.trim().startsWith('price_')) {
        row.stripePriceId = stripePriceId.trim();
    }
    c.push(row);
    cartCount++;
    updateCartBadge();
    updateCartPanel();
    persistGuestCart();
    showSocialProof(productName);
    showCartToast('Added to cart: ' + productName, 'Open the cart icon when you are ready to check out.');
    try {
        if (typeof window.logFirstRun === 'function') {
            window.logFirstRun('add_to_cart', { item_name: productName });
        }
    } catch (e) {}
    console.log('Cart:', c);
}

function updateCartBadge() {
    const cartBadge = document.getElementById('cartBadge');
    if (cartBadge) {
        cartBadge.textContent = getCart().length;
    }
}

function updateCartPanel() {
    const cartPanel = document.getElementById('cartPanel');
    const cartItemsDiv = document.getElementById('cartItems');
    const cartEmptyMsg = document.getElementById('cartEmptyMsg');
    const cartTotal = document.getElementById('cartTotal');
    if (!cartPanel || !cartItemsDiv || !cartTotal || !cartEmptyMsg) return;
    
    const productImages = {
        'Handmade Craft Kit': '<i class="fas fa-palette" style="font-size:2em;color:#b8a8d4;"></i>',
        'Crochet Patterns Bundle': '<i class="fas fa-file-pdf" style="font-size:2em;color:#9b7ba8;"></i>',
        'Gaming Buddy Plushie': '<i class="fas fa-gamepad" style="font-size:2em;color:#b8a8d4;"></i>',
        'Dance Tutorial Series': '<i class="fas fa-video" style="font-size:2em;color:#6dd5c3;"></i>',
        'Cozy Mug': '<img src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=60" alt="Cozy Mug" style="width:36px;height:36px;border-radius:8px;object-fit:cover;">',
        'Creative Planner': '<img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=60" alt="Creative Planner" style="width:36px;height:36px;border-radius:8px;object-fit:cover;">',
        'Art Markers Set': '<img src="https://images.unsplash.com/photo-1464983953574-0892a716854b?w=60" alt="Art Markers Set" style="width:36px;height:36px;border-radius:8px;object-fit:cover;">'
    };
    
    cartItemsDiv.innerHTML = '';
    const c = getCart();
    if (c.length === 0) {
        cartEmptyMsg.style.display = 'block';
        cartTotal.textContent = '$0.00';
        cartPanel.style.height = 'auto';
    } else {
        cartEmptyMsg.style.display = 'none';
        let total = 0;
        c.forEach(function(item, idx) {
            total += item.price;
            const itemDiv = document.createElement('div');
            itemDiv.style = 'display:flex;align-items:center;gap:12px;justify-content:space-between;padding:12px 0;border-bottom:1px solid #e0e0e0;';
            let img = productImages[item.name] || '<i class="fas fa-box" style="font-size:2em;color:#b8a8d4;"></i>';
            itemDiv.innerHTML = `<span style="display:flex;align-items:center;gap:10px;min-width:120px;">${img}<span style="font-weight:600;color:#6b5580;">${item.name}</span></span><span style="color:#6dd5c3;font-weight:700;">$${item.price.toFixed(2)}</span><button style="background:none;border:none;color:#e74c3c;font-size:1.2rem;cursor:pointer;margin-left:10px;" onclick="removeFromCart(${idx})"><i class='fas fa-trash'></i></button>`;
            cartItemsDiv.appendChild(itemDiv);
        });
        cartTotal.textContent = '$' + total.toFixed(2);
        setTimeout(() => {
            let itemsHeight = cartItemsDiv.scrollHeight + 220;
            cartPanel.style.height = Math.min(itemsHeight, window.innerHeight * 0.9) + 'px';
        }, 10);
    }
}

function removeFromCart(idx) {
    getCart().splice(idx, 1);
    updateCartBadge();
    updateCartPanel();
    persistGuestCart();
}

function openCartPanel() {
    const cartPanel = document.getElementById('cartPanel');
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartPanel && cartOverlay) {
        cartPanel.style.display = 'block';
        cartOverlay.style.display = 'block';
        setTimeout(() => { cartPanel.style.transform = 'translateX(0)'; }, 10);
        updateCartPanel();
    }
}

function closeCartPanel() {
    const cartPanel = document.getElementById('cartPanel');
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartPanel && cartOverlay) {
        cartPanel.style.transform = 'translateX(100%)';
        setTimeout(() => {
            cartPanel.style.display = 'none';
            cartOverlay.style.display = 'none';
        }, 350);
    }
}

function showSocialProof(productName) {
    const names = ['Sarah', 'Mike', 'Emily', 'Jason', 'Katie', 'David', 'Sophia', 'Chris', 'Maya', 'Alex'];
    const locations = ['Texas', 'California', 'New York', 'Florida', 'Illinois', 'Georgia', 'Oregon', 'Washington'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    
    const socialProof = document.getElementById('socialProof');
    if (!socialProof) return;
    
    const textElement = socialProof.querySelector('.social-proof-text');
    if (textElement) {
        textElement.innerHTML = '<strong>' + randomName + ' from ' + randomLocation + '</strong><span>just purchased ' + productName + '!</span>';
    }
    
    socialProof.style.display = 'flex';
    
    setTimeout(function() {
        socialProof.style.display = 'none';
    }, 5000);
}

// ========================================
// THEME SYSTEM
// ========================================
const themes = {
    default: {
        primaryGradientStart: '#f8f5fa',
        primaryGradientMid: '#faf8fc',
        primaryGradientEnd: '#fcfafd',
        headerGradientStart: '#d8c8e8',
        headerGradientEnd: '#e8d8f0',
        accentColor: '#7a5a9a',
        accentHover: '#6a4a8a',
        pillColor: '#ffe8d8',
        pillHover: '#ffd8c8',
        textPrimary: '#3a2050',
        cardShadow: '#e8d8f0'
    },
    ocean: {
        primaryGradientStart: '#d4f0f8',
        primaryGradientMid: '#e8e8f8',
        primaryGradientEnd: '#e8dff5',
        headerGradientStart: '#c8e0f0',
        headerGradientEnd: '#d4f0f8',
        accentColor: '#2a5a7a',
        accentHover: '#1a4a6a',
        pillColor: '#d4f0f8',
        pillHover: '#c8e8f0',
        textPrimary: '#0a3a5a',
        cardShadow: '#c8e0f0'
    },
    sunset: {
        primaryGradientStart: '#f8d4d9',
        primaryGradientMid: '#fde8d8',
        primaryGradientEnd: '#fef0d9',
        headerGradientStart: '#f0d0d8',
        headerGradientEnd: '#f8d4d9',
        accentColor: '#c04050',
        accentHover: '#b03040',
        pillColor: '#ffe8d8',
        pillHover: '#ffd8c8',
        textPrimary: '#6a2030',
        cardShadow: '#f0c0c8'
    },
    forest: {
        primaryGradientStart: '#d9e8d4',
        primaryGradientMid: '#e0f0d8',
        primaryGradientEnd: '#e8f0d9',
        headerGradientStart: '#c8e0c8',
        headerGradientEnd: '#d9e8d4',
        accentColor: '#3a6a3a',
        accentHover: '#2a5a2a',
        pillColor: '#d9f0d4',
        pillHover: '#c8e8c8',
        textPrimary: '#1a4a1a',
        cardShadow: '#c0d8b8'
    },
    berry: {
        primaryGradientStart: '#f0d9e0',
        primaryGradientMid: '#e8d8e8',
        primaryGradientEnd: '#d9e8f0',
        headerGradientStart: '#e8d0d8',
        headerGradientEnd: '#f0d9e0',
        accentColor: '#9a3a6a',
        accentHover: '#8a2a5a',
        pillColor: '#f0d9e8',
        pillHover: '#e8c8e0',
        textPrimary: '#5a1a4a',
        cardShadow: '#e0c0d8'
    },
    lavender: {
        primaryGradientStart: '#e8d4f5',
        primaryGradientMid: '#f0e0f8',
        primaryGradientEnd: '#f0d9e8',
        headerGradientStart: '#dcc8e8',
        headerGradientEnd: '#e8d4f5',
        accentColor: '#7a3a9a',
        accentHover: '#6a2a8a',
        pillColor: '#e8d4f5',
        pillHover: '#dcc8e8',
        textPrimary: '#4a0a6a',
        cardShadow: '#ce93d8'
    },
    'default-opposite': {
        primaryGradientStart: '#2a1f3c',
        primaryGradientMid: '#1d1834',
        primaryGradientEnd: '#1f112c',
        headerGradientStart: '#3a2f4c',
        headerGradientEnd: '#2a1f3c',
        accentColor: '#c8a8e4',
        accentHover: '#b898d4',
        pillColor: '#2d2844',
        pillHover: '#3a3560',
        textPrimary: '#f5f0ff',
        cardShadow: '#1f1444'
    },
    'ocean-opposite': {
        primaryGradientStart: '#1a3a48',
        primaryGradientMid: '#223a48',
        primaryGradientEnd: '#0f2a38',
        headerGradientStart: '#2a4a58',
        headerGradientEnd: '#1a3a48',
        accentColor: '#c8e8f8',
        accentHover: '#b8d8e8',
        pillColor: '#1f3a48',
        pillHover: '#2a4553',
        textPrimary: '#e8f8ff',
        cardShadow: '#0f2a38'
    },
    'sunset-opposite': {
        primaryGradientStart: '#3a1a15',
        primaryGradientMid: '#4a2a20',
        primaryGradientEnd: '#2a1a10',
        headerGradientStart: '#4a2a25',
        headerGradientEnd: '#3a1a15',
        accentColor: '#f8b0b8',
        accentHover: '#e8a0a8',
        pillColor: '#3a2a20',
        pillHover: '#4a3a30',
        textPrimary: '#fff5f3',
        cardShadow: '#2a1a10'
    },
    'forest-opposite': {
        primaryGradientStart: '#1a3a20',
        primaryGradientMid: '#2a4a30',
        primaryGradientEnd: '#0f2a15',
        headerGradientStart: '#2a4a30',
        headerGradientEnd: '#1a3a20',
        accentColor: '#b8e8b0',
        accentHover: '#a8d8a0',
        pillColor: '#1f3a25',
        pillHover: '#2a4a30',
        textPrimary: '#e8ffe3',
        cardShadow: '#0f2a10'
    },
    'berry-opposite': {
        primaryGradientStart: '#2a1f30',
        primaryGradientMid: '#3a2a40',
        primaryGradientEnd: '#1f2a30',
        headerGradientStart: '#3a2a38',
        headerGradientEnd: '#2a1f30',
        accentColor: '#f8b0d8',
        accentHover: '#e8aac8',
        pillColor: '#2f2a30',
        pillHover: '#3a3540',
        textPrimary: '#fff3ff',
        cardShadow: '#1f1a28'
    },
    'lavender-opposite': {
        primaryGradientStart: '#2a1a48',
        primaryGradientMid: '#3a2a58',
        primaryGradientEnd: '#1f1a38',
        headerGradientStart: '#3a2a48',
        headerGradientEnd: '#2a1a38',
        accentColor: '#e8b8f8',
        accentHover: '#d8a8e8',
        pillColor: '#2f2a48',
        pillHover: '#3a3a58',
        textPrimary: '#f8e4ff',
        cardShadow: '#1f1a38'
    }
};

function applyTheme(themeName) {
    const theme = themes[themeName];
    if (!theme) return;
    
    const root = document.documentElement;
    const body = document.body;
    
    root.style.setProperty('--primary-gradient-start', theme.primaryGradientStart);
    root.style.setProperty('--primary-gradient-mid', theme.primaryGradientMid);
    root.style.setProperty('--primary-gradient-end', theme.primaryGradientEnd);
    root.style.setProperty('--header-gradient-start', theme.headerGradientStart);
    root.style.setProperty('--header-gradient-end', theme.headerGradientEnd);
    root.style.setProperty('--accent-color', theme.accentColor);
    root.style.setProperty('--accent-hover', theme.accentHover);
    root.style.setProperty('--pill-color', theme.pillColor);
    root.style.setProperty('--pill-hover', theme.pillHover);
    root.style.setProperty('--text-primary', theme.textPrimary);
    root.style.setProperty('--card-shadow', theme.cardShadow);
    
    body.classList.remove('opposite-mode');
    localStorage.removeItem('oppositeMode');
    
    localStorage.setItem('selectedTheme', themeName);
    userProfile.preferences.theme = themeName;
    saveUserProfile();
    
    document.querySelectorAll('.theme-option').forEach(function(opt) {
        opt.classList.remove('active');
    });
    const activeTheme = document.querySelector('[data-theme="' + themeName + '"]');
    if (activeTheme) activeTheme.classList.add('active');
    
    unlockBadge('theme-changer');
}

function toggleOppositeMode() {
    const currentTheme = localStorage.getItem('selectedTheme') || 'default';
    const baseTheme = currentTheme.replace('-opposite', '');
    const isOpposite = currentTheme.includes('-opposite');
    
    const newTheme = isOpposite ? baseTheme : baseTheme + '-opposite';
    applyTheme(newTheme);
}

// ========================================
// USER PROFILE & SAVE FUNCTIONS
// ========================================
function saveUserProfile() {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    updateUserGreeting();
}

function updateUserGreeting() {
    const greetingElements = document.querySelectorAll('.user-greeting');
    greetingElements.forEach(function(el) {
        el.textContent = 'Welcome back, ' + userProfile.name + '! 🎨';
    });
}

function savePersonalizationData() {
    localStorage.setItem('personalizationData', JSON.stringify(personalizationData));
}

function saveAnalyticsData() {
    localStorage.setItem('analyticsData', JSON.stringify(analyticsData));
}

function trackPageView(page) {
    analyticsData.pageViews[page] = (analyticsData.pageViews[page] || 0) + 1;
    saveAnalyticsData();
}

function trackAction(action, details = {}) {
    analyticsData.userActions.push({
        action: action,
        timestamp: new Date().toISOString(),
        details: details
    });
    saveAnalyticsData();
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }
}

async function renderConsentAuditTrail() {
    const host = document.getElementById('consentAuditTrail');
    if (!host) return;
    let localRecord = null;
    let serverRecord = null;
    try {
        localRecord = JSON.parse(localStorage.getItem(MEMBERSHIP_AGREEMENT_RECORD_KEY) || 'null');
    } catch (e) {}
    try {
        if (window.__CRAFT_SECURITY_CONTEXT && window.__CRAFT_SECURITY_CONTEXT.consent) {
            serverRecord = window.__CRAFT_SECURITY_CONTEXT.consent;
        } else {
            await fetchSecurityContextFromServer();
            serverRecord =
                window.__CRAFT_SECURITY_CONTEXT && window.__CRAFT_SECURITY_CONTEXT.consent
                    ? window.__CRAFT_SECURITY_CONTEXT.consent
                    : null;
        }
    } catch (e2) {}
    const level = (serverRecord && serverRecord.level) || (localRecord && localRecord.level) || 'not accepted';
    const version = (serverRecord && serverRecord.version) || (localRecord && localRecord.version) || 'n/a';
    const acceptedAt =
        (serverRecord && (serverRecord.acceptedAtClient || serverRecord.acceptedAt)) ||
        (localRecord && localRecord.acceptedAt) ||
        '';
    const disclosureAccepted =
        !!(serverRecord && serverRecord.aiDisclosureAccepted) || hasAcceptedAiDisclosure();
    host.innerHTML =
        '<div style="background:rgba(109,213,195,0.12);border:1px solid rgba(109,213,195,0.3);padding:10px;border-radius:10px;">' +
        '<strong style="display:block;margin-bottom:6px;">Consent Audit Trail</strong>' +
        '<div style="font-size:0.84rem;color:var(--text-secondary);line-height:1.55;">' +
        'Level: <strong>' + String(level).toUpperCase() + '</strong><br>' +
        'Policy version: <strong>' + String(version) + '</strong><br>' +
        'Accepted: <strong>' + (acceptedAt ? new Date(acceptedAt).toLocaleString() : 'Not yet') + '</strong><br>' +
        'AI disclosure accepted: <strong>' + (disclosureAccepted ? 'Yes' : 'No') + '</strong><br>' +
        'Source: <strong>' + (serverRecord ? 'Server verified' : 'Local fallback') + '</strong>' +
        '</div></div>';
}
window.renderConsentAuditTrail = renderConsentAuditTrail;

function isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

function trapFocusInModal(modalEl, event) {
    if (!isElementVisible(modalEl) || event.key !== 'Tab') return;
    const focusables = Array.from(
        modalEl.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter(function (n) {
        return n.offsetParent !== null;
    });
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function setupModalAccessibility() {
    const modalIds = ['authModal', 'aiOnboardingModal', 'profileModal', 'tipModal', 'quickJumpModal'];
    document.addEventListener('keydown', function (event) {
        const visible = modalIds
            .map(function (id) { return document.getElementById(id); })
            .filter(function (el) { return isElementVisible(el); });
        if (!visible.length) return;
        const topModal = visible[visible.length - 1];
        if (event.key === 'Escape') {
            if (topModal.id === 'authModal' && typeof closeAuthModal === 'function') closeAuthModal();
            else if (topModal.id === 'aiOnboardingModal' && typeof closeAiOnboardingWizard === 'function') closeAiOnboardingWizard();
            else if (topModal.id === 'profileModal' && typeof closeProfileModal === 'function') closeProfileModal();
            else if (topModal.id === 'tipModal' && typeof closeTipModal === 'function') closeTipModal();
            else if (topModal.id === 'quickJumpModal') topModal.style.display = 'none';
            event.preventDefault();
            return;
        }
        trapFocusInModal(topModal, event);
    });
}

/** Expand/collapse QA cart shortcuts (Platform tab hides this block once signed in). */
function toggleProfileCartSmokePanel() {
    const el = document.getElementById('profileCartSmokePanel');
    if (!el) return;
    const open = el.style.display === 'block';
    el.style.display = open ? 'none' : 'block';
}
window.toggleProfileCartSmokePanel = toggleProfileCartSmokePanel;

function saveProfile() {
    const nameInput = document.getElementById('profileName');
    const skillInput = document.getElementById('profileSkill');
    
    if (nameInput) userProfile.name = nameInput.value;
    if (skillInput) userProfile.skillLevel = skillInput.value;
    
    saveUserProfile();
    closeProfileModal();
    if (typeof window.refreshUserDisplayNameInUI === 'function') window.refreshUserDisplayNameInUI();
    notifyInline('✅ Profile saved successfully!');
}

function showUserProfile(fromAuthWait, authRetryCount) {
    authRetryCount = authRetryCount || 0;
    const auth = getAuth();
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const hasStoredEmail = !!(profile.email && String(profile.email).trim());
    let user = getCurrentFirebaseUser();

    var signedInDom =
        typeof document !== 'undefined' &&
        document.documentElement.getAttribute('data-auth-signed-in') === 'true';

    // Firebase restores session asynchronously after load / redirect; a sync read of
    // currentUser is often null briefly. If the page already marked signed-in, retry
    // instead of sending the user to the login modal.
    if (!user && !hasStoredEmail) {
        if (signedInDom && authRetryCount < 30) {
            setTimeout(function () {
                showUserProfile(true, authRetryCount + 1);
            }, 50);
            return;
        }
        if (signedInDom) {
            user = auth?.currentUser ?? null;
            try {
                if (!user && typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                    user = firebase.auth().currentUser;
                }
            } catch (e) {}
        }
        if (!user && !hasStoredEmail) {
            if (!auth || fromAuthWait) {
                openAuthModal();
                return;
            }
            const unsub = auth.onAuthStateChanged(function () {
                unsub();
                showUserProfile(true);
            });
            return;
        }
    }

    user = getCurrentFirebaseUser();
    const badges = JSON.parse(localStorage.getItem('unlockedBadges') || '[]');
    const orders = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');

    try {
        var _pm = document.getElementById('profileModal');
        if (_pm) _pm.remove();
    } catch (e) {}

    const profileHTML = 
        '<div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 3000; display: flex; align-items: center; justify-content: center;" id="profileModal">' +
            '<div class="modal-draggable" style="background: var(--card-bg); border-radius: 20px; padding: 40px; max-width: 650px; width: 90%; color: var(--text-color); max-height: 90vh; overflow-y: auto; cursor: move;">' +
                '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">' +
                    '<h2 style="color: var(--text-primary);">👤 Your Profile</h2>' +
                    '<button onclick="closeProfileModal()" style="background: none; border: none; font-size: 2rem; cursor: pointer; color: var(--muted-text);">&times;</button>' +
                '</div>' +
                
                // Profile Photo & Basic Info
                '<div style="text-align: center; margin-bottom: 30px;">' +
                    '<div style="width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-color), var(--accent-hover)); margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white; position: relative; overflow: hidden;" id="profilePhotoContainer">' +
                        (user?.photoURL || profile.photoURL ? 
                            '<img src="' + (user?.photoURL || profile.photoURL) + '" style="width:100%;height:100%;object-fit:cover;">' : 
                            '<i class="fas fa-user"></i>') +
                    '</div>' +
                    '<input type="file" id="profilePhotoInput" accept="image/*" style="display:none;" onchange="uploadProfilePhoto(event)">' +
                    '<button onclick="document.getElementById(\'profilePhotoInput\').click()" style="background: var(--accent-color); color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 0.85rem; margin-top: 10px;">' +
                        '<i class="fas fa-camera"></i> Change Photo' +
                    '</button>' +
                    '<h3 style="color: var(--text-primary); margin-top: 15px;">' + (user?.displayName || profile.name || 'Artist') + '</h3>' +
                    '<p style="color: var(--text-secondary); font-size: 0.9rem;">' + (user?.email || profile.email || '') + '</p>' +
                '</div>' +
                
                // Profile Tabs
                '<div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #e0e0e0;">' +
                    '<button onclick="switchProfileTab(\'info\')" id="profileTabInfo" class="profile-tab active" style="padding: 10px 20px; background: none; border: none; cursor: pointer; font-weight: 600; border-bottom: 3px solid var(--accent-color); color: var(--accent-color);">Info</button>' +
                    '<button onclick="switchProfileTab(\'orders\')" id="profileTabOrders" class="profile-tab" style="padding: 10px 20px; background: none; border: none; cursor: pointer; font-weight: 600; color: var(--text-secondary);">Orders</button>' +
                    '<button onclick="switchProfileTab(\'wishlist\')" id="profileTabWishlist" class="profile-tab" style="padding: 10px 20px; background: none; border: none; cursor: pointer; font-weight: 600; color: var(--text-secondary);">Wishlist</button>' +
                    '<button onclick="switchProfileTab(\'badges\')" id="profileTabBadges" class="profile-tab" style="padding: 10px 20px; background: none; border: none; cursor: pointer; font-weight: 600; color: var(--text-secondary);">Badges</button>' +
                    '<button onclick="switchProfileTab(\'settings\')" id="profileTabSettings" class="profile-tab" style="padding: 10px 20px; background: none; border: none; cursor: pointer; font-weight: 600; color: var(--text-secondary);">Settings</button>' +
                '</div>' +
                
                // Info Tab
                '<div id="profileContentInfo" class="profile-content">' +
                    '<div style="margin-bottom: 20px;">' +
                        '<label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 600;">Display Name</label>' +
                        '<input type="text" id="profileName" value="' + (user?.displayName || profile.name || '') + '" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 10px; background: var(--card-bg); color: var(--text-color);">' +
                    '</div>' +
                    '<div style="margin-bottom: 20px;">' +
                        '<label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 600;">Bio</label>' +
                        '<textarea id="profileBio" rows="3" placeholder="Tell us about yourself..." style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 10px; background: var(--card-bg); color: var(--text-color); resize: vertical;">' + (profile.bio || '') + '</textarea>' +
                    '</div>' +
                    '<div style="margin-bottom: 20px;">' +
                        '<label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 600;">Skill Level</label>' +
                        '<select id="profileSkill" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 10px; background: var(--card-bg); color: var(--text-color);">' +
                            '<option value="beginner" ' + (profile.skillLevel === 'beginner' ? 'selected' : '') + '>Beginner</option>' +
                            '<option value="intermediate" ' + (profile.skillLevel === 'intermediate' ? 'selected' : '') + '>Intermediate</option>' +
                            '<option value="advanced" ' + (profile.skillLevel === 'advanced' ? 'selected' : '') + '>Advanced</option>' +
                            '<option value="expert" ' + (profile.skillLevel === 'expert' ? 'selected' : '') + '>Expert</option>' +
                        '</select>' +
                    '</div>' +
                    '<div style="background: linear-gradient(135deg, var(--pill-color) 0%, #ffe4dc 100%); padding: 20px; border-radius: 15px;">' +
                        '<h3 style="color: var(--text-primary); margin-bottom: 15px;">🎨 Your Stats</h3>' +
                        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:15px;">' +
                            '<div style="background:rgba(231,76,60,0.1);padding:12px;border-radius:10px;border:1px solid rgba(231,76,60,0.2);">' +
                                '<div style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:4px;"><i class="fas fa-fire" style="color:#e74c3c;"></i> Streak</div>' +
                                '<div style="color:var(--text-primary);font-size:1.5rem;font-weight:700;" id="profileStreak">0</div>' +
                            '</div>' +
                            '<div style="background:rgba(243,156,18,0.1);padding:12px;border-radius:10px;border:1px solid rgba(243,156,18,0.2);">' +
                                '<div style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:4px;"><i class="fas fa-star" style="color:#f39c12;"></i> XP</div>' +
                                '<div style="color:var(--text-primary);font-size:1.5rem;font-weight:700;" id="profileXP">0</div>' +
                            '</div>' +
                            '<div style="background:rgba(109,213,195,0.1);padding:12px;border-radius:10px;border:1px solid rgba(109,213,195,0.2);">' +
                                '<div style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:4px;"><i class="fas fa-level-up-alt" style="color:#6dd5c3;"></i> Level</div>' +
                                '<div style="color:var(--text-primary);font-size:1.5rem;font-weight:700;" id="profileLevel">1</div>' +
                            '</div>' +
                            '<div style="background:rgba(155,123,168,0.1);padding:12px;border-radius:10px;border:1px solid rgba(155,123,168,0.2);">' +
                                '<div style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:4px;"><i class="fas fa-users" style="color:#9b7ba8;"></i> Following</div>' +
                                '<div style="color:var(--text-primary);font-size:1.5rem;font-weight:700;" id="profileFollowing">0</div>' +
                            '</div>' +
                        '</div>' +
                        '<p style="color: var(--text-secondary); margin: 8px 0;"><strong>Projects Completed:</strong> ' + (profile.completedProjects || 0) + '</p>' +
                        '<p style="color: var(--text-secondary); margin: 8px 0;"><strong>Total Clay Used:</strong> ' + (profile.totalClayUsed || 0) + 'oz</p>' +
                        '<p style="color: var(--text-secondary); margin: 8px 0;"><strong>Badges Earned:</strong> ' + badges.length + '</p>' +
                        '<p style="color: var(--text-secondary); margin: 8px 0;"><strong>Member Since:</strong> ' + new Date(profile.joinDate || Date.now()).toLocaleDateString() + '</p>' +
                    '</div>' +
                '</div>' +
                
                // Orders Tab
                '<div id="profileContentOrders" class="profile-content" style="display:none;">' +
                    (orders.length === 0 ? 
                        '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">' +
                            '<i class="fas fa-shopping-bag" style="font-size: 3rem; opacity: 0.3; margin-bottom: 15px;"></i>' +
                            '<p>No orders yet</p>' +
                            '<p style="font-size: 0.85rem;">Start shopping to see your order history here!</p>' +
                        '</div>' :
                        orders.map(order => 
                            '<div style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 10px; border: 1px solid #e0e0e0;">' +
                                '<div style="display: flex; justify-content: space-between; margin-bottom: 10px;">' +
                                    '<strong style="color: var(--text-primary);">Order #' + order.id + '</strong>' +
                                    '<span style="color: var(--text-secondary); font-size: 0.85rem;">' + new Date(order.date).toLocaleDateString() + '</span>' +
                                '</div>' +
                                '<p style="color: var(--text-secondary); margin: 5px 0;">' + order.items.length + ' items - $' + order.total.toFixed(2) + '</p>' +
                                '<span style="background: ' + (order.status === 'delivered' ? '#4caf50' : '#ff9800') + '; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.75rem;">' + order.status + '</span>' +
                            '</div>'
                        ).join('')
                    ) +
                '</div>' +
                
                // Wishlist Tab
                '<div id="profileContentWishlist" class="profile-content" style="display:none;">' +
                    (wishlist.length === 0 ? 
                        '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">' +
                            '<i class="fas fa-heart" style="font-size: 3rem; opacity: 0.3; margin-bottom: 15px;"></i>' +
                            '<p>Your wishlist is empty</p>' +
                            '<p style="font-size: 0.85rem;">Save items to your wishlist for later!</p>' +
                        '</div>' :
                        wishlist.map(item => 
                            '<div style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 10px; border: 1px solid #e0e0e0; display: flex; gap: 15px;">' +
                                '<div style="width: 80px; height: 80px; background: #f5f5f5; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 2rem;">' + (item.image || '🎨') + '</div>' +
                                '<div style="flex: 1;">' +
                                    '<h4 style="color: var(--text-primary); margin-bottom: 5px;">' + item.name + '</h4>' +
                                    '<p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 8px;">' + item.description + '</p>' +
                                    '<strong style="color: var(--accent-color);">$' + item.price.toFixed(2) + '</strong>' +
                                '</div>' +
                                '<button onclick="removeFromWishlist(\'' + item.id + '\')" style="background: none; border: none; color: #ff5252; cursor: pointer; font-size: 1.2rem;"><i class="fas fa-trash"></i></button>' +
                            '</div>'
                        ).join('')
                    ) +
                '</div>' +
                
                // Badges Tab
                '<div id="profileContentBadges" class="profile-content" style="display:none;">' +
                    '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px;">' +
                        (badges.length === 0 ?
                            '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">' +
                                '<i class="fas fa-award" style="font-size: 3rem; opacity: 0.3; margin-bottom: 15px;"></i>' +
                                '<p>No badges yet</p>' +
                                '<p style="font-size: 0.85rem;">Complete activities to earn badges!</p>' +
                            '</div>' :
                            badges.map(badge => 
                                '<div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #fff8e1, #ffe4dc); border-radius: 12px;">' +
                                    '<div style="font-size: 2.5rem; margin-bottom: 8px;">' + (badge.icon || '🏆') + '</div>' +
                                    '<div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">' + badge.name + '</div>' +
                                    '<div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 4px;">' + new Date(badge.date).toLocaleDateString() + '</div>' +
                                '</div>'
                            ).join('')
                        ) +
                    '</div>' +
                '</div>' +
                
                // Settings Tab
                '<div id="profileContentSettings" class="profile-content" style="display:none;">' +
                    '<div style="margin-bottom: 20px;">' +
                        '<h3 style="color: var(--text-primary); margin-bottom: 15px;">Preferences</h3>' +
                        '<label style="display: flex; align-items: center; margin-bottom: 12px; cursor: pointer;">' +
                            '<input type="checkbox" id="emailNotifications" ' + (profile.emailNotifications !== false ? 'checked' : '') + ' style="margin-right: 10px; width: 18px; height: 18px;">' +
                            '<span style="color: var(--text-secondary);">Email notifications</span>' +
                        '</label>' +
                        '<label style="display: flex; align-items: center; margin-bottom: 12px; cursor: pointer;">' +
                            '<input type="checkbox" id="promotionalEmails" ' + (profile.promotionalEmails ? 'checked' : '') + ' style="margin-right: 10px; width: 18px; height: 18px;">' +
                            '<span style="color: var(--text-secondary);">Promotional emails</span>' +
                        '</label>' +
                        '<label style="display: flex; align-items: center; margin-bottom: 12px; cursor: pointer;">' +
                            '<input type="checkbox" id="publicProfile" ' + (profile.publicProfile ? 'checked' : '') + ' style="margin-right: 10px; width: 18px; height: 18px;">' +
                            '<span style="color: var(--text-secondary);">Make profile public</span>' +
                        '</label>' +
                        '<button type="button" onclick="var m=document.getElementById(\'themeModal\');var o=document.getElementById(\'themeOverlay\');if(m){m.style.display=\'flex\';}if(o){o.style.display=\'block\';}" style="width:100%;margin-top:12px;background:linear-gradient(135deg,#9b7ba8,#6dd5c3);color:#fff;border:none;padding:12px;border-radius:10px;cursor:pointer;font-weight:600;"><i class="fas fa-palette"></i> Appearance &amp; theme</button>' +
                    '</div>' +
                    '<div style="margin-bottom:20px;padding:14px;border-radius:12px;background:rgba(255,255,255,0.65);border:1px solid rgba(109,213,195,0.24);">' +
                        '<h3 style="color:var(--text-primary);margin:0 0 8px;"><i class="fas fa-wand-magic-sparkles"></i> AI Quick Setup</h3>' +
                        '<p style="margin:0 0 10px;color:var(--text-secondary);font-size:0.9rem;line-height:1.45;">Available from Profile for Premium members. Set your onboarding and personalization here.</p>' +
                        '<div id="profileAiPremiumGate" style="background:rgba(255,240,240,0.8);border:1px solid rgba(231,76,60,0.25);border-radius:12px;padding:12px;margin:0 0 12px;">' +
                            '<strong style="display:block;color:var(--text-primary);margin-bottom:6px;">Premium access required</strong>' +
                            '<p style="margin:0;color:var(--text-secondary);font-size:0.9rem;line-height:1.45;">Upgrade to <strong>Pro</strong> or higher to use AI Quick Setup.</p>' +
                        '</div>' +
                        '<div id="membershipAgreementGate" style="background:rgba(255,240,240,0.8);border:1px solid rgba(231,76,60,0.25);border-radius:12px;padding:12px;margin:0 0 12px;">' +
                            '<strong style="display:block;color:var(--text-primary);margin-bottom:6px;">Member agreement required</strong>' +
                            '<p style="margin:0 0 10px;color:var(--text-secondary);font-size:0.9rem;line-height:1.45;">To use personalization features (AI or Classic), select and accept one agreement level.</p>' +
                            '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
                                '<select id="membershipAgreementLevelSelect" style="padding:8px;border-radius:8px;border:1px solid rgba(109,213,195,0.35);">' +
                                    '<option value="">Select agreement level...</option>' +
                                    '<option value="free">Free</option>' +
                                    '<option value="pro">Pro</option>' +
                                    '<option value="enterprise">Enterprise</option>' +
                                    '<option value="whitelabel">Whitelabel</option>' +
                                '</select>' +
                                '<label style="display:flex;align-items:center;gap:6px;color:var(--text-secondary);font-size:0.86rem;">' +
                                    '<input type="checkbox" id="membershipAgreementConfirm">' +
                                    'I accept this level\'s terms' +
                                '</label>' +
                                '<button type="button" class="platform-btn secondary" onclick="acceptMembershipAgreementLevel()">Accept</button>' +
                            '</div>' +
                        '</div>' +
                        '<div id="aiQuickSetupContent">' +
                            '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;background:rgba(255,255,255,0.72);border:1px solid rgba(109,213,195,0.25);border-radius:12px;padding:10px;margin-bottom:12px;">' +
                                '<strong style="color:var(--text-primary);font-size:0.95rem;">Personalization mode</strong>' +
                                '<label style="display:flex;align-items:center;gap:8px;color:var(--text-secondary);font-size:0.9rem;cursor:pointer;">' +
                                    '<input type="checkbox" id="aiModeToggle" onchange="toggleAiExperienceMode(this.checked)">' +
                                    'Use AI personalization' +
                                '</label>' +
                            '</div>' +
                            '<div id="classicSystemDoc" style="display:none;background:rgba(255,245,226,0.85);border:1px solid rgba(243,156,18,0.3);border-radius:12px;padding:12px;margin-bottom:12px;">' +
                                '<strong style="display:block;color:var(--text-primary);margin-bottom:6px;">Classic CRAFT System (no AI required)</strong>' +
                                '<p style="margin:0;color:var(--text-secondary);font-size:0.9rem;line-height:1.5;">C = Clarify one weekly outcome. R = Reduce scope to one main project. A = Act daily in short sessions. F = Feedback every 48 hours. T = Track completion and blockers weekly.</p>' +
                            '</div>' +
                            '<div id="aiExperienceAi">' +
                                '<div style="display:flex;gap:10px;flex-wrap:wrap;margin:10px 0 14px;">' +
                                    '<button type="button" class="platform-btn" onclick="openAiOnboardingWizard()"><i class="fas fa-rocket"></i> Start AI onboarding</button>' +
                                '</div>' +
                                '<div id="aiCoachPanel" style="background:rgba(109,213,195,0.12);border:1px solid rgba(109,213,195,0.35);border-radius:12px;padding:12px;margin-bottom:10px;">' +
                                    '<strong style="display:block;color:var(--text-primary);margin-bottom:6px;">Ask AI Coach</strong>' +
                                    '<p id="aiCoachTipText" style="margin:0;color:var(--text-secondary);font-size:0.92rem;line-height:1.5;">Run onboarding to get context-aware guidance.</p>' +
                                '</div>' +
                                '<div id="firstWeekPlanPanel" style="display:none;background:rgba(255,255,255,0.7);border:1px solid rgba(153,102,204,0.25);border-radius:12px;padding:12px;margin-bottom:10px;">' +
                                    '<strong style="display:block;color:var(--text-primary);margin-bottom:6px;">First-Week Auto Plan</strong>' +
                                    '<ul id="firstWeekPlanList" style="margin:0;padding-left:1.1rem;color:var(--text-primary);font-size:0.9rem;line-height:1.6;"></ul>' +
                                '</div>' +
                                '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;">' +
                                    '<div style="background:rgba(255,255,255,0.7);border:1px solid rgba(109,213,195,0.25);border-radius:12px;padding:10px;">' +
                                        '<strong style="display:block;color:var(--text-primary);margin-bottom:6px;">Weekly check-in</strong>' +
                                        '<label style="font-size:0.82rem;color:var(--text-secondary);display:block;margin-bottom:6px;">Energy</label>' +
                                        '<input id="aiWeeklyEnergy" type="range" min="1" max="10" value="7" style="width:100%;">' +
                                        '<label style="font-size:0.82rem;color:var(--text-secondary);display:block;margin:6px 0;">Biggest blocker</label>' +
                                        '<input id="aiWeeklyBlocker" type="text" placeholder="Time, focus, confidence..." style="width:100%;padding:8px;border-radius:8px;border:1px solid rgba(109,213,195,0.3);">' +
                                        '<button type="button" class="platform-btn secondary" style="margin-top:8px;width:100%;" onclick="saveAiWeeklyCheckIn()">Save check-in</button>' +
                                    '</div>' +
                                    '<div style="background:rgba(255,255,255,0.7);border:1px solid rgba(109,213,195,0.25);border-radius:12px;padding:10px;">' +
                                        '<strong style="display:block;color:var(--text-primary);margin-bottom:6px;">Progress engine</strong>' +
                                        '<p id="aiMilestoneSummary" style="margin:0;color:var(--text-secondary);font-size:0.9rem;line-height:1.45;">No milestones yet.</p>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div id="aiExperienceClassic" style="display:none;">' +
                                '<div style="display:flex;gap:10px;flex-wrap:wrap;margin:10px 0 14px;">' +
                                    '<button type="button" class="platform-btn" onclick="switchTab(\'shop\')"><i class="fas fa-list-check"></i> Open manual setup path</button>' +
                                '</div>' +
                                '<div style="background:rgba(109,213,195,0.12);border:1px solid rgba(109,213,195,0.35);border-radius:12px;padding:12px;margin-bottom:10px;">' +
                                    '<strong style="display:block;color:var(--text-primary);margin-bottom:6px;">Classic coach card</strong>' +
                                    '<p style="margin:0;color:var(--text-secondary);font-size:0.92rem;line-height:1.5;">Choose one clear output today, set a 25-minute timer, ship a rough version, then improve tomorrow.</p>' +
                                '</div>' +
                                '<div style="background:rgba(255,255,255,0.7);border:1px solid rgba(153,102,204,0.25);border-radius:12px;padding:12px;margin-bottom:10px;">' +
                                    '<strong style="display:block;color:var(--text-primary);margin-bottom:6px;">First-Week Classic Plan</strong>' +
                                    '<ul style="margin:0;padding-left:1.1rem;color:var(--text-primary);font-size:0.9rem;line-height:1.6;">' +
                                        '<li>Day 1: Pick one project and define done.</li>' +
                                        '<li>Day 2: Gather materials and remove one friction point.</li>' +
                                        '<li>Day 3: Build draft one and document what worked.</li>' +
                                        '<li>Day 4: Improve one weak section only.</li>' +
                                        '<li>Day 5: Publish or share for feedback.</li>' +
                                        '<li>Day 6: Apply one improvement from feedback.</li>' +
                                        '<li>Day 7: Review week and set next-week top 3.</li>' +
                                    '</ul>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    (user ?
                        '<div style="margin-bottom: 20px; border-bottom: 2px solid #e0e0e0; padding-bottom: 20px;">' +
                            '<h3 style="color: var(--text-primary); margin-bottom: 10px;">Cart &amp; checkout (QA)</h3>' +
                            '<p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 12px; line-height: 1.45;">After sign-in, the Platform tab no longer shows the smoke-test strip. Use the button below to add the same test line items.</p>' +
                            '<button type="button" onclick="toggleProfileCartSmokePanel()" style="width: 100%; background: linear-gradient(135deg, #78909c 0%, #546e7a 100%); color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; margin-bottom: 10px; font-weight: 600;">' +
                                '<i class="fas fa-vial"></i> Cart smoke tests' +
                            '</button>' +
                            '<div id="profileCartSmokePanel" style="display: none; padding: 12px; background: rgba(109,213,195,0.12); border-radius: 10px; border: 1px dashed rgba(109,213,195,0.45);">' +
                                '<div style="display: flex; flex-wrap: wrap; gap: 8px;">' +
                                    '<button type="button" onclick="addToCart(\'STL — Vintage Florals pack\', 8.99)" style="padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.12); background: var(--card-bg); cursor: pointer; font-size: 0.85rem;">STL pack</button>' +
                                    '<button type="button" onclick="addToCart(\'Ultimate Digital Bundle\', 12.99)" style="padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.12); background: var(--card-bg); cursor: pointer; font-size: 0.85rem;">Digital bundle</button>' +
                                    '<button type="button" onclick="addToCart(\'Polymer Clay Starter Kit\', 24.99)" style="padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.12); background: var(--card-bg); cursor: pointer; font-size: 0.85rem;">Starter kit</button>' +
                                    '<button type="button" onclick="closeProfileModal(); if(typeof switchTab===\'function\'){ switchTab(\'community\'); setTimeout(function(){ var el=document.getElementById(\'tier-h\'); if(el) el.scrollIntoView({behavior:\'smooth\',block:\'start\'}); }, 120); }" style="padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.12); background: var(--card-bg); cursor: pointer; font-size: 0.85rem;">Open Community tiers</button>' +
                                '</div>' +
                            '</div>' +
                            '<button type="button" onclick="captureProfileScreenshot()" style="width:100%;margin-top:10px;background:linear-gradient(135deg,#6dd5c3,#4fc3b0);color:#fff;border:none;padding:11px;border-radius:10px;cursor:pointer;font-weight:600;"><i class="fas fa-camera"></i> Capture screenshot</button>' +
                            '<p style="margin:8px 0 0;font-size:0.78rem;color:var(--text-secondary);line-height:1.4;">Screenshot is available only while signed in from Profile.</p>' +
                        '</div>' : '') +
                    '<div style="margin-bottom:20px;">' +
                        '<h3 style="color: var(--text-primary); margin-bottom: 10px;">Compliance</h3>' +
                        '<div id="consentAuditTrail" style="min-height:64px;"></div>' +
                    '</div>' +
                    '<div style="border-top: 2px solid #e0e0e0; padding-top: 20px;">' +
                        '<h3 style="color: var(--text-primary); margin-bottom: 15px;">Account Actions</h3>' +
                        '<button onclick="changePassword()" style="width: 100%; background: #2196f3; color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; margin-bottom: 10px; font-weight: 600;">' +
                            '<i class="fas fa-key"></i> Change Password' +
                        '</button>' +
                        '<button onclick="signOut()" style="width: 100%; background: #ff9800; color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; margin-bottom: 10px; font-weight: 600;">' +
                            '<i class="fas fa-sign-out-alt"></i> Sign Out' +
                        '</button>' +
                        '<button onclick="deleteAccount()" style="width: 100%; background: #f44336; color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: 600;">' +
                            '<i class="fas fa-trash-alt"></i> Delete Account' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                
                '<button onclick="saveProfile()" style="width: 100%; background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-hover) 100%); color: white; border: none; padding: 14px; border-radius: 25px; cursor: pointer; font-weight: 600; font-size: 1rem; margin-top: 20px;">' +
                    '💾 Save Changes' +
                '</button>' +
            '</div>' +
        '</div>';
    
    document.body.insertAdjacentHTML('beforeend', profileHTML);
    renderConsentAuditTrail();
    syncMembershipAgreementUI();
    syncAiExperienceModeUI();
    renderFirstWeekPlan();
    refreshAiCoachTip();
    refreshAiMilestones();
    
    // Update gamification stats from userStatsBar
    setTimeout(() => {
        const streakDisplay = document.getElementById('streakDisplay');
        const xpDisplay = document.getElementById('xpDisplay');
        const levelDisplay = document.getElementById('levelDisplay');
        const followingDisplay = document.getElementById('followingDisplay');
        
        if (streakDisplay) {
            const streakText = streakDisplay.textContent.trim();
            const streakValue = streakText.match(/\d+/)?.[0] || '0';
            const profileStreak = document.getElementById('profileStreak');
            if (profileStreak) profileStreak.textContent = streakValue;
        }
        
        if (xpDisplay) {
            const xpText = xpDisplay.textContent.trim();
            const xpValue = xpText.match(/\d+/)?.[0] || '0';
            const profileXP = document.getElementById('profileXP');
            if (profileXP) profileXP.textContent = xpValue;
        }
        
        if (levelDisplay) {
            const levelText = levelDisplay.textContent.trim();
            const levelValue = levelText.match(/\d+/)?.[0] || '1';
            const profileLevel = document.getElementById('profileLevel');
            if (profileLevel) profileLevel.textContent = levelValue;
        }
        
        if (followingDisplay) {
            const followingText = followingDisplay.textContent.trim();
            const followingValue = followingText.match(/\d+/)?.[0] || '0';
            const profileFollowing = document.getElementById('profileFollowing');
            if (profileFollowing) profileFollowing.textContent = followingValue;
        }
        
        // Add action buttons to modal
        const profileContent = document.querySelector('.modal-draggable');
        if (profileContent) {
            const actionButtonsDiv = document.createElement('div');
            actionButtonsDiv.style.cssText = 'display: flex; gap: 12px; margin-top: 20px; margin-bottom: 20px;';
            var ownerProfile = typeof window.isPegasusOpsAdmin === 'function' && window.isPegasusOpsAdmin();
            actionButtonsDiv.innerHTML =
                '<button id="profileLeaderboardBtn" style="flex:1; background: linear-gradient(135deg, #f39c12 0%, #e74c3c 100%); color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: 600;"><i class="fas fa-trophy"></i> Leaderboard</button>' +
                (ownerProfile ? '<button id="profileAdminBtn" style="flex:1; background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: 600;"><i class="fas fa-crown"></i> Admin</button>' : '');
            
            const saveButton = profileContent.querySelector('button[onclick="saveProfile()"]');
            if (saveButton) {
                saveButton.parentNode.insertBefore(actionButtonsDiv, saveButton);
            }
            
            // Add event listeners
            const leaderboardBtn = document.getElementById('profileLeaderboardBtn');
            const adminBtn = document.getElementById('profileAdminBtn');
            
            if (leaderboardBtn) {
                leaderboardBtn.addEventListener('click', () => {
                    const lm = document.getElementById('leaderboardModal');
                    if (lm) {
                        lm.style.display = 'flex';
                    } else {
                        notifyInline('Leaderboard (demo): keep crafting — rankings will appear here when connected to live data.');
                    }
                });
            }
            
            if (adminBtn) {
                adminBtn.addEventListener('click', () => {
                    closeProfileModal();
                    if (typeof openAdminPanel === 'function') openAdminPanel();
                });
            }
        }
    }, 100);
}

window.showUserProfile = showUserProfile;

// ========================================
// COMMUNITY & UI HELPER FUNCTIONS
// ========================================
function showPersonalityQuiz() {
    const quizContainer = document.getElementById('quizContainer');
    if (!quizContainer) return;
    
    const questions = [
        { question: 'What inspires you most?', options: ['Colors', 'Textures', 'Shapes', 'Stories'] },
        { question: 'Preferred project scale?', options: ['Tiny details', 'Small pieces', 'Medium projects', 'Large installations'] },
        { question: 'Your craft style?', options: ['Realistic', 'Abstract', 'Whimsical', 'Mixed'] },
        { question: 'Favorite subject?', options: ['Nature', 'Fantasy', 'Modern', 'Animals'] },
        { question: 'Main goal?', options: ['Hobby fun', 'Skill building', 'Selling', 'Teaching'] }
    ];
    
    quizContainer.innerHTML = questions.map((q, i) => `
        <div>
            <p style="font-weight:600; margin-bottom:10px;">${i + 1}. ${q.question}</p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                ${q.options.map(opt => `
                    <button onclick="recordQuizAnswer('${q.question}', '${opt}')" style="background:white; border:1px solid #ddd; padding:10px; border-radius:8px; cursor:pointer; font-weight:500; transition:all 0.2s;" onmouseover="this.style.background='#f0f4ff'" onmouseout="this.style.background='white'">
                        ${opt}
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function recordQuizAnswer(question, answer) {
    if (!personalizationData.preferences.contentPreferences) {
        personalizationData.preferences.contentPreferences = [];
    }
    
    // Store answer
    quizAnswers.push({ question, answer });
    personalizationData.preferences.contentPreferences.push({ question, answer });
    savePersonalizationData();
    
    // Check if quiz is complete (5 questions)
    if (quizAnswers.length === 5) {
        showQuizResults();
    }
    
    addXP('visit', 20);
    console.log(`[Quiz] Answered: ${question} = ${answer}`);
}

function showQuizResults() {
    const quizContainer = document.getElementById('quizContainer');
    if (!quizContainer) return;
    
    // Analyze answers to determine personality type
    const personality = determinePersonality(quizAnswers);
    
    quizContainer.innerHTML = `
        <div style="text-align:center;padding:30px;background:linear-gradient(135deg, var(--pill-color), #ffd4e8);border-radius:16px;">
            <div style="font-size:4em;margin-bottom:16px;">${personality.icon}</div>
            <h2 style="color:var(--text-primary);margin-bottom:12px;">${personality.title}</h2>
            <p style="color:#666;font-size:1.1em;line-height:1.6;margin-bottom:24px;">${personality.description}</p>
            
            <div style="background:white;border-radius:12px;padding:20px;margin-top:20px;">
                <h3 style="color:var(--text-primary);margin-bottom:12px;">📚 Recommended For You:</h3>
                ${personality.recommendations.map(rec => `
                    <div style="padding:10px;border-bottom:1px solid #eee;text-align:left;">
                        <strong>${rec.title}</strong>
                        <div style="font-size:0.9em;color:#666;">${rec.desc}</div>
                    </div>
                `).join('')}
            </div>
            
            <button onclick="retakeQuiz()" style="margin-top:20px;background:var(--accent-color);color:white;border:none;padding:12px 24px;border-radius:25px;cursor:pointer;font-weight:600;">
                Retake Quiz
            </button>
        </div>
    `;
    
    // Award XP and badge
    addXP('visit', 100);
    unlockBadge('first-visit');
    
    console.log('[Quiz] Results shown:', personality.title);
}

function determinePersonality(answers) {
    // Simple personality determination based on answers
    const personalities = [
        {
            icon: '🎨',
            title: 'The Creative Explorer',
            description: 'You love experimenting with colors and textures, always seeking new artistic horizons!',
            recommendations: [
                { title: 'Color Mixing Masterclass', desc: 'Perfect for your creative spirit' },
                { title: 'Experimental Techniques Guide', desc: 'Push your boundaries' },
                { title: 'Abstract Art Tutorial', desc: 'Express your creativity' }
            ]
        },
        {
            icon: '🏆',
            title: 'The Perfectionist Crafter',
            description: 'Precision and skill-building drive you. You aim for mastery in every project!',
            recommendations: [
                { title: 'Advanced Sculpting Course', desc: 'Level up your skills' },
                { title: 'Professional Tools Guide', desc: 'Get the best equipment' },
                { title: 'Technique Refinement Workshop', desc: 'Perfect your craft' }
            ]
        },
        {
            icon: '💼',
            title: 'The Entrepreneur',
            description: 'You see the business potential in crafting and want to turn passion into profit!',
            recommendations: [
                { title: 'Pricing & Selling Guide', desc: 'Monetize your skills' },
                { title: 'Brand Building Workshop', desc: 'Stand out in the market' },
                { title: 'Product Photography Tips', desc: 'Showcase your work' }
            ]
        }
    ];
    
    // Return random personality (or implement logic based on answers)
    return personalities[Math.floor(Math.random() * personalities.length)];
}

function retakeQuiz() {
    quizAnswers = [];
    showPersonalityQuiz();
}

window.retakeQuiz = retakeQuiz;

// ========================================
// AI ONBOARDING WIZARD + ADAPTIVE DASHBOARD
// ========================================
const AI_ONBOARDING_KEY = 'craftinardor_ai_onboarding_profile';
const AI_PROGRESS_KEY = 'craftinardor_ai_progress';
const AI_MODE_KEY = 'craftinardor_ai_mode';
const MEMBERSHIP_AGREEMENT_LEVEL_KEY = 'craftinardor_membership_agreement_level';
const MEMBERSHIP_AGREEMENT_RECORD_KEY = 'craftinardor_membership_agreement_record';
const AI_DISCLOSURE_ACCEPTED_KEY = 'craftinardor_ai_disclosure_accepted';
const AUTH_RECOVERY_DISMISSED_KEY = 'craftinardor_auth_recovery_banner_dismissed';
const AI_POLICY_VERSION = '2026-04-v1';
const CONSENT_DOC_ID = 'personalization-consent';
window.__CRAFT_SECURITY_CONTEXT = window.__CRAFT_SECURITY_CONTEXT || null;

function getFeatureFlags() {
    const defaults = {
        aiPersonalization: true,
        classicPersonalization: true,
        authRecoveryBanner: true
    };
    try {
        const raw = localStorage.getItem('craftinardor_feature_flags');
        const parsed = raw ? JSON.parse(raw) : {};
        const serverFlags =
            window.__CRAFT_SECURITY_CONTEXT && window.__CRAFT_SECURITY_CONTEXT.featureFlags
                ? window.__CRAFT_SECURITY_CONTEXT.featureFlags
                : {};
        return Object.assign({}, defaults, parsed || {}, serverFlags || {});
    } catch (e) {
        return defaults;
    }
}

function getServerMembershipTier() {
    try {
        if (window.__CRAFT_SECURITY_CONTEXT && window.__CRAFT_SECURITY_CONTEXT.tier) {
            return String(window.__CRAFT_SECURITY_CONTEXT.tier).toLowerCase();
        }
    } catch (e) {}
    return '';
}

async function fetchSecurityContextFromServer() {
    try {
        if (!window.firebase || !window.firebase.functions || !window.auth || !window.auth.currentUser) return null;
        const callable = window.firebase.functions().httpsCallable('getSecurityContext');
        const result = await callable({});
        const data = result && result.data ? result.data : null;
        if (!data || typeof data !== 'object') return null;
        window.__CRAFT_SECURITY_CONTEXT = data;
        if (data.tier) {
            try { localStorage.setItem('membershipTier', String(data.tier).toLowerCase()); } catch (e) {}
        }
        try {
            localStorage.setItem('craftinardor_feature_flags', JSON.stringify(data.featureFlags || {}));
        } catch (e) {}
        if (typeof window.syncPremiumToolsAccess === 'function') window.syncPremiumToolsAccess();
        if (typeof window.renderConsentAuditTrail === 'function') window.renderConsentAuditTrail();
        return data;
    } catch (e) {
        return null;
    }
}

function getConsentFirestoreRef() {
    try {
        const fb = window.firebase;
        const authObj = window.auth || (fb && fb.auth && fb.auth());
        const dbObj = fb && fb.firestore && fb.firestore();
        const uid = authObj && authObj.currentUser && authObj.currentUser.uid;
        if (!dbObj || !uid) return null;
        return dbObj.collection('users').doc(uid).collection('compliance').doc(CONSENT_DOC_ID);
    } catch (e) {
        return null;
    }
}

async function syncConsentFromFirestore() {
    const ref = getConsentFirestoreRef();
    if (!ref) return;
    try {
        const snap = await ref.get();
        if (!snap.exists) return;
        const data = snap.data() || {};
        if (!data.level || data.version !== AI_POLICY_VERSION) return;
        localStorage.setItem(MEMBERSHIP_AGREEMENT_LEVEL_KEY, String(data.level));
        localStorage.setItem(
            MEMBERSHIP_AGREEMENT_RECORD_KEY,
            JSON.stringify({
                level: String(data.level),
                version: String(data.version),
                acceptedAt: data.acceptedAtClient || new Date().toISOString()
            })
        );
        if (data.aiDisclosureAccepted === true) {
            localStorage.setItem(
                AI_DISCLOSURE_ACCEPTED_KEY,
                JSON.stringify({
                    acceptedAt: data.aiDisclosureAcceptedAtClient || new Date().toISOString(),
                    version: String(data.version)
                })
            );
        }
        if (!localStorage.getItem('membershipTier')) {
            localStorage.setItem('membershipTier', data.level === 'free' ? 'free' : String(data.level));
        }
        syncMembershipAgreementUI();
    } catch (e) {}
}

async function syncConsentToFirestore(level, extra) {
    const ref = getConsentFirestoreRef();
    if (!ref) return;
    try {
        const fb = window.firebase;
        const FieldValue = fb && fb.firestore && fb.firestore.FieldValue;
        const payload = Object.assign(
            {
                level: level || getMembershipAgreementLevel() || 'free',
                version: AI_POLICY_VERSION,
                acceptedAtClient: new Date().toISOString(),
                updatedAt: FieldValue && FieldValue.serverTimestamp ? FieldValue.serverTimestamp() : new Date().toISOString()
            },
            extra || {}
        );
        await ref.set(payload, { merge: true });
    } catch (e) {}
}

function isFeatureEnabled(flagName) {
    const flags = getFeatureFlags();
    return !!flags[flagName];
}

function trackReadinessEvent(eventName, meta) {
    try {
        analyticsData.userActions = analyticsData.userActions || [];
        analyticsData.userActions.push({
            event: eventName,
            meta: meta || {},
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('analyticsData', JSON.stringify(analyticsData));
    } catch (e) {}
    try {
        if (typeof window.logFirstRun === 'function') {
            window.logFirstRun(eventName, meta || {});
        }
    } catch (e2) {}
}

function getAiOnboardingProfile() {
    try {
        return JSON.parse(localStorage.getItem(AI_ONBOARDING_KEY) || 'null');
    } catch (e) {
        return null;
    }
}

function getAiExperienceMode() {
    try {
        return localStorage.getItem(AI_MODE_KEY) || 'ai';
    } catch (e) {
        return 'ai';
    }
}

function getMembershipAgreementLevel() {
    try {
        const recordRaw = localStorage.getItem(MEMBERSHIP_AGREEMENT_RECORD_KEY);
        if (recordRaw) {
            const rec = JSON.parse(recordRaw);
            if (rec && rec.level && rec.version === AI_POLICY_VERSION) return String(rec.level);
        }
        return localStorage.getItem(MEMBERSHIP_AGREEMENT_LEVEL_KEY) || '';
    } catch (e) {
        return '';
    }
}

function hasAcceptedMembershipAgreement() {
    return !!getMembershipAgreementLevel();
}

function hasPremiumAiQuickSetupAccess() {
    try {
        const tier = String(localStorage.getItem('membershipTier') || 'free').toLowerCase();
        return tier === 'pro' || tier === 'enterprise' || tier === 'whitelabel';
    } catch (e) {
        return false;
    }
}

function enforcePremiumAiQuickSetup(featureLabel) {
    if (hasPremiumAiQuickSetupAccess()) return true;
    notifyInline('Premium access is required for ' + (featureLabel || 'AI Quick Setup') + '.');
    return false;
}

function enforceMembershipAgreementGate(featureLabel) {
    if (hasAcceptedMembershipAgreement()) return true;
    notifyInline('Please accept a membership agreement level before using ' + (featureLabel || 'this feature') + '.');
    return false;
}

function acceptMembershipAgreementLevel() {
    const selectEl = document.getElementById('membershipAgreementLevelSelect');
    const confirmEl = document.getElementById('membershipAgreementConfirm');
    const level = selectEl ? String(selectEl.value || '').trim() : '';
    const confirmed = !!(confirmEl && confirmEl.checked);
    if (!level || !confirmed) {
        notifyInline('Choose an agreement level and confirm acceptance.');
        return;
    }
    try {
        localStorage.setItem(MEMBERSHIP_AGREEMENT_LEVEL_KEY, level);
        localStorage.setItem(MEMBERSHIP_AGREEMENT_RECORD_KEY, JSON.stringify({
            level: level,
            version: AI_POLICY_VERSION,
            acceptedAt: new Date().toISOString()
        }));
        if (!localStorage.getItem('membershipTier')) {
            localStorage.setItem('membershipTier', level === 'free' ? 'free' : level);
        }
    } catch (e) {}
    syncConsentToFirestore(level, { aiDisclosureAccepted: hasAcceptedAiDisclosure() });
    trackReadinessEvent('membership_agreement_accepted', { level: level, version: AI_POLICY_VERSION });
    syncMembershipAgreementUI();
    notifyInline('Agreement accepted for ' + level.toUpperCase() + ' level.');
}

function syncMembershipAgreementUI() {
    const gate = document.getElementById('membershipAgreementGate');
    const level = getMembershipAgreementLevel();
    const premiumGate = document.getElementById('profileAiPremiumGate');
    const aiQuickSetupContent = document.getElementById('aiQuickSetupContent');
    const aiWrap = document.getElementById('aiExperienceAi');
    const classicWrap = document.getElementById('aiExperienceClassic');
    const hasPremiumAccess = hasPremiumAiQuickSetupAccess();

    if (premiumGate) premiumGate.style.display = hasPremiumAccess ? 'none' : '';
    if (gate) gate.style.display = hasPremiumAccess && !level ? '' : 'none';
    if (aiQuickSetupContent) aiQuickSetupContent.style.display = hasPremiumAccess && level ? '' : 'none';

    [aiWrap, classicWrap].forEach(function (el) {
        if (!el) return;
        el.style.opacity = '1';
        el.style.pointerEvents = '';
    });
    const modeToggle = document.getElementById('aiModeToggle');
    if (modeToggle) modeToggle.disabled = !hasPremiumAccess || !level;
}

function hasAcceptedAiDisclosure() {
    try {
        const raw = localStorage.getItem(AI_DISCLOSURE_ACCEPTED_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        return !!(parsed && parsed.version === AI_POLICY_VERSION);
    } catch (e) {
        return false;
    }
}

function acceptAiDisclosureConsent() {
    try {
        localStorage.setItem(AI_DISCLOSURE_ACCEPTED_KEY, JSON.stringify({
            acceptedAt: new Date().toISOString(),
            version: AI_POLICY_VERSION
        }));
    } catch (e) {}
    syncConsentToFirestore(getMembershipAgreementLevel() || 'free', {
        aiDisclosureAccepted: true,
        aiDisclosureAcceptedAtClient: new Date().toISOString()
    });
    trackReadinessEvent('ai_disclosure_accepted', { version: AI_POLICY_VERSION });
}

function setAiExperienceMode(mode) {
    try {
        localStorage.setItem(AI_MODE_KEY, mode === 'classic' ? 'classic' : 'ai');
    } catch (e) {}
}

function syncAiExperienceModeUI() {
    const mode = getAiExperienceMode();
    const isAi = mode !== 'classic';
    const aiWrap = document.getElementById('aiExperienceAi');
    const classicWrap = document.getElementById('aiExperienceClassic');
    const classicDoc = document.getElementById('classicSystemDoc');
    const toggle = document.getElementById('aiModeToggle');
    if (aiWrap) aiWrap.style.display = isAi ? '' : 'none';
    if (classicWrap) classicWrap.style.display = isAi ? 'none' : '';
    if (classicDoc) classicDoc.style.display = isAi ? 'none' : '';
    if (toggle) toggle.checked = isAi;
}

function toggleAiExperienceMode(isAiEnabled) {
    if (!enforcePremiumAiQuickSetup('AI personalization')) {
        syncAiExperienceModeUI();
        return;
    }
    if (isAiEnabled && !isFeatureEnabled('aiPersonalization')) {
        notifyInline('AI personalization is temporarily unavailable.');
        syncAiExperienceModeUI();
        return;
    }
    if (!isAiEnabled && !isFeatureEnabled('classicPersonalization')) {
        notifyInline('Classic personalization is temporarily unavailable.');
        syncAiExperienceModeUI();
        return;
    }
    if (!enforceMembershipAgreementGate('personalization mode')) {
        syncAiExperienceModeUI();
        return;
    }
    setAiExperienceMode(isAiEnabled ? 'ai' : 'classic');
    trackReadinessEvent('personalization_mode_toggled', { mode: isAiEnabled ? 'ai' : 'classic' });
    syncAiExperienceModeUI();
    applyAdaptiveDashboard();
}

function saveAiOnboardingProfile(profile) {
    try {
        localStorage.setItem(AI_ONBOARDING_KEY, JSON.stringify(profile || {}));
    } catch (e) {}
}

function getAiProgressState() {
    try {
        return JSON.parse(localStorage.getItem(AI_PROGRESS_KEY) || '{}');
    } catch (e) {
        return {};
    }
}

function saveAiProgressState(progress) {
    try {
        localStorage.setItem(AI_PROGRESS_KEY, JSON.stringify(progress || {}));
    } catch (e) {}
}

function openAiOnboardingWizard() {
    if (!enforcePremiumAiQuickSetup('AI onboarding')) return;
    if (!isFeatureEnabled('aiPersonalization')) {
        notifyInline('AI onboarding is temporarily unavailable.');
        return;
    }
    if (!enforceMembershipAgreementGate('AI onboarding')) return;
    const modal = document.getElementById('aiOnboardingModal');
    if (modal) modal.style.display = 'flex';
}

function closeAiOnboardingWizard() {
    const modal = document.getElementById('aiOnboardingModal');
    if (modal) modal.style.display = 'none';
}

function generateFirstWeekPlan(profile) {
    const goalPlans = {
        sell: ['Audit your 3 top listings and improve titles.', 'Publish one new product with 4+ photos.'],
        learn: ['Complete one beginner tutorial end-to-end.', 'Practice one technique for 20 focused minutes.'],
        design: ['Create 3 quick concept sketches before building.', 'Ship one piece using a new color recipe.'],
        community: ['Post one progress update and ask a question.', 'Comment on 3 other makers with specific feedback.']
    };
    const formatPlans = {
        video: 'Watch a short lesson and capture 3 takeaways.',
        checklist: 'Use a mini checklist and mark one done each day.',
        templates: 'Download one template and customize it for your style.',
        live: 'Join one live session or replay and take action within 24h.'
    };
    const pace = Number(profile.timeWeekly || 5) <= 2 ? 'Keep each step under 20 minutes to stay consistent.' : 'Bundle tasks into 30-45 minute focus blocks.';
    const win = profile.winStatement ? 'Win target: ' + profile.winStatement : 'Win target: complete at least 4 daily actions.';
    const stack = goalPlans[profile.goalPrimary] || goalPlans.learn;
    return [
        'Day 1: Set your workspace and pick one priority project.',
        'Day 2: ' + stack[0],
        'Day 3: ' + formatPlans[profile.preferredFormat],
        'Day 4: ' + stack[1],
        'Day 5: Review progress and remove one blocker.',
        'Day 6: Share your work and collect one piece of feedback.',
        'Day 7: Celebrate + plan next week. ' + win + ' ' + pace
    ];
}

function renderFirstWeekPlan() {
    const profile = getAiOnboardingProfile();
    const panel = document.getElementById('firstWeekPlanPanel');
    const list = document.getElementById('firstWeekPlanList');
    if (!panel || !list || !profile || !Array.isArray(profile.firstWeekPlan)) return;
    const progress = getAiProgressState();
    const checks = progress.planChecks || {};
    list.innerHTML = profile.firstWeekPlan.map(function (step, index) {
        const checked = checks[index] ? 'checked' : '';
        return '<li style="margin:8px 0;list-style:none;"><label style="display:flex;gap:8px;align-items:flex-start;"><input type="checkbox" ' + checked + ' onchange="toggleAiPlanStep(' + index + ', this.checked)"><span>' + step + '</span></label></li>';
    }).join('');
    panel.style.display = 'block';
}

function toggleAiPlanStep(index, checked) {
    if (!enforcePremiumAiQuickSetup('first-week plan')) return;
    if (!enforceMembershipAgreementGate('first-week plan')) return;
    const progress = getAiProgressState();
    progress.planChecks = progress.planChecks || {};
    progress.planChecks[index] = !!checked;
    saveAiProgressState(progress);
    trackReadinessEvent('first_week_step_toggled', { index: index, checked: !!checked });
    refreshAiMilestones();
    refreshAiCoachTip();
}

function applyAdaptiveDashboard() {
    if (!hasPremiumAiQuickSetupAccess()) return;
    if (getAiExperienceMode() === 'classic') return;
    const profile = getAiOnboardingProfile();
    const track = document.getElementById('homeCarouselTrack');
    if (!profile || !track) return;
    const focusMap = { sell: 'sell', learn: 'tools', design: 'design', community: 'design' };
    const desired = focusMap[profile.goalPrimary] || 'design';
    const cards = Array.from(track.querySelectorAll('.event-card'));
    const top = cards.find(function (card) { return card.getAttribute('data-focus') === desired; });
    if (!top) return;
    track.insertBefore(top, track.firstElementChild);
}

function buildAiCoachTip(profile, progress) {
    if (!profile) {
        return 'Run onboarding to unlock context-aware tips based on your goals and available time.';
    }
    const checks = progress && progress.planChecks ? Object.values(progress.planChecks).filter(Boolean).length : 0;
    if (checks < 2) return 'Start with one 15-minute quick win today. Momentum beats intensity.';
    if (checks < 5) return 'Nice pace. Stack your next action immediately after a routine you already do.';
    if (progress && progress.lastWeeklyCheckInAt) return 'You are in maintenance mode. Review your weekly blocker and adjust tomorrow\'s first task.';
    return 'Great progress. Lock in a weekly check-in so your next plan adapts automatically.';
}

function refreshAiCoachTip() {
    const tipText = document.getElementById('aiCoachTipText');
    if (!tipText) return;
    tipText.textContent = buildAiCoachTip(getAiOnboardingProfile(), getAiProgressState());
}

function refreshAiMilestones() {
    const summary = document.getElementById('aiMilestoneSummary');
    if (!summary) return;
    const progress = getAiProgressState();
    const checks = progress.planChecks ? Object.values(progress.planChecks).filter(Boolean).length : 0;
    const badges = [];
    if (checks >= 1) badges.push('Quick Start');
    if (checks >= 4) badges.push('Consistency Builder');
    if (checks >= 7) badges.push('Week One Finisher');
    if (progress.lastWeeklyCheckInAt) badges.push('Reflection Locked');
    summary.textContent = badges.length ? 'Badges: ' + badges.join(' | ') + '. Completed steps: ' + checks + '/7.' : 'No milestones yet. Complete one step to unlock your first badge.';
}

function completeAiOnboardingWizard() {
    if (!enforcePremiumAiQuickSetup('AI onboarding')) return;
    if (!isFeatureEnabled('aiPersonalization')) return;
    if (!enforceMembershipAgreementGate('AI onboarding')) return;
    const disclosureBox = document.getElementById('aiDisclosureConfirm');
    if (disclosureBox && !disclosureBox.checked && !hasAcceptedAiDisclosure()) {
        notifyInline('Please acknowledge the AI guidance disclosure before continuing.');
        return;
    }
    const goalPrimary = (document.getElementById('aiGoalPrimary') || {}).value || '';
    const skillLevel = (document.getElementById('aiSkillLevel') || {}).value || '';
    const timeWeekly = (document.getElementById('aiTimeWeekly') || {}).value || '';
    const preferredFormat = (document.getElementById('aiPreferredFormat') || {}).value || '';
    const winStatement = ((document.getElementById('aiWinStatement') || {}).value || '').trim();
    if (!goalPrimary || !skillLevel || !timeWeekly || !preferredFormat) {
        notifyInline('Please complete all onboarding fields.');
        return;
    }
    const profile = {
        goalPrimary: goalPrimary,
        skillLevel: skillLevel,
        timeWeekly: timeWeekly,
        preferredFormat: preferredFormat,
        winStatement: winStatement,
        firstWeekPlan: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    profile.firstWeekPlan = generateFirstWeekPlan(profile);
    if (disclosureBox && disclosureBox.checked) acceptAiDisclosureConsent();
    saveAiOnboardingProfile(profile);
    trackReadinessEvent('ai_onboarding_completed', {
        goalPrimary: goalPrimary,
        skillLevel: skillLevel,
        timeWeekly: timeWeekly,
        preferredFormat: preferredFormat
    });
    renderFirstWeekPlan();
    applyAdaptiveDashboard();
    refreshAiCoachTip();
    refreshAiMilestones();
    closeAiOnboardingWizard();
    try {
        addXP('visit', 75);
        unlockBadge('first-visit');
    } catch (e) {}
}

function saveAiWeeklyCheckIn() {
    if (!enforcePremiumAiQuickSetup('weekly check-in')) return;
    if (!enforceMembershipAgreementGate('weekly check-in')) return;
    const energyEl = document.getElementById('aiWeeklyEnergy');
    const blockerEl = document.getElementById('aiWeeklyBlocker');
    const progress = getAiProgressState();
    progress.lastWeeklyCheckInAt = Date.now();
    progress.energy = energyEl ? Number(energyEl.value || 7) : 7;
    progress.blocker = blockerEl ? String(blockerEl.value || '').trim() : '';
    saveAiProgressState(progress);
    trackReadinessEvent('weekly_checkin_saved', {
        energy: progress.energy,
        hasBlocker: !!progress.blocker
    });
    refreshAiCoachTip();
    refreshAiMilestones();
    notifyInline('Weekly check-in saved. Your coach tips are updated.');
}

function initAiOnboardingExperience() {
    const disclosureBox = document.getElementById('aiDisclosureConfirm');
    if (disclosureBox && hasAcceptedAiDisclosure()) disclosureBox.checked = true;
    syncMembershipAgreementUI();
    syncAiExperienceModeUI();
    renderFirstWeekPlan();
    applyAdaptiveDashboard();
    refreshAiCoachTip();
    refreshAiMilestones();
}

function isLikelyEmbeddedBrowser() {
    const ua = navigator.userAgent || '';
    return /Electron|WebView|wv\)|; wv|Cursor/i.test(ua);
}

function initAuthRecoveryBanner() {
    if (!isFeatureEnabled('authRecoveryBanner')) return;
    if (!isLikelyEmbeddedBrowser()) return;
    if (localStorage.getItem(AUTH_RECOVERY_DISMISSED_KEY) === '1') return;
    const existing = document.getElementById('authRecoveryBanner');
    if (existing) return;
    const banner = document.createElement('div');
    banner.id = 'authRecoveryBanner';
    banner.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:13000;background:#111827;color:#fff;padding:10px 12px;border-radius:10px;box-shadow:0 12px 24px rgba(0,0,0,0.3);font-size:0.86rem;display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;';
    banner.innerHTML = '<span>Embedded browser detected. If sign-in fails, open in your default browser for reliable Google auth.</span><span style="display:flex;gap:8px;align-items:center;"><button type="button" id="authRecoveryOpenBrowserBtn" style="background:#6dd5c3;color:#111;border:none;padding:6px 10px;border-radius:8px;cursor:pointer;font-weight:700;">Open in browser</button><button type="button" id="authRecoveryDismissBtn" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.35);padding:6px 10px;border-radius:8px;cursor:pointer;">Dismiss</button></span>';
    document.body.appendChild(banner);
    const openBtn = document.getElementById('authRecoveryOpenBrowserBtn');
    const dismissBtn = document.getElementById('authRecoveryDismissBtn');
    if (openBtn) {
        openBtn.addEventListener('click', function () {
            window.open(window.location.href, '_blank');
            trackReadinessEvent('auth_recovery_open_browser_clicked', {});
        });
    }
    if (dismissBtn) {
        dismissBtn.addEventListener('click', function () {
            try { localStorage.setItem(AUTH_RECOVERY_DISMISSED_KEY, '1'); } catch (e) {}
            banner.remove();
        });
    }
}

window.openAiOnboardingWizard = openAiOnboardingWizard;
window.closeAiOnboardingWizard = closeAiOnboardingWizard;
window.completeAiOnboardingWizard = completeAiOnboardingWizard;
window.toggleAiPlanStep = toggleAiPlanStep;
window.saveAiWeeklyCheckIn = saveAiWeeklyCheckIn;
window.initAiOnboardingExperience = initAiOnboardingExperience;
window.toggleAiExperienceMode = toggleAiExperienceMode;
window.acceptMembershipAgreementLevel = acceptMembershipAgreementLevel;
window.getServerMembershipTier = getServerMembershipTier;
window.fetchSecurityContextFromServer = fetchSecurityContextFromServer;
document.addEventListener('DOMContentLoaded', function () {
    initAiOnboardingExperience();
    setupModalAccessibility();
    initAuthRecoveryBanner();
    syncConsentFromFirestore();
    fetchSecurityContextFromServer();
    try {
        var authObj = window.auth || (window.firebase && window.firebase.auth && window.firebase.auth());
        if (authObj && typeof authObj.onAuthStateChanged === 'function') {
            authObj.onAuthStateChanged(function (user) {
                if (user) {
                    syncConsentFromFirestore();
                    fetchSecurityContextFromServer();
                } else {
                    window.__CRAFT_SECURITY_CONTEXT = null;
                }
            });
        }
    } catch (e) {}
});

// ========================================
// NEWSLETTER SUBSCRIPTION SYSTEM (See top of file for implementation)
// ========================================

window.subscribeNewsletter = subscribeNewsletter;

// ========================================
// SEARCH FUNCTIONALITY
// ========================================
window._shopFilterCat = 'all';

function applyShopGridVisibility() {
    const searchInput = document.getElementById('searchInput');
    const query = (searchInput && searchInput.value.toLowerCase().trim()) || '';
    const grid = document.getElementById('quirkyProductGrid') || document.querySelector('#shop .product-grid');
    if (!grid) return;
    const filterCat = window._shopFilterCat || 'all';
    grid.querySelectorAll('.product-card').forEach(function (card) {
        const hay = card.getAttribute('data-search-text') || '';
        const cat = card.getAttribute('data-category') || 'all';
        const catOk = filterCat === 'all' || cat === filterCat;
        const searchOk = query.length < 2 || hay.includes(query);
        card.style.display = catOk && searchOk ? '' : 'none';
    });
}

function filterShopProductGrid(category) {
    window._shopFilterCat = category || 'all';
    document.querySelectorAll('.shop-filter-chip').forEach(function (chip) {
        chip.classList.toggle('active', chip.getAttribute('data-cat') === category);
    });
    applyShopGridVisibility();
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults') || document.getElementById('searchSuggestions');
    
    if (!searchInput || !searchResults) return;
    
    const query = searchInput.value.toLowerCase().trim();
    
    if (query.length < 2) {
        searchResults.style.display = 'none';
        return;
    }
    
    // Searchable content database
    const searchableContent = [
        { title: 'Polymer Clay Basics', type: 'Tutorial', category: 'courses', desc: 'Learn fundamental techniques' },
        { title: 'Color Mixing Guide', type: 'Guide', category: 'resources', desc: 'Master color combinations' },
        { title: 'Jewelry Making', type: 'Tutorial', category: 'courses', desc: 'Create beautiful jewelry pieces' },
        { title: 'Sculpting Techniques', type: 'Tutorial', category: 'courses', desc: 'Advanced sculpting methods' },
        { title: 'Starter Kit', type: 'Product', category: 'shop', desc: 'Everything you need to begin', price: '$29.99' },
        { title: 'Premium Tools Set', type: 'Product', category: 'shop', desc: 'Professional quality tools', price: '$49.99' },
        { title: 'Miniature Food Tutorial', type: 'Tutorial', category: 'courses', desc: 'Create realistic food miniatures' },
        { title: 'Spring Craft Fair', type: 'Event', category: 'events', desc: 'Join us for crafts and fun' },
        { title: 'Clay Calculator', type: 'Tool', category: 'tools', desc: 'Calculate material costs' },
        { title: 'Color Mixer Tool', type: 'Tool', category: 'tools', desc: 'Mix custom colors digitally' }
    ];
    
    applyShopGridVisibility();

    // Search and filter
    const results = searchableContent.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.desc.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
    );
    
    // Display results
    if (results.length === 0) {
        searchResults.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">No results found for "' + query + '"</div>';
        searchResults.style.display = 'block';
        return;
    }
    
    searchResults.innerHTML = results.map(item => `
        <div style="padding:12px;border-bottom:1px solid #eee;cursor:pointer;transition:background 0.2s;" 
             onmouseover="this.style.background='#f5f5f5'" 
             onmouseout="this.style.background='white'"
             onclick="navigateToResult('${item.category}')">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <div style="font-weight:600;color:var(--text-primary);">${item.title}</div>
                    <div style="font-size:0.9em;color:#666;margin-top:4px;">${item.desc}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:0.85em;color:var(--accent-color);font-weight:600;">${item.type}</div>
                    ${item.price ? `<div style="font-size:0.9em;color:#666;margin-top:2px;">${item.price}</div>` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    searchResults.style.display = 'block';
    console.log(`[Search] Found ${results.length} results for "${query}"`);
}

function navigateToResult(category) {
    // Navigate to the corresponding tab
    const tabBtn = document.querySelector(`[data-tab="${category}"]`);
    if (tabBtn) {
        tabBtn.click();
        
        // Close search
        const searchContainer = document.getElementById('searchContainer');
        if (searchContainer) searchContainer.style.display = 'none';
        
        console.log(`[Search] Navigated to: ${category}`);
    }
}

window.performSearch = performSearch;
window.navigateToResult = navigateToResult;
window.filterShopProductGrid = filterShopProductGrid;

// ========================================
// ENHANCED CHAT SYSTEM
// ========================================
const chatResponses = {
    'hello': 'Hi there! 👋 Welcome to my polymer clay world! How can I help you today?',
    'hi': 'Hey! 🎨 Great to see you here! What are you interested in learning about?',
    'help': 'I can help you with:\n• Clay techniques\n• Product recommendations\n• Class information\n• General questions\n\nWhat would you like to know?',
    'course': 'I offer several courses! Check out the Courses tab for beginner to advanced classes. 📚',
    'price': 'Prices vary by product. Visit the Shop tab to see all items with pricing! 🛍️',
    'shipping': 'Digital products are instant! Physical items ship within 2-3 business days. 📦',
    'beginner': 'Perfect! I recommend starting with the "Polymer Clay Basics" course and a Starter Kit. 🌱',
    'clay': 'I love polymer clay! What specifically would you like to know about it? Techniques, brands, or projects?',
    'tutorial': 'Check out the Courses tab for tutorials on jewelry, miniatures, sculpting, and more! 🎬',
    'thanks': 'You\'re welcome! Happy crafting! 🎨✨',
    'thank you': 'My pleasure! Let me know if you need anything else! 😊',
    'bye': 'Goodbye! Come back anytime! 👋✨'
};

function getSmartChatResponse(message) {
    const lowerMsg = message.toLowerCase();
    
    // Check for keyword matches
    for (const [keyword, response] of Object.entries(chatResponses)) {
        if (lowerMsg.includes(keyword)) {
            return response;
        }
    }
    
    // Default responses
    const defaultResponses = [
        'That\'s interesting! Tell me more! 🤔',
        'I\'d be happy to help! Can you be more specific? 💬',
        'Great question! Check out the Resources tab for detailed guides. 📖',
        'Thanks for reaching out! I\'ll get back to you soon with more info! 🎨',
        'I appreciate your message! Feel free to explore the site while I prepare a detailed response. ✨'
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// ======================
// ENHANCED CHAT WITH SMART RESPONSES
// ======================
if (chatSend && chatInput) {
    // Update existing chat send handler
    chatSend.onclick = function() {
        const message = chatInput.value.trim();
        
        if (message) {
            const messagesContainer = document.getElementById('chatMessages');
            if (messagesContainer) {
                // User message
                const messageDiv = document.createElement('div');
                messageDiv.className = 'chat-message';
                messageDiv.innerHTML = '<p>' + message + '</p>';
                messagesContainer.appendChild(messageDiv);
                
                chatInput.value = '';
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                
                updateBadgeProgress('commenter', 1);
                unlockBadge('chatter');
                
                // Smart bot response
                setTimeout(function() {
                    const replyDiv = document.createElement('div');
                    replyDiv.className = 'chat-message bot';
                    replyDiv.innerHTML = '<p>' + getSmartChatResponse(message) + '</p>';
                    messagesContainer.appendChild(replyDiv);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }, 800);
            }
        }
    };
    
    // Enter key to send
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            chatSend.click();
        }
    });
}

// ======================
// SEARCH INPUT LISTENER
// ======================
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', performSearch);
    
    // Clear results when input is cleared
    searchInput.addEventListener('focus', function() {
        if (this.value.trim()) {
            performSearch();
        }
    });
}

// ======================
// NEWSLETTER FORM SUBMIT
// ======================
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        subscribeNewsletter();
    });
}

// ======================
// VIDEO PLAYER CONTROLS
// ======================
const player = document.getElementById('simpleVideoPlayer');
const closePlayerBtn = document.getElementById('closePlayerBtn');
const videoPrevBtn = document.getElementById('simplePrev');
const videoNextBtn = document.getElementById('simpleNext');
const videoPlayBtn = document.getElementById('simplePlay');
const videoShuffleBtn = document.getElementById('simpleShuffle');
const videoLoopBtn = document.getElementById('simpleLoop');
const editPlaylistBtn = document.getElementById('editPlaylistBtn');
const playlistEditorInline = document.getElementById('playlistEditorInline');

if (localStorage.getItem('showVideoPlayer') === 'true' && player) {
    player.style.display = 'flex';
}

if (closePlayerBtn) {
    closePlayerBtn.onclick = () => {
        player.style.display = 'none';
        localStorage.setItem('showVideoPlayer', 'false');
    };
}

if (videoPrevBtn) {
    videoPrevBtn.onclick = () => {
        currentVideoIndex = (currentVideoIndex - 1 + playlist.length) % playlist.length;
        setVideo(currentVideoIndex);
    };
}

if (videoNextBtn) {
    videoNextBtn.onclick = () => {
        currentVideoIndex = (currentVideoIndex + 1) % playlist.length;
        setVideo(currentVideoIndex);
    };
}

if (videoPlayBtn) {
    videoPlayBtn.onclick = () => {
        const iframe = document.getElementById('playerIframe');
        if (iframe) iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    };
}

if (videoShuffleBtn) {
    videoShuffleBtn.onclick = () => {
        currentVideoIndex = Math.floor(Math.random() * playlist.length);
        setVideo(currentVideoIndex);
    };
}

if (videoLoopBtn) {
    videoLoopBtn.onclick = () => setVideo(currentVideoIndex);
}

if (editPlaylistBtn && playlistEditorInline) {
    editPlaylistBtn.onclick = () => {
        playlistEditorInline.style.display = playlistEditorInline.style.display === 'none' ? 'block' : 'none';
        if (playlistEditorInline.style.display === 'block') renderPlaylistEditorInline();
    };
}

// Make player draggable
if (player) {
    let isDragging = false, offsetX = 0, offsetY = 0;
    
    player.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'IFRAME') return;
        isDragging = true;
        offsetX = e.clientX - player.offsetLeft;
        offsetY = e.clientY - player.offsetTop;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            player.style.left = (e.clientX - offsetX) + 'px';
            player.style.top = (e.clientY - offsetY) + 'px';
        }
    });
    
    document.addEventListener('mouseup', () => isDragging = false);
}


// ======================
// PLAYLIST SYSTEM: RENDER PLAYLIST LIST
// ======================
let playlist = JSON.parse(localStorage.getItem('playlist')) || [
    {
        title: 'Polymer Clay Basics',
        url: 'https://www.youtube.com/embed/1XyQGkQ2QwQ',
        thumbnail: 'https://img.youtube.com/vi/1XyQGkQ2QwQ/0.jpg'
    },
    {
        title: 'Color Mixing for Beginners',
        url: 'https://www.youtube.com/embed/2ZyQGkQ2QwQ',
        thumbnail: 'https://img.youtube.com/vi/2ZyQGkQ2QwQ/0.jpg'
    }
];
let currentVideoIndex = 0;

function renderPlaylistList() {
    const playlistList = document.getElementById('videoPlaylist');
    if (!playlistList) return;
    playlistList.innerHTML = '';
    playlist.forEach((video, idx) => {
        const item = document.createElement('div');
        item.className = 'playlist-item' + (idx === currentVideoIndex ? ' active' : '');
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.cursor = 'pointer';
        item.style.padding = '8px 0';
        item.innerHTML = `
            <img src="${video.thumbnail}" alt="${video.title}" style="width:48px;height:36px;border-radius:6px;margin-right:12px;object-fit:cover;">
            <span style="font-weight:600;color:#6b5580;">${video.title}</span>
        `;
        item.onclick = () => {
            currentVideoIndex = idx;
            setVideo(currentVideoIndex);
        };
        playlistList.appendChild(item);
    });
}

function setVideo(idx) {
    const iframe = document.getElementById('playerIframe');
    if (!iframe || !playlist[idx]) return;
    iframe.src = playlist[idx].url + '?autoplay=1&enablejsapi=1';
    renderPlaylistList();
}

// ======================
// WEATHER SYSTEM: INIT WEATHER WIDGET
// ======================
function setZipWeatherFeedback(msg) {
    var el = document.getElementById('zipWeatherFeedback');
    if (el) el.textContent = msg || '';
}

function initWeatherSystem() {
    function ensureWeatherWidget() {
        let widget = document.getElementById('weatherWidget');
        if (widget) return widget;
        widget = document.createElement('div');
        widget.id = 'weatherWidget';
        widget.className = 'weather-widget';
        widget.innerHTML = '<div style="font-size:0.9rem;opacity:0.9;">Weather hidden</div>';
        document.body.appendChild(widget);
        return widget;
    }

    function weatherLabelForCode(code) {
        if (code === 0) return { icon: '☀️', text: 'Clear' };
        if (code <= 3) return { icon: '⛅', text: 'Partly cloudy' };
        if (code <= 67) return { icon: '🌧️', text: 'Rain' };
        if (code <= 77) return { icon: '❄️', text: 'Snow' };
        if (code <= 99) return { icon: '⛈️', text: 'Storm' };
        return { icon: '🌤️', text: 'Weather' };
    }

    function weatherUpdatedMetaHtml() {
        var now = new Date();
        try {
            localStorage.setItem('weatherLastUpdatedAt', now.toISOString());
        } catch (e) {}
        var line = 'Updated ' + now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        return '<div class="weather-meta">' + line + '</div>';
    }

    async function updateWeatherForCoords(lat, lon, label) {
        const widget = ensureWeatherWidget();
        widget.classList.remove('weather-widget--error');
        widget.innerHTML = '<div style="padding:12px;text-align:center;font-size:0.85rem;">Loading weather…</div>';
        try {
            const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + encodeURIComponent(lat) + '&longitude=' + encodeURIComponent(lon) + '&current_weather=true';
            const response = await fetch(url);
            const data = await response.json();
            if (!data || !data.current_weather) throw new Error('No weather data');
            const weather = data.current_weather;
            const tag = weatherLabelForCode(Number(weather.weathercode));
            widget.innerHTML =
                '<div class="weather-icon">' + tag.icon + '</div>' +
                '<div class="temperature">' + weather.temperature + '&deg;C</div>' +
                '<div class="location">' + (label || 'Local') + '</div>' +
                '<div class="condition">' + tag.text + '</div>' +
                weatherUpdatedMetaHtml();
            setZipWeatherFeedback('');
        } catch (e) {
            widget.classList.add('weather-widget--error');
            widget.innerHTML =
                '<div class="weather-error-msg" role="alert">Could not refresh weather. Check your connection and try again.</div>' +
                '<div class="weather-meta">Last attempt ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + '</div>';
        }
    }

    window.updateWeatherByZip = async function updateWeatherByZip(zip) {
        const cleanZip = String(zip || '').trim();
        if (!/^\d{5}$/.test(cleanZip)) {
            setZipWeatherFeedback('Enter a valid 5-digit U.S. ZIP code.');
            return;
        }
        setZipWeatherFeedback('Looking up location…');
        try {
            localStorage.setItem('weatherZip', cleanZip);
        } catch (e) {}
        const geoUrl = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(cleanZip) + '&count=1&language=en&format=json';
        try {
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();
            const place = geoData && Array.isArray(geoData.results) ? geoData.results[0] : null;
            if (!place) throw new Error('ZIP not found');
            await updateWeatherForCoords(place.latitude, place.longitude, cleanZip);
            setZipWeatherFeedback('Weather updated for ZIP ' + cleanZip + '.');
        } catch (e2) {
            setZipWeatherFeedback('No match for that ZIP. Try another code.');
            const widget = document.getElementById('weatherWidget');
            if (widget && widget.style.display !== 'none') {
                widget.classList.add('weather-widget--error');
                widget.innerHTML = '<div class="weather-error-msg" role="alert">ZIP not found. Try another.</div>';
            }
        }
    };

    const widget = ensureWeatherWidget();
    makeFloatingDraggable(widget);
    const weatherEnabled = localStorage.getItem('weatherEnabled') === 'true';
    widget.style.display = weatherEnabled ? 'flex' : 'none';
    if (weatherEnabled) {
        const zip = localStorage.getItem('weatherZip') || '';
        if (zip) {
            window.updateWeatherByZip(zip);
        } else {
            updateWeatherForCoords(40.71, -74.01, 'Default');
        }
    }
}

// Call these on load
renderPlaylistList();
setVideo(currentVideoIndex);
initWeatherSystem();

// ======================
// QUICK JUMP
// ======================
const quickJumpBtn = document.getElementById('quickJumpBtn') || document.querySelector('.quick-jump-btn');
const quickJumpModal = document.getElementById('quickJumpModal');
const quickJumpClose = document.getElementById('quickJumpClose');
    
if (quickJumpBtn && quickJumpModal) {
    quickJumpBtn.addEventListener('click', () => quickJumpModal.style.display = 'flex');
}
    
if (quickJumpClose && quickJumpModal) {
    quickJumpClose.addEventListener('click', () => quickJumpModal.style.display = 'none');
}

// ======================
// SETTINGS PILL
// ======================
const settingsPillToggle = document.getElementById('settingsPillToggle');
const settingsPillContent = document.getElementById('settingsPillContent');
const settingsPillClose = document.getElementById('settingsPillClose');
    
if (settingsPillToggle && settingsPillContent) {
    settingsPillToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsPillContent.classList.toggle('show');
    });
}
    
if (settingsPillClose && settingsPillContent) {
    settingsPillClose.addEventListener('click', () => settingsPillContent.classList.remove('show'));
}

const carouselToggle = document.getElementById('carouselToggle');
const bgImageSelect = document.getElementById('bgImageSelect');
const bgPrev = document.getElementById('bgPrev');
const bgNext = document.getElementById('bgNext');
const artworkCarousel = document.getElementById('artworkCarousel');
const backgroundOptions = [
    { id: 'lavender', label: 'Lavender Glow', css: 'linear-gradient(135deg, #e8dcf5 0%, #f8e8ef 50%, #d9f4ef 100%)' },
    { id: 'mint', label: 'Mint Breeze', css: 'linear-gradient(135deg, #d6f5ee 0%, #e7fff7 55%, #f3fffd 100%)' },
    { id: 'sunset', label: 'Soft Sunset', css: 'linear-gradient(135deg, #f7d8d8 0%, #f4d9ea 45%, #e2dbf8 100%)' },
    { id: 'ocean', label: 'Calm Ocean', css: 'linear-gradient(135deg, #d6ebff 0%, #d6fff7 60%, #effcff 100%)' }
];

function applyBackgroundByIndex(index) {
    if (!backgroundOptions.length) return;
    const normalized = ((index % backgroundOptions.length) + backgroundOptions.length) % backgroundOptions.length;
    const option = backgroundOptions[normalized];
    if (artworkCarousel) {
        artworkCarousel.style.background = option.css;
    } else {
        try {
            document.body.style.background = option.css;
        } catch (e) {}
    }
    if (bgImageSelect) bgImageSelect.value = String(normalized);
    localStorage.setItem('backgroundIndex', String(normalized));
}

function cycleBackground(step) {
    const current = parseInt(localStorage.getItem('backgroundIndex') || '0', 10) || 0;
    applyBackgroundByIndex(current + step);
}

if (bgImageSelect && backgroundOptions.length) {
    bgImageSelect.innerHTML = backgroundOptions
        .map(function (opt, idx) { return '<option value="' + idx + '">' + opt.label + '</option>'; })
        .join('');
    bgImageSelect.addEventListener('change', function () {
        applyBackgroundByIndex(parseInt(bgImageSelect.value || '0', 10) || 0);
    });
}

if (bgPrev) bgPrev.addEventListener('click', function () { cycleBackground(-1); });
if (bgNext) bgNext.addEventListener('click', function () { cycleBackground(1); });

function wireZipAndWeatherControls() {
    const zIn = document.getElementById('zipInput');
    const zBtn = document.getElementById('zipSubmit');
    if (zIn) {
        try {
            const saved = localStorage.getItem('weatherZip');
            if (saved && !String(zIn.value || '').trim()) zIn.value = saved;
        } catch (e) {}
    }
    if (zBtn && zIn) {
        zBtn.addEventListener('click', function () {
            if (typeof window.updateWeatherByZip === 'function') {
                window.updateWeatherByZip(zIn.value);
            }
        });
        zIn.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                zBtn.click();
            }
        });
    }
}
wireZipAndWeatherControls();

if (carouselToggle) {
    const savedCarousel = localStorage.getItem('carouselEnabled');
    const isCarouselOn = savedCarousel === null ? true : savedCarousel === 'true';
    if (isCarouselOn) carouselToggle.classList.add('active');
    if (artworkCarousel) artworkCarousel.style.display = isCarouselOn ? '' : 'none';
    applyBackgroundByIndex(parseInt(localStorage.getItem('backgroundIndex') || '0', 10) || 0);
    carouselToggle.addEventListener('click', () => {
        const isActive = carouselToggle.classList.toggle('active');
        if (artworkCarousel) artworkCarousel.style.display = isActive ? '' : 'none';
        localStorage.setItem('carouselEnabled', isActive);
    });
}

const weatherToggle = document.getElementById('weatherToggle');
if (weatherToggle) {
    const weatherEnabled = localStorage.getItem('weatherEnabled') === 'true';
    if (weatherEnabled) weatherToggle.classList.add('active');
    weatherToggle.addEventListener('click', () => {
        const isActive = weatherToggle.classList.toggle('active');
        const widget = document.getElementById('weatherWidget');
        if (widget) widget.style.display = isActive ? 'flex' : 'none';
        localStorage.setItem('weatherEnabled', isActive);
        if (isActive) {
            initWeatherSystem();
        }
    });
}

const studioModeToggle = document.getElementById('studioModeToggle');
if (studioModeToggle) {
    const studioOn = localStorage.getItem('studioModeEnabled') === 'true';
    if (studioOn) {
        studioModeToggle.classList.add('active');
        document.body.classList.add('studio-mode');
    }
    studioModeToggle.addEventListener('click', () => {
        const isActive = studioModeToggle.classList.toggle('active');
        document.body.classList.toggle('studio-mode', isActive);
        localStorage.setItem('studioModeEnabled', isActive);
        if (typeof window.showSiteNotice === 'function') {
            window.showSiteNotice(
                isActive ? 'Studio Mode enabled.' : 'Studio Mode disabled.',
                isActive ? 'Larger controls are now active.' : 'Returned to default control size.'
            );
        }
    });
}

// ======================
// SITE PREFERENCES: EXPORT / IMPORT / RESET
// ======================
var SITE_PREF_KEYS = [
    'backgroundIndex',
    'carouselEnabled',
    'weatherEnabled',
    'weatherZip',
    'weatherLastUpdatedAt',
    'lavaLampEnabled',
    'lavaLampColor',
    'lavaLampSpeed',
    'lavaLampContainerColor',
    'lavaLampGlassColor',
    'lavaLampShape',
    'lavaLampBorder',
    'selectedTheme'
];

function collectSitePreferences() {
    var o = {};
    SITE_PREF_KEYS.forEach(function (k) {
        try {
            var v = localStorage.getItem(k);
            if (v !== null) o[k] = v;
        } catch (e) {}
    });
    return o;
}

function exportSitePreferences() {
    var payload = JSON.stringify(
        { v: 1, exportedAt: new Date().toISOString(), prefs: collectSitePreferences() },
        null,
        2
    );
    var blob = new Blob([payload], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'craft-inardor-preferences.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
        URL.revokeObjectURL(a.href);
    }, 4000);
}

function resetSitePreferencesToDefaults() {
    if (!confirm('Reset saved look-and-feel on this device? (Background, weather, lava lamp, theme.)')) return;
    SITE_PREF_KEYS.forEach(function (k) {
        try {
            localStorage.removeItem(k);
        } catch (e) {}
    });
    location.reload();
}

function importSitePreferencesFromFile(file, onDone) {
    var reader = new FileReader();
    reader.onload = function () {
        var status = document.getElementById('sitePrefsImportStatus');
        try {
            var data = JSON.parse(reader.result);
            var prefs = data.prefs || data;
            if (!prefs || typeof prefs !== 'object') throw new Error('Invalid file shape');
            Object.keys(prefs).forEach(function (k) {
                if (SITE_PREF_KEYS.indexOf(k) === -1) return;
                try {
                    localStorage.setItem(k, prefs[k]);
                } catch (e2) {}
            });
            if (status) status.textContent = 'Imported. Reloading…';
            setTimeout(function () {
                location.reload();
            }, 400);
        } catch (err) {
            if (status) status.textContent = 'Import failed: ' + (err && err.message ? err.message : 'invalid JSON');
            if (onDone) onDone(err);
        }
    };
    reader.onerror = function () {
        var status = document.getElementById('sitePrefsImportStatus');
        if (status) status.textContent = 'Could not read file.';
    };
    reader.readAsText(file, 'UTF-8');
}

function wireSitePreferencesBackup() {
    var ex = document.getElementById('sitePrefsExportBtn');
    var imBtn = document.getElementById('sitePrefsImportBtn');
    var imInput = document.getElementById('sitePrefsImportInput');
    var resetBtn = document.getElementById('sitePrefsResetBtn');
    if (ex) {
        ex.addEventListener('click', function () {
            var st = document.getElementById('sitePrefsImportStatus');
            if (st) st.textContent = '';
            exportSitePreferences();
        });
    }
    if (imBtn && imInput) {
        imBtn.addEventListener('click', function () {
            imInput.value = '';
            imInput.click();
        });
        imInput.addEventListener('change', function () {
            var f = imInput.files && imInput.files[0];
            if (!f) return;
            importSitePreferencesFromFile(f);
        });
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            var st = document.getElementById('sitePrefsImportStatus');
            if (st) st.textContent = '';
            resetSitePreferencesToDefaults();
        });
    }
}
wireSitePreferencesBackup();

window.exportSitePreferences = exportSitePreferences;
window.resetSitePreferencesToDefaults = resetSitePreferencesToDefaults;
window.importSitePreferencesFromFile = importSitePreferencesFromFile;

// ======================
// COURSE RESUME (LOCAL) + ADMIN SNAPSHOT
// ======================
var COURSE_CARD_TITLES = ['Polymer Clay Basics', 'Color Mixing Mastery', 'Miniature Food Charms'];

function updateCourseResumeUI() {
    var wrap = document.getElementById('courseResumeBanner');
    var txt = document.getElementById('courseResumeText');
    if (!wrap || !txt) return;
    try {
        var raw = localStorage.getItem('courseLastViewed');
        if (!raw) {
            wrap.style.display = 'none';
            return;
        }
        var d = JSON.parse(raw);
        var title = d.title || COURSE_CARD_TITLES[d.i] || 'Course';
        var when = d.at ? new Date(d.at).toLocaleString() : '';
        txt.textContent = 'Last opened: ' + title + (when ? ' — ' + when : '');
        wrap.style.display = 'block';
    } catch (e) {
        wrap.style.display = 'none';
    }
}

function refreshAdminOrdersSnapshot() {
    var body = document.getElementById('adminOrdersSnapshotBody');
    if (!body) return;
    try {
        var orders = JSON.parse(localStorage.getItem('orderHistory') || '[]');
        var n = Array.isArray(orders) ? orders.length : 0;
        if (n === 0) {
            body.textContent = 'No orders stored in this browser yet.';
            return;
        }
        var last = orders[orders.length - 1];
        var hint = last && (last.id || last.total || last.date) ? ' Latest: ' + JSON.stringify(last).slice(0, 120) + (JSON.stringify(last).length > 120 ? '…' : '') : '';
        body.textContent = String(n) + ' saved order record(s) in local storage.' + hint;
    } catch (e) {
        body.textContent = 'Could not read order history.';
    }
}

window.updateCourseResumeUI = updateCourseResumeUI;
window.refreshAdminOrdersSnapshot = refreshAdminOrdersSnapshot;

// ======================
// THEME MODAL
// ======================
document.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', function() {
        const theme = option.getAttribute('data-theme');
        if (theme) {
            applyTheme(theme);
            const themeModal = document.getElementById('themeModal');
            if (themeModal) themeModal.style.display = 'none';
        }
    });
});

const oppositeToggle = document.getElementById('oppositeToggle');
if (oppositeToggle) {
    oppositeToggle.addEventListener('click', toggleOppositeMode);
}

// ======================
// AUTH MODAL FUNCTIONS
// ======================
/** Remember sign-in method + email hint (localStorage + first-party cookies) for faster return visits */
var CRAFT_AUTH_LAST_METHOD = 'craftAuthLastMethod';
var CRAFT_AUTH_LAST_EMAIL = 'craftAuthLastEmail';
var CRAFT_AUTH_COOKIE_MAX_AGE = 31536000;

function craftCookieGet(name) {
    try {
        var parts = ('; ' + document.cookie).split('; ' + name + '=');
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    } catch (e) {}
    return '';
}

function setAuthReturningPreference(method, emailHint) {
    method = (method || '').toLowerCase();
    if (method !== 'google' && method !== 'password') return;
    var em = emailHint && String(emailHint).indexOf('@') !== -1 ? String(emailHint).trim().toLowerCase() : '';
    try {
        localStorage.setItem(CRAFT_AUTH_LAST_METHOD, method);
        if (em) localStorage.setItem(CRAFT_AUTH_LAST_EMAIL, em);
    } catch (e) {}
    try {
        var sec = typeof location !== 'undefined' && location.protocol === 'https:' ? ';Secure' : '';
        document.cookie =
            CRAFT_AUTH_LAST_METHOD +
            '=' +
            encodeURIComponent(method) +
            ';path=/;max-age=' +
            CRAFT_AUTH_COOKIE_MAX_AGE +
            ';SameSite=Lax' +
            sec;
        if (em) {
            document.cookie =
                CRAFT_AUTH_LAST_EMAIL +
                '=' +
                encodeURIComponent(em) +
                ';path=/;max-age=' +
                CRAFT_AUTH_COOKIE_MAX_AGE +
                ';SameSite=Lax' +
                sec;
        }
    } catch (e2) {}
}

function getAuthReturningEmailHint() {
    try {
        var ls = localStorage.getItem(CRAFT_AUTH_LAST_EMAIL);
        if (ls) return ls;
    } catch (e) {}
    return craftCookieGet(CRAFT_AUTH_LAST_EMAIL);
}

function getAuthLastMethod() {
    try {
        var m = localStorage.getItem(CRAFT_AUTH_LAST_METHOD);
        if (m) return m;
    } catch (e) {}
    return craftCookieGet(CRAFT_AUTH_LAST_METHOD);
}

function syncAuthPreferenceFromFirebaseUser(user) {
    if (!user || !user.email) return;
    var prov = user.providerData && user.providerData[0] && user.providerData[0].providerId;
    if (prov === 'google.com') setAuthReturningPreference('google', user.email);
    else if (prov === 'password') setAuthReturningPreference('password', user.email);
}

function applyAuthPrefill() {
    var email = getAuthReturningEmailHint();
    var loginEl = document.getElementById('loginEmail');
    if (loginEl && email) loginEl.value = email;
    var hint = document.getElementById('authReturningHint');
    var last = getAuthLastMethod();
    if (!hint) return;
    while (hint.firstChild) hint.removeChild(hint.firstChild);
    if (email && last === 'google') {
        hint.style.display = 'block';
        var b = document.createElement('strong');
        b.textContent = 'Welcome back';
        hint.appendChild(b);
        hint.appendChild(
            document.createTextNode(' — last time you used Google (')
        );
        var span = document.createElement('span');
        span.style.opacity = '0.9';
        span.textContent = email;
        hint.appendChild(span);
        hint.appendChild(document.createTextNode('). Use Google below for the fastest sign-in.'));
    } else if (email && last === 'password') {
        hint.style.display = 'block';
        var b2 = document.createElement('strong');
        b2.textContent = 'Welcome back';
        hint.appendChild(b2);
        hint.appendChild(
            document.createTextNode(' — your email is filled in; enter your password to continue.')
        );
    } else if (email) {
        hint.style.display = 'block';
        var b3 = document.createElement('strong');
        b3.textContent = 'Welcome back';
        hint.appendChild(b3);
        hint.appendChild(document.createTextNode(' — sign in to continue.'));
    } else {
        hint.style.display = 'none';
    }
}

function isFileProtocolPreview() {
    return typeof location !== 'undefined' && location.protocol === 'file:';
}

function updateAuthModalProtocolUi() {
    const notice = document.getElementById('authProtocolNotice');
    const row = document.getElementById('authPreviewModeRow');
    const on = isFileProtocolPreview();
    if (notice) notice.style.display = on ? 'block' : 'none';
    if (row) row.style.display = on ? 'block' : 'none';
}

/** When file://, Cursor may suppress notifyInline() — show in-modal message instead */
function showFileProtocolAuthHint() {
    const notice = document.getElementById('authProtocolNotice');
    const row = document.getElementById('authPreviewModeRow');
    if (notice) {
        notice.style.display = 'block';
        try {
            notice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (e) {}
    }
    if (row) row.style.display = 'block';
}

function openAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'flex';
        showLoginForm();
        updateAuthModalProtocolUi();
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

function showSignupForm() {
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
    updateAuthModalProtocolUi();
}

function showLoginForm() {
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    updateAuthModalProtocolUi();
    applyAuthPrefill();
}

window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.showSignupForm = showSignupForm;
window.showLoginForm = showLoginForm;

function syncAccountCtaButton(overrideUser) {
    const btn = document.getElementById('accountCtaBtn');
    if (!btn) return;
    const firebaseUser =
        arguments.length > 0 ? overrideUser : getCurrentFirebaseUser();
    let preview = false;
    try {
        preview = typeof localStorage !== 'undefined' && localStorage.getItem('craftPreviewAuth') === '1';
    } catch (e) {}
    const signedIn = !!(firebaseUser || preview);

    const labelEl = btn.querySelector('.account-cta-label');
    const iconEl = btn.querySelector('i');

    if (signedIn) {
        btn.setAttribute('data-auth', 'in');
        btn.title = 'Profile';
        if (labelEl) labelEl.textContent = 'Profile';
        if (iconEl) {
            iconEl.className = 'fas fa-user-circle';
            iconEl.setAttribute('aria-hidden', 'true');
        }
    } else {
        btn.setAttribute('data-auth', 'out');
        btn.title = 'Sign in';
        if (labelEl) labelEl.textContent = 'Sign in';
        if (iconEl) {
            iconEl.className = 'fas fa-sign-in-alt';
            iconEl.setAttribute('aria-hidden', 'true');
        }
    }
}
window.syncAccountCtaButton = syncAccountCtaButton;

/** Local-only session for file:// / editor preview (not a Firebase user) */
function previewLocalSignIn() {
    const profile = {
        name: 'Preview User',
        email: 'preview@local.test',
        bio: '',
        skillLevel: 'beginner',
        completedProjects: 0,
        totalClayUsed: 0,
        joinDate: Date.now(),
        photoURL: '',
        emailNotifications: true,
        promotionalEmails: false,
        publicProfile: false,
        craftPreviewAuth: true
    };
    try {
        localStorage.setItem('userProfile', JSON.stringify(profile));
        localStorage.setItem('craftPreviewAuth', '1');
        syncUserProfileFromStorage();
    } catch (e) {
        console.warn('Could not save preview session', e);
    }
    closeAuthModal();
    if (typeof window.refreshUserDisplayNameInUI === 'function') window.refreshUserDisplayNameInUI();
}

window.previewLocalSignIn = previewLocalSignIn;

function dismissFileProtocolBanner() {
    const b = document.getElementById('fileProtocolBanner');
    if (b) b.style.display = 'none';
    if (document.body) {
        document.body.style.paddingTop = '';
        document.body.classList.remove('file-protocol-banner-visible');
    }
}

window.dismissFileProtocolBanner = dismissFileProtocolBanner;

async function captureProfileScreenshot() {
    const u = getCurrentFirebaseUser();
    if (!u) {
        notifyInline('Sign in first, then open Profile to use screenshots.');
        return;
    }
    if (typeof html2canvas !== 'function') {
        notifyInline('Screenshot tool is still loading. Try again in a moment.');
        return;
    }
    try {
        const canvas = await html2canvas(document.body, { useCORS: true, backgroundColor: null });
        const link = document.createElement('a');
        link.download = 'craftinardor-screenshot.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (e) {
        console.error(e);
        notifyInline('Could not capture screenshot right now.');
    }
}

window.captureProfileScreenshot = captureProfileScreenshot;

(function initFileProtocolBanner() {
    function showBanner() {
        if (!isFileProtocolPreview()) return;
        const b = document.getElementById('fileProtocolBanner');
        if (b) {
            b.style.display = 'block';
            if (document.body) {
                document.body.style.paddingTop = '76px';
                document.body.classList.add('file-protocol-banner-visible');
            }
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showBanner);
    } else {
        showBanner();
    }
})();

// ======================
// FIREBASE AUTH FUNCTIONS
// ======================
async function signupWithEmail() {
    if (isFileProtocolPreview()) {
        showFileProtocolAuthHint();
        return;
    }
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupPasswordConfirm').value;
    
    if (!name) {
        notifyInline('❌ Please enter your name');
        return;
    }
    
    if (!email || !email.includes('@')) {
        notifyInline('❌ Please enter a valid email');
        return;
    }
    
    if (password.length < 6) {
        notifyInline('❌ Password must be at least 6 characters');
        return;
    }
    
    if (password !== confirmPassword) {
        notifyInline('❌ Passwords do not match');
        return;
    }
    
    const auth = getAuth();
    if (!auth) {
        notifyInline('Firebase Auth is not ready. Check your network connection and refresh the page.');
        return;
    }
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });
        try {
            localStorage.removeItem('craftPreviewAuth');
        } catch (e) {}
        if (typeof auth.authStateReady === 'function') {
            await auth.authStateReady();
        }

        // Initialize user profile
        const profile = {
            name: name,
            email: email,
            bio: '',
            skillLevel: 'beginner',
            completedProjects: 0,
            totalClayUsed: 0,
            joinDate: Date.now(),
            photoURL: '',
            emailNotifications: true,
            promotionalEmails: false,
            publicProfile: false
        };
        localStorage.setItem('userProfile', JSON.stringify(profile));
        syncUserProfileFromStorage();
        setAuthReturningPreference('password', email);
        if (typeof window.refreshUserDisplayNameInUI === 'function') window.refreshUserDisplayNameInUI(userCredential.user);
        notifyInline('🎉 Account created successfully! Welcome, ' + name + '!');
        closeAuthModal();
        showUserProfile();
    } catch (error) {
        console.error('Signup error:', error);
        if (error.code === 'auth/email-already-in-use') {
            notifyInline('❌ This email is already registered. Please sign in instead.');
            showLoginForm();
        } else {
            notifyInline('❌ Signup failed: ' + error.message);
        }
    }
}

async function loginWithEmail() {
    if (isFileProtocolPreview()) {
        showFileProtocolAuthHint();
        return;
    }
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !email.includes('@')) {
        notifyInline('❌ Please enter a valid email');
        return;
    }
    
    if (!password) {
        notifyInline('❌ Please enter your password');
        return;
    }
    
    const auth = getAuth();
    if (!auth) {
        notifyInline('Firebase Auth is not ready. Check your network connection and refresh the page.');
        return;
    }
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        try {
            localStorage.removeItem('craftPreviewAuth');
        } catch (e) {}
        if (typeof auth.authStateReady === 'function') {
            await auth.authStateReady();
        }

        console.log('✅ User logged in:', user.email);
        let profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        profile.name = user.displayName || user.email.split('@')[0];
        profile.email = user.email;
        profile.photoURL = user.photoURL || profile.photoURL || '';
        if (!profile.joinDate) profile.joinDate = Date.now();
        localStorage.setItem('userProfile', JSON.stringify(profile));
        syncUserProfileFromStorage();
        setAuthReturningPreference('password', user.email);
        if (typeof window.refreshUserDisplayNameInUI === 'function') window.refreshUserDisplayNameInUI(user);
        notifyInline('👋 Welcome back, ' + (user.displayName || profile.name || 'Artist') + '!');
        closeAuthModal();
    } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'auth/user-not-found') {
            notifyInline('❌ No account found with this email. Please sign up first.');
            showSignupForm();
        } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            notifyInline('❌ Incorrect email or password. Please try again.');
        } else {
            notifyInline('❌ Login failed: ' + error.message);
        }
    }
}

/**
 * Completes Google sign-in after redirect (or if popup ever returns inline).
 * Popups often hang on /__/auth/handler (third-party cookies, embedded browsers) — we use redirect.
 */
function finishGoogleSignInWithUser(user) {
    if (!user) return;
    try {
        localStorage.removeItem('craftPreviewAuth');
    } catch (e) {}
    const prev = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const isFirstRealAccount =
        !prev.email ||
        prev.craftPreviewAuth === true ||
        prev.email === 'preview@local.test';
    const emailSafe = user.email || prev.email || '';
    const merged = {
        ...prev,
        name: user.displayName || (user.email ? user.email.split('@')[0] : '') || prev.name || 'Member',
        email: emailSafe,
        photoURL: user.photoURL || prev.photoURL || '',
        joinDate: prev.joinDate || Date.now()
    };
    delete merged.craftPreviewAuth;
    setAuthReturningPreference('google', user.email);
    if (isFirstRealAccount) {
        merged.bio = merged.bio || '';
        merged.skillLevel = merged.skillLevel || 'beginner';
        merged.completedProjects = merged.completedProjects || 0;
        merged.totalClayUsed = merged.totalClayUsed || 0;
        merged.emailNotifications = merged.emailNotifications !== false;
        merged.promotionalEmails = !!merged.promotionalEmails;
        merged.publicProfile = !!merged.publicProfile;
    }
    localStorage.setItem('userProfile', JSON.stringify(merged));
    syncUserProfileFromStorage();
    if (isFirstRealAccount) {
        notifyInline('🎉 Account created successfully! Welcome, ' + merged.name + '!');
    } else {
        notifyInline('👋 Welcome back, ' + (user.displayName || merged.name || 'Artist') + '!');
    }
    console.log('✅ User logged in with Google:', user.email || user.uid);
    if (typeof window.refreshUserDisplayNameInUI === 'function') window.refreshUserDisplayNameInUI(user);
    closeAuthModal();
}

window.finishGoogleSignInWithUser = finishGoogleSignInWithUser;

async function signupWithGoogle() {
    if (isFileProtocolPreview()) {
        showFileProtocolAuthHint();
        return;
    }
    const auth = getAuth();
    if (!auth) {
        notifyInline('Firebase Auth is not ready. Check your network connection and refresh the page.');
        return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    var hint = getAuthReturningEmailHint();
    var last = getAuthLastMethod();
    var gParams = {};
    if (hint) gParams.login_hint = hint;
    if (last !== 'google') gParams.prompt = 'select_account';
    provider.setCustomParameters(gParams);

    try {
        // Full-page redirect avoids popup stuck on firebaseapp.com/__/auth/handler
        await auth.signInWithRedirect(provider);
    } catch (error) {
        console.error('Google login error:', error);
        notifyInline('❌ Google sign-in failed: ' + error.message);
    }
}

window.signupWithEmail = signupWithEmail;
window.loginWithEmail = loginWithEmail;
window.signupWithGoogle = signupWithGoogle;

/**
 * Google sign-in uses a full-page redirect. We must call getRedirectResult() once after return.
 * Use DOM ready + authStateReady so (a) UI helpers exist and (b) Firebase has restored auth state.
 * If we only listen for DOMContentLoaded and it already fired before this script registered, redirect completion would be skipped.
 */
function consumeFirebaseRedirectSignIn() {
    const auth = getAuth();
    if (!auth || typeof auth.getRedirectResult !== 'function') return;
    auth
        .getRedirectResult()
        .then(function (result) {
            if (result && result.user) {
                finishGoogleSignInWithUser(result.user);
            }
        })
        .catch(function (err) {
            if (!err || !err.code) return;
            if (err.code === 'auth/operation-not-supported-in-this-environment') return;
            if (err.code === 'auth/redirect-cancelled-by-user') return;
            if (err.code === 'auth/unauthorized-domain') {
                notifyInline(
                    '❌ This hostname is not allowed for sign-in. In Firebase Console → Authentication → Settings, add this site under Authorized domains (for example propart-creator.web.app).'
                );
                return;
            }
            console.warn('getRedirectResult', err);
        });
}

function scheduleConsumeFirebaseRedirectSignIn() {
    function afterDom() {
        const auth = getAuth();
        if (!auth || typeof auth.getRedirectResult !== 'function') return;
        var ready =
            typeof auth.authStateReady === 'function'
                ? auth.authStateReady().catch(function () {})
                : Promise.resolve();
        ready.then(function () {
            consumeFirebaseRedirectSignIn();
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', afterDom);
    } else {
        afterDom();
    }
}
scheduleConsumeFirebaseRedirectSignIn();

// ======================
// PROFILE HELPER FUNCTIONS
// ======================
function switchProfileTab(tabName) {
    // Hide all content
    document.querySelectorAll('.profile-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Remove active from all tabs
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.style.borderBottom = 'none';
        tab.style.color = 'var(--text-secondary)';
    });
    
    // Show selected content
    document.getElementById('profileContent' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).style.display = 'block';
    
    // Activate selected tab
    const activeTab = document.getElementById('profileTab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    activeTab.style.borderBottom = '3px solid var(--accent-color)';
    activeTab.style.color = 'var(--accent-color)';
}

async function uploadProfilePhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        notifyInline('❌ Photo must be less than 2MB');
        return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
        notifyInline('❌ Please upload an image file');
        return;
    }
    
    // Read file as data URL
    const reader = new FileReader();
    reader.onload = async function(e) {
        const photoURL = e.target.result;
        
        // Update profile photo in UI
        const container = document.getElementById('profilePhotoContainer');
        if (container) {
            container.innerHTML = '<img src="' + photoURL + '" style="width:100%;height:100%;object-fit:cover;">';
        }
        
        // Save to profile
        const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        profile.photoURL = photoURL;
        localStorage.setItem('userProfile', JSON.stringify(profile));
        
        // Firebase Auth photoURL requires a normal URL, not a base64 blob.
        // Keep local avatar for data URLs; only push remote URLs to Firebase profile.
        const user = getAuth()?.currentUser;
        if (user) {
            try {
                if (/^https?:\/\//i.test(photoURL) && photoURL.length <= 1800) {
                    await user.updateProfile({ photoURL: photoURL });
                    console.log('✅ Profile photo updated');
                } else {
                    console.info('Local profile avatar saved (not pushed to Firebase Auth photoURL).');
                }
            } catch (error) {
                console.error('Error updating photo:', error);
            }
        }
    };
    reader.readAsDataURL(file);
}

function removeFromWishlist(itemId) {
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    wishlist = wishlist.filter(item => item.id !== itemId);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    
    // Refresh profile modal
    closeProfileModal();
    showUserProfile();
    switchProfileTab('wishlist');
}

async function changePassword() {
    const user = getAuth()?.currentUser;
    if (!user) {
        notifyInline('❌ Please sign in to change your password');
        return;
    }
    
    const newPassword = prompt('Enter new password (min. 6 characters):');
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
        notifyInline('❌ Password must be at least 6 characters');
        return;
    }
    
    try {
        await user.updatePassword(newPassword);
        notifyInline('✅ Password updated successfully!');
    } catch (error) {
        if (error.code === 'auth/requires-recent-login') {
            notifyInline('❌ Please sign out and sign in again before changing your password.');
        } else {
            notifyInline('❌ Error changing password: ' + error.message);
        }
        console.error('Password change error:', error);
    }
}

async function signOut() {
    if (!confirm('Are you sure you want to sign out?')) return;

    if (typeof localStorage !== 'undefined' && localStorage.getItem('craftPreviewAuth') === '1') {
        try {
            localStorage.removeItem('craftPreviewAuth');
            localStorage.removeItem('userProfile');
        } catch (e) {}
        closeProfileModal();
        if (typeof window.refreshUserDisplayNameInUI === 'function') window.refreshUserDisplayNameInUI();
        return;
    }

    const auth = getAuth();
    if (!auth) {
        notifyInline('Firebase Auth is not ready.');
        return;
    }
    try {
        await auth.signOut();
        notifyInline('✅ Signed out successfully');
        closeProfileModal();
        console.log('✅ User logged out');
    } catch (error) {
        notifyInline('❌ Error signing out: ' + error.message);
        console.error('Logout error:', error);
    }
}

async function deleteAccount() {
    if (!confirm('⚠️ Are you sure you want to delete your account? This action cannot be undone!')) return;
    
    const confirmation = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmation !== 'DELETE') return;
    
    const user = getAuth()?.currentUser;
    if (!user) {
        notifyInline('❌ No user signed in');
        return;
    }
    
    try {
        // Clear local storage
        localStorage.removeItem('userProfile');
        localStorage.removeItem('wishlist');
        localStorage.removeItem('orderHistory');
        localStorage.removeItem('unlockedBadges');
        
        // Delete Firebase user
        await user.delete();
        
        notifyInline('✅ Account deleted successfully');
        closeProfileModal();
        console.log('✅ User account deleted');
    } catch (error) {
        if (error.code === 'auth/requires-recent-login') {
            notifyInline('❌ Please sign out and sign in again before deleting your account.');
        } else {
            notifyInline('❌ Error deleting account: ' + error.message);
        }
        console.error('Delete account error:', error);
    }
}

window.switchProfileTab = switchProfileTab;
window.uploadProfilePhoto = uploadProfilePhoto;
window.removeFromWishlist = removeFromWishlist;
window.changePassword = changePassword;
window.signOut = signOut;
window.deleteAccount = deleteAccount;

// ======================
// FIREBASE AUTHENTICATION
// ======================
document.addEventListener(
    'click',
    function (e) {
        var ac = e.target && e.target.closest && e.target.closest('#accountCtaBtn');
        if (ac) {
            e.preventDefault();
            const firebaseUser = getCurrentFirebaseUser();
            var preview = false;
            try {
                preview = typeof localStorage !== 'undefined' && localStorage.getItem('craftPreviewAuth') === '1';
            } catch (err) {}
            if (firebaseUser || preview) showUserProfile();
            else openAuthModal();
        }
    },
    true
);

// Check if user is already logged in on page load
if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // Sync user profile
            const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            const uEmail = user.email || '';
            if (!profile.email || profile.email !== uEmail) {
                profile.name = user.displayName || (user.email ? user.email.split('@')[0] : '') || profile.name || 'Member';
                profile.email = uEmail || profile.email || '';
                profile.photoURL = user.photoURL || profile.photoURL || '';
                if (!profile.joinDate) profile.joinDate = Date.now();
                localStorage.setItem('userProfile', JSON.stringify(profile));
            }

            syncAuthPreferenceFromFirebaseUser(user);

            console.log('✅ User already logged in:', user.email || user.uid);
        }
        if (typeof window.refreshUserDisplayNameInUI === 'function') window.refreshUserDisplayNameInUI(user);
    });
} else if (typeof window.refreshUserDisplayNameInUI === 'function') {
    window.refreshUserDisplayNameInUI();
}

// ======================
// BADGE OVERLAY
// ======================
const badgeOverlay = document.getElementById('badgeOverlay');
const badgeUnlock = document.getElementById('badgeUnlock');
    
if (badgeOverlay && badgeUnlock) {
    badgeOverlay.addEventListener('click', () => {
        badgeUnlock.style.display = 'none';
        badgeOverlay.style.display = 'none';
    });
}

// ======================
// SCROLL TRACKING
// ======================
let hasScrolledToBottom = false;
window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100 && !hasScrolledToBottom) {
        hasScrolledToBottom = true;
        unlockBadge('first-scroll');
    }
});

// Scroll progress bar
window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const progressBar = document.getElementById('scrollProgress');
    if (progressBar) progressBar.style.width = scrolled + '%';
});

// ======================
// SOCIAL BUTTONS
// ======================
const socialButtons = [
    { id: 'instagram', url: 'https://instagram.com', key: 'instagram' },
    { id: 'linkedin', url: 'https://linkedin.com', key: 'linkedin' },
    { id: 'kofi', url: 'https://ko-fi.com', key: 'kofi' }
];
    
socialButtons.forEach(({ id, url, key }) => {
    const btn = document.getElementById(id);
    if (btn) {
        btn.addEventListener('click', () => {
            window.open(url, '_blank');
            socialClicks.add(key);
            if (socialClicks.size >= 3) unlockBadge('social-butterfly');
        });
    }
});

// ======================
// COOKIE CONSENT
// ======================
const cookieConsent = document.getElementById('cookieConsent');
const acceptCookies = document.getElementById('acceptCookies');
const declineCookies = document.getElementById('declineCookies');
    
if (!localStorage.getItem('cookiesAccepted') && cookieConsent) {
    cookieConsent.style.display = 'flex';
}
    
if (acceptCookies) {
    acceptCookies.addEventListener('click', () => {
        localStorage.setItem('cookiesAccepted', 'true');
        if (cookieConsent) cookieConsent.style.display = 'none';
    });
}
    
if (declineCookies && cookieConsent) {
    declineCookies.addEventListener('click', () => cookieConsent.style.display = 'none');
}

// ======================
// INITIALIZE FEATURED PRODUCTS
// ======================
function initFeaturedProducts() {
    const productGrid = document.getElementById('quirkyProductGrid') || document.querySelector('#shop .product-grid');
    if (!productGrid) return;
    
    productGrid.innerHTML = '';
    featuredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-category', product.category || 'all');
        card.setAttribute('data-search-text', (product.name + ' ' + (product.description || '')).toLowerCase());
        card.innerHTML = `
            <div class="product-image-placeholder">
                <img src="${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">
            </div>
            <h3>${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <p style="font-weight:700;color:var(--accent-color);font-size:1.2em;">$${product.price.toFixed(2)}</p>
            <button class="add-to-cart-btn" onclick="addToCart('${product.name}', ${product.price})">
                <i class="fas fa-shopping-cart"></i> Add to Cart
            </button>
        `;
        productGrid.appendChild(card);
    });
}

// ======================
// INITIALIZE ON LOAD
// ======================
initFeaturedProducts();
loadGuestCartFromStorage();
unlockBadge('first-visit');
updateBadgesPanel();
updateUserGreeting();
addXP('visit');
updateStreak();
    
setTimeout(() => {
    const products = ['Polymer Clay Starter Kit', 'Mica Powder Set', 'Clay Tools Bundle', 'Tutorial E-Book'];
    showSocialProof(products[Math.floor(Math.random() * products.length)]);
}, 3000);

window.openAdminPanel = openAdminPanel;
window.closeAdminPanel = closeAdminPanel;

if (typeof window.__CRAFT_DEBUG === 'boolean' && window.__CRAFT_DEBUG) {
    console.log('All features initialized');
    console.log('User profile', userProfile);
    console.log('Badges unlocked', unlockedBadges.length);
    console.log('Visit count', visitCount);
}