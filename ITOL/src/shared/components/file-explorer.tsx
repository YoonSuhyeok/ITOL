import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface FileItem {
	id: string;
	name: string;
	type: "file" | "folder";
	children?: FileItem[];
	path: string;
}

interface FileExplorerProps {
	items: FileItem[];
	onFileClick: (item: FileItem) => void;
	selectedId?: string;
}

export function FileExplorer({ items, onFileClick, selectedId }: FileExplorerProps) {
	return (
		<div className="h-full overflow-y-auto bg-background border-r">
			<div className="p-2">
				<h3 className="text-sm font-semibold mb-2 px-2">Explorer</h3>
				<div className="space-y-1">
					{items.map((item) => (
						<FileTreeItem
							key={item.id}
							item={item}
							level={0}
							onFileClick={onFileClick}
							selectedId={selectedId}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

interface FileTreeItemProps {
	item: FileItem;
	level: number;
	onFileClick: (item: FileItem) => void;
	selectedId?: string;
}

function FileTreeItem({ item, level, onFileClick, selectedId }: FileTreeItemProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const isSelected = selectedId === item.id;

	const handleClick = () => {
		if (item.type === "folder") {
			setIsExpanded(!isExpanded);
		}
		onFileClick(item);
	};

	const paddingLeft = level * 16 + 8;

	return (
		<div>
			<button
				type="button"
				onClick={handleClick}
				className={cn(
					"w-full flex items-center gap-1 px-2 py-1 text-sm hover:bg-accent rounded-sm transition-colors",
					isSelected && "bg-accent"
				)}
				style={{ paddingLeft: `${paddingLeft}px` }}
			>
				{item.type === "folder" && (
					<span className="shrink-0">
						{isExpanded ? (
							<ChevronDown className="w-4 h-4" />
						) : (
							<ChevronRight className="w-4 h-4" />
						)}
					</span>
				)}
				{item.type === "file" && <span className="w-4" />}
				<span className="shrink-0">
					{item.type === "folder" ? (
						isExpanded ? (
							<FolderOpen className="w-4 h-4" />
						) : (
							<Folder className="w-4 h-4" />
						)
					) : (
						<File className="w-4 h-4" />
					)}
				</span>
				<span className="truncate">{item.name}</span>
			</button>
			{item.type === "folder" && isExpanded && item.children && (
				<div>
					{item.children.map((child) => (
						<FileTreeItem
							key={child.id}
							item={child}
							level={level + 1}
							onFileClick={onFileClick}
							selectedId={selectedId}
						/>
					))}
				</div>
			)}
		</div>
	);
}
