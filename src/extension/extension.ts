import * as vscode from 'vscode';
import { AuthManager } from './AuthManager';
import { GitHubService } from './GitHubService';
import { IssueTreeProvider } from './IssueTreeProvider';
import { WebviewManager } from './WebviewManager';
import { GitHubIssue } from './types';

export function activate(context: vscode.ExtensionContext) {
	console.log('GitHub Issues extension activated');

	// Initialize services
	const authManager = new AuthManager(context);
	const gitHubService = new GitHubService(context);
	const issueTreeProvider = new IssueTreeProvider(gitHubService);
	const webviewManager = WebviewManager.getInstance(context, gitHubService);

	// Register tree view
	const treeView = vscode.window.createTreeView('githubIssuesExplorer', {
		treeDataProvider: issueTreeProvider,
		showCollapseAll: true
	});

	// Register commands
	const signInCommand = vscode.commands.registerCommand('github-issues.signIn', async () => {
		const token = await authManager.promptForToken();
		if (token) {
			gitHubService.setToken(token);
			// Auto-load issues after sign in if repo is configured
			const config = vscode.workspace.getConfiguration('githubIssues');
			if (config.get('owner') && config.get('repo')) {
				await issueTreeProvider.loadIssues();
			}
		}
	});

	const configureRepoCommand = vscode.commands.registerCommand('github-issues.configureRepository', async () => {
		const owner = await vscode.window.showInputBox({
			prompt: 'Enter repository owner (username or organization)',
			placeHolder: 'e.g., microsoft',
			ignoreFocusOut: true,
		});

		if (!owner) {
			return;
		}

		const repo = await vscode.window.showInputBox({
			prompt: 'Enter repository name',
			placeHolder: 'e.g., vscode',
			ignoreFocusOut: true,
		});

		if (!repo) {
			return;
		}

		const config = vscode.workspace.getConfiguration('githubIssues');
		await config.update('owner', owner, vscode.ConfigurationTarget.Global);
		await config.update('repo', repo, vscode.ConfigurationTarget.Global);

		vscode.window.showInformationMessage(`Repository set to ${owner}/${repo}`);

		// Auto-load issues if authenticated
		const token = await authManager.getToken();
		if (token) {
			gitHubService.setToken(token);
			await issueTreeProvider.loadIssues();
		} else {
			const signIn = await vscode.window.showInformationMessage(
				'Sign in to GitHub to view issues',
				'Sign In'
			);
			if (signIn === 'Sign In') {
				vscode.commands.executeCommand('github-issues.signIn');
			}
		}
	});

	const refreshIssuesCommand = vscode.commands.registerCommand('github-issues.refreshIssues', async () => {
		const token = await authManager.ensureToken();
		if (!token) {
			return;
		}

		gitHubService.setToken(token);
		await issueTreeProvider.loadIssues();
		vscode.window.showInformationMessage('Issues refreshed');
	});

	const openIssueCommand = vscode.commands.registerCommand('github-issues.openIssue', async (issue: GitHubIssue) => {
		await webviewManager.showIssue(issue);
	});

	const createIssueCommand = vscode.commands.registerCommand('github-issues.createIssue', async () => {
		const token = await authManager.ensureToken();
		if (!token) {
			return;
		}

		gitHubService.setToken(token);

		const title = await vscode.window.showInputBox({
			prompt: 'Enter issue title',
			placeHolder: 'Issue title',
			ignoreFocusOut: true,
		});

		if (!title) {
			return;
		}

		const body = await vscode.window.showInputBox({
			prompt: 'Enter issue description (optional)',
			placeHolder: 'Issue description',
			ignoreFocusOut: true,
		});

		try {
			const issue = await gitHubService.createIssue(title, body || '');
			vscode.window.showInformationMessage(`Issue #${issue.number} created successfully`);
			await issueTreeProvider.loadIssues();
			await webviewManager.showIssue(issue);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to create issue: ${message}`);
		}
	});

	// Register all disposables
	context.subscriptions.push(
		treeView,
		signInCommand,
		configureRepoCommand,
		refreshIssuesCommand,
		openIssueCommand,
		createIssueCommand,
		gitHubService,
		{ dispose: () => webviewManager.dispose() }
	);

	// Auto-initialize if token and repo are configured
	initializeExtension(authManager, gitHubService, issueTreeProvider);
}

async function initializeExtension(
	authManager: AuthManager,
	gitHubService: GitHubService,
	issueTreeProvider: IssueTreeProvider
) {
	const token = await authManager.getToken();
	const config = vscode.workspace.getConfiguration('githubIssues');
	const owner = config.get<string>('owner');
	const repo = config.get<string>('repo');

	if (token && owner && repo) {
		gitHubService.setToken(token);
		await issueTreeProvider.loadIssues();
	}
}

export function deactivate() {
	console.log('GitHub Issues extension deactivated');
}
