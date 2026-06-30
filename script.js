// --- GAME STATE ---
let currentScreen = 'welcome';
let musicEnabled = true;
let soundEnabled = true;
let spanishVoice = null;

// Background music synthesizer variables
let audioCtx = null;
let musicInterval = null;
let currentNoteIndex = 0;

// Game phases progress
let activeStepIndex = 1;
const completedSteps = new Set();

// Speech Synthesis Queue helper
function speak(text) {
    if (!soundEnabled) return;
    window.speechSynthesis.cancel(); // stop any ongoing speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    if (spanishVoice) {
        utterance.voice = spanishVoice;
    }
    
    // Adjust pitch and rate to sound kid-friendly
    utterance.pitch = 1.2;
    utterance.rate = 0.95;
    
    window.speechSynthesis.speak(utterance);
}

// Initialize Speech Voices
function initVoices() {
    const voices = window.speechSynthesis.getVoices();
    // Try to find a Spanish voice, prioritizing Mexico/Spain
    spanishVoice = voices.find(v => v.lang === 'es-MX') || 
                   voices.find(v => v.lang === 'es-ES') || 
                   voices.find(v => v.lang.startsWith('es'));
}

window.speechSynthesis.onvoiceschanged = initVoices;
initVoices();

// --- WEB AUDIO EFFECTS SYNTHESIZER ---
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Sound effects generator
function playSound(type) {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        
        if (type === 'hop') {
            // Cute springy hop sound
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(650, now + 0.15);
            
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            
            osc.start(now);
            osc.stop(now + 0.15);
        } 
        else if (type === 'success') {
            // Rising chime melody (C5, E5, G5, C6)
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                
                gain.gain.setValueAtTime(0.1, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.25);
                
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.25);
            });
        } 
        else if (type === 'error') {
            // Low error buzzer
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(130, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.25);
            
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            
            osc.start(now);
            osc.stop(now + 0.25);
        } 
        else if (type === 'star') {
            // Magical twinkle chime
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(1760, now + 0.2);
            
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.3);
            
            osc.start(now);
            osc.stop(now + 0.3);
        }
        else if (type === 'victory') {
            // Big final happy chime sequence
            const freqs = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50];
            freqs.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.1);
                
                gain.gain.setValueAtTime(0.08, now + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.1 + 0.4);
                
                osc.start(now + idx * 0.1);
                osc.stop(now + idx * 0.1 + 0.4);
            });
        }
    } catch (e) {
        console.error("Audio synthesis failed:", e);
    }
}

// Play background music (Simple happy melody synthesizer loop)
function startBackgroundMusic() {
    if (musicInterval) clearInterval(musicInterval);
    if (!musicEnabled) return;
    
    // Notes of a very simple, happy nursery melody (C4, D4, E4, F4, G4, A4...)
    const melody = [
        261.63, 293.66, 329.63, 261.63, // Dormir o jugar (C, D, E, C)
        261.63, 293.66, 329.63, 261.63,
        329.63, 349.23, 392.00,          // E, F, G
        329.63, 349.23, 392.00,
        392.00, 440.00, 392.00, 349.23, 329.63, 261.63, // G, A, G, F, E, C
        392.00, 440.00, 392.00, 349.23, 329.63, 261.63,
        261.63, 196.00, 261.63,
        261.63, 196.00, 261.63
    ];
    const duration = 0.4; // seconds per note
    
    musicInterval = setInterval(() => {
        if (!musicEnabled) return;
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(melody[currentNoteIndex], now);
            
            // Very soft background level
            gain.gain.setValueAtTime(0.015, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration - 0.05);
            
            osc.start(now);
            osc.stop(now + duration);
            
            currentNoteIndex = (currentNoteIndex + 1) % melody.length;
        } catch(e) {
            console.error("Music synthesis failed:", e);
        }
    }, duration * 1000);
}

function stopBackgroundMusic() {
    if (musicInterval) {
        clearInterval(musicInterval);
        musicInterval = null;
    }
}

// --- CONFETTI PARTICLE SYSTEM ---
const canvas = document.getElementById('celebration-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let confettiActive = false;

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class ConfettiParticle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * -100 - 20;
        this.size = Math.random() * 8 + 6;
        this.speedX = Math.random() * 4 - 2;
        this.speedY = Math.random() * 3 + 4;
        this.color = `hsl(${Math.random() * 360}, 90%, 65%)`;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 4 - 2;
    }
    
    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
        if (this.y > canvas.height) {
            this.y = -20;
            this.x = Math.random() * canvas.width;
        }
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
    }
}

