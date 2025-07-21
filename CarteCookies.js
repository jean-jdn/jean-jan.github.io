const map = L.map('map').setView([40.75, -73.97], 12);

// Fond de carte
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

// Couleurs pour chaque marque
const couleurs = [
  "red", "blue", "green", "orange", "purple", "brown", "darkred",
  "darkblue", "darkgreen", "cadetblue", "pink", "black", "gray",
  "violet", "navy", "teal", "gold", "crimson", "coral", "indigo"
];


const LS_DONNEES_ORIG = 'cookies_donneesOriginales';
const LS_COOKIES_DATA = 'cookies_cookiesData';


function chargerLocalStorage(clef) {
  const val = localStorage.getItem(clef);
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}


function sauvegarderLocalStorage(clef, data) {
  localStorage.setItem(clef, JSON.stringify(data));
}



const ulMarques = document.getElementById('liste-marques');
const ulProches = document.getElementById('liste-proches');

let allMarkers = [];
let marqueToMarkers = {};
let marqueSelectionnee = null;
let donneesOriginales = [];

// ======== NOUVEAU : données cookies chargées depuis CSV ========
let cookiesData = [];


function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0]
    .replace(/\r/g, '') // supprime les \r Windows
    .split(',')
    .map(h => h.trim().replace(/^"|"$/g, ''));

  return lines.slice(1).map(line => {
    const cols = line
      .replace(/\r/g, '') // supprime aussi les \r dans les valeurs
      .split(',')
      .map(val => val.trim().replace(/^"|"$/g, ''));

    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] || '';
    });
    return obj;
  });
}


// Essayer de charger depuis localStorage d'abord
let donneesOriginalesLS = chargerLocalStorage(LS_DONNEES_ORIG);
let cookiesDataLS = chargerLocalStorage(LS_COOKIES_DATA);

if (donneesOriginalesLS && cookiesDataLS) {
  // Utiliser les données sauvegardées
  donneesOriginales = donneesOriginalesLS;
  cookiesData = cookiesDataLS;

  console.log("✅ Données chargées depuis localStorage");
  majCarteEtSidebar();
} else {
  // Sinon charger depuis fichiers distants (csv + json)
  Promise.all([
    fetch('https://docs.google.com/spreadsheets/d/1oqNC4EIqDeOKGn8ts4emtrdgd9ol-oe_8N6NY49dg4s/export?format=csv')
      .then(res => res.text())
      .then(text => {
        cookiesData = parseCSV(text);
        console.log('✅ Cookies CSV chargé,', cookiesData.length, 'lignes');
      }),
    fetch('coordonnees.json')
      .then(res => res.json())
      .then(data => {
        donneesOriginales = data;
      })
  ]).then(() => {
    majCarteEtSidebar();
    // Sauvegarder données initiales dans localStorage pour prochaines fois
    sauvegarderLocalStorage(LS_DONNEES_ORIG, donneesOriginales);
    sauvegarderLocalStorage(LS_COOKIES_DATA, cookiesData);
  }).catch(err => {
    console.error("Erreur chargement des données initiales:", err);
  });
}



// fetch('https://docs.google.com/spreadsheets/d/1oqNC4EIqDeOKGn8ts4emtrdgd9ol-oe_8N6NY49dg4s/export?format=csv')
//   .then(res => res.text())
//   .then(text => {
//     cookiesData = parseCSV(text);
//     console.log('✅ Cookies CSV chargé,', cookiesData.length, 'lignes');
//   })
//   .catch(err => {
//     console.error("Erreur chargement Cookies_NYC.csv:", err);
//   });



function trouverInfosCookie(marque) {
  console.log("Recherche infos pour :", marque, "=> cookiesData length:", cookiesData.length);
  const m = marque.toLowerCase().trim();

  return cookiesData.find(c => {
    const marqueCookie = c.Marque || c.marque || ''; // prend la clé qui existe
    return marqueCookie.toLowerCase().trim() === m;
});
}





function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


