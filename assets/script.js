// Mazzi vuoti iniziali
let tabooCards = [];
let drawCards = [];
let mimeCards = [];

let currentDeckType = "taboo";
let currentCard = null;
let selectedMode = "taboo";
let timerInterval = null;
let timeLeft = 60;

let guessedCards = [];
let skippedCards = [];

// --- Elementi DOM ---
const mainWord = document.getElementById("main-word");
const forbiddenList = document.getElementById("forbidden-list");
const drawingEl = document.getElementById("drawing");
const mimeEl = document.getElementById("mime");
const timerEl = document.getElementById("timer");
const nextBtn = document.getElementById("next-btn");
const skipBtn = document.getElementById("skip-btn");
const guessedBtn = document.getElementById("guessed-btn");
const timerBar = document.getElementById("timer-bar");

const tabooSection = document.getElementById("taboo-section");
const drawSection = document.getElementById("draw-section");
const mimeSection = document.getElementById("mime-section");

const colorButtons = document.querySelectorAll(".color-btn");
const modeLabel = document.getElementById("mode-label");

const guessedCountEl = document.getElementById("guessed-count");
const skippedCountEl = document.getElementById("skipped-count");

// Creiamo un elemento per info mazzo
const deckInfoEl = document.createElement("div");
deckInfoEl.id = "deck-info";
deckInfoEl.style.fontWeight = "bold";
document.querySelector(".controls").appendChild(deckInfoEl);

// --- Popup tempo scaduto ---
const timeupPopup = document.getElementById("timeup-popup");
const closeTimeupBtn = document.getElementById("close-timeup-btn");
const deckChoiceBtns = document.querySelectorAll(".timeup-deck-btn");

let chosenDeck = null;

deckChoiceBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        chosenDeck = btn.dataset.deck; // "taboo", "draw", "mime"
        deckChoiceBtns.forEach(b => b.classList.toggle("selected", b.dataset.deck === chosenDeck));
        closeTimeupBtn.disabled = false; // abilita OK
    });
});

closeTimeupBtn.addEventListener("click", () => {
    if(!chosenDeck) return;
    timeupPopup.classList.add("hidden");

    setSelectedMode(chosenDeck);
    chosenDeck = null;
    closeTimeupBtn.disabled = true;

    const card = pickNextCard();
    if(card){
        showCard(card);
        startTimer();
    }
});

// --- Funzioni mazzi ---
function setSelectedMode(mode) {
    selectedMode = mode;
    currentDeckType = mode;
    
    colorButtons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.mode === mode);
        btn.setAttribute("aria-pressed", btn.dataset.mode === mode ? "true" : "false");
    });

    const labelText = mode === "taboo" ? "Modalità: Taboo" : (mode === "draw" ? "Modalità: Disegno" : "Modalità: Mimo");
    modeLabel.textContent = labelText;
    
    updateDeckInfo();
}

function shuffleDecks() {
    [tabooCards, drawCards, mimeCards].forEach(deck => {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    });
}

function getCurrentDeck() {
    switch(currentDeckType) {
        case "taboo": return tabooCards;
        case "draw": return drawCards;
        case "mime": return mimeCards;
        default: return tabooCards;
    }
}

function getDeckSize(deckType) {
    switch(deckType) {
        case "taboo": return tabooCards.length;
        case "draw": return drawCards.length;
        case "mime": return mimeCards.length;
        default: return 0;
    }
}

function pickNextCard() {
    let currentDeck = getCurrentDeck();
    
    if (currentDeck.length === 0) {
        if (switchToNextDeck()) {
            currentDeck = getCurrentDeck();
        } else {
            endGame();
            return null;
        }
    }
    
    return currentDeck.pop();
}

function switchToNextDeck() {
    if (currentDeckType === "taboo") {
        if (drawCards.length > 0) {
            currentDeckType = "draw";
            selectedMode = "draw";
        } else if (mimeCards.length > 0) {
            currentDeckType = "mime";
            selectedMode = "mime";
        } else return false;
    } else if (currentDeckType === "draw") {
        if (mimeCards.length > 0) {
            currentDeckType = "mime";
            selectedMode = "mime";
        } else if (tabooCards.length > 0) {
            currentDeckType = "taboo";
            selectedMode = "taboo";
        } else return false;
    } else if (currentDeckType === "mime") {
        if (tabooCards.length > 0) {
            currentDeckType = "taboo";
            selectedMode = "taboo";
        } else if (drawCards.length > 0) {
            currentDeckType = "draw";
            selectedMode = "draw";
        } else return false;
    }
    
    setSelectedMode(currentDeckType);
    updateDeckInfo();
    return true;
}

function updateDeckInfo() {
    const deckNames = { "taboo": "Taboo", "draw": "Disegno", "mime": "Mimo" };
    const currentDeckSize = getDeckSize(currentDeckType);
    deckInfoEl.textContent = `Mazzo: ${deckNames[currentDeckType]} - Carte rimanenti: ${currentDeckSize}`;
}

