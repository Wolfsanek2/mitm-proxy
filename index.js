import { proxy } from './proxy/proxy.js';

const port = 8080;

proxy.listen(port, () => {
	console.log(`proxy is listening on port ${port}`);
});