function afficherAdressesProches(lat, lon) {
  if (!donneesOriginales.length) return;

  const plusProches = [...donneesOriginales]
    .map(item => ({
      ...item,
      distance: getDistance(lat, lon, item.lat, item.lon)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 7);

  ulProches.innerHTML = '';

  plusProches.forEach(item => {
    const li = document.createElement('li');
    const temps = item.distance / 4 * 60; 
    li.innerHTML = `<b>${item.marque}</b><br>${item.adresse}<br>
      <small>${item.distance.toFixed(2)} km ~${Math.round(temps)}mn</small>`;
    li.style.cursor = 'pointer';

    // Div détails cachée sous chaque li
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'details-cookie';
    detailsDiv.style.display = 'none';
    detailsDiv.style.margin = '8px 0 12px 10px';
    detailsDiv.style.padding = '6px';
    detailsDiv.style.borderLeft = '3px solid #aaa';
    detailsDiv.style.backgroundColor = '#f9f9f9';

    ulProches.appendChild(li);
    ulProches.appendChild(detailsDiv);

    li.addEventListener('click', () => {
      console.log("Liste des marques cookiesData:", cookiesData.map(c => c.Marque || c.Marque));
      if (detailsDiv.style.display === 'none') {
        const infos = trouverInfosCookie(item.marque);
        if (infos) {
          detailsDiv.innerHTML = `
            <b>Classement :</b> ${infos.Classement}<br>
            <b>Note :</b> ${infos.Note}/20<br>
            <b>Prix :</b> ${infos.Prix}\$<br>
            <b>Volume :</b> ${infos.Volume}<br>
            <b>Degré de croquant :</b> ${infos['Degré de croquant']}<br>
            <b>Degré de moelleux :</b> ${infos['Degré de moelleux']}<br>
            <b>Chocolat :</b> ${infos.Chocolat}<br>
            <b>Température :</b> ${infos.Température}<br>
            <b>Caractéristique originale :</b> ${infos['Caractéristique originale']}<br>
            <b>Appréciation générale :</b> ${infos['Appréciation générale']}<br>
            
            
          `;
        } else {
          detailsDiv.innerHTML = `<i>Infos non disponibles.</i>`;
        }
        detailsDiv.style.display = 'block';
      } else {
        detailsDiv.style.display = 'none';
      }
      // Centrer sur la position sur la carte
      map.setView([item.lat, item.lon], 16);
    });
  });
}

// Affiche uniquement les marqueurs d'une marque
function toggleMarkers(marque) {
  allMarkers.forEach(marker => {
    if (marker.marque === marque) {
      marker.addTo(map);
    } else {
      map.removeLayer(marker);
    }
  });
}

// Réaffiche tous les marqueurs
function showAllMarkers() {
  allMarkers.forEach(marker => marker.addTo(map));
}

// // Chargement des données
// fetch('coordonnees.json')
//   .then(res => res.json())
//   .then(data => {
//     donneesOriginales = data;

//     const marques = [...new Set(data.map(item => item.marque))];

//     data.forEach(item => {
//       const { marque, adresse, lat, lon } = item;
//       const couleur = couleurs[marques.indexOf(marque) % couleurs.length];

//       const marker = L.circleMarker([lat, lon], {
//         radius: 7,
//         color: couleur,
//         fillColor: couleur,
//         fillOpacity: 0.9
//       }).bindPopup(`<b>${marque}</b><br>${adresse}`);

//       marker.marque = marque;

//       if (!marqueToMarkers[marque]) marqueToMarkers[marque] = [];
//       marqueToMarkers[marque].push(marker);

//       allMarkers.push(marker);
//       marker.addTo(map);
//     });

//     marques.forEach((marque, i) => {
//       const li = document.createElement('li');
//       li.classList.add('marque-item');
//       li.dataset.marque = marque;

//       const colorBox = document.createElement('span');
//       colorBox.className = 'color-box';
//       colorBox.style.backgroundColor = couleurs[i % couleurs.length];
//       li.appendChild(colorBox);
//       li.appendChild(document.createTextNode(marque));
//       ulMarques.appendChild(li);

//       // Hover
//       li.addEventListener('mouseenter', () => {
//         if (marqueSelectionnee) return;
//         toggleMarkers(marque);
//       });

//       li.addEventListener('mouseleave', () => {
//         if (marqueSelectionnee) return;
//         showAllMarkers();
//       });

//       // Clic
//       li.addEventListener('click', (e) => {
//         e.stopPropagation();
//         if (marqueSelectionnee === marque) {
//           marqueSelectionnee = null;
//           showAllMarkers();
//         } else {
//           marqueSelectionnee = marque;
//           toggleMarkers(marque);
//         }
//       });
//     });

//     document.addEventListener('click', () => {
//       if (marqueSelectionnee !== null) {
//         marqueSelectionnee = null;
//         showAllMarkers();
//       }
//     });

//     console.log(`✅ ${allMarkers.length} marqueurs ajoutés.`);
//   })
//   .catch(err => {
//     console.error("Erreur lors du chargement de coordonnees.json :", err);
//   });

// // Formulaire d’adresse
document.getElementById('adresse-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const adresse = document.getElementById('adresse').value;

  if (!adresse) return;

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(adresse)}`)
    .then(res => res.json())
    .then(resultats => {
      if (resultats.length > 0) {
        const { lat, lon } = resultats[0];
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);

        map.setView([latNum, lonNum], 15);
        L.marker([latNum, lonNum]).addTo(map).bindPopup("Vous êtes ici").openPopup();

        afficherAdressesProches(latNum, lonNum);
      } else {
        alert("Adresse non trouvée.");
      }
    })
    .catch(() => {
      alert("Erreur lors de la recherche d'adresse.");
    });
});

const formAjout = document.getElementById('ajout-cookie-form');

formAjout.addEventListener('submit', function(e) {
  e.preventDefault();

  const formData = new FormData(formAjout);
  
  // Construire un nouvel objet cookie / adresse
  const nouvelItem = {
    marque: formData.get('Marque'),
    adresse: formData.get('Adresse_1'),
    lat: null,  // on va chercher via nominatim
    lon: null,
  };

  // On ajoute aussi dans cookiesData pour info détaillée
  const nouvelCookie = {
    Marque: formData.get('Marque'),
    Prix: formData.get('Prix'),
    Volume: formData.get('Volume'),
    'Degré de croquant': formData.get('Degré de croquant'),
    'Degré de moelleux': formData.get('Degré de moelleux'),
    Chocolat: formData.get('Chocolat'),
    Température: formData.get('Température'),
    'Caractéristique originale': formData.get('Caractéristique originale'),
    'Appréciation générale': formData.get('Appréciation générale'),
    'Note sur 20': formData.get('Note'),
    Adresse_1: formData.get('Adresse_1'),
  };

  // Utiliser Nominatim pour géocoder l'adresse saisie
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(nouvelItem.adresse)}`)
    .then(res => res.json())
    .then(resultats => {
      if (resultats.length === 0) {
        alert("Adresse non trouvée, impossible d'ajouter.");
        return;
      }

      const { lat, lon } = resultats[0];
      nouvelItem.lat = parseFloat(lat);
      nouvelItem.lon = parseFloat(lon);

      donneesOriginales.push(nouvelItem);
      cookiesData.push(nouvelCookie);

      // Sauvegarder dans localStorage à jour
      sauvegarderLocalStorage(LS_DONNEES_ORIG, donneesOriginales);
      sauvegarderLocalStorage(LS_COOKIES_DATA, cookiesData);

      majCarteEtSidebar();


      // Ajouter marqueur sur la carte
      const marques = [...new Set(donneesOriginales.map(item => item.marque))];
      const couleur = couleurs[marques.indexOf(nouvelItem.marque) % couleurs.length];

      const marker = L.circleMarker([nouvelItem.lat, nouvelItem.lon], {
        radius: 7,
        color: couleur,
        fillColor: couleur,
        fillOpacity: 0.9
      }).bindPopup(`<b>${nouvelItem.marque}</b><br>${nouvelItem.adresse}`);

      marker.marque = nouvelItem.marque;
      allMarkers.push(marker);
      marker.addTo(map);

      // Mettre à jour marque -> marqueToMarkers
      if (!marqueToMarkers[nouvelItem.marque]) marqueToMarkers[nouvelItem.marque] = [];
      marqueToMarkers[nouvelItem.marque].push(marker);

      // Mettre à jour sidebar marques
      majSidebarMarques();

      // Si on a une position centrale, on peut aussi actualiser la liste des proches
      if (map.getCenter()) {
        const center = map.getCenter();
        afficherAdressesProches(center.lat, center.lng);
      }

      // Reset du formulaire
      formAjout.reset();

      alert("Nouvelle adresse ajoutée avec succès !");
    })
    .catch(err => {
      console.error("Erreur géocodage Nominatim:", err);
      alert("Erreur lors du géocodage de l'adresse.");
    });
});

