import e from 'express';
import db from '../db/db.js';

const api = e();

api.get('/', (req, res) => {
	res.send('Hello world!');
});

api.get('/requests', (req, res) => {
	console.log('/requests');
	res.json(db.getAll());
});

api.get('/requests/:id', (req, res) => {
	const id = req.params.id;
	console.log(`/requests/${id}`);
	res.json(db.get(id));
});

api.delete('/requests', (req, res) => {
	db.deleteAll();
	res.send('database deleted');
});

export default api;
