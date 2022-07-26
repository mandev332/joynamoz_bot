import fetch from "node-fetch";

export default async function (lat, long) {
  let locatsiya = await fetch(
    `https://api.opencagedata.com/geocode/v1/json?key=${process.env.GEO_API_KEY}&q=${lat}%2C+${long}&pretty=1&no_annotations=1`
  );

  return await locatsiya.json();
}
