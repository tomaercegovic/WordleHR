import { fulldictionary } from "./rjecnik.js";

// Filtriramo rječnik da sadrži samo riječi od 5 slova
const dictionary = fulldictionary.filter(word => word.length === 5);

const digraphs = ['nj', 'lj', 'dž'];
const ligatures = { 'nj': 'ǌ', 'lj': 'ǉ', 'dž': 'ǆ' };
const digraphFromLig = { 'ǌ': 'nj', 'ǉ': 'lj', 'ǆ': 'dž' };

const state = {
    secret: dictionary[Math.floor(Math.random() * dictionary.length)],
    grid: Array(6).fill().map(() => Array(5).fill('')),
    currentRow: 0,
    currentCol: 0,
    isGameOver: false,
};

// Zamijeni digrafe s ligaturama za provjeru riječi
function toLigatures(word) {
    return word
        .replace(/dž/g, 'ǆ')
        .replace(/nj/g, 'ǌ')
        .replace(/lj/g, 'ǉ');
}

// Zamijeni ligature s digrafima za prikaz (ako želiš prikazivati "lj", "nj", "dž" u gridu)
function fromLigatures(word) {
    return word
        .replace(/ǆ/g, 'dž')
        .replace(/ǌ/g, 'nj')
        .replace(/ǉ/g, 'lj');
}

// Ažurira mrežu za unos riječi
function updateGrid() {
    for (let i = 0; i < state.grid.length; i++) {
        for (let j = 0; j < state.grid[i].length; j++) {
            const box = document.getElementById(`box${i}${j}`);
            // Prikazuj digrafe, ne ligature
            box.textContent = fromLigatures(state.grid[i][j]);
        }
    }
}

// Crta pojedinačnu kutiju u mreži
function drawBox(container, red, stupac, slovo = '') {
    const box = document.createElement('div');
    box.className = 'box';
    box.id = `box${red}${stupac}`;
    box.textContent = fromLigatures(slovo);
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
        'nj lj dž yxcvbnm'
    ];

    rows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        row.split(' ').forEach(keyGroup => {
            if (digraphs.includes(keyGroup)) {
                // Dodaj tipku za digraf
                const keyDiv = document.createElement('div');
                keyDiv.className = 'key';
                keyDiv.id = `key-${keyGroup}`;
                keyDiv.textContent = keyGroup;
                keyDiv.onclick = () => {
                    if (!state.isGameOver) addLetter(keyGroup);
                };
                rowDiv.appendChild(keyDiv);
            } else {
                // Dodaj pojedinačna slova
                keyGroup.split('').forEach(key => {
                    const keyDiv = document.createElement('div');
                    keyDiv.className = 'key';
                    keyDiv.id = `key-${key}`;
                    keyDiv.textContent = key;
                    keyDiv.onclick = () => {
                        if (!state.isGameOver) addLetter(key);
                    };
                    rowDiv.appendChild(keyDiv);
                });
            }
        });
        keyboard.appendChild(rowDiv);
    });

    container.appendChild(keyboard);
}

// Ažurira boje tipki na tipkovnici na temelju statusa slova
function updateKeyboard() {
    // Pronađi sva slova i digrafe koji su uneseni
    const guessedLetters = new Set(state.grid.flat().filter(Boolean));
    guessedLetters.forEach(letter => {
        const keyDiv = document.getElementById(`key-${fromLigatures(letter)}`);
        if (!keyDiv) return;
        keyDiv.classList.remove('correct', 'incorrect', 'missed');

        // Pronađi sva mjesta gdje se to slovo/digraf pojavljuje u gridu
        let isCorrect = false;
        let isPresent = false;
        for (let row = 0; row <= state.currentRow; row++) {
            for (let col = 0; col < 5; col++) {
                const gridLetter = state.grid[row][col];
                if (!gridLetter) continue;
                if (gridLetter === letter) {
                    // Ako je na pravom mjestu
                    if (state.secret[col] === letter) {
                        isCorrect = true;
                    } else if (state.secret.includes(letter)) {
                        isPresent = true;
                    }
                }
            }
        }

        if (isCorrect) {
            keyDiv.classList.add('correct');
        } else if (isPresent) {
            keyDiv.classList.add('incorrect');
        } else {
            keyDiv.classList.add('missed');
        }
    });
}
// Provjerava je li uneseni znak slovo (uključujući hrvatska slova)
function isLetter(key) {
    return key.length === 1 && key.match(/[a-zčćđšž]/i);
}

