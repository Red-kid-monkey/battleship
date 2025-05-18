import Ship from '../src/modules/ship.js';

describe('Ship', () => {
    let ship;

    beforeEach(() => {
        ship = Ship(3);
    });
    
    test('Should create a ship with specified length', () => {
        expect(ship.length).toBe(3);
    })

    test('Should initialize with 0 hits', () => {
        expect(ship.getHits()).toBe(0);
    })

    test('Should not be sunk initially', () => {
        expect(ship.isSunk()).toBe(false);
    })

    test('Should register hits correctly', () => {
        ship.hit()
        expect(ship.getHits()).toBe(1);

        ship.hit()
        expect(ship.getHits()).toBe(2);
    })

    test('Should be sunk when hits equal length', () => {
        // hit the ship 3 times

        ship.hit();
        ship.hit();
        ship.hit();

        expect(ship.getHits()).toBe(3);
        expect(ship.isSunk()).toBe(true);
    })

    test('Should not register hits beyond ship length', () => {
        // hit the ship 4 times (more than its length)

        ship.hit();
        ship.hit();
        ship.hit();
        ship.hit();

        expect(ship.getHits()).toBe(3); // should still be 3
        expect(ship.isSunk()).toBe(true); // should still be sunk
    })
})