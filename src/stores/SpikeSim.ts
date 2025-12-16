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
	membranePotentials: number[][]; // 2D array: [neuronIndex][timeStep] = potential value
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

function generateMembranePotentials(neuronCount: number, lifetime: number): number[][] {
	// Generate membrane potential data for each neuron over time
	// Returns 2D array: [neuronIndex][timeStep] = potential value
	const potentials: number[][] = [];
	
	for (let neuron = 0; neuron < neuronCount; neuron++) {
		potentials[neuron] = [];
		let currentPotential = -70 + Math.random() * 10; // Start near resting potential with variation
		
		for (let t = 0; t < lifetime; t++) {
			// Simulate membrane potential with random spikes and decay
			const spikeChance = Math.random();
			
			if (spikeChance > 0.95) {
				// Spike occurs
				currentPotential = 30 + Math.random() * 10; // Action potential peak
			} else if (currentPotential > -60) {
				// Decay towards resting potential
				currentPotential -= 5 + Math.random() * 3;
			} else {
				// Small fluctuations near resting
				currentPotential += (Math.random() - 0.5) * 2;
			}
			
			// Clamp values to realistic range
			currentPotential = Math.max(-80, Math.min(40, currentPotential));
			potentials[neuron][t] = currentPotential;
		}
	}
	
	return potentials;
}

export function createSpikeSim(initialState?: Partial<SpikeSimState>) {
	const initialNeuronCount = initialState?.neuronCount ?? 10;
	const initialLifetime = initialState?.lifetime ?? 50;
	
	const { subscribe, set, update } = writable<SpikeSimState>({
		rank: 0,
		neuronCount: initialNeuronCount,
		restingMp: 0,
		decayRate: 0,
		learningRate: 0,
		lifetime: initialLifetime,
		threads: 1,
		fileSelector: '',
		networkActivity: generateNetworkActivity(initialNeuronCount),
		membranePotentials: generateMembranePotentials(initialNeuronCount, initialLifetime),
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
				networkActivity: generateNetworkActivity(value),
				membranePotentials: generateMembranePotentials(value, state.lifetime)
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
			update(state => ({ 
				...state, 
				lifetime: value,
				membranePotentials: generateMembranePotentials(state.neuronCount, value)
			}));
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
		},
		
		updateMembranePotentials(potentials: number[][]) {
			update(state => ({ ...state, membranePotentials: potentials }));
		},
		
		regenerateMembranePotentials() {
			update(state => ({
				...state,
				membranePotentials: generateMembranePotentials(state.neuronCount, state.lifetime)
			}));
		}
	};
}

