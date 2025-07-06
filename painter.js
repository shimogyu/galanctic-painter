document.addEventListener('DOMContentLoaded', () => {
    const screens = {
        size: document.getElementById('screen-size'),
        type: document.getElementById('screen-type'),
        design: document.getElementById('screen-design'),
        name: document.getElementById('screen-name'),
        universe: document.getElementById('screen-universe'),
    };

    const paintCanvas = document.getElementById('paint-canvas');
    const paintCtx = paintCanvas.getContext('2d');
    const previewCanvas = document.getElementById('preview-canvas');
    const previewCtx = previewCanvas.getContext('2d');
    const universeCanvas = document.getElementById('universe-canvas');
    const universeCtx = universeCanvas.getContext('2d');

    const colorPalette = document.getElementById('color-palette');
    const ringButton = document.getElementById('btn-ring');
    const doneButton = document.getElementById('btn-done');
    const confirmNameButton = document.getElementById('btn-confirm-name');
    const createNewButton = document.getElementById('btn-create-new');

    let currentPlanet = {};
    let isPainting = false;
    let hasRing = false;
    let paintedPlanetImageData; // To store the planet's appearance without the ring
    let universe = [];

    const colors = [
        '#ff4b4b', '#ff924b', '#ffd94b', '#d6ff4b', '#8bff4b', '#4bff88', '#4bffd9',
        '#4bb2ff', '#4b6aff', '#884bff', '#d94bff', '#ff4bce', '#ff4b92', '#cccccc',
        '#999999', '#666666', '#ffffff', '#a52a2a', '#006400', '#00008b'
    ];

    function switchScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
    }

    // --- Screen 1: Size --- //
    screens.size.addEventListener('click', (e) => {
        if (e.target.matches('.btn')) {
            currentPlanet.size = parseInt(e.target.dataset.size, 10);
            switchScreen('type');
        }
    });

    // --- Screen 2: Type --- //
    screens.type.addEventListener('click', (e) => {
        if (e.target.matches('.btn')) {
            currentPlanet.type = e.target.dataset.type;
            setupDesignScreen();
            switchScreen('design');
        }
    });

    // --- Screen 3: Design --- //
    function setupDesignScreen() {
        const canvasSize = currentPlanet.size * 2 + 100; // Add padding for the ring
        paintCanvas.width = canvasSize;
        paintCanvas.height = canvasSize;
        
        const center = canvasSize / 2;
        paintCtx.fillStyle = '#444';
        paintCtx.beginPath();
        paintCtx.arc(center, center, currentPlanet.size, 0, Math.PI * 2);
        paintCtx.fill();
        
        paintedPlanetImageData = paintCanvas.toDataURL(); // Save initial state
        hasRing = false;
        ringButton.textContent = 'リングを追加';
    }

    colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.addEventListener('click', () => {
            currentPlanet.paintColor = color;
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
        });
        colorPalette.appendChild(swatch);
    });

    function paintOnCanvas(e) {
        if (!isPainting) return;
        const rect = paintCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const center = paintCanvas.width / 2;
        
        // Only paint inside the planet
        const distanceFromCenter = Math.sqrt(Math.pow(x - center, 2) + Math.pow(y - center, 2));
        if (distanceFromCenter > currentPlanet.size) return;

        paintCtx.fillStyle = currentPlanet.paintColor || '#fff';
        paintCtx.beginPath();
        paintCtx.arc(x, y, 5, 0, Math.PI * 2);
        paintCtx.fill();
    }

    paintCanvas.addEventListener('mousedown', (e) => {
        isPainting = true;
        paintOnCanvas(e);
    });
    paintCanvas.addEventListener('mouseup', () => {
        if (isPainting) {
            isPainting = false;
            paintedPlanetImageData = paintCanvas.toDataURL(); // Save the painted state
        }
    });
    paintCanvas.addEventListener('mouseleave', () => {
        if (isPainting) {
            isPainting = false;
            paintedPlanetImageData = paintCanvas.toDataURL();
        }
    });
    paintCanvas.addEventListener('mousemove', paintOnCanvas);

    function drawRing() {
        const center = paintCanvas.width / 2;
        paintCtx.strokeStyle = '#d4cda9';
        paintCtx.lineWidth = currentPlanet.size / 10;
        paintCtx.beginPath();
        paintCtx.ellipse(center, center, currentPlanet.size * 1.5, currentPlanet.size * 0.4, -0.2, 0, Math.PI * 2);
        paintCtx.stroke();
    }

    ringButton.addEventListener('click', () => {
        hasRing = !hasRing;
        ringButton.textContent = hasRing ? 'リングを削除' : 'リングを追加';
        
        const img = new Image();
        img.src = paintedPlanetImageData;
        img.onload = () => {
            paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
            paintCtx.drawImage(img, 0, 0);
            if (hasRing) {
                drawRing();
            }
        };
    });

    doneButton.addEventListener('click', () => {
        currentPlanet.imageData = paintCanvas.toDataURL();
        setupNameScreen();
        switchScreen('name');
    });

    // --- Screen 4: Name --- //
    function setupNameScreen() {
        previewCanvas.width = 200;
        previewCanvas.height = 200;
        const img = new Image();
        img.src = currentPlanet.imageData;
        img.onload = () => {
            previewCtx.clearRect(0, 0, 200, 200);
            previewCtx.drawImage(img, 0, 0, 200, 200);
        };
    }

    confirmNameButton.addEventListener('click', () => {
        const nameInput = document.getElementById('planet-name-input');
        currentPlanet.name = nameInput.value || '無名の星';
        addPlanetToUniverse();
        setupUniverseScreen();
        switchScreen('universe');
    });

    // --- Screen 5: Universe --- //
    function setupUniverseScreen() {
        universeCanvas.width = window.innerWidth;
        universeCanvas.height = window.innerHeight;
        if (!universe.animationFrame) {
            animateUniverse();
        }
    }
    
    function addPlanetToUniverse() {
        const img = new Image();
        img.src = currentPlanet.imageData;
        universe.push({
            img: img,
            name: currentPlanet.name,
            x: universeCanvas.width / 2,
            y: universeCanvas.height,
            dx: (Math.random() - 0.5) * 1,
            dy: -1 - Math.random(), // Move upwards initially
            size: currentPlanet.size * 1.5 // Make it a bit bigger in the universe
        });
    }

    function animateUniverse() {
        universeCtx.clearRect(0, 0, universeCanvas.width, universeCanvas.height);
        // Simple starfield
        universeCtx.fillStyle = 'white';
        for(let i=0; i<200; i++) {
            let x = Math.floor(Math.random() * universeCanvas.width);
            let y = Math.floor(Math.random() * universeCanvas.height);
            let r = Math.random() * 1.5;
            universeCtx.beginPath();
            universeCtx.arc(x, y, r, 0, Math.PI*2);
            universeCtx.fill();
        }

        universe.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;

            // Screen Wrap (Looping)
            if (p.x - p.size > universeCanvas.width) p.x = -p.size;
            if (p.x + p.size < 0) p.x = universeCanvas.width + p.size;
            if (p.y - p.size > universeCanvas.height) p.y = -p.size;
            if (p.y + p.size < 0) p.y = universeCanvas.height + p.size;
            
            universeCtx.drawImage(p.img, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
            universeCtx.font = '14px sans-serif';
            universeCtx.textAlign = 'center';
            universeCtx.fillStyle = '#fff';
            universeCtx.fillText(p.name, p.x, p.y + p.size + 15);
        });

        universe.animationFrame = requestAnimationFrame(animateUniverse);
    }

    createNewButton.addEventListener('click', () => {
        currentPlanet = {};
        switchScreen('size');
    });

    // Initial setup
    switchScreen('size');
});