/**
 * Module for DOM manipulation
 */
const DOM = (() => {
    let currentDraggedShip = null; // To store info about the ship being dragged

    /**
     * Create the game boards in the DOM
     * @param {function} cellClickHandler - Function to handle attacks or placement clicks
     * @param {function} cellDropHandler - Function to handle ship drop on cell
     * @param {function} cellDragOverHandler - Function to handle drag over cell
     */
    const createGameBoards = (cellClickHandler, cellDropHandler, cellDragOverHandler) => { // Added new handlers
        const gameContainer = document.querySelector('.game-container');

        if (!gameContainer) {
            console.error('Game container not found. UI will not be created');
            return;
        }
        gameContainer.innerHTML = '';

        const playerBoardContainer = document.createElement('div');
        playerBoardContainer.classList.add('board-container');
        const playerLabel = document.createElement('h2');
        playerLabel.textContent = 'Your Fleet';
        playerBoardContainer.appendChild(playerLabel);
        // Pass drop and dragover handlers to player board only
        const playerBoard = createBoard('player-board', cellClickHandler, cellDropHandler, cellDragOverHandler);
        playerBoardContainer.appendChild(playerBoard);

        const enemyBoardContainer = document.createElement('div');
        enemyBoardContainer.classList.add('board-container', 'enemy-board-container');
        const enemyLabel = document.createElement('h2');
        enemyLabel.textContent = 'Enemy Waters';
        enemyBoardContainer.appendChild(enemyLabel);
        const enemyBoard = createBoard('enemy-board', cellClickHandler); // Enemy board doesn't need drop
        enemyBoardContainer.appendChild(enemyBoard);

        gameContainer.appendChild(playerBoardContainer);
        gameContainer.appendChild(enemyBoardContainer);
    };

    /**
     * Create a single game board
     * @param {string} id - ID for the board element
     * @param {function} [cellClickHandler] - Optional click handler for the board cells
     * @param {function} [cellDropHandler] - Optional drop handler for player board cells
     * @param {function} [cellDragOverHandler] - Optional dragover handler for player board cells
     * @returns {HTMLElement} the created board element
     */
    const createBoard = (id, cellClickHandler = null, cellDropHandler = null, cellDragOverHandler = null) => {
        const board = document.createElement('div');
        board.id = id;
        board.classList.add('board');

        const collabels = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        const labelRow = document.createElement('div');
        labelRow.classList.add('board-row', 'label-row');
        collabels.forEach(label => {
            const labelCell = document.createElement('div');
            labelCell.classList.add('board-cell', 'label');
            labelCell.textContent = label;
            labelRow.appendChild(labelCell);
        });
        board.appendChild(labelRow);

        for (let row = 0; row < 10; row++) {
            const boardRow = document.createElement('div');
            boardRow.classList.add('board-row');
            const rowLabelCell = document.createElement('div');
            rowLabelCell.classList.add('board-cell', 'label');
            rowLabelCell.textContent = row + 1;
            boardRow.appendChild(rowLabelCell);

            for (let col = 0; col < 10; col++) {
                const cell = document.createElement('div');
                cell.classList.add('board-cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.dataset.boardId = id;

                if (cellClickHandler) {
                    cell.addEventListener('click', () => cellClickHandler(row, col, id));
                }
                // Add drag and drop listeners only to player's board cells during placement phase
                if (id === 'player-board' && cellDropHandler && cellDragOverHandler) {
                    cell.addEventListener('dragover', (event) => {
                        event.preventDefault(); // Necessary to allow dropping
                        if (cellDragOverHandler) cellDragOverHandler(row, col, event);
                        cell.classList.add('drag-over-target'); // Visual feedback
                    });
                    cell.addEventListener('dragleave', (event) => {
                        cell.classList.remove('drag-over-target');
                    });
                    cell.addEventListener('drop', (event) => {
                        event.preventDefault();
                        cell.classList.remove('drag-over-target');
                        if (cellDropHandler) cellDropHandler(row, col, currentDraggedShip);
                        currentDraggedShip = null; // Clear after drop
                    });
                }
                boardRow.appendChild(cell);
            }
            board.appendChild(boardRow);
        }
        return board;
    };

    /**
     * Update the game boards based on the current game state
     * @param {Object} playerGameBoard - The player's game board
     * @param {Object} enemyGameBoard - The enemy's game board
     * @param {boolean} showEnemyShips - whether to show enemy ships
     * @param {string} [activePlayerId=null] - ID of the board belonging to the current human player in hotseat mode
     */
    const updateBoards = (playerGameBoard, enemyGameBoard, showEnemyShips = false, activePlayerId = null) => {
        if (activePlayerId === 'player1-board') {
            updateSingleBoard('player-board', playerGameBoard, true); // Player 1 sees their ships
            updateSingleBoard('enemy-board', enemyGameBoard, showEnemyShips); // Player 1 sees opponent's (P2 or AI) hits/misses
        } else if (activePlayerId === 'player2-board') {
            // When it's Player 2's turn, 'player-board' shows Player 2's ships, 'enemy-board' shows Player 1's hits/misses
            updateSingleBoard('player-board', playerGameBoard, true); // Player 2 sees their ships (on their board)
            updateSingleBoard('enemy-board', enemyGameBoard, showEnemyShips); // Player 2 sees opponent's (P1) hits/misses
        } else { // Default for P vs AI or end game
            updateSingleBoard('player-board', playerGameBoard, true);
            updateSingleBoard('enemy-board', enemyGameBoard, showEnemyShips);
        }
    };
    
    const updateSingleBoard = (boardId, gameboardInstance, showShips) => {
        const boardElement = document.getElementById(boardId);
        if (!boardElement) {
            console.error(`Board element with ID '${boardId}' not found.`); // Can be noisy if boards are swapped
            return;
        }

        const boardData = gameboardInstance.getBoard();
        const missedAttacks = gameboardInstance.getMissedAttacks();

        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
                const cellElement = boardElement.querySelector(`.board-cell[data-row="${r}"][data-col="${c}"]`);
                if (!cellElement) continue;

                cellElement.className = 'board-cell'; // Reset classes
                // Re-add dataset attributes if they were cleared by className reset (though they shouldn't be)
                cellElement.dataset.row = r;
                cellElement.dataset.col = c;
                cellElement.dataset.boardId = boardId;


                const cellState = boardData[r][c];

                if (cellState && cellState.ship) {
                    if (showShips || boardId.startsWith(currentActivePlayerBoardId) ) { // Show ships on current player's own board
                        cellElement.classList.add('ship');
                    }
                    if (cellState.ship.isHitAt(cellState.index)) {
                        cellElement.classList.add('hit');
                         // For enemy board, don't show 'ship' class unless showEnemyShips is true, but always show 'hit'
                        if ( (boardId === 'enemy-board' || (activePlayerBoardId && !boardId.startsWith(activePlayerBoardId)) ) && !showShips) {
                           // The 'hit' class itself with styling should be enough.
                           // If it's an enemy board and we are not showing ships, 'hit' is what player sees.
                        }
                    }
                }
            }
        }
        
        missedAttacks.forEach(([row, col]) => {
            const missedCell = boardElement.querySelector(`.board-cell[data-row="${row}"][data-col="${col}"]`);
            if (missedCell) {
                missedCell.classList.add('miss');
            }
        });
        // Add labels if they were stripped (though they shouldn't be with cell-specific class reset)
        boardElement.querySelectorAll('.label').forEach(lbl => {
             if (!lbl.classList.contains('board-cell')) lbl.classList.add('board-cell');
        });
    };


            /**
        * Display a message to the player
        * @param {string} message - The message to display
        * @param {string} [type='info'] - The type of message (info, error, success)
        */
        const displayMessage = (message, type = 'info') => {
            const messageContainer = document.querySelector('.message-container');
            if (!messageContainer) {
                console.warn('Message container not found. Message not displayed', message)
                return;
            } 
            const messageElement = document.createElement('div');
            messageElement.textContent = message;
            messageElement.classList.add('message', type);

            // Clear previous messages
            messageContainer.innerHTML = '';
            messageContainer.appendChild(messageElement);

            // Auto-remove after 5 seconds for non-error messages
            if (type !== 'error') {
            setTimeout(() => {
                if (messageContainer.contains(messageElement)) {
                messageContainer.removeChild(messageElement);
                }
            }, 4000);
          }
        }

    /**
     * Create ship placement UI
     * @param {Array} ships - Array of ship objects with their lengths
     * @param {function} placementClickHandler - Function to handle ship selection (click)
     * @param {function} orientationChangeHandler - Function to handle orientation change
     * @param {function} randomPlacementHandler - Function to handle random placement button
     */
    const createShipPlacementUI = (ships, placementClickHandler, orientationChangeHandler, randomPlacementHandler) => {
        const placementContainer = document.querySelector('.placement-container');
        if (!placementContainer) {
            console.warn('Placement container not found. Ship placement UI not created.');
            return;
        }
        placementContainer.innerHTML = '';

        if (ships.length === 0) {
            placementContainer.style.display = 'none';
            return;
        }
        placementContainer.style.display = 'block';

        const title = document.createElement('h2');
        title.textContent = 'Place Your Ships';
        placementContainer.appendChild(title);
        const instructions = document.createElement('p');
        instructions.textContent = 'Drag a ship to the board or select, choose orientation, then click. (Drag & Drop enabled)';
        placementContainer.appendChild(instructions);

        const shipSelection = document.createElement('div');
        shipSelection.classList.add('ship-selection');

        ships.forEach((shipData, index) => {
            const shipElement = document.createElement('div');
            shipElement.classList.add('ship-option');
            shipElement.dataset.index = index; // Store original index from shipsToPlace
            shipElement.dataset.length = shipData.length;
            shipElement.dataset.name = shipData.name; // Store name
            shipElement.textContent = `${shipData.name} (${shipData.length})`;
            shipElement.draggable = true; // Make ship draggable

            shipElement.addEventListener('dragstart', (event) => {
                // Pass ship data through the drag event
                currentDraggedShip = {
                    name: shipData.name,
                    length: shipData.length,
                    shipObjectIndex: index, // Index in the shipsToPlace array
                    // Orientation will be read from the select input at the moment of drop or click
                };
                event.dataTransfer.setData('text/plain', shipData.name); // Necessary for FF
                event.target.classList.add('dragging');
                // Optionally, provide a custom drag image
            });

            shipElement.addEventListener('dragend', (event) => {
                event.target.classList.remove('dragging');
                document.querySelectorAll('.placement-preview, .placement-invalid').forEach(cell => {
                    cell.classList.remove('placement-preview', 'placement-invalid')
                })
            });

            shipElement.addEventListener('click', () => {
                document.querySelectorAll('.ship-option').forEach(el => el.classList.remove('selected'));
                shipElement.classList.add('selected');
                if (placementClickHandler) placementClickHandler(index); // Pass original index
            });

            shipSelection.appendChild(shipElement);
        });
        placementContainer.appendChild(shipSelection);

        const orientationContainer = document.createElement('div');
        orientationContainer.classList.add('orientation-container');
        const orientationLabel = document.createElement('label');
        orientationLabel.textContent = 'Orientation: ';
        orientationLabel.setAttribute('for', 'orientation-select');
        const orientationSelect = document.createElement('select');
        orientationSelect.id = 'orientation-select';
        ['horizontal', 'vertical'].forEach(val => {
            const option = document.createElement('option');
            option.value = val;
            option.textContent = val.charAt(0).toUpperCase() + val.slice(1);
            orientationSelect.appendChild(option);
        });
        orientationSelect.addEventListener('change', () => {
            if (orientationChangeHandler) orientationChangeHandler(orientationSelect.value);
        });
        orientationContainer.appendChild(orientationLabel);
        orientationContainer.appendChild(orientationSelect);
        placementContainer.appendChild(orientationContainer);

        const randomButton = document.createElement('button');
        randomButton.textContent = 'Place Ships Randomly';
        randomButton.classList.add('random-button');
        randomButton.addEventListener('click', () => {
            if (randomPlacementHandler) randomPlacementHandler();
        });
        placementContainer.appendChild(randomButton);

        if (ships.length > 0 && placementClickHandler) { // Auto-select first ship
            const firstShipEl = shipSelection.querySelector('.ship-option');
            if (firstShipEl) {
                firstShipEl.classList.add('selected');
                placementClickHandler(0); // Pass original index
            }
        }
    };
    
    
        /**
        * Show the game over screen
        * @param {string} winner - The winner of the game
        * @param {function} restartHandler - Function to handle restarting the game
        */
    const showGameOver = (playerWon, restartHandler) => {
        const gameOverContainer = document.createElement('div') || document.body; // Fallback to bodt
        gameOverContainer.classList.add('game-over');

        const gameOverMessage = document.createElement('h2');
        gameOverMessage.textContent = playerWon ? 'Victory! You sunk all enemy ships!' : 'Defeat! You fleet has been destroyed.';
        gameOverContainer.appendChild(gameOverMessage);

        const restartButton = document.createElement('button');
        restartButton.textContent = 'Play Again';
        restartButton.addEventListener('click', restartHandler);
        gameOverContainer.appendChild(restartButton);

        // Add to page
        const gameContainer = document.querySelector('.game-container');
        gameContainer.appendChild(gameOverContainer);
        };

        /**
        * Initialize the game UI
        */
    const initializeUI = () => {
        const gameContainer = document.querySelector('.game-container');
        if (!gameContainer) {
            console.error('Game container not found. Creating a new one.');
            const container = document.createElement('div');
            container.classList.add('game-container');
            document.body.appendChild(container);
        }

        const messageContainer = document.querySelector('.message-container');
        if (!messageContainer) {
            const container = document.createElement('div');
            container.classList.add('message-container');
            document.body.appendChild(container);
        }

        const placementContainer = document.querySelector('.placement-container');
        if (!placementContainer) {
            const container = document.createElement('div');
            container.classList.add('placement-container');
            document.body.appendChild(container);
            }
        };



    // Global variable for current active player board in hotseat (used by updateSingleBoard)
    let currentActivePlayerBoardId = 'player-board'; // Default for P1 or PvAI
    let activePlayerBoardId = null; // For hotseat, set by game logic


    return {
        initializeUI,
        createGameBoards,
        updateBoards,
        displayMessage,
        createShipPlacementUI,
        showGameOver,
        // Expose method to set active player board for hotseat UI updates
        setActivePlayerBoardId: (boardId) => {
            activePlayerBoardId = boardId;
            currentActivePlayerBoardId = boardId;
        },
        // Add a function to show a pass device screen
        showPassDeviceScreen: (nextPlayerName, callback) => {
    const existingScreen = document.querySelector('.pass-device-screen');
    if (existingScreen) existingScreen.remove(); // Remove if one is already there

    const passScreen = document.createElement('div');
    passScreen.classList.add('pass-device-screen'); // Style this class
    passScreen.style.position = 'fixed';
    passScreen.style.top = '0';
    passScreen.style.left = '0';
    passScreen.style.width = '100vw';
    passScreen.style.height = '100vh';
    passScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    passScreen.style.color = 'white';
    passScreen.style.display = 'flex';
    passScreen.style.flexDirection = 'column';
    passScreen.style.justifyContent = 'center';
    passScreen.style.alignItems = 'center';
    passScreen.style.zIndex = '2000'; // Ensure it's on top

    const message = document.createElement('h2');
    message.textContent = `Player 1, please pass the device to ${nextPlayerName}.`;
    message.style.marginBottom = '20px';
    passScreen.appendChild(message);

    const warning = document.createElement('p');
    warning.textContent = `${nextPlayerName}, please look away until the device is passed to you.`;
    warning.style.marginBottom = '40px';
    passScreen.appendChild(warning);

    const continueButton = document.createElement('button');
    continueButton.textContent = `${nextPlayerName}, Click When Ready`;
    continueButton.style.padding = '15px 30px';
    continueButton.style.fontSize = '1.2em';
    continueButton.addEventListener('click', () => {
        passScreen.remove();
        if (callback) callback();
    }, { once: true }); // Ensure the callback only runs once
    passScreen.appendChild(continueButton);

    document.body.appendChild(passScreen);
},
    };
})();

export default DOM;
