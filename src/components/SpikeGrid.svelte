<!--
  SpikeGrid Component (View)
  Scrollable horizontal grid with toggleable cells
-->
<script lang="ts">
	import { uiStore, isSimulationPlaying, currentAnimationColumn, toggledCells } from '../stores/uiStore';
	
	interface Props {
		rows?: number;
		columns?: number;
		onCellToggle?: (row: number, col: number) => void;
		cellStates?: boolean[][];
	}
	
	let { 
		rows = 10, 
		columns = 50,
		onCellToggle,
		cellStates = []
	}: Props = $props();
	
	// Subscribe to ViewModel state
	const isPlaying = $derived($isSimulationPlaying);
	const animationColumn = $derived($currentAnimationColumn);
	const cellToggles = $derived($toggledCells);
	
	// Reference to the scrollable container
	let gridContainer: HTMLElement | null = null;
	
	// Constants for cell dimensions
	const CELL_WIDTH = 32;
	const CELL_HEIGHT = 32;
	
	// Track container dimensions for visible range calculation
	let containerWidth = $state(1000); // Default estimate
	
	// Update container width when it changes
	$effect(() => {
		if (gridContainer) {
			containerWidth = gridContainer.clientWidth;
		}
	});
	
	// Auto-scroll to follow the animation
	$effect(() => {
		if (isPlaying && animationColumn >= 0 && gridContainer) {
			const scrollPosition = animationColumn * CELL_WIDTH;
			const containerWidth = gridContainer.clientWidth;
			const rowLabelsWidth = 50; // Width of row labels
			
			// Scroll to keep the animated column visible, accounting for row labels
			const targetScroll = scrollPosition - (containerWidth / 2) + (CELL_WIDTH / 2) + rowLabelsWidth;
			gridContainer.scrollLeft = Math.max(0, targetScroll);
		}
	});
	
	let currentPage = $state(0);
	let hoveredCell = $state<{ row: number; col: number } | null>(null);
	let selectedRows = $state<Set<number>>(new Set());
	let pinnedRows = $state<number[]>([]);
	
	// Dynamic calculation of rows per page based on window height
	let windowHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 800);
	
	// Update window height on resize
	$effect(() => {
		if (typeof window === 'undefined') return;
		
		function handleResize() {
			windowHeight = window.innerHeight;
		}
		
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});
	
	// Calculate max rows that can fit in the available space
	// Account for:
	// - Menu bar (~60px)
	// - Bottom panel header (~40px)  
	// - Resize handle (~8px)
	// - Top controls in SpikeGrid (~80px)
	// - Column labels (~30px)
	// - SimControls (~60px)
	// - Padding and margins (~40px)
	const FIXED_HEIGHT_OVERHEAD = 318;
	const ROWS_PER_PAGE = $derived(
		Math.max(5, Math.min(100, Math.floor((windowHeight - FIXED_HEIGHT_OVERHEAD) / CELL_HEIGHT)))
	);
	
	// Calculate pagination and display
	const isPinned = $derived(pinnedRows.length > 0);
	const effectiveRows = $derived(isPinned ? pinnedRows.length : rows);
	const totalPages = $derived(Math.ceil(effectiveRows / ROWS_PER_PAGE));
	const isPaginated = $derived(effectiveRows > ROWS_PER_PAGE);
	const startRow = $derived(currentPage * ROWS_PER_PAGE);
	const endRow = $derived(Math.min(startRow + ROWS_PER_PAGE, effectiveRows));
	const displayRows = $derived(endRow - startRow);
	const hasSelectedRows = $derived(selectedRows.size > 0);
	const selectedRowCount = $derived(selectedRows.size);

	// Calculate visible range for performance optimization
	const visibleColumnsCount = $derived(Math.ceil(containerWidth / CELL_WIDTH) + 10);
	const visibleRowsCount = $derived(Math.min(displayRows, 50));
	
	// Reset to page 0 when rows change
	$effect(() => {
		if (rows) {
			currentPage = 0;
		}
	});
	
	function handleCellClick(displayRow: number, col: number) {
		const actualRow = getActualRow(displayRow);
		
		// Delegate to ViewModel
		uiStore.toggleCell(actualRow, col);
		
		// Call optional callback
		if (onCellToggle) {
			onCellToggle(actualRow, col);
		}
	}
	
	function handleCellHover(displayRow: number, col: number) {
		const actualRow = getActualRow(displayRow);
		hoveredCell = { row: actualRow, col };
	}
	
	function handleCellLeave() {
		hoveredCell = null;
	}
	
	function isCellActive(displayRow: number, col: number): boolean {
		const actualRow = getActualRow(displayRow);
		const key = `${actualRow},${col}`;
		
		// Check ViewModel state first, then fall back to prop
		if (cellToggles.has(key)) {
			return cellToggles.get(key) ?? false;
		}
		
		return cellStates[actualRow]?.[col] ?? false;
	}
	
	function isCellHighlighted(displayRow: number, col: number): boolean {
		if (!hoveredCell) return false;
		const actualRow = getActualRow(displayRow);
		
		// Performance optimization: only highlight cells within visible range
		// Highlight cells in the same row BEFORE the hovered cell (limited to visible range)
		const isRowHighlight = actualRow === hoveredCell.row && 
			col <= hoveredCell.col && 
			col >= Math.max(0, hoveredCell.col - visibleColumnsCount);
		
		// Highlight cells in the same column AFTER the hovered cell (limited to visible range)
		const isColHighlight = col === hoveredCell.col && 
			actualRow >= hoveredCell.row && 
			actualRow <= hoveredCell.row + visibleRowsCount;
		
		return isRowHighlight || isColHighlight;
	}
	
	function isColumnAnimated(col: number): boolean {
		// Show the red line whenever we have an animation position (playing or paused)
		return col === animationColumn && animationColumn >= 0;
	}
	
	function goToPreviousPage() {
		if (currentPage > 0) {
			currentPage--;
		}
	}
	
	function goToNextPage() {
		if (currentPage < totalPages - 1) {
			currentPage++;
		}
	}
	
	function clearAllToggles() {
		// Delegate to ViewModel
		uiStore.clearAllToggledCells();
	}
	
	function resetSimulation() {
		// Delegate to ViewModel
		uiStore.resetSimulation();
	}
	
	function getActualRow(displayIndex: number): number {
		if (isPinned) {
			return pinnedRows[startRow + displayIndex];
		}
		return startRow + displayIndex;
	}
	
	function toggleRowSelection(row: number) {
		// Create new Set to trigger reactivity
		const newSelection = new Set(selectedRows);
		if (newSelection.has(row)) {
			newSelection.delete(row);
		} else {
			newSelection.add(row);
		}
		selectedRows = newSelection;
	}
	
	function pinSelectedRows() {
		if (selectedRows.size === 0) return;
		pinnedRows = Array.from(selectedRows).sort((a, b) => a - b);
		selectedRows = new Set(); // Create new empty Set
		currentPage = 0;
	}
	
	function unpinRows() {
		pinnedRows = [];
		currentPage = 0;
	}
	
	function togglePlayPause() {
		if (isPlaying) {
			uiStore.pauseSimulation();
		} else {
			uiStore.playSimulation(columns);
		}
	}
