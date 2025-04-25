import e from 'express';
import db from '../db/db.js';
import repeatRequest from './repeatRequest.js';
import scanXSS from './scanXSS.js';

const api = e();

api.get('/', (req, res) => {
	res.send('Hello world!');
});

api.get('/requests', async (req, res) => {
	console.log('/requests');
	res.json(await db.getAll());
});

api.get('/requests/:id', async (req, res) => {
	const id = req.params.id;
	console.log(`/requests/${id}`);
	res.json(await db.get(id));
});

api.delete('/requests', (req, res) => {
	db.deleteAll();
	res.send('database deleted');
});

api.get('/repeat/:id', (req, res) => {
	const id = req.params.id;
	repeatRequest(db.get(id).request);
	res.send('request repeated');
});

api.get('/scan/:id', async (req, res) => {
	const { id } = req.params;
	const { request } = db.get(id);
	const result = await scanXSS(request);
	if (result) {
		res.send(`XSS found: ${result}`);
	} else {
		res.send('XSS not found');
	}
});

export default api;
