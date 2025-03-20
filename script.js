class TwisterSpinner {
    constructor() {
        this.board = document.querySelector('.twister-board');
        this.needle = document.querySelector('.spinner-needle');
        this.timerDisplay = document.getElementById('timer');
        this.startButton = document.getElementById('startButton');
        this.endButton = document.getElementById('endButton');
        this.currentRotation = 0;
        this.isSpinning = false;
        this.gameActive = false;
        this.audioInitialized = false;
        this.isInitialCountdown = true;

        this.colors = ['blue', 'yellow', 'green', 'red'];
        this.bodyPartAudioMap = {
            'righthand': 'rightHand',
            'lefthand': 'leftHand',
            'rightfoot': 'rightFoot',
            'leftfoot': 'leftFoot'
        };
        this.dots = [];

        this.setupAudio();
        this.createDots();
        this.setupEventListeners();
    }

    setupAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create audio elements
        this.sounds = {
            countdown: new Audio('sounds/beep.wav'),
            spin: new Audio('sounds/spin.wav'),
            rightHand: new Audio('sounds/right-hand.wav'),
            leftHand: new Audio('sounds/left-hand.wav'),
            rightFoot: new Audio('sounds/right-foot.wav'),
            leftFoot: new Audio('sounds/left-foot.wav'),
            blue: new Audio('sounds/blue.wav'),
            yellow: new Audio('sounds/yellow.wav'),
            green: new Audio('sounds/green.wav'),
            red: new Audio('sounds/red.wav')
        };

        // Preload all audio files
        Object.values(this.sounds).forEach(audio => {
            audio.load();
        });
    }

    async initializeAudio() {
        if (this.audioInitialized) return;
        
        try {
            await this.audioContext.resume();
            
            // Play and immediately pause all sounds to initialize them
            const initPromises = Object.values(this.sounds).map(async (audio) => {
                try {
                    await audio.play();
                    audio.pause();
                    audio.currentTime = 0;
                } catch (err) {
                    console.error('Error initializing audio:', err);
                }
            });
            
            await Promise.all(initPromises);
            this.audioInitialized = true;
        } catch (err) {
            console.error('Error initializing audio context:', err);
        }
    }

    createDots() {
        const numDots = 16;
        const radius = 160; // Distance from center to dots
        const centerX = 200;
        const centerY = 200;
        const offsetAngle = 360 / (numDots * 2); // Half segment offset (11.25 degrees)

        for (let i = 0; i < numDots; i++) {
            const angle = ((i * 360 / numDots) + offsetAngle) * (Math.PI / 180);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            const dot = document.createElement('div');
            dot.className = 'dot';
            
            // Calculate color index (alternating colors)
            const colorIndex = i % 4;
            dot.style.backgroundColor = this.colors[colorIndex];
            
            // Position the dot
            dot.style.left = `${x - 20}px`; // Subtract half of dot width
            dot.style.top = `${y - 20}px`; // Subtract half of dot height
            
            // Determine quadrant and body part
            // Adjust angle to account for offset and normalize to 0-360
            const angleInDegrees = ((i * 360 / numDots) + offsetAngle) % 360;
            let bodyPart;
            
            // Fix reversed quadrant mapping
            if (angleInDegrees >= 0 && angleInDegrees < 90) {
                bodyPart = 'rightfoot'; // TOP RIGHT - Should be LEFT hand (not right hand)
            } else if (angleInDegrees >= 90 && angleInDegrees < 180) {
                bodyPart = 'lefthand'; // BOTTOM RIGHT - Should be RIGHT foot (not left foot)
            } else if (angleInDegrees >= 180 && angleInDegrees < 270) {
                bodyPart = 'righthand'; // TOP LEFT - Should be RIGHT hand (not left hand)
            } else {
                bodyPart = 'leftfoot'; // BOTTOM LEFT - Should be LEFT foot (not right foot)
            }
            
            this.board.appendChild(dot);
            this.dots.push({
                element: dot,
                color: this.colors[colorIndex],
                bodyPart: bodyPart,
                angle: angleInDegrees
            });
        }
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.endButton.addEventListener('click', () => this.endGame());
    }

    async startGame() {
        if (this.gameActive) return;
        
        // Initialize audio when game starts
        await this.initializeAudio();
        
        this.gameActive = true;
        this.startButton.disabled = true;
        document.body.classList.add('fullscreen');

        // Initial 5-second countdown with zoom effect
        this.isInitialCountdown = true;
        await this.countdown(5);
        this.isInitialCountdown = false;
        
        // Start the game loop
        this.gameLoop();
    }

    async gameLoop() {
        if (!this.gameActive) return;

        await this.spinNeedle();
        await this.countdown(10); // Changed to use countdown for consistency
        
        if (this.gameActive) {
            this.gameLoop();
        }
    }

    async countdown(seconds) {
        // Remove any existing classes first
        this.timerDisplay.classList.remove('countdown-zoom', 'timer-fixed');

        if (this.isInitialCountdown) {
            // Initial countdown with zoom effect and beep
            this.timerDisplay.classList.add('countdown-zoom');
            for (let i = seconds; i > 0; i--) {
                this.timerDisplay.textContent = i;
                this.sounds.countdown.play();
                await this.wait(1000);
            }
            this.timerDisplay.classList.remove('countdown-zoom');
            // Clear the text immediately after initial countdown
            this.timerDisplay.textContent = '';
        } else {
            // Subsequent countdowns - just update the number without effects or sound
            this.timerDisplay.classList.add('timer-fixed');
            for (let i = seconds; i > 0; i--) {
                this.timerDisplay.textContent = i;
                await this.wait(1000);
            }
            this.timerDisplay.textContent = '';
        }
    }

    async spinNeedle() {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        await this.playAudio(this.sounds.spin);

        // Random number of full rotations (5-8) plus random segment
        const rotations = 5 + Math.floor(Math.random() * 4);
        const randomSegment = Math.floor(Math.random() * 16);
        const offsetAngle = 360 / 32; // 11.25 degrees offset
        const targetAngle = (rotations * 360) + (randomSegment * (360 / 16)) + offsetAngle;

        // Update the needle's rotation with a longer transition
        this.needle.style.transition = 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)';
        this.currentRotation = targetAngle;
        this.needle.style.transform = `translate(-50%, -50%) rotate(${targetAngle}deg)`;

        // Wait for spin animation to complete (increased from 3000 to 4000)
        await this.wait(4000);

        // Reset transition to default for instant movement
        this.needle.style.transition = '';

        // Calculate which dot the needle is actually pointing to
        const normalizedAngle = (targetAngle % 360 + 360) % 360;
        const dotIndex = Math.floor(((normalizedAngle - offsetAngle + 360) % 360) / (360 / 16));
        
        // Get the selected dot
        const selectedDot = this.dots[dotIndex];
        
        // Play audio announcements
        await this.announceSelection(selectedDot);

        this.isSpinning = false;
    }

    async announceSelection(dot) {
        try {
            // Map the body part to the correct audio key
            const audioKey = this.bodyPartAudioMap[dot.bodyPart];
            const bodyPartSound = this.sounds[audioKey];
            
            if (!bodyPartSound) {
                console.error('Missing audio for body part:', dot.bodyPart, 'with key:', audioKey);
                return;
            }
            
            // Play body part audio first
            await this.playAudio(bodyPartSound);
            
            // Small pause between words
            await this.wait(100);
            
            // Play color audio immediately after
            const colorSound = this.sounds[dot.color];
            if (!colorSound) {
                console.error('Missing audio for color:', dot.color);
                return;
            }
            await this.playAudio(colorSound);
        } catch (err) {
            console.error('Error playing audio:', err, 'for dot:', dot);
        }
    }

    async playAudio(audio) {
        try {
            audio.currentTime = 0; // Reset audio to start
            await audio.play();
            
            return new Promise((resolve) => {
                audio.onended = resolve;
                audio.onerror = (err) => {
                    console.error('Audio playback error:', err);
                    resolve(); // Resolve anyway to prevent hanging
                };
            });
        } catch (err) {
            console.error('Error playing audio:', err);
            return Promise.resolve(); // Return resolved promise to prevent hanging
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    endGame() {
        this.gameActive = false;
        this.isSpinning = false;
        this.currentRotation = 0;
        this.needle.style.transform = 'translate(-50%, -50%) rotate(0deg)';
        this.timerDisplay.textContent = 'Ready!';
        this.timerDisplay.classList.remove('countdown-zoom', 'timer-fixed');
        this.startButton.disabled = false;
        document.body.classList.remove('fullscreen');
        // Reset initial countdown flag so next start will show large timer
        this.isInitialCountdown = true;
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new TwisterSpinner();
}); 