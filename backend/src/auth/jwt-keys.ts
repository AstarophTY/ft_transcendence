import { ConfigService } from '@nestjs/config';

/**
 * JWTs are signed asymmetrically (RS256): the backend holds the RSA **private
 * key** to sign tokens, and verification only needs the **public key**. This is
 * stronger than a shared HS256 secret — a leaked verification key cannot forge
 * tokens — and lets any service verify a token without holding signing power.
 *
 * Keys are provided through env (`JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`). To stay
 * `.env`-friendly (single line) they may be base64-encoded PEM; a raw PEM
 * (multiline, or with literal `\n`) is also accepted. Generate them with
 * `scripts/gen-jwt-keys.sh`.
 */
export const JWT_ALGORITHM = 'RS256' as const;

function decodePem(value: string): string {
  const trimmed = value.trim();
  // Raw PEM passed directly (possibly with escaped newlines from .env).
  if (trimmed.includes('-----BEGIN')) {
    return trimmed.replace(/\\n/g, '\n');
  }
  // Otherwise assume base64-encoded PEM.
  return Buffer.from(trimmed, 'base64').toString('utf8');
}

export function getJwtPrivateKey(config: ConfigService): string {
  const raw = config.get<string>('JWT_PRIVATE_KEY');
  if (!raw) {
    throw new Error(
      'JWT_PRIVATE_KEY is not set — run scripts/gen-jwt-keys.sh to generate the RSA key pair',
    );
  }
  return decodePem(raw);
}

export function getJwtPublicKey(config: ConfigService): string {
  const raw = config.get<string>('JWT_PUBLIC_KEY');
  if (!raw) {
    throw new Error(
      'JWT_PUBLIC_KEY is not set — run scripts/gen-jwt-keys.sh to generate the RSA key pair',
    );
  }
  return decodePem(raw);
}
