import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface IssueHeaderProps {
	number: number;
	title: string;
	state: 'open' | 'closed';
	user: {
		login: string;
		avatar_url: string;
	} | null;
	created_at: string;
	labels: Array<{ name: string; color: string }>;
	onClose: () => void;
	onReopen: () => void;
}

export function IssueHeader({ number, title, state, user, created_at, labels, onClose, onReopen }: IssueHeaderProps) {
	return (
		<CardHeader>
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1 space-y-2">
					<CardTitle className="text-xl">#{number}: {title}</CardTitle>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Badge variant={state === 'open' ? 'default' : 'secondary'}>
							{state === 'open' ? 'Open' : 'Closed'}
						</Badge>
						<span>
							{user?.login || 'Unknown'} opened this issue {formatDate(created_at)}
						</span>
					</div>
					{labels.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{labels.map((label) => (
								<Badge
									key={label.name}
									variant="outline"
									style={{ backgroundColor: `#${label.color}20` }}
								>
									{label.name}
								</Badge>
							))}
						</div>
					)}
				</div>
				<div className="flex gap-2">
					{state === 'open' ? (
						<Button variant="outline" size="sm" onClick={onClose}>
							Close Issue
						</Button>
					) : (
						<Button variant="outline" size="sm" onClick={onReopen}>
							Reopen Issue
						</Button>
					)}
				</div>
			</div>
		</CardHeader>
	);
}
