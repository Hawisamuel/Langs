#!/usr/bin/env node

/**
 * Cyber Forensics Detective Game
 * A text-based adventure game where players solve digital crimes
 * using forensics and PKI concepts
 * 
 * Run: node cyber-forensics-game.js
 */

const readline = require('readline');
const crypto = require('crypto');

// ============================================================
// GAME CONFIGURATION
// ============================================================

const CONFIG = {
    GAME_NAME: '🔍 Cyber Forensics Detective',
    VERSION: '1.0.0',
    MAX_ATTEMPTS: 5,
    CASES: [
        'Digital Bank Heist',
        'Ransomware Attack',
        'Corporate Espionage',
        'Identity Theft Ring',
        'Cryptocurrency Fraud'
    ]
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function generateCaseId() {
    return `CASE-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ============================================================
// PKI SIMULATION
// ============================================================

class PKISimulator {
    constructor() {
        this.keys = {};
        this.generateKeyPair('system');
    }

    generateKeyPair(owner) {
        // Simulate RSA key pair using HMAC
        const privateKey = crypto.randomBytes(32).toString('hex');
        const publicKey = crypto.randomBytes(32).toString('hex');
        this.keys[owner] = { privateKey, publicKey };
        return this.keys[owner];
    }

    sign(data, owner = 'system') {
        const key = this.keys[owner];
        if (!key) throw new Error(`No keys for ${owner}`);
        const hmac = crypto.createHmac('sha256', key.privateKey);
        hmac.update(data);
        return hmac.digest('hex');
    }

    verify(data, signature, owner = 'system') {
        const key = this.keys[owner];
        if (!key) throw new Error(`No keys for ${owner}`);
        const hmac = crypto.createHmac('sha256', key.privateKey);
        hmac.update(data);
        const expected = hmac.digest('hex');
        return signature === expected;
    }

    getPublicKey(owner = 'system') {
        return this.keys[owner]?.publicKey || null;
    }
}

// ============================================================
// GAME CLASS
// ============================================================

class CyberForensicsGame {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.player = {
            name: '',
            score: 0,
            casesSolved: 0,
            badges: [],
            inventory: ['🔍 Magnifying Glass', '💻 Laptop'],
            level: 1,
            experience: 0
        };

        this.currentCase = null;
        this.caseHistory = [];
        this.pki = new PKISimulator();
        this.isGameOver = false;
        this.difficulty = 'medium';
        this.sessionId = sha256(Date.now().toString());
    }

    // ============================================================
    // DISPLAY METHODS
    // ============================================================

    displayBanner() {
        console.clear();
        console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ██████╗██╗   ██╗██████╗ ███████╗██████╗ ███████╗███╗   ██╗    ║
║  ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔════╝████╗  ██║    ║
║  ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝█████╗  ██╔██╗ ██║    ║
║  ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██╔══╝  ██║╚██╗██║    ║
║  ╚██████╗   ██║   ██████╔╝███████╗██║  ██║███████╗██║ ╚████║    ║
║   ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝    ║
║                                                                   ║
║   🔍 CYBER FORENSICS DETECTIVE - DIGITAL CRIME INVESTIGATION    ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
        `);
        console.log(`🔐 Session ID: ${this.sessionId.substring(0, 16)}...`);
        console.log(`📅 ${new Date().toLocaleString()}`);
        console.log(`👤 Player: ${this.player.name || 'Not logged in'}`);
        console.log(`⭐ Level: ${this.player.level} | XP: ${this.player.experience}`);
        console.log(`🏆 Cases Solved: ${this.player.casesSolved}`);
        console.log(`📊 Score: ${this.player.score}`);
        console.log('─'.repeat(63));
    }

    displayCaseIntro() {
        console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    📋 CASE FILE: ${this.currentCase.title.padEnd(30)}║
╠═══════════════════════════════════════════════════════════════════╣
║ ID: ${this.currentCase.id}                               ║
║ Priority: ${this.currentCase.priority}                             ║
║ Difficulty: ${this.currentCase.difficulty}                        ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  ${this.currentCase.description}                                    ║
║                                                                   ║
║  🎯 Objective: ${this.currentCase.objective}                       ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
        `);
    }

    displayClues() {
        console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    🔎 EVIDENCE & CLUES                          ║
╠═══════════════════════════════════════════════════════════════════╣
        `);
        
        this.currentCase.clues.forEach((clue, index) => {
            console.log(`  ${index + 1}. ${clue}`);
        });
        
        console.log(`
╠═══════════════════════════════════════════════════════════════════╣
║  💡 Suspects:                                                    ║
        `);
        
        this.currentCase.suspects.forEach((suspect, index) => {
            console.log(`     ${String.fromCharCode(65 + index)}. ${suspect.name} - ${suspect.role}`);
            console.log(`        ${suspect.alibi}`);
        });
        
        console.log(`
╚═══════════════════════════════════════════════════════════════════╝
        `);
    }

    // ============================================================
    // CASE GENERATION
    // ============================================================

    generateCase() {
        const caseTemplates = [
            {
                title: 'The Digital Bank Heist',
                description: 'A major bank has been hacked. $10M was transferred to unknown accounts. The attacker left digital footprints.',
                objective: 'Identify the attacker and recover the stolen funds',
                priority: 'Critical',
                clues: [
                    '🔑 SSH access logs show login from IP 203.0.113.45 at 3:14 AM',
                    '📧 Phishing email sent to bank employees with malicious attachment',
                    '💻 Malware binary found with signature matching "DarkRAT"',
                    '🌐 VPN connection established to TOR exit node',
                    '📱 Phone records show call to offshore number at 3:15 AM'
                ],
                suspects: [
                    { name: 'Alex Rivera', role: 'IT Administrator', alibi: 'Was at home, logged into VPN' },
                    { name: 'Dr. Sarah Chen', role: 'Bank Manager', alibi: 'In a meeting with clients' },
                    { name: 'James Wilson', role: 'Security Guard', alibi: 'Was patrolling the building' },
                    { name: 'Maria Santos', role: 'Software Developer', alibi: 'Working on a code deployment' }
                ],
                correctSuspect: 0,
                reward: 100
            },
            {
                title: 'Ransomware Attack',
                description: 'Hospital systems are encrypted by ransomware. Patient data is at risk. The attackers demand $5M in Bitcoin.',
                objective: 'Find the ransomware variant and the attacker\'s identity',
                priority: 'High',
                clues: [
                    '🔐 Ransom note demands payment to BTC address 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                    '🖥️ Infection started from a phishing email to the HR department',
                    '📊 Network traffic shows data exfiltration to 192.168.1.100',
                    '🔑 Registry keys modified: HKEY_CURRENT_USER\\Software\\Ransomware',
                    '📁 Files encrypted with .encrypted extension'
                ],
                suspects: [
                    { name: 'Emma Watson', role: 'HR Manager', alibi: 'Opened suspicious email' },
                    { name: 'David Kim', role: 'Network Admin', alibi: 'Was setting up a new firewall' },
                    { name: 'Lisa Park', role: 'Doctor', alibi: 'In surgery, 8 AM - 4 PM' },
                    { name: 'Tom Harris', role: 'IT Support', alibi: 'Helping users with password resets' }
                ],
                correctSuspect: 0,
                reward: 120
            },
            {
                title: 'Corporate Espionage',
                description: 'Trade secrets were leaked to a competitor. Internal documents were accessed without authorization.',
                objective: 'Determine the mole and recover the leaked documents',
                priority: 'High',
                clues: [
                    '📄 Documents accessed from IP 10.0.0.50 at 2 AM',
                    '👤 User account "jsmith" accessed the files (Jack Smith)',
                    '🔐 USB device connected at 2:15 AM, serial: USB-12345',
                    '📧 Email sent to competitor@rival.com with attachments',
                    '💬 Slack messages show suspicious communication'
                ],
                suspects: [
                    { name: 'Jack Smith', role: 'Software Engineer', alibi: 'Was working on a critical bug' },
                    { name: 'Alice Johnson', role: 'Product Manager', alibi: 'In a meeting with stakeholders' },
                    { name: 'Robert Chen', role: 'Security Analyst', alibi: 'Monitoring logs from home' },
                    { name: 'Karen White', role: 'Executive Assistant', alibi: 'Organizing executive schedules' }
                ],
                correctSuspect: 0,
                reward: 150
            },
            {
                title: 'Identity Theft Ring',
                description: 'Hundreds of user identities have been stolen from an e-commerce platform. Credit cards are being used fraudulently.',
                objective: 'Identify the source of the data breach and stop the theft',
                priority: 'Critical',
                clues: [
                    '🔓 Database accessed by unauthenticated query at 3 AM',
                    '📊 10,000 user records downloaded with credit card information',
                    '🌐 Traffic from AWS IP range 52.0.0.0/8',
                    '📱 Unauthorized API calls to /api/v2/users',
                    '🔑 Weak password policy allowed brute force attacks'
                ],
                suspects: [
                    { name: 'Michael Park', role: 'Database Admin', alibi: 'Was asleep at 3 AM' },
                    { name: 'Jessica Liu', role: 'API Developer', alibi: 'Was deploying code' },
                    { name: 'Chris Thompson', role: 'Cloud Engineer', alibi: 'Managing AWS infrastructure' },
                    { name: 'Amanda Lee', role: 'Data Analyst', alibi: 'Running reports until 4 AM' }
                ],
                correctSuspect: 1,
                reward: 200
            },
            {
                title: 'Cryptocurrency Fraud',
                description: 'A cryptocurrency exchange lost $50M in a sophisticated exploit. Smart contracts were manipulated.',
                objective: 'Trace the stolen funds and identify the attacker',
                priority: 'Critical',
                clues: [
                    '🪙 Ethereum transactions to address 0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
                    '💻 Smart contract vulnerability: reentrancy attack detected',
                    '🌐 IP address 45.33.22.11 used for attack',
                    '📱 Phone: +1 (555) 123-4567 registered to John Doe',
                    '🔑 Private key leaked on GitHub repository'
                ],
                suspects: [
                    { name: 'Vitalik Smith', role: 'Blockchain Developer', alibi: 'Was at a conference' },
                    { name: 'Satoshi Chen', role: 'Security Engineer', alibi: 'Reviewing smart contracts' },
                    { name: 'Diana Roberts', role: 'Exchange CEO', alibi: 'In investor meetings' },
                    { name: 'Max Turner', role: 'QA Engineer', alibi: 'Testing new features' }
                ],
                correctSuspect: 1,
                reward: 250
            }
        ];

        // Select a random case
        const template = caseTemplates[randomInt(0, caseTemplates.length - 1)];
        
        // Create the case with unique elements
        const caseObj = {
            ...template,
            id: generateCaseId(),
            difficulty: this.difficulty,
            status: 'active',
            attempts: 0,
            discovered: false,
            clues: shuffleArray([...template.clues]),
            suspects: shuffleArray([...template.suspects.map(s => ({...s}))]),
            // Adjust correct suspect index after shuffle
            correctSuspect: this._getCorrectSuspectIndex(template, template.suspects)
        };

        return caseObj;
    }

    _getCorrectSuspectIndex(template, shuffledSuspects) {
        const correctName = template.suspects[template.correctSuspect].name;
        return shuffledSuspects.findIndex(s => s.name === correctName);
    }

    // ============================================================
    // GAME LOGIC
    // ============================================================

    async startCase() {
        this.currentCase = this.generateCase();
        this.displayCaseIntro();
        await sleep(1000);
        await this.investigateCase();
    }

    async investigateCase() {
        let solved = false;
        let attempts = 0;

        while (!solved && attempts < CONFIG.MAX_ATTEMPTS && !this.isGameOver) {
            this.displayClues();
            
            const answer = await this.askQuestion(`
╔═══════════════════════════════════════════════════════════════════╗
║  🔍 Who is the culprit? (A, B, C, or D)                        ║
║  💡 Hint: ${this._getHint()}                                   ║
║  ⏳ Attempts remaining: ${CONFIG.MAX_ATTEMPTS - attempts}       ║
╠═══════════════════════════════════════════════════════════════════╣
║  Enter your choice (A/B/C/D): `, 'choice');

            const choice = answer.toUpperCase().trim();
            const suspectIndex = this._parseChoice(choice);
            
            if (suspectIndex === -1) {
                console.log('\n❌ Invalid choice. Please select A, B, C, or D.');
                continue;
            }

            attempts++;
            this.currentCase.attempts = attempts;

            if (suspectIndex === this.currentCase.correctSuspect) {
                console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    🎉 CASE SOLVED!                              ║
╠═══════════════════════════════════════════════════════════════════╣
║  ✅ Correct! ${this.currentCase.suspects[suspectIndex].name} was the culprit!      ║
║                                                                   ║
║  👤 ${this.currentCase.suspects[suspectIndex].name} (${this.currentCase.suspects[suspectIndex].role})  ║
║  📝 Confession: ${this._generateConfession()}                   ║
║                                                                   ║
║  🏆 Reward: ${this.currentCase.reward} XP + 🏅 Badge            ║
╚═══════════════════════════════════════════════════════════════════╝
                `);
                
                this.player.casesSolved++;
                this.player.score += this.currentCase.reward;
                this.player.experience += this.currentCase.reward;
                
                // Level up check
                this._checkLevelUp();
                
                // Award badge
                const badge = `🏅 ${this.currentCase.title}`;
                this.player.badges.push(badge);
                
                this.currentCase.discovered = true;
                this.currentCase.status = 'solved';
                this.caseHistory.push(this.currentCase);
                
                // PKI signing for evidence integrity
                const caseHash = sha256(JSON.stringify(this.currentCase));
                const signature = this.pki.sign(caseHash);
                console.log(`🔐 Evidence integrity hash: ${caseHash.substring(0, 16)}...`);
                console.log(`🔑 Signature: ${signature.substring(0, 16)}...`);

                solved = true;
                await this.continueGame();
                break;
            } else {
                console.log(`\n❌ Wrong! ${this.currentCase.suspects[suspectIndex].name} is not the culprit.`);
                console.log(`💡 Tip: ${this._getClue()}`);
                
                if (attempts >= CONFIG.MAX_ATTEMPTS) {
                    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    😔 CASE FAILED                               ║
╠═══════════════════════════════════════════════════════════════════╣
║  The culprit was: ${this.currentCase.suspects[this.currentCase.correctSuspect].name}  ║
║                                                                   ║
║  🔄 Case will be archived for future review.                    ║
╚═══════════════════════════════════════════════════════════════════╝
                    `);
                    this.currentCase.status = 'failed';
                    this.caseHistory.push(this.currentCase);
                    await this.continueGame();
                    break;
                }
            }
        }
    }

    _parseChoice(choice) {
        const map = {
            'A': 0, 'B': 1, 'C': 2, 'D': 3
        };
        return map[choice] !== undefined ? map[choice] : -1;
    }

    _getHint() {
        const clues = this.currentCase.clues;
        const hintIndex = Math.min(this.currentCase.attempts, clues.length - 1);
        return clues[hintIndex];
    }

    _getClue() {
        const clues = this.currentCase.clues;
        const used = Math.min(this.currentCase.attempts, clues.length - 1);
        const remaining = clues.slice(used + 1);
        return remaining.length > 0 ? remaining[0] : 'Re-examine all the evidence!';
    }

    _generateConfession() {
        const confessions = [
            'I thought I covered my tracks... but the digital evidence was too strong.',
            'The logs never lie. I should have known better.',
            'I was greedy. The money was just too tempting.',
            'I made a mistake. I left a digital fingerprint.',
            'The encryption was supposed to protect me, but I forgot about the metadata.'
        ];
        return confessions[randomInt(0, confessions.length - 1)];
    }

    _checkLevelUp() {
        const xpNeeded = this.player.level * 150;
        if (this.player.experience >= xpNeeded) {
            this.player.level++;
            this.player.experience -= xpNeeded;
            console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    ⭐ LEVEL UP!                                 ║
╠═══════════════════════════════════════════════════════════════════╣
║  Congratulations! You are now Level ${this.player.level}!            ║
║  🎯 Next level: ${(this.player.level + 1) * 150} XP needed      ║
╚═══════════════════════════════════════════════════════════════════╝
            `);
        }
    }

    async continueGame() {
        console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    📊 CASE STATUS                               ║
╠═══════════════════════════════════════════════════════════════════╣
║  🏆 Cases Solved: ${this.player.casesSolved}                     ║
║  ⭐ Current Level: ${this.player.level}                          ║
║  📈 XP: ${this.player.experience} / ${this.player.level * 150}  ║
║  🏅 Badges: ${this.player.badges.length > 0 ? this.player.badges.join(', ') : 'None yet!'}  ║
║  🔐 Session: ${this.sessionId.substring(0, 16)}...              ║
╚═══════════════════════════════════════════════════════════════════╝
        `);

        if (this.player.casesSolved >= 3) {
            console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    🏆 GAME COMPLETE!                            ║
╠═══════════════════════════════════════════════════════════════════╣
║  You have solved ${this.player.casesSolved} cases! You're a master  ║
║  cyber forensics detective!                                     ║
║                                                                   ║
║  🏆 Final Score: ${this.player.score}                           ║
║  ⭐ Final Level: ${this.player.level}                           ║
║  🏅 Badges: ${this.player.badges.length}                       ║
╚═══════════════════════════════════════════════════════════════════╝
            `);
            this.isGameOver = true;
            return;
        }

        const action = await this.askQuestion(`
╔═══════════════════════════════════════════════════════════════════╗
║  📋 What would you like to do?                                  ║
╠═══════════════════════════════════════════════════════════════════╣
║  N - Take a new case                                            ║
║  S - Show case history                                          ║
║  I - Inventory                                                  ║
║  Q - Quit game                                                  ║
╚═══════════════════════════════════════════════════════════════════╝
        `, 'action');

        switch (action.toUpperCase()) {
            case 'N':
                await this.startCase();
                break;
            case 'S':
                this.showHistory();
                await this.continueGame();
                break;
            case 'I':
                this.showInventory();
                await this.continueGame();
                break;
            case 'Q':
                this.isGameOver = true;
                console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    👋 GOODBYE DETECTIVE                        ║
╠═══════════════════════════════════════════════════════════════════╣
║  Thanks for playing! Your cases will be stored for review.     ║
║  Final Score: ${this.player.score}                              ║
║  Cases Solved: ${this.player.casesSolved}                      ║
║  Level: ${this.player.level}                                   ║
╚═══════════════════════════════════════════════════════════════════╝
                `);
                break;
            default:
                console.log('❌ Invalid option. Please select N, S, I, or Q.');
                await this.continueGame();
                break;
        }
    }

    showHistory() {
        if (this.caseHistory.length === 0) {
            console.log('\n📋 No cases completed yet.');
            return;
        }

        console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    📋 CASE HISTORY                              ║
╠═══════════════════════════════════════════════════════════════════╣
        `);

        this.caseHistory.forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.title} - ${c.status.toUpperCase()}`);
            console.log(`     ID: ${c.id}`);
            console.log(`     Culprit: ${c.suspects[c.correctSuspect].name}`);
            console.log(`     Difficulty: ${c.difficulty}`);
            console.log(`     Attempts: ${c.attempts}`);
            console.log(`     ${'-'.repeat(50)}`);
        });

        console.log(`
╚═══════════════════════════════════════════════════════════════════╝
        `);
    }

    showInventory() {
        console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    🎒 INVENTORY                                 ║
╠═══════════════════════════════════════════════════════════════════╣
        `);

        this.player.inventory.forEach(item => {
            console.log(`  ${item}`);
        });

        if (this.player.badges.length > 0) {
            console.log(`\n  🏅 Badges:`);
            this.player.badges.forEach(badge => {
                console.log(`     ${badge}`);
            });
        }

        console.log(`
╚═══════════════════════════════════════════════════════════════════╝
        `);
    }

    // ============================================================
    // PLAYER MANAGEMENT
    // ============================================================

    async welcome() {
        this.displayBanner();
        
        const name = await this.askQuestion('👤 Enter your detective name: ', 'name');
        this.player.name = name.trim() || 'Anonymous Detective';
        
        const difficulty = await this.askQuestion(`
📊 Select difficulty level:
   E - Easy
   M - Medium
   H - Hard
Choice: `, 'difficulty');

        switch (difficulty.toUpperCase()) {
            case 'E': this.difficulty = 'easy'; break;
            case 'M': this.difficulty = 'medium'; break;
            case 'H': this.difficulty = 'hard'; break;
            default: this.difficulty = 'medium';
        }

        console.log(`
✅ Welcome, Detective ${this.player.name}!
🔐 Difficulty: ${this.difficulty}
🔑 Your session is secured with PKI encryption.
📚 Prepare to solve some digital crimes!
        `);

        await sleep(1000);
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    askQuestion(prompt, type = 'text') {
        return new Promise((resolve) => {
            this.rl.question(prompt, (answer) => {
                resolve(answer);
            });
        });
    }

    // ============================================================
    // MAIN GAME LOOP
    // ============================================================

    async start() {
        console.clear();
        await this.welcome();
        
        while (!this.isGameOver) {
            await this.startCase();
        }

        this.rl.close();
        process.exit(0);
    }
}

// ============================================================
// ENTRY POINT
// ============================================================

console.clear();

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n\n👋 Thanks for playing! Goodbye.');
    process.exit(0);
});

// Start the game
const game = new CyberForensicsGame();
game.start().catch(err => {
    console.error('❌ Game Error:', err);
    process.exit(1);
});

module.exports = CyberForensicsGame;









//And for anyone who wouldn't know how to run it
# 1. Install Node.js (if not already installed)
# 2. Save the code as cyber-forensics-game.js
# 3. Open terminal
cd /path/to/your/file -> location where u saved your file
node cyber-forensics-game.js
