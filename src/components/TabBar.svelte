<script lang="ts">
	import { uiStore } from '../stores/uiStore';
	
	type Props = {
		tabs: Array<{ id: string; label: string }>;
		activeTab: string;
	};
	
	let { tabs, activeTab }: Props = $props();
	
	function handleTabClick(tabId: string) {
		uiStore.setActiveBottomTab(tabId);
	}
</script>

<div class="tab-bar">
	{#each tabs as tab}
		<button 
			class="tab"
			class:active={activeTab === tab.id}
			onclick={() => handleTabClick(tab.id)}
		>
			{tab.label}
		</button>
	{/each}
</div>

<style>
	.tab-bar {
		display: flex;
		gap: 0.5rem;
		padding: 0 1rem;
		background-color: #1e2a35;
		border-bottom: 1px solid #34495e;
	}
	
	.tab {
		padding: 0.75rem 1.5rem;
		background-color: transparent;
		border: none;
		color: #95a5a6;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.2s ease;
		font-size: 0.9rem;
		font-weight: 500;
	}
	
	.tab:hover {
		color: #ecf0f1;
		background-color: rgba(52, 152, 219, 0.1);
	}
	
	.tab.active {
		color: #3498db;
		border-bottom-color: #3498db;
	}
</style>

