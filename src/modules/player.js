import Gameboard from './gameboard.js';

/**
 * Factory function to create a Player
 * @param {string} name - The Player's name
 * @param {boolean} isComputer - whether this is a computer
 * @returns {object} - The Player object
 */

const Player = (name, isComputer = false) => {
    const gameboard = Gameboard();
    const previousAttacks = new Set();

    //AI-specific state
    const aiState = {
        potentialTargets: [], // Queue of {row, col} to try after a hit
        lastHitStreak: [], //for more advanced line hunting
    };

    /**
     * Generate a random integer between min and max (inclusive)
     * @param {number} min - The minimum value
     * @param {number} max - The maximum value
     * @returns {number} - A random integer between min and max
     */
    const getRandomInt = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    /**
     * Generate a random attack coordinate that hasn't been attacked before
     * @param {object} enemyGameboard - The enemy's gameboard
     * @returns {Array} [row, col] coordinates
     */
    const generateRandomAttack = (enemyGameboard) => {
        const board = enemyGameboard.getBoard();
        const boardSize = board.length;

        // Try AI-targeted cells first
        while (aiState.potentialTargets.length > 0) {
            const [ row, col ] = aiState.potentialTargets.shift() // Get the highest priority target
            const key = `${row}, ${col}`
            if (row >= 0 && row < boardSize && col >= 0 && col < boardSize && !previousAttacks.has(key)) {
                return [row, col];
            }
        }

        // Fallback to random attack if no smart targets
        let row, col, key;
        let attempts = 0;
        const maxAttempts = 100; // Prevent infinite loop

        do {
            row = getRandomInt(0, boardSize - 1);
            col = getRandomInt(0, boardSize - 1);
            key = `${row},${col}`;
            attempts++;

            // if we've tried too many times, start searching systematically
            if (attempts > maxAttempts) {
            for (let r = 0; r < boardSize; r++) {
                for (let c = 0; c < boardSize; c++) {
                    const newKey = `${r},${c}`;
                    if (!previousAttacks.has(newKey)) {
                        return [r, c];
                    }
                }
            }
            // if we get here, the board is full
            return null;
            }
        } while (previousAttacks.has(key));

        return [row, col];
    };

    return {
        /**
         * Get the player's name
         * @returns {string} Player name
         */
        getName() {
            return name;
        },
        /**
         * Get the player's gameboard
         * @returns {object} Player's gameboard
         */
        getGameBoard() {
            return gameboard;
        },

        /**
         * Make an attack the enemy's gameboard
         * @param {object} enemyGameboard - The oppenent's gameboard
         * @param {number} [row] - Row coordinate (for human player)
         * @param {number} [col] - Column coordinate (for human player)
         * @returns {string|null} Attack result: 'hit', 'miss', or null
         */
        attack(enemyGameboard, row, col) {
            let attackCoordinates;
            if (isComputer) {
                attackCoordinates = generateRandomAttack(enemyGameboard);
                if (!attackCoordinates) {
                    return null;
                }
                [row, col] = attackCoordinates;
            } else {
                if (previousAttacks.has(`${row},${col}`)) {
                    return null;
                }
            }

            const key = `${row},${col}`;

            // Prevent re-attacking the same cell by the same player
            if (previousAttacks.has(key)) {
                return null;
            }

            // Record this attack
            previousAttacks.add(`${row},${col}`);

            const result = enemyGameboard.receiveAttack(row, col);

            if (isComputer && result === 'hit') {
                const hitCell = enemyGameboard.getBoard()[row][col];
                if (hitCell && hitCell.ship) {
                    if (hitCell.ship.isSunk()) {
                        // Ship is sunk, clear current targets and streak
                        aiState.potentialTargets = [];
                        aiState.lastHitsStreak = []; // Reset streak
                    } else {
                        // It's a hit, and the ship is not sunk yet
                        // adjacent cells to potentialTargets queue.
                        const newTargets = [];
                        const deltas = [[-1, 0], [1, 0], [0, -1], [0,1]]; // N, S, W, E

                        deltas.forEach(([dr, dc]) => {
                            const nextRow = row + dr;
                            const nextCol = col + dc;
                            const targetKey = `${nextRow}, ${nextCol}`

                            if (nextRow >= 0 && nextRow < boardSize &&
                                nextCol >= 0 && nextCol < boardSize &&
                                !previousAttacks.has(targetKey)) {
                                    // Avoid duplication to potentialTargets
                                    if (aiState.potentialTargets.some(t => t.row === nextRow && t.col === nextCol)) {
                                        newTargets.push({ row: nextRow, col: nextCol });
                                    }
                                }
                            });
                            // Add new targets to the front of the queue to be tried
                            aiState.potentialTargets = [...newTargets, ...aiState.potentialTargets];
                        }
                    }
                }
                return null
            },

            /**
         * Check if the player is a computer
         * @returns {boolean} whether the player is a computer
         */
        isComputer() {
            return isComputer;
        },
        // Add this method if you need to reset AI state for a new game
        resetAI() {
            if (isComputer) {
                aiState.potentialTargets = [];
                aiState.lastHitStreak = [];
                // previousAttacks are typically cleared by creating a new Player or game instance
            }
        }
}}

export default Player;