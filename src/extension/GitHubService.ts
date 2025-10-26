import { Octokit } from '@octokit/rest';
import * as vscode from 'vscode';
import { GitHubIssue, GitHubComment, IssueWithComments } from './types';

export class GitHubService {
	private octokit: Octokit | null = null;
	private outputChannel: vscode.OutputChannel;

	constructor(private readonly context: vscode.ExtensionContext) {
		this.outputChannel = vscode.window.createOutputChannel('GitHub Issues');
	}

	setToken(token: string) {
		this.octokit = new Octokit({ auth: token });
	}

	private ensureClient(): Octokit {
		if (!this.octokit) {
			throw new Error('GitHub client not initialized. Please sign in first.');
		}
		return this.octokit;
	}

	private getRepoConfig(): { owner: string; repo: string } | null {
		const config = vscode.workspace.getConfiguration('githubIssues');
		const owner = config.get<string>('owner');
		const repo = config.get<string>('repo');

		if (!owner || !repo) {
			return null;
		}

		return { owner, repo };
	}

	async listIssues(state: 'open' | 'closed' | 'all' = 'all'): Promise<GitHubIssue[]> {
		const client = this.ensureClient();
		const repoConfig = this.getRepoConfig();

		if (!repoConfig) {
			throw new Error('Repository not configured. Please run "GitHub Issues: Configure Repository"');
		}

		try {
			this.outputChannel.appendLine(`Fetching ${state} issues for ${repoConfig.owner}/${repoConfig.repo}...`);

			const { data } = await client.issues.listForRepo({
				owner: repoConfig.owner,
				repo: repoConfig.repo,
				state,
				per_page: 100,
			});

			this.outputChannel.appendLine(`Fetched ${data.length} issues`);
			return data as GitHubIssue[];
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.outputChannel.appendLine(`Error fetching issues: ${message}`);
			throw new Error(`Failed to fetch issues: ${message}`);
		}
	}

	async getIssue(issueNumber: number): Promise<IssueWithComments> {
		const client = this.ensureClient();
		const repoConfig = this.getRepoConfig();

		if (!repoConfig) {
			throw new Error('Repository not configured');
		}

		try {
			this.outputChannel.appendLine(`Fetching issue #${issueNumber}...`);

			const [issueResponse, commentsResponse] = await Promise.all([
				client.issues.get({
					owner: repoConfig.owner,
					repo: repoConfig.repo,
					issue_number: issueNumber,
				}),
				client.issues.listComments({
					owner: repoConfig.owner,
					repo: repoConfig.repo,
					issue_number: issueNumber,
				}),
			]);

			const issue = issueResponse.data as GitHubIssue;
			const comments = commentsResponse.data as GitHubComment[];

			return {
				...issue,
				comment_list: comments,
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.outputChannel.appendLine(`Error fetching issue: ${message}`);
			throw new Error(`Failed to fetch issue: ${message}`);
		}
	}

	async createComment(issueNumber: number, body: string): Promise<GitHubComment> {
		const client = this.ensureClient();
		const repoConfig = this.getRepoConfig();

		if (!repoConfig) {
			throw new Error('Repository not configured');
		}

		try {
			this.outputChannel.appendLine(`Creating comment on issue #${issueNumber}...`);

			const { data } = await client.issues.createComment({
				owner: repoConfig.owner,
				repo: repoConfig.repo,
				issue_number: issueNumber,
				body,
			});

			this.outputChannel.appendLine(`Comment created successfully`);
			return data as GitHubComment;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.outputChannel.appendLine(`Error creating comment: ${message}`);
			throw new Error(`Failed to create comment: ${message}`);
		}
	}

	async updateIssue(
		issueNumber: number,
		updates: { title?: string; body?: string; state?: 'open' | 'closed' }
	): Promise<GitHubIssue> {
		const client = this.ensureClient();
		const repoConfig = this.getRepoConfig();

		if (!repoConfig) {
			throw new Error('Repository not configured');
		}

		try {
			this.outputChannel.appendLine(`Updating issue #${issueNumber}...`);

			const { data } = await client.issues.update({
				owner: repoConfig.owner,
				repo: repoConfig.repo,
				issue_number: issueNumber,
				...updates,
			});

			this.outputChannel.appendLine(`Issue updated successfully`);
			return data as GitHubIssue;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.outputChannel.appendLine(`Error updating issue: ${message}`);
			throw new Error(`Failed to update issue: ${message}`);
		}
	}

	async createIssue(title: string, body: string): Promise<GitHubIssue> {
		const client = this.ensureClient();
		const repoConfig = this.getRepoConfig();

		if (!repoConfig) {
			throw new Error('Repository not configured');
		}

		try {
			this.outputChannel.appendLine(`Creating new issue...`);

			const { data } = await client.issues.create({
				owner: repoConfig.owner,
				repo: repoConfig.repo,
				title,
				body,
			});

			this.outputChannel.appendLine(`Issue #${data.number} created successfully`);
			return data as GitHubIssue;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.outputChannel.appendLine(`Error creating issue: ${message}`);
			throw new Error(`Failed to create issue: ${message}`);
		}
	}

	async addLabel(issueNumber: number, label: string): Promise<void> {
		const client = this.ensureClient();
		const repoConfig = this.getRepoConfig();

		if (!repoConfig) {
			throw new Error('Repository not configured');
		}

		await client.issues.addLabels({
			owner: repoConfig.owner,
			repo: repoConfig.repo,
			issue_number: issueNumber,
			labels: [label],
		});
	}

	async removeLabel(issueNumber: number, label: string): Promise<void> {
		const client = this.ensureClient();
		const repoConfig = this.getRepoConfig();

		if (!repoConfig) {
			throw new Error('Repository not configured');
		}

		await client.issues.removeLabel({
			owner: repoConfig.owner,
			repo: repoConfig.repo,
			issue_number: issueNumber,
			name: label,
		});
	}

	dispose() {
		this.outputChannel.dispose();
	}
}