// Provjerava je li kombinacija zadnjeg slova i novog slova digraf
function isDigraph(prev, curr) {
    return digraphs.includes((prev + curr).toLowerCase());
}

// Dodaje slovo ili digraf u mrežu
function addLetter(letter) {
    // Provjera za digraf kod tipkanja (spajanje prethodnog slova i trenutnog u ligaturu)
    if (state.currentCol > 0) {
        const prev = state.grid[state.currentRow][state.currentCol - 1];
        if (prev && isDigraph(fromLigatures(prev), letter)) {
            state.grid[state.currentRow][state.currentCol - 1] = ligatures[fromLigatures(prev) + letter];
            updateGrid();
            return;
        }
    }

    // Ako je digraf s tipkovnice, upiši ga kao ligaturu
    if (digraphs.includes(letter)) {
        if (state.currentCol < 5) {
            state.grid[state.currentRow][state.currentCol] = ligatures[letter];
            state.currentCol++;
            updateGrid();
        }
        return;
    }

    // Ako smo već na kraju, ne dodajemo više
    if (state.currentCol === 5) return;

    // Inače upiši jedno slovo
    state.grid[state.currentRow][state.currentCol] = letter;
    state.currentCol++;
    updateGrid();
}

// Uklanja slovo ili digraf iz mreže
function removeLetter() {
    if (state.currentCol === 0) return;
    const prev = state.grid[state.currentRow][state.currentCol - 1];
    if (Object.values(ligatures).includes(prev)) {
        state.grid[state.currentRow][state.currentCol - 1] = '';
        state.currentCol--;
    } else if (prev && prev.length === 2 && digraphs.includes(fromLigatures(prev).toLowerCase())) {
        state.grid[state.currentRow][state.currentCol - 1] = '';
        state.currentCol--;
    } else {
        state.grid[state.currentRow][state.currentCol - 1] = '';
        state.currentCol--;
    }
    updateGrid();
}

// Dohvaća trenutnu riječ iz mreže (spaja sva polja)
function getCurrentWord() {
    return state.grid[state.currentRow].join('');
}

// Otkriva riječ i ažurira boje kutija i tipkovnice
function revealWord(guess) {
    const row = state.currentRow;
    const ligatureGuess = toLigatures(guess);
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
        const letter = state.grid[row][i];
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
        }, 500 * i);
    }

    setTimeout(updateKeyboard, 2500);

    const isWinner = state.secret === ligatureGuess;
    const isGameOver = state.currentRow === 5;

    if (isWinner) {
        setTimeout(() => {
            alert('Čestitamo!');
            state.isGameOver = true;
        }, 3000);
    } else if (isGameOver) {
        setTimeout(() => {
            alert(`Više sreće idući put! Riječ je bila: ${fromLigatures(state.secret)}`);
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

// Provjerava je li riječ valjana (nalazi li se u rječniku)
function isWordValid(word) {
    return dictionary.includes(toLigatures(word));
}

// Registrira događaje tipkovnice za unos slova
function registerKeyboardEvents() {
    document.body.onkeydown = (e) => {
        if (state.isGameOver) return;

        const key = e.key.toLowerCase();
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

// Pokreće igru
function start() {
    const igra = document.getElementById('igra');
    drawGrid(igra);
    drawKeyboard(igra);
    registerKeyboardEvents();
    updateGrid();
    console.log(`Tajna riječ je: ${fromLigatures(state.secret)}`);
}

start();