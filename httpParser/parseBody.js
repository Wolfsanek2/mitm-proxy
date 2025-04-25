/**
 * @param {string} body
 * @param {string} contentType
 */
export default (body, contentType) => {
	if (contentType === 'application/x-www-form-urlencoded') {
		return body.split('&').reduce((result, pair) => {
			const [key, value] = pair.split('=').map(decodeURIComponent);
			result[key] = value;
			return result;
		}, {});
	}
	return body;
};
