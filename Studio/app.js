import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
    import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
    import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
    import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";

    const canUseServiceWorker = location.protocol === 'http:' || location.protocol === 'https:';
    if (!canUseServiceWorker) {
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) manifestLink.remove();
    }
    if (canUseServiceWorker && 'serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js');
        });
    }

    const firebaseConfig = {
        apiKey: "AIzaSyCTpkNFCdhieP6GMpUbeZNE6rukkReGLhM",
        authDomain: "tbbutterfly-8966b.firebaseapp.com",
        projectId: "tbbutterfly-8966b",
        storageBucket: "tbbutterfly-8966b.firebasestorage.app",
        messagingSenderId: "1086357829959",
        appId: "1:1086357829959:web:4fd9126db6ea314f86f462",
        measurementId: "G-7SKFH9PVT3"
    };

    const firebaseApp = initializeApp(firebaseConfig);
    const auth = getAuth(firebaseApp);
    const db = getFirestore(firebaseApp);
    const googleProvider = new GoogleAuthProvider();
    let userId = null;
    let saveTimer = null;
    let authUser = null;

    isSupported().then((supported) => {
        if (supported && location.protocol === 'https:') {
            getAnalytics(firebaseApp);
        }
    });

    // Canvas background
    const bgCanvas = document.getElementById('background-canvas');
    const bgCtx = bgCanvas.getContext('2d');
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    let particles = [];
    const particleCount = 50;
    class Particle {
        constructor() {
            this.x = Math.random() * bgCanvas.width;
            this.y = Math.random() * bgCanvas.height;
            this.size = Math.random() * 5 + 2;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 + 0.5;
            this.color = 'rgba(255, 182, 193, 0.5)';
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.y > bgCanvas.height) {
                this.y = 0 - this.size;
                this.x = Math.random() * bgCanvas.width;
            }
            if (this.x > bgCanvas.width || this.x < 0) {
                this.speedX *= -1;
            }
        }
        draw() {
            bgCtx.fillStyle = this.color;
            bgCtx.beginPath();
            bgCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            bgCtx.fill();
        }
    }
    function initParticles() { particles = []; for (let i = 0; i < particleCount; i++) { particles.push(new Particle()); } }
    function animateCanvas() { bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height); particles.forEach(p => { p.update(); p.draw(); }); requestAnimationFrame(animateCanvas); }
    initParticles();
    animateCanvas();
    window.addEventListener('resize', () => { bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight; initParticles(); });

    // App State
    const colorThief = new ColorThief();
    const clayColors = [
        // Premo (current + classic + discontinued)
        { brand: 'Premo', name: 'White', hex: '#F2F3F0' },
        { brand: 'Premo', name: 'Black', hex: '#2E2A28' },
        { brand: 'Premo', name: 'Cadmium Yellow Hue', hex: '#FDD526' },
        { brand: 'Premo', name: 'Cadmium Red Hue', hex: '#C72128' },
        { brand: 'Premo', name: 'Ultramarine Blue Hue', hex: '#1E317A' },
        { brand: 'Premo', name: 'Pomegranate', hex: '#932448' },
        { brand: 'Premo', name: 'Fuchsia', hex: '#C53982' },
        { brand: 'Premo', name: 'Purple', hex: '#5F3475' },
        { brand: 'Premo', name: 'Cobalt Blue Hue', hex: '#005A9C' },
        { brand: 'Premo', name: 'Turquoise', hex: '#0089A3' },
        { brand: 'Premo', name: 'Green', hex: '#006D4A' },
        { brand: 'Premo', name: 'Burnt Umber', hex: '#4B302B' },
        { brand: 'Premo', name: 'Alizarin Crimson', hex: '#8F1D3A' },
        { brand: 'Premo', name: 'Cobalt Violet', hex: '#5C3A7A' },
        { brand: 'Premo', name: 'Blue Pearl', hex: '#8BB1C9' },
        { brand: 'Premo', name: 'Bronze', hex: '#B07A3E' },
        { brand: 'Premo', name: 'Copper', hex: '#B8653F' },
        { brand: 'Premo', name: 'Silver', hex: '#BFC1C6' },
        { brand: 'Premo', name: 'Gold', hex: '#D8B04C' },
        { brand: 'Premo', name: 'Translucent', hex: '#F6F6F2' },
        { brand: 'Premo', name: 'Translucent White', hex: '#F5F5F1' },
        { brand: 'Premo', name: 'Translucent Blue', hex: '#A7C9DD' },
        { brand: 'Premo', name: 'Translucent Red', hex: '#C77A8A' },
        { brand: 'Premo', name: 'Translucent Yellow', hex: '#F5E89A' },
        { brand: 'Premo', name: 'Blush', hex: '#E7B4B0' },
        { brand: 'Premo', name: 'Peacock Pearl', hex: '#2C8B85' },
        { brand: 'Premo', name: 'Silver Metallic', hex: '#C2C4C8' },
        { brand: 'Premo', name: 'Gray', hex: '#8F8F95' },
        { brand: 'Premo', name: 'Ecru', hex: '#E9D9C6' },
        { brand: 'Premo', name: 'Burnt Orange', hex: '#CC6B2C' },
        { brand: 'Premo', name: 'Bright Green Pearl', hex: '#6EC66B' },
        { brand: 'Premo', name: 'Pearl', hex: '#F1E9E6' },
        { brand: 'Premo', name: 'Accents Gold', hex: '#C6A149', discontinued: true },
        { brand: 'Premo', name: 'Wasabi', hex: '#B7C95C', discontinued: true },
        { brand: 'Premo', name: 'Sunflower', hex: '#F4C634', discontinued: true },
        { brand: 'Premo', name: 'Carnation Pink', hex: '#E9A3B3', discontinued: true },
        { brand: 'Premo', name: 'Teal', hex: '#1B9E9A', discontinued: true },
        { brand: 'Premo', name: 'Eggplant', hex: '#4E2A4B', discontinued: true },
        { brand: 'Premo', name: 'Raw Sienna', hex: '#C48A5A', discontinued: true },

        // Souffle (current + discontinued)
        { brand: 'Souffle', name: 'Igloo', hex: '#FDFEFE' },
        { brand: 'Souffle', name: 'Canary', hex: '#FDEB6C' },
        { brand: 'Souffle', name: 'Pumpkin', hex: '#EA752A' },
        { brand: 'Souffle', name: 'Cherry Pie', hex: '#A6242F' },
        { brand: 'Souffle', name: 'Sea Glass', hex: '#77C2B8' },
        { brand: 'Souffle', name: 'Lagoon', hex: '#006979' },
        { brand: 'Souffle', name: 'Cowboy', hex: '#634D40' },
        { brand: 'Souffle', name: 'Poppy Seed', hex: '#343434' },
        { brand: 'Souffle', name: 'Latte', hex: '#C7A58A' },
        { brand: 'Souffle', name: 'Guava', hex: '#E26B7F' },
        { brand: 'Souffle', name: 'Sage', hex: '#8FA98B' },
        { brand: 'Souffle', name: 'Smokey Black', hex: '#2B2B2B' },
        { brand: 'Souffle', name: 'Robin Egg', hex: '#A8D7D8', discontinued: true },
        { brand: 'Souffle', name: 'Cappuccino', hex: '#A17862', discontinued: true },
        { brand: 'Souffle', name: 'Cornflower', hex: '#7BA6D3', discontinued: true },
        { brand: 'Souffle', name: 'Thistle', hex: '#B3A4C2', discontinued: true },

        // Sculpey III (current + discontinued)
        { brand: 'Sculpey III', name: 'White', hex: '#F7F7F5' },
        { brand: 'Sculpey III', name: 'Black', hex: '#2C2C2C' },
        { brand: 'Sculpey III', name: 'Red', hex: '#B12A2A' },
        { brand: 'Sculpey III', name: 'Yellow', hex: '#F5D23A' },
        { brand: 'Sculpey III', name: 'Blue', hex: '#2E6CB6' },
        { brand: 'Sculpey III', name: 'Green', hex: '#2E8B57' },
        { brand: 'Sculpey III', name: 'Purple', hex: '#6A4C8C' },
        { brand: 'Sculpey III', name: 'Hot Pink', hex: '#E24FA0' },
        { brand: 'Sculpey III', name: 'Emerald', hex: '#0C7F6F' },
        { brand: 'Sculpey III', name: 'Chocolate Brown', hex: '#5C3B2E' },
        { brand: 'Sculpey III', name: 'Beige', hex: '#D9C4A1' },
        { brand: 'Sculpey III', name: 'Lavender', hex: '#B2A1D1' },
        { brand: 'Sculpey III', name: 'Ice Blue', hex: '#A5CFE3' },
        { brand: 'Sculpey III', name: 'Pearl', hex: '#F1E6E2' },
        { brand: 'Sculpey III', name: 'Silver', hex: '#BFBFC4' },
        { brand: 'Sculpey III', name: 'Gold', hex: '#D1B05B' },
        { brand: 'Sculpey III', name: 'Turquoise', hex: '#2FA5B0' },
        { brand: 'Sculpey III', name: 'Cobalt Blue', hex: '#1E4E9A' },
        { brand: 'Sculpey III', name: 'Raspberry', hex: '#C04E73', discontinued: true },
        { brand: 'Sculpey III', name: 'Mint', hex: '#A5D8C6', discontinued: true },

        // Kato Polyclay (current + discontinued)
        { brand: 'Kato', name: 'White', hex: '#F7F6F1' },
        { brand: 'Kato', name: 'Translucent', hex: '#F4F1EA' },
        { brand: 'Kato', name: 'Black', hex: '#262426' },
        { brand: 'Kato', name: 'Red', hex: '#B62025' },
        { brand: 'Kato', name: 'Yellow', hex: '#FADF3D' },
        { brand: 'Kato', name: 'Blue', hex: '#004B8C' },
        { brand: 'Kato', name: 'Green', hex: '#007047' },
        { brand: 'Kato', name: 'Brown', hex: '#59382D' },
        { brand: 'Kato', name: 'Magenta', hex: '#B2328B' },
        { brand: 'Kato', name: 'Cadmium Orange', hex: '#E06D2A' },
        { brand: 'Kato', name: 'Turquoise', hex: '#0097A7' },
        { brand: 'Kato', name: 'Lilac', hex: '#9E8DC0' },
        { brand: 'Kato', name: 'Silver', hex: '#BFC2C7' },
        { brand: 'Kato', name: 'Copper', hex: '#B66D4F' },
        { brand: 'Kato', name: 'Bronze', hex: '#B07A3E' },
        { brand: 'Kato', name: 'Gold', hex: '#C6A24D', discontinued: true },

        // Fimo Professional / Soft (current + discontinued)
        { brand: 'Fimo Professional', name: 'White', hex: '#F5F5F2' },
        { brand: 'Fimo Professional', name: 'Black', hex: '#1E1E1E' },
        { brand: 'Fimo Professional', name: 'True Red', hex: '#B8232A' },
        { brand: 'Fimo Professional', name: 'Brilliant Blue', hex: '#1E4DA1' },
        { brand: 'Fimo Professional', name: 'True Yellow', hex: '#F7D54E' },
        { brand: 'Fimo Professional', name: 'Leaf Green', hex: '#2E8E5C' },
        { brand: 'Fimo Professional', name: 'Purple', hex: '#6C4B93' },
        { brand: 'Fimo Professional', name: 'Beige', hex: '#E3D4BE' },
        { brand: 'Fimo Professional', name: 'Translucent', hex: '#F5F5F0' },
        { brand: 'Fimo Soft', name: 'White', hex: '#F7F7F3' },
        { brand: 'Fimo Soft', name: 'Black', hex: '#2A2A2A' },
        { brand: 'Fimo Soft', name: 'Peppermint', hex: '#B6E5E0' },
        { brand: 'Fimo Soft', name: 'Raspberry', hex: '#C0436B' },
        { brand: 'Fimo Soft', name: 'Tropical Green', hex: '#4CBFA5' },
        { brand: 'Fimo Soft', name: 'Dolphin Grey', hex: '#9AA1A8' },
        { brand: 'Fimo Soft', name: 'Plum', hex: '#5B2F4B', discontinued: true },
        { brand: 'Fimo Soft', name: 'Caribbean', hex: '#2AA7C8', discontinued: true },

        // Cernit (current + discontinued)
        { brand: 'Cernit', name: 'White', hex: '#F8F7F3' },
        { brand: 'Cernit', name: 'Black', hex: '#222222' },
        { brand: 'Cernit', name: 'Number One', hex: '#F5E06E' },
        { brand: 'Cernit', name: 'Turquoise', hex: '#2AA6A4' },
        { brand: 'Cernit', name: 'Violet', hex: '#6D4C8C' },
        { brand: 'Cernit', name: 'Raspberry', hex: '#C0486B' },
        { brand: 'Cernit', name: 'Sahara', hex: '#D1B38B' },
        { brand: 'Cernit', name: 'Metallic Silver', hex: '#C2C4C9' },
        { brand: 'Cernit', name: 'Metallic Gold', hex: '#C9A24A' },
        { brand: 'Cernit', name: 'Metallic Copper', hex: '#B77455' },
        { brand: 'Cernit', name: 'Metallic Bronze', hex: '#9E6B3D' },
        { brand: 'Cernit', name: 'Bronze', hex: '#9E6B3D' },
        { brand: 'Cernit', name: 'Apricot', hex: '#F1B08F', discontinued: true },
        { brand: 'Cernit', name: 'Royal Blue', hex: '#2450A8', discontinued: true },

        // Pardo (current + discontinued)
        { brand: 'Pardo', name: 'White', hex: '#F7F7F2' },
        { brand: 'Pardo', name: 'Black', hex: '#232323' },
        { brand: 'Pardo', name: 'Red', hex: '#B52B2E' },
        { brand: 'Pardo', name: 'Yellow', hex: '#F6D34C' },
        { brand: 'Pardo', name: 'Blue', hex: '#24509A' },
        { brand: 'Pardo', name: 'Green', hex: '#2B8E57' },
        { brand: 'Pardo', name: 'Orange', hex: '#E4742D' },
        { brand: 'Pardo', name: 'Translucent', hex: '#F6F5F0' },
        { brand: 'Pardo', name: 'Old Rose', hex: '#D5A5B4', discontinued: true },

        // Craft Smart / Store brands (discontinued lines)
        { brand: 'Craft Smart', name: 'White', hex: '#F7F7F5', discontinued: true },
        { brand: 'Craft Smart', name: 'Black', hex: '#2B2B2B', discontinued: true },
        { brand: 'Craft Smart', name: 'Teal', hex: '#2E9CA3', discontinued: true },
        { brand: 'Craft Smart', name: 'Hot Pink', hex: '#E04E97', discontinued: true },

        // Specialty / Effect lines (discontinued)
        { brand: 'Premo Effect', name: 'Glitter Gold', hex: '#D0B05C', discontinued: true },
        { brand: 'Premo Effect', name: 'Glitter Silver', hex: '#C9CCD1', discontinued: true },
        { brand: 'Premo Effect', name: 'Glow in the Dark', hex: '#DDE8C9', discontinued: true },
        { brand: 'Fimo Effect', name: 'Glitter White', hex: '#F0ECE9', discontinued: true },
        { brand: 'Fimo Effect', name: 'Glitter Black', hex: '#2D2D2D', discontinued: true },
        { brand: 'Fimo Effect', name: 'Glow in the Dark', hex: '#E7F0D5', discontinued: true }
    ];

    const state = {
        projectName: 'New Project',
        originalImage: null,
        palette: [],
        secondaryPalette: [],
        recipes: [],
        selectedRecipe: null,
        favorites: [],
        inventory: {},
        inventoryPacks: JSON.parse(localStorage.getItem('studioInventoryPacks') || '{}'),
        inventoryPackSizes: JSON.parse(localStorage.getItem('studioInventoryPackSizes') || '{}'),
        inventoryCosts: JSON.parse(localStorage.getItem('studioInventoryCosts') || '{}'),
        inventoryPrices: JSON.parse(localStorage.getItem('studioInventoryPrices') || '{}'),
        inventoryHistory: JSON.parse(localStorage.getItem('studioInventoryHistory') || '[]'),
        inventoryEditMode: false,
        notes: localStorage.getItem('studioNotes') || '',
        barcodeDefaultGrams: parseInt(localStorage.getItem('studioBarcodeDefaultGrams') || '56', 10) || 56,
        lowStockThreshold: parseInt(localStorage.getItem('studioLowStockThreshold') || '20', 10) || 20,
        reorderTarget: parseInt(localStorage.getItem('studioReorderTarget') || '120', 10) || 120,
        projects: JSON.parse(localStorage.getItem('studioProjects') || '[]'),
        lastSyncedAt: localStorage.getItem('studioLastSyncedAt') || '',
        recipeLibrary: JSON.parse(localStorage.getItem('studioRecipeLibrary') || '[]'),
        accessibility: JSON.parse(localStorage.getItem('studioAccessibility') || '{"largeText":false,"cbCheck":false}'),
        creativity: JSON.parse(localStorage.getItem('studioCreativity') || '{"interest":"figures","goal":"practice","dailyKey":"","dailyPrompt":"","lastShuffle":""}'),
        reorderList: JSON.parse(localStorage.getItem('studioReorderList') || '{}'),
        ui: JSON.parse(localStorage.getItem('studioUi') || '{"theme":"rose","darkMode":false}')
    };

    const slabCutterState = {
        background: null,
        backgroundType: 'image',
        backgroundColor: '#fdf2f8',
        shape: 'circle',
        cuts: [],
        cutterPos: { x: null, y: null },
        cutterSize: 80,
        rotation: 0,
        gridEnabled: true,
        snapEnabled: true,
        gridSize: 40,
        offscreenCanvas: null
    };

    const barcodeState = {
        active: false,
        mode: 'add',
        lastCode: null,
        lastScanAt: 0,
        pendingCode: null,
        mapping: JSON.parse(localStorage.getItem('studioBarcodes') || '{}'),
        recentCodes: {},
        messageTimer: null,
        confirmTimer: null,
        pendingConfirm: null,
        batchMode: JSON.parse(localStorage.getItem('studioBarcodeBatchMode') || 'false')
    };

    async function loadUserData() {
        if (!userId) return;
        const ref = doc(db, 'users', userId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const data = snap.data();
        if (typeof data.notes === 'string') {
            state.notes = data.notes;
            dom.projectNotes.value = state.notes;
            localStorage.setItem('studioNotes', state.notes);
        }
        if (typeof data.projectName === 'string') {
            state.projectName = data.projectName;
            if (dom.projectNameInput) dom.projectNameInput.value = state.projectName;
        }
        if (data.inventory && typeof data.inventory === 'object') {
            state.inventory = data.inventory;
            localStorage.setItem('studioInventory', JSON.stringify(state.inventory));
            renderInventory();
        }
        if (data.inventoryPacks && typeof data.inventoryPacks === 'object') {
            state.inventoryPacks = data.inventoryPacks;
            localStorage.setItem('studioInventoryPacks', JSON.stringify(state.inventoryPacks));
        }
        if (data.inventoryPackSizes && typeof data.inventoryPackSizes === 'object') {
            state.inventoryPackSizes = data.inventoryPackSizes;
            localStorage.setItem('studioInventoryPackSizes', JSON.stringify(state.inventoryPackSizes));
        }
        if (data.inventoryCosts && typeof data.inventoryCosts === 'object') {
            state.inventoryCosts = data.inventoryCosts;
            localStorage.setItem('studioInventoryCosts', JSON.stringify(state.inventoryCosts));
        }
        if (data.inventoryPrices && typeof data.inventoryPrices === 'object') {
            state.inventoryPrices = data.inventoryPrices;
            localStorage.setItem('studioInventoryPrices', JSON.stringify(state.inventoryPrices));
        }
        if (Array.isArray(data.inventoryHistory)) {
            state.inventoryHistory = data.inventoryHistory;
            localStorage.setItem('studioInventoryHistory', JSON.stringify(state.inventoryHistory));
            renderUsageHistory();
        }
        if (typeof data.lowStockThreshold === 'number') {
            state.lowStockThreshold = data.lowStockThreshold;
            localStorage.setItem('studioLowStockThreshold', String(state.lowStockThreshold));
        }
        if (typeof data.reorderTarget === 'number') {
            state.reorderTarget = data.reorderTarget;
            localStorage.setItem('studioReorderTarget', String(state.reorderTarget));
        }
        if (data.barcodes && typeof data.barcodes === 'object') {
            barcodeState.mapping = data.barcodes;
            localStorage.setItem('studioBarcodes', JSON.stringify(barcodeState.mapping));
            renderBarcodeRegistry();
        }
        if (typeof data.barcodeDefaultGrams === 'number') {
            state.barcodeDefaultGrams = data.barcodeDefaultGrams;
            dom.barcodeDefaultGrams.value = String(state.barcodeDefaultGrams);
            localStorage.setItem('studioBarcodeDefaultGrams', String(state.barcodeDefaultGrams));
        }
        if (Array.isArray(data.projects)) {
            state.projects = data.projects;
            localStorage.setItem('studioProjects', JSON.stringify(state.projects));
            renderProjectList();
        }
        if (Array.isArray(data.recipeLibrary)) {
            state.recipeLibrary = data.recipeLibrary;
            localStorage.setItem('studioRecipeLibrary', JSON.stringify(state.recipeLibrary));
            renderRecipeLibrary();
        }
        if (data.reorderList && typeof data.reorderList === 'object') {
            state.reorderList = data.reorderList;
            localStorage.setItem('studioReorderList', JSON.stringify(state.reorderList));
            renderReorderList();
        }
        if (data.accessibility && typeof data.accessibility === 'object') {
            state.accessibility = data.accessibility;
            localStorage.setItem('studioAccessibility', JSON.stringify(state.accessibility));
            if (dom.toggleLargeText) dom.toggleLargeText.checked = !!state.accessibility.largeText;
            if (dom.toggleCbCheck) dom.toggleCbCheck.checked = !!state.accessibility.cbCheck;
            applyAccessibility();
        }
        if (data.ui && typeof data.ui === 'object') {
            state.ui = { ...state.ui, ...data.ui };
            localStorage.setItem('studioUi', JSON.stringify(state.ui));
            applyThemeSettings();
        }
        if (data.lastSyncAt?.toDate) {
            const date = data.lastSyncAt.toDate();
            state.lastSyncedAt = date.toISOString();
            localStorage.setItem('studioLastSyncedAt', state.lastSyncedAt);
            updateSyncStatus(date);
        }
        if (data.creativity && typeof data.creativity === 'object') {
            state.creativity = data.creativity;
            localStorage.setItem('studioCreativity', JSON.stringify(state.creativity));
            renderCreativityUI();
        }
    }

    function scheduleUserSave() {
        if (!userId) return;
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(saveUserData, 600);
    }

    async function saveUserData() {
        if (!userId) return;
        const ref = doc(db, 'users', userId);
        await setDoc(ref, {
            projectName: state.projectName,
            notes: state.notes,
            inventory: state.inventory,
            inventoryPacks: state.inventoryPacks,
            inventoryPackSizes: state.inventoryPackSizes,
            inventoryCosts: state.inventoryCosts,
            inventoryPrices: state.inventoryPrices,
            inventoryHistory: state.inventoryHistory,
            lowStockThreshold: state.lowStockThreshold,
            reorderTarget: state.reorderTarget,
            barcodes: barcodeState.mapping,
            barcodeDefaultGrams: state.barcodeDefaultGrams,
            projects: state.projects,
            recipeLibrary: state.recipeLibrary,
            reorderList: state.reorderList,
            accessibility: state.accessibility,
            creativity: state.creativity,
            ui: state.ui,
            lastSyncAt: serverTimestamp()
        }, { merge: true });
        updateSyncStatus(new Date());
    }

    // DOM
    const dom = {
        dropZone: document.getElementById('drop-zone'),
        fileInput: document.getElementById('file-input'),
        uploadButton: document.getElementById('upload-button'),
        regenerateBtn: document.getElementById('regenerate-btn'),
        imagePreview: document.getElementById('image-preview'),
        originalImageContainer: document.getElementById('original-image-container'),
        reimaginedContainer: document.getElementById('reimagined-container'),
        reimaginedCanvas: document.getElementById('reimagined-canvas'),
        paletteContainerOriginal: document.getElementById('palette-container-original'),
        paletteContainerComp: document.getElementById('palette-container-comp'),
        cbWarning: document.getElementById('cb-warning'),
        recipesContainer: document.getElementById('recipes-container'),
        recipeDetail: document.getElementById('recipe-detail'),
        favoritesContainer: document.getElementById('favorites-container'),
        batchGrams: document.getElementById('batch-grams'),
        batchOutput: document.getElementById('batch-output'),
        mixWarning: document.getElementById('mix-warning'),
        reserveBtn: document.getElementById('reserve-from-inventory'),
        inventoryContainer: document.getElementById('inventory-container'),
        bwToggle: document.getElementById('bw-toggle'),
        projectNotes: document.getElementById('project-notes'),
        exportSummaryBtn: document.getElementById('export-summary-btn'),
        inventoryEditBtn: document.getElementById('inventory-edit-btn'),
        inventorySaveBtn: document.getElementById('inventory-save-btn'),
        barcodeScanBtn: document.getElementById('barcode-scan-btn'),
        barcodeRegisterBtn: document.getElementById('barcode-register-btn'),
        barcodeModal: document.getElementById('barcode-modal'),
        barcodeCloseBtn: document.getElementById('barcode-close-btn'),
        barcodePreview: document.getElementById('barcode-preview'),
        barcodeRegisterPanel: document.getElementById('barcode-register-panel'),
        barcodeColorSelect: document.getElementById('barcode-color-select'),
        barcodeSaveMapping: document.getElementById('barcode-save-mapping'),
        barcodeGramsInput: document.getElementById('barcode-grams-input'),
        barcodeDefaultGrams: document.getElementById('barcode-default-grams'),
        barcodeStatus: document.getElementById('barcode-status'),
        barcodeLast: document.getElementById('barcode-last'),
        barcodeRegistry: document.getElementById('barcode-registry'),
        barcodeRegistryCount: document.getElementById('barcode-registry-count'),
        barcodeManualInput: document.getElementById('barcode-manual-input'),
        barcodeManualBtn: document.getElementById('barcode-manual-btn'),
        barcodeBatchToggle: document.getElementById('barcode-batch-toggle'),
        barcodeUsbBtn: document.getElementById('barcode-usb-btn'),
        barcodeKeyboardPanel: document.getElementById('barcode-keyboard-panel'),
        barcodeHardwareInput: document.getElementById('barcode-hardware-input'),
        barcodeHardwareFocus: document.getElementById('barcode-hardware-focus'),
        barcodeExportBtn: document.getElementById('barcode-export-btn'),
        barcodeImportBtn: document.getElementById('barcode-import-btn'),
        barcodeImportFile: document.getElementById('barcode-import-file'),
        barcodePrintLabels: document.getElementById('barcode-print-labels'),
        inventoryExportBtn: document.getElementById('inventory-export-btn'),
        inventoryImportBtn: document.getElementById('inventory-import-btn'),
        inventoryImportFile: document.getElementById('inventory-import-file'),
        lowStockThreshold: document.getElementById('low-stock-threshold'),
        reorderTarget: document.getElementById('reorder-target'),
        reorderList: document.getElementById('reorder-list'),
        reorderCopyBtn: document.getElementById('reorder-copy-btn'),
        reorderClearBtn: document.getElementById('reorder-clear-btn'),
        reorderTotal: document.getElementById('reorder-total'),
        reorderColorSelect: document.getElementById('reorder-color-select'),
        reorderGramsInput: document.getElementById('reorder-grams-input'),
        reorderAddBtn: document.getElementById('reorder-add-btn'),
        reorderQuickBtns: document.querySelectorAll('.reorder-quick-btn'),
        reorderStatus: document.getElementById('reorder-status'),
        usageHistory: document.getElementById('usage-history'),
        networkStatus: document.getElementById('network-status'),
        syncStatus: document.getElementById('sync-status'),
        syncLast: document.getElementById('sync-last'),
        toggleLargeText: document.getElementById('toggle-large-text'),
        toggleCbCheck: document.getElementById('toggle-cb-check'),
        toggleNightMode: document.getElementById('toggle-night-mode'),
        themePicker: document.getElementById('theme-picker'),
        recipeTags: document.getElementById('recipe-tags'),
        recipePhoto: document.getElementById('recipe-photo'),
        recipeSaveBtn: document.getElementById('recipe-save-btn'),
        recipeClearPhoto: document.getElementById('recipe-clear-photo'),
        recipeShareInput: document.getElementById('recipe-share-input'),
        recipeImportBtn: document.getElementById('recipe-import-btn'),
        recipeLibrary: document.getElementById('recipe-library'),
        authBtn: document.getElementById('auth-btn'),
        authLabel: document.getElementById('auth-label'),
        authAvatar: document.getElementById('auth-avatar'),
        authStatus: document.getElementById('auth-status'),
        authPrompt: document.getElementById('auth-prompt'),
        authPromptBtn: document.getElementById('auth-prompt-btn'),
        authModal: document.getElementById('auth-modal'),
        authCloseBtn: document.getElementById('auth-close-btn'),
        authGoogleBtn: document.getElementById('auth-google-btn'),
        authEmail: document.getElementById('auth-email'),
        authPassword: document.getElementById('auth-password'),
        authSigninBtn: document.getElementById('auth-signin-btn'),
        authSignupBtn: document.getElementById('auth-signup-btn'),
        authSignoutBtn: document.getElementById('auth-signout-btn'),
        authMessage: document.getElementById('auth-message'),
        creativityInterest: document.getElementById('creativity-interest'),
        creativityGoal: document.getElementById('creativity-goal'),
        dailyPromptBtn: document.getElementById('daily-prompt-btn'),
        shuffleCardsBtn: document.getElementById('shuffle-cards-btn'),
        dailyPromptText: document.getElementById('daily-prompt-text'),
        challengeCards: document.getElementById('challenge-cards'),
        projectNameInput: document.getElementById('project-name-input'),
        projectSaveBtn: document.getElementById('project-save-btn'),
        projectShareBtn: document.getElementById('project-share-btn'),
        projectShareCode: document.getElementById('project-share-code'),
        projectList: document.getElementById('project-list'),
        projectLoadBtn: document.getElementById('project-load-btn'),
        projectDeleteBtn: document.getElementById('project-delete-btn'),
        projectImportCode: document.getElementById('project-import-code'),
        projectImportBtn: document.getElementById('project-import-btn'),
        projectImportStatus: document.getElementById('project-import-status')
    };

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-content-${btn.dataset.tab}`).classList.add('active');
            if (btn.dataset.tab === 'cutter') updateSlabCutterUI();
        });
    });

    // Slab panel tabs
    document.querySelectorAll('.slab-panel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.slab-panel-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.slab-panel').forEach(p => p.classList.add('hidden'));
            btn.classList.add('active');
            document.getElementById(`slab-panel-${btn.dataset.panel}`).classList.remove('hidden');
        });
    });

    // Project Hub
    dom.uploadButton.addEventListener('click', () => dom.fileInput.click());
    dom.fileInput.addEventListener('change', (e) => openImage(e.target.files[0]));
    dom.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dom.dropZone.classList.add('dragover'); });
    dom.dropZone.addEventListener('dragleave', () => dom.dropZone.classList.remove('dragover'));
    dom.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dom.dropZone.classList.remove('dragover');
        openImage(e.dataTransfer.files[0]);
    });
    document.getElementById('new-project-btn').addEventListener('click', resetProject);
    dom.regenerateBtn.addEventListener('click', () => generateAll(dom.imagePreview));
    dom.bwToggle.addEventListener('change', () => generateAll(dom.imagePreview));

    dom.projectNotes.value = state.notes;
    dom.projectNotes.addEventListener('input', () => {
        state.notes = dom.projectNotes.value;
        localStorage.setItem('studioNotes', state.notes);
        scheduleUserSave();
    });

    // Recipe tools
    document.getElementById('calculate-batch').addEventListener('click', calculateBatch);
    dom.reserveBtn.addEventListener('click', reserveFromInventory);
    dom.exportSummaryBtn.addEventListener('click', exportSummary);

    // Inventory edit controls
    dom.inventoryEditBtn.addEventListener('click', () => setInventoryEditMode(true));
    dom.inventorySaveBtn.addEventListener('click', () => setInventoryEditMode(false));
    dom.barcodeScanBtn.addEventListener('click', () => openBarcodeScanner('add'));
    if (dom.barcodeUsbBtn) dom.barcodeUsbBtn.addEventListener('click', () => openBarcodeScanner('keyboard'));
    dom.barcodeRegisterBtn.addEventListener('click', () => openBarcodeScanner('register'));
    dom.barcodeCloseBtn.addEventListener('click', closeBarcodeScanner);
    dom.barcodeSaveMapping.addEventListener('click', saveBarcodeMapping);
    dom.barcodeDefaultGrams.value = localStorage.getItem('studioBarcodeDefaultGrams') || '56';
    dom.barcodeDefaultGrams.addEventListener('change', () => {
        const val = Math.max(1, parseInt(dom.barcodeDefaultGrams.value, 10) || 56);
        dom.barcodeDefaultGrams.value = val;
        state.barcodeDefaultGrams = val;
        localStorage.setItem('studioBarcodeDefaultGrams', String(val));
        scheduleUserSave();
    });
    if (dom.barcodeRegistry) {
        dom.barcodeRegistry.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('button[data-action]');
            if (!actionBtn) return;
            const row = actionBtn.closest('[data-barcode]');
            if (!row) return;
            const code = row.dataset.barcode;
            if (!code) return;
            if (actionBtn.dataset.action === 'remove') {
                delete barcodeState.mapping[code];
                localStorage.setItem('studioBarcodes', JSON.stringify(barcodeState.mapping));
                scheduleUserSave();
                renderBarcodeRegistry();
                return;
            }
            if (actionBtn.dataset.action === 'save') {
                const select = row.querySelector('select');
                const input = row.querySelector('input');
                const key = select?.value || '';
                const grams = Math.max(1, parseInt(input?.value || '56', 10) || 56);
                if (!key) {
                    showBarcodeMessage('Choose a color before saving.');
                    return;
                }
                barcodeState.mapping[code] = { key, grams };
                localStorage.setItem('studioBarcodes', JSON.stringify(barcodeState.mapping));
                showBarcodeMessage(`Updated ${code} → ${getBarcodeColorLabel(key)}.`);
                scheduleUserSave();
                renderBarcodeRegistry();
            }
        });
    }

    // Auth controls
    dom.authBtn.addEventListener('click', openAuthModal);
    dom.authPromptBtn.addEventListener('click', openAuthModal);
    dom.authCloseBtn.addEventListener('click', closeAuthModal);
    dom.authGoogleBtn.addEventListener('click', signInWithGoogle);
    dom.authSigninBtn.addEventListener('click', signInWithEmail);
    dom.authSignupBtn.addEventListener('click', signUpWithEmail);
    dom.authSignoutBtn.addEventListener('click', signOutUser);
    if (dom.recipeSaveBtn) dom.recipeSaveBtn.addEventListener('click', saveRecipeToLibrary);
    if (dom.recipeImportBtn) dom.recipeImportBtn.addEventListener('click', importRecipeFromLink);
    if (dom.recipeClearPhoto) dom.recipeClearPhoto.addEventListener('click', () => { dom.recipePhoto.value = ''; });
    if (dom.inventoryExportBtn) dom.inventoryExportBtn.addEventListener('click', exportInventoryCsv);
    if (dom.inventoryImportBtn) dom.inventoryImportBtn.addEventListener('click', () => dom.inventoryImportFile.click());
    if (dom.inventoryImportFile) dom.inventoryImportFile.addEventListener('change', handleInventoryImport);
    if (dom.barcodeExportBtn) dom.barcodeExportBtn.addEventListener('click', exportBarcodeCsv);
    if (dom.barcodeImportBtn) dom.barcodeImportBtn.addEventListener('click', () => dom.barcodeImportFile.click());
    if (dom.barcodeImportFile) dom.barcodeImportFile.addEventListener('change', handleBarcodeImport);
    if (dom.barcodePrintLabels) dom.barcodePrintLabels.addEventListener('click', printBarcodeLabels);
    if (dom.reorderCopyBtn) dom.reorderCopyBtn.addEventListener('click', copyReorderList);
    if (dom.barcodeManualBtn) dom.barcodeManualBtn.addEventListener('click', handleManualBarcode);
    if (dom.barcodeBatchToggle) dom.barcodeBatchToggle.addEventListener('change', handleBatchToggle);
    if (dom.barcodeHardwareFocus) dom.barcodeHardwareFocus.addEventListener('click', () => dom.barcodeHardwareInput?.focus());
    if (dom.barcodeHardwareInput) {
        dom.barcodeHardwareInput.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            const code = dom.barcodeHardwareInput.value.trim();
            if (code) acceptBarcode(code);
            dom.barcodeHardwareInput.value = '';
        });
    }
    if (dom.toggleLargeText) dom.toggleLargeText.addEventListener('change', applyAccessibility);
    if (dom.toggleCbCheck) dom.toggleCbCheck.addEventListener('change', applyAccessibility);
    if (dom.toggleNightMode) dom.toggleNightMode.addEventListener('change', () => {
        state.ui.darkMode = !!dom.toggleNightMode.checked;
        localStorage.setItem('studioUi', JSON.stringify(state.ui));
        applyThemeSettings();
        scheduleUserSave();
    });
    if (dom.themePicker) {
        dom.themePicker.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-theme]');
            if (!btn) return;
            state.ui.theme = btn.dataset.theme;
            localStorage.setItem('studioUi', JSON.stringify(state.ui));
            applyThemeSettings();
            scheduleUserSave();
        });
    }
    if (dom.reorderAddBtn) dom.reorderAddBtn.addEventListener('click', () => addToReorderList());
    if (dom.reorderQuickBtns?.length) {
        dom.reorderQuickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const grams = parseInt(btn.dataset.grams || '0', 10) || 0;
                addToReorderList(grams);
            });
        });
    }
    if (dom.reorderClearBtn) dom.reorderClearBtn.addEventListener('click', clearReorderList);
    if (dom.projectSaveBtn) dom.projectSaveBtn.addEventListener('click', saveProjectSnapshot);
    if (dom.projectShareBtn) dom.projectShareBtn.addEventListener('click', shareProjectSnapshot);
    if (dom.projectLoadBtn) dom.projectLoadBtn.addEventListener('click', loadSelectedProject);
    if (dom.projectDeleteBtn) dom.projectDeleteBtn.addEventListener('click', deleteSelectedProject);
    if (dom.projectImportBtn) dom.projectImportBtn.addEventListener('click', importSharedProject);
    if (dom.projectNameInput) dom.projectNameInput.addEventListener('input', () => {
        state.projectName = dom.projectNameInput.value.trim() || state.projectName;
    });

    // Slab Cutter setup
    const slabCanvas = document.getElementById('slab-canvas');
    slabCanvas.addEventListener('mousemove', (e) => {
        const rect = slabCanvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        if (slabCutterState.snapEnabled && slabCutterState.gridSize > 0) {
            x = Math.round(x / slabCutterState.gridSize) * slabCutterState.gridSize;
            y = Math.round(y / slabCutterState.gridSize) * slabCutterState.gridSize;
        }
        slabCutterState.cutterPos = { x, y };
        drawSlabCanvas();
    });
    slabCanvas.addEventListener('mouseleave', () => {
        slabCutterState.cutterPos = { x: null, y: null };
        drawSlabCanvas();
    });
    slabCanvas.addEventListener('click', performCut);
    document.getElementById('cutter-size').addEventListener('input', (e) => {
        slabCutterState.cutterSize = parseInt(e.target.value, 10);
        document.getElementById('cutter-size-val').textContent = e.target.value;
        drawSlabCanvas();
    });
    document.getElementById('cutter-rotation').addEventListener('input', (e) => {
        slabCutterState.rotation = parseInt(e.target.value, 10);
        document.getElementById('cutter-rotation-val').textContent = e.target.value;
        drawSlabCanvas();
    });
    document.getElementById('slab-grid-toggle').addEventListener('change', (e) => {
        slabCutterState.gridEnabled = e.target.checked;
        drawSlabCanvas();
    });
    document.getElementById('slab-snap-toggle').addEventListener('change', (e) => {
        slabCutterState.snapEnabled = e.target.checked;
    });
    document.getElementById('slab-grid-size').addEventListener('change', (e) => {
        slabCutterState.gridSize = Math.max(10, parseInt(e.target.value, 10) || 40);
        drawSlabCanvas();
    });
    document.querySelectorAll('.cutter-shape-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            slabCutterState.shape = btn.dataset.shape;
            document.querySelectorAll('.cutter-shape-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
    document.getElementById('clear-cuts-btn').addEventListener('click', () => {
        slabCutterState.cuts = [];
        updateSlabCutterUI();
    });
    document.getElementById('download-sheet-btn').addEventListener('click', downloadContactSheet);
    document.getElementById('undo-cut-btn').addEventListener('click', () => {
        slabCutterState.cuts.pop();
        displayCuts();
    });
    document.getElementById('duplicate-cut-btn').addEventListener('click', () => {
        if (slabCutterState.cuts.length === 0) return;
        const last = slabCutterState.cuts[slabCutterState.cuts.length - 1];
        slabCutterState.cuts.push(last);
        displayCuts();
    });

    // Bake timer
    let timerInterval = null;
    document.getElementById('start-timer').addEventListener('click', () => {
        const minutes = parseInt(document.getElementById('bake-minutes').value, 10);
        startTimer(minutes);
    });

    // Constants for UI options (must be declared before initialization)
    const creativityInterests = [
        { id: 'figures', label: 'Figures & Characters' },
        { id: 'miniatures', label: 'Miniatures & Scenes' },
        { id: 'jewelry', label: 'Jewelry & Charms' },
        { id: 'home', label: 'Home Decor' },
        { id: 'fantasy', label: 'Fantasy & Myth' },
        { id: 'nature', label: 'Nature & Florals' },
        { id: 'texture', label: 'Texture & Surface' },
        { id: 'cane', label: 'Cane & Pattern' },
        { id: 'functional', label: 'Functional Items' },
        { id: 'abstract', label: 'Abstract & Color Play' }
    ];

    const creativityGoals = [
        { id: 'practice', label: 'Practice a skill' },
        { id: 'sell', label: 'Make to sell' },
        { id: 'gift', label: 'Make a gift' },
        { id: 'learn', label: 'Learn a technique' },
        { id: 'portfolio', label: 'Portfolio piece' },
        { id: 'speed', label: 'Speed challenge' },
        { id: 'relax', label: 'Relax & play' }
    ];

    const creativityPrompts = {
        figures: [
            'Sculpt a character with one oversized feature (eyes, hair, or hands).',
            'Create a duo of best-friends with contrasting silhouettes.',
            'Build a tiny mascot with a big accessory (hat, bag, or cape).',
            'Make a seated pose with clear weight balance.',
            'Design a character inspired by a favorite hobby.'
        ],
        miniatures: [
            'Build a mini shelf scene with 3 tiny objects.',
            'Create a miniature kitchen item with realistic texture.',
            'Sculpt a tiny pet and its favorite toy.',
            'Make a mini plant pot with 2 different leaf shapes.',
            'Design a tiny snack with a bite taken out.'
        ],
        jewelry: [
            'Design a charm set using two complementary colors.',
            'Make earrings that mix matte and glossy finishes.',
            'Create a pendant featuring a simple gradient cane slice.',
            'Build a charm inspired by a favorite fruit.',
            'Craft a tiny charm with layered texture.'
        ],
        home: [
            'Create a decorative tile with 3 repeating shapes.',
            'Make a mini tray with a soft ombré base.',
            'Design a wall hanging with clay tassels.',
            'Build a small trinket dish with scalloped edges.',
            'Make a candle holder sleeve with cutout patterns.'
        ],
        fantasy: [
            'Sculpt a mythical creature in a chibi style.',
            'Create a potion bottle charm with tiny labels.',
            'Make a fantasy weapon with gemstone detail.',
            'Design a fairy door with wood grain texture.',
            'Build a dragon egg with layered scales.'
        ],
        nature: [
            'Create a floral cane using 3 petal shapes.',
            'Sculpt a tiny mushroom cluster with varied caps.',
            'Make a leaf charm with visible veins.',
            'Build a berry bundle with 2 different sizes.',
            'Design a seashell with subtle color bands.'
        ],
        texture: [
            'Explore a 3-texture study: smooth, stippled, and carved.',
            'Make a surface inspired by fabric (denim, knit, or lace).',
            'Create a bark texture on a small slab.',
            'Design a stone texture using 2 tools.',
            'Blend a gradient then stamp a repeating pattern.'
        ],
        cane: [
            'Build a simple 3-color bullseye cane.',
            'Create a checkerboard cane with uneven sizes.',
            'Make a slice cane that looks like a fruit.',
            'Layer a stripe cane and twist into a spiral.',
            'Design a cane with negative space.'
        ],
        functional: [
            'Make a keychain with a bold silhouette.',
            'Create a bag charm with layered shapes.',
            'Design a bookmark topper with a mini scene.',
            'Craft a phone grip topper with texture.',
            'Build a tiny container with a fitted lid.'
        ],
        abstract: [
            'Create a 3-color palette and make a gradient slab.',
            'Make a geometric piece using only circles and squares.',
            'Design a piece that uses only two curves.',
            'Build a piece that uses one repeated motif.',
            'Explore one color at 3 different values.'
        ]
    };

    const creativityGoalModifiers = {
        practice: 'Focus on one skill for 20 minutes.',
        sell: 'Make it repeatable in a 5‑piece batch.',
        gift: 'Add a personal detail or initial.',
        learn: 'Try a new tool or surface technique.',
        portfolio: 'Photograph 3 progress shots.',
        speed: 'Finish in 30 minutes or less.',
        relax: 'Keep it playful—no perfection rules.'
    };

    const creativityChallenges = [
        { title: '3‑Shape Rule', prompt: 'Use only three shapes in the whole piece.', tags: ['all'], goals: ['practice', 'portfolio', 'relax'] },
        { title: 'Tiny Details', prompt: 'Add one micro detail that viewers discover up close.', tags: ['all'], goals: ['sell', 'portfolio'] },
        { title: 'Two‑Tone Only', prompt: 'Limit the palette to two colors plus white.', tags: ['abstract', 'jewelry', 'functional'], goals: ['practice', 'sell'] },
        { title: 'Story Pose', prompt: 'Give your figure a pose that tells a story.', tags: ['figures'], goals: ['portfolio', 'gift'] },
        { title: 'Mini Scene', prompt: 'Create a scene with foreground and background.', tags: ['miniatures', 'home'], goals: ['portfolio', 'sell'] },
        { title: 'Texture Mix', prompt: 'Combine two contrasting textures in one slab.', tags: ['texture', 'home'], goals: ['practice', 'learn'] },
        { title: 'Cane Slice Accent', prompt: 'Add a single cane slice as a focal point.', tags: ['cane', 'jewelry'], goals: ['sell', 'learn'] },
        { title: 'Fantasy Motif', prompt: 'Include a magical symbol or rune.', tags: ['fantasy'], goals: ['gift', 'portfolio'] },
        { title: 'Nature Palette', prompt: 'Match a 3‑color palette from nature.', tags: ['nature', 'abstract'], goals: ['practice', 'relax'] },
        { title: 'Functional Twist', prompt: 'Add a hidden function (clip, hook, or slot).', tags: ['functional', 'home'], goals: ['sell', 'learn'] },
        { title: 'Charm Pair', prompt: 'Make two charms that look related but not identical.', tags: ['jewelry'], goals: ['sell', 'gift'] },
        { title: 'Silhouette Focus', prompt: 'Keep details minimal; let the outline shine.', tags: ['figures', 'abstract'], goals: ['portfolio', 'practice'] }
    ];

    const themeOptions = [
        { id: 'rose', accent: '#D96A8A', strong: '#C55478', soft: '#FFE4EA', border: '#FBCFE8' },
        { id: 'lavender', accent: '#8B6ACB', strong: '#6E51B4', soft: '#EEE7FF', border: '#E1D6FF' },
        { id: 'mint', accent: '#4FB6A8', strong: '#3A968A', soft: '#E6FBF6', border: '#CFEFE8' },
        { id: 'sky', accent: '#4E8FD9', strong: '#3D78BF', soft: '#E7F1FF', border: '#D2E5FF' },
        { id: 'ember', accent: '#D97B5F', strong: '#C46348', soft: '#FFE9E1', border: '#FFD7C8' }
    ];

    // Initialization
    initInventory();
    resetProject();
    setTimeout(initCreativity, 0);
    renderRecipeLibrary();
    renderProjectList();
    renderReorderList();
    renderUsageHistory();
    if (dom.toggleLargeText) dom.toggleLargeText.checked = !!state.accessibility.largeText;
    if (dom.toggleCbCheck) dom.toggleCbCheck.checked = !!state.accessibility.cbCheck;
    applyAccessibility();
    applyThemeSettings();
    if (state.lastSyncedAt) updateSyncStatus(new Date(state.lastSyncedAt));
    updateNetworkStatus();
    importRecipeFromHash();
    resizeSlabCanvas();
    window.addEventListener('resize', resizeSlabCanvas);
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    onAuthStateChanged(auth, (user) => {
        authUser = user || null;
        if (user) {
            userId = user.uid;
            loadUserData();
        } else {
            userId = null;
        }
        updateAuthUI();
    });

    getRedirectResult(auth).then((result) => {
        if (result?.user) {
            dom.authMessage.textContent = 'Signed in with Google.';
            closeAuthModal();
        }
    }).catch((err) => {
        dom.authMessage.textContent = formatAuthError(err, 'Google sign-in failed.');
    });


    function formatAuthError(err, fallback) {
        const code = err?.code || '';
        const map = {
            'auth/unauthorized-domain': 'This domain is not authorized for Firebase Auth. Add it in Firebase console.',
            'auth/popup-blocked': 'Popup blocked. Allow popups or try the redirect sign-in.',
            'auth/popup-closed-by-user': 'Popup closed before completing sign-in.',
            'auth/operation-not-supported-in-this-environment': 'This browser blocked the sign-in popup.',
            'auth/network-request-failed': 'Network error. Check your connection and try again.',
            'auth/invalid-email': 'Enter a valid email address.',
            'auth/user-not-found': 'No account found for this email.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/email-already-in-use': 'That email already has an account.'
        };
        return map[code] || fallback;
    }

    function ensureAuthAllowed() {
        if (location.protocol === 'file:') {
            if (dom.authMessage) {
                dom.authMessage.textContent = 'Sign-in requires a local server (http://localhost) or https hosting.';
            }
            return false;
        }
        return true;
    }

    function openAuthModal() {
        if (!dom.authModal) return;
        dom.authMessage.textContent = '';
        dom.authModal.classList.remove('hidden');
        updateAuthUI();
    }

    function closeAuthModal() {
        if (!dom.authModal) return;
        dom.authModal.classList.add('hidden');
    }

    function updateAuthUI() {
        const isSignedIn = !!authUser && !authUser.isAnonymous;
        const label = isSignedIn
            ? (authUser.displayName || authUser.email || 'Account')
            : 'Sign in';
        const initials = isSignedIn
            ? (label.trim()[0] || 'A').toUpperCase()
            : 'U';
        dom.authLabel.textContent = isSignedIn ? 'Account' : 'Sign in';
        dom.authAvatar.textContent = initials;
        dom.authStatus.classList.toggle('hidden', !isSignedIn);
        dom.authStatus.textContent = isSignedIn ? label : '';
        dom.authPrompt.classList.toggle('hidden', isSignedIn);
        dom.authSignoutBtn.classList.toggle('hidden', !isSignedIn);
        if (isSignedIn && dom.barcodeStatus) {
            dom.barcodeStatus.textContent = '';
        }
    }

    async function signInWithGoogle() {
        if (!ensureAuthAllowed()) return;
        try {
            await signInWithPopup(auth, googleProvider);
            dom.authMessage.textContent = 'Signed in with Google.';
            closeAuthModal();
        } catch (err) {
            if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/operation-not-supported-in-this-environment') {
                try {
                    await signInWithRedirect(auth, googleProvider);
                    dom.authMessage.textContent = 'Redirecting to Google sign-in...';
                    return;
                } catch (redirectErr) {
                    dom.authMessage.textContent = formatAuthError(redirectErr, 'Google sign-in failed.');
                    return;
                }
            }
            dom.authMessage.textContent = formatAuthError(err, 'Google sign-in failed.');
        }
    }

    async function signUpWithEmail() {
        if (!ensureAuthAllowed()) return;
        const email = dom.authEmail.value.trim();
        const password = dom.authPassword.value;
        if (!email || !password) {
            dom.authMessage.textContent = 'Enter email and password.';
            return;
        }
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            dom.authMessage.textContent = 'Account created.';
            closeAuthModal();
        } catch (err) {
            dom.authMessage.textContent = formatAuthError(err, 'Account creation failed.');
        }
    }

    async function signInWithEmail() {
        if (!ensureAuthAllowed()) return;
        const email = dom.authEmail.value.trim();
        const password = dom.authPassword.value;
        if (!email || !password) {
            dom.authMessage.textContent = 'Enter email and password.';
            return;
        }
        try {
            await signInWithEmailAndPassword(auth, email, password);
            dom.authMessage.textContent = 'Signed in.';
            closeAuthModal();
        } catch (err) {
            dom.authMessage.textContent = formatAuthError(err, 'Sign-in failed.');
        }
    }

    async function signOutUser() {
        try {
            await signOut(auth);
            dom.authMessage.textContent = 'Signed out.';
            closeAuthModal();
        } catch (err) {
            dom.authMessage.textContent = 'Sign out failed.';
        }
    }

    function openBarcodeScanner(mode = 'add') {
        if (!dom.barcodeModal) return;
        barcodeState.mode = mode;
        barcodeState.pendingCode = null;
        dom.barcodeRegisterPanel.classList.add('hidden');
        dom.barcodeLast.textContent = '';
        if (dom.barcodeManualInput) dom.barcodeManualInput.value = '';
        if (dom.barcodeBatchToggle) dom.barcodeBatchToggle.checked = !!barcodeState.batchMode;
        const isKeyboard = mode === 'keyboard';
        dom.barcodeStatus.textContent = isKeyboard
            ? 'USB scanner mode…'
            : (mode === 'register' ? 'Registering barcode…' : 'Scanning…');
        dom.barcodeModal.classList.remove('hidden');
        populateBarcodeSelect();
        if (dom.barcodePreview) dom.barcodePreview.classList.toggle('hidden', isKeyboard);
        if (dom.barcodeKeyboardPanel) dom.barcodeKeyboardPanel.classList.toggle('hidden', !isKeyboard);
        if (isKeyboard) {
            stopQuagga();
            if (dom.barcodeHardwareInput) dom.barcodeHardwareInput.focus();
        } else {
            startQuagga();
        }
    }

    function initCreativity() {
        if (!dom.creativityInterest || !dom.creativityGoal) return;
        dom.creativityInterest.innerHTML = creativityInterests.map(i => `<option value="${i.id}">${i.label}</option>`).join('');
        dom.creativityGoal.innerHTML = creativityGoals.map(g => `<option value="${g.id}">${g.label}</option>`).join('');
        dom.creativityInterest.value = state.creativity.interest || 'figures';
        dom.creativityGoal.value = state.creativity.goal || 'practice';

        dom.creativityInterest.addEventListener('change', () => {
            state.creativity.interest = dom.creativityInterest.value;
            localStorage.setItem('studioCreativity', JSON.stringify(state.creativity));
            scheduleUserSave();
            renderCreativityUI();
        });
        dom.creativityGoal.addEventListener('change', () => {
            state.creativity.goal = dom.creativityGoal.value;
            localStorage.setItem('studioCreativity', JSON.stringify(state.creativity));
            scheduleUserSave();
            renderCreativityUI();
        });
        if (dom.dailyPromptBtn) {
            dom.dailyPromptBtn.addEventListener('click', () => renderDailyPrompt(true));
        }
        if (dom.shuffleCardsBtn) {
            dom.shuffleCardsBtn.addEventListener('click', () => {
                state.creativity.lastShuffle = String(Date.now());
                localStorage.setItem('studioCreativity', JSON.stringify(state.creativity));
                scheduleUserSave();
                renderChallengeCards();
            });
        }
        renderCreativityUI();
    }

    function renderCreativityUI() {
        if (dom.creativityInterest) dom.creativityInterest.value = state.creativity.interest || 'figures';
        if (dom.creativityGoal) dom.creativityGoal.value = state.creativity.goal || 'practice';
        renderDailyPrompt(false);
        renderChallengeCards();
    }

    function renderDailyPrompt(forceNew = false) {
        if (!dom.dailyPromptText) return;
        const interest = state.creativity.interest || 'figures';
        const goal = state.creativity.goal || 'practice';
        const todayKey = new Date().toISOString().slice(0, 10);

        if (!forceNew && state.creativity.dailyKey === todayKey && state.creativity.dailyPrompt) {
            dom.dailyPromptText.textContent = state.creativity.dailyPrompt;
            return;
        }

        const seedKey = forceNew
            ? `${todayKey}-${interest}-${goal}-${Date.now()}`
            : `${todayKey}-${interest}-${goal}`;
        const rand = seededRandom(seedKey);
        const promptList = creativityPrompts[interest] || creativityPrompts.figures;
        const basePrompt = promptList[Math.floor(rand() * promptList.length)] || 'Create something small and joyful.';
        const modifier = creativityGoalModifiers[goal] || '';
        const prompt = `${basePrompt} ${modifier}`.trim();

        state.creativity.dailyKey = todayKey;
        state.creativity.dailyPrompt = prompt;
        localStorage.setItem('studioCreativity', JSON.stringify(state.creativity));
        scheduleUserSave();
        dom.dailyPromptText.textContent = prompt;
    }

    function renderChallengeCards() {
        if (!dom.challengeCards) return;
        const interest = state.creativity.interest || 'figures';
        const goal = state.creativity.goal || 'practice';
        const todayKey = new Date().toISOString().slice(0, 10);
        const seedKey = state.creativity.lastShuffle || `${todayKey}-${interest}-${goal}`;
        const rand = seededRandom(seedKey);

        let filtered = creativityChallenges.filter(card => {
            const tagMatch = card.tags?.includes('all') || card.tags?.includes(interest);
            const goalMatch = !card.goals || card.goals.includes(goal) || card.goals.includes('all');
            return tagMatch && goalMatch;
        });
        if (filtered.length < 6) {
            filtered = creativityChallenges.filter(card => card.tags?.includes('all') || card.tags?.includes(interest));
        }
        const shuffled = [...filtered];
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
            const j = Math.floor(rand() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const chosen = shuffled.slice(0, 6);
        const interestLabel = getCreativityLabel(creativityInterests, interest);
        const goalLabel = getCreativityLabel(creativityGoals, goal);
        dom.challengeCards.innerHTML = chosen.map(card => `
            <div class="creative-card hover-card">
                <div class="text-sm font-semibold text-pink-800">${card.title}</div>
                <div class="text-xs text-gray-700">${card.prompt}</div>
                <div class="flex flex-wrap gap-1 mt-1">
                    <span class="creative-chip">${interestLabel}</span>
                    <span class="creative-chip">${goalLabel}</span>
                </div>
            </div>
        `).join('');
    }

    function applyAccessibility() {
        if (!dom.toggleLargeText || !dom.toggleCbCheck) return;
        state.accessibility.largeText = dom.toggleLargeText.checked;
        state.accessibility.cbCheck = dom.toggleCbCheck.checked;
        document.body.classList.toggle('large-text', state.accessibility.largeText);
        document.body.classList.toggle('cb-check', state.accessibility.cbCheck);
        localStorage.setItem('studioAccessibility', JSON.stringify(state.accessibility));
        renderColorblindWarnings();
    }

    function applyThemeSettings() {
        const theme = themeOptions.find(opt => opt.id === state.ui.theme) || themeOptions[0];
        const root = document.documentElement;
        root.style.setProperty('--accent', theme.accent);
        root.style.setProperty('--accent-strong', theme.strong);
        root.style.setProperty('--accent-soft', theme.soft);
        root.style.setProperty('--accent-border', theme.border);
        document.body.classList.toggle('dark', !!state.ui.darkMode);
        if (dom.toggleNightMode) dom.toggleNightMode.checked = !!state.ui.darkMode;
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) metaTheme.setAttribute('content', theme.accent);
        if (dom.themePicker) {
            dom.themePicker.querySelectorAll('button[data-theme]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === theme.id);
            });
        }
    }

    function updateNetworkStatus() {
        if (!dom.networkStatus) return;
        const online = navigator.onLine;
        dom.networkStatus.textContent = online ? 'Online' : 'Offline mode';
        dom.networkStatus.classList.remove('text-rose-600', 'text-emerald-600');
        dom.networkStatus.classList.add(online ? 'text-emerald-600' : 'text-rose-600');
    }

    function updateSyncStatus(date) {
        if (!dom.syncStatus || !dom.syncLast) return;
        const display = date ? date.toLocaleString() : 'Never';
        dom.syncStatus.textContent = date ? 'Synced' : 'Not synced';
        dom.syncLast.textContent = display;
        if (date) {
            state.lastSyncedAt = date.toISOString();
            localStorage.setItem('studioLastSyncedAt', state.lastSyncedAt);
        }
    }

    function renderProjectList() {
        if (!dom.projectList) return;
        dom.projectList.innerHTML = '';
        if (!state.projects.length) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'No saved projects';
            dom.projectList.appendChild(opt);
            return;
        }
        state.projects.forEach(project => {
            const opt = document.createElement('option');
            opt.value = project.id;
            opt.textContent = project.name;
            dom.projectList.appendChild(opt);
        });
    }

    function getProjectSnapshot(nameOverride) {
        return {
            id: `proj-${Date.now()}`,
            name: nameOverride || state.projectName || 'Untitled Project',
            notes: state.notes || '',
            palette: state.palette || [],
            secondaryPalette: state.secondaryPalette || [],
            favorites: state.favorites || [],
            createdAt: new Date().toISOString()
        };
    }

    function saveProjectSnapshot() {
        const name = dom.projectNameInput?.value?.trim() || state.projectName || 'Untitled Project';
        state.projectName = name;
        const snapshot = getProjectSnapshot(name);
        state.projects = [snapshot, ...state.projects.filter(p => p.name !== name)].slice(0, 50);
        localStorage.setItem('studioProjects', JSON.stringify(state.projects));
        renderProjectList();
        if (dom.projectList) dom.projectList.value = snapshot.id;
        scheduleUserSave();
        if (dom.projectShareCode) dom.projectShareCode.textContent = '';
    }

    function loadSelectedProject() {
        const id = dom.projectList?.value;
        if (!id) return;
        const project = state.projects.find(p => p.id === id);
        if (!project) return;
        state.projectName = project.name;
        state.notes = project.notes || '';
        state.palette = project.palette || [];
        state.secondaryPalette = project.secondaryPalette || [];
        state.favorites = project.favorites || [];
        dom.projectNotes.value = state.notes;
        if (dom.projectNameInput) dom.projectNameInput.value = state.projectName;
        localStorage.setItem('studioNotes', state.notes);
        updatePalettes();
        buildRecipes();
        renderFavorites();
    }

    function deleteSelectedProject() {
        const id = dom.projectList?.value;
        if (!id) return;
        state.projects = state.projects.filter(p => p.id !== id);
        localStorage.setItem('studioProjects', JSON.stringify(state.projects));
        renderProjectList();
        scheduleUserSave();
    }

    function createShareCode() {
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `CLAY-${rand}`;
    }

    async function shareProjectSnapshot() {
        if (!userId) {
            if (dom.projectShareCode) dom.projectShareCode.textContent = 'Sign in to share projects.';
            return;
        }
        const name = dom.projectNameInput?.value?.trim() || state.projectName || 'Untitled Project';
        const snapshot = getProjectSnapshot(name);
        const code = createShareCode();
        await setDoc(doc(db, 'sharedProjects', code), {
            ownerId: userId,
            snapshot,
            createdAt: serverTimestamp()
        });
        if (dom.projectShareCode) dom.projectShareCode.textContent = `Share code: ${code}`;
    }

    async function importSharedProject() {
        const code = dom.projectImportCode?.value?.trim().toUpperCase();
        if (!code) return;
        try {
            const ref = doc(db, 'sharedProjects', code);
            const snap = await getDoc(ref);
            if (!snap.exists()) {
                if (dom.projectImportStatus) dom.projectImportStatus.textContent = 'Share code not found.';
                return;
            }
            const data = snap.data();
            const snapshot = data.snapshot;
            if (!snapshot) return;
            state.projects = [snapshot, ...state.projects.filter(p => p.id !== snapshot.id)].slice(0, 50);
            localStorage.setItem('studioProjects', JSON.stringify(state.projects));
            renderProjectList();
            if (dom.projectImportStatus) dom.projectImportStatus.textContent = `Imported ${snapshot.name}.`;
            scheduleUserSave();
        } catch (err) {
            if (dom.projectImportStatus) dom.projectImportStatus.textContent = 'Import failed.';
        }
    }

    function renderRecipeLibrary() {
        if (!dom.recipeLibrary) return;
        if (!state.recipeLibrary.length) {
            dom.recipeLibrary.innerHTML = '<div class="text-[11px] text-gray-600">No recipes saved yet.</div>';
            return;
        }
        dom.recipeLibrary.innerHTML = state.recipeLibrary.map(recipe => `
            <div class="border border-pink-100 rounded-lg p-2">
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded" style="background:${recipe.hex}"></div>
                    <div class="text-[11px] font-semibold text-pink-800">${recipe.name}</div>
                </div>
                ${recipe.photo ? `<img src="${recipe.photo}" class="w-full h-28 object-cover rounded mt-2" alt="Recipe photo">` : ''}
                <div class="text-[11px] text-gray-600 mt-1">Tags: ${(recipe.tags || []).join(', ') || 'None'}</div>
                <div class="flex gap-2 mt-2">
                    <button data-action="load" data-id="${recipe.id}" class="bg-emerald-500 text-white px-2 py-1 rounded-lg text-[11px] font-semibold">Load</button>
                    <button data-action="share" data-id="${recipe.id}" class="bg-pink-600 text-white px-2 py-1 rounded-lg text-[11px] font-semibold">Copy Link</button>
                    <button data-action="remove" data-id="${recipe.id}" class="bg-white border border-pink-200 text-pink-700 px-2 py-1 rounded-lg text-[11px] font-semibold">Remove</button>
                </div>
            </div>
        `).join('');
    }

    function saveRecipeToLibrary() {
        if (!state.selectedRecipe) return;
        const tags = (dom.recipeTags?.value || '').split(',').map(t => t.trim()).filter(Boolean);
        const baseRecipe = {
            id: `recipe-${Date.now()}`,
            name: state.selectedRecipe.name,
            hex: state.selectedRecipe.hex,
            closest: state.selectedRecipe.closest,
            mixPair: state.selectedRecipe.mixPair,
            tags,
            photo: '',
            createdAt: new Date().toISOString()
        };
        const file = dom.recipePhoto?.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                baseRecipe.photo = e.target.result;
                state.recipeLibrary = [baseRecipe, ...state.recipeLibrary].slice(0, 100);
                localStorage.setItem('studioRecipeLibrary', JSON.stringify(state.recipeLibrary));
                renderRecipeLibrary();
                scheduleUserSave();
            };
            reader.readAsDataURL(file);
        } else {
            state.recipeLibrary = [baseRecipe, ...state.recipeLibrary].slice(0, 100);
            localStorage.setItem('studioRecipeLibrary', JSON.stringify(state.recipeLibrary));
            renderRecipeLibrary();
            scheduleUserSave();
        }
    }

    function encodeRecipe(recipe) {
        return btoa(unescape(encodeURIComponent(JSON.stringify(recipe))));
    }

    function decodeRecipe(encoded) {
        return JSON.parse(decodeURIComponent(escape(atob(encoded))));
    }

    function buildRecipeShareLink(recipe) {
        const encoded = encodeRecipe(recipe);
        return `${location.origin}${location.pathname}#recipe=${encoded}`;
    }

    function importRecipeFromLink() {
        const input = dom.recipeShareInput?.value?.trim();
        if (!input) return;
        const encoded = input.split('#recipe=')[1] || input.split('recipe=')[1];
        if (!encoded) return;
        try {
            const recipe = decodeRecipe(encoded);
            state.recipeLibrary = [recipe, ...state.recipeLibrary].slice(0, 100);
            localStorage.setItem('studioRecipeLibrary', JSON.stringify(state.recipeLibrary));
            renderRecipeLibrary();
            scheduleUserSave();
            if (dom.recipeShareInput) dom.recipeShareInput.value = '';
        } catch (err) {
            showBarcodeMessage('Invalid recipe link.');
        }
    }

    function importRecipeFromHash() {
        if (!location.hash.includes('recipe=')) return;
        const encoded = location.hash.split('recipe=')[1];
        if (!encoded) return;
        try {
            const recipe = decodeRecipe(encoded);
            state.recipeLibrary = [recipe, ...state.recipeLibrary].slice(0, 100);
            localStorage.setItem('studioRecipeLibrary', JSON.stringify(state.recipeLibrary));
            renderRecipeLibrary();
            scheduleUserSave();
        } catch (err) {
            // ignore
        }
    }

    if (dom.recipeLibrary) {
        dom.recipeLibrary.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('button[data-action]');
            if (!actionBtn) return;
            const id = actionBtn.dataset.id;
            const recipe = state.recipeLibrary.find(r => r.id === id);
            if (!recipe) return;
            if (actionBtn.dataset.action === 'remove') {
                state.recipeLibrary = state.recipeLibrary.filter(r => r.id !== id);
                localStorage.setItem('studioRecipeLibrary', JSON.stringify(state.recipeLibrary));
                renderRecipeLibrary();
                scheduleUserSave();
                return;
            }
            if (actionBtn.dataset.action === 'load') {
                state.palette = [recipe.closest?.color ? recipe.closest.color : { hex: recipe.hex, name: recipe.name, rgb: hexToRgb(recipe.hex) }].filter(Boolean);
                updatePalettes();
                buildRecipes();
                return;
            }
            if (actionBtn.dataset.action === 'share') {
                const link = buildRecipeShareLink(recipe);
                if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(link).then(() => {
                        showBarcodeMessage('Recipe link copied.');
                    });
                } else {
                    window.prompt('Copy this recipe link:', link);
                }
            }
        });
    }

    function logInventoryUsage(key, delta, source) {
        const entry = {
            key,
            delta,
            source,
            at: new Date().toISOString()
        };
        state.inventoryHistory = [entry, ...state.inventoryHistory].slice(0, 200);
        localStorage.setItem('studioInventoryHistory', JSON.stringify(state.inventoryHistory));
        renderUsageHistory();
    }

    function renderUsageHistory() {
        if (!dom.usageHistory) return;
        if (!state.inventoryHistory.length) {
            dom.usageHistory.textContent = 'No usage yet.';
            return;
        }
        dom.usageHistory.innerHTML = state.inventoryHistory.slice(0, 8).map(entry => {
            const label = getBarcodeColorLabel(entry.key);
            const sign = entry.delta > 0 ? '+' : '';
            const when = new Date(entry.at).toLocaleDateString();
            return `<div>${when} · ${label} ${sign}${entry.delta}g (${entry.source})</div>`;
        }).join('');
    }

    function populateReorderSelect() {
        if (!dom.reorderColorSelect) return;
        dom.reorderColorSelect.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select a color…';
        placeholder.disabled = true;
        placeholder.selected = true;
        dom.reorderColorSelect.appendChild(placeholder);
        clayColors.forEach(color => {
            const option = document.createElement('option');
            option.value = `${color.brand}-${color.name}`;
            option.textContent = `${color.brand} · ${color.name}${color.discontinued ? ' (Disc.)' : ''}`;
            dom.reorderColorSelect.appendChild(option);
        });
    }

    function addToReorderList(quickGrams) {
        if (!dom.reorderColorSelect) return;
        const key = dom.reorderColorSelect.value;
        const gramsInput = parseInt(dom.reorderGramsInput?.value || '0', 10) || 0;
        const grams = Math.max(1, quickGrams || gramsInput || 0);
        if (!key) {
            if (dom.reorderStatus) dom.reorderStatus.textContent = 'Pick a color first.';
            return;
        }
        const current = parseInt(state.reorderList[key] || 0, 10) || 0;
        state.reorderList[key] = current + grams;
        localStorage.setItem('studioReorderList', JSON.stringify(state.reorderList));
        if (dom.reorderStatus) dom.reorderStatus.textContent = `Added ${grams}g to ${getBarcodeColorLabel(key)}.`;
        renderReorderList();
        scheduleUserSave();
    }

    function clearReorderList() {
        state.reorderList = {};
        localStorage.setItem('studioReorderList', JSON.stringify(state.reorderList));
        if (dom.reorderStatus) dom.reorderStatus.textContent = 'Reorder list cleared.';
        renderReorderList();
        scheduleUserSave();
    }

    function renderReorderList() {
        if (!dom.reorderList) return;
        const entries = Object.entries(state.reorderList || {}).filter(([, grams]) => (grams || 0) > 0);
        if (!entries.length) {
            dom.reorderList.textContent = 'Reorder list is empty (0 items).';
            if (dom.reorderTotal) dom.reorderTotal.textContent = '0g';
            return;
        }
        const lines = entries.map(([key, grams]) => {
            const label = getBarcodeColorLabel(key);
            return `${label}: add ${grams}g`;
        });
        const totalGrams = entries.reduce((sum, [, grams]) => sum + (parseInt(grams, 10) || 0), 0);
        dom.reorderList.innerHTML = lines.map(line => `<div>${line}</div>`).join('');
        if (dom.reorderTotal) dom.reorderTotal.textContent = `${totalGrams}g`;
    }

    function renderColorblindWarnings() {
        if (!dom.cbWarning) return;
        if (!state.accessibility.cbCheck) {
            dom.cbWarning.textContent = '';
            return;
        }
        const colors = [...state.palette, ...state.secondaryPalette].map(c => c.hex).filter(Boolean);
        const warnings = [];
        for (let i = 0; i < colors.length; i += 1) {
            for (let j = i + 1; j < colors.length; j += 1) {
                const dist = colorDistance(hexToRgb(colors[i]), hexToRgb(colors[j]));
                if (dist < 45) {
                    warnings.push(`${colors[i]} ↔ ${colors[j]}`);
                }
            }
        }
        dom.cbWarning.textContent = warnings.length
            ? `Similar colors detected: ${warnings.slice(0, 4).join(', ')}${warnings.length > 4 ? '…' : ''}`
            : 'Palette contrast looks good.';
    }

    function copyReorderList() {
        const entries = Object.entries(state.reorderList || {}).filter(([, grams]) => (grams || 0) > 0);
        const lines = entries.map(([key, grams]) => `${getBarcodeColorLabel(key)}: add ${grams}g`);
        const text = lines.length ? lines.join('\n') : 'Reorder list is empty.';
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showBarcodeMessage('Reorder list copied.');
            });
        } else {
            window.prompt('Copy reorder list:', text);
        }
    }

    function handleManualBarcode() {
        const code = dom.barcodeManualInput?.value?.trim();
        if (!code) return;
        acceptBarcode(code);
        if (dom.barcodeManualInput) dom.barcodeManualInput.value = '';
    }

    function handleBatchToggle() {
        barcodeState.batchMode = !!dom.barcodeBatchToggle?.checked;
        localStorage.setItem('studioBarcodeBatchMode', JSON.stringify(barcodeState.batchMode));
        showBarcodeMessage(barcodeState.batchMode ? 'Batch mode on.' : 'Batch mode off.');
    }

    function exportInventoryCsv() {
        const header = ['key', 'grams', 'packs', 'packSize', 'costPerPack', 'pricePerPack'];
        const rows = clayColors.map(color => {
            const key = `${color.brand}-${color.name}`;
            return [
                key,
                state.inventory[key] || 0,
                state.inventoryPacks[key] || 0,
                state.inventoryPackSizes[key] || 56,
                state.inventoryCosts[key] || 0,
                state.inventoryPrices[key] || 0
            ].join(',');
        });
        downloadCsv('studio-inventory.csv', [header.join(','), ...rows].join('\n'));
    }

    function exportBarcodeCsv() {
        const header = ['code', 'key', 'grams'];
        const rows = Object.entries(barcodeState.mapping || {}).map(([code, mapping]) => {
            return [code, mapping.key || '', mapping.grams || 0].join(',');
        });
        downloadCsv('studio-barcodes.csv', [header.join(','), ...rows].join('\n'));
    }

    function handleInventoryImport(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const rows = parseCsv(e.target.result);
            rows.slice(1).forEach(row => {
                const [key, grams, packs, packSize, costPerPack, pricePerPack] = row;
                if (!key) return;
                state.inventory[key] = parseInt(grams, 10) || 0;
                state.inventoryPacks[key] = parseInt(packs, 10) || 0;
                state.inventoryPackSizes[key] = parseInt(packSize, 10) || 56;
                state.inventoryCosts[key] = parseFloat(costPerPack) || 0;
                state.inventoryPrices[key] = parseFloat(pricePerPack) || 0;
            });
            localStorage.setItem('studioInventory', JSON.stringify(state.inventory));
            localStorage.setItem('studioInventoryPacks', JSON.stringify(state.inventoryPacks));
            localStorage.setItem('studioInventoryPackSizes', JSON.stringify(state.inventoryPackSizes));
            localStorage.setItem('studioInventoryCosts', JSON.stringify(state.inventoryCosts));
            localStorage.setItem('studioInventoryPrices', JSON.stringify(state.inventoryPrices));
            renderInventory();
            scheduleUserSave();
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    function handleBarcodeImport(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const rows = parseCsv(e.target.result);
            rows.slice(1).forEach(row => {
                const [code, key, grams] = row;
                if (!code || !key) return;
                barcodeState.mapping[code] = { key, grams: parseInt(grams, 10) || state.barcodeDefaultGrams || 56 };
            });
            localStorage.setItem('studioBarcodes', JSON.stringify(barcodeState.mapping));
            renderBarcodeRegistry();
            scheduleUserSave();
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    function printBarcodeLabels() {
        const entries = Object.entries(barcodeState.mapping || {});
        if (!entries.length) {
            showBarcodeMessage('No barcodes to print.');
            return;
        }
        const labels = entries.map(([code, mapping]) => ({
            code,
            label: getBarcodeColorLabel(mapping.key),
            grams: mapping.grams || state.barcodeDefaultGrams || 56
        }));
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const doc = printWindow.document;
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html><head>
                <title>Barcode Labels</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 24px; }
                    .label-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
                    .label { border: 1px solid #ccc; padding: 10px; border-radius: 8px; text-align: center; }
                    .label h4 { margin: 6px 0 2px; font-size: 12px; }
                    .label p { margin: 0; font-size: 10px; color: #555; }
                    @media print { body { margin: 0; } }
                <\/style>
            </head><body>
                <div class="label-grid" id="label-grid"><\/div>
            </body></html>
        `);
        doc.close();

        const script = doc.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        script.onload = () => {
            const grid = doc.getElementById('label-grid');
            labels.forEach(item => {
                const wrap = doc.createElement('div');
                wrap.className = 'label';
                const qr = doc.createElement('div');
                wrap.appendChild(qr);
                new printWindow.QRCode(qr, { text: item.code, width: 90, height: 90 });
                const title = doc.createElement('h4');
                title.textContent = item.label;
                wrap.appendChild(title);
                const meta = doc.createElement('p');
                meta.textContent = item.code + ' · ' + item.grams + 'g';
                wrap.appendChild(meta);
                grid.appendChild(wrap);
            });
            printWindow.focus();
            printWindow.print();
        };
        doc.head.appendChild(script);
    }

    function parseCsv(text) {
        return text.split(/\r?\n/).filter(Boolean).map(line => line.split(',').map(val => val.trim()));
    }

    function downloadCsv(filename, content) {
        const blob = new Blob([content], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

    function closeBarcodeScanner() {
        stopQuagga();
        if (dom.barcodeModal) dom.barcodeModal.classList.add('hidden');
        dom.barcodeStatus.textContent = '';
        if (dom.barcodePreview) dom.barcodePreview.classList.remove('hidden');
        if (dom.barcodeKeyboardPanel) dom.barcodeKeyboardPanel.classList.add('hidden');
    }

    function populateBarcodeSelect() {
        if (!dom.barcodeColorSelect) return;
        dom.barcodeColorSelect.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select a color…';
        placeholder.disabled = true;
        placeholder.selected = true;
        dom.barcodeColorSelect.appendChild(placeholder);
        clayColors.forEach(color => {
            const option = document.createElement('option');
            option.value = `${color.brand}-${color.name}`;
            option.textContent = `${color.brand} · ${color.name}${color.discontinued ? ' (Disc.)' : ''}`;
            dom.barcodeColorSelect.appendChild(option);
        });
    }

    function getBarcodeColorLabel(key) {
        const match = clayColors.find(c => `${c.brand}-${c.name}` === key);
        if (match) return `${match.brand} · ${match.name}`;
        const parts = key.split('-');
        if (parts.length >= 2) return `${parts[0]} · ${parts.slice(1).join('-')}`;
        return key;
    }

    function getColorOptionsHtml(selectedKey) {
        const placeholder = `<option value="" ${selectedKey ? '' : 'selected'} disabled>Select a color…</option>`;
        const options = clayColors.map(color => {
            const key = `${color.brand}-${color.name}`;
            const label = `${color.brand} · ${color.name}${color.discontinued ? ' (Disc.)' : ''}`;
            return `<option value="${key}" ${key === selectedKey ? 'selected' : ''}>${label}</option>`;
        }).join('');
        return placeholder + options;
    }

    function renderBarcodeRegistry() {
        if (!dom.barcodeRegistry) return;
        const entries = Object.entries(barcodeState.mapping || {});
        if (dom.barcodeRegistryCount) {
            dom.barcodeRegistryCount.textContent = entries.length ? `${entries.length} saved` : 'No barcodes yet';
        }
        if (!entries.length) {
            dom.barcodeRegistry.innerHTML = '<div class="text-[11px] text-pink-700/80">No registered barcodes yet. Scan and register one to see it here.</div>';
            return;
        }
        dom.barcodeRegistry.innerHTML = entries.map(([code, mapping]) => {
            const selectedKey = mapping?.key || '';
            const grams = mapping?.grams || state.barcodeDefaultGrams || 56;
            return `
                <div class="grid grid-cols-1 md:grid-cols-[1.1fr,2fr,1fr,auto] gap-2 items-center border border-pink-100 rounded-lg p-2" data-barcode="${code}">
                    <div class="font-semibold text-pink-800 text-[11px]">${code}</div>
                    <select class="w-full rounded border border-pink-200 px-2 py-1 text-[11px]">
                        ${getColorOptionsHtml(selectedKey)}
                    </select>
                    <input type="number" min="1" value="${grams}" class="w-full rounded border border-pink-200 px-2 py-1 text-[11px]" />
                    <div class="flex gap-2">
                        <button data-action="save" class="bg-pink-600 text-white px-2 py-1 rounded-lg text-[11px] font-semibold">Save</button>
                        <button data-action="remove" class="bg-white border border-pink-200 text-pink-700 px-2 py-1 rounded-lg text-[11px] font-semibold">Remove</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function showBarcodeMessage(text) {
        if (!dom.barcodeStatus) return;
        dom.barcodeStatus.textContent = text;
        clearTimeout(barcodeState.messageTimer);
        barcodeState.messageTimer = setTimeout(() => {
            dom.barcodeStatus.textContent = '';
        }, 3500);
    }

    function openBarcodeRegisterPanel(code, existingMapping) {
        if (!dom.barcodeRegisterPanel) return;
        barcodeState.pendingCode = code;
        dom.barcodeRegisterPanel.classList.remove('hidden');
        dom.barcodeRegisterPanel.style.display = 'block';
        populateBarcodeSelect();
        if (existingMapping?.key) {
            dom.barcodeColorSelect.value = existingMapping.key;
        }
        const grams = Math.max(1, parseInt(existingMapping?.grams || dom.barcodeDefaultGrams.value || '56', 10) || 56);
        dom.barcodeGramsInput.value = grams;
        showBarcodeMessage(existingMapping ? 'Edit this barcode mapping.' : 'Assign this barcode.');
        dom.barcodeRegisterPanel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function acceptBarcode(code) {
        const now = Date.now();
        if (barcodeState.lastCode === code && now - barcodeState.lastScanAt < 1200) return;
        barcodeState.lastCode = code;
        barcodeState.lastScanAt = now;
        dom.barcodeLast.textContent = `Detected: ${code}`;

        const mapping = barcodeState.mapping[code];
        if (mapping && barcodeState.mode === 'add') {
            addInventoryByKey(mapping.key, mapping.grams);
            showBarcodeMessage(`Scanned ${code} · Added ${mapping.grams}g to ${mapping.key}.`);
            return;
        }

        openBarcodeRegisterPanel(code, mapping);
    }

    function startQuagga() {
        if (!window.Quagga || barcodeState.active) return;
        barcodeState.active = true;
        barcodeState.recentCodes = {};
        Quagga.init({
            locate: true,
            inputStream: {
                type: 'LiveStream',
                target: dom.barcodePreview,
                constraints: { facingMode: 'environment' }
            },
            locator: {
                halfSample: true,
                patchSize: 'medium'
            },
            decoder: {
                readers: ['ean_reader']
            },
            numOfWorkers: navigator.hardwareConcurrency || 4,
            frequency: 8
        }, (err) => {
            if (err) {
                barcodeState.active = false;
                dom.barcodeStatus.textContent = 'Camera unavailable.';
                return;
            }
            Quagga.start();
        });
        Quagga.onDetected(onBarcodeDetected);
    }

    function stopQuagga() {
        if (!window.Quagga || !barcodeState.active) return;
        Quagga.offDetected(onBarcodeDetected);
        Quagga.stop();
        barcodeState.active = false;
    }

    function onBarcodeDetected(result) {
        const code = result?.codeResult?.code;
        if (!code) return;
        const now = Date.now();
        const recent = barcodeState.recentCodes[code] || { count: 0, lastAt: 0 };
        const withinWindow = now - recent.lastAt < 2000;
        recent.count = withinWindow ? recent.count + 1 : 1;
        recent.lastAt = now;
        barcodeState.recentCodes[code] = recent;

        if (recent.count < 2) {
            dom.barcodeLast.textContent = `Detected (confirming): ${code}`;
            barcodeState.pendingConfirm = code;
            clearTimeout(barcodeState.confirmTimer);
            barcodeState.confirmTimer = setTimeout(() => {
                if (barcodeState.pendingConfirm === code) {
                    acceptBarcode(code);
                }
            }, 700);
            return;
        }
        acceptBarcode(code);
    }

    function saveBarcodeMapping() {
        if (!barcodeState.pendingCode) return;
        const key = dom.barcodeColorSelect.value;
        if (!key) {
            showBarcodeMessage('Choose a color before saving.');
            return;
        }
        const grams = Math.max(1, parseInt(dom.barcodeGramsInput.value, 10) || 56);
        barcodeState.mapping[barcodeState.pendingCode] = { key, grams };
        localStorage.setItem('studioBarcodes', JSON.stringify(barcodeState.mapping));
        dom.barcodeRegisterPanel.classList.add('hidden');
        showBarcodeMessage(`Saved ${barcodeState.pendingCode} → ${key}.${barcodeState.batchMode ? ' Scan next.' : ''}`);
        scheduleUserSave();
        renderBarcodeRegistry();
        if (barcodeState.mode === 'register') {
            addInventoryByKey(key, grams);
        }
        barcodeState.pendingCode = null;
    }

    function addInventoryByKey(key, grams) {
        state.inventory[key] = Math.max(0, (state.inventory[key] || 0) + grams);
        localStorage.setItem('studioInventory', JSON.stringify(state.inventory));
        logInventoryUsage(key, Math.abs(grams), 'scan');
        renderInventory();
        scheduleUserSave();
    }

    function resetProject() {
        state.projectName = generateProjectName();
        state.originalImage = null;
        state.palette = [];
        state.secondaryPalette = [];
        state.recipes = [];
        state.selectedRecipe = null;
        state.favorites = [];
        dom.imagePreview.src = '';
        dom.originalImageContainer.classList.add('hidden');
        dom.reimaginedContainer.classList.add('hidden');
        dom.recipesContainer.innerHTML = '<p class="text-pink-700/80 text-center text-sm">Upload an image to generate palettes.</p>';
        dom.recipeDetail.textContent = 'Select a recipe to see details.';
        dom.favoritesContainer.textContent = 'No favorites yet.';
        dom.regenerateBtn.disabled = true;
        if (dom.projectNameInput) dom.projectNameInput.value = state.projectName;
        updatePalettes();
        updateSlabAssets();
        drawSlabCanvas();
    }

    function openImage(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            state.originalImage = e.target.result;
            dom.imagePreview.src = e.target.result;
            dom.originalImageContainer.classList.remove('hidden');
            dom.imagePreview.onload = () => generateAll(dom.imagePreview);
        };
        reader.readAsDataURL(file);
    }

    function generateAll(imgEl) {
        if (!imgEl || !imgEl.src || !imgEl.complete || imgEl.naturalWidth === 0) return;
        const palette = colorThief.getPalette(imgEl, 8);
        state.palette = palette.map(rgb => ({ rgb, hex: rgbToHex(...rgb), name: getCreativeColorName(rgbToHex(...rgb)) }));
        const isBW = dom.bwToggle.checked;
        if (isBW) {
            state.secondaryPalette = [
                { rgb: [255, 255, 255], hex: '#FFFFFF', name: 'White' },
                { rgb: [0, 0, 0], hex: '#000000', name: 'Black' }
            ];
        } else {
            state.secondaryPalette = state.palette.map(c => {
                const compRgb = getComplementaryColor(...c.rgb);
                return { rgb: compRgb, hex: rgbToHex(...compRgb), name: getCreativeColorName(rgbToHex(...compRgb)) };
            });
        }
        generateReimagined(isBW);
        buildRecipes();
        updatePalettes();
        updateSlabAssets();
        dom.regenerateBtn.disabled = false;
    }

    function generateReimagined(isBW) {
        dom.reimaginedContainer.classList.remove('hidden');
        const canvas = dom.reimaginedCanvas;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const img = dom.imagePreview;
        const maxDim = 260;
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > h && w > maxDim) { h *= (maxDim / w); w = maxDim; }
        if (h >= w && h > maxDim) { w *= (maxDim / h); h = maxDim; }
        canvas.width = w; canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (isBW) {
                const avg = (r + g + b) / 3;
                const bwColor = avg > 127 ? 255 : 0;
                data[i] = data[i + 1] = data[i + 2] = bwColor;
            } else {
                let closestIndex = 0, minDistance = Infinity;
                for (let j = 0; j < state.palette.length; j++) {
                    const dist = colorDistance([r, g, b], state.palette[j].rgb);
                    if (dist < minDistance) { minDistance = dist; closestIndex = j; }
                }
                const newColor = state.secondaryPalette[closestIndex].rgb;
                data[i] = newColor[0];
                data[i + 1] = newColor[1];
                data[i + 2] = newColor[2];
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    function updatePalettes() {
        dom.paletteContainerOriginal.innerHTML = '';
        dom.paletteContainerComp.innerHTML = '';
        renderPalette(state.palette, dom.paletteContainerOriginal);
        renderPalette(state.secondaryPalette, dom.paletteContainerComp);
        renderColorblindWarnings();
    }

    function renderPalette(palette, container) {
        if (!palette || palette.length === 0) {
            container.innerHTML = '<p class="text-xs text-pink-700/70">No palette yet.</p>';
            return;
        }
        palette.forEach(color => {
            const wrapper = document.createElement('div');
            wrapper.className = 'text-center';
            const button = document.createElement('button');
            button.className = 'swatch shiny-swatch shadow-md w-full';
            button.style.background = `linear-gradient(135deg, rgba(255,255,255,0.55), ${color.hex}, rgba(0,0,0,0.2))`;
            button.title = `${color.name} - ${color.hex}`;
            button.addEventListener('click', () => setSlabColor(color.hex));
            const label = document.createElement('p');
            label.className = 'text-xs mt-1 font-semibold truncate';
            label.textContent = color.name;
            wrapper.appendChild(button);
            wrapper.appendChild(label);
            container.appendChild(wrapper);
        });
    }

    function buildRecipes() {
        dom.recipesContainer.innerHTML = '';
        const allColors = [...state.palette, ...state.secondaryPalette];
        const uniqueColors = Array.from(new Set(allColors.map(c => c.hex))).map(hex => allColors.find(c => c.hex === hex));
        state.recipes = uniqueColors.map(color => {
            const targetRgb = hexToRgb(color.hex);
            const closest = findClosestColors(targetRgb, 1)[0];
            const mixPair = findClosestColors(targetRgb, 2);
            return {
                id: color.hex,
                name: color.name,
                hex: color.hex,
                closest,
                mixPair
            };
        });

        state.recipes.forEach(recipe => {
            const card = document.createElement('button');
            card.className = 'text-left p-3 border rounded-lg bg-pink-50/60 hover:border-pink-400 transition';
            card.innerHTML = `
                <div class="flex items-center gap-2">
                    <div class="w-10 h-10 rounded border" style="background:${recipe.hex}"></div>
                    <div>
                        <div class="text-sm font-semibold">${recipe.name}</div>
                        <div class="text-xs text-gray-600">${recipe.hex}</div>
                    </div>
                    <span class="ml-auto text-xs text-pink-700">View</span>
                </div>
            `;
            card.addEventListener('click', () => selectRecipe(recipe));
            dom.recipesContainer.appendChild(card);
        });

        if (state.recipes.length === 0) {
            dom.recipesContainer.innerHTML = '<p class="text-pink-700/80 text-center text-sm">Recipes will appear here.</p>';
        }
    }

    function selectRecipe(recipe) {
        state.selectedRecipe = recipe;
        const closest = recipe.closest.color;
        const mixPair = recipe.mixPair;
        let blendText = 'Blend: not available';
        if (mixPair.length > 1) {
            const totalDist = mixPair[0].distance + mixPair[1].distance;
            const ratio1 = Math.round((mixPair[1].distance / totalDist) * 100);
            const ratio2 = 100 - ratio1;
            blendText = `Blend: ${ratio1}% ${mixPair[0].color.name} + ${ratio2}% ${mixPair[1].color.name}`;
        }
        dom.recipeDetail.innerHTML = `
            <div class="text-xs">Target: <strong>${recipe.name}</strong> (${recipe.hex})</div>
            <div class="text-xs mt-1">Match: <strong>${closest.brand} - ${closest.name}</strong></div>
            <div class="text-xs mt-1">${blendText}</div>
            <button id="fav-btn" class="mt-2 bg-pink-600 text-white px-2 py-1 rounded text-xs">Add to Favorites</button>
        `;
        document.getElementById('fav-btn').addEventListener('click', addFavorite);
        dom.reserveBtn.disabled = false;
    }

    function addFavorite() {
        if (!state.selectedRecipe) return;
        if (!state.favorites.find(f => f.id === state.selectedRecipe.id)) {
            state.favorites.push(state.selectedRecipe);
        }
        renderFavorites();
    }

    function renderFavorites() {
        if (state.favorites.length === 0) {
            dom.favoritesContainer.textContent = 'No favorites yet.';
            return;
        }
        dom.favoritesContainer.innerHTML = state.favorites.map(f => `
            <div class="flex items-center gap-2 mb-1">
                <div class="w-4 h-4 rounded" style="background:${f.hex}"></div>
                <span>${f.name}</span>
            </div>
        `).join('');
    }

    function calculateBatch() {
        const grams = parseInt(dom.batchGrams.value, 10);
        if (!state.selectedRecipe || !grams) return;
        const mixPair = state.selectedRecipe.mixPair;
        if (mixPair.length < 2) {
            dom.batchOutput.innerHTML = `Use ${grams}g of ${state.selectedRecipe.closest.color.name}.`;
            return;
        }
        const totalDist = mixPair[0].distance + mixPair[1].distance;
        const ratio1 = Math.round((mixPair[1].distance / totalDist) * 100);
        const ratio2 = 100 - ratio1;
        const grams1 = Math.round((grams * ratio1) / 100);
        const grams2 = grams - grams1;
        dom.batchOutput.innerHTML = `
            <div>${mixPair[0].color.name}: <strong>${grams1}g</strong></div>
            <div>${mixPair[1].color.name}: <strong>${grams2}g</strong></div>
        `;
    }

    function initInventory() {
        const saved = JSON.parse(localStorage.getItem('studioInventory') || '{}');
        state.inventory = saved;
        state.inventoryPacks = JSON.parse(localStorage.getItem('studioInventoryPacks') || '{}');
        state.inventoryPackSizes = JSON.parse(localStorage.getItem('studioInventoryPackSizes') || '{}');
        state.inventoryCosts = JSON.parse(localStorage.getItem('studioInventoryCosts') || '{}');
        state.inventoryPrices = JSON.parse(localStorage.getItem('studioInventoryPrices') || '{}');
        state.inventoryHistory = JSON.parse(localStorage.getItem('studioInventoryHistory') || '[]');
        state.lowStockThreshold = parseInt(localStorage.getItem('studioLowStockThreshold') || '20', 10) || 20;
        state.reorderTarget = parseInt(localStorage.getItem('studioReorderTarget') || '120', 10) || 120;
        if (dom.lowStockThreshold) {
            dom.lowStockThreshold.value = String(state.lowStockThreshold);
            dom.lowStockThreshold.addEventListener('change', () => {
                state.lowStockThreshold = Math.max(1, parseInt(dom.lowStockThreshold.value, 10) || 20);
                dom.lowStockThreshold.value = String(state.lowStockThreshold);
                localStorage.setItem('studioLowStockThreshold', String(state.lowStockThreshold));
                updateInventoryAlerts();
                scheduleUserSave();
            });
        }
        if (dom.reorderTarget) {
            dom.reorderTarget.value = String(state.reorderTarget);
            dom.reorderTarget.addEventListener('change', () => {
                state.reorderTarget = Math.max(1, parseInt(dom.reorderTarget.value, 10) || 120);
                dom.reorderTarget.value = String(state.reorderTarget);
                localStorage.setItem('studioReorderTarget', String(state.reorderTarget));
                renderReorderList();
                scheduleUserSave();
            });
        }
        renderInventory();
        renderBarcodeRegistry();
        renderUsageHistory();
        populateReorderSelect();
        renderReorderList();
    }

    function renderInventory() {
        dom.inventoryContainer.innerHTML = '';
        const colorsToShow = state.inventoryEditMode
            ? clayColors
            : clayColors.filter(c => (state.inventory[`${c.brand}-${c.name}`] || 0) > 0);

        if (!colorsToShow.length) {
            dom.inventoryContainer.innerHTML = '<p class="text-xs text-pink-700/80">No inventory yet. Click Edit to add colors.</p>';
            return;
        }

        colorsToShow.forEach(color => {
            const key = `${color.brand}-${color.name}`;
            const value = state.inventory[key] ?? 60;
            const packs = state.inventoryPacks[key] ?? 0;
            const packSize = state.inventoryPackSizes[key] ?? 56;
            const cost = state.inventoryCosts[key] ?? 0;
            const price = state.inventoryPrices[key] ?? 0;
            const wrapper = document.createElement('div');
            wrapper.className = 'inventory-card';
            wrapper.innerHTML = `
                <div class="inventory-swatch" style="background:linear-gradient(135deg, rgba(255,255,255,0.55), ${color.hex}, rgba(0,0,0,0.2))"></div>
                <div class="text-center text-[11px] leading-tight">
                    <div class="font-semibold">${color.name}</div>
                    <div class="text-[10px] text-gray-500">${color.brand}${color.discontinued ? ' · Disc.' : ''}</div>
                </div>
                <input type="number" min="0" class="w-full text-xs border rounded px-1 py-0.5" value="${value}" data-key="${key}" ${state.inventoryEditMode ? '' : 'disabled'} />
                ${state.inventoryEditMode ? `
                <div class="grid grid-cols-2 gap-1 text-[10px] text-gray-600">
                    <input type="number" min="0" class="w-full text-[11px] border rounded px-1 py-0.5" value="${packs}" data-pack-key="${key}" placeholder="packs" />
                    <input type="number" min="1" class="w-full text-[11px] border rounded px-1 py-0.5" value="${packSize}" data-packsize-key="${key}" placeholder="g/pack" />
                </div>
                <div class="grid grid-cols-2 gap-1 text-[10px] text-gray-600">
                    <input type="number" min="0" step="0.01" class="w-full text-[11px] border rounded px-1 py-0.5" value="${cost}" data-cost-key="${key}" placeholder="cost/pack" />
                    <input type="number" min="0" step="0.01" class="w-full text-[11px] border rounded px-1 py-0.5" value="${price}" data-price-key="${key}" placeholder="price/pack" />
                </div>
                <div class="text-[10px] text-gray-500 text-center">${packs} × ${packSize}g = ${packs * packSize}g</div>
                ` : ''}
            `;
            const input = wrapper.querySelector('input');
            input.addEventListener('change', (e) => {
                const prev = state.inventory[key] || 0;
                const next = parseInt(e.target.value, 10) || 0;
                state.inventory[key] = next;
                const delta = next - prev;
                if (delta !== 0) logInventoryUsage(key, delta, 'manual');
                localStorage.setItem('studioInventory', JSON.stringify(state.inventory));
                updateInventoryAlerts();
                scheduleUserSave();
            });
            if (state.inventoryEditMode) {
                const packInput = wrapper.querySelector(`[data-pack-key="${key}"]`);
                const sizeInput = wrapper.querySelector(`[data-packsize-key="${key}"]`);
                const costInput = wrapper.querySelector(`[data-cost-key="${key}"]`);
                const priceInput = wrapper.querySelector(`[data-price-key="${key}"]`);
                const refreshTotals = () => {
                    const packVal = Math.max(0, parseInt(packInput.value, 10) || 0);
                    const sizeVal = Math.max(1, parseInt(sizeInput.value, 10) || 56);
                    state.inventoryPacks[key] = packVal;
                    state.inventoryPackSizes[key] = sizeVal;
                    const total = packVal * sizeVal;
                    const prevTotal = state.inventory[key] || 0;
                    state.inventory[key] = total;
                    input.value = String(total);
                    wrapper.querySelector('.text-[10px].text-gray-500.text-center').textContent = `${packVal} × ${sizeVal}g = ${total}g`;
                    localStorage.setItem('studioInventoryPacks', JSON.stringify(state.inventoryPacks));
                    localStorage.setItem('studioInventoryPackSizes', JSON.stringify(state.inventoryPackSizes));
                    localStorage.setItem('studioInventory', JSON.stringify(state.inventory));
                    const delta = total - prevTotal;
                    if (delta !== 0) logInventoryUsage(key, delta, 'pack');
                    updateInventoryAlerts();
                    scheduleUserSave();
                };
                packInput.addEventListener('change', refreshTotals);
                sizeInput.addEventListener('change', refreshTotals);
                if (costInput) {
                    costInput.addEventListener('change', () => {
                        state.inventoryCosts[key] = Math.max(0, parseFloat(costInput.value) || 0);
                        localStorage.setItem('studioInventoryCosts', JSON.stringify(state.inventoryCosts));
                        scheduleUserSave();
                    });
                }
                if (priceInput) {
                    priceInput.addEventListener('change', () => {
                        state.inventoryPrices[key] = Math.max(0, parseFloat(priceInput.value) || 0);
                        localStorage.setItem('studioInventoryPrices', JSON.stringify(state.inventoryPrices));
                        scheduleUserSave();
                    });
                }
            }
            dom.inventoryContainer.appendChild(wrapper);
        });
        updateInventoryAlerts();
        renderReorderList();
    }

    function setInventoryEditMode(isEdit) {
        state.inventoryEditMode = isEdit;
        dom.inventoryEditBtn.classList.toggle('hidden', isEdit);
        dom.inventorySaveBtn.classList.toggle('hidden', !isEdit);
        renderInventory();
    }

    function updateInventoryAlerts() {
        dom.inventoryContainer.querySelectorAll('input[data-key]').forEach(input => {
            const val = parseInt(input.value, 10) || 0;
            input.classList.toggle('border-red-400', val < state.lowStockThreshold);
        });
        renderReorderList();
    }

    function reserveFromInventory() {
        if (!state.selectedRecipe) return;
        const grams = parseInt(dom.batchGrams.value, 10);
        if (!grams) return;
        const mixPair = state.selectedRecipe.mixPair;
        const requirements = [];
        if (mixPair.length < 2) {
            requirements.push({ color: mixPair[0]?.color || state.selectedRecipe.closest.color, grams });
        } else {
            const totalDist = mixPair[0].distance + mixPair[1].distance;
            const ratio1 = Math.round((mixPair[1].distance / totalDist) * 100);
            const ratio2 = 100 - ratio1;
            requirements.push({ color: mixPair[0].color, grams: Math.round((grams * ratio1) / 100) });
            requirements.push({ color: mixPair[1].color, grams: Math.round((grams * ratio2) / 100) });
        }
        const shortages = requirements.filter(req => {
            const key = `${req.color.brand}-${req.color.name}`;
            return (state.inventory[key] || 0) < req.grams;
        });
        if (shortages.length) {
            if (dom.mixWarning) {
                dom.mixWarning.textContent = `Insufficient stock: ${shortages.map(s => `${s.color.name} (${state.inventory[`${s.color.brand}-${s.color.name}`] || 0}g available)`).join(', ')}`;
            }
            return;
        }
        if (dom.mixWarning) dom.mixWarning.textContent = '';
        requirements.forEach(req => reserveColor(req.color, req.grams));
        renderInventory();
        scheduleUserSave();
    }

    function reserveColor(color, grams) {
        const key = `${color.brand}-${color.name}`;
        state.inventory[key] = Math.max(0, (state.inventory[key] || 0) - grams);
        localStorage.setItem('studioInventory', JSON.stringify(state.inventory));
        logInventoryUsage(key, -Math.abs(grams), 'recipe');
    }

    function exportSummary() {
        const lines = [];
        lines.push(`Project: ${state.projectName}`);
        lines.push('');
        lines.push('Palette 1:');
        state.palette.forEach(c => lines.push(`${c.name} - ${c.hex}`));
        lines.push('');
        lines.push('Palette 2:');
        state.secondaryPalette.forEach(c => lines.push(`${c.name} - ${c.hex}`));
        lines.push('');
        lines.push('Favorites:');
        state.favorites.forEach(f => lines.push(`${f.name} - ${f.hex}`));
        lines.push('');
        lines.push('Notes:');
        lines.push(dom.projectNotes.value || '');

        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${state.projectName.replace(/\s+/g, '_')}_summary.txt`;
        link.click();
    }

    // Slab cutter
    function updateSlabAssets() {
        const container = document.getElementById('slab-assets-container');
        const swatchContainer = document.getElementById('slab-swatch-container');
        if (!container || !swatchContainer) return;
        container.innerHTML = '';
        swatchContainer.innerHTML = '';
        const assets = [state.originalImage].filter(Boolean);
        if (assets.length === 0) {
            container.innerHTML = '<p class="text-pink-700/80 text-xs col-span-full text-center">Upload an image to add a slab background.</p>';
        } else {
            assets.forEach(src => {
                const item = document.createElement('img');
                item.src = src;
                item.className = 'asset-item w-full aspect-square rounded-lg border-2 border-transparent cursor-pointer object-cover';
                if (src === slabCutterState.background && slabCutterState.backgroundType === 'image') item.classList.add('selected');
                item.onclick = () => setSlabImage(src);
                container.appendChild(item);
            });
        }
        [...state.palette, ...state.secondaryPalette].slice(0, 18).forEach(color => {
            const swatch = document.createElement('button');
            swatch.className = 'w-full h-6 rounded-full border shiny-swatch';
            swatch.style.background = `linear-gradient(135deg, rgba(255,255,255,0.55), ${color.hex}, rgba(0,0,0,0.2))`;
            swatch.title = color.name;
            swatch.onclick = () => setSlabColor(color.hex);
            swatchContainer.appendChild(swatch);
        });
    }

    function setSlabImage(src) {
        slabCutterState.backgroundType = 'image';
        slabCutterState.background = src;
        updateSlabOffscreenCanvas(src);
        document.querySelectorAll('#slab-assets-container .asset-item').forEach(el => el.classList.remove('selected'));
        [...document.querySelectorAll('#slab-assets-container .asset-item')].forEach(el => {
            if (el.src === src) el.classList.add('selected');
        });
    }

    function setSlabColor(hex) {
        slabCutterState.backgroundType = 'color';
        slabCutterState.backgroundColor = hex;
        slabCutterState.background = null;
        drawSlabCanvas();
    }

    function updateSlabOffscreenCanvas(src) {
        if (!slabCutterState.offscreenCanvas) {
            slabCutterState.offscreenCanvas = document.createElement('canvas');
        }
        const mainCanvas = document.getElementById('slab-canvas');
        const offscreen = slabCutterState.offscreenCanvas;
        offscreen.width = mainCanvas.width;
        offscreen.height = mainCanvas.height;
        const offCtx = offscreen.getContext('2d');
        offCtx.setTransform(1, 0, 0, 1, 0, 0);
        offCtx.imageSmoothingEnabled = true;
        offCtx.imageSmoothingQuality = 'high';
        offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
        const img = new Image();
        img.onload = () => {
            offCtx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
            drawSlabCanvas();
        };
        img.src = src;
    }

    function updateSlabCutterUI() {
        updateSlabAssets();
        window.requestAnimationFrame(() => {
            resizeSlabCanvas();
            drawSlabCanvas();
            displayCuts();
        });
    }

    function resizeSlabCanvas() {
        const canvas = document.getElementById('slab-canvas');
        if (!canvas) return;
        const parent = canvas.parentElement;
        const parentStyles = getComputedStyle(parent);
        const padLeft = parseFloat(parentStyles.paddingLeft) || 0;
        const padRight = parseFloat(parentStyles.paddingRight) || 0;
        const width = Math.max(0, parent.clientWidth - padLeft - padRight);
        const computedHeight = parseFloat(getComputedStyle(canvas).height) || 0;
        const height = canvas.clientHeight || computedHeight || 420;
        const dpr = window.devicePixelRatio || 1;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (slabCutterState.backgroundType === 'image' && slabCutterState.background) {
            updateSlabOffscreenCanvas(slabCutterState.background);
        }
    }

    function drawSlabCanvas() {
        const canvas = document.getElementById('slab-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        window.requestAnimationFrame(() => {
            ctx.clearRect(0, 0, width, height);
            if (slabCutterState.backgroundType === 'image' && slabCutterState.offscreenCanvas) {
                ctx.drawImage(slabCutterState.offscreenCanvas, 0, 0, width, height);
            } else {
                ctx.fillStyle = slabCutterState.backgroundColor || '#fdf2f8';
                ctx.fillRect(0, 0, width, height);
            }
            if (slabCutterState.gridEnabled && slabCutterState.gridSize > 0) {
                ctx.strokeStyle = 'rgba(216, 70, 140, 0.25)';
                ctx.lineWidth = 1;
                for (let x = 0; x <= width; x += slabCutterState.gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, height);
                    ctx.stroke();
                }
                for (let y = 0; y <= height; y += slabCutterState.gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                    ctx.stroke();
                }
            }
            if (slabCutterState.cutterPos.x !== null) {
                drawCutterShape(ctx, slabCutterState.cutterPos.x, slabCutterState.cutterPos.y, slabCutterState.cutterSize, slabCutterState.shape, slabCutterState.rotation);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });
    }

    function performCut() {
        const canvas = document.getElementById('slab-canvas');
        if (!canvas || slabCutterState.cutterPos.x === null) return;
        const { x, y } = slabCutterState.cutterPos;
        const size = slabCutterState.cutterSize;
        const cutCanvas = document.createElement('canvas');
        cutCanvas.width = size;
        cutCanvas.height = size;
        const cutCtx = cutCanvas.getContext('2d');
        cutCtx.translate(size / 2, size / 2);
        drawCutterShape(cutCtx, 0, 0, size, slabCutterState.shape, slabCutterState.rotation);
        cutCtx.fillStyle = 'black';
        cutCtx.fill();
        cutCtx.globalCompositeOperation = 'source-in';

        if (slabCutterState.backgroundType === 'image' && slabCutterState.background) {
            const img = new Image();
            img.onload = () => {
                const scaleX = img.width / canvas.clientWidth;
                const scaleY = img.height / canvas.clientHeight;
                const sx = (x - size / 2) * scaleX;
                const sy = (y - size / 2) * scaleY;
                const sWidth = size * scaleX;
                const sHeight = size * scaleY;
                cutCtx.setTransform(1, 0, 0, 1, 0, 0);
                cutCtx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size);
                slabCutterState.cuts.push(cutCanvas.toDataURL('image/png'));
                displayCuts();
            };
            img.src = slabCutterState.background;
        } else {
            cutCtx.setTransform(1, 0, 0, 1, 0, 0);
            cutCtx.fillStyle = slabCutterState.backgroundColor || '#fdf2f8';
            cutCtx.fillRect(0, 0, size, size);
            slabCutterState.cuts.push(cutCanvas.toDataURL('image/png'));
            displayCuts();
        }
    }

    function displayCuts() {
        const gallery = document.getElementById('cuts-gallery');
        const countLabel = document.getElementById('cuts-count');
        gallery.innerHTML = '';
        countLabel.textContent = `${slabCutterState.cuts.length} pieces`;
        if (slabCutterState.cuts.length === 0) {
            gallery.innerHTML = '<p class="text-xs text-pink-700/80 col-span-full text-center">Click on the slab to make cuts.</p>';
            return;
        }
        slabCutterState.cuts.forEach((cutSrc, index) => {
            const img = document.createElement('img');
            img.src = cutSrc;
            img.className = 'w-full h-auto';
            img.alt = `Cut-out piece ${index + 1}`;
            gallery.appendChild(img);
        });
    }

    function downloadContactSheet() {
        if (slabCutterState.cuts.length === 0) return;
        const cols = 4;
        const size = 140;
        const rows = Math.ceil(slabCutterState.cuts.length / cols);
        const sheet = document.createElement('canvas');
        sheet.width = cols * size;
        sheet.height = rows * size;
        const ctx = sheet.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sheet.width, sheet.height);

        let loaded = 0;
        slabCutterState.cuts.forEach((src, i) => {
            const img = new Image();
            img.onload = () => {
                const x = (i % cols) * size;
                const y = Math.floor(i / cols) * size;
                ctx.drawImage(img, x, y, size, size);
                loaded++;
                if (loaded === slabCutterState.cuts.length) {
                    const link = document.createElement('a');
                    link.href = sheet.toDataURL('image/png');
                    link.download = `${state.projectName.replace(/\s+/g, '_')}_cuts.png`;
                    link.click();
                }
            };
            img.src = src;
        });
    }

    function drawCutterShape(ctx, x, y, size, shape, rotation = 0) {
        const r = size / 2;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.beginPath();
        if (shape === 'circle') {
            ctx.arc(0, 0, r, 0, Math.PI * 2);
        } else if (shape === 'square') {
            ctx.rect(-r, -r, size, size);
        } else if (shape === 'teardrop') {
            ctx.moveTo(0, -r);
            ctx.bezierCurveTo(r, -r, r, r, 0, r);
            ctx.bezierCurveTo(-r, r, -r, -r, 0, -r);
        } else if (shape === 'triangle') {
            ctx.moveTo(0, -r);
            ctx.lineTo(r, r);
            ctx.lineTo(-r, r);
        } else if (shape === 'hexagon') {
            for (let i = 0; i < 6; i++) {
                ctx.lineTo(r * Math.cos(i * Math.PI / 3), r * Math.sin(i * Math.PI / 3));
            }
        } else if (shape === 'arch') {
            ctx.arc(0, 0, r, Math.PI, 0);
        } else if (shape === 'star') {
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(r * Math.cos((18 + i * 72) * Math.PI / 180), -r * Math.sin((18 + i * 72) * Math.PI / 180));
                ctx.lineTo((r / 2) * Math.cos((54 + i * 72) * Math.PI / 180), -(r / 2) * Math.sin((54 + i * 72) * Math.PI / 180));
            }
        } else if (shape === 'heart') {
            ctx.moveTo(0, r / 2);
            ctx.bezierCurveTo(0, 0, -r, -r / 2, -r, -r / 2);
            ctx.arc(-r / 2, -r / 2, r / 2, Math.PI, 0, false);
            ctx.arc(r / 2, -r / 2, r / 2, Math.PI, 0, false);
            ctx.bezierCurveTo(r, -r / 2, 0, 0, 0, r / 2);
        }
        ctx.closePath();
        ctx.restore();
    }

    // Timer
    function startTimer(minutes) {
        if (timerInterval) clearInterval(timerInterval);
        let seconds = Math.max(1, minutes) * 60;
        const display = document.getElementById('timer-display');
        display.textContent = formatTime(seconds);
        timerInterval = setInterval(() => {
            seconds -= 1;
            display.textContent = formatTime(seconds);
            if (seconds <= 0) {
                clearInterval(timerInterval);
                display.textContent = 'Done!';
                alert('Bake timer complete.');
            }
        }, 1000);
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    // Helpers
    function generateProjectName() {
        const adjectives = ['Vibrant', 'Earthen', 'Cosmic', 'Golden', 'Mystic', 'Silent', 'Rustic', 'Coastal', 'Verdant'];
        const nouns = ['Canvas', 'Stone', 'Vessel', 'Mosaic', 'Gem', 'Tapestry', 'Jar', 'Pattern', 'Creation'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${adj} ${noun} Journey`;
    }
    function hashString(value) {
        let hash = 2166136261;
        for (let i = 0; i < value.length; i += 1) {
            hash ^= value.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }
    function seededRandom(seed) {
        let a = hashString(seed);
        return function () {
            a += 0x6D2B79F5;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function getCreativityLabel(list, id) {
        const match = list.find(item => item.id === id);
        return match ? match.label : id;
    }
    function getCreativeColorName(hex) {
        const [r, g, b] = hexToRgb(hex);
        const [h, s, l] = rgbToHsl(r, g, b);
        if (s < 0.1) {
            if (l > 0.9) return 'Cloud';
            if (l < 0.1) return 'Abyss';
            if (l < 0.4) return 'Charcoal';
            return 'Silver';
        }
        const hue = h * 360;
        if (hue < 15) return l > 0.6 ? 'Coral' : 'Crimson';
        if (hue < 45) return l > 0.6 ? 'Sunshine' : 'Marigold';
        if (hue < 70) return l > 0.6 ? 'Lemon' : 'Gold';
        if (hue < 150) return l > 0.6 ? 'Lime' : 'Forest';
        if (hue < 190) return l > 0.6 ? 'Cyan' : 'Teal';
        if (hue < 250) return l > 0.6 ? 'Sky' : 'Royal Blue';
        if (hue < 280) return l > 0.6 ? 'Lavender' : 'Violet';
        if (hue < 340) return l > 0.6 ? 'Pink' : 'Magenta';
        return l > 0.6 ? 'Rose' : 'Maroon';
    }
    function rgbToHex(r, g, b) { return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase(); }
    function hexToRgb(hex) { const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return r ? [parseInt(r[1],16), parseInt(r[2],16), parseInt(r[3],16)] : null; }
    function getComplementaryColor(r, g, b) { return [255 - r, 255 - g, 255 - b]; }
    function colorDistance(rgb1, rgb2) { let r = rgb1[0] - rgb2[0], g = rgb1[1] - rgb2[1], b = rgb1[2] - rgb2[2]; return Math.sqrt(r*r + g*g + b*b); }
    function findClosestColors(targetRgb, count) { return clayColors.map(c => ({ color: c, distance: colorDistance(targetRgb, hexToRgb(c.hex)) })).sort((a, b) => a.distance - b.distance).slice(0, count); }
    function rgbToHsl(r, g, b) { r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b); let h, s, l = (max + min) / 2; if (max === min) { h = s = 0; } else { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min); switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; } h /= 6; } return [h, s, l]; }