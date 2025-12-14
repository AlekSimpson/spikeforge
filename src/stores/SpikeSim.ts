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
}

export type SpikeSim = ReturnType<typeof createSpikeSim>;

export function createSpikeSim(initialState?: Partial<SpikeSimState>) {
	const { subscribe, set, update } = writable<SpikeSimState>({
		rank: 0,
		neuronCount: 10,
		restingMp: 0,
		decayRate: 0,
		learningRate: 0,
		lifetime: 50,
		threads: 1,
		fileSelector: '',
		...initialState
	});

	return {
		subscribe,
		
		updateRank(value: number) {
			update(state => ({ ...state, rank: value }));
		},
		
		updateNeuronCount(value: number) {
			update(state => ({ ...state, neuronCount: value }));
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
		}
	};
}

