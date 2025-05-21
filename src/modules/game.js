import Ship from './modules/ship.js';
import Gameboard from './modules/gameboard.js';
import Player from './modules/player.js';
import DOM from './modules/dom.js';


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
        player = Player('Player 1', false);
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
            placeShipsRandomlyForPlayer(player, shipTypes); // Place player's ships randomly
            // shipsToPlace should be empty now, update UI if necessary or startGame will handle it
            DOM.createShipPlacementUI([], handleShipSelection); // Clear placement UI for ships
            startGame(); // Proceed to start game
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
    const handleCellClick = (row, col, boardId) => {
        if (gameOver) return;

        if (shipPlacementPhase) {
            if (boardId === 'player-board' || boardId === undefined) {
                placeShip(row, col);
            }
        } else {
            // Attack phase
            if (boardId === 'enemy-board' && currentPlayer === player) {
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
            DOM.displayMessage('Please select a ship to place', 'error');
            return;
        }

        const shipData = shipsToPlace[selectedShipIndex];

        if (!shipData || !shipData.ship) {
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
            DOM.updateBoards(player.getGameboard(), computer.getGameboard(), false);

            // Create updated ship placement UI
            DOM.createShipPlacementUI(shipsToPlace, handleShipSelection);

            // Check if all ships are placed
            if (shipsToPlace.length === 0) {
                // ALL ships placed, start the game
                startGame();
            } else {
                if (shipsToPlace.length > 0) {
                    selectedShipIndex = 0;
                    DOM.displayMessage(`Ship ${shipData.name} placed .Next: ${shipsToPlace[0].name}.`, 'info')
                }
            }
        } else {
            // Ship placement failed
            DOM.displayMessage('Invalid ship placement. Try again.', 'error');
        }
    };

      /**
     * Places all standard ships randomly for a given player.
     * @param {object} targetPlayer - The player (player or computer) for whom to place ships.
     * @param {Array} shipsDefinition - Array of ship types {name, length}.
     */
    const placeShipsRandomlyForPlayer = (targetPlayer, shipsDefinition) => {
        // If it's human, clear the board first
        if (targetPlayer === player) {
            // Potentially reset the player's board if they click "Random Placement" mid-setup
            // For now, assuming this is called at the start or if they choose to override manual placement.
            // This might involve creating a new Gameboard for the player or clearing existing ships.
        }

        shipsDefinition.forEach(shipData => {
            const ship = Ship(shipData.length)
            let placed = false;
            let attempts = 0; // Prevent infinite loop
            while (!placed && attempts < 200) {
                const row = Math.floor(Math.random() * 10);
                const col = Math.floor(Math.random() * 10);
                const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
                placed = targetPlayer.getGameboard().placeShip(ship, row, col, orientation);
                attempts++
            }
            if (!placed) {
                console.error(`Could not place ${shipData.name} for ${targetPlayer.getName()} after ${attempts} attempts.`);
            }
        });

        // If human player, clear shipsToPlace
        if (targetPlayer === player) {
            shipsToPlace.length = 0;
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
        if (computer.getGameboard().allShipsSunk() && computer.getGameboard().getMissedAttacks().length === 0) {
        placeShipsRandomlyForPlayer(computer, shipTypes)
    }
        // End placement phase
        shipPlacementPhase = false;

        // Ensure game doesn't end prematurely
        gameOver = false;

        // Player always starts
        currentPlayer = player;

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
        if (currentPlayer !== player || gameOver) return;

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

        if (!gameOver) {
        // Switch to computer's turn
        currentPlayer = computer;

        // Add a slight delay
        setTimeout(computerTurn, 1000);
      }
    };

    /**
     *  Computer's turn
     */
    const computerTurn = () => {
        if (gameOver || currentPlayer !== computer) return;

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

        if (!gameOver) {
        // Switch back to player's turn
        currentPlayer = player;
        }
    };

    /**
     * End the game
     * @param {boollean} playerWon - whether the player won
     */
    const endGame = (playerWon) => {
        gameOver = true;
        shipPlacementPhase = false;

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