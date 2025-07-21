// geocode.mjs (note le .mjs pour module ESM)
import fs from "fs";
import fetch from "node-fetch";
import { parse } from "csv-parse/sync";

const csv = fs.readFileSync("Cookies_NYC.csv", "utf-8");
const records = parse(csv, { skip_empty_lines: true, delimiter: ";", relax_column_count: true });



const allResults = [];

async function geocodeAdresse(adresse) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(adresse)}&limit=1`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "CookieMap/1.0 (your@email.com)"
      }
    });
    const data = await res.json();
    if (data.length > 0) {
      return { lat: data[0].lat, lon: data[0].lon };
    }
  } catch (err) {
    console.error("Erreur pour l'adresse:", adresse, err);
  }

  return null;
}

async function process() {
  for (let i = 1; i < records.length; i++) {
    const ligne = records[i];
    const marque = ligne[0];

    for (let j = 11; j <= 27; j++) {
      const adresse = ligne[j];
      if (adresse && adresse.trim()) {
        console.log(`Géocodage: ${marque} - ${adresse}`);

        const coords = await geocodeAdresse(adresse);
        if (coords) {
          allResults.push({
            marque,
            adresse,
            lat: parseFloat(coords.lat),
            lon: parseFloat(coords.lon)
          });
        } else {
          console.warn("Adresse introuvable:", adresse);
        }

        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  fs.writeFileSync("coordonnees.json", JSON.stringify(allResults, null, 2));
  console.log(`✅ coordonnees.json généré avec ${allResults.length} points.`);
}

process();
