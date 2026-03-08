import React, { useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import * as THREE from 'three';
import { theme } from '../../theme';

interface BlockCanvasProps {
  stems: string[];
  positions: [number, number, number][];
  onDrag: (stemIndex: number, position: [number, number, number]) => void;
  isActive: boolean;
  activeStem: number | null;
  onStemSelect: (index: number | null) => void;
}

const STEM_COLORS = [theme.cyan, theme.magenta, '#FFD700'];
const CUBE_SIZE = 2;

function WireframeCube() {
  const edges = useMemo(() => {
    const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    return new THREE.EdgesGeometry(geometry);
  }, []);

  return (
    <lineSegments geometry={edges}>
      <lineBasicMaterial color={theme.muted} opacity={0.4} transparent />
    </lineSegments>
  );
}

function GridFloor() {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const half = CUBE_SIZE / 2;
    const divisions = 8;
    const step = CUBE_SIZE / divisions;

    for (let i = 0; i <= divisions; i++) {
      const pos = -half + i * step;
      pts.push(new THREE.Vector3(pos, -half, -half));
      pts.push(new THREE.Vector3(pos, -half, half));
      pts.push(new THREE.Vector3(-half, -half, pos));
      pts.push(new THREE.Vector3(half, -half, pos));
    }
    return pts;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={theme.muted2} opacity={0.3} transparent />
    </lineSegments>
  );
}

interface StemSphereProps {
  position: [number, number, number];
  color: string;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

function StemSphere({ position, color, index, isSelected, onSelect }: StemSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // gentle pulse animation
      const scale = 1 + Math.sin(clock.elapsedTime * 2 + index * 1.5) * 0.08;
      meshRef.current.scale.setScalar(isSelected ? scale * 1.2 : scale);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(isSelected ? 1.8 : 1.4);
    }
  });

  return (
    <group position={position}>
      {/* outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={color} opacity={0.15} transparent />
      </mesh>
      {/* main sphere */}
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
          emissiveIntensity={isSelected ? 0.8 : 0.4}
        />
      </mesh>
    </group>
  );
}

function StemTrail({ points, color }: { points: [number, number, number][]; color: string }) {
  const geometry = useMemo(() => {
    if (points.length < 2) return null;
    const vectors = points.map((p) => new THREE.Vector3(...p));
    // smooth the path with catmull-rom curve
    const curve = new THREE.CatmullRomCurve3(vectors);
    const smoothed = curve.getPoints(Math.max(points.length * 3, 50));
    return new THREE.BufferGeometry().setFromPoints(smoothed);
  }, [points]);

  if (!geometry) return null;

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} opacity={0.6} transparent linewidth={1} />
    </lineSegments>
  );
}

function RotatingGroup({ children, isActive }: { children: React.ReactNode; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current && !isActive) {
      // gentle idle rotation when not mixing
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

function DragHandler({
  activeStem,
  onDrag,
}: {
  activeStem: number | null;
  onDrag: (stemIndex: number, position: [number, number, number]) => void;
}) {
  const { camera, size } = useThree();
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const raycaster = useRef(new THREE.Raycaster());
  const intersection = useRef(new THREE.Vector3());

  return (
    <mesh
      visible={false}
      onPointerMove={(e) => {
        if (activeStem === null) return;

        // project touch position onto a plane
        const nativeEvt = e.nativeEvent as unknown as { offsetX: number; offsetY: number };
        const ndc = new THREE.Vector2(
          (nativeEvt.offsetX / size.width) * 2 - 1,
          -(nativeEvt.offsetY / size.height) * 2 + 1
        );
        raycaster.current.setFromCamera(ndc, camera);
        raycaster.current.ray.intersectPlane(planeRef.current, intersection.current);

        // clamp to cube bounds
        const half = CUBE_SIZE / 2;
        const x = Math.max(-half, Math.min(half, intersection.current.x));
        const y = Math.max(-half, Math.min(half, intersection.current.y));
        const z = Math.max(-half, Math.min(half, intersection.current.z));

        onDrag(activeStem, [x, y, z]);
      }}
      onPointerUp={() => {
        // deselect handled by parent
      }}
    >
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

export function BlockCanvas({
  stems,
  positions,
  onDrag,
  isActive,
  activeStem,
  onStemSelect,
}: BlockCanvasProps) {
  const trailsRef = useRef<[number, number, number][][]>([[], [], []]);

  // accumulate trail points
  if (isActive) {
    positions.forEach((pos, i) => {
      const trail = trailsRef.current[i];
      const last = trail[trail.length - 1];
      if (!last || Math.abs(last[0] - pos[0]) > 0.01 || Math.abs(last[1] - pos[1]) > 0.01) {
        trail.push([...pos]);
        // keep trail manageable
        if (trail.length > 500) trail.shift();
      }
    });
  }

  return (
    <View style={styles.container}>
      <Canvas
        camera={{ position: [3, 2.5, 3], fov: 50 }}
        style={{ flex: 1 }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[-3, -3, 2]} intensity={0.4} color={theme.cyan} />

        <RotatingGroup isActive={isActive}>
          <WireframeCube />
          <GridFloor />

          {positions.map((pos, i) => (
            <StemSphere
              key={i}
              position={pos}
              color={STEM_COLORS[i]}
              index={i}
              isSelected={activeStem === i}
              onSelect={() => onStemSelect(activeStem === i ? null : i)}
            />
          ))}

          {trailsRef.current.map((points, i) => (
            <StemTrail key={i} points={points} color={STEM_COLORS[i]} />
          ))}
        </RotatingGroup>

        {isActive && <DragHandler activeStem={activeStem} onDrag={onDrag} />}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg2,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
