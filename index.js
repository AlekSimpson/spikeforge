const socket = new WebSocket('ws://localhost:8080');
var total_neurons = -1;
var paramsConfirmed = false;
let ROW = -1;
let COL = -1;

// socket.onmessage = ({ data }) => {
//     console.log('message from server ', data)
// };

//document.querySelector('play-button').onclick = () => {
//    // socket.send('hello from client')
//}
//

function confirmNetworkParams() {
    const gridContainer = document.getElementById('grid-container');

    if (paramsConfirmed) {
        paramsConfirmed = false
        gridContainer.replaceChildren()
    }

    const gridSize = document.getElementById('grid_size').value;
    const lifetime = document.getElementById('lifetime').value;
    const inputAmt = document.getElementById('inputs').value;

    if (gridSize == "" || lifetime == "" || inputAmt == "") {
        return;
    }

    total_neurons = gridSize * gridSize;

    // Set the grid-template-rows and grid-template-columns CSS properties
    gridContainer.style.gridTemplateRows = `repeat(${lifetime}, 1fr)`;
    gridContainer.style.gridTemplateColumns = `repeat(${inputAmt}, 1fr)`;

    for (let row = 0; row < lifetime; row++) {
        for (let col = 0; col < inputAmt; col++) {
            console.log(col)
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.dataset.id = `${row}${col}`

            // Display the cell coordinates
            cell.textContent = `${row},${col}`;

            cell.addEventListener('click', () => {
                cell.classList.toggle('active');
            });

            gridContainer.appendChild(cell);
        }
    }
    paramsConfirmed = true
}


document.addEventListener('DOMContentLoaded', () => {
    var confirmParamsButton = document.getElementById("confirm")
    var playSimBuntton = document.getElementById('play-sim')

    confirmParamsButton.addEventListener("click", confirmNetworkParams)
});




