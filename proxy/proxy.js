import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import url, { fileURLToPath } from 'node:url';
import tls, { createSecureContext } from 'node:tls';
import { generateCertificate } from './cert-generator.js';
import path from 'node:path';
import fs from 'node:fs';
import Stream from 'node:stream';

const SOCKET_TIMEOUT = 10000;

const certCache = {};

const httpRequestHandler = (clientReq, clientRes) => {
	const targetUrl = url.parse(clientReq.url);
	console.log(`HTTP ${clientReq.method} ${targetUrl.href}`);

	const proxyReq = http.request(
		{
			hostname: targetUrl.hostname,
			port: targetUrl.port || 80,
			path: targetUrl.path,
			method: clientReq.method,
			headers: { ...clientReq.headers, host: targetUrl.hostname },
		},
		(proxyRes) => {
			clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
			proxyRes.pipe(clientRes);
		},
	);

	proxyReq.on('error', (err) => {
		console.error('HTTP error:', err);
		clientRes.writeHead(502).end('Proxy error');
	});

	clientReq.pipe(proxyReq);
};

/**
 *
 * @param {InstanceType<Request>} clientReq
 * @param {Stream.Duplex} clientSocket
 * @param {Buffer} head
 */
const httpsRequestHandler = (clientReq, clientSocket, head) => {
	const [hostname, port] = clientReq.url.split(':');
	const portNumber = port || 443;
	console.log(`CONNECT to ${hostname}:${portNumber}`);

	// Генерируем сертификат для домена
	if (!certCache[hostname]) {
		certCache[hostname] = generateCertificate(hostname);
	}
	const { cert, key } = certCache[hostname];

	const serverSocket = net.connect({ host: hostname, port });

	serverSocket.on('connect', () => {
		// console.log('serverSocket: connect');
		clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');

		const serverTlsSocket = tls.connect(
			{
				socket: serverSocket,
				rejectUnauthorized: false,
			},
			() => {
				// console.log('serverTlsSocket: secure connect');
			},
		);
		const clientTlsSocket = new tls.TLSSocket(clientSocket, {
			isServer: true,
			cert,
			key,
			rejectUnauthorized: false,
		});
		clientTlsSocket.pipe(serverTlsSocket);
		serverTlsSocket.pipe(clientTlsSocket);
		if (head.length > 0) {
			clientTlsSocket.write(head);
		}
		serverTlsSocket.on('error', (err) => {
			console.error('serverTlsSocket error:', err);
			clientTlsSocket.end();
		});
		clientTlsSocket.on('error', (err) => {
			console.error('clientTlsSocket error:', err);
			serverTlsSocket.end();
		});
		// serverTlsSocket.on('data', (data) => {
		// 	console.log(`serverTlsSocket data:\n ${data.toString('utf-8')}\n`);
		// 	// fs.appendFile('serverSocketLog.txt', data, () => {});
		// });

		// clientTlsSocket.on('data', (data) => {
		// 	console.log(`clientTlsSocket data:\n ${data.toString('utf-8')}\n`);
		// 	// fs.appendFile('clientSocketLog.txt', data, () => {});
		// });
	});

	serverSocket.on('error', (err) => {
		console.error('serverSocket error:', err);
		clientSocket.end();
	});

	clientSocket.on('error', (err) => {
		console.error('clientSocket error:', err);
		serverSocket.end();
	});
};

export const proxy = (() => {
	const proxy = http.createServer();

	proxy.on('request', httpRequestHandler);

	try {
		proxy.on('connect', httpsRequestHandler);
	} catch (err) {
		console.error('https connect error:', err);
	}

	return proxy;
})();
