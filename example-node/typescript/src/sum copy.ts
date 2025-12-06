import { createStartPoint } from "itol-ts";

interface sumRequestType {
    targets: string;
}

function sum(targets: sumRequestType): string {

    return targets.targets;
}

const startFunction = createStartPoint(sum);
startFunction();