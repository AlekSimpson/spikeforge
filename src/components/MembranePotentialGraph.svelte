<!--
  MembranePotentialGraph Component (View)
  Displays a grid of N membrane potential graphs using Plotly
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { 
		membranePotentialUIStore,
		selectedNeurons,
		pinnedNeurons,
		isPinned,
		hasSelectedNeurons,
		selectedCount,
		pinnedCount
	} from '../stores/membranePotentialStore';
	
	type Props = {
		membranePotentials: number[][]; // 2D array: [neuronIndex][timeStep] = potential
		neuronCount: number;
	};
	
	let { membranePotentials, neuronCount }: Props = $props();
	
	// Subscribe to ViewModel state
	const selections = $derived($selectedNeurons);
	const pinned = $derived($pinnedNeurons);
	const isPinnedMode = $derived($isPinned);
	const hasSelections = $derived($hasSelectedNeurons);
	const selCount = $derived($selectedCount);
	const pinCount = $derived($pinnedCount);
	
	let plotDiv: HTMLDivElement | undefined = $state();
	let Plotly: any = null;
	let isInitialized = false;
	let windowWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1200);
	let windowHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 800);
	
	// Calculate which neurons to display
	const displayedNeurons = $derived(isPinnedMode ? pinned : Array.from({ length: neuronCount }, (_, i) => i));
	const displayedCount = $derived(displayedNeurons.length);
	
	// Update window dimensions on resize
	$effect(() => {
		if (typeof window === 'undefined') return;
		
		function handleResize() {
			windowWidth = window.innerWidth;
			windowHeight = window.innerHeight;
			if (Plotly && plotDiv && isInitialized) {
				Plotly.Plots.resize(plotDiv);
			}
		}
		
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});
	
	onMount(async () => {
		// Dynamically import Plotly only in browser
		if (browser) {
			Plotly = await import('plotly.js-dist-min');
			createGraphs();
			isInitialized = true;
		}
		
		return () => {
			// Cleanup on unmount
			if (Plotly && plotDiv) {
				Plotly.purge(plotDiv);
			}
		};
	});
	
	// Update graphs when data, window size, or pinned state changes
	$effect(() => {
		const data = membranePotentials;
		const neurons = displayedNeurons;
		const count = displayedCount;
		const width = windowWidth; // Track width changes
		if (Plotly && plotDiv && isInitialized && data && count > 0) {
			updateGraphs(data, neurons);
		}
	});
	
	function calculateGridLayout(count: number): { rows: number; cols: number } {
		// Calculate grid layout for multiple graphs per row
		// Aim for 2-3 graphs per row depending on screen size
		let cols = 2;
		if (windowWidth >= 1600) {
			cols = 3;
		} else if (windowWidth < 900) {
			cols = 1;
		}
		
		const rows = Math.ceil(count / cols);
		return { rows, cols };
	}
	
	function getPlotData(data: number[][], neurons: number[]) {
		const traces = [];
		const timeSteps = data[0]?.length || 0;
		const xValues = Array.from({ length: timeSteps }, (_, i) => i);
		
		for (const neuronId of neurons) {
			traces.push({
				x: xValues,
				y: data[neuronId] || [],
				type: 'scatter',
				mode: 'lines',
				name: `Neuron ${neuronId}`,
				line: {
					color: '#3498db',
					width: 1.5
				},
				hovertemplate: 'Time: %{x}<br>Potential: %{y:.1f} mV<extra></extra>'
			});
		}
		
		return traces;
	}
	
	function getLayout(neurons: number[]) {
		const count = neurons.length;
		const { rows, cols } = calculateGridLayout(count);
		
		// Set minimum size per graph to keep them roughly square and readable
		const MIN_GRAPH_SIZE = 250; // pixels per graph (both width and height)
		const plotHeight = rows * MIN_GRAPH_SIZE + 100; // Total height based on rows
		
		const layout: any = {
			title: {
				text: `Membrane Potential Over Time (${count} Neurons)`,
				font: {
					color: '#ecf0f1',
					size: 16
				}
			},
			showlegend: false,
			paper_bgcolor: 'rgba(0,0,0,0)',
			plot_bgcolor: '#2c3e50',
			grid: {
				rows: rows,
				columns: cols,
				pattern: 'independent',
				roworder: 'top to bottom'
			},
			height: plotHeight,
			margin: {
				l: 50,
				r: 30,
				t: 50,
				b: 40
			},
			annotations: []
		};
		
		// Configure each subplot
		for (let i = 0; i < count; i++) {
			const neuronId = neurons[i];
			const axisNum = i === 0 ? '' : (i + 1).toString();
			const yRef = i === 0 ? 'y' : `y${i + 1}`;
			const xRef = i === 0 ? 'x' : `x${i + 1}`;
			
			// X-axis config
			layout[`xaxis${axisNum}`] = {
				title: {
					text: 'Ticks',
					font: { color: '#95a5a6', size: 11 }
				},
				color: '#95a5a6',
				gridcolor: '#34495e',
				showgrid: true,
				zeroline: false,
				tickfont: { size: 9 }
			};
			
			// Y-axis config - no title, just show the scale
			layout[`yaxis${axisNum}`] = {
				title: {
					text: '',
					font: { color: '#95a5a6', size: 10 }
				},
				color: '#95a5a6',
				gridcolor: '#34495e',
				showgrid: true,
				zeroline: true,
				zerolinecolor: '#e74c3c',
				zerolinewidth: 1,
				range: [-80, 40],
				tickfont: { size: 9 },
				ticksuffix: ' mV'
			};
			
			// Add neuron label annotation - positioned in data coordinates
			layout.annotations.push({
				text: `Neuron ${neuronId}`,
				font: {
					size: 12,
					color: '#3498db',
					family: 'monospace',
					weight: 'bold'
				},
				showarrow: false,
				xref: xRef,
				yref: yRef,
				x: 1,
				y: 30,
				xanchor: 'left',
				yanchor: 'top',
				bgcolor: 'rgba(30, 42, 53, 0.9)',
				borderpad: 4,
				bordercolor: '#3498db',
				borderwidth: 1
			});
		}
		
		return layout;
	}
	
	function createGraphs() {
		if (!Plotly || !plotDiv || !membranePotentials || displayedCount === 0) return;
		
		const config = {
			responsive: true,
			displayModeBar: false,
			displaylogo: false
		};
		
		const data = getPlotData(membranePotentials, displayedNeurons);
		const layout = getLayout(displayedNeurons);
		
		// Assign each trace to its subplot
		data.forEach((trace, i) => {
			const axisNum = i === 0 ? '' : (i + 1).toString();
			trace.xaxis = `x${axisNum}`;
			trace.yaxis = `y${axisNum}`;
		});
		
		Plotly.newPlot(plotDiv, data, layout, config);
	}
	
	function updateGraphs(data: number[][], neurons: number[]) {
		if (!Plotly || !plotDiv) return;
		
		const plotData = getPlotData(data, neurons);
		const layout = getLayout(neurons);
		
		// Assign each trace to its subplot
		plotData.forEach((trace, i) => {
			const axisNum = i === 0 ? '' : (i + 1).toString();
			trace.xaxis = `x${axisNum}`;
			trace.yaxis = `y${axisNum}`;
		});
		
		Plotly.react(plotDiv, plotData, layout);
	}
	
	// Delegate to ViewModel
	function handleToggleNeuronSelection(neuronId: number) {
		membranePotentialUIStore.toggleNeuronSelection(neuronId);
	}
	
	function handleSelectAll() {
		membranePotentialUIStore.selectAllNeurons(neuronCount);
	}
	
	function handleClearSelection() {
		membranePotentialUIStore.clearSelection();
	}
	
	function handlePinSelected() {
		membranePotentialUIStore.pinSelectedNeurons();
	}
	
	function handleUnpin() {
		membranePotentialUIStore.unpinNeurons();
	}
