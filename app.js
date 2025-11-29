/**
 * World Mood - Global Emotion Pulse
 * Main application script
 * 
 * This file handles:
 * - Three.js 3D globe rendering
 * - User mood interactions
 * - Real-time mood visualization
 * - Simulated global mood data
 * 
 * Dependencies:
 * - Three.js r128
 * 
 * Author: [Your Name]
 * Created: November 2024
 */

'use strict';

// ============================================
// Global Variables
// ============================================

let scene, camera, renderer, globe, particleGroup;
let allMoods = [];
let moodParticles = [];
let isDragging = false;
let prevMousePos = { x: 0, y: 0 };

// Configuration
const CONFIG = {
    globeRadius: 1,
    particleSize: 0.025,
    maxParticles: 100,
    autoRotateSpeed: 0.0008,
    simulationInterval: 3500, // ms between simulated moods
    initialMoodCount: 8
};

// Mood definitions with colors (hex values for Three.js)
const MOOD_DATA = {
    happy: { 
        label: 'Happy', 
        color: 0xFFD93D,
        cssColor: '#FFD93D'
    },
    love: { 
        label: 'Love', 
        color: 0xFF6B6B,
        cssColor: '#FF6B6B'
    },
    sad: { 
        label: 'Sad', 
        color: 0x4ECDC4,
        cssColor: '#4ECDC4'
    },
    angry: { 
        label: 'Angry', 
        color: 0xFF8C42,
        cssColor: '#FF8C42'
    },
    anxious: { 
        label: 'Anxious', 
        color: 0xA855F7,
        cssColor: '#A855F7'
    },
    peaceful: { 
        label: 'Peaceful', 
        color: 0x22C55E,
        cssColor: '#22C55E'
    },
    excited: { 
        label: 'Excited', 
        color: 0xF97316,
        cssColor: '#F97316'
    },
    tired: { 
        label: 'Tired', 
        color: 0x6B7280,
        cssColor: '#6B7280'
    }
};

// Major cities for mood placement
// Format: { name, lat, lng }
const WORLD_LOCATIONS = [
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'Paris', lat: 48.8566, lng: 2.3522 },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Sao Paulo', lat: -23.5505, lng: -46.6333 },
    { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
    { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
    { name: 'Moscow', lat: 55.7558, lng: 37.6173 },
    { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
    { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
    { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
    { name: 'Seoul', lat: 37.5665, lng: 126.9780 },
    { name: 'Lagos', lat: 6.5244, lng: 3.3792 },
    { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
    { name: 'Bangkok', lat: 13.7563, lng: 100.5018 },
    { name: 'Istanbul', lat: 41.0082, lng: 28.9784 },
    { name: 'Mexico City', lat: 19.4326, lng: -99.1332 }
];


// ============================================
// Initialization
// ============================================

/**
 * Initialize the Three.js scene and all components
 */
function initScene() {
    const container = document.getElementById('globe-container');
    
    if (!container) {
        console.error('Globe container not found!');
        return;
    }

    // Create scene
    scene = new THREE.Scene();
    
    // Setup camera
    const aspectRatio = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 1000);
    camera.position.z = 2.8;

    // Setup renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
    container.appendChild(renderer.domElement);

    // Build scene elements
    createGlobe();
    createStarfield();
    setupLighting();
    
    // Setup interactions
    setupMouseControls(container);
    setupTouchControls(container);
    setupResizeHandler(container);

    // Start render loop
    animate();
    
    // Hide loading screen after a short delay
    setTimeout(function() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }
    }, 1200);
}

/**
 * Create the main globe mesh
 */
function createGlobe() {
    // Main sphere
    const sphereGeom = new THREE.SphereGeometry(CONFIG.globeRadius, 64, 64);
    const sphereMat = new THREE.MeshPhongMaterial({
        color: 0x1a1a3a,
        transparent: true,
        opacity: 0.92,
        shininess: 15
    });
    
    globe = new THREE.Mesh(sphereGeom, sphereMat);
    scene.add(globe);

    // Wireframe overlay for that techy look
    const wireGeom = new THREE.SphereGeometry(CONFIG.globeRadius + 0.008, 36, 36);
    const wireMat = new THREE.MeshBasicMaterial({
        color: 0x4ECDC4,
        wireframe: true,
        transparent: true,
        opacity: 0.12
    });
    const wireOverlay = new THREE.Mesh(wireGeom, wireMat);
    globe.add(wireOverlay);

    // Outer glow effect
    const glowGeom = new THREE.SphereGeometry(CONFIG.globeRadius + 0.08, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0x4ECDC4,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeom, glowMat);
    globe.add(glowMesh);
    
    // Group for mood particles (attached to globe so they rotate with it)
    particleGroup = new THREE.Group();
    globe.add(particleGroup);
}

/**
 * Create background starfield
 */
function createStarfield() {
    const starCount = 1500;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        // Random positions in a sphere around the scene
        positions[i3] = (Math.random() - 0.5) * 80;
        positions[i3 + 1] = (Math.random() - 0.5) * 80;
        positions[i3 + 2] = (Math.random() - 0.5) * 80;
    }

    const starsGeom = new THREE.BufferGeometry();
    starsGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starsMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.015,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true
    });
    
    const starfield = new THREE.Points(starsGeom, starsMat);
    scene.add(starfield);
}

