// Alphabet configuration
const alphabetData = [
    { letter: 'A', word: 'Allosaurus', voice: 'elmo' },
    { letter: 'B', word: 'Banana', voice: 'bond' },
    { letter: 'C', word: 'Cat', voice: 'cookiemonster' },
    { letter: 'D', word: 'Diplodocus', voice: 'elmo' },
    { letter: 'E', word: 'Elephant', voice: 'bond' },
    { letter: 'F', word: 'Fruit', voice: 'bigbird' },
    { letter: 'G', word: 'Giraffe', voice: 'grover' },
    { letter: 'H', word: 'Hedgehog', voice: 'bond' },
    { letter: 'I', word: 'Iguana', voice: 'elmo' },
    { letter: 'J', word: 'Jam', voice: 'cookiemonster' },
    { letter: 'K', word: 'Kangaroo', voice: 'bond' },
    { letter: 'L', word: 'Lemon', voice: 'bigbird' },
    { letter: 'M', word: 'Monkey', voice: 'grover' },
    { letter: 'N', word: 'Narwhal', voice: 'elmo' },
    { letter: 'O', word: 'Orange', voice: 'bond' },
    { letter: 'P', word: 'Panda', voice: 'cookiemonster' },
    { letter: 'Q', word: 'Quail', voice: 'bigbird' },
    { letter: 'R', word: 'Raptor', voice: 'bond' },
    { letter: 'S', word: 'Snake', voice: 'grover' },
    { letter: 'T', word: 'T-Rex', voice: 'elmo' },
    { letter: 'U', word: 'Unicorn', voice: 'bigbird' },
    { letter: 'V', word: 'Velociraptor', voice: 'bond' },
    { letter: 'W', word: 'Watermelon', voice: 'cookiemonster' },
    { letter: 'X', word: 'Fox', voice: 'grover' },
    { letter: 'Y', word: 'Yak', voice: 'elmo' },
    { letter: 'Z', word: 'Zebra', voice: 'bond' }
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

    // Pick a random voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        const randomVoice = voices[Math.floor(Math.random() * voices.length)];
        ssu.voice = randomVoice;
    }

    ssu.rate = 0.85;
    ssu.pitch = 1.3;
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
