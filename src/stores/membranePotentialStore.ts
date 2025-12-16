/**
 * Membrane Potential UI ViewModel
 * Manages UI state for the membrane potential graph tab
 */

import { writable, derived } from 'svelte/store';

export interface MembranePotentialUIState {
	selectedNeurons: Set<number>;  // Currently selected neurons for pinning
	pinnedNeurons: number[];       // Pinned neurons (only these are shown when pinned)
	isPinned: boolean;             // Whether we're in pinned mode
}

function createMembranePotentialStore() {
	const { subscribe, set, update } = writable<MembranePotentialUIState>({
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

export const membranePotentialUIStore = createMembranePotentialStore();

// Derived stores for convenience
export const selectedNeurons = derived(
	membranePotentialUIStore,
	$store => $store.selectedNeurons
);

export const pinnedNeurons = derived(
	membranePotentialUIStore,
	$store => $store.pinnedNeurons
);

export const isPinned = derived(
	membranePotentialUIStore,
	$store => $store.isPinned
);

export const hasSelectedNeurons = derived(
	membranePotentialUIStore,
	$store => $store.selectedNeurons.size > 0
);

export const selectedCount = derived(
	membranePotentialUIStore,
	$store => $store.selectedNeurons.size
);

export const pinnedCount = derived(
	membranePotentialUIStore,
	$store => $store.pinnedNeurons.length
);

