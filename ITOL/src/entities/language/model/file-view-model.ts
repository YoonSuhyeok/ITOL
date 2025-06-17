import type Parameter from "@/shared/types/node-parameter-type";
import { useCallback, useState } from "react";

const FileViewModel = () => {
	const [isRunning, setIsRunning] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [runSuccess, setRunSuccess] = useState<boolean | null>(null);
	const [filename, setFilename] = useState<string>("");

	const [parameters, setParameters] = useState<Parameter[]>([]);

	// 파라미터 섹션 최소화 상태 추가
	const [isParameterSectionCollapsed, setIsParameterSectionCollapsed] =
		useState(false);
	const [isNodeMinimized, setIsNodeMinimized] = useState(false);

	// 파라미터 삭제 함수
	const deleteParameter = useCallback((id: string) => {
		setParameters((prev) => prev.filter((param) => param.id !== id));
	}, []);

	const [showTypeDefinition, setShowTypeDefinition] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);

	const [isBuilding, setIsBuilding] = useState(false);

	return {
		isRunning,
		setIsRunning,
		isSaving,
		setIsSaving,
		runSuccess,
		setRunSuccess,
		filename,
		setFilename,
		parameters,
		isParameterSectionCollapsed,
		setIsParameterSectionCollapsed,
		isNodeMinimized,
		setIsNodeMinimized,
		showTypeDefinition,
		setShowTypeDefinition,
		saveSuccess,
		setSaveSuccess,
		isBuilding,
		setIsBuilding,

		toggleRunning: () => {
			setIsRunning((prev) => !prev);
			if (!isRunning) {
				// Simulate running logic
				setTimeout(() => {
					setRunSuccess(true); // Simulate success
				}, 1000);
			}
		},

		toggleSaving: () => {
			setIsSaving((prev) => !prev);
			if (!isSaving) {
				// Simulate saving logic
				setTimeout(() => {
					setRunSuccess(true); // Simulate success
				}, 1000);
			}
		},

		updateFilename: (newFilename: string) => {
			setFilename(newFilename);
		},
	};
};

export default FileViewModel;