</script>

<div class="spike-grid-container">
	<div class="top-controls">
		<div class="left-controls">
			{#if isPaginated}
				<div class="pagination-controls">
					<button 
						class="page-btn" 
						onclick={goToPreviousPage}
						disabled={currentPage === 0}
						aria-label="Previous page"
					>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>
					<span class="page-info">
						Rows {startRow}-{endRow - 1} of {effectiveRows}
					</span>
					<button 
						class="page-btn" 
						onclick={goToNextPage}
						disabled={currentPage === totalPages - 1}
						aria-label="Next page"
					>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>
				</div>
			{/if}
			
			{#if isPinned}
				<div class="pin-indicator">
					📌 {pinnedRows.length} rows pinned
				</div>
			{/if}
		</div>
		
		<div class="center-controls">
			<button class="play-pause-btn" onclick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
				{#if isPlaying}
					<svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
						<rect x="4" y="3" width="3" height="10" fill="currentColor" rx="0.5"/>
						<rect x="9" y="3" width="3" height="10" fill="currentColor" rx="0.5"/>
					</svg>
				{:else}
					<svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M5 3L12 8L5 13V3Z" fill="currentColor"/>
					</svg>
				{/if}
			</button>
		</div>
		
		<div class="right-controls">
			{#if isPinned}
				<button class="unpin-btn" onclick={unpinRows} aria-label="Unpin all rows">
					Unpin All
				</button>
			{:else}
				<button 
					class="pin-btn" 
					onclick={pinSelectedRows} 
					disabled={!hasSelectedRows}
					aria-label="Pin selected rows"
				>
					Pin {selectedRowCount > 0 ? selectedRowCount : ''} Row{selectedRowCount === 1 ? '' : 's'}
				</button>
			{/if}
			
			<button class="reset-btn" onclick={resetSimulation} aria-label="Reset simulation">
				Reset
			</button>
			
			<button class="clear-btn" onclick={clearAllToggles} aria-label="Clear all toggled cells">
				Clear All
			</button>
		</div>
	</div>
	
	<div class="grid-with-labels" bind:this={gridContainer}>
		<!-- Top row with N label -->
		<div class="top-row">
			<div class="corner-spacer">
				<div class="meta-label-n">N</div>
			</div>
		</div>
		
		<!-- Main grid area with row labels -->
		<div class="grid-row">
			<div class="row-labels">
				{#each Array(displayRows) as _, rowIndex}
					{@const actualRow = getActualRow(rowIndex)}
					<div class="row-label-container">
						{#if !isPinned}
							<input 
								type="checkbox" 
								class="row-checkbox"
								checked={selectedRows.has(actualRow)}
								onchange={() => toggleRowSelection(actualRow)}
								aria-label="Select row {actualRow}"
							/>
						{/if}
						<div class="row-label">{actualRow}</div>
					</div>
				{/each}
			</div>
			<div class="spike-grid" style="--rows: {displayRows}; --columns: {columns};">
				{#each Array(displayRows) as _, rowIndex}
					{#each Array(columns) as _, colIndex}
						<button 
							class="grid-cell"
							class:active={isCellActive(rowIndex, colIndex)}
							class:highlighted={isCellHighlighted(rowIndex, colIndex)}
							class:animated={isColumnAnimated(colIndex)}
							onclick={() => handleCellClick(rowIndex, colIndex)}
							onmouseenter={() => handleCellHover(rowIndex, colIndex)}
							onmouseleave={handleCellLeave}
							aria-label="Cell {getActualRow(rowIndex)},{colIndex}"
						/>
					{/each}
				{/each}
			</div>
		</div>
		
		<!-- Bottom row with LT and column numbers -->
		<div class="bottom-row">
			<div class="corner-spacer">
				<div class="meta-label-lt">LT</div>
			</div>
			<div class="column-labels" style="--columns: {columns};">
				{#each Array(columns) as _, colIndex}
					<div class="column-label">{colIndex}</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.spike-grid-container {
		width: 100%;
		height: auto;
		overflow: visible;
		background-color: #1e2a35;
		padding: 2rem 1rem 1rem 1rem;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		gap: 1rem;
	}
	
	
	.grid-with-labels {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		overflow-x: auto;
		overflow-y: visible;
		max-width: 100%;
	}
	
	.top-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		align-self: flex-start;
		width: 100%;
		padding: 0 1rem;
		gap: 1rem;
	}
	
	.left-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
	}
	
	.center-controls {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.right-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		justify-content: flex-end;
	}
	
	.pagination-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.reset-btn {
		padding: 0.4rem 1rem;
		background-color: #e67e22;
		border: none;
		border-radius: 4px;
		color: white;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	
	.reset-btn:hover {
		background-color: #d35400;
	}
	
	.clear-btn {
		padding: 0.4rem 1rem;
		background-color: #e74c3c;
		border: none;
		border-radius: 4px;
		color: white;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	
	.clear-btn:hover {
		background-color: #c0392b;
	}
	
	.pin-btn {
		padding: 0.4rem 1rem;
		background-color: #f39c12;
		border: none;
		border-radius: 4px;
		color: white;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	
	.pin-btn:hover:not(:disabled) {
		background-color: #e67e22;
	}
	
	.pin-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.unpin-btn {
		padding: 0.4rem 1rem;
		background-color: #95a5a6;
		border: none;
		border-radius: 4px;
		color: white;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	
	.unpin-btn:hover {
		background-color: #7f8c8d;
	}
	
	.pin-indicator {
		color: #f39c12;
		font-size: 0.85rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	
	.row-label-container {
		width: 50px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding-right: 0.5rem;
		gap: 0.25rem;
	}
	
	.row-checkbox {
		width: 14px;
		height: 14px;
		cursor: pointer;
		accent-color: #f39c12;
	}
	
	.play-pause-btn {
		width: 42px;
		height: 42px;
		background-color: #27ae60;
		border: none;
		border-radius: 50%;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		box-shadow: 0 2px 6px rgba(39, 174, 96, 0.3);
	}
	
	.play-pause-btn:hover {
		background-color: #229954;
		transform: scale(1.05);
		box-shadow: 0 3px 10px rgba(39, 174, 96, 0.4);
	}
	
	.play-pause-btn:active {
		transform: scale(0.95);
	}
	
	.page-btn {
		width: 32px;
		height: 32px;
		background-color: #2c3e50;
		border: 1px solid #3498db;
		color: #3498db;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: background-color 0.2s;
		padding: 0;
	}
	
	.page-btn:hover:not(:disabled) {
		background-color: #34495e;
	}
	
	.page-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
		border-color: #34495e;
		color: #7f8c8d;
	}
	
	.page-info {
		color: #ecf0f1;
		font-size: 0.85rem;
		font-weight: 500;
		min-width: 120px;
		text-align: center;
	}
	
	.grid-with-labels {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.top-row {
		display: flex;
		gap: 0.5rem;
	}
	
	.bottom-row {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
	}
	
	.corner-spacer {
		min-width: 50px;
		width: 50px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding-right: 0.5rem;
		position: sticky;
		left: 0;
		background-color: #1e2a35;
		z-index: 10;
		box-sizing: border-box;
	}
	
	.meta-label-n,
	.meta-label-lt {
		color: #3498db;
		font-size: 0.8rem;
		font-weight: 600;
		font-family: monospace;
	}
	
	.column-labels {
		display: grid;
		grid-template-columns: repeat(var(--columns), 32px);
		gap: 0;
	}
	
	.column-label {
		width: 32px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #95a5a6;
		font-size: 0.7rem;
		font-weight: 500;
		font-family: monospace;
	}
	
	.grid-row {
		display: flex;
		gap: 0.5rem;
		min-width: min-content;
		position: relative;
	}
	
	.row-labels {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		position: sticky;
		left: 0;
		background-color: #1e2a35;
		z-index: 10;
		min-width: 50px;
		width: 50px;
		flex-shrink: 0;
	}
	
	.row-label {
		color: #95a5a6;
		font-size: 0.75rem;
		font-weight: 500;
		font-family: monospace;
	}
	
	.spike-grid {
		display: grid;
		grid-template-rows: repeat(var(--rows), 32px);
		grid-template-columns: repeat(var(--columns), 32px);
		gap: 0px;
		min-width: min-content;
		line-height: 0;
	}
	
	.grid-cell {
		width: 32px;
		height: 32px;
		background-color: #34495e;
		border: 0.5px solid #2c3e50;
		cursor: pointer;
		transition: all 0.15s ease;
		padding: 0;
		margin: 0;
		border-radius: 0;
		box-sizing: border-box;
	}
	
	.grid-cell:hover {
		background-color: #4a6278;
		border-color: #3498db;
	}
	
	.grid-cell.highlighted {
		background-color: #3d5266;
		border-color: #4a6278;
	}
	
	.grid-cell.active {
		background-color: #3498db;
		border-color: #2980b9;
		box-shadow: 0 0 4px rgba(52, 152, 219, 0.5);
	}
	
	.grid-cell.active:hover {
		background-color: #5dade2;
	}
	
	.grid-cell.highlighted.active {
		background-color: #5dade2;
	}
	
	.grid-cell.animated {
		position: relative;
	}
	
	.grid-cell.animated::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(231, 76, 60, 0.4);
		border-left: 2px solid #e74c3c;
		border-right: 2px solid #e74c3c;
		pointer-events: none;
		z-index: 5;
	}
	
	/* Custom scrollbar styling */
	.grid-with-labels::-webkit-scrollbar {
		width: 12px;
		height: 12px;
	}
	
	.grid-with-labels::-webkit-scrollbar-track {
		background-color: #1e2a35;
		border-radius: 6px;
	}
	
	.grid-with-labels::-webkit-scrollbar-thumb {
		background-color: #34495e;
		border-radius: 6px;
		border: 2px solid #1e2a35;
	}
	
	.grid-with-labels::-webkit-scrollbar-thumb:hover {
		background-color: #3498db;
	}
</style>