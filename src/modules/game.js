import Ship from './ship.js';
import Gameboard from './gameboard.js';
import Player from './player.js';
import DOM from './dom.js';

/**
 * Game controller module
 */
const Game = (() => {
    let player1; 
    let player2; // Could be 'computer' or human player 2
    let currentPlayer;
    let gameOver = false;
    let shipPlacementPhase = true;
    let currentShipToPlaceIndex = 0; // Index in shipsToPlaceForCurrentPlayer
    let currentPlacementOrientation = 'horizontal';
    let gameMode = 'vsComputer'; // 'vsComputer' or 'vsPlayer'
    let shipsToPlaceForCurrentPlayer = [];
    let currentDraggedShip = null; // Track the currently dragged ship


    const shipTypes = [
        { name: 'Carrier', length: 5 },
        { name: 'Battleship', length: 4 },
        { name: 'Cruiser', length: 3 },
        { name: 'Submarine', length: 3 },
        { name: 'Destroyer', length: 2 }
    ];

    const initialize = () => {
        DOM.initializeUI();
        DOM.displayMessage('Welcome to Battleship! Place your ships.');
        setupGame(); // Simplified setup
    };

    const prepareShipsToPlace = () => {
        const ships = [];
        shipTypes.forEach(shipType => {
            ships.push({
                name: shipType.name,
                length: shipType.length,
                ship: Ship(shipType.length) // Create the actual ship object
            });
        });
        return ships;
    };

    const handleCellDragOver = (row, col, event) => {
        // Check if a ship is being dragged
        if (!currentDraggedShip) return;

        const length = currentDraggedShip.length;
        const orientation = document.getElementById('orientation-select').value
        const gameboard = currentPlayer.getGameBoard()

        const cellsToHightlight = []
        if (orientation === 'horizontal') {
            for (let i = 0; i < length; i++) {
                const c = col + i
                if (c >= 10) break;
                cellsToHightlight.push([row, c])
            }
        } else {
            for (let i = 0; i < length; i++) {
                const r = row + i;
                if (r >= 10) break;
                cellsToHightlight.push([r, col])
            }
        }

        const isValid = gameboard.canPlaceShip(length, row, col, orientation)

        // remove Previous highlights
        document.querySelectorAll('.placement-preview, .placement-invalid').forEach(cell => {
            cell.classList.remove('.placement-preview', 'placement-invalid')
        })

        // Hightlight the cells
        cellsToHightlight.forEach(([r,c]) => {
            const cell = document.querySelector(`#player-board .board-cell[data-row="${r}"][data-col="${c}"]`)
            if (cell) {
                if (isValid) {
                    cell.classList.add('placement-preview');
                } else {
                    cell.classList.add('placement-invalid')
                }
            }
        })
    }

    const setupGame = () => {
        player1 = Player('Player 1', false);
        // Computer player setup (will be adjusted for 2-player mode later)
        player2 = Player('Computer', gameMode === 'vsComputer');

        shipsToPlaceForCurrentPlayer = prepareShipsToPlace();
        currentPlayer = player1; // Player 1 places ships first
        shipPlacementPhase = true;
        gameOver = false;
        currentShipToPlaceIndex = 0;
        currentPlacementOrientation = 'horizontal';


        DOM.createGameBoards(handleCellClick, handleCellDrop, handleCellDragOver); // Pass new handlers
        DOM.updateBoards(player1.getGameBoard(), player2.getGameBoard(), false);
        DOM.createShipPlacementUI(
            shipsToPlaceForCurrentPlayer,
            handleShipSelectionClick,
            handleOrientationChange,
            handleRandomPlacement // Pass the actual function
        );
        displayPlacementMessage();
    };
    
    const displayPlacementMessage = () => {
        if (shipsToPlaceForCurrentPlayer.length > 0 && currentShipToPlaceIndex < shipsToPlaceForCurrentPlayer.length) {
            const shipName = shipsToPlaceForCurrentPlayer[currentShipToPlaceIndex].name;
            DOM.displayMessage(`${currentPlayer.getName()}, place your ${shipName}. Orientation: ${currentPlacementOrientation}.`);
        } else if (shipPlacementPhase) {
             // This case should ideally trigger next phase or next player's placement
        }
    };


    const handleShipSelectionClick = (shipIndex) => { // shipIndex is from the shipsToPlace array
        currentShipToPlaceIndex = shipIndex;
        // The selected class is handled by DOM, Game just needs to know the index for click placement.
        displayPlacementMessage();
    };

    const handleOrientationChange = (orientation) => {
        currentPlacementOrientation = orientation;
        displayPlacementMessage();
    };

    const handleRandomPlacement = () => {
        placeShipsRandomlyForPlayer(currentPlayer, shipTypes, shipsToPlaceForCurrentPlayer);
        // After random placement, shipsToPlaceForCurrentPlayer should be empty.
        DOM.createShipPlacementUI([], handleShipSelectionClick, handleOrientationChange, handleRandomPlacement); // Clear UI
        proceedToNextPhaseOrPlayer();
    };

    // Handler for dropping a ship onto a cell
    const handleCellDrop = (row, col, draggedShipData) => {
        if (!shipPlacementPhase || !draggedShipData) return;

        // Find the ship object from shipsToPlaceForCurrentPlayer based on draggedShipData
        // draggedShipData.shipObjectIndex is the index in the original full list.
        const shipToPlaceData = shipsToPlaceForCurrentPlayer.find(
            s => s.name === draggedShipData.name && !s.isPlaced // Ensure it's not already placed if logic allows duplicates temp
        );

        if (!shipToPlaceData || !shipToPlaceData.ship) {
            DOM.displayMessage('Error finding ship to place from drag.', 'error');
            return;
        }
        
        const orientation = document.getElementById('orientation-select').value; // Get current orientation

        const placed = currentPlayer.getGameBoard().placeShip(
            shipToPlaceData.ship,
            row,
            col,
            orientation
        );

        if (placed) {
            const placedShipName = shipToPlaceData.name;
            // Remove from shipsToPlaceForCurrentPlayer
            shipsToPlaceForCurrentPlayer = shipsToPlaceForCurrentPlayer.filter(s => s.name !== placedShipName);
            
            DOM.updateBoards(player1.getGameBoard(), player2.getGameBoard(), false); // Update player1's board
            DOM.createShipPlacementUI(shipsToPlaceForCurrentPlayer, handleShipSelectionClick, handleOrientationChange, handleRandomPlacement);

            if (shipsToPlaceForCurrentPlayer.length === 0) {
                proceedToNextPhaseOrPlayer();
            } else {
                currentShipToPlaceIndex = 0; // Reset selection to the new first ship
                 if (document.querySelector('.ship-option')) { // Auto-select next ship in UI
                    document.querySelector('.ship-option').classList.add('selected');
                 }
                displayPlacementMessage();
            }
        } else {
            DOM.displayMessage('Invalid ship placement. Try again.', 'error');
        }
    };


    const handleCellClick = (row, col, boardId) => {
        if (gameOver) return;

        if (shipPlacementPhase) {
            // Only allow placement on the current player's board (assumed to be 'player-board' for player1)
            if ((currentPlayer === player1 && boardId === 'player-board') ||
                (currentPlayer === player2 && !player2.isComputer() && boardId === 'player-board')) { // In 2-player, P2 also uses 'player-board' visually after pass
                
                if (currentShipToPlaceIndex < 0 || currentShipToPlaceIndex >= shipsToPlaceForCurrentPlayer.length) {
                     DOM.displayMessage('Please select a ship to place.', 'error');
                     return;
                }
                const shipData = shipsToPlaceForCurrentPlayer[currentShipToPlaceIndex];
                placeShipOnClick(row, col, shipData);
            }
        } else { // Attack phase
            if (currentPlayer === player1 && boardId === 'enemy-board') {
                processAttack(player1, player2, row, col);
            } else if (currentPlayer === player2 && gameMode === 'vsPlayer' && boardId === 'enemy-board') {
                // In 2-player mode, player2 attacks player1 (whose board is now 'enemy-board' from P2's perspective)
                processAttack(player2, player1, row, col);
            }
            // Computer attacks are handled by computerTurn, not direct cell clicks
        }
    };

    const placeShipOnClick = (row, col, shipData) => {
        if (!shipData || !shipData.ship) {
            DOM.displayMessage('No ship selected or ship data invalid.', 'error');
            return;
        }

        const result = currentPlayer.getGameBoard().placeShip(
            shipData.ship,
            row,
            col,
            currentPlacementOrientation
        );

        if (result) {
            const placedShipName = shipData.name;
            shipsToPlaceForCurrentPlayer = shipsToPlaceForCurrentPlayer.filter(s => s.name !== placedShipName);

            DOM.updateBoards(
                gameMode === 'vsPlayer' && currentPlayer === player2 ? player2.getGameBoard() : player1.getGameBoard(),
                gameMode === 'vsPlayer' && currentPlayer === player2 ? player1.getGameBoard() : player2.getGameBoard(),
                false
            );
            DOM.createShipPlacementUI(shipsToPlaceForCurrentPlayer, handleShipSelectionClick, handleOrientationChange, handleRandomPlacement);

            if (shipsToPlaceForCurrentPlayer.length === 0) {
                proceedToNextPhaseOrPlayer();
            } else {
                currentShipToPlaceIndex = 0; // Auto-select next available ship
                 if (document.querySelector('.ship-option')) {
                    document.querySelector('.ship-option').classList.add('selected');
                 }
                displayPlacementMessage();
            }
        } else {
            DOM.displayMessage('Invalid ship placement. Try again.', 'error');
        }
    };
    
     const proceedToNextPhaseOrPlayer = () => {
        if (gameMode === 'vsPlayer' && currentPlayer === player1 && player2.getGameBoard().allShipsSunk()) {
            // Player 1 finished, now Player 2 places ships
            
            DOM.showPassDeviceScreen(player2.getName(), () => {
                // This callback executes after Player 2 clicks "Ready to Continue"
                currentPlayer = player2;
                shipsToPlaceForCurrentPlayer = prepareShipsToPlace(); // Fresh set for P2
                currentShipToPlaceIndex = 0;
                currentPlacementOrientation = 'horizontal'; // Reset orientation too

                DOM.displayMessage(`${player2.getName()}, it's your turn to place ships. Drag or click to place.`);

                // Inform the DOM module that Player 2 is now active.
                DOM.setActivePlayerBoardId('player2-board'); // Or a generic ID if you adapt DOM


                DOM.updateBoards(
                    player2.getGameBoard(), // This is now the "primary" board for placement
                    player1.getGameBoard(), // This is the "other" board
                    false // Don't show enemy ships
                );

                DOM.createShipPlacementUI(
                    shipsToPlaceForCurrentPlayer,
                    handleShipSelectionClick,
                    handleOrientationChange,
                    handleRandomPlacement
                );
                displayPlacementMessage(); // Update ship placement instruction message for P2
            });
        } else {
            // All players finished placement (or vs Computer and P1 finished)
            startGamePlay();
        }
    };



    const placeShipsRandomlyForPlayer = (targetPlayer, shipsDefinition, shipsToPlaceArray) => {

        shipsDefinition.forEach(shipData => {
            const shipInstance = Ship(shipData.length); // Create a new ship instance
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 200) {
                const row = Math.floor(Math.random() * 10);
                const col = Math.floor(Math.random() * 10);
                const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
                placed = targetPlayer.getGameBoard().placeShip(shipInstance, row, col, orientation);
                attempts++;
            }
            if (!placed) console.error(`Could not place ${shipData.name} for ${targetPlayer.getName()}`);
        });
        
        // Clear the conceptual list of ships to place for this player
        while(shipsToPlaceArray.length > 0) shipsToPlaceArray.pop(); 
    };

    const startGamePlay = () => {
        shipPlacementPhase = false;
        const placementContainer = document.querySelector('.placement-container');
        if (placementContainer) placementContainer.innerHTML = ''; // Clear placement UI

        // Computer places its ships if not already placed (e.g. if P1 placed randomly too)
        if (gameMode === 'vsComputer' && player2.getGameBoard().allShipsSunk() && player2.getGameBoard().getMissedAttacks().length === 0) {
            placeShipsRandomlyForPlayer(player2, shipTypes, []); // Pass empty array as it's not used for UI update here
        }
        
        gameOver = false;
        currentPlayer = player1; // Player 1 always starts attack phase

        DOM.displayMessage('Game started! Click on the enemy board to attack.', 'success');
        // Update boards for the start of the game. Player 1 is active.
        DOM.setActivePlayerBoardId('player1-board'); // For potential hotseat UI logic
        DOM.updateBoards(player1.getGameBoard(), player2.getGameBoard(), false); // Show P1's board, P2's hidden
    };

    /**
     * Process an attack from attacker to defender
     */
    const processAttack = (attacker, defender, humanRow, humanCol) => {
        if (gameOver || currentPlayer !== attacker) return;

        const attackOutcome = attacker.attack(defender.getGameBoard(), humanRow, humanCol);

        if (!attackOutcome || attackOutcome.attackResult === null) {
            DOM.displayMessage('Invalid attack (e.g., already attacked). Try again.', 'error');
            return;
        }

        const { attackResult, row, col} = attackOutcome


        DOM.updateBoards(
            gameMode === 'vsComputer' ? player1.getGameBoard() : (attacker === player1 ? player1.getGameBoard() : player2.getGameBoard()),
            gameMode === 'vsComputer' ? player2.getGameBoard() : (attacker === player1 ? player2.getGameBoard() : player1.getGameBoard()),
            false // Never show enemy ships during active play
        );


        const messageType = attackResult === 'hit' ? 'success' : 'info';
        let message = '';
        if (attacker.isComputer()) {
            message = attackResult === 'hit' ? `Computer hit your ship at [${row + 1}, ${String.fromCharCode(65 + col)}]!` : `Computer missed at [${row + 1}, ${String.fromCharCode(65 + col)}]!`;
        } else {
            message = attackResult === 'hit' ? `Hit enemy ship at [${row + 1}, ${String.fromCharCode(65 + col)}]!` : `Missed at [${row + 1}, ${String.fromCharCode(65 + col)}]!`;
        }
        DOM.displayMessage(message, messageType);
        
        if (defender.getGameBoard().allShipsSunk()) {
            endGame(attacker); // Attacker wins
            return;
        }

        // Switch turns
        if (gameMode === 'vsComputer') {
            if (attacker === player1) { // Player just attacked computer
                currentPlayer = player2; // Computer's turn
                setTimeout(computerTurn, 1000);
            } else { // Computer just attacked player
                currentPlayer = player1; // Player's turn
            }
        } else { // vsPlayer mode
            const nextPlayer = (attacker === player1) ? player2 : player1;
            DOM.showPassDeviceScreen(nextPlayer.getName(), () => {
                currentPlayer = nextPlayer;
                DOM.displayMessage(`${currentPlayer.getName()}, it's your turn. Attack!`);
                // Update board display for the new current player
                // e.g. DOM.setActivePlayerBoardId(currentPlayer === player1 ? 'player1-board' : 'player2-board');
                DOM.updateBoards(
                    currentPlayer.getGameBoard(),
                    (currentPlayer === player1 ? player2 : player1).getGameBoard(),
                    false
                );
            });
        }
    };

    const computerTurn = () => { // Only for vsComputer mode
        if (gameOver || currentPlayer !== player2 || !player2.isComputer()) return;
        processAttack(player2, player1); // Computer (player2) attacks Player 1
    };

    const endGame = (winner) => {
        gameOver = true;
        shipPlacementPhase = false; // Ensure placement phase is truly over
        DOM.displayMessage(`${winner.getName()} wins! All enemy ships sunk.`, 'success');
        DOM.showGameOver(winner === player1 || (gameMode === 'vsPlayer' && winner === player1), restartGame); // Adjust win condition if P2 can be human winner
        // Show all ships on both boards
        DOM.updateBoards(player1.getGameBoard(), player2.getGameBoard(), true);
    };

    const restartGame = () => {
        const gameOverScreen = document.querySelector('.game-over'); // Also remove pass device screen if present
        if (gameOverScreen) gameOverScreen.remove();
        const passDeviceScreen = document.querySelector('.pass-device-screen');
        if (passDeviceScreen) passDeviceScreen.remove();
        
        // Full reset
        player1 = null;
        player2 = null;
        initialize(); // This will call setupGame again
    };
    
    // Exposed methods
    return {
        initialize,
    };
})();

export default Game;