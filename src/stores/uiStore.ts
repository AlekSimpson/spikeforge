/**
 * UI ViewModel
 * Manages UI state for sidebars, panels, etc.
 */

import { writable, derived } from 'svelte/store';
import type { SpikeSim, SpikeSimState } from './SpikeSim';
import { createSpikeSim, MessageType } from './SpikeSim';

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
	activeBottomTab: string;
	isBackendConnected: boolean;
	socket: WebSocket;
}

const MIN_PANEL_HEIGHT = 100;
const MENU_BAR_HEIGHT = 60;
const STORAGE_KEY = 'spikeforge_simulations';
const SOCKET = new WebSocket('ws://spikeframe.asuscomm.com:8888');


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
		activeBottomTab: 'heatmap',
		isBackendConnected: false,
		socket: SOCKET
	});

	return {
		subscribe,

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

		playSimulation(totalColumns: number) {
			update(state => {
				// Start from beginning if not started, otherwise resume
				const startColumn = state.currentAnimationColumn < 0 ? 0 : state.currentAnimationColumn;
				
				// Clear any existing interval
				if (animationInterval) {
					clearInterval(animationInterval);
				}
				
				// Start new interval
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
		},

		pauseSimulation() {
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
				
				if (newToggledCells.has(key)) {
					newToggledCells.delete(key);
				} else {
					newToggledCells.set(key, true);
				}
				
				return {
					...state,
					toggledCells: newToggledCells
				};
			});
		},

		clearAllToggledCells() {
			update(state => ({
				...state,
				toggledCells: new Map()
			}));
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

SOCKET.addEventListener('message', (event) => {
	var data = event.data
	if (data['type'] != MessageType.SIM_STREAM) {
		return;
	}
	var payload = data['payload'];
	var tick = payload['tick'];

	// uiStore.selectSpikeSim.update(state => ({
	// 	...state,
	// 	networkActivity: [],
	// 	membranePotentials: [],
	// 	tick: tick,
	// }))


	// update(state => ({
	// 	...state,
	// 	networkActivity: [],
	// 	membranePotentials: [],
	// 	tick: tick,
	// }));
});

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

