/**
 * @param {string} headers
 */
export default (headers) => {
	const result = {};
	const cookiesIndex = headers.findIndex((str) => {
		return str.slice(0, 6) === 'Cookie';
	});
	const cookiesStr = headers[cookiesIndex];
	const cookies = cookiesStr
		? cookiesStr
				.slice(7)
				.split('; ')
				.reduce((acc, cookie) => {
					const [key, value] = cookie.split('=');
					acc[key] = value;
					return acc;
				}, {})
		: {};
	if (Object.keys(cookies).length) {
		result.cookies = cookies;
	}
	const headersStr = headers
		.slice(0, cookiesIndex)
		.concat(headers.slice(cookiesIndex + 1));
	const parsedHeaders = headersStr.reduce((acc, headerStr) => {
		const [headerKey, headerValue] = headerStr.split(': ');
		acc[headerKey] = headerValue;
		return acc;
	}, {});
	result.headers = parsedHeaders;
	return result;
};
