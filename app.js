var request = require('request');
var express = require("express");
var app = express();
var TwitterStreamChannels = require('twitter-stream-channels');
var accurateInterval = require('accurate-interval');

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


/*/////// AGREED TERMINOLOGY //////////

timespan - interim for the analysed sentiment data
XAxisRange - number of points on the graph x axis
*/


//select the precision and scale at which you will be storing sentiment averages and displaying them on the UI
//Update the readme for this
let precision = 'minutes';
let scaleOfPersistance = 8;

let apiCallIntervalSeconds = 5;
let team1AverageSentimentArray;
let team2AverageSentimentArray;
let secondsTrueScale;

if(apiCallIntervalSeconds === undefined || apiCallIntervalSeconds === 0){
  console.log('ERROR - please set the apiCallIntervalSeconds variable (used for calling sentiment analysis API) to 1 or higher');
  process.exit();
}
if(scaleOfPersistance === undefined || scaleOfPersistance === 0){
  console.log('ERROR - please set the scaleOfPersistance variable (used for defining the amount of stored sentiment data) to 1 or higher');
  process.exit();
}
if(precision != 'seconds' && precision != 'minutes' && precision!= 'hours'){
  //have an enum to spit out the array and use a loop instead of an if statement
  console.log('ERROR - precision variable unidentified, please set the precision variable to one of the following values: seconds, minutes, hours');
  process.exit();
}
if(precision === 'seconds'){
  if(scaleOfPersistance<apiCallIntervalSeconds)
  {
    console.log('ERROR - The scale of precision needs to be equal to or higher than the frequency at which text sentiment is retrieved.');
    process.exit();
  }
  secondsTrueScale = Math.floor(scaleOfPersistance/apiCallIntervalSeconds);
  team1AverageSentimentArray = [];
  team2AverageSentimentArray = [];
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
  team1AverageSentimentArray = [];
  team2AverageSentimentArray = [];
}
function retrieveAvailableGraphDimensions(){
  var availableGraphDataScales = new Object();
  retrieveAvailableTimeSpans().forEach((timeSpan) => {availableGraphDataScales[timeSpan] = retrieveAvailableXAxisRangesForTimeSpan(timeSpan)});
  return availableGraphDataScales;
}

//store averages

/*
test cases
Seconds:
scaleOfPersistance  interval
2                   1
5                   2
7                   5
10                  5
60                  10
60                  25
70                  15
Minutes:
scaleOfPersistance timeIncreaseRate
2                  1
5                  3
7                  5
10                 10
29                 30
60                 30
70                 15
*/

function retrieveAvailableTimeSpans(){
  if(precision === 'seconds'){
    //the increase rate is decided by the call interval time for the sentiment api
    let numberOfAvailableTimeSpans = Math.floor(scaleOfPersistance/apiCallIntervalSeconds);
    let availableTimeSpans = new Array(numberOfAvailableTimeSpans);
    for(let i = 0; i < numberOfAvailableTimeSpans; i++){
      availableTimeSpans[i] = (i+1)*apiCallIntervalSeconds;
    }
    return availableTimeSpans;
  }
  else{
    let timeIncreaseRate = 10;
    if(timeIncreaseRate === undefined || timeIncreaseRate === 0){
      console.log('ERROR - please set the timeIncrease variable (used for defining the size of multiple time spans) to 1 or higher');
      process.exit();
    }
    let numberOfAvailableTimeSpans = Math.floor(scaleOfPersistance/timeIncreaseRate);
    let availableTimeSpans = new Array(numberOfAvailableTimeSpans);
    for(let i = 0; i < numberOfAvailableTimeSpans; i++){
      availableTimeSpans[i] = (i+1)*timeIncreaseRate;
    }
    return availableTimeSpans;
  }
}

function retrieveAvailableXAxisRangesForTimeSpan(timeSpan){
  //if the graph scale is below 10 - it is not broken up any further
  if(precision === 'seconds'){
    let availableLargestScaleForSeconds = Math.floor(timeSpan/apiCallIntervalSeconds);
    if(availableLargestScaleForSeconds < 10){
      return [availableLargestScaleForSeconds];
    }
    else{
      let availableXAxis = new Array(availableLargestScaleForSeconds);
      let availableXAxisIndex = 0;
      for(var i = 10; i <= availableLargestScaleForSeconds; i++){
        if(availableLargestScaleForSeconds%i === 0){
          availableXAxis[availableXAxisIndex++] = i;
        }
      }
      availableXAxis.splice(availableXAxisIndex, availableLargestScaleForSeconds-availableXAxisIndex);
      return availableXAxis;
    }
  }
  else{
    if(timeSpan < 10){
      return [timeSpan];
    }
    else{
      let availableXAxis = new Array(timeSpan);
      let availableXAxisIndex = 0;
      for(var i = 10; i <= timeSpan; i++){
        if(timeSpan%i === 0){
          availableXAxis[availableXAxis++] = i;
        }
      }
      availableXAxis.splice(availableXAxisIndex, timeSpan-availableXAxisIndex);
      return availableXAxis;
    }
  }
}

