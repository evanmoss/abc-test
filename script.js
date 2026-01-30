// Alphabet configuration with themed inspirations
// Each letter has a word and voice style for the audio
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

// Build mediaPairs from alphabet data
const mediaPairs = alphabetData.map(item => ({
    letter: item.letter,
    image: `assets/letter_${item.letter.toLowerCase()}.png`,
    sound: `assets/sounds/letter_${item.letter.toLowerCase()}.mp3`,
    word: item.word,
    voice: item.voice
}));

let currentIndex = 0;
let isTransitioning = false;
let currentAudio = null;
let audioUnlocked = false;

// DOM Elements
const mainImage = document.getElementById('main-image');
const imageContainer = document.getElementById('image-container');
const transitionOverlay = document.getElementById('transition-overlay');

// Play the letter sound
// IMPORTANT: For Mobile Safari, this must be called directly from a user gesture (click/tap)
function playLetterSound(soundPath, letter, word) {
    // Stop any current audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    // Try to play the audio file
    currentAudio = new Audio(soundPath);
    currentAudio.volume = 1.0;

    const playPromise = currentAudio.play();

    if (playPromise !== undefined) {
        playPromise.catch(error => {
            // If audio file doesn't exist or is blocked, fall back to speech synthesis
            console.log('Audio playback blocked or file not found:', error);
            speakLetterFallback(letter, word);
        });
    }
}

// Fallback to speech synthesis
function speakLetterFallback(letter, word) {
    const speechSynthesis = window.speechSynthesis;
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance();
    utterance.text = `${letter}! ${letter} is for ${word}!`;
    utterance.rate = 0.85;
    utterance.pitch = 1.3;
    utterance.volume = 1.0;

    speechSynthesis.speak(utterance);
}

// Unlock audio for Safari (plays current sound once to grant permission)
function unlockAudio() {
    if (audioUnlocked) return;

    // Play the current letter sound immediately
    const currentPair = mediaPairs[currentIndex];
    playLetterSound(currentPair.sound, currentPair.letter, currentPair.word);

    audioUnlocked = true;
}

// Go to specific image
function goToImage(index) {
    if (isTransitioning) return;
    isTransitioning = true;

    // Fade out current image
    transitionOverlay.classList.add('active');
    mainImage.classList.add('fade-out');

    setTimeout(() => {
        currentIndex = index;
        loadCurrentImage();

        // Play the letter sound after transition
        const currentPair = mediaPairs[currentIndex];
        playLetterSound(currentPair.sound, currentPair.letter, currentPair.word);

        // Fade in new image
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

// Load current image
function loadCurrentImage() {
    mainImage.classList.add('loading');
    const currentPair = mediaPairs[currentIndex];
    mainImage.src = currentPair.image;
    mainImage.alt = `Letter ${currentPair.letter} - ${currentPair.word}`;
    mainImage.onload = () => {
        mainImage.classList.remove('loading');
    };
}

// Handle click to advance
function handleClick(e) {
    // First, unlock audio if needed
    if (!audioUnlocked) {
        unlockAudio();
        // We stay on the first letter (A) for the first click to let user hear it
        return;
    }

    if (isTransitioning) return;

    const nextIndex = (currentIndex + 1) % mediaPairs.length;
    goToImage(nextIndex);
}

// Initialize
function init() {
    loadCurrentImage();

    // AUTO-PLAY REMOVED: Safari blocks audio that isn't triggered by a user click.
    // The first click on the image will "unlock" audio and play the first letter.

    imageContainer.addEventListener('click', handleClick);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        // If they use keyboard, we should also try to unlock
        if (!audioUnlocked) {
            unlockAudio();
            return;
        }

        if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % mediaPairs.length;
            goToImage(nextIndex);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevIndex = (currentIndex - 1 + mediaPairs.length) % mediaPairs.length;
            goToImage(prevIndex);
        }
    });
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
