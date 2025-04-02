import { proxy } from './proxy/proxy.js';
import { proxy as httpsProxy } from './proxy/httpsProxy.js';

const port = 8080;

httpsProxy.listen(port, () => {
	console.log(`proxy is listening on port ${port}`);
});
