/*
	Auteur: Nathan Lesourd
	Date: 17/06/2023
	Version: 1.0
 */

const express = require('express');
const router = express.Router();
const { getSeuils, getMoyenneDelai } = require('../database.js');
const Moment = require('moment');
const { getISOWeek } = require('date-fns');

// Permet de mettre au bon format les données (journalier) et en ne conservant que les interventions voulues
function formatJSONJournalier(data, veille){
	const result = {"tempsAcquisition": [], "moyenneDelai": [], "nombrePassage": []};
	// Date et heure pour ne conserver que les interventions de la journée 
	var date = new Date();
	var jourCourant = date.getDate();
	var tmp = 0;

	// Pour conserver les interventions de la veille
	if(veille){
		date.setDate(date.getDate()-1);
		jourCourant = date.getDate();
	};

	// Parcourir chaque propriété de l'objet
	data.forEach(function(obj) {
		Object.entries(obj).forEach(function([key, value]) {	

			if(key === "tempsAcquisition"){
				jourIntervention = value.substring(6,8);
				// Ajoute uniquement les temps acquisition de la journée courante
				if(jourIntervention == jourCourant){
					// Dans le cas où il y a eu une intervention dans l'heure pour la journée courante
					result["tempsAcquisition"].push(value.substring(8,10));
					tmp = 3;
				};			
			};
			// Ajoute uniquement les moyennes des délais de la journée courante
			if(key === "moyenneDelai" && tmp == 2){
				result["moyenneDelai"].push(value);
			}
			// Ajoute uniquement le nombre de passage de la journée courante
			if(key === "nombrePassage" && tmp == 1){
				result["nombrePassage"].push(value);
			}

			// Compteur pour avoir la moyenneDelai lorsque le tempsAcquisition est correct
			if(tmp > 0){
				tmp = tmp - 1;
			}
		});
	});
	return result;
};

// Fonction pour obtenir le numéro de la semaine (renvoie 1 pour la 1er semaine de l'année)
function getWeek(date) {
	var firstDayOfYear = new Date(date.getFullYear(), 0, 1);
	var pastDaysOfYear = (date - firstDayOfYear) / 86400000;
	return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Permet de mettre au bon format les données (semaine)
function formatJSONSemaine(data, precedent){
	// Remarque pas besoin d'effectuer un tri sur les interventions car uniquement les moyennes_1j sur la semaine courante en BD
	const result = {"tempsAcquisition": [], "moyenneDelai": [], "nombrePassage": []};
	var date = new Date();
	var semaineCourante = getWeek(date);
	var tmp = 0;
	
	// Pour conserver les interventions de la veille
	if(precedent){
		date.setDate(date.getDate()-7);
		semaineCourante = getWeek(date);
	};

	data.forEach(function(obj) {
		Object.entries(obj).forEach(function([key, value]) {
			if(key === "tempsAcquisition"){
				// Formate au bon format pour pouvoir instancier une date
				var dateFormatee = Moment(value, 'YYYYMMDD').format('YYYY-MM-DD');
				// Instanciation de la date
				var date = new Date(dateFormatee);
				var semaineElement = getISOWeek(date);
				if(semaineCourante === semaineElement){
					result["tempsAcquisition"].push(value);
					tmp = 3;
				}
			}
			//Ajout des moyennes pour la semaine courante
			if(key === "moyenneDelai" && tmp == 2){
				result["moyenneDelai"].push(value);
			}
			//Ajout des moyennes pour la semaine courante
			if(key === "nombrePassage" && tmp == 1){
				result["nombrePassage"].push(value);
			}
			// Compteur pour avoir la moyenneDelai lorsque le tempsAcquisition est correct
			if(tmp > 0){
				tmp = tmp - 1;
			}	
		});
	});
	return result;
};

// Pour la mise en page sous forme d'histogramme renseigne les heures (délai moyen = 0) où il n'y a pas eu d'intervention
function ajoutZerosJournalier(data){
	const result = {"tempsAcquisition": [], "moyenneDelai": [], "nombrePassage": [], "seuilAlerte": 0, "seuilPreAlerte": 0};
	const heureEnInterevention = data["tempsAcquisition"];
	const moyenneEnIntervention = data["moyenneDelai"];
	const passageEnIntervention = data["nombrePassage"];
	compteurHeure = ['00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'];
	
	compteurHeure.forEach(function (heure) {
		index = heureEnInterevention.indexOf(heure)
		// Pas eu d'intervention durant la dernière heure
		if(index == -1){
			result["tempsAcquisition"].push(heure);
			result["moyenneDelai"].push(0);
			result["nombrePassage"].push(0);
		// Eu au moins une intervention durant la dernière heure
		}else{
			result["tempsAcquisition"].push(heure);
			result["moyenneDelai"].push(moyenneEnIntervention[index]);
			result["nombrePassage"].push(passageEnIntervention[index]);
		}
	});
	return result;
}

// Pour la mise en page sous forme d'histogramme renseigne les jours (délai moyen = 0) où il n'y a pas eu d'intervention
function ajoutZerosSemaine(data){
	const result = {"tempsAcquisition": [], "moyenneDelai": [], "nombrePassage": [], "seuilAlerte": 0, "seuilPreAlerte": 0};
	const jourEnInterevention = data["tempsAcquisition"].map(function(element){
		// Formate au bon format pour pouvoir instancier une date
		var dateFormatee = Moment(element, 'YYYYMMDD').format('YYYY-MM-DD');
		// Instanciation de la date
		var date = new Date(dateFormatee);
		// Retourne le jour de la semaine (1: Lundi, 2: Mardi, 3: Mercredi... mais 0: Dimanche)
		if(date.getDay() === 0){
			return 7;
		}else{
			return date.getDay();
		};
	});
	const moyenneEnIntervention = data["moyenneDelai"];
	const passageEnInterevention = data["nombrePassage"];
	const compteurJour = [1, 2, 3, 4, 5, 6, 7];
	const jourSemaine = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];

	compteurJour.forEach(function (jour) {
		index = jourEnInterevention.indexOf(jour)
		// Pas eu d'intervention durant la dernière heure
		if(index == -1){
			result["tempsAcquisition"].push(jourSemaine[jour-1]);
			result["moyenneDelai"].push(0);
			result["nombrePassage"].push(0);
		// Eu au moins une intervention durant la dernière heure
		}else{
			result["tempsAcquisition"].push(jourSemaine[jour-1]); //pour obtenir la journée de la semaine
			result["moyenneDelai"].push(moyenneEnIntervention[index]);
			result["nombrePassage"].push(passageEnInterevention[index]);
		}
	});
	return result;
}

