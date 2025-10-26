import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMins < 1) {
		return 'just now';
	} else if (diffMins < 60) {
		return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
	} else if (diffHours < 24) {
		return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
	} else if (diffDays < 30) {
		return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
	} else {
		return date.toLocaleDateString();
	}
}