function triggerConfetti(activeDuration = 3000) {
    particles = [];
    confettiActive = true;
    resizeCanvas();
    
    for (let i = 0; i < 70; i++) {
        particles.push(new ConfettiParticle());
    }
    
    // Stop spawning/updating after duration, unless it's the win screen
    if (activeDuration !== Infinity) {
        setTimeout(() => {
            confettiActive = false;
        }, activeDuration);
    }
}

function drawConfettiLoop() {
    if (particles.length > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, idx) => {
            p.update();
            p.draw();
            
            // remove if out of bounds and confetti is no longer active
            if (p.y > canvas.height && !confettiActive) {
                particles.splice(idx, 1);
            }
        });
    }
    requestAnimationFrame(drawConfettiLoop);
}
drawConfettiLoop();

// --- TOAST NOTIFICATIONS ---
const toast = document.getElementById('feedback-toast');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');

const motivators = [
    { text: "¡Muy bien!", icon: "⭐" },
    { text: "¡Excelente trabajo!", icon: "🎉" },
    { text: "¡Lo lograste!", icon: "👏" },
    { text: "¡Sigue contando!", icon: "🌟" },
    { text: "¡Eres un gran explorador!", icon: "🥳" },
    { text: "¡Cada vez cuentas mejor!", icon: "💙" }
];

function showToast(isCorrect, customText = null) {
    toast.className = 'feedback-toast'; // Reset
    
    if (isCorrect) {
        toast.classList.add('correct');
        const rand = motivators[Math.floor(Math.random() * motivators.length)];
        toastIcon.textContent = rand.icon;
        toastMessage.textContent = customText || rand.text;
    } else {
        toast.classList.add('incorrect');
        toastIcon.textContent = "🐰";
        toastMessage.textContent = customText || "¡Casi! Vamos a intentarlo otra vez.";
    }
    
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// --- PROGRESS PATH BAR ---
const progressContainer = document.getElementById('path-progress-bar');
const progressSteps = document.querySelectorAll('.progress-step');

function updateProgressBar() {
    if (currentScreen === 'welcome' || currentScreen === 'win') {
        progressContainer.classList.add('hidden');
    } else {
        progressContainer.classList.remove('hidden');
        progressSteps.forEach((step, idx) => {
            const stepNum = idx + 1;
            step.className = 'progress-step';
            
            if (stepNum === activeStepIndex) {
                step.classList.add('active');
            } else if (completedSteps.has(stepNum)) {
                step.classList.add('completed');
                step.innerHTML = `✅<span class="step-num">${stepNum}</span>`;
            }
        });
    }
}

// --- SCREEN TRANSITIONS ---
function showScreen(screenId) {
    currentScreen = screenId;
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(scr => {
        scr.classList.add('hidden');
    });
    
    // Show active screen
    const activeScreen = document.getElementById(`${screenId}-screen`);
    activeScreen.classList.remove('hidden');
    
    updateProgressBar();
    
    // Setup and trigger narration for the screen
    handleScreenActivation(screenId);
}

function handleScreenActivation(screenId) {
    getAudioContext(); // Make sure AudioContext runs
    
    if (screenId === 'welcome') {
        speak("¡Hola Amiguito! Soy Lilo el Conejo. ¡Acompáñame a recorrer este hermoso bosque mágico y jugar con los números!");
    } 
    else if (screenId === 'station1') {
        activeStepIndex = 1;
        resetStation1();
        speak("Estación uno. Cuenta las manzanas. Toca cada manzana en el árbol para contar en voz alta.");
    } 
    else if (screenId === 'station2') {
        activeStepIndex = 2;
        resetStation2();
        speak("Estación dos. ¿Qué número sigue? Mira los números: uno, dos, tres... ¿Cuál número sigue después del tres? Elige el botón correcto.");
    } 
    else if (screenId === 'station3') {
        activeStepIndex = 3;
        resetStation3();
        speak("Estación tres. Ayuda al conejo. Presiona las piedras en orden del uno al diez para que Lilo cruce el río y llegue a su zanahoria.");
    } 
    else if (screenId === 'station4') {
        activeStepIndex = 4;
        resetStation4();
        speak("Estación cuatro. Cuenta los animalitos. Toca todos los animalitos para contarlos y luego elige la respuesta correcta.");
    } 
    else if (screenId === 'station5') {
        activeStepIndex = 5;
        resetStation5();
        speak("Estación cinco. El gran reto del conteo. Enciende las estrellas del camino en orden, empezando por el número uno, hasta llegar al quince.");
    } 
    else if (screenId === 'win') {
        stopBackgroundMusic();
        playSound('victory');
        triggerConfetti(Infinity);
        speak("¡Excelente! ¡Excelente trabajo! Ya eres un Explorador de los Números. ¡Muchas felicidades!");
    }
}

// --- GLOBAL CONTROLS CONTROLLER ---
const musicBtn = document.getElementById('music-btn');
const soundBtn = document.getElementById('sound-btn');

musicBtn.addEventListener('click', () => {
    musicEnabled = !musicEnabled;
    if (musicEnabled) {
        musicBtn.classList.remove('muted');
        getAudioContext();
        startBackgroundMusic();
    } else {
        musicBtn.classList.add('muted');
        stopBackgroundMusic();
    }
});

soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
        soundBtn.classList.remove('muted');
        speak("¡Voz activada!");
    } else {
        soundBtn.classList.add('muted');
        window.speechSynthesis.cancel();
    }
});