function showCard(card) {
    if(!card) return;
    currentCard = card;

    if(currentDeckType === "taboo"){
        mainWord.style.display = "block";
        mainWord.textContent = card.word;
        tabooSection.classList.remove("hidden");
        drawSection.classList.add("hidden");
        mimeSection.classList.add("hidden");
        forbiddenList.innerHTML = "";
        if (card.forbidden) {
            card.forbidden.forEach(w => {
                const li = document.createElement("li");
                li.textContent = w;
                forbiddenList.appendChild(li);
            });
        }
    } else if(currentDeckType === "draw"){
        mainWord.style.display = "none";
        tabooSection.classList.add("hidden");
        drawSection.classList.remove("hidden");
        mimeSection.classList.add("hidden");
        drawingEl.textContent = card.drawing || card.word;
    } else if(currentDeckType === "mime"){
        mainWord.style.display = "none";
        tabooSection.classList.add("hidden");
        drawSection.classList.add("hidden");
        mimeSection.classList.remove("hidden");
        mimeEl.textContent = card.mime || card.word;
    }
    
    updateDeckInfo();
}

// --- Timer ---
function startTimer(){
    stopTimer();
    timeLeft = 60;
    timerEl.firstChild.textContent = `Tempo: ${timeLeft}`;
    timerBar.style.width = "100%";
    timerBar.style.backgroundColor = "#22c55e";

    nextBtn.disabled = false;
    skipBtn.disabled = false;
    guessedBtn.disabled = false;

    timerInterval = setInterval(() => {
        timeLeft--;
        if(timeLeft >= 0){
            timerEl.firstChild.textContent = `Tempo: ${timeLeft}`;
            timerBar.style.width = `${(timeLeft/60)*100}%`;

            if(timeLeft > 30){
                timerBar.style.backgroundColor = "#22c55e";
            } else if(timeLeft > 10){
                timerBar.style.backgroundColor = "#facc15";
            } else {
                timerBar.style.backgroundColor = "#dc2626";
            }

        } else {
            clearInterval(timerInterval);
            timerEl.firstChild.textContent = "Tempo scaduto!";
            timerBar.style.width = "0%";
            timerBar.style.backgroundColor = "#dc2626";

            timeupPopup.classList.remove("hidden");
            nextBtn.disabled = true;
            skipBtn.disabled = true;
            guessedBtn.disabled = true;
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

// --- Contatori ---
function updateCounters(){
    guessedCountEl.textContent = guessedCards.length;
    skippedCountEl.textContent = skippedCards.length;
}

// --- Fine gioco ---
function endGame() {
    stopTimer();
    alert(`Gioco terminato!\n\nCarte indovinate: ${guessedCards.length}\nCarte saltate: ${skippedCards.length}`);
    resetGame();
}

function resetGame() {
    guessedCards = [];
    skippedCards = [];
    updateCounters();
    shuffleDecks();
    setSelectedMode("taboo");
    mainWord.textContent = "—";
    forbiddenList.innerHTML = "";
    drawingEl.textContent = "—";
    mimeEl.textContent = "—";
    tabooSection.classList.remove("hidden");
    drawSection.classList.add("hidden");
    mimeSection.classList.add("hidden");
    timerEl.firstChild.textContent = "Tempo: 60";
    timerBar.style.width = "100%";
    timerBar.style.backgroundColor = "#22c55e";
}

// --- Event listeners ---
colorButtons.forEach(btn => {
    btn.addEventListener("click", () => setSelectedMode(btn.dataset.mode));
});

nextBtn.addEventListener("click", () => {
    stopTimer();
    const card = pickNextCard();
    if(card){
        showCard(card);
        startTimer();
    }
});

skipBtn.addEventListener("click", () => {
    if(currentCard) skippedCards.push(currentCard);
    updateCounters();
    const card = pickNextCard();
    if(card) showCard(card);
});

guessedBtn.addEventListener("click", () => {
    if(currentCard) guessedCards.push(currentCard);
    updateCounters();
    const card = pickNextCard();
    if(card) showCard(card);
});

const startGameBtn = document.getElementById("start-game-btn");
const resetGameBtn = document.getElementById("reset-game-btn");
const endGameBtn = document.getElementById("end-game-btn");

startGameBtn.addEventListener("click", () => {
    stopTimer();
    const card = pickNextCard();
    if(card){
        showCard(card);
        startTimer();
    }
});

resetGameBtn.addEventListener("click", () => {
    stopTimer();
    resetGame();
});

endGameBtn.addEventListener("click", () => {
    endGame();
});

// --- Inizializzazione ---
function initGame() {
    shuffleDecks();
    setSelectedMode(selectedMode);
    timerEl.firstChild.textContent = `Tempo: ${timeLeft}`;
    updateDeckInfo();
    updateCounters();
}

// --- Caricamento JSON ---
async function loadCards() {
    try {
        const response = await fetch('./assets/cards.json');
        const data = await response.json();

        tabooCards = data.taboo;
        drawCards = data.draw;
        mimeCards = data.mime;

        initGame();
    } catch (error) {
        console.error("Errore nel caricamento delle carte:", error);
    }
}

loadCards();
