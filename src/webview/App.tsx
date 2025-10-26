import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { IssueHeader } from '@/webview/components/IssueHeader';
import { IssueBody } from '@/webview/components/IssueBody';
import { CommentList } from '@/webview/components/CommentList';
import { AddComment } from '@/webview/components/AddComment';
import { useVSCodeAPI } from '@/webview/hooks/useVSCodeAPI';

interface Issue {
	number: number;
	title: string;
	body: string | null;
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
	comment_list: Comment[];
}

interface Comment {
	id: number;
	user: {
		login: string;
		avatar_url: string;
	} | null;
	body: string;
	created_at: string;
	updated_at: string;
}

function App() {
	const [issue, setIssue] = useState<Issue | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { postMessage, onMessage } = useVSCodeAPI();

	useEffect(() => {
		const cleanup = onMessage((event) => {
			const message = event.data;

			switch (message.command) {
				case 'loadIssue':
					setIssue(message.issue);
					setLoading(false);
					setError(null);
					break;

				case 'commentAdded':
					if (issue) {
						setIssue({
							...issue,
							comment_list: [...issue.comment_list, message.comment],
							comments: issue.comments + 1
						});
					}
					break;

				case 'issueUpdated':
					if (issue) {
						setIssue({
							...issue,
							...message.issue,
						});
					}
					break;

				case 'error':
					setError(message.message);
					break;
			}
		});

		return cleanup;
	}, [onMessage, issue]);

	const handleAddComment = (body: string) => {
		if (!issue) return;
		postMessage({
			command: 'addComment',
			issueNumber: issue.number,
			body
		});
	};

	const handleClose = () => {
		if (!issue) return;
		postMessage({
			command: 'closeIssue',
			issueNumber: issue.number
		});
	};

	const handleReopen = () => {
		if (!issue) return;
		postMessage({
			command: 'reopenIssue',
			issueNumber: issue.number
		});
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen p-8">
				<div className="text-muted-foreground">Loading issue...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen p-8">
				<div className="text-destructive">Error: {error}</div>
			</div>
		);
	}

	if (!issue) {
		return (
			<div className="flex items-center justify-center min-h-screen p-8">
				<div className="text-muted-foreground">No issue selected</div>
			</div>
		);
	}

	return (
		<div className="container max-w-4xl mx-auto p-8">
			<Card>
				<IssueHeader
					number={issue.number}
					title={issue.title}
					state={issue.state}
					user={issue.user}
					created_at={issue.created_at}
					labels={issue.labels}
					onClose={handleClose}
					onReopen={handleReopen}
				/>
				<IssueBody body={issue.body} user={issue.user} />
				<CommentList comments={issue.comment_list} />
				<AddComment onAddComment={handleAddComment} />
			</Card>
		</div>
	);
}

export default App;
