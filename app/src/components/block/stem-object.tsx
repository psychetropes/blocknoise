// stem sphere object for the block 3d mixer
// represents a single draggable audio stem in 3d space

interface StemObjectProps {
  index: number;
  color: string;
  position: [number, number, number];
  onDrag: (position: [number, number, number]) => void;
}

export function StemObject({ index, color, position, onDrag }: StemObjectProps) {
  // this will be a three.js mesh rendered inside @react-three/fiber Canvas
  // using @react-three/drei's Sphere geometry
  // gesture handler will drive the onDrag callback
  return null;
}
