import zlib from 'zlib';
import parseHeaders from './parseHeaders.js';

function removeChunkedEncoding(data) {
	const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'binary');
	let position = 0;
	let result = Buffer.alloc(0);

	while (position < buffer.length) {
		const lineEnd = buffer.indexOf('\r\n', position);
		const chunkSize = parseInt(
			buffer.toString('ascii', position, lineEnd),
			16,
		);
		position = lineEnd + 2;

		if (chunkSize === 0) break;

		result = Buffer.concat([
			result,
			buffer.subarray(position, position + chunkSize),
		]);
		position += chunkSize + 2;
	}

	// console.log('result:', result.subarray(0, 10));
	return result;
}

/**
 * @param {Buffer<ArrayBuffer>} response
 */
export default (response) => {
	const headerEnd = response.indexOf('\r\n\r\n');
	const head = response.subarray(0, headerEnd).toString('utf-8');
	let body = removeChunkedEncoding(response.subarray(headerEnd + 4));
	const splittedHead = head.split('\r\n');
	const responseLine = splittedHead[0];
	const [, code, message] = responseLine.split(' ');
	const headers = splittedHead.slice(1);

	const parsedHeaders = headers.reduce((result, pair) => {
		const [key, value] = pair.split(': ');
		result[key] = value;
		return result;
	}, {});
	if (parsedHeaders['Content-Encoding'] === 'gzip') {
		console.log('Content-Encoding: gzip');
		body = zlib.gunzipSync(body);
	}
	body = body.toString('utf-8');

	return {
		code,
		message,
		...parseHeaders(headers),
		body,
	};
};
