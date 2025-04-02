import net from 'node:net';
import http from 'node:http';
import url from 'node:url';
import tls from 'node:tls';
import { generateCert } from './cert-generator.js';

const certs = {};

export const proxy = (() => {
	const proxy = http.createServer();

	// Создаем TLS-сервер с SNI
	const tlsServer = tls.createServer({
		SNICallback: (servername, cb) => {
			console.log(`SNI requested for: ${servername}`);
			generateCert(
				servername,
				(err, ctx) => {
					if (err) return cb(err);
					cb(null, ctx);
				},
				certs,
			);
		},
		rejectUnauthorized: false,
	});

	// Обработка HTTP
	proxy.on('request', (clientReq, clientRes) => {
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
	});

	// Обработка HTTPS через CONNECT
	proxy.on('connect', (clientReq, clientSocket, head) => {
		const [hostname, port] = clientReq.url.split(':');
		const portNumber = port || 443;
		console.log(`CONNECT to ${hostname}:${portNumber}`);

		// Подключаем клиентский сокет к TLS-серверу
		tlsServer.emit('connection', clientSocket);

		// Устанавливаем соединение с целевым сервером
		const serverSocket = net.connect(portNumber, hostname, () => {
			clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');

			// Пайпинг данных между клиентом и сервером
			clientSocket.pipe(serverSocket);
			serverSocket.pipe(clientSocket);

			if (head.length > 0) {
				serverSocket.write(head);
			}
		});

		serverSocket.on('error', (err) => {
			console.error('Server error:', err);
			clientSocket.end();
		});

		clientSocket.on('error', (err) => {
			console.error('Client error:', err);
			serverSocket.end();
		});
	});

	return proxy;
})();