// Setup Listen buttons
document.getElementById('listen-s1').addEventListener('click', () => speak("Cuenta las manzanas en voz alta tocándolas todas en el árbol."));
document.getElementById('listen-s2').addEventListener('click', () => speak("Mira la secuencia: uno, dos, tres... ¿Qué número sigue después del tres? Selecciona el botón correcto."));
document.getElementById('listen-s3').addEventListener('click', () => speak("Toca las piedras del río en orden del uno al diez para hacer saltar a Lilo hacia la zanahoria."));
document.getElementById('listen-s4').addEventListener('click', () => {
    if (station4Round === 1) speak("¿Cuántas mariposas hay? Tócalas para contar y selecciona el botón.");
    else if (station4Round === 2) speak("¿Cuántas abejitas hay? Tócalas para contar y elige el número.");
    else speak("¿Cuántas mariquitas hay en la hoja? Tócalas todas y selecciona la respuesta.");
});
document.getElementById('listen-s5').addEventListener('click', () => speak("¡Gran reto del conteo! Toca las estrellas del camino en orden del uno al quince."));

// Start and restart buttons
document.getElementById('start-btn').addEventListener('click', () => {
    getAudioContext();
    startBackgroundMusic();
    showScreen('station1');
});
document.getElementById('restart-btn').addEventListener('click', () => {
    completedSteps.clear();
    confettiActive = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    getAudioContext();
    startBackgroundMusic();
    showScreen('welcome');
});

// Navigation actions between screens
document.getElementById('to-station2-btn').addEventListener('click', () => {
    completedSteps.add(1);
    showScreen('station2');
});
document.getElementById('to-station3-btn').addEventListener('click', () => {
    completedSteps.add(2);
    showScreen('station3');
});
document.getElementById('to-station4-btn').addEventListener('click', () => {
    completedSteps.add(3);
    showScreen('station4');
});
document.getElementById('to-station5-btn').addEventListener('click', () => {
    completedSteps.add(4);
    showScreen('station5');
});


// ==========================================
// --- ESTACIÓN 1: MANZANAS (LOGIC) ---
// ==========================================
let countedApples = 0;
const totalApples = 5;

// Positions of 5 apples in the tree foliage (in percentage coordinates)
const applePositions = [
    { left: '42%', top: '28%' },
    { left: '26%', top: '42%' },
    { left: '60%', top: '38%' },
    { left: '38%', top: '56%' },
    { left: '55%', top: '62%' }
];

const spanishNumbersWords = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince"];

