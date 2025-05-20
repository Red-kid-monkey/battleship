import Player from "../src/modules/player";
import Gameboard from "../src/modules/gameboard";



// Mock the Gameboard module
jest.mock("../src/modules/gameboard");

describe('Player', () => {
    let player;
    let enemyGameboard;

    beforeEach(() => {
        // Reset all implementations
        Gameboard.mockClear();

        // Mock gameboard implementation
        const mockGameboard = {
            receiveAttack: jest.fn(),
            placeShip: jest.fn(),
            getBoard: jest.fn().mockReturnValue(Array(10).fill().map(() => Array(10).fill(null))),
            getMissedAttacks: jest.fn(),
            allShipsSunk: jest.fn(),
        }

        Gameboard.mockImplementation(() => mockGameboard);

        enemyGameboard = Gameboard();
        player = Player('Player 1', false)
    })

    test('should create a player with a name and gameboard', () => {
        expect(player.getName()).toBe('Player 1');
        expect(player.getGameBoard()).toBeDefined();
        expect(Gameboard).toHaveBeenCalled();
    })

    test('should allow a human player to attack', () => {
        enemyGameboard.receiveAttack.mockReturnValue('hit');

        const result = player.attack(enemyGameboard, 0, 0);

        expect(enemyGameboard.receiveAttack).toHaveBeenCalledWith(0, 0);
        expect(result).toBe('hit');
    })

    test('should make computer player generate random legal attack', () => {
        const computerPlayer = Player('Computer', true);
        enemyGameboard.receiveAttack.mockReturnValue('miss');

        // Make a bunch of attacks to ensure randomness
        const attacks = new Set();
        for (let i = 0; i < 10; i++) {
            computerPlayer.attack(enemyGameboard);

            // Get the last call arguments
            const lastCalls = enemyGameboard.receiveAttack.mock.calls[i];
            const attackKey = `${lastCalls[0]},${lastCalls[1]}`;

            // Ensure no duplicates
            expect(attacks.has(attackKey)).toBe(false);
            attacks.add(attackKey);

            // Verify coordinates are within board
            expect(lastCalls[0]).toBeGreaterThanOrEqual(0);
            expect(lastCalls[0]).toBeLessThan(10);
            expect(lastCalls[1]).toBeGreaterThanOrEqual(0);
            expect(lastCalls[1]).toBeLessThan(10);
        }
    });

    test('should not attack same position twice for computer player', () => {
        const computerPlayer = Player('Computer', true);

        // Mock receiveAttack to return 'miss' for simplicity (return value isn't critical here)
        enemyGameboard.receiveAttack.mockReturnValue('miss');

        const attackedPositions = new Set();

        // Perform 100 attacks (size of a 10x10 board)
        for (let i = 0; i < 100; i++) {
            computerPlayer.attack(enemyGameboard);
            const [row, col] = enemyGameboard.receiveAttack.mock.calls[i];
            const key = `${row},${col}`;

            // Check that this position hasn't been attacked before
            expect(attackedPositions.has(key)).toBe(false);
            attackedPositions.add(key);
        }

        // Optionally, verify all positions were attacked exactly once
        expect(attackedPositions.size).toBe(100);
    })
})