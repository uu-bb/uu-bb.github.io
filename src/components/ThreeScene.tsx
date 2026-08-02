import { OrbitControls } from '@react-three/drei'
import { Canvas, useLoader } from '@react-three/fiber'
import { Suspense } from 'react'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { assetPath } from '../utils/assets'

function CharacterModel() {
  const { scene } = useLoader(GLTFLoader, assetPath('models/sleepy-boy.glb'))
  return <primitive object={scene} />
}

export default function ThreeScene() {
  return (
    <Canvas
      className="three-canvas"
      camera={{ position: [0, 0.52, 2.2], fov: 28 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = SRGBColorSpace
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1.08
      }}
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
      <hemisphereLight args={['#fff3d6', '#17242d', 2.4]} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[3, 5, 4]} intensity={3.4} color="#fff2cf" />
      <directionalLight position={[-4, 2, -3]} intensity={1.35} color="#8fd7f2" />
      <Suspense fallback={null}>
        <CharacterModel />
      </Suspense>
      <OrbitControls
        target={[0, 0.49, 0]}
        enablePan={false}
        minDistance={1.6}
        maxDistance={4.5}
        autoRotate
        autoRotateSpeed={0.55}
      />
    </Canvas>
  )
}
