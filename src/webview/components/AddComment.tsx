import { useState } from "react";
import { CardContent } from "../../components/ui/card";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";

interface AddCommentProps {
	onAddComment: (body: string) => void;
}

export function AddComment({ onAddComment }: AddCommentProps) {
	const [comment, setComment] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (!comment.trim()) {
			return;
		}

		setIsSubmitting(true);
		try {
			await onAddComment(comment);
			setComment('');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<CardContent className="space-y-4">
			<Separator />
			<div className="space-y-4">
				<h3 className="text-lg font-semibold">Add a comment</h3>
				<Textarea
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					placeholder="Leave a comment..."
					rows={4}
					disabled={isSubmitting}
				/>
				<Button
					onClick={handleSubmit}
					disabled={!comment.trim() || isSubmitting}
				>
					{isSubmitting ? 'Adding...' : 'Add Comment'}
				</Button>
			</div>
		</CardContent>
	);
}
