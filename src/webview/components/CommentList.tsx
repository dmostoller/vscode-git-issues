import { CardContent } from "../../components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../../components/ui/avatar";
import { Separator } from "../../components/ui/separator";
import { formatDate } from "../../lib/utils";

interface Comment {
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

interface CommentListProps {
	comments: Comment[];
}

export function CommentList({ comments }: CommentListProps) {
	if (comments.length === 0) {
		return null;
	}

	return (
		<CardContent className="space-y-4">
			<Separator />
			<div className="space-y-6">
				<h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
				{comments.map((comment) => (
					<div key={comment.id} className="flex gap-4">
						<Avatar>
							<AvatarImage src={comment.user?.avatar_url} alt={comment.user?.login || 'User'} />
							<AvatarFallback>{comment.user?.login?.[0]?.toUpperCase() || '?'}</AvatarFallback>
						</Avatar>
						<div className="flex-1 min-w-0 space-y-2">
							<div className="flex items-center gap-2 text-sm">
								<span className="font-medium">{comment.user?.login || 'Unknown'}</span>
								<span className="text-muted-foreground">commented {formatDate(comment.created_at)}</span>
							</div>
							<div className="github-markdown-body text-sm rounded-md border bg-muted/50 p-4">
								{comment.body_html ? (
									<div dangerouslySetInnerHTML={{ __html: comment.body_html }} />
								) : (
									<div className="whitespace-pre-wrap break-words">{comment.body}</div>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</CardContent>
	);
}
