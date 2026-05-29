import { IslandMap } from "./terrain/IslandMap";

export { IslandMap };
export type { MapConfig } from "./terrain/MapConfig";
export { Perlin2D } from "./noise/Perlin2D";

if (require.main === module) {
    const testMap = new IslandMap({
        seed: "test-dev",
        mapSize: 100,
        maxHeight: 10,
        scale: 0.1
    });

    const asciiChars = [' ', '.', ',', '-', '=', '+', '*', '#', '%', '@'];

    for (let z = 0; z < 100; z++) {
        let rowString = "";
        for (let x = 0; x < 100; x++) {
            const h = testMap.getHeightAt(x, z);
            rowString += asciiChars[h];
        }
        console.log(rowString);
    }

    console.log(testMap)
}