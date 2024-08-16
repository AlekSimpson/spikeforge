//const socket = new WebSocket('ws://localhost:8080');
var total_neurons = -1;
var paramsConfirmed = false;
let ROW = -1;
let COL = -1;
let GRID_SIZE = -1;
let LIFETIME = -1;
let INPUTS = -1;
let OUTPUTS = -1;
let TOTAL = -1;
let matrix = [[]];

let animationInterval;
let barPosition = 0;

// Add these new functions to your index.js file
function startBarAnimation() {
    const gridContainer = document.getElementById('grid-container');
    const movingBar = document.getElementById('moving-bar');

    // Reset bar position
    barPosition = 0;
    movingBar.style.left = '0px';

    // Clear any existing animation
    clearInterval(animationInterval);

    // Start new animation
    lastPercent = -1
    animationInterval = setInterval(() => {
        scrollPercent = (gridContainer.scrollLeft / gridContainer.scrollWidth) * 100
        if (scrollPercent - lastPercent == 0) {
            barPosition += 1;
            movingBar.style.transition = `left ${1000}ms linear`;
            movingBar.style.left = `${barPosition}px`;

            return
        } 

        gridContainer.scrollLeft += 1
        lastPercent = scrollPercent
    }, 0.1); // Adjust this value to change the speed of the bar
}

function stopBarAnimation() {
    clearInterval(animationInterval);
}

function get2dCoordinate(index, width) {
    return [index % width, Math.floor(index / width)]
}

function create2dArray(rows, windowWidth) {
    var arr = []

    for (let i = 0; i < rows; i++) {
        arr.push([])
        for (let j = 0; j < windowWidth; j++) {
            arr[i].push(0)
        }
    }

    return arr;
}

function startNetworkSimulation() {
    GRID_SIZE = document.getElementById('grid_size').value;
    INPUTS = document.getElementById('inputs').value;
    OUTPUTS = document.getElementById('outputs').value;
    TOTAL = GRID_SIZE * GRID_SIZE
    if (GRID_SIZE == -1 || INPUTS == -1 || OUTPUTS == -1 || TOTAL == -1) {
        return
    }

    //socket.send(JSON.stringify({
    //    'play' : true,
    //    'grid-size' : GRID_SIZE,
    //    'lifetime' : LIFETIME,
    //    'neuron-total' : TOTAL,
    //    'inputs' : INPUTS,
    //    'outputs' : OUTPUTS,
    //    'network' : matrix,
    //}))

    startBarAnimation()
}

function confirmNetworkParams() {
    const gridContainer = document.getElementById('grid-container');

    if (paramsConfirmed) {
        paramsConfirmed = false
        gridContainer.replaceChildren()
    }

    const gridSize = document.getElementById('grid_size').value;
    const inputAmt = document.getElementById('inputs').value;
    const windowWidth = document.getElementById('window_width').value;

    if (gridSize == "" || inputAmt == "") {
        return;
    }

    total_neurons = gridSize * gridSize;

    // Set the grid-template-rows and grid-template-columns CSS properties
    gridContainer.style.gridTemplateRows = `repeat(${inputAmt}, 1fr)`;

    matrix = create2dArray(inputAmt, windowWidth)

    let index = 0
    for (let row = 0; row < inputAmt; row++) {
        for (let col = 0; col < windowWidth; col++) {
            const cell = document.createElement('div');
            let coord = get2dCoordinate(index, inputAmt)
            cell.classList.add('grid-cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.dataset.id = `${coord[0]}${coord[1]}`

            // Display the cell coordinates
            cell.textContent = `${coord[0]}, ${coord[1]}`;

            cell.addEventListener('click', () => {
                cell.classList.toggle('active');
                matrix[row][col] = 1
            });

            gridContainer.appendChild(cell);
            index++;
        }
    }
    paramsConfirmed = true
}


document.addEventListener('DOMContentLoaded', () => {
    var confirmParamsButton = document.getElementById("confirm")
    var playSimButton = document.getElementById('play-sim')

    confirmParamsButton.addEventListener("click", confirmNetworkParams)
    playSimButton.addEventListener("click", startNetworkSimulation)
});




