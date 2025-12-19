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
	socket: WebSocket;
}

export type SpikeSim = ReturnType<typeof createSpikeSim>;

export enum MessageType {
	START,
	SIM_STREAM,
	STOP,
	RESET,
	SET,
	GET
}

export interface ServerMessage {
  type: MessageType;
  payload: any;
}

export function createSpikeSim(initialState?: Partial<SpikeSimState>) {
	const initialNeuronCount = initialState?.neuronCount ?? 10;
	const initialLifetime = initialState?.lifetime ?? 50;
	const SOCKET = initialState?.socket!;
	
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
		socket: SOCKET,
		...initialState
	});

	return {
		subscribe,
		
		updateRank(value: number) {
			update(state => ({ ...state, rank: value }));
		},

		sendToEngine(type: MessageType, payload: any) {
			SOCKET.send(JSON.stringify({type, payload}));
		},

		updateForTick(tick_: number, mps: number[]) {

			update(state => ({
				...state,
				networkActivity: [],
				membranePotentials: [...state.membranePotentials, mps],
				tick: tick,
			}));
		},
		
		updateNeuronCount(value: number) {
			// send engine reset
			this.sendToEngine(MessageType.STOP, {});
			this.sendToEngine(MessageType.RESET, {});

			// set engine mp
			this.sendToEngine(MessageType.SET, {
				"neuron_count": value,
			})

			update(state => ({ ...state, neuronCount: value }));
		},
		
		updateRestingMp(value: number) {
			// send engine reset
			this.sendToEngine(MessageType.STOP, {});
			this.sendToEngine(MessageType.RESET, {});

			// set engine resting mp
			this.sendToEngine(MessageType.SET, {
				"resting_mp": value,
			});
			
			// update the frontend
			update(state => ({ ...state, restingMp: value }));
		},
		
		updateDecayRate(value: number) {
			// send engine reset
			this.sendToEngine(MessageType.STOP, {});
			this.sendToEngine(MessageType.RESET, {});

			// set engine decay rate
			this.sendToEngine(MessageType.SET, {
				"decay_rate": value,
			});
			
			// update the frontend
			update(state => ({ ...state, decayRate: value }));
		},
		
		updateLearningRate(value: number) {
			// send engine reset
			this.sendToEngine(MessageType.STOP, {});
			this.sendToEngine(MessageType.RESET, {});

			// set engine learning rate
			this.sendToEngine(MessageType.SET, {
				"learning_rate": value
			});
			
			// update the frontend
			update(state => ({ ...state, learningRate: value }));
		},
		
		updateLifetime(value: number) {
			// send engine reset
			this.sendToEngine(MessageType.STOP, {});
			this.sendToEngine(MessageType.RESET, {});

			// set engine lifetime
			this.sendToEngine(MessageType.SET, {
				"lifetime": value
			});
			
			// update the frontend
			update(state => ({ ...state, lifetime: value }));
		},
		
		updateThreads(value: number) {
			// send engine reset
			this.sendToEngine(MessageType.STOP, {});
			this.sendToEngine(MessageType.RESET, {});

			// set engine threads
			this.sendToEngine(MessageType.SET, {
				"threads": value
			});
			
			// update the frontend
			update(state => ({ ...state, threads: value }));
		},
		
		updateFileSelector(value: string) {
			update(state => ({ ...state, fileSelector: value }));
		},
		
		updateNetworkActivity(activity: number[][]) {
			update(state => ({ ...state, networkActivity: activity }));
		},
	};
}

