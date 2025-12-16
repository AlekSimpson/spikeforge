<script lang="ts">
	import './layout.css';
	import { uiStore, selectedSpikeSim } from '../stores/uiStore';
	import { createSpikeSim } from '../stores/SpikeSim';
	import SpikeGrid from '../components/SpikeGrid.svelte';
	import SimControls from '../components/SimControls.svelte';
	import TabBar from '../components/TabBar.svelte';
	import Heatmap from '../components/Heatmap.svelte';
	import MembranePotentialGraph from '../components/MembranePotentialGraph.svelte';
	import SynapseGraph from '../components/SynapseGraph.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();
	
	// Subscribe to ViewModel
	const ui = $derived($uiStore);
	const sim = $derived($selectedSpikeSim);
	
	// Define tabs for bottom panel
	const tabs = [
		{ id: 'heatmap', label: 'Network Activity Heatmap' },
		{ id: 'membrane', label: 'Membrane Potential' },
		{ id: 'synapse', label: 'Synapse Graph' },
		{ id: 'custom', label: 'Custom Graph' },
		{ id: 'playback', label: 'Playback' }
	];
	
	// Create and select a default SpikeSim on mount
	onMount(() => {
		const defaultSim = createSpikeSim();
		uiStore.selectSpikeSim(defaultSim);
	});
	
	// Delegate to ViewModel
	function handleToggleLeftSidebar() {
		uiStore.toggleLeftSidebar();
	}
	
	function handleToggleBottomPanel() {
		uiStore.toggleBottomPanel();
	}
	
	function handleStartResize(event: MouseEvent) {
		if (!ui.isBottomPanelOpen) return;
		uiStore.startResize();
		event.preventDefault();
	}
	
	function handleMouseMove(event: MouseEvent) {
		uiStore.updatePanelHeight(event.clientY);
	}
	
	function handleStopResize() {
		uiStore.stopResize();
	}
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleStopResize} />

