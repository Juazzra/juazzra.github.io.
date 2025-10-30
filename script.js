// --- VARIABEL GLOBAL ---
let deck = [];
let playerHand = [];
let dealerHand = [];
let gameActive = false;
let playerChips = 1000;
let currentBet = 0;
const cardValues = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 10, 'Q': 10, 'K': 10, 'A': 11
};

// --- FUNGSI PEMBANTU (HELPERS) ---

/** Membuat dek kartu baru dan mengocoknya. */
function createDeck() {
    deck = [];
    const ranks = Object.keys(cardValues);
    const suits = ['♠', '♥', '♦', '♣']; 
    
    for (const rank of ranks) {
        for (const suit of suits) {
            deck.push(rank + suit); // Contoh: 'A♠', '5♥'
        }
    }
    // Mengocok dek (Fisher-Yates Shuffle)
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// --- FUNGSI BARU UNTUK KOMENTAR DEALER ---

/**
 * Menampilkan komentar dari dealer di gelembung dialog.
 * @param {string} message - Teks yang akan ditampilkan.
 * @param {number} duration - Berapa lama (ms) gelembung akan tampil.
 */
function showDealerComment(message, duration = 2000) {
    const bubble = document.getElementById('dealer-bubble');
    bubble.textContent = message;
    bubble.classList.add('show');
    
    // Sembunyikan gelembung setelah durasi tertentu
    setTimeout(() => {
        bubble.classList.remove('show');
    }, duration - 100); // Sembunyikan sedikit lebih cepat agar siap untuk pesan berikutnya
}

/** Mengambil satu kartu dari dek. */
function dealCard() {
    return deck.pop();
}

/** Menghitung skor tangan (menangani Ace: 1 atau 11). */
function calculateScore(hand) {
    let score = 0;
    let aceCount = 0;
    const ranks = hand.map(card => card.slice(0, -1)); // Ambil rank saja (cth: 'K♥' -> 'K')

    for (const rank of ranks) {
        score += cardValues[rank];
        if (rank === 'A') {
            aceCount++;
        }
    }
    // Penyesuaian nilai Ace
    while (score > 21 && aceCount > 0) {
        score -= 10; // Mengurangi 10 (dari 11 menjadi 1)
        aceCount--;
    }
    return score;
}

// --- FUNGSI UPDATE TAMPILAN (UI) ---

/** Mengaktifkan/menonaktifkan tombol (FIX UNTUK 'STUCK') */
function enableControls(isGameActive) {
    document.getElementById('hit-btn').disabled = !isGameActive;
    document.getElementById('stand-btn').disabled = !isGameActive;
    document.getElementById('deal-btn').disabled = isGameActive;
    document.getElementById('bet-amount').disabled = isGameActive;
}

/** Memperbarui tampilan kartu, skor, dan chip di HTML. */
function updateUI(showDealerAll = false, animateDeal = false) {
    
    // Fungsi Pembantu untuk Memformat Kartu
    const formatCards = (hand, showHidden, animate) => {
        if (!hand.length) return '';
        
        return hand.map((card, index) => {
            const isHidden = !showHidden && index > 0; 
            const suit = card.slice(-1); 
            let rank = card.slice(0, -1); 
            
            let colorClass = (suit === '♥' || suit === '♦') ? 'red-suit' : '';

            // Logika untuk Animasi
            const animClass = animate ? 'deal-in' : '';
            // Tambahkan delay agar kartu tidak jatuh bersamaan
            const animStyle = animate ? `animation-delay: ${index * 150}ms` : ''; 

            if (isHidden) {
                // Kartu tersembunyi tidak perlu animasi
                return `<span class="card hidden"></span>`;
            } else {
                // Terapkan kelas dan style animasi
                return `<span class="card ${colorClass} ${animClass}" style="${animStyle}">${rank}<br>${suit}</span>`;
            }
        }).join(' ');
    };
    
    // Tampilan Chip
    document.getElementById('player-chips').textContent = playerChips;

    // Tampilan Pemain
    document.getElementById('player-cards').innerHTML = formatCards(playerHand, true, animateDeal);
    document.getElementById('player-score-display').textContent = calculateScore(playerHand);

    // Tampilan Dealer
    document.getElementById('dealer-cards').innerHTML = formatCards(dealerHand, showDealerAll, animateDeal);
    
    if (showDealerAll) {
        document.getElementById('dealer-score-display').textContent = calculateScore(dealerHand);
    } else if (dealerHand.length > 0) {
        // Tampilkan skor kartu pertama dealer
        const firstCardRank = dealerHand[0].slice(0, -1);
        document.getElementById('dealer-score-display').textContent = cardValues[firstCardRank];
    } else {
        document.getElementById('dealer-score-display').textContent = "?";
    }
}

// --- FUNGSI ALUR PERMAINAN (GAME FLOW) ---

/** Memulai atau mereset permainan ke kondisi awal. */
function startGame() {
    gameActive = false;
    playerChips = 1000;
    currentBet = 0;
    playerHand = [];
    dealerHand = [];
    
    document.getElementById('result-message').textContent = "Selamat datang! Silakan pasang taruhan Anda.";
    document.getElementById('bet-amount').value = 50;
    
    enableControls(false); // Nonaktifkan Hit/Stand, Aktifkan Deal
    updateUI(false); // Bersihkan meja
}

/** Fungsi BARU: Mengambil taruhan dan membagikan kartu awal. */
function dealInitialCards() {
    if (gameActive) return;

    const betInput = document.getElementById('bet-amount');
    const bet = parseInt(betInput.value);

    // Validasi taruhan
    if (isNaN(bet) || bet <= 0) {
        document.getElementById('result-message').textContent = "Taruhan harus angka positif.";
        return;
    }
    if (bet > playerChips) {
        document.getElementById('result-message').textContent = "Chip Anda tidak mencukupi!";
        return;
    }

    // Setel permainan
    currentBet = bet;
    playerChips -= currentBet;
    gameActive = true;
    
    document.getElementById('result-message').textContent = `Taruhan ${currentBet} dipasang. Semoga beruntung!`;
    
    createDeck();
    playerHand = [dealCard(), dealCard()];
    dealerHand = [dealCard(), dealCard()];

    enableControls(true); // Aktifkan Hit/Stand, Nonaktifkan Deal
    updateUI(false, true); // (false = jangan tunjukkan kartu dealer, true = animasikan!)

    // Cek Blackjack awal
    const playerScore = calculateScore(playerHand);
    if (playerScore === 21) {
        document.getElementById('result-message').textContent = "BLACKJACK! Giliran Dealer...";
        setTimeout(stand, 1000); // Otomatis 'Stand' jika Blackjack
    }
}

/** Fungsi yang dipanggil saat Pemain memilih 'Hit'. */
function hit() {
    if (!gameActive) return;
    
    playerHand.push(dealCard());
    updateUI(false); // 'false' agar tidak menganimasi kartu 'hit'
    
    const playerScore = calculateScore(playerHand);

    if (playerScore > 21) {
        document.getElementById('result-message').textContent = "BUST! Anda Melebihi 21.";
        endGame('player_bust'); // Pemain kalah
    } else if (playerScore === 21) {
        document.getElementById('result-message').textContent = "21! Giliran Dealer...";
        stand(); // Otomatis 'Stand' jika 21
    }
}

/** Fungsi yang dipanggil saat Pemain memilih 'Stand'. */
function stand() {
    if (!gameActive) return;
    gameActive = false; // Permainan sedang diproses, pemain tidak bisa klik lagi
    
    document.getElementById('result-message').textContent = "Dealer membuka kartu...";
    updateUI(true); // Tampilkan semua kartu Dealer (tanpa animasi)
    
    // Panggil logika dealer setelah jeda singkat
    setTimeout(dealerPlay, 1000);
}

/** Logika giliran Dealer (Musuh). */
function dealerPlay() {
    let dealerScore = calculateScore(dealerHand);
    
    // Aturan Dealer: Harus Hit jika skor di bawah 17
    if (dealerScore < 17) {
        document.getElementById('result-message').textContent = `Dealer 'Hit' (Skor ${dealerScore})...`;
        dealerHand.push(dealCard());
        updateUI(true);
        setTimeout(dealerPlay, 1000); // Ulangi pengecekan
    } else {
        // Dealer Stand (skor 17 atau lebih)
        document.getElementById('result-message').textContent = `Dealer 'Stand' (Skor ${dealerScore}).`;
        setTimeout(() => determineWinner(dealerScore), 1000);
    }
}

/** Menentukan pemenang (setelah dealer selesai). */
function determineWinner(dealerScore) {
    const playerScore = calculateScore(playerHand);

    if (dealerScore > 21) {
        endGame('dealer_bust');
    } else if (playerScore > dealerScore) {
        endGame('player_win');
    } else if (dealerScore > playerScore) {
        endGame('dealer_win');
    } else {
        endGame('push'); // Seri
    }
}

/** Mengakhiri putaran dan membagikan chip. */
function endGame(result) {
    gameActive = false;
    let message = "";
    let payout = 0;
    
    const playerScore = calculateScore(playerHand);
    const isPlayerBlackjack = (playerScore === 21 && playerHand.length === 2);

    if (result === 'player_bust') {
        message = `BUST! Anda kalah ${currentBet} chip.`;
        payout = 0;
    } else if (result === 'dealer_bust') {
        message = `DEALER BUST! Anda menang ${currentBet} chip.`;
        payout = currentBet * 2;
    } else if (result === 'player_win' && isPlayerBlackjack) {
        message = `BLACKJACK! Anda menang ${currentBet * 1.5} chip!`;
        payout = currentBet + (currentBet * 1.5); // Taruhan kembali + 1.5x
    } else if (result === 'player_win') {
        message = `ANDA MENANG! Anda menang ${currentBet} chip.`;
        payout = currentBet * 2;
    } else if (result === 'dealer_win') {
        message = `DEALER MENANG! Anda kalah ${currentBet} chip.`;
        payout = 0;
    } else if (result === 'push') {
        message = "PUSH (Seri)! Taruhan dikembalikan.";
        payout = currentBet;
    }

    playerChips += payout; // Tambahkan kemenangan ke saldo
    document.getElementById('result-message').textContent = message;
    
    // Periksa apakah pemain bangkrut
    if (playerChips <= 0) {
        document.getElementById('result-message').textContent = "Anda kehabisan Chip! Reset permainan.";
        document.getElementById('deal-btn').disabled = true;
    } else {
        enableControls(false); // Aktifkan lagi tombol Deal untuk putaran baru
    }
    
    updateUI(true); // Tampilkan semua kartu dan skor akhir
}

// --- INISIALISASI ---
// Memulai permainan saat halaman dimuat
window.onload = startGame;