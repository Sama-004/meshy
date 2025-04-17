"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

function Model({ url }: { url: string }) {
  const group = useRef();
  const { scene } = useGLTF(url);

  useFrame(() => {
    // Optional animation
    group.current.rotation.y += 0.005;
  });

  return <primitive object={scene} ref={group} />;
}

export default function ModelViewer({ modelPath }: { modelPath: string }) {
  return (
    <div style={{ height: "500px", width: "100%" }}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Model url={modelPath} />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
