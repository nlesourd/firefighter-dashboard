/*
	Auteur: Nathan Lesourd
	Date: 17/06/2023
	Version: 1.0
 */

const express = require('express');
const router = express.Router();
const { getSeuils, setSeuilCH } = require('../database.js');

router.post('/:ch', async function(req, res) { 
    const data = req.body;
	const nomCH = req.params.ch;
	seuils = await getSeuils(nomCH);
	const oldSeuilAlerte = seuils[0].seuilAlerte;
	const oldSeuilPreAlerte = seuils[0].seuilPreAlerte;

	if (!(data.seuilAlerte === undefined)){
		if (data.seuilAlerte > oldSeuilPreAlerte){
			//Le passage de valeur est bon et la mise à jour de la BD peut avoir lieu
			await setSeuilCH(nomCH, "Alerte", data.seuilAlerte);
			const chemin = '/parametre/' + nomCH;
			res.redirect(chemin);
		}else{
			//Mauvais passage de valeur -> affichage message d'erreur
			const erreurSeuilAlerte = true;
			const erreurSeuilPreAlerte = false;
			res.render('parametre.ejs', {results, erreurSeuilAlerte, erreurSeuilPreAlerte});
		}
	}
	if (!(data.seuilPreAlerte === undefined)){
		if ((data.seuilPreAlerte < oldSeuilAlerte) && (data.seuilPreAlerte > 0)){
			//Le passage de valeur est bon et la mise à jour de la BD peut avoir lieu
			await setSeuilCH(nomCH, "PreAlerte", data.seuilPreAlerte);
			const chemin = '/parametre/' + nomCH;
			res.redirect(chemin);
		}else{
			//Mauvais passage de valeur -> affichage message d'erreur
			const erreurSeuilAlerte = false;
			const erreurSeuilPreAlerte = true;
			res.render('parametre.ejs', {results, erreurSeuilAlerte, erreurSeuilPreAlerte});
		}
	}
})

router.get('/:ch', async function (req, res) {
	let nomCH = req.params.ch;
	seuils = await getSeuils(nomCH);
	const erreurSeuilAlerte = false;
	const erreurSeuilPreAlerte = false;
	res.render('parametre.ejs', {seuils, erreurSeuilAlerte, erreurSeuilPreAlerte});
});

router.get('/', function (req, res) {
	res.redirect('/parametre/CHU Rouen');
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