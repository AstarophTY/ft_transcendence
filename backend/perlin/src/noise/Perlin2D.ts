import pseudorandom from 'seedrandom';

export class Perlin2D {
    private p: Uint8Array;

    constructor(seed: string) {
        // Initialize the seeded random number generator
        const rng = pseudorandom(seed);

        this.p = new Uint8Array(512);
        const permutation = new Uint8Array(256);

        // Fill array with values 0-255
        for (let i = 0; i < 256; i++) {
            permutation[i] = i;
        }

        // Fisher-Yates shuffle using our seeded rng
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            const temp = permutation[i]!;
            permutation[i] = permutation[j]!;
            permutation[j] = temp;
        }

        // Duplicate the array to avoid modulo operations later
        for (let i = 0; i < 256; i++) {
            this.p[i] = permutation[i]!;
            this.p[i + 256] = permutation[i]!;
        }
    }

    // Smoothes the input coordinate to prevent blocky artifacts
    private fade(t: number): number {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    // Linear interpolation
    private lerp(t: number, a: number, b: number): number {
        return a + t * (b - a);
    }

    // Calculates the dot product of the distance and gradient vectors
    private grad(hash: number, x: number, y: number): number {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    /**
     * Retrieves the raw Perlin noise value for 2D coordinates.
     * @returns A value strictly between -1.0 and 1.0
     */
    public getNoise(x: number, y: number): number {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);

        const u = this.fade(x);
        const v = this.fade(y);

        const A = this.p[X]! + Y;
        const B = this.p[X + 1]! + Y;

        return this.lerp(v,
            this.lerp(u, this.grad(this.p[A]!, x, y), this.grad(this.p[B]!, x - 1, y)),
            this.lerp(u, this.grad(this.p[A + 1]!, x, y - 1), this.grad(this.p[B + 1]!, x - 1, y - 1))
        );
    }
}