import puppeteer from "puppeteer";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
const PORT = 3000;

async function fetchRoverPhotos(rover, sol, apiKey) {
  const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos`;
  const params = new URLSearchParams({
    sol,
    api_key: "DEMO_KEY",
  });

  try {
    const response = await fetch(`${url}?${params}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data.photos;
  } catch (error) {
    console.error("Error fetching rover photos:", error);
    return [];
  }
}

async function scrapeData() {
  const browser = await puppeteer.launch({
    userDataDir: "./user_data",
    headless: true,
    defaultViewport: false,
  });
  const page = await browser.newPage();

  let extractedData = [];
  let extractedDate, extractedSol, maxTemp, minTemp;
  await page.goto("https://mars.nasa.gov/msl/weather/", {
    waitUntil: "networkidle0",
  });

  for (let i = 2; i <= 8; i++) {
    await page.waitForSelector("#weather_observation > tbody");

    extractedDate = await page.$eval(
      `#weather_observation > tbody > tr:nth-child(${i}) > th:nth-child(1)`,
      (element) => element.textContent
    );
    extractedSol = await page.$eval(
      `#weather_observation > tbody > tr:nth-child(${i}) > th:nth-child(2)`,
      (element) => element.textContent
    );
    maxTemp = await page.$eval(
      `#weather_observation > tbody > tr:nth-child(${i}) > td.temperature.max > span.fahrenheit > nobr`,
      (element) => element.textContent
    );
    minTemp = await page.$eval(
      `#weather_observation > tbody > tr:nth-child(${i}) > td.temperature.min > span.fahrenheit > nobr`,
      (element) => element.textContent
    );

    extractedData.push({
      date: extractedDate,
      sol: extractedSol,
      minTemp: minTemp,
      maxTemp: maxTemp,
    });
  }

  let photos = await fetchRoverPhotos("curiosity", 3000, "DEMO_KEY");
  let randomIndex = Math.floor(Math.random() * photos.length) + 1;
  let randomPhotoUrl = photos[randomIndex].img_src;
  extractedData.push({
    imgUrl: randomPhotoUrl,
  });
  // for (const photo of photos) {
  //   const imgSrc = photo.img_src;
  //   console.log(imgSrc); 
  // }

  console.log("Extracted text:", extractedDate);
  console.log("Extracted data:", extractedData);

  await browser.close();
  return extractedData;
}

app.get("/", async (req, res, next) => {
  try {
    const extractedData = await scrapeData();
    res.send(extractedData);
  } catch (error) {
    next(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
