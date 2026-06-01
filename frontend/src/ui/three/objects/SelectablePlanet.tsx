import { PlanetMap } from "../../../models/maps/PlanetMap.ts";
import React, { useMemo, useRef, useState } from "react";
import { Block } from "../../../models/Block.ts";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePlanetStore } from "../../../store/planetStore.ts";

interface SelectablePlanetProps {
    map: PlanetMap;
    index: number;
    totalCount: number;
}

const SelectablePlanet: React.FC<SelectablePlanetProps> = ({ map, index, totalCount }) => {
    const planetRef = useRef<THREE.Group>(null);
    const blendRef = useRef(0);
    const [hovered, setHovered] = useState(false);

    const baseQuaternion = useMemo(
        () => new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, -Math.PI / 4, -0.2, 'YXZ')),
        []
    );

    const animQuaternion = useMemo(() => new THREE.Quaternion(), []);
    const animEuler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), []);

    const factor = 16;
    const previewVoxels = useMemo(() => map.getPreview(factor), [map]);
    const scale = 1 / factor;
    const half = 0.5;
    const inset = 0.01;
    const minHeight = useMemo(() => {
        if (previewVoxels.length === 0) return 0;
        return previewVoxels.reduce((lowest, voxel) => Math.min(lowest, voxel.y), previewVoxels[0]!.y);
    }, [previewVoxels]);

    const getHeight = (voxelHeight: number) => Math.max(0, voxelHeight - minHeight) * scale;

    useFrame((state) => {
        if (!planetRef.current) return;

        const focusedIndex = usePlanetStore.getState().targetOffset * (totalCount - 1);
        const dist = Math.abs(index - focusedIndex);
        const snappedDist = dist < 0.5 ? 0 : dist - 0.5;
        const focusFactor = Math.max(0, 1 - snappedDist * 0.5);

        const currentScale = planetRef.current.scale.x;
        const targetScale = 0.35 + focusFactor * 0.65;
        const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.3);
        planetRef.current.scale.setScalar(newScale);

        const targetBlend = hovered && focusFactor > 0.5 ? 1 : 0;
        blendRef.current = THREE.MathUtils.lerp(blendRef.current, targetBlend, 0.08);

        const t = state.clock.getElapsedTime();
        const pitch = Math.sin(t * 0.8) * 0.12 * blendRef.current;
        const yaw = Math.cos(t * 0.6) * 0.15 * blendRef.current;
        animEuler.set(pitch, yaw, 0);
        animQuaternion.setFromEuler(animEuler);
        planetRef.current.quaternion.copy(animQuaternion).multiply(baseQuaternion);
        planetRef.current.position.y = Math.sin(t * 1.2) * 0.05 * blendRef.current;
    });

    return (
        <group ref={planetRef}>
            {/* Cube central */}
            <mesh
                onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
                onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
            >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#9ca3af" />
            </mesh>

            {/* Face Top */}
            <group position={[0, 0.5, 0]}>
                {previewVoxels.map((voxel, index) => {
                    const color = voxel.block === Block.Stone ? '#9ca3af' : '#fbbf24';
                    const voxelHeight = getHeight(voxel.y);
                    if (voxelHeight <= 0) return null;

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

            {/* Face Right */}
            <group position={[0.5, 0, 0]}>
                {previewVoxels.map((voxel, index) => {
                    const color = voxel.block === Block.Stone ? '#9ca3af' : '#fbbf24';
                    const voxelHeight = getHeight(voxel.y);
                    if (voxelHeight <= 0) return null;

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

            {/* Face Front */}
            <group position={[0, 0, 0.5]}>
                {previewVoxels.map((voxel, index) => {
                    const color = voxel.block === Block.Stone ? '#9ca3af' : '#fbbf24';
                    const voxelHeight = getHeight(voxel.y);
                    if (voxelHeight <= 0) return null;

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