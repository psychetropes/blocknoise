import React, { useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import * as THREE from 'three';
import { colors } from '../../theme';

interface BlockCanvasProps {
  stems: string[];
  positions: [number, number, number][];
  onDrag: (stemIndex: number, position: [number, number, number]) => void;
  isActive: boolean;
  activeStem: number | null;
  visibleStems?: number[];
  onStemSelect: (index: number | null) => void;
}

const STEM_COLORS = [colors.white, colors.blue, 'rgba(255,255,255,0.6)'];
const ROOM_WIDTH = 2.2;
const ROOM_HEIGHT = 3.1;
const ROOM_DEPTH = 3.6;

function WireframeCube() {
  const edges = useMemo(() => {
    const geometry = new THREE.BoxGeometry(ROOM_WIDTH, ROOM_HEIGHT, ROOM_DEPTH);
    return new THREE.EdgesGeometry(geometry);
  }, []);

  return (
    <lineSegments geometry={edges}>
      <lineBasicMaterial color={colors.blue} opacity={0.75} transparent />
    </lineSegments>
  );
}

function GridFloor() {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const halfW = ROOM_WIDTH / 2;
    const halfH = ROOM_HEIGHT / 2;
    const halfD = ROOM_DEPTH / 2;
    const widthDivisions = 5;
    const heightDivisions = 5;
    const depthDivisions = 9;
    const widthStep = ROOM_WIDTH / widthDivisions;
    const heightStep = ROOM_HEIGHT / heightDivisions;
    const depthStep = ROOM_DEPTH / depthDivisions;

    for (let i = 0; i <= widthDivisions; i++) {
      const pos = -halfW + i * widthStep;
      pts.push(new THREE.Vector3(pos, -halfH, -halfD));
      pts.push(new THREE.Vector3(pos, -halfH, halfD));
      pts.push(new THREE.Vector3(pos, halfH, -halfD));
      pts.push(new THREE.Vector3(pos, halfH, halfD));
     }

    for (let i = 0; i <= depthDivisions; i++) {
      const pos = -halfD + i * depthStep;
      pts.push(new THREE.Vector3(-halfW, -halfH, pos));
      pts.push(new THREE.Vector3(halfW, -halfH, pos));
      pts.push(new THREE.Vector3(-halfW, halfH, pos));
      pts.push(new THREE.Vector3(halfW, halfH, pos));
    }

    for (let i = 0; i <= heightDivisions; i++) {
      const pos = -halfH + i * heightStep;
      pts.push(new THREE.Vector3(-halfW, pos, -halfD));
      pts.push(new THREE.Vector3(-halfW, pos, halfD));
      pts.push(new THREE.Vector3(halfW, pos, -halfD));
      pts.push(new THREE.Vector3(halfW, pos, halfD));
    }

    return pts;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={colors.blue} opacity={0.22} transparent />
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
        const halfW = ROOM_WIDTH / 2;
        const halfH = ROOM_HEIGHT / 2;
        const halfD = ROOM_DEPTH / 2;
        const x = Math.max(-halfW, Math.min(halfW, intersection.current.x));
        const y = Math.max(-halfH, Math.min(halfH, intersection.current.y));
        const z = Math.max(-halfD, Math.min(halfD, intersection.current.z));

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
  visibleStems,
  onStemSelect,
}: BlockCanvasProps) {
  const trailsRef = useRef<[number, number, number][][]>([[], [], []]);
  const visibleStemSet = useMemo(
    () => new Set(visibleStems ?? positions.map((_, index) => index)),
    [positions, visibleStems]
  );

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
        camera={{ position: [0, 0, 5.4], fov: 34 }}
        style={{ flex: 1 }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 6]} intensity={0.55} />
        <pointLight position={[-3, -3, 2]} intensity={0.2} color={colors.blue} />

        <group>
          <WireframeCube />
          <GridFloor />

          {positions.map((pos, i) =>
            visibleStemSet.has(i) ? (
              <StemSphere
                key={i}
                position={pos}
                color={STEM_COLORS[i]}
                index={i}
                isSelected={activeStem === i}
                onSelect={() => onStemSelect(activeStem === i ? null : i)}
              />
            ) : null
          )}

          {trailsRef.current.map((points, i) =>
            visibleStemSet.has(i) ? (
              <StemTrail key={i} points={points} color={STEM_COLORS[i]} />
            ) : null
          )}
        </group>

        {isActive && <DragHandler activeStem={activeStem} onDrag={onDrag} />}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pureBlack,
    overflow: 'hidden',
  },
});
