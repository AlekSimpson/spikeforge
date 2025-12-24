/**
 * UI ViewModel
 * Manages UI state for sidebars, panels, etc.
 */

import { writable, derived, get } from 'svelte/store';
import type { SpikeSim, SpikeSimState } from './SpikeSim';
import { createSpikeSim, set_engine, start_simulation, stop_simulation, DEFAULT_LIFETIME, DEFAULT_NEURON_COUNT, check_engine_ready, init_engine } from './SpikeSim';

interface UIState {
	isLeftSidebarOpen: boolean;
	isBottomPanelOpen: boolean;
	bottomPanelHeight: number;
	isResizingPanel: boolean;
	allSpikeSims: SpikeSim[];
	selectedSpikeSim: SpikeSim | null;
	isSimulationPlaying: boolean;
	currentAnimationColumn: number;
	toggledCells: Map<string, boolean>;
	inputGrid: number[][];
	activeBottomTab: string;
	isBackendConnected: boolean;
	engineReady: boolean;
}

const MIN_PANEL_HEIGHT = 100;
const MENU_BAR_HEIGHT = 60;
const STORAGE_KEY = 'spikeforge_simulations';

let animationInterval: ReturnType<typeof setInterval> | null = null;

// Helper functions for localStorage persistence
function saveSimulationsToStorage(sims: SpikeSim[], selectedSim: SpikeSim | null) {
	try {
		const simStates: SpikeSimState[] = [];
		let selectedIndex = -1;

		// Extract state from each SpikeSim store
		sims.forEach((sim, index) => {
			let state: SpikeSimState | null = null;
			const unsubscribe = sim.subscribe(s => {
				state = s;
			});
			unsubscribe();

			if (state) {
				simStates.push(state);
			}

			if (sim === selectedSim) {
				selectedIndex = index;
			}
		});

		localStorage.setItem(STORAGE_KEY, JSON.stringify({
			simStates,
			selectedIndex
		}));
	} catch (error) {
		console.error('Failed to save simulations to localStorage:', error);
	}
}

function loadSimulationsFromStorage(): { sims: SpikeSim[]; selectedSim: SpikeSim | null } {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return { sims: [], selectedSim: null };
		}

		const { simStates, selectedIndex } = JSON.parse(stored);
		const sims: SpikeSim[] = simStates.map((state: SpikeSimState) => createSpikeSim(state));
		const selectedSim = selectedIndex >= 0 && selectedIndex < sims.length ? sims[selectedIndex] : null;

		return { sims, selectedSim };
	} catch (error) {
		console.error('Failed to load simulations from localStorage:', error);
		return { sims: [], selectedSim: null };
	}
}

