export type CellOwner = 0 | 1 | null;

const HEX_DIRECTIONS = [
  [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0],
] as const;

export function findWinningPath(owners: CellOwner[], size: number, team: 0 | 1): number[] {
  const starts: number[] = [];
  for (let index = 0; index < owners.length; index += 1) {
    const row = Math.floor(index / size);
    const column = index % size;
    if (owners[index] === team && (team === 0 ? column === 0 : row === 0)) starts.push(index);
  }

  const queue = [...starts];
  const visited = new Set(starts);
  const previous = new Map<number, number>();
  while (queue.length) {
    const current = queue.shift()!;
    const row = Math.floor(current / size);
    const column = current % size;
    if ((team === 0 && column === size - 1) || (team === 1 && row === size - 1)) {
      const path = [current];
      while (previous.has(path[0])) path.unshift(previous.get(path[0])!);
      return path;
    }
    for (const [rowDelta, columnDelta] of HEX_DIRECTIONS) {
      const nextRow = row + rowDelta;
      const nextColumn = column + columnDelta;
      if (nextRow < 0 || nextRow >= size || nextColumn < 0 || nextColumn >= size) continue;
      const next = nextRow * size + nextColumn;
      if (owners[next] !== team || visited.has(next)) continue;
      visited.add(next);
      previous.set(next, current);
      queue.push(next);
    }
  }
  return [];
}