<div class="app">
	<nav class="menu-bar">
		<button class="menu-toggle" onclick={handleToggleLeftSidebar} aria-label="Toggle sidebar">
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</button>
		<TabBar tabs={tabs} activeTab={ui.activeBottomTab} />
	</nav>

	<!-- Left Sidebar -->
	<aside class="left-sidebar" class:open={ui.isLeftSidebarOpen}>
		<div class="sidebar-content">
			<!-- Sidebar content goes here -->
		</div>
	</aside>

	<main>
		{#if ui.activeBottomTab === 'heatmap'}
			<div class="tab-content heatmap-tab">
				<h3>Network Activity Heatmap</h3>
				{#if sim}
					{@const simData = $sim}
					{#if simData && simData.neuronCount > 0 && simData.networkActivity.length > 0}
						{@const heatmapSize = simData.networkActivity.length}
						<p>Displaying {heatmapSize}x{heatmapSize} grid ({simData.neuronCount} neurons)</p>
						<Heatmap activityData={simData.networkActivity} />
					{:else}
						<p>No valid neuron count or network activity data</p>
					{/if}
				{:else}
					<p>No simulation selected</p>
				{/if}
			</div>
		{:else if ui.activeBottomTab === 'membrane'}
			<div class="tab-content membrane-tab">
				{#if sim}
					{@const simData = $sim}
					{#if simData && simData.neuronCount > 0 && simData.membranePotentials.length > 0}
						<MembranePotentialGraph 
							membranePotentials={simData.membranePotentials}
							neuronCount={simData.neuronCount}
						/>
					{:else}
						<p>No valid neuron count or membrane potential data</p>
					{/if}
				{:else}
					<p>No simulation selected</p>
				{/if}
			</div>
		{:else if ui.activeBottomTab === 'synapse'}
			<div class="tab-content synapse-tab">
				{#if sim}
					{@const simData = $sim}
					{#if simData && simData.neuronCount > 0 && simData.neuronSynapses.length > 0}
						<SynapseGraph 
							neuronSynapses={simData.neuronSynapses}
							neuronCount={simData.neuronCount}
						/>
					{:else}
						<p>No valid neuron count or synapse data</p>
					{/if}
				{:else}
					<p>No simulation selected</p>
				{/if}
			</div>
		{:else if ui.activeBottomTab === 'custom'}
			<div class="tab-content">
				<h3>Custom Graph View</h3>
				<p>Create and display custom graphs based on simulation data.</p>
				<div class="placeholder-box">
					<span>Custom Graph Configuration Area</span>
				</div>
			</div>
		{:else if ui.activeBottomTab === 'playback'}
			<div class="tab-content">
				<h3>Playback Controls</h3>
				<p>Control simulation playback and review recorded data.</p>
				<div class="placeholder-box">
					<span>Playback Controls Area</span>
				</div>
			</div>
		{/if}
		{@render children()}
	</main>

	<!-- Bottom Panel -->
	<div 
		class="bottom-panel" 
		class:open={ui.isBottomPanelOpen}
		class:resizing={ui.isResizingPanel}
		style="height: {ui.bottomPanelHeight}px;"
	>
		<!-- Resize Handle -->
		{#if ui.isBottomPanelOpen}
			<div class="resize-handle" onmousedown={handleStartResize} role="separator" aria-orientation="horizontal">
				<div class="resize-indicator"></div>
			</div>
		{/if}
		
		<div class="panel-header">
			<button class="panel-toggle" onclick={handleToggleBottomPanel} aria-label="Toggle bottom panel">
				<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path 
						d={ui.isBottomPanelOpen ? "M5 8L10 13L15 8" : "M5 12L10 7L15 12"} 
						stroke="currentColor" 
						stroke-width="2" 
						stroke-linecap="round" 
						stroke-linejoin="round"
					/>
				</svg>
			</button>
			<span class="panel-title"><!-- Panel title can go here --></span>
		</div>
		
		<div class="panel-content">
			<div class="grid-wrapper">
				{#if sim}
					{@const simData = $sim}
					{#if simData && simData.neuronCount > 0 && simData.lifetime > 0}
						<SpikeGrid 
							rows={simData.neuronCount} 
							columns={simData.lifetime}
						/>
					{:else}
						<div class="grid-message">
							No valid neuron count or lifetime specified
						</div>
					{/if}
				{/if}
			</div>
			<SimControls />
		</div>
	</div>
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: #2c3e50;
	}

	.menu-bar {
		height: 60px;
		background-color: #1e2a35;
		border-bottom: 1px solid #141d26;
		display: flex;
		align-items: center;
		padding: 0 1.5rem;
		gap: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		z-index: 200;
		position: relative;
	}

	.menu-toggle {
		width: 40px;
		height: 40px;
		background-color: transparent;
		border: 1px solid #3498db;
		color: #3498db;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: background-color 0.2s ease;
	}

	.menu-toggle:hover {
		background-color: #2c3e50;
	}

	.left-sidebar {
		position: fixed;
		top: 60px;
		left: 0;
		bottom: 0;
		width: 280px;
		background-color: #1e2a35;
		border-right: 2px solid #3498db;
		box-shadow: 4px 0 12px rgba(0, 0, 0, 0.3);
		transform: translateX(-100%);
		transition: transform 0.3s ease-in-out;
		z-index: 150;
	}

	.left-sidebar.open {
		transform: translateX(0);
	}

	.sidebar-content {
		padding: 1.5rem;
		height: 100%;
		overflow-y: auto;
		color: #ecf0f1;
	}

	main {
		flex: 1;
		padding: 2rem;
	}

	.bottom-panel {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #1e2a35;
		box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
		transform: translateY(calc(100% - 40px));
		transition: transform 0.3s ease-in-out;
		z-index: 100;
	}

	.bottom-panel.open {
		transform: translateY(0);
	}

	.bottom-panel.resizing {
		transition: none;
		user-select: none;
	}

	.resize-handle {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 8px;
		cursor: ns-resize;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}

	.resize-handle:hover .resize-indicator {
		background-color: #3498db;
	}

	.resize-indicator {
		width: 60px;
		height: 3px;
		background-color: #34495e;
		border-radius: 2px;
		transition: background-color 0.2s ease;
	}

	.panel-header {
		height: 40px;
		background-color: #1e2a35;
		border-top: 2px solid #3498db;
		display: flex;
		align-items: center;
		padding: 0 1rem;
		gap: 0.75rem;
	}

	.panel-toggle {
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
		transition: background-color 0.2s ease;
	}

	.panel-toggle:hover {
		background-color: #34495e;
	}

	.panel-title {
		color: #ecf0f1;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.panel-content {
		padding: 0;
		height: calc(100% - 40px);
		overflow: hidden;
		color: #ecf0f1;
		display: flex;
		flex-direction: column;
	}
	
	.grid-wrapper {
		flex: 1;
		overflow: hidden;
		display: flex;
		align-items: flex-start;
		justify-content: center;
	}
	
	.grid-message {
		color: #95a5a6;
		font-size: 1rem;
		font-style: italic;
		text-align: center;
		padding: 2rem;
	}
	
	.tab-content {
		flex: 1;
		padding: 2rem;
		overflow-y: auto;
		color: #ecf0f1;
	}
	
	.tab-content h3 {
		color: #3498db;
		margin-bottom: 1rem;
		font-size: 1.25rem;
	}
	
	.tab-content p {
		color: #95a5a6;
		line-height: 1.6;
	}
	
	.placeholder-box {
		margin-top: 2rem;
		padding: 4rem 2rem;
		border: 2px dashed #34495e;
		border-radius: 8px;
		background-color: rgba(52, 73, 94, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
	}
	
	.placeholder-box span {
		color: #7f8c8d;
		font-size: 1.1rem;
		font-style: italic;
	}
	
	.heatmap-tab,
	.membrane-tab,
	.synapse-tab {
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
		padding: 0;
	}
	
	.heatmap-tab h3 {
		margin-bottom: 0.5rem;
	}
	
	.heatmap-tab p,
	.membrane-tab p,
	.synapse-tab p {
		margin-bottom: 1rem;
		text-align: center;
		padding: 2rem;
	}
</style>
