import https from 'https';
import db from '../db/db.js';

export default (requestData) => {
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
	console.log('headers:', headers);
	const method = requestData.method;
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
				db.insert(requestData, responseData);
			});
		},
	);
	request.write(requestData.body);
};