router.post('/journee/:ch', async function(req,res) {
	const nomCH = req.params.ch;
	//Obtention des délais et mise en forme des résultats
	moyennes = await getMoyenneDelai(nomCH,"1h");
	veille = false;
	data = formatJSONJournalier(moyennes, veille);
	var jsonData = ajoutZerosJournalier(data);
	//Obtention des seuils et ajout dans la réponse json
	seuils = await getSeuils(nomCH);
	jsonData.seuilAlerte = seuils[0].seuilAlerte
	jsonData.seuilPreAlerte = seuils[0].seuilPreAlerte
	res.json(jsonData);
});

router.post('/veille/:ch', async function(req,res) {
	const nomCH = req.params.ch;
	//Obtention des délais et mise en forme des résultats
	moyennes = await getMoyenneDelai(nomCH,"1h");
	veille = true; //Ici veille est vrai car on ne veut conserver que les interventions du J-1
	data = formatJSONJournalier(moyennes, veille);
	var jsonData = ajoutZerosJournalier(data);
	//Obtention des seuils et ajout dans la réponse json
	seuils = await getSeuils(nomCH);
	jsonData.seuilAlerte = seuils[0].seuilAlerte
	jsonData.seuilPreAlerte = seuils[0].seuilPreAlerte
	res.json(jsonData);
});

router.post('/semaine/:ch', async function(req,res) {
	const nomCH = req.params.ch;
	//Obtention des délais et mise en forme des résultats
	moyennes = await getMoyenneDelai(nomCH,"1j");
	const precedent = false; //Ici precedent est faux car on s'interesse à la semaine courante
	data = formatJSONSemaine(moyennes, precedent);
	var jsonData = ajoutZerosSemaine(data);
	//Obtention des seuils et ajout dans la réponse json
	seuils = await getSeuils(nomCH);
	jsonData.seuilAlerte = seuils[0].seuilAlerte
	jsonData.seuilPreAlerte = seuils[0].seuilPreAlerte
	res.json(jsonData);
});

router.post('/semainePrecedente/:ch', async function(req,res) {
	const nomCH = req.params.ch;
	//Obtention des délais et mise en forme des résultats
	moyennes = await getMoyenneDelai(nomCH,"1j");
	const precedent = true; //Ici precedent est vrai car on s'interesse à la semaine précédente
	data = formatJSONSemaine(moyennes,precedent);
	var jsonData = ajoutZerosSemaine(data);
	//Obtention des seuils et ajout dans la réponse json
	seuils = await getSeuils(nomCH);
	jsonData.seuilAlerte = seuils[0].seuilAlerte
	jsonData.seuilPreAlerte = seuils[0].seuilPreAlerte
	res.json(jsonData);
});

router.get('/journee/:ch', function(req,res) {
	res.render('historique.ejs',{temporalite: "Journée courante"});
});

router.get('/veille/:ch', function(req,res) {
	res.render('historique.ejs',{temporalite:"Veille"});
});

router.get('/semaine/:ch', function(req,res) {
	res.render('historique.ejs',{temporalite: "Semaine courante"});
});

router.get('/semainePrecedente/:ch', function(req,res) {
	res.render('historique.ejs',{temporalite: "Semaine précédente"});
});

router.get('/', function (req, res) {
	res.redirect('/historique/journee/CHU Rouen',)
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