/**
 * Setup scene lighting
 */
function setupLighting() {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 3, 5);
    scene.add(mainLight);
    
    // Subtle fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0x4ECDC4, 0.2);
    fillLight.position.set(-5, -2, -5);
    scene.add(fillLight);
}


// ============================================
// Controls & Event Handlers
// ============================================

/**
 * Setup mouse drag controls for globe rotation
 */
function setupMouseControls(container) {
    container.addEventListener('mousedown', function(e) {
        isDragging = true;
        prevMousePos.x = e.clientX;
        prevMousePos.y = e.clientY;
    });
    
    container.addEventListener('mouseup', function() {
        isDragging = false;
    });
    
    container.addEventListener('mouseleave', function() {
        isDragging = false;
    });
    
    container.addEventListener('mousemove', function(e) {
        if (!isDragging || !globe) return;
        
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;
        
        // Rotate globe based on mouse movement
        globe.rotation.y += deltaX * 0.005;
        globe.rotation.x += deltaY * 0.003;
        
        // Clamp vertical rotation to prevent flipping
        globe.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globe.rotation.x));
        
        prevMousePos.x = e.clientX;
        prevMousePos.y = e.clientY;
    });
}

/**
 * Setup touch controls for mobile devices
 */
function setupTouchControls(container) {
    container.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
            isDragging = true;
            prevMousePos.x = e.touches[0].clientX;
            prevMousePos.y = e.touches[0].clientY;
        }
    }, { passive: true });
    
    container.addEventListener('touchend', function() {
        isDragging = false;
    });
    
    container.addEventListener('touchmove', function(e) {
        if (!isDragging || !globe || e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - prevMousePos.x;
        const deltaY = touch.clientY - prevMousePos.y;
        
        globe.rotation.y += deltaX * 0.005;
        globe.rotation.x += deltaY * 0.003;
        globe.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globe.rotation.x));
        
        prevMousePos.x = touch.clientX;
        prevMousePos.y = touch.clientY;
    }, { passive: true });
}

/**
 * Handle window resize
 */
