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
      const donneesCSV=`Marque,Prix,Volume,Degré de croquant,Degré de moelleux,Chocolat,Température,Caractéristique originale,Appréciation générale,Note,Classement,Adresse_1,Adresse_2,Adresse_3,Adresse_4,Adresse_5,Adresse_6,Adresse_7,Adresse_8,Adresse_9,Adresse_10,Adresse_11,Adresse_12,Adresse_13,Adresse_14,Adresse_15,Adresse_16\n
      Crumbl,5.25,Grand et dense,Un peu sur les bords,Pâteux au centre,Générosité,Chaud,Se casse un peu la gueule,Savoureux et réconfortant mais écoeurant,15.5,7,195 Bleecker St New York NY 10012,238 7th Ave  New York  NY 10011,1195 3rd Ave  New York  NY 10021,301 Columbus Ave  New York  NY 10023,,,,,,,,,,,,\n
      Chip City,5.99,Grand et dense,Trop partout,Sablonneux,Moyen,Neutre,Goût un peu brun,Très bon mais trop sec pour de l'industriel,14.5,9,298 Bleecker St New York NY 10014,359 E 19th St  New York  NY 10003,272 7th Ave  New York  NY 10001,325 Greenwich St  New York  NY 10013,30 Rockefeller Plaza Concourse Suite 20  New York  NY 10112,370 Columbus Ave  New York  NY 10024,1543 2nd Ave  New York  NY 10075,1371 Madison Ave  New York  NY 10128,,,,,,,,\n
      Think Coffee,4.75,Très grand et fin,Trop (pâte durcie),Faible,Lacunaire,Neutre,Grains de gros sel blanc,Un air de palet breton bien beurré,11.5,14,248 Mercer St  New York  NY 10012,1 Bleecker St  New York  NY 10012,123 4th Ave  New York  NY 10003,471 Broadway  New York  NY 10013,73 8th Ave  New York  NY 10014,568 6th Ave  New York  NY 10011,350 Broadway  New York  NY 10013,280 3rd Ave  New York  NY 10010,246 5th Ave  New York  NY 10001,500 W 30th St  New York  NY 10001,10 Devoe St  Brooklyn  NY 11211,,,,,\n
      Insomnia,4.99,Moyen,Très sur les bords,Bien au centre,Générosité,Chaud,C’est pas la taille qui compte,Industriel savoureux mais sans originalité,13.5,11,299 E 11th St  New York  NY 10003,116 MacDougal St  New York  NY 10012,164 Orchard St  New York  NY 10002,283 Bleecker St  New York  NY 10014,304 W 14th St  New York  NY 10014,125 Church St  New York  NY 10007,482 3rd Ave  New York  NY 10016,76 Pearl St  New York  NY 10004,,,,,,,,\n
      Schmackary's,3.75,Moyen et fin,Un peu sur les bords,Bien au centre,Lacunaire,Neutre,Goût vanillé et sel blanc,Industriel mélangeant trop sucre sel et vanille,12,13,362 W 45th St  New York  NY 10036,129 4th Ave  New York  NY 10003,,,,,,,,,,,,,,\n
      Culture Espresso,5.25,Grand et dense,Très sur les bords,Bien au centre (choco),Générosité,Neutre,L'habit ne fait pas le moine,Gourmand  surprenant  bon ratio d'inspirations,18,2,72 W 38th St  New York  NY 10018,247 W 36th St.  New York  NY 10018,,,,,,,,,,,,,,\n
      Seven Grams,5,Moyen et dense,Absence de croquant,Assez pâteux,Générosité,Neutre,Pas croustillant pour un sou,Délicieux  pas écoeurant mais pas loin non plus,16,6,275 7th Ave  New York  NY 10001,76 Madison Ave  New York  NY 10016,69 Charlton St  New York  NY 10014,,,,,,,,,,,,,\n
      Levain Bakery,5.75,Grand et dense,Très sur les bords et au-dessus,Bien au centre,Générosité,Chaud,Noix croquant à l'intérieur,Beau cookie très croquant mais tout sauf sec s'émiette un peu,18.5,1,340 Lafayette St  New York  NY 10012,2 W 18th St  New York  NY 10011,164 N 4th St  Brooklyn  NY 11211,167 W 74th St  New York  NY 10023,351 Amsterdam Ave  New York  NY 10024,1484 3rd Ave  New York  NY 10028,2167 Frederick Douglass Blvd  New York  NY 10026,,,,,,,,,\n
      Maman,4.5,Grand et fin,Un peu partout,Faible,Générosité,Neutre,Bon goût salé cuisson,Gourmand sans être lourd,16.5,5,67 University Pl  New York  NY 10003,3 W 18th St  New York  NY 10011,375 Hudson St  New York  NY 10014,239 Centre St  New York  NY 10013,22 W 25th St  New York  NY 10010,800 Washington St  New York  NY 10014,211 W Broadway  New York  NY 10013,205 Hudson St  New York  NY 10013,114 W 41st St  New York  NY 10036,12 W 48th St  New York  NY 10036,80 Kent St  Brooklyn  NY 11222,155 E 44th St @3rd Ave  New York  NY 10017,667 Lexington Ave  New York  NY 10022,152 Columbus Ave  New York  NY 10023,1424 3rd Ave  New York  NY 10028,154 Court St  Brooklyn  NY 11201\n
      Jacques Torres,4.5,Grand et fin,Un peu sur les bords,Faible,Générosité,Neutre,Un chocolat noir assez fort,Choco mal réparti mais une bonne pâte dans l'ensemble,15,8,66 Water St  Brooklyn  NY 11201,107 East 42nd Street Lexington  Passage  New York  NY 10017,,,,,,,,,,,,,,\n
      Café d'Avignon,5,Moyen et fin,Un peu sur les bords,Faible,Moyen,Neutre,Goût vanillé,Basique  bon mais pas très réconfortant,12.5,13,88 Essex St  New York  NY 10002,485 7th Avenue Entrance on  W 36th St.  New York  NY 10018,Dekalb Market Hall  445 Albee Square W  Brooklyn  NY 11201,105 W 28th St  New York  NY 10001,,,,,,,,,,,,\n
      Millefeuille,3.9,Grand et fin,Très sur les bords,Bien au centre,Générosité,Neutre,Noix et fleur de sel,Bon rapport qualité prix mais trop d'informations en bouche,14,10,552 LaGuardia Pl  New York  NY 10012,,,,,,,,,,,,,,,\n
      Funny Face,6,Grand et dense,Très sur les bords,Bien au centre (choco),Générosité,Chaud,Equivaut à 2 cookies,Très bon mais cher et nécessite de crever la dalle,17.5,3,319 Lafayette St  New York  NY 10012,6 Fulton St  New York  NY 10038,,,,,,,,,,,,,,\n
      Breads Bakery,4.85,Moyen et fin,Absence de croquant,Faible,Moyen,Neutre,3 chocolats (noir prédomine),Physique peu attrayant,13,12,18 E 16th St  New York  NY 10003,550 1st Ave  New York  NY 10016,1080 6th Ave  New York  NY 10036,1230 6th Ave  New York  NY 10020,1890 Broadway  New York  NY 10023,1294 3rd Ave  New York  NY 10021,,,,,,,,,,\n
      Yanni's Coffee,5.25,Moyen et dense,Un peu sur les bords,Bien au centre,Générosité,Neutre,Noix mais discrètes,Beau cookie au bon goût de cuisson  brun  authentique,17,4,96 7th Ave  New York  NY 10011,,,,,,,,,,,,,,,`;


      const cookiesData = Papa.parse(donneesCSV, {
        header: true,
        skipEmptyLines: true
      }).data;
      console.log("✅ Cookies CSV intégré :", cookiesData.length, "cookies");

      donneesOriginales=[
        {
    "marque": "Marque",
    "adresse": "Adresse_1",
    "lat": 50.6406949,
    "lon": 5.2171065
  },
  {
    "marque": "Marque",
    "adresse": "Adresse_2",
    "lat": 49.5010477,
    "lon": 0.0901322
  },
  {
    "marque": "Marque",
    "adresse": "Adresse_3",
    "lat": 50.6408179,
    "lon": 5.216998
  },
  {
    "marque": "Marque",
    "adresse": "Adresse_4",
    "lat": 49.5010105,
    "lon": 0.0903264
  },
  {
    "marque": "Marque",
    "adresse": "Adresse_5",
    "lat": 50.8388264,
    "lon": 4.3053905
  },
  {
    "marque": "Marque",
    "adresse": "Adresse_6",
    "lat": 49.5005208,
    "lon": 0.0914636
  },
  {
    "marque": "Marque",
    "adresse": "Adresse_7",
    "lat": 50.8388755,
    "lon": 4.3048498
  },
  {
    "marque": "Marque",
    "adresse": "Adresse_8",
    "lat": 49.5004156,
    "lon": 0.0915818
  },
  {
    "marque": "Marque",
    "adresse": "Adresse_9",
    "lat": 50.8385455,
    "lon": 4.304772
  },
  {
    "marque": "Marque",
    "adresse": "Adresse_10",
    "lat": 49.500354,
    "lon": 0.091665
  },
  {
    "marque": "Marque",
    "adresse": "Adresse_11",
    "lat": 50.8383374,
    "lon": 4.3046902
  },
  {
    "marque": "Marque",
    "adresse": "Adresse_12",
    "lat": 50.8381741,
    "lon": 4.30526
  },
  {
    "marque": "Marque",
    "adresse": "Adresse_13",
    "lat": 49.500815,
    "lon": 0.0915816
  },
  {
    "marque": "Marque",
    "adresse": "Adresse_14",
    "lat": 49.4998802,
    "lon": 0.0921667
  },
  {
    "marque": "Marque",
    "adresse": "Adresse_15",
    "lat": 49.5006984,
    "lon": 0.0916938
  },
  {
    "marque": "Marque",
    "adresse": "Adresse_16",
    "lat": 49.4998311,
    "lon": 0.0922916
  },
  {
    "marque": "Crumbl",
    "adresse": "195 Bleecker St New York NY 10012",
    "lat": 40.7294744,
    "lon": -74.0014043
  },
  {
    "marque": "Crumbl",
    "adresse": "238 7th Ave  New York  NY 10011",
    "lat": 40.7447145,
    "lon": -73.9954234
  },
  {
    "marque": "Crumbl",
    "adresse": "1195 3rd Ave  New York  NY 10021",
    "lat": 40.7681137,
    "lon": -73.9616707
  },
  {
    "marque": "Crumbl",
    "adresse": "301 Columbus Ave  New York  NY 10023",
    "lat": 40.7787526,
    "lon": -73.9775846
  },
  {
    "marque": "Chip City",
    "adresse": "298 Bleecker St New York NY 10014",
    "lat": 40.7323583,
    "lon": -74.0038848
  },
  {
    "marque": "Chip City",
    "adresse": "359 E 19th St  New York  NY 10003",
    "lat": 40.7347399,
    "lon": -73.9806792
  },
  {
    "marque": "Chip City",
    "adresse": "272 7th Ave  New York  NY 10001",
    "lat": 40.7456432,
    "lon": -73.9946452
  },
  {
    "marque": "Chip City",
    "adresse": "325 Greenwich St  New York  NY 10013",
    "lat": 40.717575,
    "lon": -74.010556
  },
  {
    "marque": "Chip City",
    "adresse": "370 Columbus Ave  New York  NY 10024",
    "lat": 40.7811628,
    "lon": -73.9763912
  },
  {
    "marque": "Chip City",
    "adresse": "1543 2nd Ave  New York  NY 10075",
    "lat": 40.7742881,
    "lon": -73.9545858
  },
  {
    "marque": "Chip City",
    "adresse": "1371 Madison Ave  New York  NY 10128",
    "lat": 40.7869635,
    "lon": -73.9541801
  },
  {
    "marque": "Think Coffee",
    "adresse": "248 Mercer St  New York  NY 10012",
    "lat": 40.7283348,
    "lon": -73.9952197
  },
  {
    "marque": "Think Coffee",
    "adresse": "1 Bleecker St  New York  NY 10012",
    "lat": 40.7254073,
    "lon": -73.9923897
  },
  {
    "marque": "Think Coffee",
    "adresse": "123 4th Ave  New York  NY 10003",
    "lat": 40.7330104,
    "lon": -73.9896507
  },
  {
    "marque": "Think Coffee",
    "adresse": "471 Broadway  New York  NY 10013",
    "lat": 40.7213304,
    "lon": -74.0006473
  },
  {
    "marque": "Think Coffee",
    "adresse": "73 8th Ave  New York  NY 10014",
    "lat": 40.7372732,
    "lon": -74.0049799
  },
  {
    "marque": "Think Coffee",
    "adresse": "568 6th Ave  New York  NY 10011",
    "lat": 40.738435,
    "lon": -73.9958313
  },
  {
    "marque": "Think Coffee",
    "adresse": "350 Broadway  New York  NY 10013",
    "lat": 40.7169297,
    "lon": -74.0037781
  },
  {
    "marque": "Think Coffee",
    "adresse": "280 3rd Ave  New York  NY 10010",
    "lat": 40.7381183,
    "lon": -73.9838989
  },
  {
    "marque": "Think Coffee",
    "adresse": "246 5th Ave  New York  NY 10001",
    "lat": 40.7446682,
    "lon": -73.98756
  },
  {
    "marque": "Think Coffee",
    "adresse": "500 W 30th St  New York  NY 10001",
    "lat": 40.7520118,
    "lon": -74.0014384
  },
  {
    "marque": "Think Coffee",
    "adresse": "10 Devoe St  Brooklyn  NY 11211",
    "lat": 40.7129807,
    "lon": -73.9509765
  },
  {
    "marque": "Insomnia",
    "adresse": "299 E 11th St  New York  NY 10003",
    "lat": 40.7303561,
    "lon": -73.9860626
  },
  {
    "marque": "Insomnia",
    "adresse": "116 MacDougal St  New York  NY 10012",
    "lat": 40.7296897,
    "lon": -74.0004684
  },
  {
    "marque": "Insomnia",
    "adresse": "164 Orchard St  New York  NY 10002",
    "lat": 40.7211114,
    "lon": -73.9884984
  },
  {
    "marque": "Insomnia",
    "adresse": "283 Bleecker St  New York  NY 10014",
    "lat": 40.7319631,
    "lon": -74.0031917
  },
  {
    "marque": "Insomnia",
    "adresse": "304 W 14th St  New York  NY 10014",
    "lat": 40.7397696,
    "lon": -74.0032753
  },
  {
    "marque": "Insomnia",
    "adresse": "125 Church St  New York  NY 10007",
    "lat": 40.714011,
    "lon": -74.0084612
  },
  {
    "marque": "Insomnia",
    "adresse": "482 3rd Ave  New York  NY 10016",
    "lat": 40.7450065,
    "lon": -73.978878
  },
  {
    "marque": "Insomnia",
    "adresse": "76 Pearl St  New York  NY 10004",
    "lat": 40.703726,
    "lon": -74.0103599
  },
  {
    "marque": "Schmackary's",
    "adresse": "362 W 45th St  New York  NY 10036",
    "lat": 40.7601492,
    "lon": -73.9909867
  },
  {
    "marque": "Schmackary's",
    "adresse": "129 4th Ave  New York  NY 10003",
    "lat": 40.7332145,
    "lon": -73.9896072
  },
  {
    "marque": "Culture Espresso",
    "adresse": "72 W 38th St  New York  NY 10018",
    "lat": 40.7518497,
    "lon": -73.9850613
  },
  {
    "marque": "Culture Espresso",
    "adresse": "247 W 36th St.  New York  NY 10018",
    "lat": 40.7532062,
    "lon": -73.9912609
  },
  {
    "marque": "Seven Grams",
    "adresse": "275 7th Ave  New York  NY 10001",
    "lat": 40.745547,
    "lon": -73.994143
  },
  {
    "marque": "Seven Grams",
    "adresse": "76 Madison Ave  New York  NY 10016",
    "lat": 40.7439066,
    "lon": -73.9859322
  },
  {
    "marque": "Seven Grams",
    "adresse": "69 Charlton St  New York  NY 10014",
    "lat": 40.727294,
    "lon": -74.0061071
  },
  {
    "marque": "Levain Bakery",
    "adresse": "340 Lafayette St  New York  NY 10012",
    "lat": 40.7262725,
    "lon": -73.9946961
  },
  {
    "marque": "Levain Bakery",
    "adresse": "2 W 18th St  New York  NY 10011",
    "lat": 40.7386759,
    "lon": -73.9924807
  },
  {
    "marque": "Levain Bakery",
    "adresse": "164 N 4th St  Brooklyn  NY 11211",
    "lat": 40.715762,
    "lon": -73.9591168
  },
  {
    "marque": "Levain Bakery",
    "adresse": "167 W 74th St  New York  NY 10023",
    "lat": 40.7799362,
    "lon": -73.9803173
  },
  {
    "marque": "Levain Bakery",
    "adresse": "351 Amsterdam Ave  New York  NY 10024",
    "lat": 40.7814655,
    "lon": -73.9791356
  },
  {
    "marque": "Levain Bakery",
    "adresse": "1484 3rd Ave  New York  NY 10028",
    "lat": 40.7773502,
    "lon": -73.9552986
  },
  {
    "marque": "Levain Bakery",
    "adresse": "2167 Frederick Douglass Blvd  New York  NY 10026",
    "lat": 40.8049414,
    "lon": -73.955275
  },
  {
    "marque": "Maman",
    "adresse": "67 University Pl  New York  NY 10003",
    "lat": 40.7328622,
    "lon": -73.9934031
  },
  {
    "marque": "Maman",
    "adresse": "3 W 18th St  New York  NY 10011",
    "lat": 40.7389472,
    "lon": -73.9923405
  },
  {
    "marque": "Maman",
    "adresse": "375 Hudson St  New York  NY 10014",
    "lat": 40.7284863,
    "lon": -74.0079039
  },
  {
    "marque": "Maman",
    "adresse": "239 Centre St  New York  NY 10013",
    "lat": 40.7202727,
    "lon": -73.9983769
  },
  {
    "marque": "Maman",
    "adresse": "22 W 25th St  New York  NY 10010",
    "lat": 40.7432297,
    "lon": -73.990242
  },
  {
    "marque": "Maman",
    "adresse": "800 Washington St  New York  NY 10014",
    "lat": 40.7116803,
    "lon": -73.6695168
  },
  {
    "marque": "Maman",
    "adresse": "211 W Broadway  New York  NY 10013",
    "lat": 40.7189479,
    "lon": -74.0064064
  },
  {
    "marque": "Maman",
    "adresse": "205 Hudson St  New York  NY 10013",
    "lat": 40.7234842,
    "lon": -74.0081522
  },
  {
    "marque": "Maman",
    "adresse": "114 W 41st St  New York  NY 10036",
    "lat": 40.7544782,
    "lon": -73.9855838
  },
  {
    "marque": "Maman",
    "adresse": "12 W 48th St  New York  NY 10036",
    "lat": 40.7574073,
    "lon": -73.9791077
  },
  {
    "marque": "Maman",
    "adresse": "80 Kent St  Brooklyn  NY 11222",
    "lat": 40.7303739,
    "lon": -73.9581198
  },
  {
    "marque": "Maman",
    "adresse": "667 Lexington Ave  New York  NY 10022",
    "lat": 40.7599011,
    "lon": -73.9696793
  },
  {
    "marque": "Maman",
    "adresse": "152 Columbus Ave  New York  NY 10023",
    "lat": 40.7740598,
    "lon": -73.9815827
  },
  {
    "marque": "Maman",
    "adresse": "1424 3rd Ave  New York  NY 10028",
    "lat": 40.7755174,
    "lon": -73.9566349
  },
  {
    "marque": "Maman",
    "adresse": "154 Court St  Brooklyn  NY 11201",
    "lat": 40.6887571,
    "lon": -73.9931074
  },
  {
    "marque": "Jacques Torres",
    "adresse": "66 Water St  Brooklyn  NY 11201",
    "lat": 40.7030518,
    "lon": -73.9913958
  },
  {
    "marque": "Café d'Avignon",
    "adresse": "88 Essex St  New York  NY 10002",
    "lat": 40.717912,
    "lon": -73.9880525
  },
  {
    "marque": "Café d'Avignon",
    "adresse": "Dekalb Market Hall  445 Albee Square W  Brooklyn  NY 11201",
    "lat": 40.6912889,
    "lon": -73.9829444
  },
  {
    "marque": "Café d'Avignon",
    "adresse": "105 W 28th St  New York  NY 10001",
    "lat": 40.7464744,
    "lon": -73.9909462
  },
  {
    "marque": "Millefeuille",
    "adresse": "552 LaGuardia Pl  New York  NY 10012",
    "lat": 40.7291839,
    "lon": -73.9982031
  },
  {
    "marque": "Funny Face",
    "adresse": "319 Lafayette St  New York  NY 10012",
    "lat": 40.7253096,
    "lon": -73.994958
  },
  {
    "marque": "Funny Face",
    "adresse": "6 Fulton St  New York  NY 10038",
    "lat": 40.7064433,
    "lon": -74.0036101
  },
  {
    "marque": "Breads Bakery",
    "adresse": "18 E 16th St  New York  NY 10003",
    "lat": 40.7365428,
    "lon": -73.9918617
  },
  {
    "marque": "Breads Bakery",
    "adresse": "550 1st Ave  New York  NY 10016",
    "lat": 40.7420735,
    "lon": -73.9743366
  },
  {
    "marque": "Breads Bakery",
    "adresse": "1080 6th Ave  New York  NY 10036",
    "lat": 40.7538811,
    "lon": -73.9849316
  },
  {
    "marque": "Breads Bakery",
    "adresse": "1230 6th Ave  New York  NY 10020",
    "lat": 40.7589337,
    "lon": -73.9808983
  },
  {
    "marque": "Breads Bakery",
    "adresse": "1890 Broadway  New York  NY 10023",
    "lat": 40.7709574,
    "lon": -73.9818385
  },
  {
    "marque": "Breads Bakery",
    "adresse": "1294 3rd Ave  New York  NY 10021",
    "lat": 40.7714244,
    "lon": -73.9596363
  },
  {
    "marque": "Yanni's Coffee",
    "adresse": "96 7th Ave  New York  NY 10011",
    "lat": 40.7397717,
    "lon": -73.9989183
  }
      ]
    // fetch('coordonnees.json')
    //   .then(res => res.json())
    //   .then(data => {
    //     donneesOriginales = data;
    //   })
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

function normaliserNomImage(marque) {
  return marque
    .normalize("NFD").replace(/[\u0300-\u036f]/g, '') // supprime accents
    .replace(/['’]/g, '') // supprime apostrophes
    .split(/\s+/) // découpe en mots
    .map(m => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()) // majuscules initiales
    .join('') + '.jpeg';
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
      console.log("Liste des marques cookiesData:", cookiesData.map(c => c.Marque || c.marque));
      if (detailsDiv.style.display === 'none') {
        const infos = trouverInfosCookie(item.marque);
        if (infos) {
          const imageName = normaliserNomImage(item.marque);
          const imagePath = `Photos/${imageName}`;


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
            <b>Appréciation générale :</b> ${infos['Appréciation générale']}<br><br>
            <img src="${imagePath}" alt="${item.marque}" style="width: 120px; height: auto; border-radius: 10px; box-shadow: 0 0 6px rgba(0,0,0,0.2);" onerror="this.style.display='none';">
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
    'Note': formData.get('Note'),
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
