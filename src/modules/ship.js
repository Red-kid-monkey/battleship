/**
 * Factory  function to create a ship with a specified length
 * @param {number} length - The length of the ship
 * @returns {object} Ship object with methods to track hits and sunk status
 */
const ship = (length) => {
    const hits = Array(length).fill(false);

    const hit = (position) => {
        if (position >= 0 && position < length) {
            hits[position] = true;
        }
    };

    const isHitAt = (position) => {
        return position >= 0 && position < length && hits[position]
    };

    const isSunk = () => {
        return hits.every(h => h === true);
    };

    const getHits = () => { // If needed elsewhere, though isHitAt is more direct for rendering
        return hits.reduce((acc, cur, idx) => {
            if (cur) acc.push(idx);
            return acc;
        }, []);
    };

    return {
        length,
        hit,
        isHitAt, // Important for DOM
        isSunk,
    };
};

export default ship;