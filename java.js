import { fulldictionary } from "./rjecnik.js";

// Filtriramo rječnik da sadrži samo riječi od 5 slova
const dictionary = fulldictionary.filter(word => word.length === 5);


const state = {
    secret: dictionary[Math.floor(Math.random() * dictionary.length)],
    grid: Array(6).fill().map(() => Array(5).fill('')), 
    currentRow: 0, 
    currentCol: 0, 
    isGameOver: false, 
};

// Ažurira mrežu za unos riječi
function updateGrid() {
    for (let i = 0; i < state.grid.length; i++) {
        for (let j = 0; j < state.grid[i].length; j++) {
            const box = document.getElementById(`box${i}${j}`);
            box.textContent = state.grid[i][j];
        }
    }
}

// Crta pojedinačnu kutiju u mreži
function drawBox(container, red, stupac, slovo = '') {
    const box = document.createElement('div');
    box.className = 'box';
    box.id = `box${red}${stupac}`;
    box.textContent = slovo;
    container.appendChild(box);
    return box;
}

// Crta cijelu mrežu za unos riječi
function drawGrid(container) {
    const grid = document.createElement('div');
    grid.className = 'grid';

    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 5; j++) {
            drawBox(grid, i, j);
        }
    }
    container.appendChild(grid);
}

// Crta tipkovnicu ispod mreže
function drawKeyboard(container) {
    const keyboard = document.createElement('div');
    keyboard.className = 'keyboard';

    const rows = [
        'qwertzuiopšđ',
        'asdfghjklčćž',
        'yxcvbnm'
    ];

    rows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        row.split('').forEach(key => {
            const keyDiv = document.createElement('div');
            keyDiv.className = 'key';
            keyDiv.id = `key-${key}`;
            keyDiv.textContent = key;
            rowDiv.appendChild(keyDiv);
        });
        keyboard.appendChild(rowDiv);
    });

    container.appendChild(keyboard);
}

// Ažurira boje tipki na tipkovnici na temelju statusa slova
function updateKeyboard() {
    const guessedLetters = new Set(state.grid.flat());
    guessedLetters.forEach(letter => {
        if (letter) {
            const keyDiv = document.getElementById(`key-${letter}`);
            keyDiv.classList.remove('correct', 'incorrect', 'missed'); // Ukloni sve prethodne klase

            if (state.secret.includes(letter)) {
                const correctPositions = state.secret.split('').reduce((acc, char, index) => {
                    if (char === letter) acc.push(index);
                    return acc;
                }, []);
                const guessedPositions = state.grid.flatMap((row, rowIndex) => 
                    row.map((char, colIndex) => char === letter ? colIndex : -1).filter(index => index !== -1)
                );

                const isCorrect = correctPositions.some(pos => guessedPositions.includes(pos));
                if (isCorrect) {
                    keyDiv.classList.add('correct');
                } else {
                    keyDiv.classList.add('incorrect');
                }
            } else {
                keyDiv.classList.add('missed');
            }
        }
    });
}

// Registrira događaje tipkovnice za unos slova
function registerKeyboardEvents() {
    document.body.onkeydown = (e) => {
        if (state.isGameOver) return; // Onemogući unos ako je igra završena

        const key = e.key.toLowerCase(); // Pretvaramo u malo slovo
        if (key === 'enter') {
            if (state.currentCol === 5) {
                const word = getCurrentWord();
                if (isWordValid(word)) {
                    revealWord(word);
                    state.currentRow++;
                    state.currentCol = 0;
                } else {
                    alert('Nije ispravna riječ.');
                }
            }
        }
        if (key === 'backspace') {
            removeLetter();
        }
        if (isLetter(key)) {
            addLetter(key);
        }
        updateGrid();
    };
}

// Dohvaća trenutnu riječ iz mreže
function getCurrentWord() {
    return state.grid[state.currentRow].join('');
}

// Otkriva riječ i ažurira boje kutija i tipkovnice
function revealWord(guess) {
    const row = state.currentRow;
    const letterCount = {};

    // Prvo prolazimo kroz riječ i brojimo pojavljivanja svakog slova
    for (let i = 0; i < state.secret.length; i++) {
        const letter = state.secret[i];
        if (!letterCount[letter]) {
            letterCount[letter] = 0;
        }
        letterCount[letter]++;
    }

    // Prvo prolazimo kroz riječ i označavamo točna slova
    for (let i = 0; i < 5; i++) {
        const box = document.getElementById(`box${row}${i}`);
        const letter = box.textContent;
        setTimeout(() => {
            box.classList.add('revealing');
            if (letter === state.secret[i]) {
                setTimeout(() => {
                    box.classList.add('tocno');
                    box.classList.remove('revealing');
                }, 500);
                letterCount[letter]--;
            } else if (state.secret.includes(letter) && letterCount[letter] > 0) {
                setTimeout(() => {
                    box.classList.add('krivo');
                    box.classList.remove('revealing');
                }, 500);
                letterCount[letter]--;
            } else {
                setTimeout(() => {
                    box.classList.add('prazno');
                    box.classList.remove('revealing');
                }, 500);
            }
        }, 500 * i); // Dodajemo kašnjenje za animaciju
    }

    setTimeout(updateKeyboard, 2500); // Ažuriraj tipkovnicu nakon otkrivanja riječi

    const isWinner = state.secret === guess;
    const isGameOver = state.currentRow === 5;

    if (isWinner) {
        setTimeout(() => {
            alert('Čestitamo!');
            state.isGameOver = true;
        }, 3000);
    } else if (isGameOver) {
        setTimeout(() => {
            alert(`Više sreće idući put! Riječ je bila: ${state.secret}`);
            state.isGameOver = true;
        }, 3000);
    }
}

// Resetira igru na početno stanje
function resetGame() {
    state.secret = dictionary[Math.floor(Math.random() * dictionary.length)];
    state.grid = Array(6).fill().map(() => Array(5).fill(''));
    state.currentRow = 0;
    state.currentCol = 0;
    state.isGameOver = false;
    document.getElementById('igra').innerHTML = '';
    start();
}


document.getElementById('restart-button').onclick = resetGame;


function isLetter(key) {
    return key.length === 1 && key.match(/[a-zčćđšž]/i);
}


function isWordValid(word) {
    return dictionary.includes(word);
}

// Dodaje slovo u mrežu
function addLetter(letter) {
    if (state.currentCol === 5) return;
    state.grid[state.currentRow][state.currentCol] = letter;
    state.currentCol++;
}

// Uklanja slovo iz mreže
function removeLetter() {
    if (state.currentCol === 0) return;
    state.grid[state.currentRow][state.currentCol - 1] = '';
    state.currentCol--;
}

// Pokreće igru
function start() {
    const igra = document.getElementById('igra');
    drawGrid(igra);
    drawKeyboard(igra); // Crta tipkovnicu
    registerKeyboardEvents(); // Registrira događaje tipkovnice
    console.log(`Tajna riječ je: ${state.secret}`); // Ispis tajne riječi u konzolu
}

start();