function setupResizeHandler(container) {
    window.addEventListener('resize', function() {
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
}

// ============================================
// Coordinate Conversion
// ============================================

/**
 * Convert latitude/longitude to 3D position on sphere
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees  
 * @param {number} radius - Sphere radius
 * @returns {THREE.Vector3} 3D position
 */
function latLngToPosition(lat, lng, radius) {
    // Convert to radians
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    // Spherical to Cartesian conversion
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(x, y, z);
}

// ============================================
// Mood Visualization
// ============================================

/**
 * Add a mood particle to the globe at specified location
 * @param {string} moodType - Type of mood (e.g., 'happy', 'sad')
 * @param {Object} location - Location object with name, lat, lng
 */
function addMoodParticle(moodType, location) {
    if (!MOOD_DATA[moodType]) {
        console.warn('Unknown mood type:', moodType);
        return;
    }
    
    const moodInfo = MOOD_DATA[moodType];
    const position = latLngToPosition(location.lat, location.lng, CONFIG.globeRadius + 0.02);
    
    // Create the mood particle
    const particleGeom = new THREE.SphereGeometry(CONFIG.particleSize, 12, 12);
    const particleMat = new THREE.MeshBasicMaterial({
        color: moodInfo.color,
        transparent: true,
        opacity: 0.9
    });
    
    const particle = new THREE.Mesh(particleGeom, particleMat);
    particle.position.copy(position);
    particle.userData = {
        createdAt: Date.now(),
        moodType: moodType,
        isParticle: true
    };
    
    particleGroup.add(particle);
    moodParticles.push(particle);
    
    // Create expanding ring effect
    createPulseRing(position, moodInfo.color);
    
    // Cleanup old particles if we have too many
    cleanupOldParticles();
}

/**
 * Create a pulse ring effect at position
 */
function createPulseRing(position, color) {
    const ringGeom = new THREE.RingGeometry(0.015, 0.025, 24);
    const ringMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.copy(position);
    
    // Orient ring to face outward from globe center
    ring.lookAt(0, 0, 0);
    
    ring.userData = {
        createdAt: Date.now(),
        isRing: true
    };
    
    particleGroup.add(ring);
    moodParticles.push(ring);
}

/**
 * Remove old particles to maintain performance
 */
function cleanupOldParticles() {
    while (moodParticles.length > CONFIG.maxParticles) {
        const oldParticle = moodParticles.shift();
        particleGroup.remove(oldParticle);
        
        // Dispose of geometry and material to free memory
        if (oldParticle.geometry) oldParticle.geometry.dispose();
        if (oldParticle.material) oldParticle.material.dispose();
    }
}


// ============================================
// Animation Loop
// ============================================

/**
 * Main animation/render loop
 */
function animate() {
    requestAnimationFrame(animate);
    
    // Auto-rotate globe slowly when not being dragged
    if (globe && !isDragging) {
        globe.rotation.y += CONFIG.autoRotateSpeed;
    }
    
    // Animate mood particles
    updateParticleAnimations();
    
    // Render the scene
    renderer.render(scene, camera);
}

/**
 * Update particle animations (pulse effect, ring expansion)
 */
function updateParticleAnimations() {
    const currentTime = Date.now();
    
    for (let i = 0; i < moodParticles.length; i++) {
        const particle = moodParticles[i];
        const age = currentTime - particle.userData.createdAt;
        
        if (particle.userData.isRing) {
            // Expand and fade out rings
            const scale = 1 + (age / 800) * 1.5;
            particle.scale.set(scale, scale, scale);
            particle.material.opacity = Math.max(0, 0.7 - (age / 1500));
        } else if (particle.userData.isParticle) {
            // Gentle pulse effect for particles
            const pulseScale = 1 + Math.sin(age / 250) * 0.15;
            particle.scale.set(pulseScale, pulseScale, pulseScale);
        }
    }
}

// ============================================
// UI Updates
// ============================================

/**
 * Add mood entry to the live feed
 */
function addToLiveFeed(moodType, location) {
    const feed = document.getElementById('mood-feed');
    if (!feed) return;
    
    const moodInfo = MOOD_DATA[moodType];
    
    const item = document.createElement('div');
    item.className = 'mood-item';
    item.innerHTML = 
        '<span class="mood-dot" style="background-color: ' + moodInfo.cssColor + '"></span>' +
        '<span class="mood-text">' + moodInfo.label + '</span>' +
        '<span class="location">from ' + location.name + '</span>';
    
    // Add to beginning of feed
    feed.insertBefore(item, feed.firstChild);
    
    // Keep feed size manageable
    while (feed.children.length > 25) {
        feed.removeChild(feed.lastChild);
    }
}

/**
 * Update statistics display
 */
function updateStatistics() {
    // Update total count
    const totalEl = document.getElementById('total-moods');
    if (totalEl) {
        totalEl.textContent = allMoods.length;
    }
    
    // Calculate most common mood
    const moodCounts = {};
    for (let i = 0; i < allMoods.length; i++) {
        const mood = allMoods[i].moodType;
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    }
    
    // Find the top mood
    let topMood = 'happy';
    let topCount = 0;
    
    for (const mood in moodCounts) {
        if (moodCounts[mood] > topCount) {
            topMood = mood;
            topCount = moodCounts[mood];
        }
    }
    
    const topMoodEl = document.getElementById('top-mood');
    if (topMoodEl && MOOD_DATA[topMood]) {
        topMoodEl.textContent = MOOD_DATA[topMood].label;
    }
}

// ============================================
// User Interaction Handlers
// ============================================

/**
 * Handle mood button click
 */
function handleMoodSelection(moodType) {
    // Try to get user's real location, fall back to random
    getUserLocation().then(function(location) {
        const moodData = {
            moodType: moodType,
            location: location,
            timestamp: Date.now()
        };
        
        // Record locally
        allMoods.push(moodData);
        
        // Update visualizations
        addMoodParticle(moodType, location);
        addToLiveFeed(moodType, location);
        updateStatistics();
        
        // Save to Firebase (if configured)
        if (typeof saveMoodToFirebase === 'function') {
            saveMoodToFirebase(moodData);
        }
    });
}

/**
 * Setup mood button event listeners
 */
function setupMoodButtons() {
    const buttons = document.querySelectorAll('.mood-btn');
    
    buttons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const moodType = this.getAttribute('data-mood');
            
            // Visual feedback - highlight selected button
            buttons.forEach(function(b) { 
                b.classList.remove('selected'); 
            });
            this.classList.add('selected');
            
            // Process the mood selection
            handleMoodSelection(moodType);
            
            // Remove selection highlight after a moment
            const self = this;
            setTimeout(function() {
                self.classList.remove('selected');
            }, 1500);
        });
    });
}


