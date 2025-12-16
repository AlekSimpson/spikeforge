<!--
  SynapseGraph Component (View)
  Displays a grid of synapse weight graphs using Plotly (3 graphs per neuron)
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { NeuronSynapses } from '../stores/SpikeSim';
	import { 
		synapseGraphUIStore,
		selectedNeurons,
		pinnedNeurons,
		isPinned,
		hasSelectedNeurons,
		selectedCount,
		pinnedCount
	} from '../stores/synapseGraphStore';
	
	type Props = {
		neuronSynapses: NeuronSynapses[];
		neuronCount: number;
	};
	
	let { neuronSynapses, neuronCount }: Props = $props();
	
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
	const displayedSynapseData = $derived(neuronSynapses.filter(ns => displayedNeurons.includes(ns.neuronId)));
	const totalGraphCount = $derived(displayedSynapseData.length * 3); // 3 graphs per neuron
	
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
		const data = displayedSynapseData;
		const count = totalGraphCount;
		const width = windowWidth; // Track width changes
		if (Plotly && plotDiv && isInitialized && data.length > 0) {
			updateGraphs(data);
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
	
	function getPlotData(synapseData: NeuronSynapses[]) {
		const traces = [];
		
		for (const neuronData of synapseData) {
			const neuronId = neuronData.neuronId;
			const timeSteps = neuronData.synapses[0]?.length || 0;
			const xValues = Array.from({ length: timeSteps }, (_, i) => i);
			
			// Create 3 traces (one for each synapse connection)
			for (let connIdx = 0; connIdx < 3; connIdx++) {
				traces.push({
					x: xValues,
					y: neuronData.synapses[connIdx] || [],
					type: 'scatter',
					mode: 'lines',
					name: `Neuron ${neuronId} - Synapse ${connIdx + 1}`,
					line: {
						color: '#e67e22',
						width: 1.5
					},
					hovertemplate: 'Time: %{x}<br>Weight: %{y:.3f}<extra></extra>'
				});
			}
		}
		
		return traces;
	}
	
	function getLayout(synapseData: NeuronSynapses[]) {
		const graphCount = synapseData.length * 3;
		const { rows, cols } = calculateGridLayout(graphCount);
		
		// Set minimum size per graph to keep them roughly square and readable
		const MIN_GRAPH_SIZE = 250; // pixels per graph (both width and height)
		const plotHeight = rows * MIN_GRAPH_SIZE + 100; // Total height based on rows
		
		const layout: any = {
			title: {
				text: `Synapse Weights Over Time (${synapseData.length} Neurons, ${graphCount} Graphs)`,
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
		let graphIdx = 0;
		for (const neuronData of synapseData) {
			const neuronId = neuronData.neuronId;
			
			// Create 3 subplots for this neuron
			for (let connIdx = 0; connIdx < 3; connIdx++) {
				const axisNum = graphIdx === 0 ? '' : (graphIdx + 1).toString();
				const yRef = graphIdx === 0 ? 'y' : `y${graphIdx + 1}`;
				const xRef = graphIdx === 0 ? 'x' : `x${graphIdx + 1}`;
				
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
					zerolinecolor: '#ecf0f1',
					zerolinewidth: 1,
					range: [-1, 1],
					tickfont: { size: 9 }
				};
				
				// Add label annotation
				layout.annotations.push({
					text: `N${neuronId} S${connIdx + 1}`,
					font: {
						size: 12,
						color: '#e67e22',
						family: 'monospace',
						weight: 'bold'
					},
					showarrow: false,
					xref: xRef,
					yref: yRef,
					x: 1,
					y: 0.9,
					xanchor: 'left',
					yanchor: 'top',
					bgcolor: 'rgba(30, 42, 53, 0.9)',
					borderpad: 4,
					bordercolor: '#e67e22',
					borderwidth: 1
				});
				
				graphIdx++;
			}
		}
		
		return layout;
	}
	
	function createGraphs() {
		if (!Plotly || !plotDiv || displayedSynapseData.length === 0) return;
		
		const config = {
			responsive: true,
			displayModeBar: false,
			displaylogo: false
		};
		
		const data = getPlotData(displayedSynapseData);
		const layout = getLayout(displayedSynapseData);
		
		// Assign each trace to its subplot
		data.forEach((trace, i) => {
			const axisNum = i === 0 ? '' : (i + 1).toString();
			trace.xaxis = `x${axisNum}`;
			trace.yaxis = `y${axisNum}`;
		});
		
		Plotly.newPlot(plotDiv, data, layout, config);
	}
	
	function updateGraphs(synapseData: NeuronSynapses[]) {
		if (!Plotly || !plotDiv) return;
		
		const plotData = getPlotData(synapseData);
		const layout = getLayout(synapseData);
		
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
		synapseGraphUIStore.toggleNeuronSelection(neuronId);
	}
	
	function handleSelectAll() {
		synapseGraphUIStore.selectAllNeurons(neuronCount);
	}
	
	function handleClearSelection() {
		synapseGraphUIStore.clearSelection();
	}
	
	function handlePinSelected() {
		synapseGraphUIStore.pinSelectedNeurons();
	}
	
	function handleUnpin() {
		synapseGraphUIStore.unpinNeurons();
	}
</script>

<div class="synapse-graph-container">
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
		<div bind:this={plotDiv} class="synapse-plot"></div>
	{:else}
		<div class="no-data">
			<p>No neurons to display. Please set a neuron count greater than 0.</p>
		</div>
	{/if}
</div>

<style>
	.synapse-graph-container {
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
		max-width: 1400px;
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
		max-width: 1400px;
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
	
	.synapse-plot {
		width: 100%;
		max-width: 1600px;
	}
	
	@media (max-width: 1600px) {
		.synapse-plot,
		.control-bar,
		.neuron-selection-grid {
			max-width: 1200px;
		}
	}
	
	@media (max-width: 900px) {
		.synapse-plot,
		.control-bar,
		.neuron-selection-grid {
			max-width: 600px;
		}
		.control-bar {
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
	.synapse-graph-container::-webkit-scrollbar,
	.neuron-selection-grid::-webkit-scrollbar {
		width: 12px;
		height: 12px;
	}
	
	.synapse-graph-container::-webkit-scrollbar-track,
	.neuron-selection-grid::-webkit-scrollbar-track {
		background-color: #1e2a35;
		border-radius: 6px;
	}
	
	.synapse-graph-container::-webkit-scrollbar-thumb,
	.neuron-selection-grid::-webkit-scrollbar-thumb {
		background-color: #34495e;
		border-radius: 6px;
		border: 2px solid #1e2a35;
	}
	
	.synapse-graph-container::-webkit-scrollbar-thumb:hover,
	.neuron-selection-grid::-webkit-scrollbar-thumb:hover {
		background-color: #3498db;
	}
</style>
