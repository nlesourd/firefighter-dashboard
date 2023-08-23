const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const HSV = mysql.createConnection({
	host: process.env.MYSQL_HOST,
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD,
	database: process.env.MYSQL_DATABASE
}).promise();

async function getCentresHospitalier(){
	const query = "SELECT nom, seuilAlerte, seuilPreAlerte, moyenneDelai1h, passage1h FROM centre_hospitalier";
	const [rows] = await HSV.query(query);
	return rows;
}

async function getSeuils(nom){
	const query = "SELECT seuilAlerte, seuilPreAlerte FROM centre_hospitalier WHERE nom = ?";
	const [rows] = await HSV.query(query, [nom]);
	return rows;
}

async function getMoyenneDelai(nom, tempo){
	const query = "SELECT tempsAcquisition, moyenneDelai, nombrePassage FROM moyenne_"+ tempo + " WHERE nomCH = ?";
	const [rows] = await HSV.query(query, [nom]);
	return rows;
}

async function setSeuilCH(nom, typeAlerte, seuil){ //typeAlerte: "Alerte" ou "PreAlerte"
	const query = "UPDATE centre_hospitalier SET seuil" + typeAlerte + " = ? WHERE nom = ?";
	await HSV.query(query, [seuil, nom]);
}

module.exports = {getCentresHospitalier, getSeuils, getMoyenneDelai, setSeuilCH}