function createUIStore() {
	// Load persisted simulations from localStorage
	const { sims: persistedSims, selectedSim: persistedSelected } = loadSimulationsFromStorage();

	const createDefaultGrid = (neuron_count: number, lifetime: number) => {
		var grid: number[][] = []

		for (let i = 0; i < neuron_count; i++) {
			grid[i] = []; // Initialize the row first
			for (let j = 0; j < lifetime; j++) {
				grid[i][j] = 0;
			}
		}
		return grid;
	};

	const { subscribe, set, update } = writable<UIState>({
		isLeftSidebarOpen: false,
		isBottomPanelOpen: false,
		bottomPanelHeight: 300,
		isResizingPanel: false,
		allSpikeSims: persistedSims,
		selectedSpikeSim: persistedSelected,
		isSimulationPlaying: false,
		currentAnimationColumn: -1,
		toggledCells: new Map(),
		inputGrid: createDefaultGrid(DEFAULT_NEURON_COUNT, DEFAULT_LIFETIME),
		activeBottomTab: 'heatmap',
		isBackendConnected: false, 
		engineReady: false,
	});

	return {
		subscribe,

		async syncBackend() {
			try {
				const currentState = get({ subscribe });

				var neuron_count = 0;
				var lifetime = 0;
				var topology = "";
				var shape = 0;
				var resting_mp = 0;
				var decay_rate = 0;
				var learning_rate = 0;
				var threads = 0;
				var input_neurons: number[] = [];
				if (!currentState.selectedSpikeSim) {
					return;
				}

		        const unsubscribe = currentState.selectedSpikeSim.subscribe(simState => {
		            neuron_count = simState.neuronCount;
					topology = simState.topology;
					shape = simState.shape;
		            lifetime = simState.lifetime;
					resting_mp = simState.restingMp;
					decay_rate = simState.decayRate;
					learning_rate = simState.learningRate;
					threads = simState.threads;
					input_neurons = simState.inputNeurons;
		        });
		        unsubscribe(); // Immediately unsubscribe after reading

				await stop_simulation();
				let engine_response = await init_engine(topology, shape)
				let response = await set_engine({
					"neuron_count": neuron_count,
					"lifetime": lifetime,
					"resting_mp": resting_mp,
					"decay_rate": decay_rate,
					"learning_rate": learning_rate,
					"threads": threads,
					"input_neurons": input_neurons
				});

				let is_ready = Boolean(response['success']) && Boolean(engine_response['success'])
				update(state => ({...state, engineReady: is_ready}))

			} catch (error) {
				console.error('syncBackend failed:', error);
			}
		},

		toggleLeftSidebar() {
			update(state => ({
				...state,
				isLeftSidebarOpen: !state.isLeftSidebarOpen
			}));
		},

		toggleBottomPanel() {
			update(state => ({
				...state,
				isBottomPanelOpen: !state.isBottomPanelOpen
			}));
		},

		startResize() {
			update(state => ({
				...state,
				isResizingPanel: true
			}));
		},

		updatePanelHeight(clientY: number) {
			update(state => {
				if (!state.isResizingPanel) return state;

				const windowHeight = window.innerHeight;
				const maxHeight = windowHeight - MENU_BAR_HEIGHT;
				const newHeight = windowHeight - clientY;
				const clampedHeight = Math.max(MIN_PANEL_HEIGHT, Math.min(maxHeight, newHeight));

				return {
					...state,
					bottomPanelHeight: clampedHeight
				};
			});
		},

		stopResize() {
			update(state => ({
				...state,
				isResizingPanel: false
			}));
		},

		addSpikeSim(spikeSim: SpikeSim) {
			update(state => {
				const newState = {
					...state,
					allSpikeSims: [...state.allSpikeSims, spikeSim]
				};
				saveSimulationsToStorage(newState.allSpikeSims, newState.selectedSpikeSim);
				return newState;
			});
		},

		removeSpikeSim(spikeSim: SpikeSim) {
			update(state => {
				const newSims = state.allSpikeSims.filter(sim => sim !== spikeSim);
				const newSelected = state.selectedSpikeSim === spikeSim 
					? (newSims.length > 0 ? newSims[0] : null)
					: state.selectedSpikeSim;
				
				const newState = {
					...state,
					allSpikeSims: newSims,
					selectedSpikeSim: newSelected
				};
				saveSimulationsToStorage(newState.allSpikeSims, newState.selectedSpikeSim);
				return newState;
			});
		},

		selectSpikeSim(spikeSim: SpikeSim) {
			update(state => {
				const newState = {
					...state,
					selectedSpikeSim: spikeSim
				};
				saveSimulationsToStorage(newState.allSpikeSims, newState.selectedSpikeSim);
				return newState;
			});
		},

		clearSelectedSpikeSim() {
			update(state => ({
				...state,
				selectedSpikeSim: null
			}));
		},

		async playSimulation(totalColumns: number) {
			try {
				const currentState = get({ subscribe });
				const inputGrid = currentState.inputGrid;

				let response = await start_simulation(inputGrid);
				console.log('response is ', response)
				if (!Boolean(response['success'])) {
					console.error("Engine is not ready: ", response['message']);
					return
				}

				update(state => {
					const startColumn = state.currentAnimationColumn < 0 ? 0 : state.currentAnimationColumn;
	
					if (animationInterval) {
						clearInterval(animationInterval);
					}
	
					animationInterval = setInterval(() => {
						update(s => ({
							...s,
							currentAnimationColumn: (s.currentAnimationColumn + 1) % totalColumns
						}));
					}, 100);
	
					return {
						...state,
						isSimulationPlaying: true,
						currentAnimationColumn: startColumn
					};
				});
			} catch (error) {
				console.error('Simulation error:', error);
			}
		},

		async pauseSimulation() {
			await stop_simulation();

			if (animationInterval) {
				clearInterval(animationInterval);
				animationInterval = null;
			}
			
			update(state => ({
				...state,
				isSimulationPlaying: false
			}));
		},

		stopSimulation() {
			if (animationInterval) {
				clearInterval(animationInterval);
				animationInterval = null;
			}
			
			update(state => ({
				...state,
				isSimulationPlaying: false,
				currentAnimationColumn: -1
			}));
		},

		resetSimulation() {
			if (animationInterval) {
				clearInterval(animationInterval);
				animationInterval = null;
			}
			
			update(state => ({
				...state,
				isSimulationPlaying: false,
				currentAnimationColumn: -1
			}));
		},

		toggleCell(row: number, col: number) {
			update(state => {
				const key = `${row},${col}`;
				const newToggledCells = new Map(state.toggledCells);
				// Deep copy the 2D array to avoid mutating the original
				var newInputGrid: number[][] = state.inputGrid.map(row => [...row]);

				if (newToggledCells.has(key)) {
					newToggledCells.delete(key);
					newInputGrid[row][col] = 0;
				} else {
					newToggledCells.set(key, true);
					newInputGrid[row][col] = 1;
				}
				
				return {
					...state,
					toggledCells: newToggledCells,
					inputGrid: newInputGrid
				};
			});
		},

		clearAllToggledCells() {
		    update(state => {
		        // Default values in case there's no selected simulation
		        let neuron_count = DEFAULT_NEURON_COUNT;
		        let lifetime = DEFAULT_LIFETIME;
			
		        // If there's a selected simulation, get its state values
		        if (state.selectedSpikeSim) {
		            const unsubscribe = state.selectedSpikeSim.subscribe(simState => {
		                neuron_count = simState.neuronCount;
		                lifetime = simState.lifetime;
		            });
		            unsubscribe(); // Immediately unsubscribe after reading
		        }
			
		        return {
		            ...state,
		            toggledCells: new Map(),
		            inputGrid: createDefaultGrid(neuron_count, lifetime)
		        };
		    });
		},

		setEngineReady(value: boolean) {
			update(state => ({
				...state,
				engineReady: value
			}))
		},

		setActiveBottomTab(tabName: string) {
			update(state => ({
				...state,
				activeBottomTab: tabName
			}));
		},

		setBackendConnected(connected: boolean) {
			update(state => ({
				...state,
				isBackendConnected: connected
			}));
		}
	};
}

export const uiStore = createUIStore();

// Derived stores for convenience
export const isLeftSidebarOpen = derived(uiStore, $store => $store.isLeftSidebarOpen);
export const isBottomPanelOpen = derived(uiStore, $store => $store.isBottomPanelOpen);
export const bottomPanelHeight = derived(uiStore, $store => $store.bottomPanelHeight);
export const isResizingPanel = derived(uiStore, $store => $store.isResizingPanel);
export const allSpikeSims = derived(uiStore, $store => $store.allSpikeSims);
export const selectedSpikeSim = derived(uiStore, $store => $store.selectedSpikeSim);
export const isSimulationPlaying = derived(uiStore, $store => $store.isSimulationPlaying);
export const currentAnimationColumn = derived(uiStore, $store => $store.currentAnimationColumn);
export const toggledCells = derived(uiStore, $store => $store.toggledCells);
export const activeBottomTab = derived(uiStore, $store => $store.activeBottomTab);
export const isBackendConnected = derived(uiStore, $store => $store.isBackendConnected);
export const isEngineReady = derived(uiStore, $store => $store.engineReady);

