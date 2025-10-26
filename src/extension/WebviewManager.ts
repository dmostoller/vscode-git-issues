import * as vscode from 'vscode';
import * as path from 'path';
import { GitHubService } from './GitHubService';
import { GitHubIssue, IssueWithComments, ToWebviewMessage, ToExtensionMessage } from './types';

export class WebviewManager {
	private static instance: WebviewManager | null = null;
	private panel: vscode.WebviewPanel | null = null;
	private currentIssue: IssueWithComments | null = null;

	private constructor(
		private context: vscode.ExtensionContext,
		private gitHubService: GitHubService
	) {}

	static getInstance(context: vscode.ExtensionContext, gitHubService: GitHubService): WebviewManager {
		if (!WebviewManager.instance) {
			WebviewManager.instance = new WebviewManager(context, gitHubService);
		}
		return WebviewManager.instance;
	}

	async showIssue(issue: GitHubIssue) {
		try {
			// Load full issue with comments
			const fullIssue = await this.gitHubService.getIssue(issue.number);
			this.currentIssue = fullIssue;

			if (this.panel) {
				// If panel exists, reveal and update
				this.panel.reveal(vscode.ViewColumn.One);
				this.postMessage({ command: 'loadIssue', issue: fullIssue });
			} else {
				// Create new panel
				this.createPanel();
				// Message will be sent after webview is ready
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to load issue: ${message}`);
		}
	}

	private createPanel() {
		this.panel = vscode.window.createWebviewPanel(
			'githubIssueDetail',
			`Issue #${this.currentIssue?.number || ''}`,
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [
					vscode.Uri.file(path.join(this.context.extensionPath, 'dist', 'webview'))
				]
			}
		);

		this.panel.webview.html = this.getWebviewContent();
		this.panel.webview.onDidReceiveMessage(
			(message: ToExtensionMessage) => this.handleWebviewMessage(message),
			undefined,
			this.context.subscriptions
		);

		// Handle panel disposal
		this.panel.onDidDispose(
			() => {
				this.panel = null;
				this.currentIssue = null;
			},
			null,
			this.context.subscriptions
		);

		// Send initial data once webview is ready
		if (this.currentIssue) {
			this.postMessage({ command: 'loadIssue', issue: this.currentIssue });
		}
	}

	private async handleWebviewMessage(message: ToExtensionMessage) {
		try {
			switch (message.command) {
				case 'addComment':
					const comment = await this.gitHubService.createComment(
						message.issueNumber,
						message.body
					);
					this.postMessage({ command: 'commentAdded', comment });
					vscode.window.showInformationMessage('Comment added successfully');
					break;

				case 'updateIssue':
					const updatedIssue = await this.gitHubService.updateIssue(
						message.issueNumber,
						message.updates
					);
					this.postMessage({ command: 'issueUpdated', issue: updatedIssue });
					vscode.window.showInformationMessage('Issue updated successfully');
					break;

				case 'closeIssue':
					await this.gitHubService.updateIssue(message.issueNumber, { state: 'closed' });
					const closedIssue = await this.gitHubService.getIssue(message.issueNumber);
					this.postMessage({ command: 'loadIssue', issue: closedIssue });
					vscode.window.showInformationMessage('Issue closed');
					break;

				case 'reopenIssue':
					await this.gitHubService.updateIssue(message.issueNumber, { state: 'open' });
					const reopenedIssue = await this.gitHubService.getIssue(message.issueNumber);
					this.postMessage({ command: 'loadIssue', issue: reopenedIssue });
					vscode.window.showInformationMessage('Issue reopened');
					break;

				case 'addLabel':
					await this.gitHubService.addLabel(message.issueNumber, message.label);
					vscode.window.showInformationMessage(`Label "${message.label}" added`);
					break;

				case 'removeLabel':
					await this.gitHubService.removeLabel(message.issueNumber, message.label);
					vscode.window.showInformationMessage(`Label "${message.label}" removed`);
					break;
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.postMessage({ command: 'error', message: errorMessage });
			vscode.window.showErrorMessage(errorMessage);
		}
	}

	private postMessage(message: ToWebviewMessage) {
		if (this.panel) {
			this.panel.webview.postMessage(message);
		}
	}

	private getWebviewContent(): string {
		if (!this.panel) {
			return '';
		}

		const webview = this.panel.webview;
		const distPath = path.join(this.context.extensionPath, 'dist', 'webview');

		const scriptUri = webview.asWebviewUri(
			vscode.Uri.file(path.join(distPath, 'webview.js'))
		);
		const styleUri = webview.asWebviewUri(
			vscode.Uri.file(path.join(distPath, 'webview.css'))
		);

		const nonce = getNonce();

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:;">
	<link href="${styleUri}" rel="stylesheet">
	<title>GitHub Issue</title>
</head>
<body>
	<div id="root"></div>
	<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
	}

	dispose() {
		if (this.panel) {
			this.panel.dispose();
		}
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
