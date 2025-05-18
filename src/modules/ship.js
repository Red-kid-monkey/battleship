/**
 * Factory  function to create a ship with a specified length
 * @param {number} length - The length of the ship
 * @returns {object} Ship object with methods to track hits and sunk status
 */
const ship = (length) => {
    // Private variable to track number of hits
    let hits = 0;

    return {
        length,

        /**
         * Register a hit on the ship
         */
        hit() {
            if (hits < length) {
                hits++
            }
        },

        /**
         * Get the current number of hits
         * @returns {number} Number of hits on the ship
         */
        getHits() {
            return hits;
        },

        /**
         * check if the ship is sunk
         * @returns {boolean} True if the ship is sunk, false otherwise
         */
        isSunk() {
            return hits >= length;
        }
    }
}

export default ship;