function resetStation1() {
    countedApples = 0;
    const container = document.getElementById('apples-container');
    container.innerHTML = '';
    
    const nextBtn = document.getElementById('to-station2-btn');
    nextBtn.classList.add('hidden');
    
    document.getElementById('s1-speech').textContent = "¡Toca una manzana para empezar a contar!";
    
    // Spawn 5 apples
    applePositions.forEach((pos, index) => {
        const apple = document.createElement('div');
        apple.className = 'apple';
        apple.style.left = pos.left;
        apple.style.top = pos.top;
        apple.dataset.index = index;
        
        // Cute SVG Apple
        apple.innerHTML = `
            <svg viewBox="0 0 100 100">
                <path d="M50 35 C40 20 20 25 20 45 C20 70 45 85 50 85 C55 85 80 70 80 45 C80 25 60 20 50 35 Z" fill="#FF5252"/>
                <path d="M50 30 Q53 15 62 12" stroke="#795548" stroke-width="4" fill="none" stroke-linecap="round"/>
                <path d="M54 22 C62 20 68 28 60 30 C56 31 54 26 54 22 Z" fill="#8BC34A"/>
                <circle cx="36" cy="46" r="4.5" fill="#333"/>
                <circle cx="34" cy="44" r="1.5" fill="#FFF"/>
                <circle cx="64" cy="46" r="4.5" fill="#333"/>
                <circle cx="62" cy="44" r="1.5" fill="#FFF"/>
                <circle cx="30" cy="52" r="4" fill="#FF8A80" opacity="0.8"/>
                <circle cx="70" cy="52" r="4" fill="#FF8A80" opacity="0.8"/>
                <path d="M44 56 Q50 62 56 56" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/>
            </svg>
        `;
        
        apple.addEventListener('click', handleAppleClick);
        container.appendChild(apple);
    });
}

function handleAppleClick(e) {
    const apple = e.currentTarget;
    if (apple.classList.contains('counted')) return;
    
    countedApples++;
    apple.classList.add('counted');
    
    // Add number tag
    const tag = document.createElement('div');
    tag.className = 'apple-number-tag';
    tag.textContent = countedApples;
    apple.appendChild(tag);
    
    // Play sounds
    playSound('hop');
    speak(spanishNumbersWords[countedApples]);
    
    // Update speech bubble
    document.getElementById('s1-speech').textContent = `¡Muy bien! Contamos ${countedApples} manzanas.`;
    
    // Check if finished
    if (countedApples === totalApples) {
        setTimeout(() => {
            playSound('success');
            triggerConfetti(2500);
            speak("¡Excelente trabajo! Contamos las cinco manzanas. ¡Siguiente estación!");
            document.getElementById('s1-speech').textContent = "¡Eso estuvo genial! Contamos las 5 manzanas. ¡Sigamos con nuestro viaje!";
            document.getElementById('to-station2-btn').classList.remove('hidden');
        }, 800);
    }
}


// ==========================================
// --- ESTACIÓN 2: SECUENCIA (LOGIC) ---
// ==========================================
function resetStation2() {
    const emptySlot = document.getElementById('seq-empty');
    emptySlot.className = 'seq-num question-mark';
    emptySlot.textContent = '❓';
    
    const nextBtn = document.getElementById('to-station3-btn');
    nextBtn.classList.add('hidden');
    
    document.getElementById('s2-speech').textContent = "¿Qué número va después del 3? ¡Elige la opción correcta!";
    
    // Re-enable option buttons
    document.querySelectorAll('#s2-options .option-btn').forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('shake');
        btn.style.opacity = '1';
    });
}

document.querySelectorAll('#s2-options .option-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const val = parseInt(e.currentTarget.dataset.value);
        const speechBubble = document.getElementById('s2-speech');
        
        if (val === 4) {
            // Correct answer
            document.querySelectorAll('#s2-options .option-btn').forEach(b => b.disabled = true);
            
            const emptySlot = document.getElementById('seq-empty');
            emptySlot.className = 'seq-num correct-answer';
            emptySlot.textContent = '4️⃣';
            
            playSound('success');
            triggerConfetti(2500);
            showToast(true);
            
            speechBubble.textContent = "¡Sí! El número 4 es el correcto. ¡Uno, dos, tres y cuatro!";
            speak("¡Lo lograste! El número cuatro sigue después del tres. ¡Excelente trabajo!");
            
            document.getElementById('to-station3-btn').classList.remove('hidden');
        } else {
            // Wrong answer
            playSound('error');
            e.currentTarget.classList.add('shake');
            e.currentTarget.style.opacity = '0.5';
            setTimeout(() => e.currentTarget.classList.remove('shake'), 500);
            
            showToast(false, "¡Casi! Prueba con otro número.");
            speechBubble.textContent = "¡Uy! Ese no sigue después del 3. Vamos a contar: uno, dos, tres... ¿qué número sigue?";
            speak("¡Uy! Ese número no sigue después del tres. Recuerda: uno, dos, tres... ¿Qué número viene después?");
        }
    });
});


