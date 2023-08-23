/*
	Auteur: Nathan Lesourd
	Date: 17/06/2023
	Version: 1.0
 */


// import express module and create your express app
const express = require('express');
const app = express();

// set the server host and port
const port = 3000;

// add data to req.body (for POST requests)
app.use(express.urlencoded({ extended: true }));

// serve static files
app.use(express.static('../frontend'));

// set the view engine to ejs
app.set('view engine', 'ejs');

// import  and use express-session module
const session = require('express-session');
app.use(session({
	secret: 'login', //used to sign the session ID cookie
	resave: true, // forces the session to be saved back to the session store
	saveUninitialized: true, // forces a session an uninitialized session to be saved to the store
}));

// routers

const historique = require('./routers/historique');
app.use('/historique', historique);

const parametre = require('./routers/parametre');
app.use('/parametre', parametre);

const dashboard = require('./routers/dashboard');
app.use('/', dashboard);

//404
app.use('*', function(req,res){
	res.status(404);
});

// run the server
app.listen(port, () => {
	// callback executed when the server is launched
	console.log(`Express app listening on port ${port}`);
});