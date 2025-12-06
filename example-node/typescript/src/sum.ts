import { createStartPoint } from "itol-ts";

interface sumRequestType {
    targets: string;
}

function sum(targets: sumRequestType): number {
    const parsedTargets = targets.targets.replace(/\s/g, ""); // 공백 제거
    if (!parsedTargets) {
        return 0; // 빈 문자열 처리
    }
    
    // 쉼표로 분리하여 숫자로 변환 후 합산
    if (!/^[0-9,]+$/.test(parsedTargets)) {
        throw new Error("Invalid input: targets must be a comma-separated list of numbers.");
    }
    // 쉼표로 분리하여 숫자로 변환 후 합산
    parsedTargets.split(",").forEach(num => {
        if (isNaN(Number(num))) {
            throw new Error(`Invalid number: ${num} is not a valid number.`);
        }
    });
    // reduce를 사용하여 합산
    // return parsedTargets.split(",").reduce((acc, curr) => acc + Number(curr), 0);

    return 4;
}

const startFunction = createStartPoint(sum);
startFunction();