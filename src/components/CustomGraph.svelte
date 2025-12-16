<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type * as Monaco from 'monaco-editor';
	import { 
		customGraphStore, 
		isExecuting, 
		errorMessage, 
		hasPlot, 
		plotlyJson,
		isVimModeEnabled,
		vimStatusLine
	} from '../stores/customGraphStore';

	type Props = {
		simulationData?: any; // Your simulation data type
	};

	let { simulationData }: Props = $props();

	// View-only state (not part of ViewModel)
	let editorContainer: HTMLDivElement;
	let plotContainer: HTMLDivElement;
	let monaco: typeof Monaco | null = null;
	let editor: Monaco.editor.IStandaloneCodeEditor | null = null;
	let Plotly: any = null;
	let vimMode: any = null;

	// Subscribe to ViewModel state
	const executing = $derived($isExecuting);
	const error = $derived($errorMessage);
	const plotVisible = $derived($hasPlot);
	const plotData = $derived($plotlyJson);
	const vimEnabled = $derived($isVimModeEnabled);
	const vimStatus = $derived($vimStatusLine);

	// Reactive effect: Render plot when plotData changes
	$effect(() => {
		if (plotData && Plotly && plotContainer) {
			renderPlot(plotData);
		}
	});

	onMount(async () => {
		if (!browser) return;

		try {
			// Import Monaco Editor
			monaco = await import('monaco-editor');
			
			// Import Plotly for rendering
			Plotly = await import('plotly.js-dist-min');

			// Configure Monaco for Python
			monaco.languages.registerCompletionItemProvider('python', {
				provideCompletionItems: (model, position) => {
					const suggestions = [
						{
							label: 'plotly.graph_objects',
							kind: monaco.languages.CompletionItemKind.Module,
							insertText: 'import plotly.graph_objects as go',
							documentation: 'Import Plotly graph objects'
						},
						{
							label: 'data',
							kind: monaco.languages.CompletionItemKind.Variable,
							insertText: 'data',
							documentation: 'Simulation data dictionary'
						},
						{
							label: 'fig',
							kind: monaco.languages.CompletionItemKind.Variable,
							insertText: 'fig',
							documentation: 'Plotly figure object'
						}
					];
					return { suggestions };
				}
			});

			// Get initial code from store
			let initialCode = '';
			const unsubscribe = customGraphStore.subscribe(state => {
				initialCode = state.pythonCode;
			});
			unsubscribe();

			// Create the editor with code from ViewModel
			editor = monaco.editor.create(editorContainer, {
				value: initialCode,
				language: 'python',
				theme: 'vs-dark',
				fontSize: 14,
				minimap: { enabled: false },
				automaticLayout: true,
				scrollBeyondLastLine: false,
				tabSize: 4,
				wordWrap: 'on',
				lineNumbers: 'on',
				folding: true,
				bracketPairColorization: {
					enabled: true
				}
			});

			// Listen to editor changes and sync to ViewModel
			editor.onDidChangeModelContent(() => {
				if (editor) {
					customGraphStore.updateCode(editor.getValue());
				}
			});

			// Add keyboard shortcut: Ctrl+Enter or Cmd+Enter to run
			editor.addCommand(
				monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
				() => {
					handleExecuteCustomPlot();
				}
			);

		} catch (error) {
			console.error('Failed to initialize Monaco Editor:', error);
		}
	});

	onDestroy(() => {
		// Clean up vim mode
		if (vimMode) {
			vimMode.dispose();
		}
		// Clean up editor
		if (editor) {
			editor.dispose();
		}
		// Clean up Plotly
		if (Plotly && plotContainer) {
			Plotly.purge(plotContainer);
		}
	});

	/**
	 * Delegate to ViewModel to execute the plot
	 * Rendering happens automatically via reactive effect
	 */
	async function handleExecuteCustomPlot() {
		await customGraphStore.executeCustomPlot('current_simulation');
	}

	/**
	 * Render plot from JSON data (View logic)
	 */
	function renderPlot(plotlyJsonString: string) {
		if (!Plotly || !plotContainer) return;

		try {
			const plotlyFigure = JSON.parse(plotlyJsonString);
			
			Plotly.newPlot(
				plotContainer,
				plotlyFigure.data,
				plotlyFigure.layout,
				{
					responsive: true,
					displayModeBar: true,
					displaylogo: false,
					modeBarButtonsToRemove: ['sendDataToCloud']
				}
			);
		} catch (error) {
			console.error('Failed to render plot:', error);
		}
	}

	/**
	 * Delegate to ViewModel to clear the plot
	 */
	function handleClearPlot() {
		customGraphStore.clearPlot();
		if (Plotly && plotContainer) {
			Plotly.purge(plotContainer);
		}
	}

	/**
	 * Toggle Vim mode (delegates to ViewModel for state, handles view-specific vim setup)
	 */
	async function handleToggleVimMode() {
		if (!editor) return;

		const currentVimState = vimEnabled;

		if (currentVimState) {
			// Disable vim mode
			if (vimMode) {
				vimMode.dispose();
				vimMode = null;
			}
			customGraphStore.toggleVimMode();
		} else {
			// Enable vim mode
			try {
				const { initVimMode } = await import('monaco-vim');
				vimMode = initVimMode(editor, document.getElementById('vim-status-line'));
				customGraphStore.toggleVimMode();
			} catch (error) {
				console.error('Failed to load vim mode:', error);
			}
		}
	}
