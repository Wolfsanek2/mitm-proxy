import parseBody from './parseBody.js';
import parseHeaders from './parseHeaders.js';

/**
 * @param {Buffer<ArrayBuffer>} request
 * @param {number} port
 */
export default (request, port = 443) => {
	const headerEnd = request.indexOf('\r\n\r\n');
	const head = request.subarray(0, headerEnd).toString('utf-8');
	const body = request.subarray(headerEnd + 4).toString('utf-8');
	const splittedHead = head.split('\r\n');
	const requestLine = splittedHead[0];
	const [method, url] = requestLine.split(' ');
	const headers = splittedHead.slice(1);
	const parsedHeaders = parseHeaders(headers);
	const contentType = parsedHeaders.headers['Content-Type'];
	delete parsedHeaders.headers['Accept-Encoding'];

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
