import puppeteer from "puppeteer";
import express from "express";

const app = express();
const PORT = 3000;

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