// ============================================
// Simulation (Demo Mode)
// ============================================

/**
 * Simulate global mood activity for demo purposes
 * In production, this would be replaced with real-time data from a backend
 */
function startMoodSimulation() {
    const moodTypes = Object.keys(MOOD_DATA);
    
    // Add simulated moods at regular intervals
    setInterval(function() {
        // Pick random mood and location
        const randomMoodIndex = Math.floor(Math.random() * moodTypes.length);
        const randomLocationIndex = Math.floor(Math.random() * WORLD_LOCATIONS.length);
        
        const moodType = moodTypes[randomMoodIndex];
        const location = WORLD_LOCATIONS[randomLocationIndex];
        
        // Record and visualize
        allMoods.push({
            moodType: moodType,
            location: location,
            timestamp: Date.now()
        });
        
        addMoodParticle(moodType, location);
        addToLiveFeed(moodType, location);
        updateStatistics();
        
    }, CONFIG.simulationInterval);
}

/**
 * Add initial moods to populate the globe on load
 */
function addInitialMoods() {
    const moodTypes = Object.keys(MOOD_DATA);
    
    for (let i = 0; i < CONFIG.initialMoodCount; i++) {
        const randomMoodIndex = Math.floor(Math.random() * moodTypes.length);
        const randomLocationIndex = Math.floor(Math.random() * WORLD_LOCATIONS.length);
        
        const moodType = moodTypes[randomMoodIndex];
        const location = WORLD_LOCATIONS[randomLocationIndex];
        
        allMoods.push({
            moodType: moodType,
            location: location,
            timestamp: Date.now() - (i * 1000) // Stagger timestamps
        });
        
        addMoodParticle(moodType, location);
    }
    
    updateStatistics();
}

