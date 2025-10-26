import { CardContent } from "../../components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../../components/ui/avatar";

interface IssueBodyProps {
	body: string | null;
	body_html?: string;
	user: {
		login: string;
		avatar_url: string;
	} | null;
}

export function IssueBody({ body, body_html, user }: IssueBodyProps) {
	if (!body && !body_html) {
		return null;
	}

	return (
		<CardContent>
			<div className="flex gap-4">
				<Avatar>
					<AvatarImage src={user?.avatar_url} alt={user?.login || 'User'} />
					<AvatarFallback>{user?.login?.[0]?.toUpperCase() || '?'}</AvatarFallback>
				</Avatar>
				<div className="flex-1 min-w-0 space-y-2">
					<div className="text-sm font-medium">{user?.login || 'Unknown'}</div>
					<div className="github-markdown-body text-sm rounded-md border bg-muted/50 p-4">
						{body_html ? (
							<div dangerouslySetInnerHTML={{ __html: body_html }} />
						) : (
							<div className="whitespace-pre-wrap break-words">{body}</div>
						)}
					</div>
				</div>
			</div>
		</CardContent>
	);
}
