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
app.post('/stockUpdate', async function(req, res)  {
    let jsonData = getConfigData();
    let portfolioList = jsonData.Portfolios;
    portfolioList = await GetPortfolios(portfolioList);  

    return res.send(portfolioList);
});

app.post('/newsUpdate', async function(req, res) {
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

app.post('/sportsUpdate', async function(req, res) {
    let jsonData = getConfigData();
    let sportsFeeds = jsonData.Sports;
    sportsFeeds = await GetSportInfo(sportsFeeds);  
    
    return res.send(sportsFeeds);
});

app.post('/weatherUpdate', async function(req, res) {
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
    const yf = new yahooFinance();
    const promises = symbols.map(async (symbol) => {
        try {
            const quote = await yf.quote(symbol);
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
    // Detect if the feedList is in the old format
    const isOldFormat = feedList.some(feed => feed.category && !feed.feeds);

    if (isOldFormat) {
        // Transform old format to new format
        feedList = transformOldToNewFormat(feedList);
    }

    for (let i = 0; i < feedList.length; i++) {
        let category = feedList[i];
        for (let j = 0; j < category.feeds.length; j++) {
            let feed = category.feeds[j];
            try {
                let feedData = await rssParser.parseURL(feed.url);
                feedData.name = feed.name;
                feedData.items = feedData.items.slice(0, 5); // Limit to 5 items
                category.feeds[j].feedData = feedData;
            } catch (err) {
                console.log(`Error pulling news feed: ${feed.url}, Error: ${err}`);
                // Mark the feed for removal
                category.feeds[j].toRemove = true;
            }
        }
        // Remove feeds marked for removal
        category.feeds = category.feeds.filter(feed => !feed.toRemove);
    }

    return feedList;
}

// Helper function to transform old format to new format
function transformOldToNewFormat(feedList) {
    const transformed = [];

    // Group feeds by category
    const categoryMap = {};
    feedList.forEach(feed => {
        const category = feed.category || "Uncategorized";
        if (!categoryMap[category]) {
            categoryMap[category] = {
                category: category,
                feeds: []
            };
        }
        categoryMap[category].feeds.push({
            name: feed.name,
            url: feed.url
        });
    });

    // Convert categoryMap to an array
    for (const category in categoryMap) {
        transformed.push(categoryMap[category]);
    }

    return transformed;
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
        "forecast_days": area.days ? area.days : 3 // Use area.days if set, otherwise default to 3
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

// #region Helper Methods
function getConfigData()
{
    let jsonFile = fs.readFileSync("./myyahoo.json");
    let jsonData = JSON.parse(jsonFile);

    return jsonData;
}

function saveConfigData(jsonData)
{
    fs.writeFileSync("./myYahoo.json", JSON.stringify(jsonData, null, 2)); 
}

// #endregion

// #region API Endpoints
app.post('/removeWeatherLocation', async function (req, res) {
    let jsonData = getConfigData();
    let locationName = req.body.locationName;

    // Find and remove the weather location
    const index = jsonData.WeatherAreas.findIndex(area => area.name === locationName);
    if (index !== -1) {
        jsonData.WeatherAreas.splice(index, 1); // Remove the location from the array
        saveConfigData( jsonData); // Save the updated data back to the file     
        return res.send({ success: true, message: `Weather location "${locationName}" removed successfully.` });
    } else {
        return res.send({ success: false, message: `Weather location "${locationName}" not found.` });
    }
});

app.post('/removeStock', async function (req, res) {
   
    let jsonData = getConfigData();
    let portfolioName = req.body.portfolioName;
    let stockSymbol = req.body.stockSymbol;

    // Find the portfolio
    let portfolio = jsonData.Portfolios.find(p => p.name === portfolioName);
    if (portfolio) {
        // Find and remove the stock from the portfolio
        const index = portfolio.stockList.findIndex(stock => stock === stockSymbol);
        if (index !== -1) {
            portfolio.stockList.splice(index, 1); // Remove the stock from the array
            saveConfigData( jsonData); // Save the updated data back to the file     
            return res.send({ success: true, message: `Stock "${stockSymbol}" removed from portfolio "${portfolioName}" successfully.` });
        } else {
            return res.send({ success: false, message: `Stock "${stockSymbol}" not found in portfolio "${portfolioName}".` });
        }
    } else {
        return res.send({ success: false, message: `Portfolio "${portfolioName}" not found.` });
    }
});

app.post('/removeRSSFeed', async function (req, res) {
    let jsonData = getConfigData();
    
    let categoryName = req.body.category;
    let feedName = req.body.feedName;

    // Find the category
    let category = jsonData.NewsFeeds.find(c => c.category === categoryName);
    if (category) {
        // Find and remove the RSS feed from the category
        const index = category.feeds.findIndex(feed => feed.name === feedName);
        if (index !== -1) {
            category.feeds.splice(index, 1); // Remove the feed from the array
            saveConfigData( jsonData); // Save the updated data back to the file     
            return res.send({ success: true, message: `RSS feed "${feedName}" removed from category "${categoryName}" successfully.` });
        } else {
            return res.send({ success: false, message: `RSS feed "${feedName}" not found in category "${categoryName}".` });
        }
    } else {
        return res.send({ success: false, message: `Category "${categoryName}" not found.` });
    }
});

app.post('/addRSSFeed', async function (req, res) {
    let jsonData = getConfigData();
    
    let categoryName = req.body.category;
    let feedUrl = req.body.rssUrl;
    let feedName = req.body.name;

    // Validate input
    if (!categoryName || !feedUrl || !feedName) {
        return res.send({ success: false, message: 'Category, feed name, and feed URL are required.' });
    }

    // Check if the category already exists
    let category = jsonData.NewsFeeds.find(c => c.category === categoryName);
    if (category) {
        // Check if the feed already exists in the category
        let existingFeed = category.feeds.find(feed => feed.url === feedUrl);
        if (existingFeed) {
            return res.send({ success: false, message: `RSS feed "${feedName}" already exists in category "${categoryName}".` });
        }

        // Add the new feed to the existing category
        category.feeds.push({ name: feedName, url: feedUrl });
    } else {
        // Create a new category and add the feed
        jsonData.NewsFeeds.push({
            category: categoryName,
            feeds: [{ name: feedName, url: feedUrl }]
        });
    }

    // Save the updated data back to the file
    saveConfigData( jsonData); // Save the updated data back to the file     

    return res.send({ success: true, message: `RSS feed "${feedName}" added to category "${categoryName}" successfully.` });
});

app.post('/addStock', async function (req, res) {
    let jsonData = getConfigData();
    
    let portfolioName = req.body.portfolioName;
    let stockSymbols = req.body.stockSymbol; // Comma-delimited list of stock symbols

    // Validate input
    if (!portfolioName || !stockSymbols) {
        return res.send({ success: false, message: 'Portfolio name and stock symbols are required.' });
    }

    // Split the stock symbols into an array
    const stockList = stockSymbols.split(',').map(symbol => symbol.trim()).filter(symbol => symbol);

    if (stockList.length === 0) {
        return res.send({ success: false, message: 'No valid stock symbols provided.' });
    }

    // Check if the portfolio already exists
    let portfolio = jsonData.Portfolios.find(p => p.name === portfolioName);
    if (portfolio) {
        // Add each stock to the portfolio if it doesn't already exist
        stockList.forEach(stockSymbol => {
            if (!portfolio.stockList.includes(stockSymbol)) {
                portfolio.stockList.push(stockSymbol);
            }
        });
    } else {
        // Create a new portfolio and add the stocks
        jsonData.Portfolios.push({
            name: portfolioName,
            stockList: stockList
        });
    }

    // Save the updated data back to the file
    saveConfigData( jsonData);

    return res.send({ success: true, message: `Stocks added to portfolio "${portfolioName}" successfully.` });
});

app.post('/addWeatherLocation', async function (req, res) {
    let jsonData = getConfigData();
    
    let locationName = req.body.locationName;
    let latitude = req.body.latitude;   
    let longitude = req.body.longitude;
    let days = req.body.days || 3; // Default to 3 days if not provided

    // Check if the location already exists
    let existingLocation = jsonData.WeatherAreas.find(area => area.name === locationName);
    if (existingLocation) {
        return res.send({ success: false, message: `Weather location "${locationName}" already exists.` });
    }

    // Add the new weather location
    jsonData.WeatherAreas.push({
        name: locationName,
        latitude: latitude,
        longitude: longitude,
        days: days,
        collapsed: false // Set collapsed to false by default
    });

    // Save the updated data back to the file
    saveConfigData( jsonData); // Save the updated data back to the file     

    return res.send({ success: true, message: `Weather location "${locationName}" added successfully.` });
});

app.post('/searchLocation', async function (req, res) {
    const locationName = req.body.locationName;
    // Convert string "true"/"false" to boolean
    const international = req.body.international === true || req.body.international === 'true';

    if (!locationName) {
        return res.send({ success: false, message: 'Location name is required.' });
    }

    let url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=10&language=en&format=json&countryCode=US`;
    if (international === true) {
        url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=10&language=en&format=json`;
    }
    
    try {
        const response = await axios.get(url);
        if (response.data && response.data.results && response.data.results.length > 0) {
            return res.send({ success: true, locations: response.data.results });
        } else {
            return res.send({ success: false, message: `No locations found for "${locationName}".` });
        }
    } catch (error) {
        console.error(`Error fetching locations for "${locationName}":`, error.message);
        return res.send({ success: false, message: 'An error occurred while searching for locations.' });
    }
});

app.post('/getTeamList', async function (req, res) {
    console.log("Get Team List called");
    const sportName = req.body.league;
    if (!sportName) {
        return res.send({ success: false, message: 'A valid sport is required.' });
    }
    
    const configPath = req.app.locals.configPath;
    const fileName = req.body.fileName || "startPageInfo";
    const jsonData = getConfigData(configPath, fileName);
    const existingSportsConfig = jsonData.Sports || [];
    let teams = [];   
    let sportPath = "";
    switch (sportName) {
        case "NHL":
            sportPath = "hockey/nhl";
            break;
        case "NFL":
            sportPath = "football/nfl";
            break;
        case "NBA":
            sportPath = "basketball/nba";
            break;
        case "MLB":
            sportPath = "baseball/mlb";
            break;
        case "MLS":
            sportPath = "soccer/mls";
            break;
        default:
            return res.send({ success: false, message: `Sport "${sportName}" not supported.` });
    }

    try {
        // Fetch the list of teams from the external API
        const teamList = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/${sportPath}/teams`);
        if (teamList.data && teamList.data.sports && teamList.data.sports.length > 0) {
            teams = teamList.data.sports[0].leagues[0].teams.map(team => {
                const teamId = team.team.id;

                // Check if the team is already in the existing sports configuration
                const isSelected = existingSportsConfig.some(sport => 
                    sport.name === sportName && sport.teams.some(existingTeam => existingTeam.id === teamId)
                );

                return {
                    id: teamId,
                    name: team.team.displayName,
                    logo: team.team.logos[0].href,
                    selected: isSelected // Mark as selected if already in the configuration
                };
            });
        }

        if (teams.length === 0) {
            return res.send({ success: false, message: `No teams found for sport "${sportName}".` });
        }

        return res.send({ success: true, teams: teams });
    } catch (error) {
        console.error(`Error fetching teams for league "${sportName}":`, error.message);
        return res.send({ success: false, message: 'An error occurred while fetching teams.' });
    }
});

app.post('/saveSelectedTeams', async function (req, res) {
    const { league, selectedTeams } = req.body;

    if (!league || !selectedTeams || !Array.isArray(selectedTeams)) {
        return res.send({ success: false, message: 'Invalid data provided.' });
    }

    let jsonData = getConfigData();

    // Update the sports configuration
    const sportConfig = jsonData.Sports.find(sport => sport.name === league);
    if (sportConfig) {
        sportConfig.teams = selectedTeams; // Replace the teams for the league
    } else {
        // Add a new league configuration if it doesn't exist
        jsonData.Sports.push({ name: league, teams: selectedTeams });
    }

    // Save the updated configuration
    saveConfigData(jsonData);

    return res.send({ success: true, message: 'Teams saved successfully.' });
});

app.post('/updateCollapsedState', async function (req, res) {
    const { section, name, collapsed } = req.body;

    if (!section || !name || typeof collapsed === 'undefined') {
        return res.send({ success: false, message: 'Invalid data provided.' });
    }

    let jsonData = getConfigData();

    if (!jsonData) {
        return res.send({ success: false, message: 'Failed to load configuration data.' });
    }

    try {
        let updated = false;

        // Update the collapsed state for the specified section
        switch (section) {
            case 'Portfolios':
                { const portfolio = jsonData.Portfolios.find(p => p.name === name);
                if (portfolio) {
                    portfolio.collapsed = collapsed;
                    updated = true;
                }
                break; }
            case 'WeatherAreas':
                { const weatherArea = jsonData.WeatherAreas.find(w => w.name === name);
                if (weatherArea) {
                    weatherArea.collapsed = collapsed;
                    updated = true;
                }
                break; }
            case 'NewsCategories':
                { 
                    const newsCategory = jsonData.NewsFeeds.find(n => n.category === name);
                    if (newsCategory) {
                        newsCategory.collapsed = collapsed;
                        updated = true;
                    }
                    break; 
                }
            case 'NewsFeeds':
                { 
                    // Split the name into category and feed name
                    const pieces = name.split(':');
                    const newsCategory = jsonData.NewsFeeds.find(n => n.category === pieces[0]);
                    if (newsCategory) {
                        const feed = newsCategory.feeds.find(f => f.name === pieces[1]);
                        if (feed) {
                            feed.collapsed = collapsed;
                            updated = true;
                        }                                              
                }
                break; }
            case 'Sports':
                { const sport = jsonData.Sports.find(s => s.name === name);
                if (sport) {
                    sport.collapsed = collapsed;
                    updated = true;
                }
                break; }
            default:
                return res.send({ success: false, message: 'Invalid section provided.' });
        }

        if (updated) {
            saveConfigData(jsonData);
            return res.send({ success: true, message: 'Collapsed state updated successfully.' });
        } else {
            return res.send({ success: false, message: `Item "${name}" not found in section "${section}".` });
        }
    } catch (error) {
        console.error(`Error updating collapsed state: ${error.message}`);
        return res.send({ success: false, message: 'An error occurred while updating the collapsed state.' });
    }
});
// #endregion