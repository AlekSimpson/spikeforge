<!--
  SimControls Component (View)
  Compact horizontal control bar for simulation parameters
-->
<script lang="ts">
	import { selectedSpikeSim } from '../stores/uiStore';
	import { TOPOLOGY_OPTIONS } from '../stores/SpikeSim';
	
	// Subscribe to selected SpikeSim ViewModel
	const sim = $derived($selectedSpikeSim);
	
	function handleImport() {
		// Import logic will be handled by ViewModel
		console.log('Import clicked');
	}
	
	function handleExport() {
		// Export logic will be handled by ViewModel
		console.log('Export clicked');
	}
</script>

{#if sim}
	<div class="sim-controls">
		<div class="control-group">
			<label for="topology">Topology:</label>
			<select 
				id="topology"
				value={$sim.fileSelector} 
				onchange={(e) => sim.updateFileSelector(e.currentTarget.value)}
				class="file-selector"
			>
				{#each TOPOLOGY_OPTIONS as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>
		
		<div class="divider"></div>
		
		<div class="control-group">
			<label for="rank">Rank:</label>
			<input 
				id="rank" 
				type="number" 
				value={$sim.rank}
				oninput={(e) => sim.updateRank(Number(e.currentTarget.value))}
			/>
		</div>
		
		<div class="divider"></div>
		
		<div class="control-group">
			<label for="resting-mp">Resting MP:</label>
			<input 
				id="resting-mp" 
				type="number" 
				value={$sim.restingMp}
				oninput={(e) => sim.updateRestingMp(Number(e.currentTarget.value))}
			/>
		</div>
		
		<div class="divider"></div>
		
		<div class="control-group">
			<label for="decay">Decay:</label>
			<input 
				id="decay" 
				type="number" 
				value={$sim.decayRate}
				oninput={(e) => sim.updateDecayRate(Number(e.currentTarget.value))}
			/>
		</div>
		
		<div class="divider"></div>
		
		<div class="control-group">
			<label for="learning">Learning:</label>
			<input 
				id="learning" 
				type="number" 
				value={$sim.learningRate}
				oninput={(e) => sim.updateLearningRate(Number(e.currentTarget.value))}
			/>
		</div>
		
		<div class="divider"></div>
		
		<div class="control-group">
			<label for="lifetime">Lifetime:</label>
			<input 
				id="lifetime" 
				type="number" 
				value={$sim.lifetime}
				oninput={(e) => sim.updateLifetime(Number(e.currentTarget.value))}
				min="1"
			/>
		</div>
		
		<div class="divider"></div>
		
		<div class="control-group">
			<label for="threads">Threads:</label>
			<input 
				id="threads" 
				type="number" 
				value={$sim.threads}
				oninput={(e) => sim.updateThreads(Number(e.currentTarget.value))}
				min="1"
			/>
		</div>
		
		<div class="divider"></div>
		
		<div class="control-group">
			<button class="action-btn" onclick={handleImport}>Import</button>
			<button class="action-btn" onclick={handleExport}>Export</button>
		</div>
	</div>
{:else}
	<div class="sim-controls">
		<div class="no-sim">No simulation selected</div>
	</div>
{/if}

<style>
	.sim-controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background-color: #1e2a35;
		border-top: 1px solid #34495e;
		overflow-x: auto;
		white-space: nowrap;
		flex-wrap: wrap;
		min-height: 60px;
	}
	
	@media (max-width: 1400px) {
		.sim-controls {
			justify-content: flex-start;
			padding: 0.6rem 0.75rem;
		}
	}
	
	@media (max-width: 768px) {
		.sim-controls {
			padding: 0.5rem;
			gap: 0.5rem;
		}
	}
	
	.control-group {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-shrink: 0;
	}
	
	.divider {
		width: 1px;
		height: 24px;
		background-color: #34495e;
		flex-shrink: 0;
	}
	
	@media (max-width: 1400px) {
		.divider {
			display: none;
		}
		
		.sim-controls {
			gap: 0.5rem;
		}
	}
	
	label {
		font-size: 0.8rem;
		color: #ecf0f1;
		font-weight: 500;
		white-space: nowrap;
	}
	
	input[type="number"],
	.file-selector {
		width: 70px;
		padding: 0.35rem 0.4rem;
		background-color: #2c3e50;
		border: 1px solid #34495e;
		border-radius: 3px;
		color: #ecf0f1;
		font-size: 0.8rem;
		flex-shrink: 0;
	}
	
	.file-selector {
		width: 160px;
		padding: 0.35rem 0.5rem;
		cursor: pointer;
	}
	
	.file-selector option {
		padding: 0.5rem 0.75rem;
		background-color: #2c3e50;
		color: #ecf0f1;
	}
	
	@media (max-width: 1200px) {
		input[type="number"] {
			width: 60px;
		}
		
		.file-selector {
			width: 140px;
		}
		
		label {
			font-size: 0.75rem;
		}
	}
	
	input[type="number"]:focus,
	.file-selector:focus {
		outline: none;
		border-color: #3498db;
	}
	
	.action-btn {
		padding: 0.35rem 0.8rem;
		background-color: #3498db;
		border: none;
		border-radius: 3px;
		color: white;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
		white-space: nowrap;
	}
	
	.action-btn:hover {
		background-color: #2980b9;
	}
	
	@media (max-width: 1200px) {
		.action-btn {
			padding: 0.3rem 0.6rem;
			font-size: 0.75rem;
		}
	}
	
	/* Custom scrollbar for horizontal overflow */
	.sim-controls::-webkit-scrollbar {
		height: 8px;
	}
	
	.sim-controls::-webkit-scrollbar-track {
		background-color: #1e2a35;
	}
	
	.sim-controls::-webkit-scrollbar-thumb {
		background-color: #34495e;
		border-radius: 4px;
	}
	
	.sim-controls::-webkit-scrollbar-thumb:hover {
		background-color: #3498db;
	}
	
	.no-sim {
		color: #7f8c8d;
		font-size: 0.9rem;
		font-style: italic;
	}
</style>