import { PlanetMap } from "../../../models/maps/PlanetMap.ts";
import React, { useMemo, useRef } from "react";
import { Block } from "../../../models/Block.ts";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SelectablePlanetProps {
    map: PlanetMap
}

const SelectablePlanet: React.FC<SelectablePlanetProps> = ({ map }) => {
    const planetRef = useRef<THREE.Group>(null);

    const factor = 16;
    const previewVoxels = useMemo(() => map.getPreview(factor), [map]);
    const scale = 1 / factor;
    const half = 0.5;
    const inset = 0.01;
    const minHeight = useMemo(() => {
        if (previewVoxels.length === 0) {
            return 0;
        }

        return previewVoxels.reduce((lowest, voxel) => Math.min(lowest, voxel.y), previewVoxels[0]!.y);
    }, [previewVoxels]);

    const getHeight = (voxelHeight: number) => Math.max(0, voxelHeight - minHeight) * scale;

    useFrame((state, delta) => {
        if (!planetRef.current) return;

        const distance = Math.sqrt(state.pointer.x ** 2 + state.pointer.y ** 2);
        const magneticRadius = 0.5;

        let targetRotationX = 0;
        let targetRotationY = 0;

        if (distance < magneticRadius) {
            const pullStrength = 1 - (distance / magneticRadius);
            const maxTilt = 0.6;

            targetRotationX = -state.pointer.y * pullStrength * maxTilt;
            targetRotationY = state.pointer.x * pullStrength * maxTilt;
        }

        planetRef.current.rotation.x = THREE.MathUtils.lerp(planetRef.current.rotation.x, targetRotationX, delta * 8);
        planetRef.current.rotation.y = THREE.MathUtils.lerp(planetRef.current.rotation.y, targetRotationY, delta * 8);
    });

    return (
        <group ref={planetRef}>
            <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#9ca3af" />
            </mesh>

            <group position={[0, 0.5, 0]}>
                {previewVoxels.map((voxel, index) => {
                    const color = voxel.block === Block.Stone ? '#9ca3af' : '#fbbf24';
                    const voxelHeight = getHeight(voxel.y);

                    if (voxelHeight <= 0) {
                        return null;
                    }

                    return (
                        <mesh
                            key={index}
                            position={[
                                (voxel.x * scale) - half + (scale / 2),
                                voxelHeight / 2 - inset,
                                (voxel.z * scale) - half + (scale / 2)
                            ]}
                        >
                            <boxGeometry args={[scale, voxelHeight, scale]}/>
                            <meshStandardMaterial color={color}/>
                        </mesh>
                    );
                })}
            </group>

            <group position={[0.5, 0, 0]}>
                {previewVoxels.map((voxel, index) => {
                    const color = voxel.block === Block.Stone ? '#9ca3af' : '#fbbf24';
                    const voxelHeight = getHeight(voxel.y);

                    if (voxelHeight <= 0) {
                        return null;
                    }

                    return (
                        <mesh
                            key={`right-${index}`}
                            position={[
                                voxelHeight / 2 - inset,
                                (voxel.z * scale) - half + (scale / 2),
                                (voxel.x * scale) - half + (scale / 2)
                            ]}
                        >
                            <boxGeometry args={[voxelHeight, scale, scale]}/>
                            <meshStandardMaterial color={color}/>
                        </mesh>
                    );
                })}
            </group>

            <group position={[0, 0, 0.5]}>
                {previewVoxels.map((voxel, index) => {
                    const color = voxel.block === Block.Stone ? '#9ca3af' : '#fbbf24';
                    const voxelHeight = getHeight(voxel.y);

                    if (voxelHeight <= 0) {
                        return null;
                    }

                    return (
                        <mesh
                            key={`front-${index}`}
                            position={[
                                (voxel.x * scale) - half + (scale / 2),
                                (voxel.z * scale) - half + (scale / 2),
                                voxelHeight / 2 - inset
                            ]}
                        >
                            <boxGeometry args={[scale, scale, voxelHeight]}/>
                            <meshStandardMaterial color={color}/>
                        </mesh>
                    );
                })}
            </group>
        </group>
    );
}

export default SelectablePlanet;