import { CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface IssueBodyProps {
	body: string | null;
	user: {
		login: string;
		avatar_url: string;
	} | null;
}

export function IssueBody({ body, user }: IssueBodyProps) {
	if (!body) {
		return null;
	}

	return (
		<CardContent>
			<div className="flex gap-4">
				<Avatar>
					<AvatarImage src={user?.avatar_url} alt={user?.login || 'User'} />
					<AvatarFallback>{user?.login?.[0]?.toUpperCase() || '?'}</AvatarFallback>
				</Avatar>
				<div className="flex-1 space-y-2">
					<div className="text-sm font-medium">{user?.login || 'Unknown'}</div>
					<div className="text-sm whitespace-pre-wrap rounded-md border bg-muted/50 p-4">
						{body}
					</div>
				</div>
			</div>
		</CardContent>
	);
}
