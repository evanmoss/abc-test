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
 * iOS Safari requires the .play() call to happen IMMEDIATELY in the click handler.
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
            console.log("Audio file playback failed, trying speech fallback:", error);
            // Speech synthesis also needs to be in gesture context, 
            // but we're still inside the click event here.
            speakLetterFallback(pair.letter, pair.word);
        });
    }
}

function speakLetterFallback(letter, word) {
    const ssu = new SpeechSynthesisUtterance(`${letter}! ${letter} is for ${word}!`);
    ssu.rate = 0.85;
    ssu.pitch = 1.3;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(ssu);
}

/**
 * Initial "Unlock" for iOS
 */
function unlockAudio() {
    if (audioUnlocked) return;

    // Play a tiny silent buffer or the first sound
    triggerSound(currentIndex);
    audioUnlocked = true;
    console.log("Audio Unlocked");
}

function goToImage(index) {
    if (isTransitioning) return;
    isTransitioning = true;

    // 1. Play sound IMMEDIATELY (while still in user gesture context)
    // We don't wait for the fade because Safari will block it if we do.
    triggerSound(index);

    // 2. Perform visual transition
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
    // Required for iOS Safari:
    // Any audio playback MUST be triggered synchronously in the click handler.

    if (!audioUnlocked) {
        unlockAudio();
        return;
    }

    if (isTransitioning) return;

    const nextIndex = (currentIndex + 1) % mediaPairs.length;
    goToImage(nextIndex);
}

function init() {
    loadCurrentImage();
    imageContainer.addEventListener('click', handleClick);

    // Handle Space/Arrow keys
    document.addEventListener('keydown', (e) => {
        if (!audioUnlocked) unlockAudio();

        if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            goToImage((currentIndex + 1) % mediaPairs.length);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goToImage((currentIndex - 1 + mediaPairs.length) % mediaPairs.length);
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
