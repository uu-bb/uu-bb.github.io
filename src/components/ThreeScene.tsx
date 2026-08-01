import { Bounds, Clone, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { assetPath } from '../utils/assets'

function CharacterModel() {
  const { scene } = useGLTF(assetPath('models/sleepy-boy.glb'))
  return (
    <Bounds fit clip observe margin={1.15}>
      <Clone object={scene} />
    </Bounds>
  )
}

export default function ThreeScene() {
  return (
    <Canvas
      className="three-canvas"
      camera={{ position: [0, 1.2, 4], fov: 32 }}
      dpr={[1, 1.5]}
      fallback={
        <img
          className="lab-poster"
          src={assetPath('character/sleepy-boy-3d-poster.webp')}
          alt="睡眼角色静态预览"
          width="640"
          height="853"
        />
      }
    >
      <color attach="background" args={['#4d5048']} />
      <ambientLight intensity={2.2} />
      <directionalLight position={[3, 5, 4]} intensity={3.2} />
      <directionalLight position={[-4, 2, -3]} intensity={1.1} color="#a9e4ed" />
      <Suspense fallback={null}>
        <CharacterModel />
      </Suspense>
      <OrbitControls
        enablePan={false}
        minDistance={2.2}
        maxDistance={6}
        autoRotate
        autoRotateSpeed={0.55}
      />
    </Canvas>
  )
}