//find out why the returned data of persistedData has nulls within it

//this logic will be in the frontend
function retrieveInitialGraphScale(){
  if(scaleOfPersistance < 10){
    return scaleOfPersistance;
  }
  else{
    return "10";
  }
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
let team2AverageSentimentArrayIndex = 0;
let currentTotal = 0;
let team1CurrentTotal = 0;
let team1CurrentAverage = 0;
let team2CurrentTotal = 0;
let team2CurrentAverage = 0;
let numberOfIterationsForMinutes;
let numberOfIterationsForHours;
var apiCallInterval;
// if one of the variables is not a full number; such as 7.5, change the interval to match interval
// 7.5 -> use floor, and lower the interval by 25%;

//appropriator that augments api call interval so minute/hour can be identified for a set number of iterations
//will be changed when a private sentiment analysis algorithm is installed as we will be able to call every minute/hour, completely disregarding the size of the bag of words
if(precision === 'seconds'){
  apiCallInterval = apiCallIntervalSeconds * 1000;
}
if(precision === 'minutes'){
  numberOfIterationsForMinutes = Math.floor(60/apiCallIntervalSeconds);
  //not a whole number
  if(numberOfIterationsForMinutes % 1 !== 0){
    apiCallInterval = (60/numberOfIterationsForMinutes) * 1000;
    console.log('The api call interval is 1: ' + apiCallInterval);
  }
  else{
    apiCallInterval = apiCallIntervalSeconds * 1000;
    console.log('The api call interval is 2: ' + apiCallInterval);
  }
}
if(precision === 'hours'){
  numberOfIterationsForHours = Math.roof(3600/apiCallIntervalSeconds);
  if(numberOfIterationsForHours % 1 !== 0){
    apiCallInterval = (60/numberOfIterationsForHours) * 1000;
  }
  else{
    apiCallInterval = apiCallIntervalSeconds * 1000;
  }
}

//60/8 = 7.5; Meaning if the we say a minute is 7 iterations, we will be wrong as a minute will not have passed yet
//60/8 = 8; Meaning if the way say a minute is 8 iterations, we will be ahead of time

// Set the headers
var headers = {
    'Content-Type': 'application/json',
}

var options = {
    url: 'http://www.sentiment140.com/api/bulkClassifyJson?appid=' + process.env.SENTIMENT_140_EMAIL,
    method: 'POST',
    headers: headers,
    json: true
}

// Start the request
accurateInterval(function(scheduledTime) {
console.log('CURRENT DATA: ' + Date.now());
if(team1Increment > 0){
  options.body = {"data": team1Tweets};
  //console.log(JSON.stringify(options.body));
  request(options, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    team1Sentiment = body.data.map(a => a.polarity).reduce((a, b) => a + b, 0)/body.data.length;
    processReturnedSentimentDataForTeam1(team1Sentiment);
    }
  else{
      console.log(error);
      team1Tweets = [400];
      team1Increment = 0;
    }
  })
}
else{
  processReturnedSentimentDataForTeam1(2);
}
if(team2Increment > 0){
  options.body = {"data": team2Tweets};
  //precaution
  //console.log(JSON.stringify(options.body));
  setTimeout(function(){
  request(options, function (error, response, body) {
  if (!error && response.statusCode == 200) {
      team2Sentiment = body.data.map(a => a.polarity).reduce((a, b) => a + b, 0)/body.data.length;
      processReturnedSentimentDataForTeam2(team2Sentiment);
    }
  else{
      console.log(error);
      team2Tweets = [400];
      team2Increment = 0;
    }
  })}
  , 2000);
}
else{
  processReturnedSentimentDataForTeam2(2)
}
}, apiCallInterval, {aligned: true, immediate: true});

