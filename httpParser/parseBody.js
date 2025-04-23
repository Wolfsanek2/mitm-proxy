/**
 * @param {string} body
 * @param {string} contentType
 */
export default (body, contentType) => {
	if (contentType === 'application/x-www-form-urlencoded') {
		return body.split('\r\n').map((pair) => {
			const [key, value] = pair.split('=').map(decodeURIComponent);
			return { [key]: value };
		});
	}
	return body;
};
