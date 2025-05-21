/** 
 * Factory function to create a Gameboard
 * @returns {Object} Gameboard object
*/

const Gameboard = () => {
    // Create a 10x10 board filled with null values
    const board = Array(10).fill().map(() => Array(10).fill(null));

    // Track all ships placed on the board
    const ships = [];

    // Track missed shots
    const missedAttacks = [];

    //Track all attacks (hit or miss) to prevent duplicates
    const allAttacks = new Set();
    
    /**
     * Check if a ship placement is valid
     * @param {Object} ship - Ship object to place
     * @param {number} row - Starting row coordinate
     * @param {number} col - Starting column coordinate
     * @param {string} orientation - 'horizontal' or 'vertical'
     * @returns {boolean} whether the placement is valid
     */
    const isValidPlacement = (ship, row, col, orientation) => {
        const length = ship.length;

        // Check if placement is within board boundaries
        if (orientation === 'horizontal') {
            if (col < 0 || row < 0 || col + length > 10 || row >= 10) return false;

            // Check if any cells are already occupied
            for (let i = 0; i < length; i++) {
                if (board[row][col + i] !== null) return false;
            }
        } else if (orientation === 'vertical') {
            if (row < 0 || col < 0 || row + length > 10 || col >= 10) return false;

            // Check if any cells are already occupied
            for (let i = 0; i < length; i++) {
                if (board[row + i][col] !== null) return false;
            }
        } else {
            return false;
        }

        return true;
    }

    return {
        /**
         * Get the current state of the board
         * @returns {Array} 20 array representing the board
         */
        getBoard() {
            return board;
        },

        /**
         * Place a ship on the board
         * @param {Object} ship - Ship object to place
         * @param {number} row - Starting row coordinate
         * @param {number} col - Starting column coordinate
         * @param {string} orientation - 'horizontal' or 'vertical'
         * @returns {boolean} whether the placement was successful
         */
        placeShip(ship, row, col, orientation) {
            if (!isValidPlacement(ship, row, col, orientation)) {
                return false;
            }

            const length = ship.length;

            if (orientation === 'horizontal') {
                for (let i = 0; i < length; i++) {
                    board[row][col + i] = { ship, index: i };
                }
            } else {
                for (let i = 0; i < length; i++) {
                    board[row + i][col] = { ship, index: i };
                }
            }

            ships.push(ship);
            return true;
        },

        /**
         * Process an attack at given coordinates
         * @param {number} row - Row coordinate of the attack
         * @param {number} col - Column coordinate of the attack
         * @returns {string|null} 'hit', 'miss', or null if already attacked
         */
        receiveAttack(row, col) {
            // Check for out-of-bounds attacks
            if (row < 0 || row >= 10 || col < 0 || col >= 10) {
                return null;
            }

            const attackKey = `${row},${col}`

            // Check if this position has already been attacked
            if (allAttacks.has(attackKey)) {
                return null;
            }

            // Record this attack
            allAttacks.add(attackKey);

            const cell = board[row][col];

            if (cell === null) {
                // Miss
                missedAttacks.push([row, col]);
                return 'miss';
            } else {
                // Hit
                cell.ship.hit(cell.index);
                return 'hit';
            }
        },

        /**
         *  Get all missed attacks
         * @returns {Array} Array of [row, col] pairs
         */
        getMissedAttacks() {
            return missedAttacks;
        },
        
        /**
         *  Check if all ships are sunk
         * @returns {boolean} whether all ships are sunk
         */
        allShipsSunk() {
            if (ships.length === 0 && allAttacks.size > 0) { 
                // If there were no ships to begin with, but attacks were made, consider it not "all sunk" in terms of game objective
                // Or, if game setup ensures ships are always present, this check might be simpler.
                // For a standard game, this implies no ships were placed, which might be a setup issue.
                return false; // Or true if an empty board means no ships to sink. Context dependent.
            }
            if (ships.length === 0) return true; // No ships placed, so all (zero) are sunk.
            return ships.every(ship => ship.isSunk());
        }
    }
}

export default Gameboard;