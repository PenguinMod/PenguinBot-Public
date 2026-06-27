// DISCLOSURE: all simulation logic is ai written because i tried to use life-game and that's causing a ton of complexity: https://www.npmjs.com/package/life-game
class CellularAutomataLifeLike {
    /**
     * Makes a new simulation.
     * @param {number[]} bornAt 
     * @param {number[]} surviveAt 
     * @param {boolean[][]} map 
     */
    constructor(bornAt, surviveAt, map) {
        this.bornAt = bornAt;
        this.surviveAt = surviveAt;

        // AI START:
        this._padding = 64;

        // Internal board is larger than the visible map
        this._rows = map.length + (2 * this._padding);
        this._cols = map[0].length + (2 * this._padding);

        /** @private The internal board that is larger than the viewable portion */
        this._map = Array.from({ length: this._rows }, () => Array(this._cols).fill(false));

        // Center the input map in the internal buffer
        for (let r = 0; r < map.length; r++) {
            for (let c = 0; c < map[0].length; c++) {
                this._map[r + this._padding][c + this._padding] = map[r][c];
            }
        }
        // AI END

        this._state = CellularAutomataLifeLike._makeState(this.map);
        /**
         * @private The list of _makeState()s so far
         */
        this._states = [this._state];
    }
    /**
     * The map of the current state in the simulation.
     * @returns {boolean[][]}
     */
    get map() {
        // DISCLOSURE: AI written
        return this._map.slice(this._padding, this._rows - this._padding)
            .map(row => row.slice(this._padding, this._cols - this._padding));
    }
    set map(newMap) {
        // AI START:
        // Internal board is larger than the visible map
        this._rows = newMap.length + (2 * this._padding);
        this._cols = newMap[0].length + (2 * this._padding);

        /** @private The internal board that is larger than the viewable portion */
        this._map = Array.from({ length: this._rows }, () => Array(this._cols).fill(false));

        // Center the input map in the internal buffer
        for (let r = 0; r < newMap.length; r++) {
            for (let c = 0; c < newMap[0].length; c++) {
                this._map[r + this._padding][c + this._padding] = newMap[r][c];
            }
        }
        // AI END

        // add a new state
        this._state = CellularAutomataLifeLike._makeState(this.map);
        this._states.push(this._state);
    }

    /**
     * The width of the map.
     * @returns {number}
     */
    get width() {
        return this._cols;
    }
    /**
     * The height of the map.
     * @returns {number}
     */
    get height() {
        return this._rows;
    }

    /**
     * The states of the simulation so far.
     * @returns {[boolean[][]]}
     */
    get states() {
        return this._states.map(representation => CellularAutomataLifeLike._getStateMap(representation));
    }
    set states(newMaps) {
        this._states = newMaps.map(map => CellularAutomataLifeLike._makeState(map));
    }
    /**
     * Whether or not we've been in this state before.
     * Always returns true on the first state where nothing has changed yet.
     * @returns {boolean}
     */
    get stagnant() {
        return this._states.slice(0, -1).includes(this._state);
    }

    /** @private */
    _countNeighbors(r, c) {
        // DISCLOSURE: AI written
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const nr = r + i;
                const nc = c + j;
                // Boundary check against the large internal buffer
                if (nr >= 0 && nr < this._rows && nc >= 0 && nc < this._cols) {
                    if (this._map[nr][nc]) count++;
                }
            }
        }
        return count;
    }
    iterate() {
        // DISCLOSURE: AI written
        const nextMap = Array.from({ length: this._rows }, () => Array(this._cols).fill(false));
        for (let r = 0; r < this._rows; r++) {
            for (let c = 0; c < this._cols; c++) {
                const neighbors = this._countNeighbors(r, c);
                const isAlive = this._map[r][c];
                nextMap[r][c] = isAlive ? this.surviveAt.includes(neighbors) : this.bornAt.includes(neighbors);
            }
        }

        this._map = nextMap;
        this._state = CellularAutomataLifeLike._makeState(this.map);
        this._states.push(this._state);
    }

    /**
     * Parses a life-like rulestring (ex, `"B3/S23"`)
     * @param {string} str The rulestring (ex, `"B3/S23"`)
     * @returns {[number[], number[]]}
     */
    static parseRulestring(str = "") {
        const halves = str.toLowerCase().split("/");
        const bornRule = halves.find(segment => segment.startsWith("b"));
        const surviveRule = halves.find(segment => segment.startsWith("s"));
        if (!bornRule) throw new Error("No bornRule");
        if (!surviveRule) throw new Error("No surviveRule");
        const bornNeighbors = bornRule.slice(1).split("").map(num => Math.max(0, Math.min(Math.round(Number(num)), 8)));
        const surviveNeighbors = surviveRule.slice(1).split("").map(num => Math.max(0, Math.min(Math.round(Number(num)), 8)));
        const bornNeighborsProper = [...new Set(bornNeighbors.filter(num => num >= 0 || num <= 8))].sort();
        const surviveNeighborsProper = [...new Set(surviveNeighbors.filter(num => num >= 0 || num <= 8))].sort();
        // NOTE: Empty bornNeighborsProper means no new cells will ever be born
        // NOTE: Empty surviveNeighborsProper means all the cells that lived just die in the next generation
        return [
            bornNeighborsProper,
            surviveNeighborsProper,
        ];
    }

    /** @private Creates a "state" representation of the specified map. @param {boolean[][]} map @returns {any} */
    static _makeState(map) {
        const width = map[0].length;
        return map.flat(Infinity).map(bool => bool ? 1 : 0).join("") + `:${width}`;
    }
    /** @private Gets a map back from a "state" representation. Should match _makeState all the time @param {any} representation @returns {boolean[][]} */
    static _getStateMap(representation) {
        const [str, widthStr] = representation.split(":");
        const width = parseInt(widthStr, 10);
        const flatBools = str.split("").map(ch => ch === "1");

        const rows = [];
        for (let i = 0; i < flatBools.length; i += width) {
            rows.push(flatBools.slice(i, i + width));
        }
        return rows;
    }
}

module.exports = CellularAutomataLifeLike;