// ==========================================
// --- ESTACIÓN 3: AYUDA AL CONEJO (LOGIC) ---
// ==========================================
let currentStoneOrder = 0;
const totalStones = 10;

// Coordinates for the 10 winding river stones (left and top in percentage)
const stonePositions = [
    { x: 12, y: 70 },
    { x: 20, y: 40 },
    { x: 30, y: 65 },
    { x: 38, y: 35 },
    { x: 48, y: 55 },
    { x: 58, y: 30 },
    { x: 66, y: 62 },
    { x: 74, y: 35 },
    { x: 84, y: 60 },
    { x: 92, y: 32 }
];

function resetStation3() {
    currentStoneOrder = 0;
    const grid = document.getElementById('stones-grid');
    grid.innerHTML = '';
    
    const nextBtn = document.getElementById('to-station4-btn');
    nextBtn.classList.add('hidden');
    
    document.getElementById('s3-speech').textContent = "¡Ayúdame a llegar a la zanahoria! Presiona las piedras en orden del 1 al 10.";
    
    // Position bunny at start position
    const bunny = document.getElementById('hopping-bunny');
    bunny.style.left = '4%';
    bunny.style.top = '50%';
    bunny.classList.remove('jump-anim');
    
    // Spawn stones
    stonePositions.forEach((pos, index) => {
        const stoneNum = index + 1;
        const stone = document.createElement('div');
        stone.className = 'stone';
        stone.style.left = `${pos.x}%`;
        stone.style.top = `${pos.y}%`;
        stone.textContent = stoneNum;
        stone.dataset.num = stoneNum;
        
        stone.addEventListener('click', handleStoneClick);
        grid.appendChild(stone);
    });
}

function handleStoneClick(e) {
    const stone = e.currentTarget;
    const stoneNum = parseInt(stone.dataset.num);
    const speechBubble = document.getElementById('s3-speech');
    const bunny = document.getElementById('hopping-bunny');
    
    // If already clicked, skip
    if (stone.classList.contains('correct')) return;
    
    if (stoneNum === currentStoneOrder + 1) {
        // Correct stone clicked in order
        currentStoneOrder = stoneNum;
        stone.classList.add('correct');
        
        // Move bunny to the stone position
        bunny.classList.add('jump-anim');
        bunny.style.left = `${stonePositions[stoneNum - 1].x}%`;
        bunny.style.top = `${stonePositions[stoneNum - 1].y}%`;
        
        setTimeout(() => {
            bunny.classList.remove('jump-anim');
        }, 500);
        
        playSound('hop');
        speak(spanishNumbersWords[stoneNum]);
        speechBubble.textContent = `¡Brinco! Estamos en la piedra número ${stoneNum}.`;
        
        if (currentStoneOrder === totalStones) {
            // Carrot reached!
            setTimeout(() => {
                // Move bunny slightly towards the carrot
                bunny.style.left = '95%';
                bunny.style.top = '50%';
                
                playSound('success');
                triggerConfetti(3000);
                speechBubble.textContent = "¡Yum! ¡Muchas gracias por ayudarme a cruzar el río! ¡Me encanta la zanahoria!";
                speak("¡Yum! ¡Muchas gracias por ayudarme a contar hasta diez y cruzar el río! ¡Lo hiciste increíble!");
                document.getElementById('to-station4-btn').classList.remove('hidden');
            }, 800);
        }
    } else {
        // Out of order click
        playSound('error');
        stone.classList.add('shake');
        setTimeout(() => stone.classList.remove('shake'), 500);
        
        const nextNeeded = currentStoneOrder + 1;
        showToast(false, `¡Uy! Busca el número ${nextNeeded}.`);
        speechBubble.textContent = `¡Ay! Ese no es el número que sigue. Vamos en el ${currentStoneOrder}. ¿Dónde está el ${nextNeeded}?`;
        speak(`¡Casi! Necesitamos encontrar el número ${spanishNumbersWords[nextNeeded]}. ¿Dónde está el número ${nextNeeded}?`);
    }
}


