import * as vscode from 'vscode';

export class AuthManager {
	private static readonly TOKEN_KEY = 'github-token';

	constructor(private context: vscode.ExtensionContext) {}

	async getToken(): Promise<string | undefined> {
		return await this.context.secrets.get(AuthManager.TOKEN_KEY);
	}

	async setToken(token: string): Promise<void> {
		await this.context.secrets.store(AuthManager.TOKEN_KEY, token);
	}

	async clearToken(): Promise<void> {
		await this.context.secrets.delete(AuthManager.TOKEN_KEY);
	}

	async promptForToken(): Promise<string | undefined> {
		const token = await vscode.window.showInputBox({
			prompt: 'Enter your GitHub Personal Access Token',
			password: true,
			placeHolder: 'ghp_...',
			ignoreFocusOut: true,
			validateInput: (value) => {
				if (!value || value.trim().length === 0) {
					return 'Token cannot be empty';
				}
				if (!value.startsWith('ghp_') && !value.startsWith('github_pat_')) {
					return 'Invalid token format. Should start with ghp_ or github_pat_';
				}
				return null;
			}
		});

		if (token) {
			await this.setToken(token);
			vscode.window.showInformationMessage('GitHub token saved successfully');
			return token;
		}

		return undefined;
	}

	async ensureToken(): Promise<string | undefined> {
		let token = await this.getToken();

		if (!token) {
			const selection = await vscode.window.showInformationMessage(
				'GitHub authentication required. Please sign in with your Personal Access Token.',
				'Sign In',
				'Cancel'
			);

			if (selection === 'Sign In') {
				token = await this.promptForToken();
			}
		}

		return token;
	}
}