</script>

<div class="membrane-graph-container">
	{#if neuronCount > 0}
		<!-- Control Bar -->
		<div class="control-bar">
			<div class="left-controls">
				{#if isPinnedMode}
					<div class="pin-indicator">
						📌 {pinCount} neurons pinned
					</div>
				{:else if hasSelections}
					<div class="selection-info">
						{selCount} neuron{selCount === 1 ? '' : 's'} selected
					</div>
				{/if}
			</div>
			
			<div class="right-controls">
				{#if isPinnedMode}
					<button class="unpin-btn" onclick={handleUnpin} aria-label="Unpin all neurons">
						Unpin All
					</button>
				{:else}
					<button 
						class="select-all-btn" 
						onclick={handleSelectAll} 
						aria-label="Select all neurons"
					>
						Select All
					</button>
					<button 
						class="clear-btn" 
						onclick={handleClearSelection}
						disabled={!hasSelections}
						aria-label="Clear selection"
					>
						Clear
					</button>
					<button 
						class="pin-btn" 
						onclick={handlePinSelected}
						disabled={!hasSelections}
						aria-label="Pin selected neurons"
					>
						Pin Selected
					</button>
				{/if}
			</div>
		</div>
		
		<!-- Neuron Checkboxes (only when not pinned) -->
		{#if !isPinnedMode && neuronCount > 0}
			<div class="neuron-selection-grid">
				{#each Array.from({ length: neuronCount }, (_, i) => i) as neuronId}
					<label class="neuron-checkbox-label">
						<input 
							type="checkbox" 
							checked={selections.has(neuronId)}
							onchange={() => handleToggleNeuronSelection(neuronId)}
							aria-label="Select neuron {neuronId}"
						/>
						<span>N{neuronId}</span>
					</label>
				{/each}
			</div>
		{/if}
		
		<!-- Plotly Graph -->
		<div bind:this={plotDiv} class="membrane-plot"></div>
	{:else}
		<div class="no-data">
			<p>No neurons to display. Please set a neuron count greater than 0.</p>
		</div>
	{/if}
</div>

<style>
	.membrane-graph-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		padding: 1rem;
		width: 100%;
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		gap: 1rem;
	}
	
	.control-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		max-width: 1600px;
		padding: 0.75rem 1rem;
		background-color: rgba(30, 42, 53, 0.6);
		border-radius: 6px;
		border: 1px solid #34495e;
	}
	
	.left-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
	}
	
	.right-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		justify-content: flex-end;
	}
	
	.pin-indicator,
	.selection-info {
		color: #f39c12;
		font-size: 0.9rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	
	.selection-info {
		color: #3498db;
	}
	
	.select-all-btn,
	.clear-btn,
	.pin-btn,
	.unpin-btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		color: white;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}
	
	.select-all-btn {
		background-color: #3498db;
	}
	
	.select-all-btn:hover {
		background-color: #2980b9;
	}
	
	.clear-btn {
		background-color: #95a5a6;
	}
	
	.clear-btn:hover:not(:disabled) {
		background-color: #7f8c8d;
	}
	
	.clear-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	
	.pin-btn {
		background-color: #f39c12;
	}
	
	.pin-btn:hover:not(:disabled) {
		background-color: #e67e22;
	}
	
	.pin-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	
	.unpin-btn {
		background-color: #e74c3c;
	}
	
	.unpin-btn:hover {
		background-color: #c0392b;
	}
	
	.neuron-selection-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding: 1rem;
		background-color: rgba(30, 42, 53, 0.4);
		border-radius: 6px;
		border: 1px solid #34495e;
		width: 100%;
		max-width: 1600px;
		max-height: 150px;
		overflow-y: auto;
	}
	
	.neuron-checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.6rem;
		background-color: #2c3e50;
		border: 1px solid #34495e;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.85rem;
		color: #ecf0f1;
		font-family: monospace;
		user-select: none;
	}
	
	.neuron-checkbox-label:hover {
		background-color: #34495e;
		border-color: #3498db;
	}
	
	.neuron-checkbox-label input[type="checkbox"] {
		width: 16px;
		height: 16px;
		cursor: pointer;
		accent-color: #3498db;
	}
	
	.membrane-plot {
		width: 100%;
		max-width: 1600px;
	}
	
	@media (max-width: 1600px) {
		.membrane-plot {
			max-width: 1200px;
		}
		.control-bar,
		.neuron-selection-grid {
			max-width: 1200px;
		}
	}
	
	@media (max-width: 900px) {
		.membrane-plot {
			max-width: 600px;
		}
		.control-bar,
		.neuron-selection-grid {
			max-width: 600px;
			flex-direction: column;
		}
		.right-controls {
			justify-content: flex-start;
		}
	}
	
	.no-data {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		color: #95a5a6;
	}
	
	.no-data p {
		font-size: 1.1rem;
		font-style: italic;
	}
	
	/* Custom scrollbar styling */
	.membrane-graph-container::-webkit-scrollbar,
	.neuron-selection-grid::-webkit-scrollbar {
		width: 12px;
		height: 12px;
	}
	
	.membrane-graph-container::-webkit-scrollbar-track,
	.neuron-selection-grid::-webkit-scrollbar-track {
		background-color: #1e2a35;
		border-radius: 6px;
	}
	
	.membrane-graph-container::-webkit-scrollbar-thumb,
	.neuron-selection-grid::-webkit-scrollbar-thumb {
		background-color: #34495e;
		border-radius: 6px;
		border: 2px solid #1e2a35;
	}
	
	.membrane-graph-container::-webkit-scrollbar-thumb:hover,
	.neuron-selection-grid::-webkit-scrollbar-thumb:hover {
		background-color: #3498db;
	}
</style>

