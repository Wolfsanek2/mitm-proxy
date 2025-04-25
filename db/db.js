import Database from 'better-sqlite3';

class DB {
	constructor() {
		this.db = Database('proxyDB.sqlite');
		this.db.exec(
			'CREATE TABLE IF NOT EXISTS http_logs (id INTEGER PRIMARY KEY, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, request TEXT, response TEXT)',
		);
	}
	insert(request, response) {
		console.log('db.insert()');
		this.db
			.prepare('INSERT INTO http_logs (request, response) VALUES (?, ?)')
			.run(JSON.stringify(request), JSON.stringify(response));
	}
	get(id) {
		console.log(`db.get(${id})`);
		const row = this.db
			.prepare('SELECT * FROM http_logs WHERE id = ?')
			.get(id);
		return {
			request: JSON.parse(row.request),
			response: JSON.parse(row.response),
		};
	}
	getAll() {
		console.log('db.getAll()');
		return this.db
			.prepare('SELECT * FROM http_logs')
			.all()
			.map((row) => {
				return {
					id: row.id,
					request: JSON.parse(row.request),
					response: JSON.parse(row.response),
				};
			});
	}
	deleteAll() {
		this.db.exec('DELETE FROM http_logs');
	}
}

export default new DB();
