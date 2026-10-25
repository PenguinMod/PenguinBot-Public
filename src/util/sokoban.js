// DISCLOSURE: Sokoban Client made by ChatG... MubiLop

class Sokoban {
    constructor(state, emojis = {}) {
        this.defaultEmojis = {
                wall: '🟥',
                player: '😐',
                empty: '⬛',
                goal: '🎯',
                box: '📦'
        };
        this.emojis = { ...this.defaultEmojis, ...emojis };

        if (state) {
            this.level = state.level;
            this.playerPosition = state.playerPosition;
            this.levelNumber = state.levelNumber || 1;
            this.goals = state.goals || [];
        } else {
            this.levelNumber = 1;
            this.generateNewLevel();
        }
    }

    generateRandomLevel() {
        const minSize = 5;
        const maxSize = 10;
        const size = Math.min(minSize + this.levelNumber, maxSize); // Increase size with levels
        const level = Array.from({ length: size }, () => Array(size).fill(' '));
        this.goals = [];

        // Place walls around the level
        for (let i = 0; i < size; i++) {
            level[0][i] = '#';
            level[size - 1][i] = '#';
            level[i][0] = '#';
            level[i][size - 1] = '#';
        }

        // Place player
        level[1][1] = '@';

        // Place goals
        const goalCount = Math.min(1 + Math.floor(this.levelNumber / 2), size - 2);
        for (let i = 0; i < goalCount; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * (size - 2)) + 1;
                y = Math.floor(Math.random() * (size - 2)) + 1;
            } while (level[y][x] !== ' ');
            level[y][x] = '.';
            this.goals.push({ x, y });
        }

        // Place boxes
        const boxCount = Math.min(1 + Math.floor(this.levelNumber / 2), size - 2);
        for (let i = 0; i < boxCount; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * (size - 2)) + 1;
                y = Math.floor(Math.random() * (size - 2)) + 1;
            } while (level[y][x] !== ' ' || this.isCornerOrEdge(level, x, y));
            level[y][x] = '$';
        }

        // Place additional walls only for higher levels
        if (this.levelNumber > 3) {
            const wallCount = Math.min(2 + this.levelNumber, size);
            for (let i = 0; i < wallCount; i++) {
                let x, y;
                do {
                    x = Math.floor(Math.random() * (size - 2)) + 1;
                    y = Math.floor(Math.random() * (size - 2)) + 1;
                } while (level[y][x] !== ' ');
                level[y][x] = '#';
            }
        }

        return level.map(row => row.join(''));
    }

    isCornerOrEdge(level, x, y) {
        const size = level.length;

        // Check if the position is a corner
        if ((x === 1 || x === size - 2) && (y === 1 || y === size - 2)) {
            return true;
        }

        // Check if the position is next to a wall
        if (level[y][x - 1] === '#' || level[y][x + 1] === '#' || level[y - 1][x] === '#' || level[y + 1][x] === '#') {
            return true;
        }

        return false;
    }

    isSolvable(level) {
        const directions = [
            { x: 0, y: -1 }, // up
            { x: 0, y: 1 },  // down
            { x: -1, y: 0 }, // left
            { x: 1, y: 0 }   // right
        ];

        const height = level.length;
        const width = level[0].length;
        const visited = new Set();
        let playerPosition;

        // Find player position
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (level[y][x] === '@') {
                    playerPosition = { x, y };
                    break;
                }
            }
        }

        const dfs = (x, y) => {
            // Boundary checks
            if (x < 0 || x >= width || y < 0 || y >= height) return;
            
            const key = `${x},${y}`;
            if (visited.has(key)) return;
            visited.add(key);

            for (const dir of directions) {
                const newX = x + dir.x;
                const newY = y + dir.y;

                // Boundary checks for new positions
                if (newX < 0 || newX >= width || newY < 0 || newY >= height) continue;

                if (level[newY][newX] === ' ' || level[newY][newX] === '.') {
                    dfs(newX, newY);
                } else if (level[newY][newX] === '$') {
                    const beyondX = newX + dir.x;
                    const beyondY = newY + dir.y;

                    // Boundary checks for beyond positions
                    if (beyondX < 0 || beyondX >= width || beyondY < 0 || beyondY >= height) continue;

                    if (level[beyondY][beyondX] === ' ' || level[beyondY][beyondX] === '.') {
                        dfs(newX, newY);
                    }
                }
            }
        };

        dfs(playerPosition.x, playerPosition.y);

        // Check if all goals are reachable
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (level[y][x] === '.' && !visited.has(`${x},${y}`)) {
                    return false;
                }
            }
        }

        return true;
    }

    generateNewLevel() {
        let level;
        do {
            level = this.generateRandomLevel();
            this.level = level.map(row => row.split(''));
            this.findPlayerPosition();
        } while (!this.isSolvable(this.level));

        this.level = level.map(row => row.split(''));
        this.findPlayerPosition();
    }

    findPlayerPosition() {
        for (let y = 0; y < this.level.length; y++) {
            for (let x = 0; x < this.level[y].length; x++) {
                if (this.level[y][x] === '@') {
                    this.playerPosition = { x, y };
                    return;
                }
            }
        }
    }

    getLevelWithEmojis() {
        const levelWithEmojis = this.level.map(row => row.slice());

        // Place goals back on the level
        for (const goal of this.goals) {
            if (levelWithEmojis[goal.y][goal.x] === ' ') {
                levelWithEmojis[goal.y][goal.x] = '.';
            } else if (levelWithEmojis[goal.y][goal.x] === '@') {
                levelWithEmojis[goal.y][goal.x] = '+';
            } else if (levelWithEmojis[goal.y][goal.x] === '$') {
                levelWithEmojis[goal.y][goal.x] = '*';
            }
        }

        return levelWithEmojis.map(row => 
            row.join('').replace(/#/g, this.emojis.wall)
                        .replace(/@/g, this.emojis.player)
                        .replace(/ /g, this.emojis.empty)
                        .replace(/\./g, this.emojis.goal)
                        .replace(/\$/g, this.emojis.box)
                        .replace(/\+/g, this.emojis.player)
                        .replace(/\*/g, this.emojis.box)
        ).join('\n');
    }

    isLevelCompleted() {
        for (let row of this.level) {
            if (row.includes('.')) {
                return false;
            }
        }
        return true;
    }

    move(direction) {
        const moves = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };

        const move = moves[direction];
        if (!move) return this.getLevelWithEmojis();

        const newX = this.playerPosition.x + move.x;
        const newY = this.playerPosition.y + move.y;
        const beyondX = newX + move.x;
        const beyondY = newY + move.y;

        if (this.level[newY][newX] === '#') {
            return this.getLevelWithEmojis();
        }

        if (this.level[newY][newX] === '$' && (this.level[beyondY][beyondX] === '#' || this.level[beyondY][beyondX] === '$')) {
            return this.getLevelWithEmojis();
        }

        // Move player
        if (this.level[this.playerPosition.y][this.playerPosition.x] === '+') {
            this.level[this.playerPosition.y][this.playerPosition.x] = '.';
        } else {
            this.level[this.playerPosition.y][this.playerPosition.x] = ' ';
        }

        if (this.level[newY][newX] === '$') {
            // Move box
            if (this.level[beyondY][beyondX] === '.') {
                this.level[beyondY][beyondX] = '*';
            } else {
                this.level[beyondY][beyondX] = '$';
            }
        }

        if (this.level[newY][newX] === '.') {
            this.level[newY][newX] = '+';
        } else {
            this.level[newY][newX] = '@';
        }

        this.playerPosition = { x: newX, y: newY };

        return this.getLevelWithEmojis();
    }

    serialize() {
        return {
            level: this.level,
            playerPosition: this.playerPosition,
            levelNumber: this.levelNumber,
            goals: this.goals
        };
    }
}

module.exports = Sokoban;
