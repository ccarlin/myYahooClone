// filepath: d:\Documents\My Projects\my-yahoo-client\server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require("fs");
const yahooFinance = require('yahoo-finance2').default;
const fetchWeatherApi = require('openmeteo').fetchWeatherApi;
const RSSParser = require('rss-parser');
const rssParser = new RSSParser();
const axios = require("axios");

const app = express();
const PORT = 5000;
let weatherCodes = {};

// Middleware
app.use(cors());
app.use(bodyParser.json());


// API Endpoints
app.post('/myYahoo/stockUpdate', async function(req, res)  {
    let jsonData = getConfigData();
    let portfolioList = jsonData.Portfolios;
    portfolioList = await GetPortfolios(portfolioList);  

    return res.send(portfolioList);
});

app.post('/myYahoo/newsUpdate', async function(req, res) {
    let newsFeeds = [];
    let jsonData = getConfigData();
    let newsFeedList = jsonData.NewsFeeds;
    try
    {        
        newsFeeds = await getNewsFeedInfo(newsFeedList);            
    }
    catch (err)
    {
        console.log(`Issue pulling News feeds: ${err}`);
    }
    
    return res.send(newsFeeds);
});

app.post('/myYahoo/sportsUpdate', async function(req, res) {
    let jsonData = getConfigData();
    let sportsFeeds = jsonData.Sports;
    sportsFeeds = await GetSportInfo(sportsFeeds);  
    
    return res.send(sportsFeeds);
});

app.post('/myYahoo/weatherUpdate', async function(req, res) {
    let weatherInfo = [];    
    let jsonData = getConfigData();
    let weatherAreas = jsonData.WeatherAreas;   
    weatherCodes = jsonData.WeatherCodes; // Ensure weatherCodes is populated correctly    
    weatherInfo = await getWeatherInfo(weatherAreas);
       
    return res.send(weatherInfo);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

function getConfigData()
{
    let jsonFile = fs.readFileSync("./myyahoo.json");
    let jsonData = JSON.parse(jsonFile);

    return jsonData;
}

async function GetSportInfo(sportsFeeds)
{
    //Get sports scores for each league
    for (let i=0; i<sportsFeeds.length; i++) {
        let sport = sportsFeeds[i];
        let teams = [];
        for(let j=0;j<sport.teams.length;j++)
            teams.push(sport.teams[j].id);
        try {
            let yesterdayData = await getSportsFeed(sport, teams, getDate(-1));
            let todaysData = await getSportsFeed(sport, teams, getDate(0));            
            let tomorrowsData = await getSportsFeed(sport, teams, getDate(1));       
            let allData = yesterdayData.concat(todaysData, tomorrowsData);              
            sportsFeeds[i].sportData = allData;            
        }
        catch (err) {
            console.log(`Error pulling sports data: ${err}`);
        }
    }

    return sportsFeeds;
}

async function GetPortfolios(portfolioList)
{
    //Get logging info to supress
    const originalConsoleLog = console.log;
    const originalErrorLog = console.error; 

    //Get stock prices for each portfolio
    for (let i = 0; i < portfolioList.length; i++) {
        let portfolio = portfolioList[i];
        let symbols = portfolio.stockList;        
        console.log = () => {}; 
        console.error = () => {}; 
        let portfolioData = await getStockPrices(symbols);
        // Restore original console.log
        console.log = originalConsoleLog; 
        console.error = originalErrorLog;
        portfolioList[i].portfolioData = portfolioData;
    }

    return portfolioList;
}

async function getStockPrices(symbols)
{
    const promises = symbols.map(async (symbol) => {
        try {
            const quote = await yahooFinance.quote(symbol);
            return {
                symbol: symbol,
                name: quote.shortName,
                price: quote.regularMarketPrice,
                change: quote.regularMarketChange,
                changePercent: quote.regularMarketChangePercent,
                time: quote.regularMarketTime
            };
        } catch (error) {
            return {
                symbol: symbol,
                error: error.message
            };
        }
    });

    return Promise.all(promises);
}

async function getNewsFeedInfo(feedList)
{
    let newsFeeds = [];
    let feedData = {};
    for(let i = 0; i < feedList.length; i++) {
        let feed = feedList[i];
        try
        {
            feedData = await rssParser.parseURL(feed.url);
            feedData.name = feed.name;
            feedData.items = feedData.items.slice(0, 5);
            newsFeeds.push(feedData);
        }
        catch (err)
        {
            console.log(`Error pulling news feed: ${feed.url}, Error: ${err}`);
        }
    }
    return newsFeeds;
}

async function getWeatherInfo(areaList)
{
    let weatherInfo = [];
    for(let i = 0; i < areaList.length; i++) 
    {
        let area = areaList[i];
        let weatherData = await getWeatherData(area);    
        areaList[i].weatherData = weatherData;   
        weatherInfo.push(weatherData);
    }
    return areaList;
}

async function getWeatherData(area)
{
    const params = {
        "latitude": area.latitude,  
        "longitude": area.longitude,         
        "current": ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "weather_code", "wind_speed_10m", "wind_direction_10m"],
        "daily": ["weather_code", "temperature_2m_max", "temperature_2m_min", "sunshine_duration","precipitation_probability_max",  "wind_speed_10m_max", "wind_direction_10m_dominant"],
        "temperature_unit": "fahrenheit",
        "wind_speed_unit": "mph",
        "precipitation_unit": "inch",
        "timeformat": "unixtime",
        "timezone": "America/Chicago",
        "forecast_days": 3
    };
    const url = "https://api.open-meteo.com/v1/forecast";
    const responses = await fetchWeatherApi(url, params);

    const range = (start, stop, step) => Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

    const response = responses[0];

    // Attributes for timezone and location
    const utcOffsetSeconds = response.utcOffsetSeconds();
    const current = response.current();
    const currentWeatherCode = current.variables(3).value();
    const currentWeatherValue = weatherCodes[currentWeatherCode] || "Unknown"; // Lookup weatherCode in weatherCodes

    const daily = response.daily();
    let dailyWeatherCodes = [];
    for (let i=0;i<daily.variables(0).valuesArray().length;i++)
    {
        let weatherCode = daily.variables(0).valuesArray()[i];
        let dailyWeatherValue = weatherCodes[weatherCode] || "Unknown"; // Lookup weatherCode in weatherCodes
        dailyWeatherCodes[i] = dailyWeatherValue;
    }
    
    // Note: The order of weather variables in the URL query and the indices below need to match!
    const weatherData = {
        name: area.name,
        current: {
            weatherCode: currentWeatherValue,
            time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
            temp: current.variables(0).value(),
            humidty: current.variables(1).value(),
            feelsLike: current.variables(2).value(),
            windSpeed: current.variables(4).value(),
            windDirection: current.variables(5).value()
        },
        daily: {      
            weatherCode: dailyWeatherCodes,
            tempMax: daily.variables(1).valuesArray(),
            tempMin: daily.variables(2).valuesArray(),       
            sun: daily.variables(3).valuesArray(),     
            precipitation: daily.variables(4).valuesArray(),
            windSpeed: daily.variables(5).valuesArray(),
            windDirection: daily.variables(6).valuesArray(),
            time: range(Number(daily.time()), Number(daily.timeEnd()), daily.interval()).map(
                (t) => new Date((t) * 1000)
            )
        },
    };

    return weatherData;
}

function getDate(offset) 
{
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + offset);
  
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(tomorrow.getDate()).padStart(2, '0');
  
    return `${year}${month}${day}`;
}

