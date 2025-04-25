import https from 'https';

const doRequest = (requestData) => {
	console.log('repeatRequest()');
	const url = new URL(
		requestData.path,
		`https://${requestData.headers.Host}`,
	);
	Object.entries(requestData.searchParams).forEach(([key, value]) => {
		url.searchParams.append(key, value);
	});
	const headers = requestData.headers;
	if (requestData.cookies) {
		headers.Cookie = Object.entries(requestData.cookies)
			.map(([key, value]) => `${key}=${value}`)
			.join('; ');
	}
	const method = requestData.method;
	return new Promise((resolve, reject) => {
		const request = https.request(
			{
				hostname: url.hostname,
				port: 443,
				path: url.pathname + url.search,
				method,
				headers: {
					...headers,
				},
			},
			(res) => {
				let data = '';
				res.on('data', (chunk) => {
					data += chunk;
				});
				res.on('end', () => {
					const responseData = {
						code: res.statusCode,
						message: res.statusMessage,
						headers: res.headers,
						body: data,
					};
					resolve(responseData);
				});
			},
		);
		request.write(requestData.body);
	});
};

export default doRequest;
