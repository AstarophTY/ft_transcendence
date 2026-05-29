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

    return (
        <group>
            {/* The Base Planet Cube */}
            <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#9ca3af" />
            </mesh>

            {/* The Miniature Voxel Map */}
            <group position={[0, 0.5, 0]}>
                {previewVoxels.map((voxel, index) => {
                    const color = voxel.block === Block.Stone ? '#9ca3af' : '#fbbf24';

                    return (
                        <mesh
                            key={index}
                            position={[
                                (voxel.x * scale) - 0.5 + (scale / 2),
                                (voxel.y * scale) / 2 - 0.01, // Center the Y position based on height
                                (voxel.z * scale) - 0.5 + (scale / 2)
                            ]}
                        >
                            <boxGeometry args={[scale, voxel.y * scale, scale]}/>
                            <meshStandardMaterial color={color}/>
                        </mesh>
                    );
                })}
            </group>
        </group>
    );
}

export default SelectablePlanet;