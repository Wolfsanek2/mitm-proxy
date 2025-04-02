import net from 'node:net';
import http from 'node:http';
import url from 'node:url';
import tls from 'node:tls';
import fs from 'node:fs';
// import { getCertForDomain } from './cert-generator.js';

const CERT_PATH = './cert.crt';
const KEY_PATH = './cert.key';
const CA_PATH = './ca.crt';

// const cert = fs.readFileSync(CERT_PATH);
const key = fs.readFileSync(KEY_PATH);
const ca = fs.readFileSync(CA_PATH);

export const proxy = (() => {
	const proxy = http.createServer();

	// Обработка обычных HTTP-запросов
	proxy.on('request', (clientReq, clientRes) => {
		console.log('request');
		const targetUrl = url.parse(clientReq.url);

		const options = {
			hostname: targetUrl.hostname,
			port: targetUrl.port || 80,
			path: targetUrl.path,
			method: clientReq.method,
			headers: clientReq.headers,
		};

		const proxyReq = http.request(options, (proxyRes) => {
			clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
			proxyRes.pipe(clientRes);
		});

		proxyReq.on('error', (err) => {
			console.error('HTTP proxy error:', err);
			clientRes.writeHead(500);
			clientRes.end('Proxy error');
		});

		clientReq.pipe(proxyReq);
	});

	// Обработка HTTPS-запросов через CONNECT
	proxy.on('connect', (clientReq, clientSocket, head) => {
		const [hostname, port] = clientReq.url.split(':');
		const portNumber = port || 443;

		console.log(`CONNECT to ${hostname}:${portNumber}`);

		const { key, cert } = getCertForDomain(hostname);
		const clientTlsSocket = tls.connect(
			{
				socket: clientSocket,
				servername: hostname,
				key,
				cert,
				rejectUnauthorized: false,
			},
			() => {
				const serverTlsSocket = tls.connect(
					{
						host: hostname,
						port: 443,
						rejectUnauthorized: false,
					},
					() => {
						clientSocket.write(
							'HTTP/1.1 200 Connection Established\r\n\r\n',
						);
						clientTlsSocket.pipe(serverTlsSocket);
						serverTlsSocket.pipe(clientTlsSocket);
					},
				);
			},
		);

		proxySocket.on('close', () => {
			console.log('HTTPS socket closed');
		});

		clientSocket.on('close', () => {
			console.log('Client socket closed');
		});

		proxySocket.on('error', (err) => {
			console.log('HTTPS proxy error:', err);
			clientSocket.end();
		});

		clientSocket.on('error', (err) => {
			console.log('Client socket error:', err);
			proxySocket.end();
		});
	});
	return proxy;
})();
