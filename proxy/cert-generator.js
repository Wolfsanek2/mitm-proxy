import path from 'node:path';
import fs from 'node:fs';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import tls from 'node:tls';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT_DIR = path.resolve(__dirname, '../');

const GET_CERT_SCRIPT = path.resolve(__dirname, '../cmd/get_cert.sh');
console.log('GET_CERT_SCRIPT:', GET_CERT_SCRIPT);

const CERTS_DIR = path.resolve(__dirname, '../certs');
console.log('CERTS_DIR:', CERTS_DIR);

const keyPath = path.join(ROOT_DIR, 'cert.key');
console.log('keyPath:', keyPath);

// export const generateCert = (servername, cb, certs) => {
// 	console.log(`gen cert ${servername}`);
// 	let gen_cert = spawn('./gen_cert.sh', [
// 		servername,
// 		Math.floor(Math.random() * 1000000000000),
// 	]);

// 	gen_cert.stdout.once('data', (data) => {
// 		certs[servername] = data;
// 		let ctx = createSecureContext(data);
// 		cb(null, ctx);
// 		fs.writeFile(`certs/${servername}.crt`, data, (err) => {
// 			if (err) {
// 				console.log(err.message);
// 			}
// 		});
// 	});

// 	gen_cert.stderr.on('data', (data) => {
// 		console.log(`cert gen stderr: ${data}`);
// 	});
// };

const key = fs.readFileSync(keyPath);

const createSecureContext = (cert) => {
	return tls.createSecureContext({ cert, key });
};

export const generateCert = (domain, callback, certs) => {
	try {
		const { cert, key } = generateCertForDomain(domain, callback, certs);
		const ctx = tls.createSecureContext({ cert, key });
		callback(null, ctx);
	} catch (err) {
		console.error('generateCert error:', err);
		callback(err);
	}
};

const generateCertForDomain = (servername, cb, certs) => {
	console.log(`gen cert ${servername}`);
	console.log('GET_CERT_SCRIPT:', GET_CERT_SCRIPT);
	let gen_cert = spawn(GET_CERT_SCRIPT, [
		servername,
		Math.floor(Math.random() * 1000000000000),
	]);

	let cert;
	gen_cert.stdout.once('data', (data) => {
		certs[servername] = data;
		let ctx = createSecureContext(data);
		cb(null, ctx);
		fs.writeFile(
			path.resolve(__dirname, `../certs/${servername}.crt`),
			data,
			(err) => {
				if (err) {
					console.log(err.message);
				}
			},
		);
		cert = data;
		console.log(`cert for ${servername} generated`);
	});

	gen_cert.stderr.on('data', (data) => {
		console.log(`cert gen stderr: ${data}`);
	});

	return { cert, key };
};
