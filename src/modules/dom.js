/**
 *  Module for DOM manipulation
 */
const DOM = (() => {
    /**
     *  Create the game boards in the DOM
     * @param {function} cellClickHandler - Function to handle attacks
     */
    const createGameBoards = (cellClickHandler) => {
        const gameContainer = document.querySelector('.game-container');

        if (!gameContainer) {
            console.error('Game container not found. UI will not be created');
            return;
        }

        // Clear existing content
        gameContainer.innerHTML = '';

        // Create player board
        const playerBoardContainer = document.createElement('div');
        playerBoardContainer.classList.add('board-container');

        const playerLabel = document.createElement('h2');
        playerLabel.textContent = 'Your Fleet';
        playerBoardContainer.appendChild(playerLabel);

        const playerBoard = createBoard('player-board', cellClickHandler);
        playerBoardContainer.appendChild(playerBoard);

        // Create enemy board
        const enemyBoardContainer = document.createElement('div');
        enemyBoardContainer.classList.add('board-container', 'enemy-board-container');

        const enemyLabel = document.createElement('h2');
        enemyLabel.textContent = 'Enemy Waters';
        enemyBoardContainer.appendChild(enemyLabel);

        const enemyBoard = createBoard('enemy-board', cellClickHandler);
        enemyBoardContainer.appendChild(enemyBoard);

        // Add both boards to the container
        gameContainer.appendChild(playerBoardContainer);
        gameContainer.appendChild(enemyBoardContainer);
    };

    /**
     * Create a single game board
     * @param {string} id - ID for the board element
     * @param {function} [cellClickHandler] - Optional click handler for the board cells
     * @returns {HTMLelemnt} the created board element
     */
    const createBoard = (id, cellClickHandler = null) => {
        const board = document.createElement('div');
        board.id = id;
        board.classList.add('board');

        // Add row and column labels
        const collabels = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

        // Create the top row with column labels
        const labelRow = document.createElement('div');
        labelRow.classList.add('board-row', 'label-row');

        collabels.forEach(label => {
            const labelCell = document.createElement('div');
            labelCell.classList.add('board-cell', 'label');
            labelCell.textContent = label;
            labelRow.appendChild(labelCell)
        });
        board.appendChild(labelRow)

        // Create the board cells with row labels
        for (let row = 0; row < 10; row++) {
            const boardRow = document.createElement('div');
            boardRow.classList.add('board-row');

            // Add row label
            const rowLabelCell = document.createElement('div');
            rowLabelCell.classList.add('board-cell', 'label');
            rowLabelCell.textContent = row + 1;
            boardRow.appendChild(rowLabelCell);

            // Add cells
            for (let col = 0; col < 10; col++) {
                const cell = document.createElement('div');
                cell.classList.add('board-cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.dataset.boardId = id;

                if (cellClickHandler) {
                    cell.addEventListener('click', () => cellClickHandler(row, col, id));
                }

                boardRow.appendChild(cell);
            }

            board.appendChild(boardRow);
        }

        return board;
    };

    /**
     *  Update the game boards based on the current game state
     * @param {Object} playerGameBoard - The player's game board
     * @param {Object} enemyGameBoard - The enemy's game board
     * @param {boollean} showEnemyShips - whether to show enemy ships
     */
    const updateBoards = (playerGameBoard, enemyGameBoard, showEnemyShips = false) => {
        updateSingleBoard('player-board', playerGameBoard, true);
        updateSingleBoard('enemy-board', enemyGameBoard, showEnemyShips);
    }

    /**
     *  Update a single board's display
     * @param {string} boardId - ID of the board element
     * @param {Object} gameBoard - The gameboard to display
     * @param {boollean} showShips - whether to show ships
     */
    const updateSingleBoard = (boardId, gameboardInstance, showShips) => {
        const boardElement = document.getElementById(boardId);
        if (!boardElement) {
            console.error(`Board element with ID '${boardId}' not found.`);
            return;
        }

        const boardData = gameboardInstance.getBoard(); // Array of arrays
        const missedAttacks = gameboardInstance.getMissedAttacks(); // Array of [row, col]

        // Iterate over all cells to update them
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
                const cellElement = boardElement.querySelector(`.board-cell[data-row="${r}"][data-col="${c}"]`);
                if (!cellElement) continue;

                // Reset classes, keep essential ones like 'board-cell'
                cellElement.className = 'board-cell';

                const cellState = boardData[r][c]; // null or { ship, index }

                if (cellState && cellState.ship) { // There's a ship part here
                    if (showShips) {
                        cellElement.classList.add('ship');
                    }

                    if (cellState.ship.isHitAt(cellState.index)) { // Requires ship to have `isHitAt(index)` method
                        cellElement.classList.add('hit');
                        if (boardId === 'enemy-board' && !showShips) {
                            cellElement.classList.add('enemy-hit');
                        }
                    }
                }
            }
        }
        
        // Mark missed attacks
        missedAttacks.forEach(([row, col]) => {
            const missedCell = boardElement.querySelector(`.board-cell[data-row="${row}"][data-col="${col}"]`);
            if (missedCell) {
                missedCell.classList.add('miss');
            }
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
     *  Create ship placement UI
     * @param {Array} ships - Array of ship objects with their lengths
     * @param {function} placementHandler - Function to handle ship placement
     */
    const createShipPlacementUI = (ships, placementHandler) => {
        const placementContainer = document.querySelector('.placement-container');
        if (!placementContainer) {
            console.warn('Placement container not found. Ship placement UI not created.');
            return;
        }

        // Clear existing content
        placementContainer.innerHTML = '';

        if (ships.length === 0) {
            placementContainer.style.display = 'none'
            return
        }
        placementContainer.style.display = 'block';

        // Create title
        const title = document.createElement('h2');
        title.textContent = 'Place Your Ships';
        placementContainer.appendChild(title);

        // Create instructions
        const instructions = document.createElement('p');
        instructions.textContent = 'Select a ship, choose orientation, then click on the board to place it';
        placementContainer.appendChild(instructions);

        // Create ship selection
        const shipSelection = document.createElement('div');
        shipSelection.classList.add('ship-selection');

        ships.forEach((ship, index) => {
            const shipElement = document.createElement('div');
            shipElement.classList.add('ship-option');
            shipElement.dataset.index = index;
            shipElement.dataset.length = ship.length;
            shipElement.textContent = `${ship.name} (${ship.length})`

            // Create visual representation of the ship
            for (let i = 0; i < ship.length; i++) {
                const segment = document.createElement('div');
                segment.classList.add('ship-segment');
                shipElement.appendChild(segment);
            }

            // Add ship name
            const shipName = document.createElement('span');
            shipName.textContent = ship.name;
            shipElement.appendChild(shipName);

            // Add click handler
            shipElement.addEventListener('click', () => {
                // Deselect all ships
                document.querySelectorAll('.ship-option').forEach(el => {
                    el.classList.remove('selected');
                })

                // Select this ship
                shipElement.classList.add('selected');

                // Update current selection
                const orientationSelect = document.getElementById('orientation-select');
                placementHandler(index, orientationSelect.value);
            });

            shipSelection.appendChild(shipElement);
        });

        placementContainer.appendChild(shipSelection);

        // Create orientation selection
        const orientationContainer = document.createElement('div');
        orientationContainer.classList.add('orientation-container');

        const orientationLabel = document.createElement('label');
        orientationLabel.textContent = 'Orientation: ';
        orientationLabel.setAttribute('for', 'orientation-select');

        const orientationSelect = document.createElement('select'); 
        orientationSelect.id = 'orientation-select';

        const horizontalOption = document.createElement('option');
        horizontalOption.value = 'horizontal';
        horizontalOption.textContent = 'Horizontal';

        const verticalOption = document.createElement('option');
        verticalOption.value = 'vertical';
        verticalOption.textContent = 'Vertical';

        orientationSelect.appendChild(horizontalOption);
        orientationSelect.appendChild(verticalOption);

        // Add change handler
        orientationSelect.addEventListener('change', () => {
            const selectedShip = document.querySelector('.ship-option.selected');
            if (selectedShip) {
                placementHandler(parseInt(selectedShip.dataset.index), orientationSelect.value);
            }
        });

        orientationContainer.appendChild(orientationLabel);
        orientationContainer.appendChild(orientationSelect);
        placementContainer.appendChild(orientationContainer);

        // Create random placement button
        const randomButton = document.createElement('button');
        randomButton.textContent = 'Random Placement';
        randomButton.classList.add('random-button');
        randomButton.addEventListener('click', () => {
            placementHandler(-1, 'random');
        });

        placementContainer.appendChild(randomButton);

        // Make first ship selected by default
        if (ships.length > 0) {
            const firstShip = shipSelection.querySelector('.ship-option');
            firstShip.classList.add('selected');
            placementHandler(0, 'horizontal');
        }
    };

    /**
     *  Show the game over screen
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
     *  Initialize the game UI
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

    return {
        initializeUI,
        createGameBoards,
        updateBoards,
        displayMessage,
        createShipPlacementUI,
        showGameOver
    };
})();

export default DOM;