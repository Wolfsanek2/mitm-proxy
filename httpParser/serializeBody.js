const serializeBody = (body) => {
	return Object.entries(body)
		.map(([key, value]) => {
			return `${key}=${encodeURIComponent(value)}`;
		})
		.join('&');
};

export default serializeBody;
