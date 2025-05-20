import Ship from './modules/ship.js';
import Gameboard from './modules/gameboard.js';
import Player from './modules/player.js';
import DOM from './modules/dom.js';
import { start } from 'pretty-error';

/**
 * Game controller module
 */
const Game = (() => {
    // Game state
    let player;
    let computer;
    let currentPlayer;
    let gameOver = false;
    let shipPlacementPhase = true;
    let selectedShipIndex = 0;
    let selectedOrientation = 'horizontal';

    // Ship definitions
    const shipTypes = [
        { name: 'Carrier', length: 5 },
        { name: 'Battleship', length: 4 },
        { name: 'Cruiser', length: 3 },
        { name: 'Submarine', length: 3 },
        { name: 'Destroyer', length: 2 }
    ];

    // Track ships to be placed
    const shipsToPlace = [];

    /**
     * Initialize the game
     */
    const initialize = () => {
        // Create DOM elements
        DOM.initializeUI();


        // Display welcome message
        DOM.displayMessage('Welcome to Battleship! Place your ships on the board.');

        // Set up the ship placement 
        setUpPlacement()
    };

    /**
     * Set up ship placement phase
     */
    const setUpPlacement = () => {
        // Create the players
        player = Player('Player', false);
        computer = Player('Computer', true);

        // Set current player
        currentPlayer = player;

        // Reset game state
        gameOver = false;
        shipPlacementPhase = true;

        // Reset ships to place
        shipsToPlace.length = 0;
        shipTypes.forEach(shipType => {
            shipsToPlace.push({
                name: shipType.name,
                length: shipType.length,
                ship: Ship(shipType.length)
            });
        });

        // Create game boards
        DOM.createGameBoards(handleCellClick);

        // Update the boards
        DOM.updateBoards(player.getGameboard(), computer.getGameboard(), false);

        // Create ship placement UI
        DOM.createShipPlacementUI(shipsToPlace, handleShipSelection);
    };

    /**\
     * Handle ship selection for placement
     * @param {number} index - Index of the selected ship
     * @param {string} orientation - Orientation of the ship 
     */
    const handleShipSelection = (index, orientation) => {
        if (orientation === 'random') {
            // Place ships randomly
            placeShipsRandomly();
            return;
        }

        selectedShipIndex = index;
        selectedOrientation = orientation;
    };

    /**
     *  Handle cell click event
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    const handleCellClick = (row, col) => {
        if (gameOver) return;

        if (shipPlacementPhase) {
            // Place ship
            placeShip(row, col);
        } else {
            // Player's turn
            if (currentPlayer === player) {
                processPlayerAttack(row, col);
            }
        }
    };

    /**
     *  Place a ship on the player's board
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    const placeShip = (row, col) => {
        if (selectedShipIndex < 0 || selectedShipIndex >= shipsToPlace.length) {
            return;
        }

        const shipData = shipsToPlace[selectedShipIndex];

        if (!shipData) {
            DOM.displayMessage('No ship selected', 'error');
            return;
        }


        const result = player.getGameboard().placeShip(
            shipData.ship,
            row,
            col,
            selectedOrientation
        );

        if (result) {
            // Ship placed successfully
            // Remove the ship from the list
            shipsToPlace.splice(selectedShipIndex, 1);

            // Update the board
            DOM.updateBoards(player.getGameboard(), computer.getGameboard(), true);

            // Create updated ship placement UI
            DOM.createShipPlacementUI(shipsToPlace, handleShipSelection);

            // Check if all ships are placed
            if (shipsToPlace.length === 0) {
                // ALL ships placed, start the game
                startGame();
            }
        } else {
            // Ship placement failed
            DOM.displayMessage('Invalid ship placement. Try again.', 'error');
        }
    };

    /**
     *  Place all ships randomly 
     */
    const placeShipsRandomly = () => {
        // Clear the board first
        player = Player('Player', false);

        // Place each ship randomly
        for (const shipData of shipTypes) {
            const ship = Ship(shipData.length);
            let placed = false;

            while (!placed) {
                const row = Math.floor(Math.random() * 10);
                const col = Math.floor(Math.random() * 10);
                const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';

                placed = player.getGameboard().placeShip(ship, row, col, orientation);
            }
        }

        // Clear ships to place
        shipsToPlace.length = 0;

        // Update the board
        DOM.updateBoards(player.getGameboard(), computer.getGameboard(), true);

        // Start the game
        startGame();
    };

    /**
     *  Place computer ships randomly
     */
    const placeComputerShipRandomly = () => {
        for (const shipData of shipTypes) {
            const ship = Ship(shipData.length);
            let placed = false;

            while (!placed) {
                const row = Math.floor(Math.random() * 10);
                const col = Math.floor(Math.random() * 10);
                const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
                
                placed = player.getGameboard().placeShip(ship, row, col, orientation);
            }
        }
    };

    /**
     * Start the game
     */
    const startGame = () => {
        // Clear placement UI
        const placementContainer = document.querySelector('.placement-container')
        if (placementContainer) {
            placementContainer.innerHTML = '';
        }

        // Place computer ships
        placeComputerShipRandomly();

        // End placement phase
        shipPlacementPhase = false;

        // Display start message
        DOM.displayMessage('Game started! Click on enemy board to attack', 'success');

        // Update boards
        DOM.updateBoards(player.getGameboard(), computer.getGameboard(), false);
    };

    /**
     *  Process player's attack
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    const processPlayerAttack = (row, col) => {
        if (currentPlayer !== player) return;

        const result = player.attack(computer.getGameboard(), row, col);

        if (result === null) {
            // Invalid attack (already attacked this cell)
            DOM.displayMessage('You already attacked that position', 'error');
            return;
        } 

        // Update the boards
        DOM.updateBoards(player.getGameboard(), computer.getGameboard(), false);

        // Check for win condition
        if (computer.getGameboard().allShipsSunk()) {
            endGame(true);
            return
        }

        // Display result message
        DOM.displayMessage(
            result === 'hit' ? 'Hit! Enemy ship damaged!' : 'Miss! Your attack missed',
            result === 'hit' ? 'success' : 'info'
        );

        // Switch to computer's turn
        currentPlayer = computer;
        setTimeout(computerTurn, 1000);
    };

    /**
     *  Computer's turn
     */
    const computerTurn = () => {
        if (gameOver) return;

        const result = computer.attack(player.getGameboard());

        // Update the boards
        DOM.updateBoards(player.getGameboard(), computer.getGameboard(), false);

        // Check for win condition
        if (player.getGameboard().allShipsSunk()) {
            endGame(false);
            return;
        }

        // Display result message
        DOM.displayMessage(
            result === 'hit' ? 'You"ve been hit! Ship damaged' : 'Enemy missed! Your ships are safe.',
            result === 'hit' ? 'error' : 'info'
        );

        // Switch back to player's turn
        currentPlayer = player;
    };

    /**
     * End the game
     * @param {boollean} playerWon - whether the player won
     */
    const endGame = (playerWon) => {
        gameOver = true;

        // Show all ships
        DOM.updateBoards(player.getGameboard(), computer.getGameboard(), true);

        // Show game over screen
        DOM.showGameOver(playerWon, restartGame);
    };

    /**
     *  Restart the game
     */
    const restartGame = () => {
        // Remove game over screen
        const gameOverScreen = document.querySelector('.game-over');
        if (gameOverScreen) {
            gameOverScreen.remove();
        }

        // Re-initialize game
        initialize();
    };

    return {
        initialize,
        restartGame
    };
})();

export default Game;