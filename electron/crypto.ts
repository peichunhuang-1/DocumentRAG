import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

const iterations = 100000;
const keyLength = 32; 
const digest = 'sha256';
const encryptionAlgorithm = 'aes-256-cbc';
const __root__ = process.env.HOME || process.env.USERPROFILE;
const __dir__ = path.join(__root__ || "/", '.research.go', 'users');

function ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function saveUserData(user_name: string, publicKey: string, encryptedPrivateKey: string, salt: string, iv: string): boolean {
    const userDir = path.join(__dir__, user_name);

    ensureDirectoryExists(userDir);

    const userData = { publicKey, encryptedPrivateKey, salt, iv };
    const filePath = path.join(userDir, 'user_data.json');

    if (fs.existsSync(filePath)) {
        console.error('User name already used');
        return false;
    } else {
        fs.writeFileSync(filePath, JSON.stringify(userData), 'utf-8');
        return true;
    }
}

function loadUserData(user_name: string) {
    const userDir = path.join(__dir__, user_name);
    const filePath = path.join(userDir, 'user_data.json');

    if (!fs.existsSync(filePath)) {
        throw new Error(`User ${user_name} not found.`);
    }

    const userData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(userData);
}

function generateKeyPair(): { privateKey: string, publicKey: string } {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: 'secp521r1',
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    return { privateKey, publicKey };
}

function deriveKey(password: string, salt: string): Buffer {
    return crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest);
}

function encryptPrivateKey(privateKey: string, derivedKey: Buffer): { encryptedPrivateKey: string, iv: string } {
    const iv = crypto.randomBytes(16); 
    const cipher = crypto.createCipheriv(encryptionAlgorithm, derivedKey, iv);
    
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return { encryptedPrivateKey: encrypted, iv: iv.toString('hex') };
}

function decryptPrivateKey(encryptedPrivateKey: string, derivedKey: Buffer, iv: string): string {
    const decipher = crypto.createDecipheriv(encryptionAlgorithm, derivedKey, Buffer.from(iv, 'hex'));
    
    let decrypted = decipher.update(encryptedPrivateKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

export function registerUser(user_name: string, password: string): boolean {
    const salt = crypto.randomBytes(16).toString('hex');
    const { privateKey, publicKey } = generateKeyPair();
    const derivedKey = deriveKey(password, salt);
    
    const { encryptedPrivateKey, iv } = encryptPrivateKey(privateKey, derivedKey);
    
    return saveUserData(user_name, publicKey, encryptedPrivateKey, salt, iv);
}

export function validateUser(user_name: string, password: string): boolean {
    try {
        const user = loadUserData(user_name);
        const derivedKey = deriveKey(password, user.salt);

        let privateKey;
        try {
            privateKey = decryptPrivateKey(user.encryptedPrivateKey, derivedKey, user.iv);
        } catch (error) {
            console.error('Invalid password or corrupted data');
            return false;
        }

        const challenge = crypto.randomBytes(32).toString('hex');

        const sign = crypto.createSign('SHA256');
        sign.update(challenge);
        sign.end();
        const signature = sign.sign(privateKey, 'hex');

        const verify = crypto.createVerify('SHA256');
        verify.update(challenge);
        verify.end();

        return verify.verify(user.publicKey, signature, 'hex');
    } catch (error) {
        console.error('Validation failed:', error);
        return false;
    }
}