// ==========================================
// --- ESTACIÓN 4: ANIMALITOS (LOGIC) ---
// ==========================================
let station4Round = 1; // 1 = Butterflies (7), 2 = Bees (5), 3 = Ladybugs (8)
let countedAnimals = 0;
let totalAnimalsInRound = 0;
const animalClickedSet = new Set();

const roundData = [
    {
        round: 1,
        name: "mariposas",
        count: 7,
        options: [5, 7, 8],
        emoji: "🦋",
        instruction: "¿Cuántas mariposas hay volando? ¡Tócalas todas y luego responde!",
        svg: `<svg viewBox="0 0 100 100">
                <path d="M50 40 C35 15, 10 20, 20 55 C25 65, 45 60, 50 55 C55 60, 75 65, 80 55 C90 20, 65 15, 50 40 Z" fill="#E040FB" stroke="#7B1FA2" stroke-width="3"/>
                <path d="M50 50 C40 60, 25 70, 30 85 C35 90, 48 80, 50 75 C52 80, 65 90, 70 85 C75 70, 60 60, 50 50 Z" fill="#EA80FC" stroke="#7B1FA2" stroke-width="3"/>
                <rect x="47" y="30" width="6" height="50" rx="3" fill="#FFD54F" stroke="#F57C00" stroke-width="1.5"/>
                <circle cx="50" cy="27" r="5" fill="#FFD54F" stroke="#F57C00" stroke-width="1.5"/>
                <path d="M48 22 Q43 15 38 18 M52 22 Q57 15 62 18" stroke="#F57C00" stroke-width="2" fill="none" stroke-linecap="round"/>
              </svg>`
    },
    {
        round: 2,
        name: "abejas",
        count: 5,
        options: [4, 5, 6],
        emoji: "🐝",
        instruction: "¡Excelente! Ahora, ¿cuántas abejitas hay? Tócalas una a una para contar.",
        svg: `<svg viewBox="0 0 100 100">
                <ellipse cx="38" cy="30" rx="10" ry="18" fill="#E1F5FE" stroke="#0288D1" stroke-width="2.5" transform="rotate(-30, 38, 30)"/>
                <ellipse cx="62" cy="30" rx="10" ry="18" fill="#E1F5FE" stroke="#0288D1" stroke-width="2.5" transform="rotate(30, 62, 30)"/>
                <ellipse cx="50" cy="55" rx="18" ry="26" fill="#FFEB3B" stroke="#F57C00" stroke-width="3" transform="rotate(90, 50, 55)"/>
                <path d="M38 46 Q50 42 62 46" stroke="#3E2723" stroke-width="5" fill="none" stroke-linecap="round"/>
                <path d="M32 55 Q50 51 68 55" stroke="#3E2723" stroke-width="5" fill="none" stroke-linecap="round"/>
                <path d="M36 64 Q50 60 64 64" stroke="#3E2723" stroke-width="5" fill="none" stroke-linecap="round"/>
                <circle cx="68" cy="52" r="3" fill="#333"/>
                <circle cx="68" cy="60" r="3" fill="#333"/>
                <path d="M72 56 Q75 58 72 60" stroke="#333" stroke-width="2" fill="none"/>
              </svg>`
    },
    {
        round: 3,
        name: "mariquitas",
        count: 8,
        options: [6, 7, 8],
        emoji: "🐞",
        instruction: "¡Último grupo! ¿Cuántas mariquitas hay en el pasto? ¡Vamos a contarlas!",
        svg: `<svg viewBox="0 0 100 100">
                <path d="M30 35 L15 30 M30 50 L10 50 M30 65 L15 70 M70 35 L85 30 M70 50 L90 50 M70 65 L85 70" stroke="#37474F" stroke-width="3.5" stroke-linecap="round"/>
                <circle cx="50" cy="50" r="28" fill="#FF1744" stroke="#D50000" stroke-width="3"/>
                <circle cx="50" cy="22" r="12" fill="#37474F"/>
                <circle cx="46" cy="18" r="2.2" fill="#FFF"/>
                <circle cx="54" cy="18" r="2.2" fill="#FFF"/>
                <line x1="50" y1="34" x2="50" y2="78" stroke="#37474F" stroke-width="3"/>
                <circle cx="38" cy="46" r="4.5" fill="#37474F"/>
                <circle cx="38" cy="62" r="4.5" fill="#37474F"/>
                <circle cx="62" cy="46" r="4.5" fill="#37474F"/>
                <circle cx="62" cy="62" r="4.5" fill="#37474F"/>
                <circle cx="50" cy="54" r="4" fill="#37474F"/>
              </svg>`
    }
];

