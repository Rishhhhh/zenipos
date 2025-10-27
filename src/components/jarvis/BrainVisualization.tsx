import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import type { NeuronActivation } from '@/lib/jarvis/types';

const clusterColors: Record<string, string> = {
  pos: '#EF4444', // Red
  quantum: '#3B82F6', // Blue
  ethics: '#10B981', // Green
  ledger: '#F59E0B', // Gold
  inventory: '#F97316', // Orange
  customer: '#A855F7', // Purple
  finance: '#06B6D4', // Cyan
  soul: '#FFFFFF', // White
};

interface NeuronProps {
  activation: NeuronActivation;
  index: number;
}

function Neuron({ activation, index }: NeuronProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [x, y, z] = activation.position;

  useFrame((state) => {
    if (!meshRef.current) return;

    // Pulsate based on intensity
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + index * 0.1) * 0.2 * activation.intensity;
    meshRef.current.scale.setScalar(pulse * activation.intensity);

    // Glow effect
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = activation.intensity * 2;
  });

  const color = clusterColors[activation.cluster] || '#FFFFFF';

  return (
    <Sphere ref={meshRef} args={[0.05, 16, 16]} position={[x, y, z]}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={activation.intensity}
        transparent
        opacity={0.8}
      />
    </Sphere>
  );
}

function DysonSphere() {
  const sphereRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!sphereRef.current) return;
    sphereRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    sphereRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
  });

  return (
    <Sphere ref={sphereRef} args={[5, 64, 64]}>
      <meshBasicMaterial
        color="#8B5CF6"
        wireframe
        transparent
        opacity={0.1}
      />
    </Sphere>
  );
}

function Connections({ neurons }: { neurons: NeuronActivation[] }) {
  const lines = useMemo(() => {
    const result: Array<[THREE.Vector3, THREE.Vector3]> = [];
    
    // Connect nearby neurons (within 1.5 units)
    for (let i = 0; i < neurons.length; i++) {
      for (let j = i + 1; j < neurons.length; j++) {
        const [x1, y1, z1] = neurons[i].position;
        const [x2, y2, z2] = neurons[j].position;
        const distance = Math.sqrt(
          Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2)
        );

        if (distance < 1.5) {
          result.push([
            new THREE.Vector3(x1, y1, z1),
            new THREE.Vector3(x2, y2, z2),
          ]);
        }
      }
    }

    return result;
  }, [neurons]);

  return (
    <group>
      {lines.map((line, idx) => (
        <line key={idx}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                line[0].x, line[0].y, line[0].z,
                line[1].x, line[1].y, line[1].z,
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#8B5CF6" transparent opacity={0.3} />
        </line>
      ))}
    </group>
  );
}

interface BrainVisualizationProps {
  neurons: NeuronActivation[];
  className?: string;
}

export function BrainVisualization({ neurons, className = '' }: BrainVisualizationProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8B5CF6" />

        {/* 10D Dyson Sphere (simplified to 3D orbit) */}
        <DysonSphere />

        {/* Neural connections */}
        <Connections neurons={neurons} />

        {/* Neurons */}
        {neurons.map((activation, idx) => (
          <Neuron key={activation.id} activation={activation} index={idx} />
        ))}

        <OrbitControls
          enableZoom
          enablePan={false}
          minDistance={5}
          maxDistance={15}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
