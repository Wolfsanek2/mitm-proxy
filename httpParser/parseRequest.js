import parseBody from './parseBody.js';
import parseHeaders from './parseHeaders.js';

/**
 * @param {string} request
 * @param {port} port
 */
export default (request, port = 443) => {
	const [head, body] = request.split('\r\n\r\n');
	const splittedHead = head.split('\r\n');
	const requestLine = splittedHead[0];
	const [method, url] = requestLine.split(' ');
	const headers = splittedHead.slice(1);
	const parsedHeaders = parseHeaders(headers);
	const contentType = parsedHeaders['Content-Type'];

	const host = parsedHeaders.headers['Host'];
	const urlObject = new URL(url, `http${port === 443 ? 's' : ''}://${host}`);
	const path = urlObject.pathname;
	const searchParams = {};
	urlObject.searchParams.forEach((value, key) => (searchParams[key] = value));

	return {
		method,
		path,
		searchParams,
		...parsedHeaders,
		body: parseBody(body, contentType),
	};
};
