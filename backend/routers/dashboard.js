/*
	Auteur: Nathan Lesourd
	Date: 17/06/2023
	Version: 1.0
 */

const express = require('express');
const router = express.Router();
const { getCentresHospitalier } = require('../database.js');

function alerteSonore(centres, oldEnAlerte){
	enAlerteActuellement = false;
	centres.forEach(function(centre){
		if(centre.moyenneDelai1h >= centre.seuilAlerte){
			enAlerteActuellement = true;
		}
	});
	// Pour s'assurer que c'est une nouvelle alerte
	var alerteSon = !oldEnAlerte && enAlerteActuellement;
	return {alerteSon: alerteSon, enAlerteActuellement: enAlerteActuellement};	
}

router.get('/aide', function (req, res) {
	res.sendFile('memo.html', {root: "../frontend"});
});

router.get('/', async function (req, res) {
	var centres_hospitalier = await getCentresHospitalier();
	if(req.session.enAlerte === undefined){
		req.session.enAlerte = false;
	}
	oldEnAlerte = req.session.enAlerte;
	results = alerteSonore(centres_hospitalier, oldEnAlerte);
	req.session.enAlerte = results.enAlerteActuellement;
	var alerteSon = results.alerteSon;
	res.render('dashboard.ejs', {centres_hospitalier, alerteSon});
});

router.use(function(err, req, res, next) {
	console.log(err);
	res.status(500).json({ error: 'Une erreur est survenue'});
});

process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
    console.log(err.stack);
});
module.exports = router;