/**
 * UI ViewModel
 * Manages UI state for sidebars, panels, etc.
 */

import { writable, derived } from 'svelte/store';
import type { SpikeSim } from './SpikeSim';

interface UIState {
	isLeftSidebarOpen: boolean;
	isBottomPanelOpen: boolean;
	bottomPanelHeight: number;
	isResizingPanel: boolean;
	selectedSpikeSim: SpikeSim | null;
	isSimulationPlaying: boolean;
	currentAnimationColumn: number;
	toggledCells: Map<string, boolean>;
	activeBottomTab: string;
}

const MIN_PANEL_HEIGHT = 100;
const MENU_BAR_HEIGHT = 60;

let animationInterval: ReturnType<typeof setInterval> | null = null;

function createUIStore() {
	const { subscribe, set, update } = writable<UIState>({
		isLeftSidebarOpen: false,
		isBottomPanelOpen: false,
		bottomPanelHeight: 300,
		isResizingPanel: false,
		selectedSpikeSim: null,
		isSimulationPlaying: false,
		currentAnimationColumn: -1,
		toggledCells: new Map(),
		activeBottomTab: 'heatmap'
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

		selectSpikeSim(spikeSim: SpikeSim) {
			update(state => ({
				...state,
				selectedSpikeSim: spikeSim
			}));
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
		}
	};
}

export const uiStore = createUIStore();

// Derived stores for convenience
export const isLeftSidebarOpen = derived(uiStore, $store => $store.isLeftSidebarOpen);
export const isBottomPanelOpen = derived(uiStore, $store => $store.isBottomPanelOpen);
export const bottomPanelHeight = derived(uiStore, $store => $store.bottomPanelHeight);
export const isResizingPanel = derived(uiStore, $store => $store.isResizingPanel);
export const selectedSpikeSim = derived(uiStore, $store => $store.selectedSpikeSim);
export const isSimulationPlaying = derived(uiStore, $store => $store.isSimulationPlaying);
export const currentAnimationColumn = derived(uiStore, $store => $store.currentAnimationColumn);
export const toggledCells = derived(uiStore, $store => $store.toggledCells);
export const activeBottomTab = derived(uiStore, $store => $store.activeBottomTab);

