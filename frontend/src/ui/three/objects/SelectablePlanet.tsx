import { PlanetMap } from "../../../models/maps/PlanetMap.ts";
import React, { useMemo, useRef } from "react";
import { Block } from "../../../models/Block.ts";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SelectablePlanetProps {
    map: PlanetMap
}

const SelectablePlanet: React.FC<SelectablePlanetProps> = ({ map }) => {
    const planetRef = useRef<THREE.Group>(null);
    const hoverTarget = useRef(new THREE.Vector2(0, 0));
    const isHovered = useRef(false);
    const currentHover = useRef(new THREE.Vector2(0, 0));

    const baseQuaternion = useMemo(
        () => new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, -Math.PI / 4, -0.2, 'YXZ')),
        []
    );
    const hoverQuaternion = useMemo(() => new THREE.Quaternion(), []);
    const hoverEuler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), []);

    const factor = 16;
    const previewVoxels = useMemo(() => map.getPreview(factor), [map]);
    const scale = 1 / factor;
    const half = 0.5;
    const inset = 0.01;
    const hitboxSize = 1.4;
    const minHeight = useMemo(() => {
        if (previewVoxels.length === 0) {
            return 0;
        }

        return previewVoxels.reduce((lowest, voxel) => Math.min(lowest, voxel.y), previewVoxels[0]!.y);
    }, [previewVoxels]);

    const getHeight = (voxelHeight: number) => Math.max(0, voxelHeight - minHeight) * scale;

    const updateHoverTarget = (event: ThreeEvent<PointerEvent>) => {
        if (!planetRef.current) return;

        const localPoint = planetRef.current.worldToLocal(event.point.clone());
        hoverTarget.current.set(
            THREE.MathUtils.clamp(localPoint.x / (hitboxSize / 2), -1, 1),
            THREE.MathUtils.clamp(localPoint.y / (hitboxSize / 2), -1, 1),
        );
    };

    useFrame((_, delta) => {
        if (!planetRef.current) return;

        const targetX = isHovered.current ? -hoverTarget.current.y * 0.3 : 0;
        const targetY = isHovered.current ? hoverTarget.current.x * 0.3 : 0;

        currentHover.current.x = THREE.MathUtils.lerp(currentHover.current.x, targetX, delta * 8);
        currentHover.current.y = THREE.MathUtils.lerp(currentHover.current.y, targetY, delta * 8);

        hoverEuler.set(currentHover.current.x, currentHover.current.y, 0);
        hoverQuaternion.setFromEuler(hoverEuler);
        planetRef.current.quaternion.copy(hoverQuaternion).multiply(baseQuaternion);
    });

    return (
        <group ref={planetRef}>
            <mesh
                onPointerEnter={(event) => {
                    event.stopPropagation();
                    isHovered.current = true;
                    updateHoverTarget(event);
                }}
                onPointerMove={(event) => {
                    event.stopPropagation();
                    isHovered.current = true;
                    updateHoverTarget(event);
                }}
                onPointerOut={(event) => {
                    event.stopPropagation();
                    isHovered.current = false;
                    hoverTarget.current.set(0, 0);
                }}
            >
                <boxGeometry args={[hitboxSize, hitboxSize, hitboxSize]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

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