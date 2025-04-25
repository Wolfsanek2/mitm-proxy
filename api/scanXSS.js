import serializeBody from '../httpParser/serializeBody.js';
import doRequest from './doRequest.js';

const xssValue = "<img src onerror=alert('xss')>";

const scanXSS = (requestData) => {
	const { searchParams, body } = requestData;
	return new Promise((resolve, reject) => {
		const results1 = Object.keys(searchParams).map(async (key) => {
			const response = await doRequest({
				...requestData,
				searchParams: { ...requestData.searchParams, [key]: xssValue },
			});
			const xssIndex = response.data.indexOf(xssValue);
			if (xssIndex !== -1) {
				return { xssParam: key };
			}
			return null;
		});

		let results2 = [];
		if (
			requestData.headers['Content-Type'] ===
			'application/x-www-form-urlencoded'
		) {
			promises2 = Object.keys(body).map(async (key) => {
				const response = await doRequest({
					...requestData,
					body: serializeBody(body),
				});
				const xssIndex = response.data.indexOf(xssValue);
				if (xssIndex !== -1) {
					return { xssParam: key };
				}
				return null;
			});
		}
		Promise.all(results1.concat(results2)).then((results) => {
			const result = results.find((result) => {
				if (result?.xssParam) {
					return result.xssParam;
				}
			});
			resolve(result);
		});
	});
};

export default scanXSS;
