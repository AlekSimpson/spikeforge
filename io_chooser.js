import GRID_SIZE from "./index.js"
import get2dCoordinate from "./index.js"

const position_picker = document.getElementById('position-picker');
if (GRID_SIZE > 0) {
    // Set the grid-template-rows and grid-template-columns CSS properties
    position_picker.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`;
    poition_picker.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    
    let index = 0
    for (let row = 0; row < inputAmt; row++) {
        for (let col = 0; col < windowWidth; col++) {
            const cell = document.createElement('div');
            let coord = get2dCoordinate(index, GRID_SIZE)
            cell.classList.add('grid-cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.dataset.id = `${coord[0]}${coord[1]}`
    
            // Display the cell coordinates
            cell.textContent = `${coord[0]} | ${coord[1]}`;
            cellMap[cell.dataset.id] = cell
    
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
}else {
    position_picker.textContent = "test"
}
