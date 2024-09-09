import { get2dCoordinate } from "./index.js"

const ACTIVE_GREEN = '#4CAF50'
const DEFAULT_GRAY = '#92A0AD' // #708090
var cellIsActive = {}
var selectedCells = []
var idToCoordMap = {}

function initializePage() {
    const GRID_SIZE = sessionStorage.getItem('grid_size')

    const position_picker = document.getElementById('position-picker');

    // Set the grid-template-rows and grid-template-columns CSS properties
    position_picker.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`;
    position_picker.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;

    let index = 0
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = document.createElement('div');
            let coord = get2dCoordinate(index, GRID_SIZE)
            cell.classList.add('grid-cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.dataset.id = `${coord[0]}${coord[1]}`
    
            // Display the cell coordinates
            
            cell.textContent = `${coord[0]} | ${coord[1]}`;
            cell.style.backgroundColor = DEFAULT_GRAY
            cellIsActive[cell.dataset.id] = false
    
            cell.addEventListener('click', () => {
                cellIsActive[cell.dataset.id] = !cellIsActive[cell.dataset.id]
    
                if (cellIsActive[cell.dataset.id]) {
                    cell.style.backgroundColor = ACTIVE_GREEN
                    selectedCells.push(cell.dataset.id)
                } else {
                    cell.style.backgroundColor = DEFAULT_GRAY
                    let i = selectedCells.indexOf(cell.dataset.id)
                    selectedCells.splice(i, 1) // remove element at index i
                }
            });
    
            position_picker.appendChild(cell);
            idToCoordMap[cell.dataset.id] = get2dCoordinate(index, GRID_SIZE)
            index++;
        }
    }
}

function exportPositions() {
    let converted = []
    for (let i = 0; i < selectedCells.length; i++) {
        converted[i] = idToCoordMap[selectedCells[i]]
    }

    sessionStorage.setItem('SELECTED_CELLS', converted)
    console.log(converted)
}

function navToMainPage() {
    document.location = './index.html'
}

document.addEventListener("DOMContentLoaded", (event) => {
    initializePage();

    let confirm = document.getElementById("confirm-selections")
    let backButton = document.getElementById("back")

    backButton.addEventListener("click", navToMainPage)
    confirm.addEventListener("click", exportPositions)
});



