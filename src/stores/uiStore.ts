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
}

const MIN_PANEL_HEIGHT = 100;
const MENU_BAR_HEIGHT = 60;

function createUIStore() {
	const { subscribe, set, update } = writable<UIState>({
		isLeftSidebarOpen: false,
		isBottomPanelOpen: false,
		bottomPanelHeight: 300,
		isResizingPanel: false,
		selectedSpikeSim: null
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