function resetStation4() {
    station4Round = 1;
    startAnimalRound(0);
    
    document.getElementById('to-station5-btn').classList.add('hidden');
}

function startAnimalRound(roundIdx) {
    countedAnimals = 0;
    animalClickedSet.clear();
    
    const data = roundData[roundIdx];
    totalAnimalsInRound = data.count;
    
    // Update instructions & round indicators
    document.getElementById('s4-instruction-text').textContent = `Toca las ${data.name} para contarlas y luego elige la respuesta.`;
    document.getElementById('s4-speech').textContent = data.instruction;
    document.getElementById('animals-counter-feedback').textContent = "Tocados: 0";
    
    // Update visual dots
    document.getElementById('round-dot-1').className = `round-dot ${roundIdx >= 0 ? 'active' : ''}`;
    document.getElementById('round-dot-2').className = `round-dot ${roundIdx >= 1 ? 'active' : ''}`;
    document.getElementById('round-dot-3').className = `round-dot ${roundIdx >= 2 ? 'active' : ''}`;
    
    // Spawn animals in random positions in the box
    const container = document.getElementById('animals-container');
    container.innerHTML = '';
    
    const containerWidth = 480;
    const containerHeight = 110;
    
    for (let i = 0; i < totalAnimalsInRound; i++) {
        const animal = document.createElement('div');
        animal.className = 'animal-card';
        
        // Random layout coordinates that avoid getting cut off
        const randX = Math.random() * containerWidth;
        const randY = Math.random() * containerHeight;
        
        animal.style.left = `${randX}px`;
        animal.style.top = `${randY}px`;
        animal.dataset.idx = i;
        animal.innerHTML = data.svg;
        
        animal.addEventListener('click', handleAnimalClick);
        container.appendChild(animal);
    }
    
    // Options buttons rendering
    const optionsContainer = document.getElementById('s4-options');
    optionsContainer.innerHTML = '';
    
    data.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.dataset.val = opt;
        
        btn.addEventListener('click', handleAnimalOptionClick);
        optionsContainer.appendChild(btn);
    });
}

function handleAnimalClick(e) {
    const animal = e.currentTarget;
    const idx = parseInt(animal.dataset.idx);
    
    if (animalClickedSet.has(idx)) return;
    
    animalClickedSet.add(idx);
    countedAnimals++;
    
    animal.classList.add('counted');
    
    // Small count tag
    const badge = document.createElement('div');
    badge.className = 'animal-num-badge';
    badge.textContent = countedAnimals;
    animal.appendChild(badge);
    
    // Audio feedback
    playSound('hop');
    speak(spanishNumbersWords[countedAnimals]);
    
    // Update counters
    document.getElementById('animals-counter-feedback').textContent = `Tocados: ${countedAnimals}`;
    document.getElementById('s4-speech').textContent = `¡Eso! Llevamos ${countedAnimals} animalitos contados.`;
}