</script>

<div class="custom-graph-container">
	<div class="plot-section">
		<div class="section-header">
			<h3>Plot Output</h3>
			{#if plotVisible}
				<button 
					onclick={handleClearPlot}
					class="clear-button"
					title="Clear plot"
				>
					🗑️ Clear Plot
				</button>
			{/if}
		</div>
		<div bind:this={plotContainer} class="plot-container">
			{#if !plotVisible}
				<div class="plot-placeholder">
					<div class="placeholder-content">
						<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path d="M21 21H4.6C4.03995 21 3.75992 21 3.54601 20.891C3.35785 20.7951 3.20487 20.6422 3.10899 20.454C3 20.2401 3 19.9601 3 19.4V3M7 14L12 9L16 13L21 8M21 8V12M21 8H17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						<p>View custom plots here</p>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<div class="editor-section">
		<div class="section-header">
			<h3>Python Code Editor</h3>
			<div class="editor-actions">
				<button 
					onclick={handleToggleVimMode}
					class="vim-button"
					class:vim-active={vimEnabled}
					title="Toggle Vim keybindings"
				>
					{vimEnabled ? '✓ Vim' : 'Vim'}
				</button>
				{#if executing}
					<span class="executing-indicator">
						<span class="spinner"></span>
						Executing...
					</span>
				{/if}
			</div>
		</div>

		<div bind:this={editorContainer} class="editor-container"></div>

		{#if vimEnabled}
			<div id="vim-status-line" class="vim-status-line"></div>
		{/if}

		{#if error}
			<div class="error-message">
				<strong>Error:</strong> {error}
			</div>
		{/if}
	</div>
</div>

<style>
	.custom-graph-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		flex: 1;
		min-height: 0;
		padding: 0;
		overflow: hidden;
		box-sizing: border-box;
	}

	.plot-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex: 55 1 300px;
		overflow: hidden;
	}

	.editor-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex: 45 1 250px;
		overflow: hidden;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background-color: rgba(30, 42, 53, 0.6);
		border-radius: 6px;
		border: 1px solid #34495e;
	}

	.section-header h3 {
		margin: 0;
		font-size: 1rem;
		color: #3498db;
		font-weight: 600;
	}

	.editor-actions {
		display: flex;
		gap: 0.5rem;
	}

	.vim-button,
	.run-button,
	.clear-button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.vim-button {
		background-color: #34495e;
		color: #ecf0f1;
		border: 1px solid #7f8c8d;
	}

	.vim-button:hover {
		background-color: #4a5f7f;
		border-color: #95a5a6;
	}

	.vim-button.vim-active {
		background-color: #9b59b6;
		border-color: #8e44ad;
		color: white;
	}

	.vim-button.vim-active:hover {
		background-color: #8e44ad;
	}

	.executing-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background-color: rgba(39, 174, 96, 0.2);
		border: 1px solid #27ae60;
		border-radius: 4px;
		color: #27ae60;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.clear-button {
		background-color: #e74c3c;
		color: white;
	}

	.clear-button:hover {
		background-color: #c0392b;
	}

	.spinner {
		width: 12px;
		height: 12px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.editor-container {
		flex: 1;
		min-height: 150px;
		border: 1px solid #34495e;
		border-radius: 6px;
		overflow: hidden;
		background-color: #1e1e1e;
	}

	.vim-status-line {
		padding: 0.4rem 0.75rem;
		background-color: #1e1e1e;
		border: 1px solid #34495e;
		border-radius: 4px;
		color: #9b59b6;
		font-size: 0.8rem;
		font-family: 'Fira Code', monospace;
		min-height: 24px;
	}

	.error-message {
		padding: 0.75rem 1rem;
		background-color: rgba(231, 76, 60, 0.2);
		border: 1px solid #e74c3c;
		border-radius: 4px;
		color: #e74c3c;
		font-size: 0.85rem;
	}

	.error-message strong {
		font-weight: 600;
	}

	.plot-container {
		flex: 1;
		min-height: 200px;
		background-color: #2c3e50;
		border: 1px solid #34495e;
		border-radius: 6px;
		overflow: auto;
		position: relative;
	}

	.plot-placeholder {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.placeholder-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		color: #7f8c8d;
		text-align: center;
		padding: 2rem;
	}

	.placeholder-content svg {
		opacity: 0.5;
	}

	.placeholder-content p {
		font-size: 0.95rem;
		max-width: 300px;
		margin: 0;
	}

	.hint {
		font-size: 0.8rem;
		color: #95a5a6;
		font-style: italic;
	}

	/* Custom scrollbar */
	.plot-container::-webkit-scrollbar {
		width: 12px;
		height: 12px;
	}

	.plot-container::-webkit-scrollbar-track {
		background-color: #1e2a35;
		border-radius: 6px;
	}

	.plot-container::-webkit-scrollbar-thumb {
		background-color: #34495e;
		border-radius: 6px;
		border: 2px solid #1e2a35;
	}

	.plot-container::-webkit-scrollbar-thumb:hover {
		background-color: #3498db;
	}
</style>

