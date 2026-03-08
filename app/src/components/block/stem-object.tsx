import { useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

interface StemObjectProps {
  index: number;
  color: string;
  position: [number, number, number];
  isSelected: boolean;
  onSelect: () => void;
}

export function StemObject({ index, color, position, isSelected, onSelect }: StemObjectProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(clock.elapsedTime * 2 + index * 1.5) * 0.1;
      meshRef.current.scale.setScalar(isSelected ? scale * 1.3 : scale);
    }
  });

  return (
    <group position={position}>
      {/* glow */}
      <mesh>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshBasicMaterial color={color} opacity={0.12} transparent />
      </mesh>
      {/* core */}
      <mesh
        ref={meshRef}
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 1.0 : 0.5}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
    </group>
  );
}
