interface sumRequestType {
    targets: number[];
}

function sum(targets: sumRequestType): number {
  return targets.targets.reduce((acc, curr) => acc + curr, 0);
}

export default sum;