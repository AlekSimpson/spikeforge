<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	
	type Props = {
		activityData: number[][]; // 2D array of activity levels from ViewModel
	};
	
	let { activityData }: Props = $props();
	
	let plotDiv: HTMLDivElement;
	let Plotly: any = null;
	let isInitialized = false;
	
	onMount(async () => {
		// Dynamically import Plotly only in browser
		if (browser) {
			Plotly = await import('plotly.js-dist-min');
			createHeatmap();
			isInitialized = true;
		}
		
		return () => {
			// Cleanup on unmount
			if (Plotly && plotDiv) {
				Plotly.purge(plotDiv);
			}
		};
	});
	
	// Update heatmap when data changes
	$effect(() => {
		// Access activityData to track it
		const data = activityData;
		if (Plotly && plotDiv && isInitialized && data) {
			updateHeatmap(data);
		}
	});
	
	function getPlotData(data: number[][]) {
		return [{
			z: data,
			type: 'heatmap',
			colorscale: [
				[0, '#0d1117'],    // Very dark (0%)
				[0.25, '#1e3a5f'], // Dark blue (25%)
				[0.5, '#2e5090'],  // Blue (50%)
				[0.75, '#ff6b35'], // Orange (75%)
				[1, '#ff0000']     // Red (100%)
			],
			hoverongaps: false,
			hovertemplate: 'Row: %{y}<br>Col: %{x}<br>Activity: %{z:.1%}<extra></extra>',
			colorbar: {
				title: 'Activity',
				titleside: 'right',
				tickmode: 'linear',
				tick0: 0,
				dtick: 0.25,
				tickformat: '.0%',
				len: 0.75,
				thickness: 20,
				bgcolor: 'rgba(30, 42, 53, 0.8)',
				bordercolor: '#3498db',
				borderwidth: 1,
				tickfont: {
					color: '#ecf0f1'
				},
				titlefont: {
					color: '#ecf0f1'
				}
			}
		}];
	}
	
	function getLayout() {
		return {
			title: {
				text: '',
				font: {
					color: '#ecf0f1'
				}
			},
			xaxis: {
				title: '',
				color: '#ecf0f1',
				gridcolor: 'rgba(0,0,0,0)',
				showgrid: false,
				showticklabels: false,
				scaleanchor: 'y',
				scaleratio: 1,
				showline: false,
				zeroline: false,
				visible: false
			},
			yaxis: {
				title: '',
				color: '#ecf0f1',
				gridcolor: 'rgba(0,0,0,0)',
				showgrid: false,
				showticklabels: false,
				constrain: 'domain',
				showline: false,
				zeroline: false,
				visible: false
			},
			paper_bgcolor: 'rgba(0,0,0,0)',
			plot_bgcolor: 'rgba(0,0,0,0)',
			margin: {
				l: 100,
				r: 100,
				t: 10,
				b: 10
			},
			autosize: true
		};
	}
	
	function createHeatmap() {
		if (!Plotly || !plotDiv) return;
		
		const config = {
			responsive: true,
			displayModeBar: false,
			displaylogo: false
		};
		
		Plotly.newPlot(plotDiv, getPlotData(activityData), getLayout(), config);
	}
	
	function updateHeatmap(data: number[][]) {
		if (!Plotly || !plotDiv) return;
		
		// Use react() for efficient updates - only updates what changed
		Plotly.react(plotDiv, getPlotData(data), getLayout());
	}
</script>

<div class="heatmap-container">
	<div bind:this={plotDiv} class="heatmap-plot"></div>
</div>

<style>
	.heatmap-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		width: 100%;
		height: 100%;
	}
	
	.heatmap-plot {
		width: min(55vw, 55vh);
		height: min(55vw, 55vh);
		max-width: 550px;
		max-height: 550px;
		min-width: 350px;
		min-height: 350px;
		aspect-ratio: 1 / 1;
	}
	
	/* Responsive scaling for different screen sizes */
	@media (max-width: 1024px) {
		.heatmap-plot {
			width: min(50vw, 50vh);
			height: min(50vw, 50vh);
			max-width: 500px;
			max-height: 500px;
		}
	}
	
	@media (max-width: 768px) {
		.heatmap-plot {
			width: min(70vw, 70vh);
			height: min(70vw, 70vh);
			max-width: 450px;
			max-height: 450px;
			min-width: 300px;
			min-height: 300px;
		}
	}
	
	@media (min-width: 1920px) {
		.heatmap-plot {
			width: min(45vw, 45vh);
			height: min(45vw, 45vh);
			max-width: 600px;
			max-height: 600px;
		}
	}
</style>

