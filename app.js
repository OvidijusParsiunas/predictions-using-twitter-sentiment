var request = require('request');
var express = require("express");
var app = express();
var TwitterStreamChannels = require('twitter-stream-channels');

var client2 = {
  consumer_key: 'b',
  consumer_secret: 'm',
  access_token: 'a',
  access_token_secret: 'i'
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
let scaleOfPersistance = 10;

let apiCallntervalSeconds = 10;
let averageSentimentArray;
let secondsTrueScale;
if(precision != 'seconds' && precision != 'minutes' && precision!= 'hours'){
  //have an enum to spit out the array and use a loop instead of an if statement
  console.log('ERROR - precision variable unidentified, please set the precision variable to one of the following values: seconds, minutes, hours');
}
if(precision === 'seconds'){
  if(scaleOfPersistance<apiCallntervalSeconds)
  {
    console.log('ERROR - The scale of precision needs to be equal to or higher than the frequency at which text sentiment is retrieved.');
    process.exit();
  }
  secondsTrueScale = Math.floor(scaleOfPersistance/apiCallntervalSeconds);
  averageSentimentArray = [secondsTrueScale];
}
else{
  if(precision === 'minutes' && apiCallInterval > 60){
      console.log('ERROR - Interval for calling sentiment api cannot be above 60 seconds for tracking average sentiment in minutes precision');
      process.exit();
}
  else if(precision === 'hours' && apiCallInterval > 3600){
    console.log('ERROR - Interval for calling sentiment api cannot be above 60 seconds for tracking average sentiment in hours precision');
    process.exit();
  }
  averageSentimentArray = [scaleOfPersistance];
}


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

let team1AverageSentimentArrayIndex = 0;
let currentAverage = 0;
let currentTotal = 0;
let numberOfIterationsForMinutes;
let numberOfIterationsForHours;
var apiCallInterval;
// if one of the variables is not a full number; such as 7.5, change the interval to match interval
// 7.5 -> use floor, and lower the interval by 25%;
if(precision === 'seconds'){
  apiCallInterval = apiCallntervalSeconds * 1000;
}
if(precision === 'minutes'){
  numberOfIterationsForMinutes = Math.floor(60/apiCallntervalSeconds);
  // if(numberOfIterationsForMinutes == not round){
  //   iterationChangeRatio = numberOfIterationsForMinutes / Math.floor(numberOfIterationsForMinutes);
  //   apiCallInterval = apiCallntervalSeconds * (1000*iterationChangeRatio);
  // }
}
if(precision === 'hours'){
  numberOfIterationsForHours = Math.roof(3600/apiCallntervalSeconds);
  // if(numberOfIterationsForMinutes == not round){
  //   iterationChangeRatio = numberOfIterationsForHours / Math.floor(numberOfIterationsForHours);
  //   apiCallInterval = apiCallntervalSeconds * (1000*iterationChangeRatio);
  // }
}

//60/8 = 7.5; Meaning if the we say a minute is 7 iterations, we will be wrong as a minute will not have passed yet
//60/8 = 8; Meaning if the way say a minute is 8 iterations, we will be ahead of time

// Set the headers
var headers = {
    'Content-Type': 'application/json',
}

var options = {
    url: 'http://www.sentiment140.com/api/bulkClassifyJson?appid=a',
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
      if(team1NoOfSentiments === numberOfIterationsForMinutes){
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
      if(team1NoOfSentiments === numberOfIterationsForHours){
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
  //depending on the number of fields in the graph, send back an indicator to how many columns should be skipped
  res.send({'data':{'team1Sentiment': team1Sentiment, 'team2Sentiment':team2Sentiment, 'team1AverageSentiment':team1AverageSentiment, 'team2AverageSentiment':team2AverageSentiment}});
});

app.get('/teamNames',function(req,res){
  res.send({'teams':{'team1':channels['team1'], 'team2':channels['team2']}});
});

app.get('/stopStream', function(req,res){
  stream.stop();
  res.send('Stream has been stopped');
});

//send the amount of fields as a parameter
app.get('/getPersistedData10Fields', function(req,res){
});

app.get('/getPersistedData20Fields', function(req,res){
});

//potential functionality
app.get('/getGraphScale', function(req, res){
});

app.get('/getRetrievalRate', function(req, res){
  //get parameter, the rate will be different for a different scale
  //scaleOfPersistance/graphScale
});

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
