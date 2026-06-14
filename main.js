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
            score: 0,
            gameOver: false,
            level: 1,
            dropCounter: 0,
            dropInterval: 1000, // ms
            lastTime: 0
        };
    }

    connectedCallback() {
        this.render();
        this.initGame();
        this.setupControls();
        this.gameLoop();
    }

    createGrid() {
        return Array.from({ length: this.ROWS }, () => Array(this.COLS).fill(0));
    }

    initGame() {
        this.spawnPiece();
    }

    spawnPiece() {
        const types = Object.keys(this.SHAPES);
        const type = types[Math.floor(Math.random() * types.length)];
        this.state.activePiece = {
            type,
            shape: this.SHAPES[type],
            pos: { x: Math.floor(this.COLS / 2) - 1, y: 0 }
        };

        if (this.collide()) {
            this.state.gameOver = true;
        }
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
        if (this.state.gameOver) return;
        const piece = this.state.activePiece;
        const prevShape = piece.shape;
        piece.shape = piece.shape[0].map((_, i) => piece.shape.map(row => row[i]).reverse());
        if (this.collide()) {
            piece.shape = prevShape;
        }
        this.draw();
    }

    move(dir) {
        if (this.state.gameOver) return;
        this.state.activePiece.pos.x += dir;
        if (this.collide()) {
            this.state.activePiece.pos.x -= dir;
        }
        this.draw();
    }

    drop() {
        if (this.state.gameOver) return;
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
        if (this.state.gameOver) return;
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
        if (this.state.gameOver) {
            this.drawGameOver();
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

    draw() {
        const ctx = this.ctx;
        if (!ctx) return;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.state.grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.drawBlock(x, y, this.COLORS[value]);
                }
            });
        });

        // Draw active piece
        if (this.state.activePiece) {
            const { shape, pos, type } = this.state.activePiece;
            shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        this.drawBlock(pos.x + x, pos.y + y, this.COLORS[type]);
                    }
                });
            });
        }
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * this.BLOCK_SIZE, y * this.BLOCK_SIZE, this.BLOCK_SIZE, this.BLOCK_SIZE);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.strokeRect(x * this.BLOCK_SIZE, y * this.BLOCK_SIZE, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        // Add neon glow effect
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = color;
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '30px "Segoe UI"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.font = '20px "Segoe UI"';
        this.ctx.fillText(`Score: ${this.state.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
        this.ctx.fillText('Click to Restart', this.canvas.width / 2, this.canvas.height / 2 + 80);
    }

    updateUI() {
        this.shadowRoot.getElementById('score').textContent = this.state.score;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 20px;
                    background: #111;
                    border-radius: 10px;
                }
                canvas {
                    border: 2px solid #333;
                    background: #000;
                    width: 100%;
                    max-width: 300px;
                    height: auto;
                }
                .stats {
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    font-family: 'Courier New', Courier, monospace;
                    color: oklch(70% 0.3 150);
                    text-shadow: 0 0 5px oklch(70% 0.3 150);
                }
            </style>
            <div class="stats">
                <span>SCORE: <span id="score">0</span></span>
                <span>LEVEL: <span id="level">1</span></span>
            </div>
            <canvas id="tetris" width="${this.COLS * this.BLOCK_SIZE}" height="${this.ROWS * this.BLOCK_SIZE}"></canvas>
        `;
        this.canvas = this.shadowRoot.getElementById('tetris');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.addEventListener('click', () => {
            if (this.state.gameOver) {
                this.state = {
                    grid: this.createGrid(),
                    activePiece: null,
                    score: 0,
                    gameOver: false,
                    level: 1,
                    dropCounter: 0,
                    dropInterval: 1000,
                    lastTime: 0
                };
                this.initGame();
                this.updateUI();
                this.gameLoop();
            }
        });
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
