// Alphabet configuration
const alphabetData = [
    { letter: 'A', word: 'Allosaurus' },
    { letter: 'B', word: 'Banana' },
    { letter: 'C', word: 'Cat' },
    { letter: 'D', word: 'Diplodocus' },
    { letter: 'E', word: 'Elephant' },
    { letter: 'F', word: 'Fruit' },
    { letter: 'G', word: 'Giraffe' },
    { letter: 'H', word: 'Hedgehog' },
    { letter: 'I', word: 'Iguana' },
    { letter: 'J', word: 'Jam' },
    { letter: 'K', word: 'Kangaroo' },
    { letter: 'L', word: 'Lemon' },
    { letter: 'M', word: 'Monkey' },
    { letter: 'N', word: 'Narwhal' },
    { letter: 'O', word: 'Orange' },
    { letter: 'P', word: 'Panda' },
    { letter: 'Q', word: 'Quail' },
    { letter: 'R', word: 'Raptor' },
    { letter: 'S', word: 'Snake' },
    { letter: 'T', word: 'T-Rex' },
    { letter: 'U', word: 'Unicorn' },
    { letter: 'V', word: 'Velociraptor' },
    { letter: 'W', word: 'Watermelon' },
    { letter: 'X', word: 'Fox' },
    { letter: 'Y', word: 'Yak' },
    { letter: 'Z', word: 'Zebra' }
];

const mediaPairs = alphabetData.map(item => ({
    letter: item.letter,
    image: `assets/letter_${item.letter.toLowerCase()}.png`,
    sound: `assets/sounds/letter_${item.letter.toLowerCase()}.mp3`,
    word: item.word
}));

let currentIndex = 0;
let isTransitioning = false;
let audioUnlocked = false;

// Pre-load voices for browsers that support it
let voices = [];
function loadVoices() {
    // Strictly English only (en-US, en-GB, en-AU, etc.)
    const allVoices = window.speechSynthesis.getVoices();
    voices = allVoices.filter(v => v.lang.toLowerCase().startsWith('en'));

    if (voices.length > 0) {
        console.log(`Loaded ${voices.length} English voices`);
    }
}
loadVoices();
if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
}

// Persistent Audio Element (Crucial for iOS)
const audioPlayer = new Audio();
audioPlayer.preload = 'auto';

// DOM Elements
const mainImage = document.getElementById('main-image');
const imageContainer = document.getElementById('image-container');
const transitionOverlay = document.getElementById('transition-overlay');

/**
 * Play sound synchronously within the user gesture context.
 */
function triggerSound(index) {
    const pair = mediaPairs[index];

    // Stop current
    audioPlayer.pause();

    // Set new source and play
    audioPlayer.src = pair.sound;

    const playPromise = audioPlayer.play();

    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Audio file blocked or missing, trying speech fallback:", error);
            speakLetterFallback(pair.letter, pair.word);
        });
    }
}

/**
 * Fallback to Speech Synthesis.
 * Note: On iOS, this MUST be triggered during the user swipe/click.
 */
function speakLetterFallback(letter, word) {
    const ssu = new SpeechSynthesisUtterance(`${letter}! ${letter} is for ${word}!`);

    // Ensure we have voices
    if (voices.length === 0) loadVoices();

    // Pick a random voice if available
    if (voices.length > 0) {
        ssu.voice = voices[Math.floor(Math.random() * voices.length)];
    }

    // Even if there's only one voice, randomize pitch and rate for variety!
    ssu.rate = 0.7 + Math.random() * 0.4;  // Random rate between 0.7 and 1.1
    ssu.pitch = 0.8 + Math.random() * 1.0; // Random pitch between 0.8 and 1.8

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(ssu);
}


/**
 * Initial "Unlock" for iOS.
 * Triggers both an empty speech and the first audio play to satisfy Safari's gesture requirements.
 */
function unlockAudio() {
    if (audioUnlocked) return;

    // 1. Unlocking SpeechSynthesis (the "empty speak" trick)
    const silentSpeak = new SpeechSynthesisUtterance('');
    silentSpeak.volume = 0;
    window.speechSynthesis.speak(silentSpeak);

    // 2. Unlocking HTML5 Audio
    triggerSound(currentIndex);

    audioUnlocked = true;
    console.log("Speech & Audio Unlocked for Safari");
}

function goToImage(index) {
    if (isTransitioning) return;
    isTransitioning = true;

    // Trigger sound IMMEDIATELY in gesture context
    triggerSound(index);

    // Visual transition
    transitionOverlay.classList.add('active');
    mainImage.classList.add('fade-out');

    setTimeout(() => {
        currentIndex = index;
        loadCurrentImage();

        setTimeout(() => {
            transitionOverlay.classList.remove('active');
            mainImage.classList.remove('fade-out');
            mainImage.classList.add('fade-in');

            setTimeout(() => {
                mainImage.classList.remove('fade-in');
                isTransitioning = false;
            }, 500);
        }, 100);
    }, 400);
}

function loadCurrentImage() {
    mainImage.classList.add('loading');
    const pair = mediaPairs[currentIndex];
    mainImage.src = pair.image;
    mainImage.alt = `Letter ${pair.letter} - ${pair.word}`;
    mainImage.onload = () => mainImage.classList.remove('loading');
}

function handleClick(e) {
    // Safari restriction: all playback must start synchronously in the click handler
    if (!audioUnlocked) {
        unlockAudio();
        // Stay on first letter for the first click to allow user to hear 'A'
        return;
    }

    if (isTransitioning) return;

    const nextIndex = (currentIndex + 1) % mediaPairs.length;
    goToImage(nextIndex);
}

function init() {
    loadCurrentImage();
    imageContainer.addEventListener('click', handleClick);

    // Handle Space/Arrow keys (will also attempt unlock)
    document.addEventListener('keydown', (e) => {
        if (!audioUnlocked) unlockAudio();

        if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            goToImage((currentIndex + 1) % mediaPairs.length);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevIndex = (currentIndex - 1 + mediaPairs.length) % mediaPairs.length;
            goToImage(prevIndex);
        }
    });
}

document.addEventListener('DOMContentLoaded', init);

// Prevent dragging/scrolling (iOS bounce fix)
document.addEventListener('touchmove', (e) => {
    if (e.scale !== 1) e.preventDefault();
}, { passive: false });
