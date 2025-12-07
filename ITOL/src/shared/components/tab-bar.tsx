import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface Tab {
	id: string;
	title: string;
	type: "file" | "flow" | "api" | "db";
}

interface TabBarProps {
	tabs: Tab[];
	activeTabId: string;
	onTabClick: (tabId: string) => void;
	onTabClose: (tabId: string) => void;
}

export function TabBar({ tabs, activeTabId, onTabClick, onTabClose }: TabBarProps) {
	return (
		<div style={{
			height: "35px",
			backgroundColor: "#252526",
			borderBottom: "1px solid #2d2d30",
			display: "flex",
			alignItems: "center",
			overflowX: "auto"
		}}>
			{tabs.map((tab) => (
				<div
					key={tab.id}
					style={{
						display: "flex",
						alignItems: "center",
						height: "35px",
						padding: "0 12px",
						backgroundColor: activeTabId === tab.id ? "#1e1e1e" : "#2d2d30",
						borderRight: "1px solid #1e1e1e",
						borderBottom: activeTabId === tab.id ? "2px solid #007acc" : "none",
						cursor: "pointer",
						minWidth: "120px",
						maxWidth: "240px",
						position: "relative"
					}}
					onClick={() => onTabClick(tab.id)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							onTabClick(tab.id);
						}
					}}
					onMouseEnter={(e) => {
						if (activeTabId !== tab.id) {
							e.currentTarget.style.backgroundColor = "#3c3c3c";
						}
					}}
					onMouseLeave={(e) => {
						if (activeTabId !== tab.id) {
							e.currentTarget.style.backgroundColor = "#2d2d30";
						}
					}}
				>
					<span style={{
						color: "#cccccc",
						fontSize: "13px",
						flex: 1,
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap"
					}}>
						{tab.title}
					</span>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onTabClose(tab.id);
						}}
						style={{
							background: "none",
							border: "none",
							color: "#cccccc",
							cursor: "pointer",
							padding: "2px",
							marginLeft: "8px",
							borderRadius: "2px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center"
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = "#3c3c3c";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = "transparent";
						}}
						aria-label={`Close ${tab.title}`}
					>
						<X className="w-3 h-3" />
					</button>
				</div>
			))}
		</div>
	);
}
