const ACTIVE_GREEN = `#4CAF50`
const HIGHLIGHT_BLUE = 'lightblue'

var WS;
var paramsConfirmed = false;
var GRID_SIZE = -1;

let last_col = 0
let CURRENTLY_HIGHLIGHTED = 0
let ROW = -1;
let COL = -1;
let LIFETIME = -1;
let INPUTS = -1;
let OUTPUTS = -1;
let TOTAL = -1;
let WW = -1;
let STARTUP = -1
let ACTIVE_CELLS = []
let cellMap = {}
let cellIsActive = {}
let CELL_DEFAULT_COLOR = {}
let INPUT_AMOUNT = 0
let WATCHED_CELLS = {}
let total_neurons = 0

const colorStops = [
    { stop: 0.1, color: [0, 0, 4] },
    { stop: 0.2, color: [30, 15, 74] },
    { stop: 0.3, color: [78, 28, 111] },
    { stop: 0.4, color: [120, 28, 109] },
    { stop: 0.5, color: [160, 35, 109] },
    { stop: 0.6, color: [205, 59, 105] },
    { stop: 0.7, color: [241, 96, 93] },
    { stop: 0.8, color: [253, 154, 57] },
    { stop: 0.9, color: [254, 205, 42] },
    { stop: 1.0, color: [252, 246, 126] },
    { stop: 1.1, color: [252, 253, 191] },
];

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
            continue
        }

        var default_color = CELL_DEFAULT_COLOR[`${neuron}${col}`]
        cellMap[`${neuron}${col}`].style.backgroundColor = default_color
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

function connect() {
    var ws = new WebSocket('ws://localhost:8080');
    WS = ws
    
    ws.onopen = function() {
        console.log("connected!")
    };
    
    ws.onmessage = (event) => {
        let payload = JSON.parse(event.data)
        let input_amt = Number(document.getElementById('inputs').value);
        input_amt += Number(document.getElementById('outputs').value);
        const gridContainer = document.getElementById('grid-container');
        const windowWidth = Number(document.getElementById('window_width').value);
        let current_tick = Number(payload['tick']) % windowWidth
        CURRENTLY_HIGHLIGHTED = current_tick
        if (current_tick == 0) {
            gridContainer.scrollLeft = 0
        }
    
        dehighlightCol(input_amt, last_col)
        highlightCol(input_amt, current_tick)
    
        last_col = current_tick
        gridContainer.scrollLeft += 65
    
        // update watched neurons view
        let input_mps = payload['inputs']
        let output_mps = payload['outputs']
        let mps = input_mps.concat(output_mps)
    
        let id;
        let cell;
        for (let i = 0; i < mps.length; i++) {
            id = `0${i}`
            cell = WATCHED_CELLS[id]
            cell.style.backgroundColor = getColorFromValue(mps[i])
        }
    }
    
    ws.onclose = function(e) {
        console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
        setTimeout(function() {
            connect();
        }, 1000);
    };
    
    ws.onerror = function(err) {
        console.error('Socket encountered error: ', err.message, 'Closing socket');
        ws.close();
    };
}

function setParameterConstants() {
    GRID_SIZE = Number(document.getElementById('grid_size').value);
    INPUTS = Number(document.getElementById('inputs').value);
    OUTPUTS = Number(document.getElementById('outputs').value);
    WW = Number(document.getElementById('window_width').value);
    STARTUP = Number(document.getElementById('startup_time').value);
}

function startNetworkSimulation() {
    setParameterConstants()
    TOTAL = GRID_SIZE * GRID_SIZE
    if (GRID_SIZE == -1 || INPUTS == -1 || OUTPUTS == -1 || TOTAL == -1 || !paramsConfirmed) {
        return
    }

    let payload = {
        'play' : true,
        'grid-size' : GRID_SIZE,
        'lifetime' : LIFETIME,
        'neuron-total' : TOTAL,
        'inputs' : INPUTS,
        'outputs' : OUTPUTS,
        'network' : ACTIVE_CELLS,
        'window_width' : WW,
        'startup_time': STARTUP
    }

    WS.send(JSON.stringify(payload))
}

