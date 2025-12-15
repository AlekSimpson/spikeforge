/**
 * SpikeSim ViewModel
 * Manages state for a spike simulation
 */

import { writable } from 'svelte/store';

export interface SpikeSimState {
	rank: number;
	neuronCount: number;
	restingMp: number;
	decayRate: number;
	learningRate: number;
	lifetime: number;
	threads: number;
	fileSelector: string;
	networkActivity: number[][]; // 2D array of activity levels (0-1) for heatmap visualization
}

export type SpikeSim = ReturnType<typeof createSpikeSim>;

function generateNetworkActivity(neuronCount: number): number[][] {
	// Generate initial activity data based on neuron count
	// This creates a square grid sized to sqrt(neuronCount)
	const size = Math.ceil(Math.sqrt(neuronCount));
	const activity: number[][] = [];
	
	for (let row = 0; row < size; row++) {
		activity[row] = [];
		for (let col = 0; col < size; col++) {
			// Placeholder: random activity values (will be replaced with actual simulation data)
			activity[row][col] = Math.random();
		}
	}
	
	return activity;
}

export function createSpikeSim(initialState?: Partial<SpikeSimState>) {
	const initialNeuronCount = initialState?.neuronCount ?? 10;
	
	const { subscribe, set, update } = writable<SpikeSimState>({
		rank: 0,
		neuronCount: initialNeuronCount,
		restingMp: 0,
		decayRate: 0,
		learningRate: 0,
		lifetime: 50,
		threads: 1,
		fileSelector: '',
		networkActivity: generateNetworkActivity(initialNeuronCount),
		...initialState
	});

	return {
		subscribe,
		
		updateRank(value: number) {
			update(state => ({ ...state, rank: value }));
		},
		
		updateNeuronCount(value: number) {
			update(state => ({ 
				...state, 
				neuronCount: value,
				networkActivity: generateNetworkActivity(value)
			}));
		},
		
		updateRestingMp(value: number) {
			update(state => ({ ...state, restingMp: value }));
		},
		
		updateDecayRate(value: number) {
			update(state => ({ ...state, decayRate: value }));
		},
		
		updateLearningRate(value: number) {
			update(state => ({ ...state, learningRate: value }));
		},
		
		updateLifetime(value: number) {
			update(state => ({ ...state, lifetime: value }));
		},
		
		updateThreads(value: number) {
			update(state => ({ ...state, threads: value }));
		},
		
		updateFileSelector(value: string) {
			update(state => ({ ...state, fileSelector: value }));
		},
		
		updateNetworkActivity(activity: number[][]) {
			update(state => ({ ...state, networkActivity: activity }));
		},
		
		regenerateNetworkActivity() {
			update(state => ({ 
				...state, 
				networkActivity: generateNetworkActivity(state.neuronCount)
			}));
		}
	};
}

