/* eslint-disable react/no-unknown-property */

import { PlanetMap } from "../../../models/maps/PlanetMap.ts";
import React, { useMemo } from "react";
import { Block } from "../../../models/Block.ts";

interface SelectablePlanetProps {
    map: PlanetMap
}

const SelectablePlanet: React.FC<SelectablePlanetProps> = ({ map }) => {
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

    return (
        <group>
            {/* The Base Planet Cube */}
            <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#9ca3af" />
            </mesh>

            {/* Top face projection */}
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

            {/* Right face projection */}
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

            {/* Front face projection */}
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