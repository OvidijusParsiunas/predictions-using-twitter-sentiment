var request = require('request');
var express = require("express");
var app = express();
var TwitterStreamChannels = require('twitter-stream-channels');

var client2 = {
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
};

var client = new TwitterStreamChannels(client2);

var channels = {
	"team1" : 'Brazil',
	"team2" : 'Costa,Rica,CostaRica'
};

var stream = client.streamChannels({track:channels});

//select the precision and scale at which you will be storing sentiment averages and displaying them on the UI
//Update the readme for this
let precision = 'seconds';
let scaleOfPersistance = 40;

startStreamWithFilters();

function startStreamWithFilters(){
  stream.on('channels/team1',function(tweet){
      // if(checkKeyWords(tweet.text)){
      //   console.log('executed');
      team1Tweets[team1Increment++] = {'text': tweet.text};
      if(team1Increment >= 400){
        team1Increment = 0;
      }
    //}
  });

  stream.on('channels/team2',function(tweet){
    // if(checkKeyWords(tweet.text)){
    //console.log('executed');
      team2Tweets[team2Increment++] = {'text': tweet.text};
      if(team2Increment >= 400){
        team2Increment = 0;
      }
    //}
  });
}

let footballAssociatedKeyWords = ["fifa","win","world","2018","football","lose","cup","going","luck","score","save","draw","player","ticket","history","ball","streak","kick","penalty","free","moscow"];
function checkKeyWords(text){
  expr00 = /http/i;
  expr01 = /rt/i;

    if(!expr00.test(text) && !expr01.test(text)){
      var re = new RegExp(footballAssociatedKeyWords.join("|"), "i");
      if(re.test(text)){
        console.log('true');
        return true;
      }
  }
  return false;
}

let team1Tweets = [400];
let team1Sentiment = 0;
let team1Increment = 0;
let team1TotalSentiment = 0;
let team1NoOfSentiments = 0;
let team1AverageSentiment = 0;
let team2Tweets = [400];
let team2Sentiment = 0;
let team2Increment = 0;
let team2TotalSentiment = 0;
let team2NoOfSentiments = 0;
let team2AverageSentiment = 0;

let apiCallntervalSeconds = 10;
let averageSentimentArray;
let secondsTrueScale;
if(precision === 'seconds'){
  secondsTrueScale = Math.floor(scaleOfPersistance/apiCallntervalSeconds);
  averageSentimentArray = [secondsTrueScale];
}
else{
  averageSentimentArray = [scaleOfPersistance];
}
let team1AverageSentimentArrayIndex = 0;
let currentAverage = 0;
let currentTotal = 0;
var apiCallInterval = apiCallntervalSeconds * 1000;

// Set the headers
var headers = {
    'Content-Type': 'application/json',
}

var options = {
    url: 'http://www.sentiment140.com/api/bulkClassifyJson?appid' + process.env.SENTIMENT_140_EMAIL,
    method: 'POST',
    headers: headers,
    json: true,
}

