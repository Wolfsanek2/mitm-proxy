import api from './api/api.js';
import { proxy } from './proxy/proxy.js';

const proxyPort = 8080;
const apiPort = 8000;

proxy.listen(proxyPort, () => {
	console.log(`proxy is listening on port ${proxyPort}`);
});

api.listen(apiPort, () => {
	console.log(`api is listening on port ${apiPort}`);
});
