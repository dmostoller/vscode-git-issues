import * as vscode from 'vscode';

export interface GitHubIssue {
	number: number;
	title: string;
	body: string | null;
	body_html?: string;
	state: 'open' | 'closed';
	user: {
		login: string;
		avatar_url: string;
	} | null;
	assignee: {
		login: string;
		avatar_url: string;
	} | null;
	labels: Array<{
		name: string;
		color: string;
	}>;
	created_at: string;
	updated_at: string;
	comments: number;
	html_url: string;
}

export interface GitHubComment {
	id: number;
	user: {
		login: string;
		avatar_url: string;
	} | null;
	body: string;
	body_html?: string;
	created_at: string;
	updated_at: string;
}

export interface IssueWithComments extends GitHubIssue {
	comment_list: GitHubComment[];
}

// Message types for extension <-> webview communication
export type ToWebviewMessage =
	| { command: 'loadIssue'; issue: IssueWithComments }
	| { command: 'commentAdded'; comment: GitHubComment }
	| { command: 'issueUpdated'; issue: GitHubIssue }
	| { command: 'error'; message: string };

export type ToExtensionMessage =
	| { command: 'addComment'; issueNumber: number; body: string }
	| { command: 'updateIssue'; issueNumber: number; updates: { title?: string; body?: string } }
	| { command: 'closeIssue'; issueNumber: number }
	| { command: 'reopenIssue'; issueNumber: number }
	| { command: 'addLabel'; issueNumber: number; label: string }
	| { command: 'removeLabel'; issueNumber: number; label: string };

// Tree view item
export class IssueTreeItem extends vscode.TreeItem {
	constructor(
		public readonly issue: GitHubIssue,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super(`#${issue.number}: ${issue.title}`, collapsibleState);
		this.tooltip = issue.body || issue.title;
		this.description = issue.assignee?.login || '';
		this.contextValue = 'issue';
		this.command = {
			command: 'github-issues.openIssue',
			title: 'Open Issue',
			arguments: [issue]
		};
		this.iconPath = new vscode.ThemeIcon(
			issue.state === 'open' ? 'issues' : 'issue-closed'
		);
	}
}

export class GroupTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super(label, collapsibleState);
		this.contextValue = 'group';
	}
}
