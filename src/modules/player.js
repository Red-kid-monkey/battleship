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
            return [0, 0];
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
            if (isComputer) {
                // Computer player makes a random attack
                [row, col] = generateRandomAttack(enemyGameboard);
            }

            // Record this attack
            previousAttacks.add(`${row},${col}`);

            // Make the attack
            return enemyGameboard.receiveAttack(row, col);
        },

        /**
         * Check if the player is a computer
         * @returns {boolean} whether the player is a computer
         */
        isComputer() {
            return isComputer;
        }
    }
}

export default Player;