import { useState, useCallback, useEffect } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, FilePlus, Trash2, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/shared/lib/utils";

// Global drag data
declare global {
	interface Window {
		__dragData: { id: string; type: string } | null;
	}
}

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
	onCreateBook?: () => void;
	onCreatePage?: (bookId: number) => void;
	onCreateRootPage?: () => void;
	onMoveItem?: (draggedId: string, targetId: string, position: "before" | "after" | "inside") => void;
	onDeleteBook?: (bookId: number) => void;
	onDeletePage?: (pageId: number) => void;
	collapsed?: boolean;
	onToggleCollapse?: () => void;
}

export function FileExplorer({ items, onFileClick, selectedId, onCreateBook, onCreatePage, onCreateRootPage, onMoveItem, onDeleteBook, onDeletePage, collapsed, onToggleCollapse }: FileExplorerProps) {
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

	const toggleExpanded = useCallback((id: string) => {
		setExpandedIds(prev => {
			const newSet = new Set(prev);
			if (newSet.has(id)) {
				newSet.delete(id);
			} else {
				newSet.add(id);
			}
			return newSet;
		});
	}, []);

	// Collapsed view - icon only sidebar
	if (collapsed) {
		return (
			<div className="h-full bg-background border-r flex flex-col items-center py-2 w-12">
				<button
					type="button"
					onClick={onToggleCollapse}
					className="p-2 hover:bg-accent rounded transition-colors mb-2"
					title="Expand Explorer"
				>
					<PanelLeft className="w-5 h-5" />
				</button>
				<div className="w-8 h-px bg-border mb-2" />
				{items.slice(0, 5).map((item) => (
					<button
						key={item.id}
						type="button"
						onClick={() => {
							if (item.type === "file") {
								onFileClick(item);
							} else {
								onToggleCollapse?.();
							}
						}}
						className={cn(
							"p-2 hover:bg-accent rounded transition-colors mb-1",
							selectedId === item.id && "bg-accent"
						)}
						title={item.name}
					>
						{item.type === "folder" ? (
							<Folder className="w-4 h-4" />
						) : (
							<File className="w-4 h-4" />
						)}
					</button>
				))}
				{items.length > 5 && (
					<span className="text-xs text-muted-foreground mt-1">+{items.length - 5}</span>
				)}
			</div>
		);
	}

	return (
		<div className="h-full overflow-y-auto bg-background border-r">
			<div className="p-2">
				<div className="flex items-center justify-between mb-2 px-2">
					<div className="flex items-center gap-1">
						{onToggleCollapse && (
							<button
								type="button"
								onClick={onToggleCollapse}
								className="p-1 hover:bg-accent rounded transition-colors"
									aria-label="Collapse explorer"
									title="Collapse explorer"
								>
									<PanelLeftClose className="w-4 h-4" />
								</button>
							)}
							<h3 className="text-sm font-semibold">Explorer</h3>
						</div>
						<div className="flex gap-1">
							{onCreateRootPage && (
								<button
									type="button"
									onClick={onCreateRootPage}
									className="p-1 hover:bg-accent rounded transition-colors"
									aria-label="Create new page"
									title="Create new page"
								>
									<FilePlus className="w-4 h-4" />
								</button>
							)}
							{onCreateBook && (
								<button
									type="button"
									onClick={onCreateBook}
									className="p-1 hover:bg-accent rounded transition-colors"
									aria-label="Create new folder"
									title="Create new folder"
								>
									<Plus className="w-4 h-4" />
								</button>
							)}
						</div>
					</div>
					<div className="space-y-1">
						{items.map((item) => (
							<FileTreeItem
								key={item.id}
								item={item}
								level={0}
								onFileClick={onFileClick}
								selectedId={selectedId}
								onCreatePage={onCreatePage}
								onMoveItem={onMoveItem}
								onDeleteBook={onDeleteBook}
								onDeletePage={onDeletePage}
								isExpanded={expandedIds.has(item.id)}
								onToggleExpanded={toggleExpanded}
								expandedIds={expandedIds}
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
	onCreatePage?: (bookId: number) => void;
	onMoveItem?: (draggedId: string, targetId: string, position: "before" | "after" | "inside") => void;
	onDeleteBook?: (bookId: number) => void;
	onDeletePage?: (pageId: number) => void;
	isExpanded: boolean;
	onToggleExpanded: (id: string) => void;
	expandedIds: Set<string>;
}

function FileTreeItem({ item, level, onFileClick, selectedId, onCreatePage, onMoveItem, onDeleteBook, onDeletePage, isExpanded, onToggleExpanded, expandedIds }: FileTreeItemProps) {
	const isSelected = selectedId === item.id;
	const isFolder = item.type === "folder";
	const [dropPosition, setDropPosition] = useState<"before" | "after" | "inside" | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	// Mouse-based drag and drop
	const handleMouseDown = (e: React.MouseEvent) => {
		// Only left click
		if (e.button !== 0) return;
		
		// Don't start drag on buttons
		if ((e.target as HTMLElement).closest('button')) return;
		
		setIsDragging(true);
		
		// Store drag data globally
		window.__dragData = { id: item.id, type: isFolder ? "book" : "page" };
		
		e.preventDefault();
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		// Check if anything is being dragged globally
		if (!window.__dragData) return;
		
		// Don't process if dragging self
		if (window.__dragData.id === item.id) return;
		
		e.stopPropagation(); // Prevent parent from also handling
		
		// Compute drop position
		const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
		const hoverClientY = e.clientY - rect.top;
		const hoverHeight = rect.height;
		
		let newPosition: "before" | "after" | "inside";
		if (isFolder && hoverClientY > hoverHeight * 0.3 && hoverClientY < hoverHeight * 0.7) {
			newPosition = "inside";
		} else if (hoverClientY < hoverHeight / 2) {
			newPosition = "before";
		} else {
			newPosition = "after";
		}
		
		setDropPosition(newPosition);
	};

	const handleMouseLeave = () => {
		if (!window.__dragData) return;
		setDropPosition(null);
	};

	const handleMouseUp = (e: React.MouseEvent) => {
		if (!window.__dragData) return;
		if (window.__dragData.id === item.id) return;
		
		e.stopPropagation(); // Prevent parent from also handling
		
		// Only process if we have a valid drop position
		if (onMoveItem && dropPosition) {
			// Clear drag data immediately to prevent duplicate calls
			const dragData = window.__dragData;
			window.__dragData = null;
			
			onMoveItem(dragData.id, item.id, dropPosition);
		}
		
		setDropPosition(null);
	};

	// Global mouse up to end drag
	useEffect(() => {
		const handleGlobalMouseUp = () => {
			setIsDragging(false);
			window.__dragData = null;
		};
		
		window.addEventListener('mouseup', handleGlobalMouseUp);
		return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
	}, []);

	const handleClick = () => {
		if (isFolder) {
			onToggleExpanded(item.id);
		}
		onFileClick(item);
	};

	const handleDoubleClick = () => {
		if (isFolder && item.id.startsWith("book-") && onCreatePage) {
			const bookId = Number.parseInt(item.id.replace("book-", ""));
			onCreatePage(bookId);
		}
	};

	const handleAddPage = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (isFolder && item.id.startsWith("book-") && onCreatePage) {
			const bookId = Number.parseInt(item.id.replace("book-", ""));
			onCreatePage(bookId);
		}
	};

	const handleDelete = async (e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();
		
		if (isFolder && item.id.startsWith("book-") && onDeleteBook) {
			const bookId = Number.parseInt(item.id.replace("book-", ""));
			onDeleteBook(bookId);
		} else if (!isFolder && item.id.startsWith("page-") && onDeletePage) {
			const pageId = Number.parseInt(item.id.replace("page-", ""));
			onDeletePage(pageId);
		}
	};

	const paddingLeft = level * 16 + 8;

	return (
		<div className="group relative">
			<div
				id={`file-item-${item.id}`}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
				onMouseUp={handleMouseUp}
				onClick={handleClick}
				onDoubleClick={handleDoubleClick}
				className={cn(
					"w-full flex items-center gap-1 px-2 py-1 text-sm rounded-sm transition-colors relative cursor-move select-none",
					isSelected && "bg-accent",
					!isSelected && "hover:bg-accent/50",
					isDragging && "opacity-30",
					dropPosition === "before" && "border-t-2 border-blue-500",
					dropPosition === "after" && "border-b-2 border-blue-500",
					dropPosition === "inside" && isFolder && "bg-blue-500/20 border-2 border-blue-500"
				)}
				style={{ 
					paddingLeft: `${paddingLeft}px`
				}}
			>
				{isFolder && (
					<span className="flex-shrink-0">
						{isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
					</span>
				)}
				{!isFolder && <span className="w-4" />}
				<span className="flex-shrink-0">
					{isFolder ? (
						isExpanded ? (
							<FolderOpen className="w-4 h-4" />
						) : (
							<Folder className="w-4 h-4" />
						)
					) : (
						<File className="w-4 h-4" />
					)}
				</span>
				<span className="truncate flex-1">{item.name}</span>
				<div className="flex gap-0.5">
					{isFolder && (
						<button
							type="button"
							onClick={handleAddPage}
							onMouseDown={(e) => e.stopPropagation()}
							className="flex-shrink-0 p-0.5 hover:bg-accent rounded opacity-0 group-hover:opacity-100 transition-opacity"
							title="Add page"
						>
							<FilePlus className="w-3 h-3" />
						</button>
					)}
					<button
						type="button"
						onClick={handleDelete}
						onMouseDown={(e) => e.stopPropagation()}
						className="flex-shrink-0 p-0.5 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
						title={isFolder ? "Delete folder" : "Delete page"}
					>
						<Trash2 className="w-3 h-3 text-red-500" />
					</button>
				</div>
			</div>
			{isFolder && isExpanded && item.children && (
				<div>
					{item.children.map((child) => (
						<FileTreeItem
							key={child.id}
							item={child}
							level={level + 1}
							onFileClick={onFileClick}
							selectedId={selectedId}
							onCreatePage={onCreatePage}
							onMoveItem={onMoveItem}
							onDeleteBook={onDeleteBook}
							onDeletePage={onDeletePage}
							isExpanded={expandedIds.has(child.id)}
							onToggleExpanded={onToggleExpanded}
							expandedIds={expandedIds}
						/>
					))}
				</div>
			)}
		</div>
	);
}
