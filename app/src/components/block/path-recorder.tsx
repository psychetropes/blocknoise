// path recorder — captures stem positions over time as [x, y, z, timestamp] arrays
// used to record spatial mixing paths for pro usi mints

type SpatialPoint = [number, number, number, number]; // x, y, z, timestamp

export class PathRecorder {
  private paths: SpatialPoint[][] = [[], [], []];
  private startTime: number = 0;

  start() {
    this.paths = [[], [], []];
    this.startTime = Date.now();
  }

  record(stemIndex: number, x: number, y: number, z: number) {
    if (stemIndex < 0 || stemIndex > 2) return;
    const timestamp = Date.now() - this.startTime;
    this.paths[stemIndex].push([x, y, z, timestamp]);
  }

  closePaths(): SpatialPoint[][] {
    return this.paths.map((path) => {
      if (path.length > 0) {
        // close path back to origin for seamless loop
        return [...path, path[0]];
      }
      return path;
    });
  }

  getPaths(): SpatialPoint[][] {
    return this.paths;
  }
}
