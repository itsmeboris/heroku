const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const { Pool } = require('pg');
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: true
});


/*
	create table users(Id text, nickname text, username text, password text, create_time text, status integer);
	insert into users values ('88888888', 'admin', 'admin', '12345', '', 1);
*/

async function createUser(request, response) {
	try {
		const client = await pool.connect();
		const user = await getUserByUserName(request);
		const empty = isEmpty(user);
		if (!empty) {
			console.log("user already exists");
			const data = user.results[0];
			data.id = data.id.toString();
			data.status = 0;
			await response.json(data);
			client.release();
			return;
		}
		const date = new Date();
		const timestamp = date.toISOString();
		request.body.create_time = timestamp;
		const { Id, nickname, username, password, create_time, status } = request.body;
		const userbyid = await getUserById(Id);
		const free = isEmpty(userbyid);
		if (free) {
			const result = await pool.query('INSERT INTO users (Id, nickname, username, password, create_time, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [Id, nickname, username, password, create_time, 1]);
			const results = await { 'results': (result) ? result.rows : null };
			const data = results.results[0];
			data.id = data.id.toString();
			await response.json(data);
			client.release();
			return;
		}
		else {
			const result = await pool.query('INSERT INTO users (nickname, username, password, create_time, status) VALUES ($1, $2, $3, $4, $5) RETURNING *', [nickname, username, password, create_time, 1]);
			const results = await { 'results': (result) ? result.rows : null };
			const data = results.results[0];
			data.id = data.id.toString();
			await response.json(data);
			client.release();
			return;
		}
	} catch (error) {
		console.log(error);
		await response.send("Error " + error);
		client.release();
	}
}

async function getUserByUserName(request) {
	try {
		const username = await request.body.username;
		const result = await pool.query("SELECT * FROM users WHERE username = \'" + username + "\';");
		const results = await { 'results': (result) ? result.rows : null };
		return results;
	} catch (error) {
		console.log('this is an error');
		console.error(error);
		return await JSON.parse({ 'results': null });
	}
}

async function getUserById(id) {
	try {
		const result = await pool.query("SELECT * FROM users WHERE id = \'" + id + "\';");
		const results = await { 'results': (result) ? result.rows : null };
		return results;
	} catch (error) {
		console.log('this is an error');
		console.error(error);
		return await JSON.parse({});
	}
}

function isEmpty(obj) {
	return obj.results == undefined || obj.results.length == 0;
}

async function createTable(request, response) {
	const client = await pool.connect();
	await pool.query("CREATE TABLE users(id SERIAL PRIMARY KEY, nickname VARCHAR(11), username VARCHAR(50), password VARCHAR(200), create_time TIMESTAMP, status SMALLINT);", async (error, results) => {
		if (error) {
			console.log(err);
			await response.send("Error " + err);
			client.release();
		}
		await response.json(results.rows);
		console.log(response);
		client.release();
	});
}

express()
	.use(express.static(path.join(__dirname, 'public')))
	.set('views', path.join(__dirname, 'views'))
	.set('view engine', 'ejs')
	.use(express.json({ limit: '1mb' }))
	.get('/api/admin/users', async (req, res) => {
		try {
			const client = await pool.connect()
			const result = await client.query('SELECT * FROM users');
			const results = { 'results': (result) ? result.rows : null };
			await res.json(results);
			client.release();
		} catch (err) {
			console.error(err);
			await res.send("Error " + err);
			client.release();
		}
	})
	.get('/api/admin/deleteUsers', async (req, res) => {
		try {
			const client = await pool.connect()
			const result = await client.query('DELETE FROM users');
			const results = { 'results': (result) ? result.rows : null };
			await res.json(results);
			client.release();
		} catch (err) {
			console.error(err);
			await res.send("Error " + err);
			client.release();
		}
	})
	.get('/api/ct', async (req, res) => {
		try {
			console.log("enter");
			const client = await pool.connect()
			const result = await client.query("CREATE TABLE users(id SERIAL PRIMARY KEY, nickname VARCHAR(11), username VARCHAR(50), password VARCHAR(200), create_time TIMESTAMP, status SMALLINT);");
			console.log(result);
			const results = { 'results': (result) ? result.rows : null };
			await res.json(results);
			client.release();
		} catch (err) {
			console.error(err);
			await res.send("Error " + err);
			client.release();
		}
	})
	.post('/api/users', createUser)
	.listen(PORT, () => console.log(`Listening on ${PORT}`))
