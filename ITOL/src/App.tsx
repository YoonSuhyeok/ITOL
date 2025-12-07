import { Background, ReactFlow, useNodesState, useEdgesState, addEdge, MarkerType, Connection, useReactFlow, ReactFlowProvider, Node } from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import "./App.css";
import { DagServiceInstance } from "./features/dag/services/dag.service";
import FileNode from "@/entities/language/ui/file-node";
import ApiNode from "@/entities/api/ui/api-node";
import DbNode from "@/entities/db/ui/db-node";
import { useCallback, useMemo, useState, useEffect } from "react";
import WindowHeader from "./shared/components/window-header";
import { ExecutionLogPanel } from "./shared/components/execution-log-panel";
import { NodeResultPanel } from "./shared/components/node-result-panel";
import { ApiNodeEditor } from "./shared/components/api-node-editor";
import { DbNodeEditor } from "./shared/components/db-node-editor";
import type { ApiNodeData, DbNodeData } from "./shared/components/settings-modal/types";
import { FileExplorer, type FileItem } from "./shared/components/file-explorer";
import { TabBar, type Tab } from "./shared/components/tab-bar";
import { ContextMenu } from "./shared/components/context-menu";
import { NodeCreationDialog } from "./shared/components/node-creation-dialog";
import { invoke } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog";
import SettingsModal from "./shared/components/settings-modal";
import { useNodeStore } from "./shared/store/use-node-store";

interface Book {
	id: number;
	title: string;
	parent_id: number | null;
}

interface Page {
	id: number;
	fk_book_id: number;
	title: string;
	flow_data: string | null;
}

export default function App() {
	return (
		<ReactFlowProvider>
			<FlowCanvas />
		</ReactFlowProvider>
	);
}

