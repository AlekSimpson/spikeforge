/**
 * Custom Graph ViewModel
 * Manages UI state and business logic for the custom graph editor tab
 * Following MVVM architecture pattern
 */

import { writable, derived, get } from 'svelte/store';

export interface CustomGraphState {
	pythonCode: string;
	isExecuting: boolean;
	errorMessage: string;
	hasPlot: boolean;
	plotlyJson: string | null;
	isVimModeEnabled: boolean;
	vimStatusLine: string;
}

const DEFAULT_PYTHON_CODE = '';

function createCustomGraphStore() {
	const { subscribe, set, update } = writable<CustomGraphState>({
		pythonCode: DEFAULT_PYTHON_CODE,
		isExecuting: false,
		errorMessage: '',
		hasPlot: false,
		plotlyJson: null,
		isVimModeEnabled: false,
		vimStatusLine: ''
	});

	return {
		subscribe,

		/**
		 * Update the Python code in the editor
		 */
		updateCode(code: string) {
			update(state => ({ ...state, pythonCode: code }));
		},

		/**
		 * Execute the custom plot code on the backend
		 */
		async executeCustomPlot(simulationId: string = 'current_simulation') {
			const state = get({ subscribe });
			
			// Set executing state
			update(s => ({ 
				...s, 
				isExecuting: true, 
				errorMessage: '' 
			}));

			try {
				// Call backend API endpoint
				const response = await fetch('/api/execute-custom-plot', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						code: state.pythonCode,
						simulation_id: simulationId
					})
				});

				if (!response.ok) {
					const error = await response.json();
					throw new Error(error.message || 'Execution failed');
				}

				const result = await response.json();
				
				// Update with successful plot
				update(s => ({
					...s,
					isExecuting: false,
					hasPlot: true,
					plotlyJson: result.plotly_json,
					errorMessage: ''
				}));

			} catch (error: any) {
				// Update with error
				update(s => ({
					...s,
					isExecuting: false,
					errorMessage: error.message || 'An error occurred'
				}));
				console.error('Plot execution error:', error);
			}
		},

		/**
		 * Clear the current plot
		 */
		clearPlot() {
			update(state => ({
				...state,
				hasPlot: false,
				plotlyJson: null
			}));
		},

		/**
		 * Toggle Vim mode on/off
		 */
		toggleVimMode() {
			update(state => ({
				...state,
				isVimModeEnabled: !state.isVimModeEnabled,
				vimStatusLine: !state.isVimModeEnabled ? '-- NORMAL --' : ''
			}));
		},

		/**
		 * Update Vim status line
		 */
		updateVimStatus(status: string) {
			update(state => ({
				...state,
				vimStatusLine: status
			}));
		},

		/**
		 * Reset to default state
		 */
		reset() {
			set({
				pythonCode: DEFAULT_PYTHON_CODE,
				isExecuting: false,
				errorMessage: '',
				hasPlot: false,
				plotlyJson: null,
				isVimModeEnabled: false,
				vimStatusLine: ''
			});
		}
	};
}

// Create the store instance
export const customGraphStore = createCustomGraphStore();

// Derived stores for convenient access to specific state
export const pythonCode = derived(customGraphStore, $store => $store.pythonCode);
export const isExecuting = derived(customGraphStore, $store => $store.isExecuting);
export const errorMessage = derived(customGraphStore, $store => $store.errorMessage);
export const hasPlot = derived(customGraphStore, $store => $store.hasPlot);
export const plotlyJson = derived(customGraphStore, $store => $store.plotlyJson);
export const isVimModeEnabled = derived(customGraphStore, $store => $store.isVimModeEnabled);
export const vimStatusLine = derived(customGraphStore, $store => $store.vimStatusLine);

