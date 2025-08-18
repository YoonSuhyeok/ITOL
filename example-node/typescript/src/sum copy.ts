import { createStartPoint } from "itol-ts";

interface sumRequestType {
    targets: string;
}

function sum(targets: sumRequestType): number {

    return 4;
}

const startFunction = createStartPoint(sum);
startFunction();