// ============================================
// Application Entry Point
// ============================================

/**
 * Main initialization - runs when DOM is ready
 */
function initApp() {
    console.log('World Mood - Initializing...');
    
    // Initialize Three.js scene
    initScene();
    
    // Setup UI interactions
    setupMoodButtons();
    
    // Try to initialize Firebase
    let useFirebase = false;
    if (typeof initFirebase === 'function') {
        useFirebase = initFirebase();
    }
    
    // Populate with initial data after scene is ready
    setTimeout(function() {
        if (useFirebase && typeof listenForMoods === 'function') {
            // Listen for real-time moods from other users
            listenForMoods(function(moodData) {
                // Avoid duplicates - check if we already have this mood
                const isDuplicate = allMoods.some(function(m) {
                    return m.timestamp === moodData.timestamp && 
                           m.moodType === moodData.moodType;
                });
                
                if (!isDuplicate) {
                    allMoods.push(moodData);
                    addMoodParticle(moodData.moodType, moodData.location);
                    addToLiveFeed(moodData.moodType, moodData.location);
                    updateStatistics();
                }
            });
            console.log('World Mood - Connected to global network');
        } else {
            // Fall back to simulation mode
            addInitialMoods();
            setTimeout(function() {
                startMoodSimulation();
                console.log('World Mood - Demo mode (simulation)');
            }, 1000);
        }
    }, 1500);
}

// Wait for DOM to be ready, then initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM already loaded
    initApp();
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get user's approximate location using browser geolocation
 * Note: Requires HTTPS in production
 * TODO: Implement this for real user locations
 */
function getUserLocation() {
    return new Promise(function(resolve, reject) {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    name: 'Your Location'
                });
            },
            function(error) {
                // Fall back to random location
                console.warn('Geolocation failed:', error.message);
                const fallbackIndex = Math.floor(Math.random() * WORLD_LOCATIONS.length);
                resolve(WORLD_LOCATIONS[fallbackIndex]);
            },
            {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 300000 // Cache for 5 minutes
            }
        );
    });
}

// ============================================
// Anonymous Messages Feature
// ============================================

/**
 * Setup message sending functionality
 */
function setupMessageFeature() {
    const input = document.getElementById('mood-message');
    const sendBtn = document.getElementById('send-message-btn');
    
    if (!input || !sendBtn) return;
    
    function sendMessage() {
        const text = input.value.trim();
        if (!text) return;
        
        // Get location for the message
        getUserLocation().then(function(location) {
            const messageData = {
                text: text,
                location: location,
                timestamp: Date.now()
            };
            
            // Display locally
            displayMessage(messageData);
            
            // Save to Firebase if available
            if (firebaseInitialized && database) {
                database.ref('messages').push(messageData);
            }
            
            // Clear input
            input.value = '';
        });
    }
    
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Listen for messages from others
    if (firebaseInitialized && database) {
        const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
        database.ref('messages')
            .orderByChild('timestamp')
            .startAt(tenMinutesAgo)
            .on('child_added', function(snapshot) {
                const data = snapshot.val();
                if (data) {
                    displayMessage(data);
                }
            });
    }
}

/**
 * Display a message in the feed
 */
