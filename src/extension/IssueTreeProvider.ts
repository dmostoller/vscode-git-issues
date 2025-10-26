import * as vscode from 'vscode';
import { GitHubService } from './GitHubService';
import { GitHubIssue, IssueTreeItem, GroupTreeItem } from './types';

export class IssueTreeProvider implements vscode.TreeDataProvider<IssueTreeItem | GroupTreeItem> {
	private _onDidChangeTreeData = new vscode.EventEmitter<IssueTreeItem | GroupTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	private issues: GitHubIssue[] = [];

	constructor(private gitHubService: GitHubService) {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	async loadIssues(): Promise<void> {
		try {
			this.issues = await this.gitHubService.listIssues('all');
			this.refresh();
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to load issues: ${message}`);
			this.issues = [];
			this.refresh();
		}
	}

	getTreeItem(element: IssueTreeItem | GroupTreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: IssueTreeItem | GroupTreeItem): Promise<(IssueTreeItem | GroupTreeItem)[]> {
		if (!element) {
			// Root level - show groups
			const openIssues = this.issues.filter(i => i.state === 'open');
			const closedIssues = this.issues.filter(i => i.state === 'closed');

			const groups: GroupTreeItem[] = [];

			if (openIssues.length > 0) {
				const group = new GroupTreeItem(
					`Open (${openIssues.length})`,
					vscode.TreeItemCollapsibleState.Expanded
				);
				(group as any).issues = openIssues;
				(group as any).state = 'open';
				groups.push(group);
			}

			if (closedIssues.length > 0) {
				const group = new GroupTreeItem(
					`Closed (${closedIssues.length})`,
					vscode.TreeItemCollapsibleState.Collapsed
				);
				(group as any).issues = closedIssues;
				(group as any).state = 'closed';
				groups.push(group);
			}

			if (groups.length === 0) {
				// No issues, show a message
				return [];
			}

			return groups;
		} else if (element instanceof GroupTreeItem) {
			// Group element - show issues
			const issues = (element as any).issues as GitHubIssue[];
			return issues.map(issue => new IssueTreeItem(issue, vscode.TreeItemCollapsibleState.None));
		}

		return [];
	}
}
