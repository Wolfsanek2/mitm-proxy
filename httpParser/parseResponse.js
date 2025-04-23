import parseHeaders from './parseHeaders.js';

/**
 * @param {string} response
 */
export default (response) => {
	const [head, body] = response.split('\r\n\r\n');
	const splittedHead = head.split('\r\n');
	const responseLine = splittedHead[0];
	const [, code, message] = responseLine.split(' ');
	const headers = splittedHead.slice(1);

	return {
		code,
		message,
		...parseHeaders(headers),
		body,
	};
};