// Fonction pour mettre à jour la liste des marques dans la sidebar
function majSidebarMarques() {
  ulMarques.innerHTML = '';
  const marques = [...new Set(donneesOriginales.map(item => item.marque))];

  marques.forEach((marque, i) => {
    const li = document.createElement('li');
    li.classList.add('marque-item');
    li.dataset.marque = marque;

    const colorBox = document.createElement('span');
    colorBox.className = 'color-box';
    colorBox.style.backgroundColor = couleurs[i % couleurs.length];
    li.appendChild(colorBox);
    li.appendChild(document.createTextNode(marque));
    ulMarques.appendChild(li);

    // Hover
    li.addEventListener('mouseenter', () => {
      if (marqueSelectionnee) return;
      toggleMarkers(marque);
    });

    li.addEventListener('mouseleave', () => {
      if (marqueSelectionnee) return;
      showAllMarkers();
    });

    // Clic
    li.addEventListener('click', (e) => {
      e.stopPropagation();
      if (marqueSelectionnee === marque) {
        marqueSelectionnee = null;
        showAllMarkers();
      } else {
        marqueSelectionnee = marque;
        toggleMarkers(marque);
      }
    });
  });
}

function majCarteEtSidebar() {
  // Retirer tous les marqueurs de la carte
  allMarkers.forEach(marker => map.removeLayer(marker));
  allMarkers = [];
  marqueToMarkers = {};

  const marques = [...new Set(donneesOriginales.map(item => item.marque))];

  donneesOriginales.forEach(item => {
    const { marque, adresse, lat, lon } = item;
    const couleur = couleurs[marques.indexOf(marque) % couleurs.length];

    const marker = L.circleMarker([lat, lon], {
      radius: 7,
      color: couleur,
      fillColor: couleur,
      fillOpacity: 0.9
    }).bindPopup(`<b>${marque}</b><br>${adresse}`);

    marker.marque = marque;

    if (!marqueToMarkers[marque]) marqueToMarkers[marque] = [];
    marqueToMarkers[marque].push(marker);

    allMarkers.push(marker);
    marker.addTo(map);
  });

  majSidebarMarques();
}
