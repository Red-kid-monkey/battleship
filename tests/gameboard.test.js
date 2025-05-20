import Gameboard from "../src/modules/gameboard";
import Ship from "../src/modules/ship";


jest.mock('../src/modules/ship');

describe('Gameboard', () => {
    let gameboard;

    beforeEach(() => {
        // Reset all mock implementations
        Ship.mockClear();

        // Mock Ship implementation
        Ship.mockImplementation((length) => ({
            length,
            hit: jest.fn(),
            getHits: jest.fn(),
            isSunk: jest.fn().mockReturnValue(false)
        }));

        gameboard = Gameboard();
    })

    test('should create a 10x10 board', () => {
        expect(gameboard.getBoard().length).toBe(10);
        expect(gameboard.getBoard()[0].length).toBe(10);
  });

test('should place ship horizontally', () => {
    const ship = Ship(3);
    const result = gameboard.placeShip(ship, 0, 0, 'horizontal')

    expect(result).toBe(true);
    expect(gameboard.getBoard()[0][0]).toEqual({ ship, index: 0 });
    expect(gameboard.getBoard()[0][1]).toEqual({ ship, index: 1 });
    expect(gameboard.getBoard()[0][2]).toEqual({ ship, index: 2 });
  })

test('should place ship vertically', () => {
    const ship = Ship(3);
    const result = gameboard.placeShip(ship, 0, 0, 'vertical')

    expect(result).toBe(true);
    expect(gameboard.getBoard()[0][0]).toEqual({ ship, index: 0 });
    expect(gameboard.getBoard()[1][0]).toEqual({ ship, index: 1 }); 
    expect(gameboard.getBoard()[2][0]).toEqual({ ship, index: 2 });
  })

test('should not place ship out of bounds horizontally', () => {
    const ship = Ship(3);
    const result = gameboard.placeShip(ship, 0, 8, 'horizontal')

    expect(result).toBe(false);
    // Booard should remain empty
    expect(gameboard.getBoard()[0][0]).toBeNull();  
  })

test('should not place ship outside board vertically', () => {
    const ship = Ship(3);
    const result = gameboard.placeShip(ship, 8, 0, 'vertical')

    expect(result).toBe(false);
    // Board should remain empty
    expect(gameboard.getBoard()[8][0]).toBeNull();
  })

test('should not place ship on top of another ship', () => {
    const ship1 = Ship(3);
    const ship2 = Ship(2);

    gameboard.placeShip(ship1, 0, 0, 'horizontal');
    const result = gameboard.placeShip(ship2, 0, 1, 'vertical');

    expect(result).toBe(false);
  })

test('should register missed attack', () => {
    const result = gameboard.receiveAttack(0, 0);

    expect(result).toBe('miss');
    expect(gameboard.getMissedAttacks()).toContainEqual([0, 0]);
  })

test('should register hit on ship', () => {
    const ship = Ship(3);
    ship.hit.mockImplementation(jest.fn());

    gameboard.placeShip(ship, 0, 0, 'horizontal');
    const result = gameboard.receiveAttack(0, 1);

    expect(result).toBe('hit');
    expect(ship.hit).toHaveBeenCalledWith(1);
  })

test('should not allow hittiing the same [position twice', () => {
    gameboard.receiveAttack(0, 0);
    const result = gameboard.receiveAttack(0, 0);

    expect(result).toBe(null);
  })

test('should report all ships sunk when no ships', () => {
    expect(gameboard.allShipsSunk()).toBe(true);
  })

test('should report not all ships sunk when ships present', () => {
    const ship = Ship(3);
    ship.isSunk.mockReturnValue(false);

    gameboard.placeShip(ship, 0, 0, 'horizontal');

    expect(gameboard.allShipsSunk()).toBe(false);
  })

test('should report all ships sunk when all ships are sunk', () => {
    const ship1 = Ship(3);
    const ship2 = Ship(2);

    ship1.isSunk.mockReturnValue(true);
    ship2.isSunk.mockReturnValue(true);

    gameboard.placeShip(ship1, 0, 0, 'horizontal');
    gameboard.placeShip(ship2, 2, 0, 'horizontal');

    expect(gameboard.allShipsSunk()).toBe(true);
  })
})