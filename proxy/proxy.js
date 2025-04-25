import net from 'node:net';
import http from 'node:http';
import url from 'node:url';
import tls from 'node:tls';
import { generateCertificate } from './cert-generator.js';
import Stream from 'node:stream';
import parseRequest from '../httpParser/parseRequest.js';
import parseResponse from '../httpParser/parseResponse.js';
import db from '../db/db.js';

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
		let requestData = Buffer.alloc(0);
		let responseData = Buffer.alloc(0);
		serverTlsSocket.on('data', (data) => {
			responseData = Buffer.concat([responseData, data]);
		});
		clientTlsSocket.on('data', (data) => {
			requestData = Buffer.concat([requestData, data]);
		});
		const requestToSave = {};
		serverTlsSocket.on('end', () => {
			const response = parseResponse(responseData);
			requestToSave.response = response;
			if (requestToSave.request) {
				db.insert(requestToSave.request, requestToSave.response);
			}
		});
		clientTlsSocket.on('end', () => {
			const request = parseRequest(requestData);
			requestToSave.request = request;
			if (requestToSave.response) {
				db.insert(requestToSave.request, requestToSave.response);
			}
		});
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
