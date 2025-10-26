import { useCallback } from 'react';

declare global {
	interface Window {
		acquireVsCodeApi(): VSCodeAPI;
	}
}

interface VSCodeAPI {
	postMessage(message: any): void;
	getState(): any;
	setState(state: any): void;
}

let vscodeApi: VSCodeAPI | null = null;

function getVSCodeAPI(): VSCodeAPI {
	if (!vscodeApi) {
		vscodeApi = window.acquireVsCodeApi();
	}
	return vscodeApi;
}

export function useVSCodeAPI() {
	const postMessage = useCallback((message: any) => {
		getVSCodeAPI().postMessage(message);
	}, []);

	const onMessage = useCallback((handler: (event: MessageEvent) => void) => {
		window.addEventListener('message', handler);
		return () => window.removeEventListener('message', handler);
	}, []);

	return { postMessage, onMessage };
}