function handleAnimalOptionClick(e) {
    const clickedVal = parseInt(e.currentTarget.dataset.val);
    const data = roundData[station4Round - 1];
    const speechBubble = document.getElementById('s4-speech');
    
    if (clickedVal === data.count) {
        // Correct Choice
        document.querySelectorAll('#s4-options .option-btn').forEach(b => b.disabled = true);
        playSound('success');
        triggerConfetti(2000);
        showToast(true, `¡Sí! Hay ${data.count} ${data.name}.`);
        
        if (station4Round < 3) {
            speechBubble.textContent = `¡Increíble! Contaste bien. Hay ${data.count} ${data.name}. ¡Vamos con el siguiente reto!`;
            speak(`¡Muy bien! Contaste bien. Hay ${spanishNumbersWords[data.count]} ${data.name}. ¡Siguiente ronda!`);
            
            station4Round++;
            setTimeout(() => {
                startAnimalRound(station4Round - 1);
                // Narrate the next round instruction
                const nextData = roundData[station4Round - 1];
                speak(nextData.instruction);
            }, 2500);
        } else {
            speechBubble.textContent = `¡Maravilloso! Contaste todos los animales del bosque mágico. ¡Vamos al último reto!`;
            speak("¡Lo lograste! Contaste todos los grupos de animales del bosque de forma excelente. ¡Avancemos al gran reto final!");
            
            document.getElementById('to-station5-btn').classList.remove('hidden');
        }
    } else {
        // Wrong Choice
        playSound('error');
        e.currentTarget.classList.add('shake');
        setTimeout(() => e.currentTarget.classList.remove('shake'), 500);
        
        showToast(false, "¡Casi! Cuenta otra vez.");
        speechBubble.textContent = `¡Uy! ¿Seguro que hay ${clickedVal}? Tócalas una a una en la caja verde y vuelve a contar.`;
        speak(`¡Casi! ¿Estás seguro que hay ${clickedVal}? Intenta tocar cada una en la caja verde y cuenta cuántas son.`);
    }
}


// ==========================================
// --- ESTACIÓN 5: GRAN RETO 1-15 (LOGIC) ---
// ==========================================
let currentStarOrder = 0;
const totalStars = 15;

// Positions of 15 stars winding along the screen (X and Y percentage coordinates)
const starPositions = [
    { x: 8, y: 70 },
    { x: 14, y: 38 },
    { x: 22, y: 58 },
    { x: 28, y: 25 },
    { x: 36, y: 64 },
    { x: 42, y: 36 },
    { x: 48, y: 15 },
    { x: 55, y: 58 },
    { x: 62, y: 32 },
    { x: 69, y: 66 },
    { x: 75, y: 40 },
    { x: 81, y: 60 },
    { x: 86, y: 22 },
    { x: 91, y: 50 },
    { x: 95, y: 26 }
];

function resetStation5() {
    currentStarOrder = 0;
    const sky = document.getElementById('starry-sky-path');
    sky.innerHTML = '';
    
    document.getElementById('s5-speech').textContent = "¡Toca la estrella número 1 para encender el camino de la magia!";
    
    // Spawn 15 stars
    starPositions.forEach((pos, index) => {
        const starNum = index + 1;
        const star = document.createElement('div');
        star.className = 'star-item';
        star.style.left = `${pos.x}%`;
        star.style.top = `${pos.y}%`;
        star.dataset.num = starNum;
        
        // Shiny star SVG vector
        star.innerHTML = `
            <svg viewBox="0 0 100 100">
                <polygon points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36" fill="#FFEB3B" stroke="#F57C00" stroke-width="3"/>
            </svg>
        `;
        
        star.addEventListener('click', handleStarClick);
        sky.appendChild(star);
    });
}

function handleStarClick(e) {
    const star = e.currentTarget;
    const starNum = parseInt(star.dataset.num);
    const speechBubble = document.getElementById('s5-speech');
    
    if (star.classList.contains('active')) return;
    
    if (starNum === currentStarOrder + 1) {
        // Correct Star clicked in order
        currentStarOrder = starNum;
        star.classList.add('active');
        
        // Add number inside the star
        const numberLabel = document.createElement('div');
        numberLabel.className = 'star-num-label';
        numberLabel.textContent = starNum;
        star.appendChild(numberLabel);
        
        playSound('star');
        speak(spanishNumbersWords[starNum]);
        speechBubble.textContent = `¡Estrella ${starNum} encendida! ¡Sigue contando!`;
        
        if (currentStarOrder === totalStars) {
            // Victory reached!
            setTimeout(() => {
                showScreen('win');
            }, 1200);
        }
    } else {
        // Out of order click
        playSound('error');
        star.classList.add('shake');
        setTimeout(() => star.classList.remove('shake'), 500);
        
        const nextStarNeeded = currentStarOrder + 1;
        showToast(false, `¡Uy! Busca la estrella ${nextStarNeeded}.`);
        speechBubble.textContent = `¡Ay! Esa no es. Debemos encender la estrella número ${nextStarNeeded} ahora.`;
        speak(`¡Casi! Busca la estrella número ${nextStarNeeded} para continuar con el camino.`);
    }
}

// Initial show
showScreen('welcome');