function FlowCanvas() {
	// const nodes: Node<FileNodeData>[] = DagServiceInstance.getNodeData();
	// const edges = DagServiceInstance.getEdgeData();
	const [nodes, setNodes, onNodesChange] = useNodesState(DagServiceInstance.getNodeData());
	const [edges, setEdges, onEdgesChange] = useEdgesState(DagServiceInstance.getEdgeData());
	const { screenToFlowPosition } = useReactFlow();

	// File Explorer & Tabs state
	const [tabs, setTabs] = useState<Tab[]>([]);
	const [activeTabId, setActiveTabId] = useState<string>("");
	const [selectedFileId, setSelectedFileId] = useState<string>();
	const [fileItems, setFileItems] = useState<FileItem[]>([]);
	const [books, setBooks] = useState<Book[]>([]);
	const [pages, setPages] = useState<Page[]>([]);
	
	// Panel collapse states
	const [explorerCollapsed, setExplorerCollapsed] = useState(false);
	const [resultPanelCollapsed, setResultPanelCollapsed] = useState(false);
	
	// ReactFlow context menu state
	const [flowContextMenu, setFlowContextMenu] = useState<{ x: number; y: number } | null>(null);
	
	// Node creation dialog state (File node only)
	const [nodeCreationDialogOpen, setNodeCreationDialogOpen] = useState(false);
	
	// Load books and pages from database
	useEffect(() => {
		const loadData = async () => {
			try {
				const allBooks = await invoke<Book[]>("get_all_books_command");
				setBooks(allBooks);
				
				// Load all pages from all books
				const allPages: Page[] = [];
				for (const book of allBooks) {
					const bookPages = await invoke<Page[]>("get_pages_by_book_id_command", { bookId: book.id });
					allPages.push(...bookPages);
				}
				setPages(allPages);
				
				// Convert books and pages to file items
				const items = convertBooksAndPagesToFileItems(allBooks, allPages);
				setFileItems(items);
				
				// Open first page as default tab if exists
				if (allPages.length > 0 && tabs.length === 0) {
					const firstPage = allPages[0];
					const newTab: Tab = {
						id: `page-${firstPage.id}`,
						title: firstPage.title,
						type: "flow"
					};
					setTabs([newTab]);
					setActiveTabId(newTab.id);
					
					// Load flow data if exists
					if (firstPage.flow_data) {
						try {
							const flowData = JSON.parse(firstPage.flow_data);
							setNodes(flowData.nodes || []);
							setEdges(flowData.edges || []);
						} catch (e) {
							console.error("Failed to parse flow data:", e);
						}
					}
				}
			} catch (error) {
				console.error("Failed to load data:", error);
			}
		};
		
		loadData();
	}, []);
	
	// Convert books and pages to file items hierarchy
	const convertBooksAndPagesToFileItems = (books: Book[], pages: Page[]): FileItem[] => {
		const bookMap = new Map<number, FileItem>();
		const rootItems: FileItem[] = [];
		
		// First pass: create book items
		for (const book of books) {
			const item: FileItem = {
				id: `book-${book.id}`,
				name: book.title,
				type: "folder",
				path: `/book-${book.id}`,
				children: []
			};
			bookMap.set(book.id, item);
		}
		
		// Find default book
		const defaultBook = books.find(b => b.title === "Default" && b.parent_id === null);
		const defaultBookId = defaultBook?.id;
		
		// Second pass: add pages to their books
		for (const page of pages) {
			// If page belongs to Default book, add it directly to root
			if (defaultBookId && page.fk_book_id === defaultBookId) {
				rootItems.push({
					id: `page-${page.id}`,
					name: page.title,
					type: "file",
					path: `/page-${page.id}`
				});
			} else {
				const bookItem = bookMap.get(page.fk_book_id);
				if (bookItem && bookItem.children) {
					bookItem.children.push({
						id: `page-${page.id}`,
						name: page.title,
						type: "file",
						path: `/book-${page.fk_book_id}/page-${page.id}`
					});
				}
			}
		}
		
		// Third pass: build book hierarchy (exclude Default book)
		for (const book of books) {
			// Skip Default book
			if (book.title === "Default" && book.parent_id === null) continue;
			
			const item = bookMap.get(book.id);
			if (!item) continue;
			
			if (book.parent_id === null) {
				rootItems.push(item);
			} else {
				const parent = bookMap.get(book.parent_id);
				if (parent && parent.children) {
					parent.children.push(item);
				}
			}
		}
		
		return rootItems;
	};
	
	// Save current flow data to database
	const saveCurrentFlow = useCallback(async () => {
		if (!activeTabId || !activeTabId.startsWith("page-")) return;
		
		const pageId = Number.parseInt(activeTabId.replace("page-", ""));
		const flowData = JSON.stringify({ nodes, edges });
		
		try {
			const currentPage = pages.find(p => p.id === pageId);
			if (currentPage) {
				await invoke("update_page_command", {
					id: pageId,
					fkBookId: currentPage.fk_book_id,
					title: currentPage.title,
					flowData: flowData
				});
			}
		} catch (error) {
			console.error("Failed to save flow:", error);
		}
	}, [activeTabId, nodes, edges, pages]);

	// API Node Editor state
	const [apiEditorOpen, setApiEditorOpen] = useState(false);
	const [editingApiNode, setEditingApiNode] = useState<{ nodeId: string; data: ApiNodeData } | null>(null);

	// DB Node Editor state
	const [dbEditorOpen, setDbEditorOpen] = useState(false);
	const [editingDbNode, setEditingDbNode] = useState<{ nodeId: string; data: DbNodeData } | null>(null);

	// Settings Modal state
	const [settingsOpen, setSettingsOpen] = useState(false);

	// Create new book (folder)
	const handleCreateBook = useCallback(async () => {
		const bookName = prompt("Enter folder name:");
		if (!bookName || bookName.trim() === "") return;

		try {
			await invoke<number>("create_book_command", {
				title: bookName.trim(),
				parentId: null
			});

			// Reload books
			const allBooks = await invoke<Book[]>("get_all_books_command");
			setBooks(allBooks);

			// Reload all pages
			const allPages: Page[] = [];
			for (const book of allBooks) {
				const bookPages = await invoke<Page[]>("get_pages_by_book_id_command", { bookId: book.id });
				allPages.push(...bookPages);
			}
			setPages(allPages);

			// Update file items
			const items = convertBooksAndPagesToFileItems(allBooks, allPages);
			setFileItems(items);
		} catch (error) {
			console.error("Failed to create book:", error);
			alert("Failed to create folder. Please try again.");
		}
	}, [setNodes, setEdges]);

	// Create new page in a book
	const handleCreatePage = useCallback(async (bookId: number) => {
		const pageName = prompt("Enter page name:");
		if (!pageName || pageName.trim() === "") return;

		try {
			const newPageId = await invoke<number>("create_page_command", {
				fkBookId: bookId,
				title: pageName.trim(),
				flowData: null
			});

			// Reload all pages
			const allPages: Page[] = [];
			for (const book of books) {
				const bookPages = await invoke<Page[]>("get_pages_by_book_id_command", { bookId: book.id });
				allPages.push(...bookPages);
			}
			setPages(allPages);

			// Update file items
			const items = convertBooksAndPagesToFileItems(books, allPages);
			setFileItems(items);

			// Open the new page in a tab
			const newTab: Tab = {
				id: `page-${newPageId}`,
				title: pageName.trim(),
				type: "flow"
			};
			setTabs(prev => [...prev, newTab]);
			setActiveTabId(newTab.id);
			
			// Clear nodes and edges for new page
			setNodes([]);
			setEdges([]);
		} catch (error) {
			console.error("Failed to create page:", error);
			alert("Failed to create page. Please try again.");
		}
	}, [books, setNodes, setEdges]);

	// Create new page at root level (in default book)
	const handleCreateRootPage = useCallback(async () => {
		const pageName = prompt("Enter page name:");
		if (!pageName || pageName.trim() === "") return;

		try {
			// Check if there's a default book, if not create one
			let defaultBook = books.find(b => b.title === "Default" && b.parent_id === null);
			
			if (!defaultBook) {
				// Create default book
				const defaultBookId = await invoke<number>("create_book_command", {
					title: "Default",
					parentId: null
				});
				
				// Reload books
				const allBooks = await invoke<Book[]>("get_all_books_command");
				setBooks(allBooks);
				defaultBook = allBooks.find(b => b.id === defaultBookId);
			}
			
			if (!defaultBook) return;

			const newPageId = await invoke<number>("create_page_command", {
				fkBookId: defaultBook.id,
				title: pageName.trim(),
				flowData: null
			});

			// Reload all pages
			const allPages: Page[] = [];
			for (const book of books) {
				const bookPages = await invoke<Page[]>("get_pages_by_book_id_command", { bookId: book.id });
				allPages.push(...bookPages);
			}
			// Also get pages from the default book if it was just created
			if (defaultBook) {
				const defaultBookPages = await invoke<Page[]>("get_pages_by_book_id_command", { bookId: defaultBook.id });
				for (const p of defaultBookPages) {
					if (!allPages.find(existing => existing.id === p.id)) {
						allPages.push(p);
					}
				}
			}
			setPages(allPages);

			// Update file items
			const allBooks = await invoke<Book[]>("get_all_books_command");
			const items = convertBooksAndPagesToFileItems(allBooks, allPages);
			setFileItems(items);

			// Open the new page in a tab
			const newTab: Tab = {
				id: `page-${newPageId}`,
				title: pageName.trim(),
				type: "flow"
			};
			setTabs(prev => [...prev, newTab]);
			setActiveTabId(newTab.id);
			
			// Clear nodes and edges for new page
			setNodes([]);
			setEdges([]);
		} catch (error) {
			console.error("Failed to create page:", error);
			alert("Failed to create page. Please try again.");
		}
	}, [books, setNodes, setEdges]);

	const handleDeleteBook = useCallback(async (bookId: number) => {
		const book = books.find(b => b.id === bookId);
		if (!book) return;

		const confirmed = await ask(`Are you sure you want to delete the book "${book.title}" and all its pages?`, {
			title: "Delete Book",
			kind: "warning"
		});
		if (!confirmed) return;

		try {
			// Get all pages in this book
			const bookPages = await invoke<Page[]>("get_pages_by_book_id_command", { bookId });
			
			// Close tabs for all pages in this book
			const pageIds = bookPages.map(p => `page-${p.id}`);
			setTabs(prev => prev.filter(tab => !pageIds.includes(tab.id)));
			
			// If active tab was one of these pages, clear it
			if (pageIds.includes(activeTabId)) {
				setActiveTabId("");
				setNodes([]);
				setEdges([]);
			}
			
			// Delete all pages in the book first
			for (const page of bookPages) {
				await invoke("delete_page_command", { id: page.id });
			}
			
			// Delete the book
			await invoke("delete_book_command", { id: bookId });
			
			// Reload all data
			const allBooks = await invoke<Book[]>("get_all_books_command");
			setBooks(allBooks);
			
			const allPages: Page[] = [];
			for (const book of allBooks) {
				const bookPagesReload = await invoke<Page[]>("get_pages_by_book_id_command", { bookId: book.id });
				allPages.push(...bookPagesReload);
			}
			setPages(allPages);
			
			// Update file items
			const items = convertBooksAndPagesToFileItems(allBooks, allPages);
			setFileItems(items);
		} catch (error) {
			console.error("Failed to delete book:", error);
			alert("Failed to delete book. Please try again.");
		}
	}, [books, activeTabId, setNodes, setEdges]);

	const handleDeletePage = useCallback(async (pageId: number) => {
		const page = pages.find(p => p.id === pageId);
		if (!page) return;

		const confirmed = await ask(`Are you sure you want to delete the page "${page.title}"?`, {
			title: "Delete Page",
			kind: "warning"
		});
		if (!confirmed) return;

		try {
			// Delete the page
			await invoke("delete_page_command", { id: pageId });
			
			// Close tab if open
			const tabId = `page-${pageId}`;
			setTabs(prev => prev.filter(tab => tab.id !== tabId));
			
			// If this was the active tab, clear it
			if (activeTabId === tabId) {
				setActiveTabId("");
				setNodes([]);
				setEdges([]);
			}
			
			// Reload all data
			const allBooks = await invoke<Book[]>("get_all_books_command");
			setBooks(allBooks);
			
			const allPages: Page[] = [];
			for (const book of allBooks) {
				const bookPages = await invoke<Page[]>("get_pages_by_book_id_command", { bookId: book.id });
				allPages.push(...bookPages);
			}
			setPages(allPages);
			
			// Update file items
			const items = convertBooksAndPagesToFileItems(allBooks, allPages);
			setFileItems(items);
		} catch (error) {
			console.error("Failed to delete page:", error);
			alert("Failed to delete page. Please try again.");
		}
	}, [pages, activeTabId, setNodes, setEdges]);

	// Handle drag and drop to move items
	const handleMoveItem = useCallback(async (draggedId: string, targetId: string, position: "before" | "after" | "inside") => {
		// Determine if dragged item is book or page
		const isBook = draggedId.startsWith("book-");
		const isPage = draggedId.startsWith("page-");
		const targetIsBook = targetId.startsWith("book-");
		
		if (isBook) {
			// Moving a book
			const bookId = Number.parseInt(draggedId.replace("book-", ""));
			const book = books.find(b => b.id === bookId);
			if (!book) return;
			
			let newParentId: number | null = null;
			
			if (position === "inside" && targetIsBook) {
				// Move book inside another book
				newParentId = Number.parseInt(targetId.replace("book-", ""));
			} else if ((position === "before" || position === "after") && targetIsBook) {
				// Move book to same level as target book
				const targetBook = books.find(b => b.id === Number.parseInt(targetId.replace("book-", "")));
				newParentId = targetBook?.parent_id ?? null;
			}
			
			// Update book parent_id
			try {
				await invoke("update_book_command", {
					id: bookId,
					title: book.title,
					parentId: newParentId
				});
				
				// Reload books
				const allBooks = await invoke<Book[]>("get_all_books_command");
				setBooks(allBooks);
				
				// Reload all pages
				const allPages: Page[] = [];
				for (const b of allBooks) {
					const bookPages = await invoke<Page[]>("get_pages_by_book_id_command", { bookId: b.id });
					allPages.push(...bookPages);
				}
				setPages(allPages);
				
				// Update file items
				const items = convertBooksAndPagesToFileItems(allBooks, allPages);
				setFileItems(items);
			} catch (error) {
				console.error("Failed to move book:", error);
			}
		} else if (isPage) {
			// Moving a page
			const pageId = Number.parseInt(draggedId.replace("page-", ""));
			const page = pages.find(p => p.id === pageId);
			if (!page) return;
			
			let newBookId = page.fk_book_id;
			let needsReorder = false;
			let targetPageId: number | null = null;
			
			if (position === "inside" && targetIsBook) {
				// Move page to different book
				newBookId = Number.parseInt(targetId.replace("book-", ""));
			} else if ((position === "before" || position === "after") && !targetIsBook) {
				// Reorder pages within same or different book
				targetPageId = Number.parseInt(targetId.replace("page-", ""));
				const targetPage = pages.find(p => p.id === targetPageId);
				if (targetPage) {
					newBookId = targetPage.fk_book_id;
					needsReorder = true;
				}
			}
			
			try {
				// Update page's book if changed
				if (newBookId !== page.fk_book_id) {
					await invoke("update_page_command", {
						id: pageId,
						fkBookId: newBookId,
						title: page.title,
						flowData: page.flow_data
					});
				}
				
				// Reorder pages if needed
				if (needsReorder && targetPageId !== null) {
					// Reload data first to get current state
					const allBooks = await invoke<Book[]>("get_all_books_command");
					const allPages: Page[] = [];
					for (const b of allBooks) {
						const bookPages = await invoke<Page[]>("get_pages_by_book_id_command", { bookId: b.id });
						allPages.push(...bookPages);
					}
					
					// Get all pages in the target book (with updated data)
					const bookPages = allPages.filter(p => p.fk_book_id === newBookId);
					
					// Remove dragged page from list
					const filteredPages = bookPages.filter(p => p.id !== pageId);
					
					// Find target page index
					const targetIndex = filteredPages.findIndex(p => p.id === targetPageId);
					
					if (targetIndex !== -1) {
						// Insert dragged page at correct position
						const draggedPageData = bookPages.find(p => p.id === pageId);
						if (draggedPageData) {
							const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
							filteredPages.splice(insertIndex, 0, draggedPageData);
							
							// Get ordered page IDs
							const orderedPageIds = filteredPages.map(p => p.id);
							
							// Update order in database
							await invoke("reorder_pages_command", {
								bookId: newBookId,
								pageIdsInOrder: orderedPageIds
							});
						}
					}
				}
				
				// Final reload
				const allBooks = await invoke<Book[]>("get_all_books_command");
				
				const allPages: Page[] = [];
				for (const b of allBooks) {
					const bookPages = await invoke<Page[]>("get_pages_by_book_id_command", { bookId: b.id });
					allPages.push(...bookPages);
				}
				
				// Check for duplicates
				const pageIds = allPages.map(p => p.id);
				const uniqueIds = new Set(pageIds);
				if (pageIds.length !== uniqueIds.size) {
					console.error("[handleMoveItem] DUPLICATE PAGES DETECTED!");
					const duplicates = pageIds.filter((id, index) => pageIds.indexOf(id) !== index);
					console.error("[handleMoveItem] Duplicate IDs:", duplicates);
				}
				
				setBooks(allBooks);
				setPages(allPages);
				
				// Update file items
				const items = convertBooksAndPagesToFileItems(allBooks, allPages);
				setFileItems(items);
			} catch (error) {
				console.error("Failed to move page:", error);
				alert(`Failed to move page: ${error}`);
			}
		}
	}, [books, pages]);

	// File click handler
	const handleFileClick = useCallback((item: FileItem) => {
		setSelectedFileId(item.id);
		
		if (item.type === "folder" && item.id.startsWith("book-")) {
			// Book clicked - just expand/collapse, don't open tab
			return;
		}
		
		if (item.type === "file" && item.id.startsWith("page-")) {
			// Page clicked - open in tab
			const existingTab = tabs.find(tab => tab.id === item.id);
			
			if (!existingTab) {
				const newTab: Tab = {
					id: item.id,
					title: item.name,
					type: "flow"
				};
				
				setTabs(prev => [...prev, newTab]);
			}
			
			// Save current flow before switching
			if (activeTabId && activeTabId !== item.id) {
				saveCurrentFlow();
			}
			
			// Load the page's flow data
			const pageId = Number.parseInt(item.id.replace("page-", ""));
			const page = pages.find(p => p.id === pageId);
			if (page && page.flow_data) {
				try {
					const flowData = JSON.parse(page.flow_data);
					setNodes(flowData.nodes || []);
					setEdges(flowData.edges || []);
				} catch (e) {
					console.error("Failed to parse flow data:", e);
					setNodes([]);
					setEdges([]);
				}
			} else {
				setNodes([]);
				setEdges([]);
			}
			
			setActiveTabId(item.id);
		}
	}, [tabs, pages, activeTabId, saveCurrentFlow, setNodes, setEdges]);

	// Tab handlers
	const handleTabClick = useCallback((tabId: string) => {
		if (activeTabId !== tabId) {
			// Save current flow before switching
			saveCurrentFlow();
			
			// Load the new tab's flow data
			const pageId = Number.parseInt(tabId.replace("page-", ""));
			const page = pages.find(p => p.id === pageId);
			if (page && page.flow_data) {
				try {
					const flowData = JSON.parse(page.flow_data);
					setNodes(flowData.nodes || []);
					setEdges(flowData.edges || []);
				} catch (e) {
					console.error("Failed to parse flow data:", e);
					setNodes([]);
					setEdges([]);
				}
			} else {
				setNodes([]);
				setEdges([]);
			}
			
			setActiveTabId(tabId);
		}
	}, [activeTabId, pages, saveCurrentFlow, setNodes, setEdges]);

	const handleTabClose = useCallback((tabId: string) => {
		// Save before closing
		if (activeTabId === tabId) {
			saveCurrentFlow();
		}
		
		setTabs(prev => {
			const newTabs = prev.filter(tab => tab.id !== tabId);
			
			// If closing active tab, switch to another tab
			if (activeTabId === tabId && newTabs.length > 0) {
				const newActiveId = newTabs[newTabs.length - 1].id;
				
				// Load the new active tab's flow data
				const pageId = Number.parseInt(newActiveId.replace("page-", ""));
				const page = pages.find(p => p.id === pageId);
				if (page && page.flow_data) {
					try {
						const flowData = JSON.parse(page.flow_data);
						setNodes(flowData.nodes || []);
						setEdges(flowData.edges || []);
					} catch (e) {
						console.error("Failed to parse flow data:", e);
						setNodes([]);
						setEdges([]);
					}
				} else {
					setNodes([]);
					setEdges([]);
				}
				
				setActiveTabId(newActiveId);
			} else if (newTabs.length === 0) {
				setActiveTabId("");
				setNodes([]);
				setEdges([]);
			}
			
			return newTabs;
		});
	}, [activeTabId, pages, saveCurrentFlow, setNodes, setEdges]);

	// 새로운 노드 생성 함수
	const createNewNode = useCallback((position: { x: number; y: number }, sourceNodeId?: string) => {
		const newNodeId = `node-${Date.now()}`;
		const newNode = {
			id: newNodeId,
			type: 'languageNode',
			position,
			data: {
				fileName: `NewFile${nodes.length + 1}`,
				fileExtension: 'ts' as const,
				filePath: `/new-file-${nodes.length + 1}.ts`,
				requestProperties: []
			}
		};
		
		setNodes((nds) => [...nds, newNode]);
		
		// DagService에도 노드 추가
		DagServiceInstance.addNode(newNode);
		
		// 소스 노드가 있으면 자동으로 연결
		if (sourceNodeId) {
			setEdges((eds) => {
				const newEdges = addEdge({
					id: `${sourceNodeId}-${newNodeId}`,
					source: sourceNodeId,
					target: newNodeId,
					markerEnd: { type: MarkerType.ArrowClosed },
				}, eds);
				
				// DagService에 엣지 데이터 동기화
				try {
					DagServiceInstance.setEdgeData(newEdges);
					console.log("Auto-connection successful");
				} catch (error) {
					console.error("Failed to auto-connect:", error);
					// 오류 발생 시 엣지 연결 취소
					return eds;
				}
				
				return newEdges;
			});
		}
		
		return newNodeId;
	}, [nodes.length, setNodes, setEdges]);

	// 파일 노드 생성 함수 (설정 모달에서 사용)
	const createFileNode = useCallback((filePath: string, fileName: string, fileExtension: string) => {
		const newNodeId = `node-${Date.now()}`;
		
		// 파일 확장자를 ts/js로 매핑
		const mappedExtension = (fileExtension === 'tsx' || fileExtension === 'ts') ? 'ts' : 'js';
		
		const newNode = {
			id: newNodeId,
			type: 'languageNode',
			position: { x: Math.random() * 400, y: Math.random() * 400 }, // 랜덤 위치
			data: {
				fileName: fileName.split('.')[0], // 확장자 제거
				fileExtension: mappedExtension as any,
				filePath: filePath,
				requestProperties: []
			}
		};
		
		setNodes((nds) => [...nds, newNode]);
		
		// DagService에도 동기화
		DagServiceInstance.addNode(newNode);
		
		return newNodeId;
	}, [setNodes]);

	// API 노드 생성 함수
	const createApiNode = useCallback((apiData: ApiNodeData) => {
		const newNodeId = `api-node-${Date.now()}`;
		const newNode: any = {
			id: newNodeId,
			type: 'apiNode',
			position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
			data: apiData
		};
		
		setNodes((nds: any) => [...nds, newNode]);
		DagServiceInstance.addNode(newNode as any);
		
		return newNodeId;
	}, [setNodes]);

	// API 노드 업데이트 함수
	const updateApiNode = useCallback((nodeId: string, apiData: ApiNodeData) => {
		setNodes((nds: any) => 
			nds.map((node: any) => 
				node.id === nodeId 
					? { ...node, data: apiData }
					: node
			)
		);
		// DagService에도 업데이트 반영
		const updatedNode = {
			id: nodeId,
			type: 'apiNode',
			data: apiData
		};
		DagServiceInstance.updateNode(updatedNode as any);
	}, [setNodes]);

	// DB 노드 생성 함수
	const createDbNode = useCallback((dbData: DbNodeData) => {
		const newNodeId = `db-node-${Date.now()}`;
		const newNode: any = {
			id: newNodeId,
			type: 'dbNode',
			position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
			data: dbData
		};
		
		setNodes((nds: any) => [...nds, newNode]);
		DagServiceInstance.addNode(newNode as any);
		
		return newNodeId;
	}, [setNodes]);

	// DB 노드 업데이트 함수
	const updateDbNode = useCallback((nodeId: string, dbData: DbNodeData) => {
		setNodes((nds: any) => 
			nds.map((node: any) => 
				node.id === nodeId 
					? { ...node, data: dbData }
					: node
			)
		);
		// DagService에도 업데이트 반영
		const updatedNode = {
			id: nodeId,
			type: 'dbNode',
			data: dbData
		};
		DagServiceInstance.updateNode(updatedNode as any);
	}, [setNodes]);

	// 노드 더블클릭 핸들러
	const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
		if (node.type === 'apiNode') {
			setEditingApiNode({ nodeId: node.id, data: node.data as unknown as ApiNodeData });
			setApiEditorOpen(true);
		} else if (node.type === 'dbNode') {
			setEditingDbNode({ nodeId: node.id, data: node.data as unknown as DbNodeData });
			setDbEditorOpen(true);
		}
	}, []);

	// API Editor 저장 핸들러
	const handleApiEditorSave = useCallback((data: ApiNodeData) => {
		if (editingApiNode) {
			// 편집 모드
			updateApiNode(editingApiNode.nodeId, data);
		} else {
			// 생성 모드
			createApiNode(data);
		}
		setApiEditorOpen(false);
		setEditingApiNode(null);
	}, [editingApiNode, updateApiNode, createApiNode]);

	// DB Editor 저장 핸들러
	const handleDbEditorSave = useCallback((data: DbNodeData) => {
		if (editingDbNode) {
			// 편집 모드
			updateDbNode(editingDbNode.nodeId, data);
		} else {
			// 생성 모드
			createDbNode(data);
		}
		setDbEditorOpen(false);
		setEditingDbNode(null);
	}, [editingDbNode, updateDbNode, createDbNode]);

	// API Editor 닫기 핸들러
	const handleApiEditorClose = useCallback(() => {
		setApiEditorOpen(false);
		setEditingApiNode(null);
	}, []);

	const handleDbEditorClose = useCallback(() => {
		setDbEditorOpen(false);
		setEditingDbNode(null);
	}, []);

	const nodeTypes = useMemo(
		() => ({
			languageNode: (nodeProps: any) => <FileNode {...nodeProps} setNodes={setNodes} setEdges={setEdges} />,
			apiNode: (nodeProps: any) => <ApiNode {...nodeProps} setNodes={setNodes} setEdges={setEdges} />,
			dbNode: (nodeProps: any) => <DbNode {...nodeProps} setNodes={setNodes} setEdges={setEdges} />
		}),
		[setNodes, setEdges]
	);

	const onConnect = useCallback(
		(connection: Connection) => {
		  setEdges((oldEdges) => {
			const newEdges = addEdge(
			  {
				...connection,
				markerEnd: { type: MarkerType.ArrowClosed },
			  },
			  oldEdges
			);
			
			// DagService에 엣지 데이터 동기화
			try {
			  DagServiceInstance.setEdgeData(newEdges);
			  console.log("Edge connection successful:", connection);
			} catch (error) {
			  console.error("Failed to add edge:", error);
			  // 순환 참조 등의 오류가 발생하면 엣지 추가를 취소
			  return oldEdges;
			}
			
			return newEdges;
		  });
		},
		[setEdges]
	  );

	// 핸들을 빈 공간에 놓았을 때 새 노드 생성
	const onConnectEnd = useCallback(
		(event: MouseEvent | TouchEvent, connectionState: any) => {
			// 연결이 실제로 이루어지지 않았을 때만 새 노드 생성
			if (!connectionState.isValid && connectionState.fromNode) {
				const targetIsPane = (event.target as Element)?.classList.contains('react-flow__pane');
				
				if (targetIsPane) {
					// 마우스 위치를 flow 좌표계로 변환
					const position = screenToFlowPosition({
						x: (event as MouseEvent).clientX,
						y: (event as MouseEvent).clientY,
					});
					
					// 새 노드 생성
					createNewNode(position, connectionState.fromNode.id);
				}
			}
		},
		[screenToFlowPosition, createNewNode]
	);

	return (
		<div style={{ width: "100vw", height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
			<WindowHeader 
				onSettingsClick={() => setSettingsOpen(true)} 
				resultPanelCollapsed={resultPanelCollapsed}
				onToggleResultPanel={() => setResultPanelCollapsed(false)}
				resultCount={Object.keys(useNodeStore.getState().nodeResults).length}
			/>
			<div style={{ 
				width: "100%", 
				flex: 1,
				overflow: "hidden",
				display: "flex",
				flexDirection: "row",
				paddingTop: "30px"
			}}>
				{/* Left Sidebar - File Explorer */}
				{explorerCollapsed ? (
					<div style={{ height: "100%", borderRight: "1px solid var(--border)", flexShrink: 0 }}>
						<FileExplorer 
							items={fileItems}
							onFileClick={handleFileClick}
							selectedId={selectedFileId}
							onCreateBook={handleCreateBook}
							onCreatePage={handleCreatePage}
							onCreateRootPage={handleCreateRootPage}
							onMoveItem={handleMoveItem}
							onDeleteBook={handleDeleteBook}
							onDeletePage={handleDeletePage}
							collapsed={true}
							onToggleCollapse={() => setExplorerCollapsed(false)}
						/>
					</div>
				) : (
					<div style={{ width: "250px", height: "100%", borderRight: "1px solid var(--border)", flexShrink: 0, position: "relative" }}>
						<FileExplorer 
							items={fileItems}
							onFileClick={handleFileClick}
							selectedId={selectedFileId}
							onCreateBook={handleCreateBook}
							onCreatePage={handleCreatePage}
							onCreateRootPage={handleCreateRootPage}
							onMoveItem={handleMoveItem}
							onDeleteBook={handleDeleteBook}
							onDeletePage={handleDeletePage}
							collapsed={false}
							onToggleCollapse={() => setExplorerCollapsed(true)}
						/>
					</div>
				)}				{/* Main Content Area */}
				<div style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
					{/* Tab Bar - Only show if there are tabs */}
					{tabs.length > 0 && (
						<TabBar 
							tabs={tabs}
							activeTabId={activeTabId}
							onTabClick={handleTabClick}
							onTabClose={handleTabClose}
						/>
					)}

					{/* Content Area */}
					<div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" }}>
						{activeTabId && activeTabId.startsWith("page-") ? (
							<>
								<div style={{ flex: 1, position: "relative", display: "flex", overflow: "hidden" }}>
									{/* ReactFlow Area */}
									<div style={{ flex: 1, height: "100%", position: "relative" }}>
										<ReactFlow
											nodeTypes={nodeTypes}
											nodes={nodes}
											edges={edges}
											onNodesChange={onNodesChange}
											onEdgesChange={onEdgesChange}
											onConnect={onConnect}
											onConnectEnd={onConnectEnd}
											onNodeDoubleClick={onNodeDoubleClick}
											onContextMenu={(e) => {
												e.preventDefault();
												setFlowContextMenu({ x: e.clientX, y: e.clientY });
											}}
											onPaneClick={() => setFlowContextMenu(null)}
										>
											<Background />
										</ReactFlow>
										
										{/* ReactFlow Context Menu */}
										{flowContextMenu && (
											<ContextMenu
												x={flowContextMenu.x}
												y={flowContextMenu.y}
												onFileNode={() => {
													setNodeCreationDialogOpen(true);
													setFlowContextMenu(null);
												}}
												onApiNode={() => {
													setEditingApiNode(null);
													setApiEditorOpen(true);
													setFlowContextMenu(null);
												}}
												onDbNode={() => {
													setEditingDbNode(null);
													setDbEditorOpen(true);
													setFlowContextMenu(null);
												}}
												onClose={() => setFlowContextMenu(null)}
											/>
										)}
									</div>
									
									{/* Node Results Panel - only show when expanded */}
									{!resultPanelCollapsed && (
										<div style={{ width: "350px", height: "100%", borderLeft: "1px solid var(--border)", flexShrink: 0 }}>
											<NodeResultPanel 
												collapsed={false}
												onToggleCollapse={() => setResultPanelCollapsed(true)}
											/>
										</div>
									)}
								</div>
								{/* Execution Log Panel */}
								<ExecutionLogPanel />
							</>
						) : (
							<div style={{ flex: 1, padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
								<div style={{ textAlign: "center" }}>
									<h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>No Flow Selected</h2>
									<p style={{ color: "var(--muted-foreground)" }}>Select a flow from the explorer to start editing</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
			<ApiNodeEditor
				isOpen={apiEditorOpen}
				onClose={handleApiEditorClose}
				initialData={editingApiNode?.data}
				onSave={handleApiEditorSave}
				mode={editingApiNode ? 'edit' : 'create'}
			/>
			<DbNodeEditor
				isOpen={dbEditorOpen}
				onClose={handleDbEditorClose}
				initialData={editingDbNode?.data}
				onSave={handleDbEditorSave}
				mode={editingDbNode ? 'edit' : 'create'}
			/>
			<NodeCreationDialog
				isOpen={nodeCreationDialogOpen}
				onClose={() => setNodeCreationDialogOpen(false)}
				onCreateFileNode={createFileNode}
			/>
			<SettingsModal
				isOpen={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				onCreateFileNode={createFileNode}
				onCreateApiNode={() => {
					setEditingApiNode(null);
					setApiEditorOpen(true);
					setSettingsOpen(false);
				}}
				onCreateDbNode={() => {
					setEditingDbNode(null);
					setDbEditorOpen(true);
					setSettingsOpen(false);
				}}
			/>
		</div>
	);
}
