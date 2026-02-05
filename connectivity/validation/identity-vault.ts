/**
 * ROSOIDEAE Identity Vault
 * Custom authentication with cryptographic verification
 */

import crypto from 'crypto';

interface IdentityRecord {
  vaultId: string;
  identityMarker: string;
  secretPhrase: string;
  privileges: Set<string>;
  creationMoment: number;
}

interface CryptoToken {
  payload: string;
  signature: string;
  expirationMoment: number;
}

export class IdentityVault {
  private secretSalt: Buffer;
  private tokenLifespan: number;
  private knownIdentities: Map<string, IdentityRecord>;

  constructor(masterSecret: string, lifespanHours: number = 48) {
    this.secretSalt = crypto.scryptSync(masterSecret, 'rosoideae-salt', 32);
    this.tokenLifespan = lifespanHours * 3600000;
    this.knownIdentities = new Map();
  }

  registerIdentity(marker: string, secretPhrase: string, privilegeList: string[]): string {
    const vaultId = this.mintIdentifier();
    const scrambledSecret = this.scrambleSecret(secretPhrase);

    const record: IdentityRecord = {
      vaultId,
      identityMarker: marker,
      secretPhrase: scrambledSecret,
      privileges: new Set(privilegeList),
      creationMoment: Date.now()
    };

    this.knownIdentities.set(vaultId, record);
    return vaultId;
  }

  private scrambleSecret(plainSecret: string): string {
    const iterations = 15000;
    const keyLength = 64;
    const digest = 'sha512';
    
    return crypto.pbkdf2Sync(
      plainSecret,
      this.secretSalt,
      iterations,
      keyLength,
      digest
    ).toString('hex');
  }

  verifySecretPhrase(vaultId: string, attemptedPhrase: string): boolean {
    const record = this.knownIdentities.get(vaultId);
    if (!record) return false;

    const scrambledAttempt = this.scrambleSecret(attemptedPhrase);
    return crypto.timingSafeEqual(
      Buffer.from(record.secretPhrase, 'hex'),
      Buffer.from(scrambledAttempt, 'hex')
    );
  }

  mintAccessToken(vaultId: string): CryptoToken | null {
    const record = this.knownIdentities.get(vaultId);
    if (!record) return null;

    const expirationMoment = Date.now() + this.tokenLifespan;
    const payload = JSON.stringify({
      vid: vaultId,
      im: record.identityMarker,
      priv: Array.from(record.privileges),
      exp: expirationMoment
    });

    const signature = this.signPayload(payload);

    return { payload, signature, expirationMoment };
  }

  private signPayload(payload: string): string {
    const hmac = crypto.createHmac('sha256', this.secretSalt);
    hmac.update(payload);
    return hmac.digest('hex');
  }

  validateToken(token: CryptoToken): IdentityRecord | null {
    if (Date.now() > token.expirationMoment) {
      return null;
    }

    const expectedSignature = this.signPayload(token.payload);
    const signatureValid = crypto.timingSafeEqual(
      Buffer.from(token.signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!signatureValid) return null;

    const parsed = JSON.parse(token.payload);
    return this.knownIdentities.get(parsed.vid) || null;
  }

  grantPrivilege(vaultId: string, privilege: string): boolean {
    const record = this.knownIdentities.get(vaultId);
    if (!record) return false;

    record.privileges.add(privilege);
    return true;
  }

  revokePrivilege(vaultId: string, privilege: string): boolean {
    const record = this.knownIdentities.get(vaultId);
    if (!record) return false;

    return record.privileges.delete(privilege);
  }

  checkPrivilege(vaultId: string, requiredPrivilege: string): boolean {
    const record = this.knownIdentities.get(vaultId);
    if (!record) return false;

    return record.privileges.has(requiredPrivilege) || 
           record.privileges.has('administrator');
  }

  private mintIdentifier(): string {
    const randomBytes = crypto.randomBytes(16);
    const timestamp = Date.now().toString(36);
    return `roso_id_${timestamp}_${randomBytes.toString('hex')}`;
  }

  computeVaultStatistics() {
    const privilegeCounts = new Map<string, number>();
    
    this.knownIdentities.forEach(record => {
      record.privileges.forEach(priv => {
        privilegeCounts.set(priv, (privilegeCounts.get(priv) || 0) + 1);
      });
    });

    return {
      totalIdentities: this.knownIdentities.size,
      privilegeDistribution: Object.fromEntries(privilegeCounts)
    };
  }
}
