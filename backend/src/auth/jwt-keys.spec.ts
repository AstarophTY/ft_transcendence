import { strict as assert } from 'node:assert';
import { generateKeyPairSync } from 'node:crypto';
import { describe, it } from 'node:test';
import { ConfigService } from '@nestjs/config';
import { JWT_ALGORITHM, getJwtPrivateKey, getJwtPublicKey } from './jwt-keys';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

/** Stub ConfigService returning a fixed env map. */
function makeConfig(values: Record<string, string | undefined>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

describe('jwt-keys', () => {
  it('uses RS256', () => {
    assert.equal(JWT_ALGORITHM, 'RS256');
  });

  it('decodes a base64-encoded PEM private key', () => {
    const config = makeConfig({
      JWT_PRIVATE_KEY: Buffer.from(privateKey).toString('base64'),
    });
    assert.equal(getJwtPrivateKey(config), privateKey);
  });

  it('decodes a base64-encoded PEM public key', () => {
    const config = makeConfig({
      JWT_PUBLIC_KEY: Buffer.from(publicKey).toString('base64'),
    });
    assert.equal(getJwtPublicKey(config), publicKey);
  });

  it('accepts a raw PEM with escaped newlines', () => {
    const config = makeConfig({
      JWT_PUBLIC_KEY: publicKey.replace(/\n/g, '\\n'),
    });
    assert.equal(getJwtPublicKey(config), publicKey);
  });

  it('throws a helpful error when the key is missing', () => {
    const config = makeConfig({});
    assert.throws(() => getJwtPrivateKey(config), /JWT_PRIVATE_KEY is not set/);
    assert.throws(() => getJwtPublicKey(config), /JWT_PUBLIC_KEY is not set/);
  });
});