function processReturnedSentimentDataForTeam1(team1Sentiment){
  if(precision === 'seconds'){
    console.log(secondsTrueScale);
    team1TotalSentiment = team1TotalSentiment + team1Sentiment;
    if(team1AverageSentimentArrayIndex != secondsTrueScale){
      team1CurrentAverage = team1TotalSentiment/++team1NoOfSentiments;
      team1AverageSentimentArray[team1AverageSentimentArrayIndex++] = team1Sentiment;
      console.log('team1AverageSentimentArrayIndex ' + team1AverageSentimentArrayIndex);
      console.log('average sentiment array: ' + team1AverageSentimentArray);
      console.log('current average: ' + team1CurrentAverage);
    }
    else{
      team1TotalSentiment = team1TotalSentiment - team1AverageSentimentArray[0];
      team1AverageSentimentArray.shift();
      team1CurrentAverage = team1TotalSentiment/team1NoOfSentiments;
      team1AverageSentimentArray[team1AverageSentimentArrayIndex-1] = team1Sentiment;
      console.log('average sentiment array: ' + team1AverageSentimentArray);
      console.log('current average: ' + team1CurrentAverage);
    }
  }
  if(precision === 'minutes'){
    team1TotalSentiment = team1TotalSentiment + team1Sentiment;
    team1AverageSentiment = team1TotalSentiment/++team1NoOfSentiments;
    console.log(team1Sentiment);
    if(team1NoOfSentiments === numberOfIterationsForMinutes){
      if(team1AverageSentimentArrayIndex != scaleOfPersistance){
        team1CurrentTotal = team1CurrentTotal + team1AverageSentiment;
        team1CurrentAverage = team1CurrentTotal/(team1AverageSentimentArrayIndex+1);
        team1AverageSentimentArray[team1AverageSentimentArrayIndex++] = team1AverageSentiment;
      }
      else{
        team1CurrentTotal = team1CurrentTotal - team1AverageSentimentArray[0] + team1AverageSentiment;
        team1AverageSentimentArray.shift();
        team1CurrentAverage = team1CurrentTotal/team1AverageSentimentArrayIndex;
        team1AverageSentimentArray[team1AverageSentimentArrayIndex-1] = team1AverageSentiment;
        team1NoOfSentiments = 0;
        console.log('second if statement executed now');
      }
      team1TotalSentiment = 0;
      team1NoOfSentiments = 0;
      console.log('resultant array for sentiment average in minutes: ' + team1AverageSentimentArray);
      console.log('the resultant average for the minute sentiment: ' + team1CurrentAverage);
    }
  }
  if(precision === 'hours'){
    team1TotalSentiment = team1TotalSentiment + team1Sentiment;
    team1AverageSentiment = team1TotalSentiment/++team1NoOfSentiments;
    console.log(team1Sentiment);
    if(team1NoOfSentiments === numberOfIterationsForHours){
      if(team1AverageSentimentArrayIndex != scaleOfPersistance){
        team1CurrentTotal = team1CurrentTotal + team1AverageSentiment;
        team1CurrentAverage = team1CurrentTotal/(team1AverageSentimentArrayIndex+1);
        team1AverageSentimentArray[team1AverageSentimentArrayIndex++] = team1AverageSentiment;
      }
      else{
        team1CurrentTotal = team1CurrentTotal - team1AverageSentimentArray[0] + team1AverageSentiment;
        team1AverageSentimentArray.shift();
        team1CurrentAverage = team1CurrentTotal/team1AverageSentimentArrayIndex;
        team1AverageSentimentArray[team1AverageSentimentArrayIndex-1] = team1AverageSentiment;
        team1NoOfSentiments = 0;
        console.log('second if statement executed now');
      }
      team1TotalSentiment = 0;
      team1NoOfSentiments = 0;
      console.log('resultant array for sentiment average in minutes: ' + team1AverageSentimentArray);
      console.log('the resultant average for the minute sentiment: ' + team1CurrentAverage);
    }
  }
  team1Tweets = [400];
  team1Increment = 0;
}

  function processReturnedSentimentDataForTeam2(team2sentiment){
    if(precision === 'seconds'){
      console.log(secondsTrueScale);
      team2TotalSentiment = team2TotalSentiment + team2Sentiment;
      if(team2AverageSentimentArrayIndex != secondsTrueScale){
        team2CurrentAverage = team2TotalSentiment/++team2NoOfSentiments;
        team2AverageSentimentArray[team2AverageSentimentArrayIndex++] = team2Sentiment;
        console.log('average sentiment array: ' + team2AverageSentimentArray);
        console.log('current average: ' + team2CurrentAverage);
      }
      else{
        team2TotalSentiment = team2TotalSentiment - team2AverageSentimentArray[0];
        team2AverageSentimentArray.shift();
        team2CurrentAverage = team2TotalSentiment/team2NoOfSentiments;
        team2AverageSentimentArray[team2AverageSentimentArrayIndex-1] = team2Sentiment;
        console.log('average sentiment array: ' + team2AverageSentimentArray);
        console.log('current average: ' + team2CurrentAverage);
      }
    }
    if(precision === 'minutes'){
      team2TotalSentiment = team2TotalSentiment + team2Sentiment;
      team2AverageSentiment = team2TotalSentiment/++team2NoOfSentiments;
      if(team2NoOfSentiments === numberOfIterationsForMinutes){
        if(team2AverageSentimentArrayIndex != scaleOfPersistance){
          team2CurrentTotal = team2CurrentTotal + team2AverageSentiment;
          team2CurrentAverage = team2CurrentTotal/(team2AverageSentimentArrayIndex+1);
          team2AverageSentimentArray[team2AverageSentimentArrayIndex++] = team2AverageSentiment;
        }
        else{
          team2CurrentTotal = team2CurrentTotal - team2AverageSentimentArray[0] + team2AverageSentiment;
          team2AverageSentimentArray.shift();
          team2CurrentAverage = team2CurrentTotal/team2AverageSentimentArrayIndex;
          team2AverageSentimentArray[team2AverageSentimentArrayIndex-1] = team2AverageSentiment;
          team2NoOfSentiments = 0;
        }
        team2TotalSentiment = 0;
        team2NoOfSentiments = 0;
      }
    }
    if(precision === 'hours'){
      team2TotalSentiment = team2TotalSentiment + team2Sentiment;
      team2AverageSentiment = team2TotalSentiment/++team2NoOfSentiments;
      console.log(team2Sentiment);
      if(team2NoOfSentiments === numberOfIterationsForHours){
        if(team2AverageSentimentArrayIndex != scaleOfPersistance){
          team2CurrentTotal = team2CurrentTotal + team2AverageSentiment;
          team2CurrentAverage = team2CurrentTotal/(team2AverageSentimentArrayIndex+1);
          team2AverageSentimentArray[team2AverageSentimentArrayIndex++] = team2AverageSentiment;
        }
        else{
          team2CurrentTotal = team2CurrentTotal - team2AverageSentimentArray[0] + team2AverageSentiment;
          team2AverageSentimentArray.shift();
          team2CurrentAverage = team2CurrentTotal/team2AverageSentimentArrayIndex;
          team2AverageSentimentArray[team2AverageSentimentArrayIndex-1] = team2AverageSentiment;
          team2NoOfSentiments = 0;
          console.log('second if statement executed now');
        }
        team2TotalSentiment = 0;
        team2NoOfSentiments = 0;
        console.log('resultant array for sentiment average in minutes: ' + team2AverageSentimentArray);
        console.log('the resultant average for the minute sentiment: ' + team2CurrentAverage);
      }
    }
    team2Tweets = [400];
    team2Increment = 0;
  }
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
  res.send({'data':{'team1Sentiment': team1Sentiment, 'team2Sentiment':team2Sentiment, 'team1AverageSentiment':team1CurrentAverage, 'team2AverageSentiment':team2CurrentAverage}});
});

