class TetrisGame extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Game constants
        this.ROWS = 20;
        this.COLS = 10;
        this.BLOCK_SIZE = 30;
        
        // Tetromino shapes
        this.SHAPES = {
            'I': [[1, 1, 1, 1]],
            'J': [[1, 0, 0], [1, 1, 1]],
            'L': [[0, 0, 1], [1, 1, 1]],
            'O': [[1, 1], [1, 1]],
            'S': [[0, 1, 1], [1, 1, 0]],
            'T': [[0, 1, 0], [1, 1, 1]],
            'Z': [[1, 1, 0], [0, 1, 1]]
        };
        
        this.COLORS = {
            'I': 'oklch(70% 0.3 190)',
            'J': 'oklch(70% 0.3 250)',
            'L': 'oklch(70% 0.3 40)',
            'O': 'oklch(70% 0.3 90)',
            'S': 'oklch(70% 0.3 140)',
            'T': 'oklch(70% 0.3 300)',
            'Z': 'oklch(70% 0.3 20)'
        };

        this.state = {
            grid: this.createGrid(),
            activePiece: null,
            nextPieces: [],
            score: 0,
            gameOver: false,
            gameStarted: false,
            level: 1,
            dropCounter: 0,
            dropInterval: 1000,
            lastTime: 0
        };
    }

    connectedCallback() {
        this.render();
        this.setupControls();
        this.drawEmpty();
    }

    createGrid() {
        return Array.from({ length: this.ROWS }, () => Array(this.COLS).fill(0));
    }

    startGame() {
        this.state = {
            ...this.state,
            grid: this.createGrid(),
            score: 0,
            gameOver: false,
            gameStarted: true,
            nextPieces: [this.getRandomType(), this.getRandomType()],
            lastTime: performance.now()
        };
        this.spawnPiece();
        this.updateUI();
        this.gameLoop();
        this.shadowRoot.getElementById('start-screen').style.display = 'none';
    }

    getRandomType() {
        const types = Object.keys(this.SHAPES);
        return types[Math.floor(Math.random() * types.length)];
    }

    spawnPiece() {
        const type = this.state.nextPieces.shift();
        this.state.nextPieces.push(this.getRandomType());
        
        this.state.activePiece = {
            type,
            shape: this.SHAPES[type],
            pos: { x: Math.floor(this.COLS / 2) - 1, y: 0 }
        };

        if (this.collide()) {
            this.state.gameOver = true;
            this.state.gameStarted = false;
        }
        this.drawNextPieces();
    }

    collide() {
        if (!this.state.activePiece) return false;
        const { shape, pos } = this.state.activePiece;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x] !== 0) {
                    const newX = pos.x + x;
                    const newY = pos.y + y;
                    if (newX < 0 || newX >= this.COLS || 
                        newY >= this.ROWS ||
                        (newY >= 0 && this.state.grid[newY][newX] !== 0)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    rotate() {
        if (!this.state.gameStarted || this.state.gameOver) return;
        const piece = this.state.activePiece;
        const prevShape = piece.shape;
        piece.shape = piece.shape[0].map((_, i) => piece.shape.map(row => row[i]).reverse());
        if (this.collide()) {
            piece.shape = prevShape;
        }
        this.draw();
    }

    move(dir) {
        if (!this.state.gameStarted || this.state.gameOver) return;
        this.state.activePiece.pos.x += dir;
        if (this.collide()) {
            this.state.activePiece.pos.x -= dir;
        }
        this.draw();
    }

    drop() {
        if (!this.state.gameStarted || this.state.gameOver) return;
        this.state.activePiece.pos.y++;
        if (this.collide()) {
            this.state.activePiece.pos.y--;
            this.merge();
            this.clearLines();
            this.spawnPiece();
        }
        this.state.dropCounter = 0;
        this.draw();
    }

    hardDrop() {
        if (!this.state.gameStarted || this.state.gameOver) return;
        while (!this.collide()) {
            this.state.activePiece.pos.y++;
        }
        this.state.activePiece.pos.y--;
        this.merge();
        this.clearLines();
        this.spawnPiece();
        this.draw();
    }

    merge() {
        const { shape, pos, type } = this.state.activePiece;
        shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const targetY = pos.y + y;
                    if (targetY >= 0) {
                        this.state.grid[targetY][pos.x + x] = type;
                    }
                }
            });
        });
    }

    clearLines() {
        let linesCleared = 0;
        for (let y = this.ROWS - 1; y >= 0; y--) {
            if (this.state.grid[y].every(value => value !== 0)) {
                this.state.grid.splice(y, 1);
                this.state.grid.unshift(Array(this.COLS).fill(0));
                linesCleared++;
                y++;
            }
        }
        if (linesCleared > 0) {
            this.state.score += [0, 100, 300, 500, 800][linesCleared] * this.state.level;
            this.updateUI();
        }
    }

    setupControls() {
        window.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') this.move(-1);
            if (e.key === 'ArrowRight') this.move(1);
            if (e.key === 'ArrowDown') this.drop();
            if (e.key === 'ArrowUp') this.rotate();
            if (e.key === ' ') this.hardDrop();
        });
    }

    gameLoop(time = 0) {
        if (!this.state.gameStarted) {
            if (this.state.gameOver) this.drawGameOver();
            return;
        }

        const deltaTime = time - this.state.lastTime;
        this.state.lastTime = time;
        this.state.dropCounter += deltaTime;

        if (this.state.dropCounter > this.state.dropInterval) {
            this.drop();
        }

        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    drawEmpty() {
        if (!this.ctx) return;
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGridLines();
    }

    drawGridLines() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.setLineDash([5, 5]);
        for (let x = 0; x <= this.COLS; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        this.ctx.setLineDash([]);
    }

    draw() {
        const ctx = this.ctx;
        if (!ctx) return;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGridLines();

        // Draw grid
        this.state.grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.drawBlock(ctx, x, y, this.COLORS[value]);
                }
            });
        });

        // Draw active piece
        if (this.state.activePiece) {
            const { shape, pos, type } = this.state.activePiece;
            shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        this.drawBlock(ctx, pos.x + x, pos.y + y, this.COLORS[type]);
                    }
                });
            });
        }
    }

    drawBlock(ctx, x, y, color, size = this.BLOCK_SIZE) {
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.fillRect(x * size, y * size, size, size);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.strokeRect(x * size, y * size, size, size);
        ctx.shadowBlur = 0;
    }

    drawNextPieces() {
        const nextCtx = this.nextCtx;
        if (!nextCtx) return;
        nextCtx.fillStyle = '#111';
        nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        this.state.nextPieces.forEach((type, index) => {
            const shape = this.SHAPES[type];
            const color = this.COLORS[type];
            const offsetX = (this.nextCanvas.width / 2 / 20) - (shape[0].length / 2);
            const offsetY = (index * 4) + 1;

            shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        this.drawBlock(nextCtx, offsetX + x, offsetY + y, color, 20);
                    }
                });
            });
        });
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 30px "Segoe UI"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.font = '20px "Segoe UI"';
        this.ctx.fillText(`Final Score: ${this.state.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        this.shadowRoot.getElementById('start-screen').style.display = 'flex';
        this.shadowRoot.querySelector('#start-screen button').textContent = 'RESTART';
    }

    updateUI() {
        this.shadowRoot.getElementById('score').textContent = this.state.score;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    flex-direction: row;
                    gap: 20px;
                    padding: 20px;
                    background: #111;
                    border-radius: 15px;
                    position: relative;
                    width: fit-content;
                }
                .game-container {
                    position: relative;
                    border: 4px solid var(--neon-blue, #00f2ff);
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 0 20px rgba(0, 242, 255, 0.2);
                    width: ${this.COLS * this.BLOCK_SIZE}px;
                    height: ${this.ROWS * this.BLOCK_SIZE}px;
                }
                canvas#tetris {
                    display: block;
                    background: #000;
                }
                .side-panel {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    min-width: 120px;
                }
                .stats-box, .next-box {
                    background: #000;
                    border: 2px solid #333;
                    padding: 10px;
                    border-radius: 8px;
                    text-align: center;
                }
                .label {
                    font-size: 0.7rem;
                    color: #888;
                    margin-bottom: 5px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .value {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 1.2rem;
                    color: oklch(70% 0.3 150);
                    text-shadow: 0 0 5px oklch(70% 0.3 150);
                }
                #start-screen {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.85);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    z-index: 100;
                }
                #start-screen button {
                    background: transparent;
                    border: 2px solid #ff007f;
                    color: #ff007f;
                    padding: 15px 30px;
                    font-size: 1.2rem;
                    font-weight: bold;
                    cursor: pointer;
                    border-radius: 50px;
                    transition: all 0.3s;
                    box-shadow: 0 0 15px rgba(255, 0, 127, 0.3);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                #start-screen button:hover {
                    background: #ff007f;
                    color: #000;
                    box-shadow: 0 0 30px rgba(255, 0, 127, 0.6);
                }
                canvas#next {
                    background: #111;
                    margin-top: 5px;
                }
                @media (max-width: 600px) {
                    :host { flex-direction: column; align-items: center; }
                    .side-panel { flex-direction: row; width: 100%; justify-content: space-around; }
                }
            </style>
            <div class="game-container">
                <canvas id="tetris" width="${this.COLS * this.BLOCK_SIZE}" height="${this.ROWS * this.BLOCK_SIZE}"></canvas>
                <div id="start-screen">
                    <button id="start-btn">START GAME</button>
                </div>
            </div>
            <div class="side-panel">
                <div class="stats-box">
                    <div class="label">Score</div>
                    <div class="value" id="score">0</div>
                    <div class="label" style="margin-top:10px">Level</div>
                    <div class="value" id="level">1</div>
                </div>
                <div class="next-box">
                    <div class="label">Next</div>
                    <canvas id="next" width="80" height="160"></canvas>
                </div>
            </div>
        `;
        
        this.canvas = this.shadowRoot.getElementById('tetris');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = this.shadowRoot.getElementById('next');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.shadowRoot.getElementById('start-btn').addEventListener('click', () => this.startGame());
    }
}

customElements.define('tetris-game', TetrisGame);

// Wire up mobile controls
const game = document.querySelector('tetris-game');
document.getElementById('btn-left').addEventListener('click', () => game.move(-1));
document.getElementById('btn-right').addEventListener('click', () => game.move(1));
document.getElementById('btn-up').addEventListener('click', () => game.rotate());
document.getElementById('btn-down').addEventListener('click', () => game.drop());
document.getElementById('btn-drop').addEventListener('click', () => game.hardDrop());
