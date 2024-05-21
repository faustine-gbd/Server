const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const requestIp = require('request-ip');
const WebSocket = require('ws');
const electronPort = 8080; 



const app = express();
const port = 3000;

// Configurer les détails de connexion à la base de données MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'DEMONS'
});

// Middleware pour analyser les corps de requête au format JSON
app.use(bodyParser.json());

app.use(requestIp.mw());


// Route pour recevoir la demande d'identifiants
app.post('/demande-identifiants', (req, res) => {
  const { nomPc, ipAddress } = req.body.clientInfo
 

// Afficher le contenu de la requête 
console.log("Requête de demande d'identifiants reçue : ", nomPc, ipAddress);

  // Générer un ID unique pour ce client
  const ID = generateID();
  
  // Enregistrer l'ID, le nom de l'ordinateur et l'adresse IP dans la base de données
  insertClientInfo(ID, nomPc, ipAddress)
    .then(() => {
      // Envoyer l'ID dans la réponse
      res.json({ ID });
    })
    .catch((error) => {
      console.error('Erreur lors de l\'enregistrement des données dans la base de données :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de l\'enregistrement des données.' });
    });
});

// Fonction pour insérer les informations du client dans la base de données
function insertClientInfo(ID, nomPC, ipAddress) {
  return new Promise((resolve, reject) => {
    // Valider le format de l'adresse IP à l'aide d'une expression régulière ou d'une bibliothèque de validation
    if (!validateIPAddress(ipAddress)) {
      console.log(ipAddress)
      reject(new Error("Format d'adresse IP invalide"));
      return;
    }


    

    // Procédez à l'insertion des données dans la base de données
    const query = 'INSERT INTO Client (ID, nom_PC, ip_Address) VALUES (?, ?, ?)';
    connection.query(query, [ID, nomPC, ipAddress], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
} 

/**
 * Valide une adresse IP en utilisant une expression régulière
 *
 * @param {string} ipAddress - Adresse IP à valider
 * @returns {boolean} True si l'adresse IP est valide, False sinon
 */
function validateIPAddress(ipAddress) {
  // Regex pour vérifier les adresses IPv4
  // Exemple : 192.168.0.1
  const ipv4Regex =
    /^(?<firstOctet>(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\.(?<secondOctet>(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\.(?<thirdOctet>(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\.(?<fourthOctet>(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/;
  return ipv4Regex.test(ipAddress); //toujours vérifier que l'adresse IP est écrit comme ca : ipAddress
}





 //Route pour recevoir les demandes de connexion
 app.post('/connexion', (req, res) => {
  const { ID } = req.body;

  //Rechercher les informations de l'ordinateur dans la base de données
  getComputerInfo(ID)
    .then((computerInfo) => {
       //Si les informations de l'ordinateur sont trouvées
       if (computerInfo) {
        const { adresse_ip } = computerInfo;

        // Envoyer la réponse de connexion à l'adresse IP correspondante via WebSocket
        sendConnectionResponse(adresse_ip, status)
          .then(() => {
            res.json({ message: 'Réponse de connexion envoyée avec succès.' });
          })
          .catch((error) => {
            console.error('Erreur lors de l\'envoi de la réponse de connexion :', error);
            res.status(500).json({ error: 'Une erreur est survenue lors de l\'envoi de la réponse de connexion.' });
          });
      } else {
        res.status(404).json({ error: 'ID d\'ordinateur non trouvé.' });
      }
    })
    .catch((error) => {
      console.error('Erreur lors de la recherche des informations d\'ordinateur :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la recherche des informations d\'ordinateur.' });
    });
});

// Fonction pour générer un ID unique
function generateID() {
  // Génération de l'ID selon vos besoins
  return Math.floor(Math.random() * 1000000) + 1;
}







// Fonction pour récupérer les informations de l'ordinateur depuis la base de données
function getComputerInfo(ID) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT adresse_ip, nom_pc, port FROM Client WHERE ID = ?';
    connection.query(query, [ID], (err, result) => {
      if (err) {
        reject(err);
      } else {
        if (result.length > 0) {
          resolve(result[0]);
        } else {
          resolve(null);
        }
      }
    });
  });
}

// Fonction pour envoyer une demande de connexion à l'adresse IP spécifiée
function sendConnectionRequest(adresseIP, ID) {
  return new Promise((resolve, reject) => {
    // Ici, vous pouvez implémenter la logique pour envoyer une demande de connexion à l'adresse IP spécifiée
    // Cela peut impliquer l'utilisation de sockets ou d'une autre méthode de communication réseau
    // Pour cet exemple, je vais simplement résoudre la promesse immédiatement
    resolve();
  });
}

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});