app.get('/persistedData/:graphScale',function(req,res){
  let clientScale = req.params.graphScale;
  let rateOfArrayIndexJump;
  //try to set the scale to be 10, but if the server has its persisted data set to lower than that, accordingly lower it on the client
  //for seconds too!
  if(precision === 'seconds'){
   rateOfArrayIndexJump = Math.floor(scaleOfPersistance/apiCallIntervalSeconds/clientScale);
 }
 else{
   rateOfArrayIndexJump = Math.floor(scaleOfPersistance/clientScale);
 }
  let sentimentArrayIndex = rateOfArrayIndexJump;
  let team1ClientArray = [];
  let team2ClientArray = [];
  console.log('sentimentArrayIndex ' + sentimentArrayIndex);
  for(var i = 0; i < clientScale; i++){
    if(team1AverageSentimentArrayIndex <= i || team2AverageSentimentArrayIndex <=i){
      console.log('break')
      break;
    };
    console.log('sentimentArrayIndex ' + sentimentArrayIndex);
    console.log('team1AverageSentimentArray ' + team1AverageSentimentArray);
    team1ClientArray[i] = team1AverageSentimentArray[sentimentArrayIndex-1];
    team2ClientArray[i] = team2AverageSentimentArray[sentimentArrayIndex-1];
    sentimentArrayIndex = sentimentArrayIndex + rateOfArrayIndexJump;
  }
  res.send({'data':{'team1Sentiment':team1ClientArray,'team2ClientArray':team2ClientArray, 'team1CurrentAverage': team1CurrentAverage, 'team2CurrentAverage':team2CurrentAverage}});
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
app.get('/getInitialGraphScale', function(req, res){
  res.send(retrieveInitialGraphScale());
});

app.get('/getAvailableGraphGraphDimensions', function(req, res){
  res.send(retrieveAvailableGraphDimensions());
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