function displayMessage(messageData) {
    const container = document.getElementById('world-messages');
    if (!container) return;
    
    const msgEl = document.createElement('div');
    msgEl.className = 'world-message';
    
    const timeAgo = getTimeAgo(messageData.timestamp);
    const locationName = messageData.location ? messageData.location.name : 'Unknown';
    
    msgEl.innerHTML = 
        '<div class="msg-text">' + escapeHtml(messageData.text) + '</div>' +
        '<div class="msg-meta">' +
            '<span>' + locationName + '</span>' +
            '<span>' + timeAgo + '</span>' +
        '</div>';
    
    container.insertBefore(msgEl, container.firstChild);
    
    // Keep feed manageable
    while (container.children.length > 15) {
        container.removeChild(container.lastChild);
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Get human-readable time ago string
 */
function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
}

// ============================================
// Time Travel Feature
// ============================================

let currentTimeOffset = 0; // 0 = live, positive = hours ago
let isTimeTraveling = false;

/**
 * Setup time travel controls
 */
function setupTimeTravelFeature() {
    const buttons = document.querySelectorAll('.time-btn');
    
    buttons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const hours = parseInt(this.getAttribute('data-hours'));
            
            // Update active state
            buttons.forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            
            // Update time indicator
            const indicator = document.getElementById('viewing-time');
            if (hours === 0) {
                indicator.textContent = 'Viewing: Live';
                isTimeTraveling = false;
            } else if (hours === 24) {
                indicator.textContent = 'Viewing: Yesterday';
                isTimeTraveling = true;
            } else {
                indicator.textContent = 'Viewing: ' + hours + ' hour' + (hours > 1 ? 's' : '') + ' ago';
                isTimeTraveling = true;
            }
            
            currentTimeOffset = hours;
            
            // Reload moods for this time period
            loadMoodsForTimePeriod(hours);
        });
    });
}

/**
 * Load moods for a specific time period
 */
function loadMoodsForTimePeriod(hoursAgo) {
    // Clear current particles
    clearAllParticles();
    allMoods = [];
    
    // Clear feed
    const feed = document.getElementById('mood-feed');
    if (feed) feed.innerHTML = '';
    
    if (hoursAgo === 0) {
        // Return to live mode
        if (firebaseInitialized) {
            // Re-setup live listener
            // For demo, just add some initial moods
        }
        addInitialMoods();
        return;
    }
    
    // For demo mode, generate historical data
    // In production, this would query Firebase with time filters
    generateHistoricalMoods(hoursAgo);
}

/**
 * Generate simulated historical moods for demo
 */
function generateHistoricalMoods(hoursAgo) {
    const moodTypes = Object.keys(MOOD_DATA);
    const moodCount = 15 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < moodCount; i++) {
        const randomMoodIndex = Math.floor(Math.random() * moodTypes.length);
        const randomLocationIndex = Math.floor(Math.random() * WORLD_LOCATIONS.length);
        
        const moodType = moodTypes[randomMoodIndex];
        const location = WORLD_LOCATIONS[randomLocationIndex];
        
        // Stagger the timestamps within the hour
        const timestamp = Date.now() - (hoursAgo * 60 * 60 * 1000) + (i * 60000);
        
        allMoods.push({
            moodType: moodType,
            location: location,
            timestamp: timestamp
        });
        
        addMoodParticle(moodType, location);
        addToLiveFeed(moodType, location);
    }
    
    updateStatistics();
}

/**
 * Clear all mood particles from the globe
 */
function clearAllParticles() {
    for (let i = moodParticles.length - 1; i >= 0; i--) {
        const particle = moodParticles[i];
        particleGroup.remove(particle);
        if (particle.geometry) particle.geometry.dispose();
        if (particle.material) particle.material.dispose();
    }
    moodParticles = [];
}

// Update initApp to include new features
const originalInitApp = initApp;
initApp = function() {
    originalInitApp();
    
    // Setup additional features after a delay
    setTimeout(function() {
        setupMessageFeature();
        setupTimeTravelFeature();
    }, 2000);
};

// Export for potential module usage
// (commented out for simple script tag usage)
// export { initApp, handleMoodSelection, MOOD_DATA };
