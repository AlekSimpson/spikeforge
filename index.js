const socket = new WebSocket('ws://localhost:8080');

socket.onopen = () => {
    console.log("connected!")
}

let last_col = 0

socket.onmessage = (event) => {
    console.log(event.data)
    let input_amt = Number(document.getElementById('inputs').value);
    input_amt += Number(document.getElementById('outputs').value);
    const gridContainer = document.getElementById('grid-container');
    const windowWidth = Number(document.getElementById('window_width').value);
    let current_tick = Number(event.data) % windowWidth
    if (current_tick == 0) {
        gridContainer.scrollLeft = 0
    }

    dehighlightCol(input_amt, last_col)
    highlightCol(input_amt, current_tick)

    last_col = current_tick
    gridContainer.scrollLeft += 65
}

socket.onerror = (error) => {
    console.error("WebSocket error:", error);
};

const DEFAULT_GRAY = `#f0f0f0`
const ACTIVE_GREEN = `#4CAF50`
const HIGHLIGHT_BLUE = 'lightblue'
var total_neurons = -1;
var paramsConfirmed = false;
let ROW = -1;
let COL = -1;
let GRID_SIZE = -1;
let LIFETIME = -1;
let INPUTS = -1;
let OUTPUTS = -1;
let TOTAL = -1;
let matrix = []
let cellMap = {}
let cellIsActive = {}
let CURRENT_TICK = 0
let lastCol = 0

const sleepNow = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

function get2dCoordinate(index, width) {
    return [index % width, Math.floor(index / width)]
}

function highlightCol(neurons, col) {
    for (let neuron = 0; neuron < neurons; neuron++) {
        cellMap[`${neuron}${col}`].style.backgroundColor = HIGHLIGHT_BLUE
    }
}

function dehighlightCol(neurons, col) {
    for (let neuron = 0; neuron < neurons; neuron++) {
        if (cellIsActive[`${neuron}${col}`]) {
            cellMap[`${neuron}${col}`].style.backgroundColor = ACTIVE_GREEN
        } else {
            cellMap[`${neuron}${col}`].style.backgroundColor = DEFAULT_GRAY
        }
    }
}

function create2dArray(rows, windowWidth) {
    var arr = []

    for (let i = 0; i < rows; i++) {
        let newArr = []
        for (let j = 0; j < windowWidth; j++) {
            newArr.push(0)
        }
        arr.push(newArr)
    }

    return arr;
}

function startNetworkSimulation() {
    GRID_SIZE = document.getElementById('grid_size').value;
    INPUTS = document.getElementById('inputs').value;
    OUTPUTS = document.getElementById('outputs').value;
    WW = document.getElementById('window_width').value;
    TOTAL = GRID_SIZE * GRID_SIZE
    if (GRID_SIZE == -1 || INPUTS == -1 || OUTPUTS == -1 || TOTAL == -1) {
        return
    }

    let payload = {
        'play' : true,
        'grid-size' : GRID_SIZE,
        'lifetime' : LIFETIME,
        'neuron-total' : TOTAL,
        'inputs' : INPUTS,
        'outputs' : OUTPUTS,
        'network' : matrix,
        'window_width' : WW,
    }

    socket.send(JSON.stringify(payload))
}

function confirmNetworkParams() {
    const gridContainer = document.getElementById('grid-container');

    if (paramsConfirmed) {
        paramsConfirmed = false
        gridContainer.replaceChildren()
    }

    const gridSize = Number(document.getElementById('grid_size').value);
    let inputAmt = Number(document.getElementById('inputs').value);
    const outputAmt = Number(document.getElementById('outputs').value);
    inputAmt += outputAmt
    const windowWidth = Number(document.getElementById('window_width').value);

    if (gridSize == "" || inputAmt == "") {
        return;
    }

    total_neurons = gridSize * gridSize;

    // Set the grid-template-rows and grid-template-columns CSS properties
    gridContainer.style.gridTemplateRows = `repeat(${inputAmt}, 1fr)`;

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
            cellMap[cell.dataset.id] = cell
            cellIsActive[cell.dataset.id] = false

            cell.addEventListener('click', () => {
                cellIsActive[cell.dataset.id] = !cellIsActive[cell.dataset.id]

                if (cellIsActive[cell.dataset.id]) {
                    cell.style.backgroundColor = ACTIVE_GREEN
                    matrix.push(coord)
                } else {
                    cell.style.backgroundColor = DEFAULT_GRAY
                    let i = matrix.indexOf(coord)
                    matrix.splice(i, 1)
                }

            });

            gridContainer.appendChild(cell);
            index++;
        }
    }
    paramsConfirmed = true
}

function stopSimulation() {
    console.log("stopping")
    socket.send(JSON.stringify({'play' : false}))
}

document.addEventListener('DOMContentLoaded', () => {
    var confirmParamsButton = document.getElementById("confirm")
    var playSimButton = document.getElementById('play-sim')
    var stopSimButton = document.getElementById('stop-sim')

    const windowWidth = Number(document.getElementById('window_width').value);
    let inputamt = Number(document.getElementById('inputs').value);
    inputamt += Number(document.getElementById('outputs').value);

    // MARK: BUTTON CONNECTIONS
    confirmParamsButton.addEventListener("click", confirmNetworkParams)
    playSimButton.addEventListener("click", startNetworkSimulation)
    stopSimButton.addEventListener("click", stopSimulation)
});

//socket.addEventListener("message", ({ data }) => {
//    console.log("receiving message: " + data)
//    // const event = JSON.parse(data);
//    // CURRENT_TICK = Number(event) % windowWidth
//    // if (CURRENT_TICK == 0) {
//    //     gridContainer.scrollLeft = 0
//    // }
//
//    // dehighlightCol(inputamt, lastCol)
//    // highlightCol(inputamt, CURRENT_TICK)
//
//    // lastCol = CURRENT_TICK
//    // gridContainer.scrollLeft += 65
//});