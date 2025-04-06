import path from 'node:path';
import fs from 'node:fs';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import tls from 'node:tls';
import forge from 'node-forge';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT_DIR = path.resolve(__dirname, '../');

const GET_CERT_SCRIPT = path.resolve(__dirname, '../cmd/get_cert.sh');

const CERTS_DIR = path.resolve(__dirname, '../certs');

const keyPath = path.join(ROOT_DIR, 'cert.key');

const CA_CERT_PATH = path.resolve(__dirname, '../ca.crt');
const CA_KEY_PATH = path.resolve(__dirname, '../ca.key');

const caCert = forge.pki.certificateFromPem(fs.readFileSync(CA_CERT_PATH));
const caKey = forge.pki.privateKeyFromPem(fs.readFileSync(CA_KEY_PATH));

export const generateCertificate = (hostname) => {
	const keys = forge.pki.rsa.generateKeyPair(2048);
	const cert = forge.pki.createCertificate();

	cert.publicKey = keys.publicKey;
	cert.serialNumber = Date.now().toString();
	cert.validity.notBefore = new Date();
	cert.validity.notAfter = new Date();
	cert.validity.notAfter.setFullYear(
		cert.validity.notBefore.getFullYear() + 1,
	);

	cert.setSubject([{ name: 'commonName', value: hostname }]);
	cert.setIssuer(caCert.subject.attributes);

	const extensions = [
		{
			name: 'basicConstraints',
			cA: false,
		},
		{
			name: 'keyUsage',
			digitalSignature: true,
			keyEncipherment: true,
			nonRepudiation: true,
		},
		{
			name: 'extKeyUsage',
			serverAuth: true,
		},
		{
			name: 'subjectAltName',
			altNames: [
				{
					type: 2, // DNS
					value: hostname,
				},
			],
		},
	];

	// Добавляем расширения по одному
	extensions.forEach((ext) => {
		cert.setExtensions([ext]);
	});

	cert.sign(caKey, forge.md.sha256.create());

	const result = {
		key: forge.pki.privateKeyToPem(keys.privateKey),
		cert: forge.pki.certificateToPem(cert),
	};
	return result;
};
