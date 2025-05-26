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
            const target = aiState.potentialTargets.pop();
            const { row, col} = target;
            const key = `${row},${col}`; // key without space
            if (!previousAttacks.has(key) && row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
                return [row, col];
            }
        }

        // Fallback to random attack if no smart targets
        let r, c, k;
        let attempts = 0;
        const maxAttempts = 100; // Prevent infinite loop

        do {
            r = getRandomInt(0, boardSize - 1);
            c = getRandomInt(0, boardSize - 1);
            k = `${r},${c}`; // key without space
            attempts++;

            // if we've tried too many times, start searching systematically
            if (attempts > maxAttempts) {
            for (let sr = 0; sr < boardSize; sr++) {
                for (let sc = 0; sc < boardSize; sc++) {
                    const newKey = `${sr},${sc}`;
                    if (!previousAttacks.has(newKey)) {
                        return [sr, sc];
                    }
                }
            }
            // if we get here, the board is full
            return null;
            }
        } while (previousAttacks.has(k));

        return [r, c];
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
         * @param {number} [humanRow] - Row coordinate (for human player)
         * @param {number} [humanCol] - Column coordinate (for human player)
         * @returns {string|null} Attack result: 'hit', 'miss', or null
         */
        attack(enemyGameboard, humanRow, humanCol) {
            let r, c;
            if (isComputer) {
                const attackCoordinates = generateRandomAttack(enemyGameboard);
                if (!attackCoordinates) {
                    return { attackResult: null, row: -1, col: -1};
                }
                [r, c] = attackCoordinates;
            } else {
                r = humanRow;
                c = humanCol;
            }

            const key = `${r},${c}`

            if (previousAttacks.has(key)) {
                return { attackResult: null, row: r, col: c}
            }

            previousAttacks.add(key);
            const boardAttackResult = enemyGameboard.receiveAttack(r, c);


            if (isComputer && boardAttackResult === 'hit') {
                const hitCell = enemyGameboard.getBoard()[r][c];
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

                        const boardSize = enemyGameboard.getBoard().length;

                        deltas.forEach(([dr, dc]) => {
                            const nextRow = r + dr;
                            const nextCol = c + dc;
                            const targetKey = `${nextRow},${nextCol}`

                             if (
                                nextRow >= 0 &&
                                nextRow < boardSize &&
                                nextCol >= 0 &&
                                nextCol < boardSize &&
                                !previousAttacks.has(targetKey) &&
                                !aiState.potentialTargets.some(t => t.row === nextRow && t.col === nextCol)
                            ) {
                                newTargets.push({ row: nextRow, col: nextCol });
                            }
                        });
                        // Add new targets to the end of the stack (LIFO)
                        aiState.potentialTargets.push(...newTargets);
                    }
                    }
                }
                return { attackResult: boardAttackResult, row: r, col: c };
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