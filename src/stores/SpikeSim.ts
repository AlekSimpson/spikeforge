/**
 * SpikeSim ViewModel
 * Manages state for a spike simulation
 */

import { writable } from 'svelte/store';

export interface ServerResponse {
	success: boolean;
	error_code: number;
	message: any;
}

const stop_simulation = async (): Promise<ServerResponse> => {
	try {
		console.log('Calling stop_simulation...');
		const response = await fetch('http://localhost:8080/engine/stop', {
			method: 'POST',
			mode: 'cors',
			headers: { 
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			credentials: 'omit',
			body: JSON.stringify({})
		});
		const result = await response.json();
		console.log('stop_simulation response:', result);
		return result;
	} catch (error) {
		console.error('stop_simulation error:', error);
		throw error;
	}
};

const reset_simulation = async (to_tick: number = 0): Promise<ServerResponse> => {
	try {
		console.log('Calling reset_simulation with to_tick:', to_tick);
		const response = await fetch('http://localhost:8080/engine/reset', {
			method: 'POST',
			mode: 'cors',
			headers: { 
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			credentials: 'omit',
			body: JSON.stringify({'to_tick': to_tick})
		});
		const result = await response.json();
		console.log('reset_simulation response:', result);
		return result;
	} catch (error) {
		console.error('reset_simulation error:', error);
		throw error;
	}
};

const start_simulation = async (simulation_inputs: number[]): Promise<ServerResponse> => {
	try {
		console.log('Calling start_simulation with inputs:', simulation_inputs);
		const response = await fetch('http://localhost:8080/engine/start', {
			method: 'POST',
			mode: 'cors',
			headers: { 
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			credentials: 'omit',
			body: JSON.stringify({'simulation_inputs': simulation_inputs})
		});
		const result = await response.json();
		console.log('start_simulation response:', result);
		return result;
	} catch (error) {
		console.error('start_simulation error:', error);
		throw error;
	}
};

const set_engine = async (settings: any): Promise<ServerResponse> => {
	try {
		console.log('Calling set_engine with settings:', settings);
		const response = await fetch('http://localhost:8080/engine/set', {
			method: 'POST',
			mode: 'cors',
			headers: { 
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			credentials: 'omit',
			body: JSON.stringify(settings)
		});
		const result = await response.json();
		console.log('set_engine response:', result);
		return result;
	} catch (error) {
		console.error('set_engine error:', error);
		throw error;
	}
};

const get_engine = async (requests: string[]): Promise<ServerResponse> => {
	try {
		console.log('Calling get_engine with requests:', requests);
		// Convert requests array to query parameters for GET request
		const params = new URLSearchParams({ requests: JSON.stringify(requests) });
		const response = await fetch(`http://localhost:8080/engine/get?${params}`, {
			method: 'GET',
			mode: 'cors',
			headers: { 
				'Accept': 'application/json'
			},
			credentials: 'omit'
		});
		const result = await response.json();
		console.log('get_engine response:', result);
		return result;
	} catch (error) {
		console.error('get_engine error:', error);
		throw error;
	}
}

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
		networkActivity: [],
		membranePotentials: [],
		...initialState
	});

	return {
		subscribe,

		sendToEngine() {
		},

		updateRank(value: number) {
			console.log('updateRank called with:', value);
			update(state => ({ ...state, rank: value }));
		},

		updateForTick(tick_: number, mps: number[]) {
			update(state => ({
				...state,
				networkActivity: [],
				membranePotentials: [...state.membranePotentials, mps],
				tick: tick_,
			}));
		},
		
		async updateRestingMp(value: number) {
			console.log('updateRestingMp called with:', value);
			try {
				// send engine reset
				await stop_simulation();
				await reset_simulation();

				// set engine resting mp
				await set_engine({"resting_mp": value});

				// update the frontend
				update(state => ({ ...state, restingMp: value }));
				console.log('updateRestingMp completed successfully');
			} catch (error) {
				console.error('updateRestingMp failed:', error);
			}
		},
		
		async updateDecayRate(value: number) {
			console.log('updateDecayRate called with:', value);
			try {
				// send engine reset
				await stop_simulation()
				await reset_simulation()

				// set engine decay rate
				await set_engine({"decay_rate": value})
				
				// update the frontend
				update(state => ({ ...state, decayRate: value }));
				console.log('updateDecayRate completed successfully');
			} catch (error) {
				console.error('updateDecayRate failed:', error);
			}
		},
		
		async updateLearningRate(value: number) {
			console.log('updateLearningRate called with:', value);
			try {
				// send engine reset
				await stop_simulation()
				await reset_simulation()

				// set engine learning rate
				await set_engine({"learning_rate": value})
				
				// update the frontend
				update(state => ({ ...state, learningRate: value }));
				console.log('updateLearningRate completed successfully');
			} catch (error) {
				console.error('updateLearningRate failed:', error);
			}
		},
		
		async updateLifetime(value: number) {
			console.log('updateLifetime called with:', value);
			try {
				// send engine reset
				await stop_simulation()
				await reset_simulation()

				// set engine lifetime
				await set_engine({"lifetime": value})

				// update the frontend
				update(state => ({ ...state, lifetime: value }));
				console.log('updateLifetime completed successfully');
			} catch (error) {
				console.error('updateLifetime failed:', error);
			}
		},
		
		async updateThreads(value: number) {
			console.log('updateThreads called with:', value);
			try {
				// send engine reset
				await stop_simulation()
				await reset_simulation()

				// set engine threads
				await set_engine({"threads": value})
				
				// update the frontend
				update(state => ({ ...state, threads: value }));
				console.log('updateThreads completed successfully');
			} catch (error) {
				console.error('updateThreads failed:', error);
			}
		},
		
		updateFileSelector(value: string) {
			console.log('updateFileSelector called with:', value);
			update(state => ({ ...state, fileSelector: value }));
		},
		
		updateNetworkActivity(activity: number[][]) {
			update(state => ({ ...state, networkActivity: activity }));
		},
	};
}