function confirmNetworkParams() {
    const gridContainer = document.getElementById('grid-container');
    const ioContainer = document.getElementById('io-neuron-display')

    if (paramsConfirmed) {
        paramsConfirmed = false
        gridContainer.replaceChildren()
        ioContainer.replaceChildren()
    }

    setParameterConstants()

    let gridElement = document.getElementById('grid_size')
    const gridSize = Number(gridElement.value);
    let inputAmt = Number(document.getElementById('inputs').value);
    const outputAmt = Number(document.getElementById('outputs').value);
    inputAmt += outputAmt
    const windowWidth = Number(document.getElementById('window_width').value);
    GRID_SIZE = gridElement.value;
    
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
            cell.textContent = `${coord[0]} | ${coord[1]}`;
            cellMap[cell.dataset.id] = cell
            // cellIsActive[cell.dataset.id] = false

            if (coord[0] % 2 == 0) {
                CELL_DEFAULT_COLOR[cell.dataset.id] = `#92A0AD`
            } else {
                CELL_DEFAULT_COLOR[cell.dataset.id] = `#708090`
            }
            cell.style.backgroundColor = CELL_DEFAULT_COLOR[cell.dataset.id]
            if (cellIsActive[cell.dataset.id]) {
                cell.style.backgroundColor = ACTIVE_GREEN
            }

            cell.addEventListener('click', () => {
                cellIsActive[cell.dataset.id] = !cellIsActive[cell.dataset.id]

                if (cellIsActive[cell.dataset.id]) {
                    cell.style.backgroundColor = ACTIVE_GREEN
                    ACTIVE_CELLS.push(coord)
                } else {
                    cell.style.backgroundColor = CELL_DEFAULT_COLOR[cell.dataset.id]
                    let i = ACTIVE_CELLS.indexOf(coord)
                    ACTIVE_CELLS.splice(i, 1)
                }
            });

            gridContainer.appendChild(cell);
            index++;
        }
    }

    for (let col = 0; col < inputAmt; col++) {
        const cell = document.createElement('div')
        cell.classList.add('grid-cell');
        cell.dataset.row = 0;
        cell.dataset.col = col
        cell.dataset.id = `0${col}`
        WATCHED_CELLS[cell.dataset.id] = cell
        ioContainer.appendChild(cell);
    }

    paramsConfirmed = true
    sessionStorage.setItem('grid_size', GRID_SIZE)
}

function stopSimulation() {
    WS.send(JSON.stringify({'play' : false}))

    dehighlightCol(INPUT_AMOUNT, CURRENTLY_HIGHLIGHTED)
}

function interpolateColor(color1, color2, factor) {
    if (factor === undefined) factor = 0.5;
    return [
        Math.round(color1[0] + factor * (color2[0] - color1[0])),
        Math.round(color1[1] + factor * (color2[1] - color1[1])),
        Math.round(color1[2] + factor * (color2[2] - color1[2]))
    ];
}

function getColorFromValue(value) {
    value = Math.max(0, Math.min(1, value));
    let lower = colorStops[0];
    let upper = colorStops[colorStops.length - 1];
    
    for (let i = 0; i < colorStops.length - 1; i++) {
        if (value >= colorStops[i].stop && value <= colorStops[i + 1].stop) {
            lower = colorStops[i];
            upper = colorStops[i + 1];
            break;
        }
    }

    const range = upper.stop - lower.stop;
    const factor = (value - lower.stop) / range;
    const color = interpolateColor(lower.color, upper.color, factor);
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function navToChooseIOPos() {
    savePageState()
    document.location = './io_chooser.html'
}

function savePageState() {
    console.log("saving values: ")
    console.log(GRID_SIZE)
    console.log(INPUTS)
    console.log(OUTPUTS)
    console.log(WW)
    console.log(STARTUP)
    let state = {
        "gridsize"     : GRID_SIZE,
        "inputs"       : INPUTS,
        "outputs"      : OUTPUTS,
        "window_width" : WW,
        "startup"      : STARTUP,
    }

    sessionStorage.setItem("savedState", state)

    console.log("saved page state")
}

function loadPageState() {
    var save = sessionStorage.getItem("savedState")

    GRID_SIZE = Number(save["gridsize"])
    INPUTS = Number(save["inputs"])
    OUTPUTS = Number(save["outputs"])
    WW = Number(save["window_width"])
    STARTUP = Number(save["startup"])

    document.getElementById('grid_size').value = GRID_SIZE
    document.getElementById('inputs').value = INPUTS
    document.getElementById('outputs').value = OUTPUTS
    document.getElementById('window_width').value = WW
    document.getElementById('startup_time').value = STARTUP

    confirmNetworkParams()
    console.log("loading page state")
}

function initializeApp() {
    connect()

    try {
        if (sessionStorage.getItem("savedState") != null) {
            loadPageState()
        }

        var confirmParamsButton = document.getElementById("confirm")
        var playSimButton = document.getElementById('play-sim')
        var stopSimButton = document.getElementById('stop-sim')
        var choose_io_pos_button = document.getElementById('io-pos-button')
        
        var inputamt = Number(document.getElementById('inputs').value);
        inputamt += Number(document.getElementById('outputs').value);
        INPUT_AMOUNT = inputamt

        // connect the buttons to the click event
        confirmParamsButton.addEventListener("click", confirmNetworkParams)
        playSimButton.addEventListener("click", startNetworkSimulation)
        stopSimButton.addEventListener("click", stopSimulation)
        choose_io_pos_button.addEventListener("click", navToChooseIOPos)
    } catch (error) {
        console.log("couldn't load index.js")
    }
}

export { get2dCoordinate };

document.addEventListener("DOMContentLoaded", (event) => {
    initializeApp();
});