// Start the request
setInterval(function() {
if(team1Increment > 0){
  options.body = {"data": team1Tweets};
  //console.log(JSON.stringify(options.body));
  request(options, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    team1Sentiment = body.data.map(a => a.polarity).reduce((a, b) => a + b, 0)/body.data.length;
    if(precision === 'seconds'){
      console.log(secondsTrueScale);
      team1TotalSentiment = team1TotalSentiment + team1Sentiment;
      if(team1AverageSentimentArrayIndex != secondsTrueScale){
        currentAverage = team1TotalSentiment/++team1NoOfSentiments;
        averageSentimentArray[team1AverageSentimentArrayIndex++] = team1Sentiment;
        console.log('average sentiment array: ' + averageSentimentArray);
        console.log('current average: ' + currentAverage);
      }
      else{
        team1TotalSentiment = team1TotalSentiment - averageSentimentArray[0];
        averageSentimentArray.shift();
        currentAverage = team1TotalSentiment/team1NoOfSentiments;
        averageSentimentArray[team1AverageSentimentArrayIndex-1] = team1Sentiment;
        console.log('average sentiment array: ' + averageSentimentArray);
        console.log('current average: ' + currentAverage);
      }
    }
    if(precision === 'minutes'){
      team1TotalSentiment = team1TotalSentiment + team1Sentiment;
      team1AverageSentiment = team1TotalSentiment/++team1NoOfSentiments;
      console.log(team1Sentiment);
      if(team1NoOfSentiments === 6){
        if(team1AverageSentimentArrayIndex != scaleOfPersistance){
          currentTotal = currentTotal + team1AverageSentiment;
          currentAverage = currentTotal/(team1AverageSentimentArrayIndex+1);
          averageSentimentArray[team1AverageSentimentArrayIndex++] = team1AverageSentiment;
        }
        else{
          currentTotal = currentTotal - averageSentimentArray[0] + team1AverageSentiment;
          averageSentimentArray.shift();
          currentAverage = currentTotal/team1AverageSentimentArrayIndex;
          averageSentimentArray[team1AverageSentimentArrayIndex-1] = team1AverageSentiment;
          team1NoOfSentiments = 0;
          console.log('second if statement executed now');
        }
        team1TotalSentiment = 0;
        team1NoOfSentiments = 0;
        console.log('resultant array for sentiment average in minutes: ' + averageSentimentArray);
        console.log('the resultant average for the minute sentiment: ' + currentAverage);
      }
    }
    if(precision === 'hours'){
      team1TotalSentiment = team1TotalSentiment + team1Sentiment;
      team1AverageSentiment = team1TotalSentiment/++team1NoOfSentiments;
      console.log(team1Sentiment);
      if(team1NoOfSentiments === 360){
        if(team1AverageSentimentArrayIndex != scaleOfPersistance){
          currentTotal = currentTotal + team1AverageSentiment;
          currentAverage = currentTotal/(team1AverageSentimentArrayIndex+1);
          averageSentimentArray[team1AverageSentimentArrayIndex++] = team1AverageSentiment;
        }
        else{
          currentTotal = currentTotal - averageSentimentArray[0] + team1AverageSentiment;
          averageSentimentArray.shift();
          currentAverage = currentTotal/team1AverageSentimentArrayIndex;
          averageSentimentArray[team1AverageSentimentArrayIndex-1] = team1AverageSentiment;
          team1NoOfSentiments = 0;
          console.log('second if statement executed now');
        }
        team1TotalSentiment = 0;
        team1NoOfSentiments = 0;
        console.log('resultant array for sentiment average in minutes: ' + averageSentimentArray);
        console.log('the resultant average for the minute sentiment: ' + currentAverage);
      }
    }
    team1Tweets = [400];
    team1Increment = 0;
    }
  else{
      console.log(error);
      team1Tweets = [400];
      team1Increment = 0;
    }
  })
}
if(team2Increment > 0){
  options.body = {"data": team2Tweets};
  //precaution
  //console.log(JSON.stringify(options.body));
  setTimeout(function(){
  request(options, function (error, response, body) {
  if (!error && response.statusCode == 200) {
      team2Sentiment = body.data.map(a => a.polarity).reduce((a, b) => a + b, 0)/body.data.length;
      team2TotalSentiment = team2TotalSentiment + team2Sentiment;
      team2AverageSentiment = team2TotalSentiment/++team2NoOfSentiments;
      if(team2NoOfSentiments >= 1600){
        team2TotalSentiment = team2AverageSentiment;
        team2NoOfSentiments = 0;
      }
      team2Tweets = [400];
      team2Increment = 0;
    }
  else{
      console.log(error);
      team2Tweets = [400];
      team2Increment = 0;
    }
  })}
  , 2000);
}
}, apiCallInterval);
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});
app.listen(9000,()=>{
    console.log('live on port '+ 9000);
});
app.get('/',function(req,res){
res.send({'data':{'team1Sentiment': team1Sentiment, 'team2Sentiment':team2Sentiment, 'team1AverageSentiment':team1AverageSentiment, 'team2AverageSentiment':team2AverageSentiment}});
});

app.get('/teamNames',function(req,res){
res.send({'teams':{'team1':channels['team1'], 'team2':channels['team2']}});
});

app.get('/stopStream', function(req,res){
  stream.stop();
  res.send('Stream has been stopped');
})

app.post('/startWithDifferentTeams', function(req, res){
  stream.stop();//closes the stream connected to Twitter
  channels['team1'] = req.body.team1Name;
  channels['team2'] = req.body.team2Name;
  team1Tweets = [400];
  team1Sentiment = 0;
  team1Increment = 0;
  team1TotalSentimentOneMinute = 0;
  team1NoOfSentiments = 0;
  team1AverageSentiment = 0;
  team2Tweets = [400];
  team2Sentiment = 0;
  team2Increment = 0;
  team2TotalSentiment = 0;
  team2NoOfSentiments = 0;
  team2AverageSentiment = 0;
  client = new TwitterStreamChannels(client2);
  stream = client.streamChannels({track:channels});
  startStreamWithFilters();
  res.send('Success');
});
