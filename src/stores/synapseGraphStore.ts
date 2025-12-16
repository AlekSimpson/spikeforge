/**
 * Synapse Graph UI ViewModel
 * Manages UI state for the synapse graph tab
 */

import { writable, derived } from 'svelte/store';

export interface SynapseGraphUIState {
	selectedNeurons: Set<number>;  // Currently selected neurons for pinning
	pinnedNeurons: number[];       // Pinned neurons (only their connections shown when pinned)
	isPinned: boolean;             // Whether we're in pinned mode
}

function createSynapseGraphStore() {
	const { subscribe, set, update } = writable<SynapseGraphUIState>({
		selectedNeurons: new Set(),
		pinnedNeurons: [],
		isPinned: false
	});

	return {
		subscribe,
		
		toggleNeuronSelection(neuronId: number) {
			update(state => {
				const newSelection = new Set(state.selectedNeurons);
				if (newSelection.has(neuronId)) {
					newSelection.delete(neuronId);
				} else {
					newSelection.add(neuronId);
				}
				return { ...state, selectedNeurons: newSelection };
			});
		},
		
		selectAllNeurons(neuronCount: number) {
			update(state => {
				const allNeurons = new Set(Array.from({ length: neuronCount }, (_, i) => i));
				return { ...state, selectedNeurons: allNeurons };
			});
		},
		
		clearSelection() {
			update(state => ({ ...state, selectedNeurons: new Set() }));
		},
		
		pinSelectedNeurons() {
			update(state => {
				if (state.selectedNeurons.size === 0) return state;
				
				const pinned = Array.from(state.selectedNeurons).sort((a, b) => a - b);
				return {
					...state,
					pinnedNeurons: pinned,
					isPinned: true,
					selectedNeurons: new Set() // Clear selection after pinning
				};
			});
		},
		
		unpinNeurons() {
			update(state => ({
				...state,
				pinnedNeurons: [],
				isPinned: false,
				selectedNeurons: new Set()
			}));
		},
		
		reset() {
			set({
				selectedNeurons: new Set(),
				pinnedNeurons: [],
				isPinned: false
			});
		}
	};
}

export const synapseGraphUIStore = createSynapseGraphStore();

// Derived stores for convenience
export const selectedNeurons = derived(
	synapseGraphUIStore,
	$store => $store.selectedNeurons
);

export const pinnedNeurons = derived(
	synapseGraphUIStore,
	$store => $store.pinnedNeurons
);

export const isPinned = derived(
	synapseGraphUIStore,
	$store => $store.isPinned
);

export const hasSelectedNeurons = derived(
	synapseGraphUIStore,
	$store => $store.selectedNeurons.size > 0
);

export const selectedCount = derived(
	synapseGraphUIStore,
	$store => $store.selectedNeurons.size
);

export const pinnedCount = derived(
	synapseGraphUIStore,
	$store => $store.pinnedNeurons.length
);