async function getSportsFeed(sport, teams, dateFetch)
{
    let sportsFeeds = [];

    try {
        let scoreboardURL = sport.scoreboard;
        if (dateFetch)
            scoreboardURL += "?dates=" + dateFetch;
        let results = await axios.get(scoreboardURL);   
        let scoreboard = results.data;
        if (scoreboard.events)
        {
            for(let j=0;j<scoreboard.events.length;j++)
            {
                let game_link = "";
                let box_score_link = "";
                let recap_link = "";
                let home_score = "";
                let away_score = "";
                let result = "N/A";
                let event = scoreboard.events[j];
                
                if ((event.competitions) && (event.competitions[0].competitors))
                {
                    let homeTeam = event.competitions[0].competitors[0];
                    let awayTeam = event.competitions[0].competitors[1];
                    let teamCheck = (teams.includes(homeTeam.id) || teams.includes(awayTeam.id));
                    if (teamCheck === false)
                        continue;
                     
                    let title = event.shortName;
                    let home_logo = homeTeam.team.logo;
                    let away_logo = awayTeam.team.logo;
                    let utcDate = new Date(event.date);
                    let localDate = utcDate.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
                    let status = event.status.type.state; // "pre" = pregame, "in" = in progress, "post" = postgame
                    switch (status){
                        case "in":
                            status = event.status.type.shortDetail;
                            home_score = homeTeam.score;
                            away_score = awayTeam.score;
                            break;
                        case "pre":
                            status = "Scheduled";
                            break;
                        case "post":
                            status = "Final";
                            home_score = homeTeam.score;
                            away_score = awayTeam.score;
                            break;
                        default:
                            status = "Unknown";
                            break;
                    }

                    //Check if my team won
                    if (status === "Final")
                    {
                        //If my team is the home team check who won
                        if (teams.includes(homeTeam.id)) 
                        {
                            if (homeTeam.winner)
                                result = "Win";
                            else if (awayTeam.winner)
                                result = "Loss";
                            else 
                                result = "Tie";
                        }
                        else
                        {   
                            if (awayTeam.winner)
                                result = "Win";
                            else if (homeTeam.winner)
                                result = "Loss";    
                            else 
                                result = "Tie";                        
                        }                      
                    }
                    
                    if (event.links)
                    {
                        for(let i=0;i<event.links.length;i++)
                        {
                            let linkItem = event.links[i]
                            switch (linkItem.shortText) {
                                case "Box Score":
                                    box_score_link = linkItem.href;
                                    break;
                                case "Gamecast":
                                    game_link = linkItem.href;
                                    break;
                                case "Recap":
                                    recap_link = linkItem.href;
                                    break;
                                default:
                                    break;
                            }
                        }                       
                    }
                    let formattedFeed = {
                        name: sport.name,
                        items: [{
                            home_logo: home_logo,
                            away_logo: away_logo,
                            title: title,
                            date: localDate,
                            status: status,
                            home_score: home_score,
                            away_score: away_score,                            
                            result: result,
                            link: game_link,
                            box_score: box_score_link,
                            recap: recap_link
                        }]
                    };
                    sportsFeeds.push(formattedFeed);
                }
            }
        }        
    } catch (error) {
        console.error(`Error fetching sports feed for ${sport.name}:`, error);
        sportsFeeds.push({
            name: sport.name,
            items: []
        });
    }

    return sportsFeeds;
}