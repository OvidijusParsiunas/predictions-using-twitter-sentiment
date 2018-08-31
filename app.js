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
	"competitor1" : 'Brazil',
	"competitor2" : 'Costa,Rica,CostaRica'
};

var stream = client.streamChannels({track:channels});


/*/////// AGREED TERMINOLOGY //////////

timespan - interim for the analysed sentiment data
XAxisRange - number of points on the graph x axis
*/


//select the time unit and scale at which you will be storing sentiment averages and displaying them on the UI
//Update the readme for this
let timeUnit = 'seconds';
let scaleOfPersistance = 120;

let apiCallIntervalSeconds = 5;
let availableTimesIncreaseRate = 10;
let scaleOfPersistanceAsOnlyScale = false;
//can be removed if the user is allowed to pick their scale
let calculateAverages = true;
let minimumGraphScale = 5;
let maximumGraphScale = 80;
let preferredInitialGraphScale = 14;
let team1AverageSentimentArray;
let team2AverageSentimentArray;
let team1CurrentAverages = {};
let team2CurrentAverages = {};
let secondsTrueScale;

if(apiCallIntervalSeconds === undefined || apiCallIntervalSeconds === 0){
  console.log('ERROR - please set the apiCallIntervalSeconds variable (used for calling sentiment analysis API) to 1 or higher');
  process.exit();
}
if(scaleOfPersistance === undefined || scaleOfPersistance === 0){
  console.log('ERROR - please set the scaleOfPersistance variable (used for defining the amount of stored sentiment data) to 1 or higher');
  process.exit();
}
if(timeUnit != 'seconds' && timeUnit != 'minutes' && timeUnit!= 'hours'){
  //have an enum to spit out the array and use a loop instead of an if statement
  console.log('ERROR - timeUnit variable unidentified, please set the timeUnit variable to one of the following values: seconds, minutes, hours');
  process.exit();
}
if(timeUnit === 'seconds'){
  if(scaleOfPersistance<apiCallIntervalSeconds)
  {
    console.log('ERROR - The scaleOfPersistance variable needs to be equal to or higher than ' + apiCallIntervalSeconds + ' seconds, which is the frequency at which sentiment results are retrieved.');
    process.exit();
  }

  secondsTrueScale = Math.floor(scaleOfPersistance/apiCallIntervalSeconds);
  if(secondsTrueScale > maximumGraphScale || secondsTrueScale < minimumGraphScale){
    console.log('ERROR - The current scaleOfPersistance value will result in a graph of ' + secondsTrueScale +
    ' x axis points as it is calculated using the frequency of API calls to retrieve sentiment data as per the following formula: (floor)(scaleOfPrecision/apiCallIntervalSeconds), currently the set boundaries allow the persistance scale of seconds to be at a minimum of ' + minimumGraphScale*apiCallIntervalSeconds +
    ' and a maximum of ' + maximumGraphScale*apiCallIntervalSeconds + ', please update the scaleOfPrecision variable accordingly.');
    process.exit();
  }
  team1AverageSentimentArray = [];
  team2AverageSentimentArray = [];
}
else{
  if(availableTimesIncreaseRate === undefined || availableTimesIncreaseRate === 0 || availableTimesIncreaseRate > scaleOfPersistance){
    console.log('ERROR - please set the availableTimesIncreaseRate variable (used for defining the available time spans for the graph) between 1 and ' + scaleOfPersistance);
    process.exit();
  }
  if(timeUnit === 'minutes' && apiCallInterval > 60){
      console.log('ERROR - Interval for calling sentiment api cannot be above 60 seconds for tracking average sentiment when using a time unit of minutes');
      process.exit();
  } else if(timeUnit === 'hours' && apiCallInterval > 3600){
    console.log('ERROR - Interval for calling sentiment api cannot be above 60 seconds for tracking average sentiment when using a time unit of hours');
    process.exit();
  }
  team1AverageSentimentArray = [];
  team2AverageSentimentArray = [];
}

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
scaleOfPersistance availableTimesIncreaseRate
2                  1
5                  3
7                  5
10                 10
29                 30
60                 30
70                 15
*/
let availableTimeSpans = [];
let availableGraphScales = {};
let sentimentAveragesForTeam1 = {};
let sentimentAveragesForTeam2 = {};

let startingGraphScales = {};
let startingTimeSpan;
let startingXAxisScale;
setUpAvailableGraphDimensions();
identifyStartingTimespanPerPreferredXAxisScale();

function setUpAvailableGraphDimensions(){
  if(!scaleOfPersistanceAsOnlyScale){
    setUpAvailableTimeSpans();
    setUpAvailableGraphXAxisScales();
    cleanUpTimeSpansWithOutOfBoundsGraphXAxisScales();
  }
  else{
    setUpAvaibleGraphDimensionsOnlyForScaleOfPersistance();
  }
  setUpSentimentAveragesObject();
}

function setUpAvailableTimeSpans(){
  if(timeUnit === 'seconds'){
    //the increase rate is decided by the call interval time for the sentiment api
    let numberOfAvailableTimeSpans = Math.floor(scaleOfPersistance/apiCallIntervalSeconds);
    for(let i = 0; i < numberOfAvailableTimeSpans; i++){
      availableTimeSpans[i] = (i+1)*apiCallIntervalSeconds;
    }
  }
  else{
    let numberOfAvailableTimeSpans = Math.floor(scaleOfPersistance/availableTimesIncreaseRate);
    for(let i = 0; i < numberOfAvailableTimeSpans; i++){
      availableTimeSpans[i] = (i+1)*availableTimesIncreaseRate;
    }
  }
  return availableTimeSpans;
}

function setUpAvailableGraphXAxisScales(){
  retrieveAvailableTimeSpans().forEach((timeSpan) => {
    availableGraphScales[timeSpan] = retrieveAvailableXAxisRangesForTimeSpan(timeSpan)});
}

function setUpAvaibleGraphDimensionsOnlyForScaleOfPersistance(){
  availableTimeSpans[0] = scaleOfPersistance;
  availableGraphScales[scaleOfPersistance] = [scaleOfPersistance];
}

function cleanUpTimeSpansWithOutOfBoundsGraphXAxisScales(){
  for(var key in availableGraphScales){
    availableGraphScales[key] = availableGraphScales[key].filter(scale => {
                                if(scale >= minimumGraphScale && scale <= maximumGraphScale){
                                  return true;
                                }
                                  return false;})

     if(availableGraphScales[key].length === 0){
       delete availableGraphScales[key];
       availableTimeSpans.splice(availableTimeSpans.indexOf(parseInt(key)), 1);
     }
  }
}
function retrieveAvailableTimeSpans(){
  return availableTimeSpans;
}

function retrieveAvailableGraphDimensions(){
  return availableGraphScales;
}

function setUpSentimentAveragesObject(){
  //structure of sentimentAverages object properties: {[total, average]}
  availableTimeSpans.forEach((timeSpan) => {sentimentAveragesForTeam1[timeSpan] = [0,0];
                                            sentimentAveragesForTeam2[timeSpan] = [0,0];});
}

function identifyStartingTimespanPerPreferredXAxisScale(){
  var foundPreferredScale = 0;
  var lowestDifferenceToPreferredScale = scaleOfPersistance;
  var closestIdentifiedScale;
  var timeSpanForClosestIdentifiedScale;
  timeSpanLoop:
  for(var timeSpan in availableGraphScales){
    var xAxisScales = availableGraphScales[timeSpan];
    xAxisScalesLoop:
    for(var i = 0; i < xAxisScales.length; i++){
      var differenceToPreferredScale = Math.abs(preferredInitialGraphScale - xAxisScales[i]);
      if(differenceToPreferredScale === 0){
        startingGraphScales['timeSpan'] = parseInt(timeSpan);
        startingGraphScales['xAxisScale'] = xAxisScales[i];
        foundPreferredScale = 1;
        break timeSpanLoop;
      }
      else{
        if(lowestDifferenceToPreferredScale > differenceToPreferredScale){
          lowestDifferenceToPreferredScale = differenceToPreferredScale;
          closestIdentifiedScale = xAxisScales[i];
          timeSpanForClosestIdentifiedScale = timeSpan;
        }
      }
    }
  }
  if(!foundPreferredScale){
    startingGraphScales['startingXAxisScale'] = closestIdentifiedScale;
    startingGraphScales['xAxisScale'] = timeSpanForClosestIdentifiedScale;
  }
}

/*  Simple description of the operations performed in calculateSentimentAverages:

  The function iterations through all of the timespans that the averages are being tracked for.
  The algorithm first checks if the array of sentiments is full, if it is not
  the algorithm checks the elapsed time that has passed.

  If the array is full, it immediately skips to the second if statement in the for loop
  The first if statement checks if the current elapsed time is below or equal to the
  timescale, if it is, the algorithm adds to the timescale's total and divided accordingly
  to obtain its average.
  The second if statement can be triggered when the elapsed time exceeds the timescale
  but the arrayOfSentiments is still not full or when the arrayOfSentiments is unidentified
  to be full. When this happens the algorithm subtracts the new sentiment value from the old
  value that the timescale used to caclulate its total. The difference is then added to the
  total value. e.g. if new value is 3 and old is 2, all we do is add 1 to the total, or if
  new value is 3 and the old value is 4, we add -1 to the total, hence resulting in the
  correct total value. The averge is then obtained by dividing accordingly.

  Please note that the arrayOfSentimentsIndex is passed in as the real index when the
  arrayOfSentiments is still growing (used in the first if statement), hence the
  minimumElapsedTime and the calculation of the average for seconds require it to be
  incremented by 1, but the second if statement uses the original value to get the
  old average value as follows:
  [2,[4],6,8,[10]] new value 10
  If a timescale requires 3 values, the old one would be 4, and that would be subtracted
  from the new value of 10. So if the passed in index is 4, and the timescale requires
  3 values, we perform the following 4-3=1, which would identify old value as 4
  When the arrayOfSentiments is full, the parent function passes arrayOfSentimentsIndex
  that is incremented by 1. The reason for that is explained in the following example:
  [[2],4,6,8] new value [10]
  If a timescale requires 4 values the old value would be 2, however because the
  array has not been shifted yet (as the old value is still required), the latest index
  is pointing towards 8, at the entry numbered 3 and not the index of the new value to be inserted.
  Therefore the following is performed: 4-4 = 0, which points towards the old value, please note
  that if the index would not have been incremented by 1, it would have resulted in the
  following: 3-4 = -1, which would point at an invalid array index. Hence the algorithm is now
  able to point at the correct array index of the old sentiment value.
*/

function calculateSentimentAverages(sentimentAverages, currentAverages, newAverageSentiment, arrayOfSentiments, arrayOfSentimentsIndex, arrayOfSentimentsIsFull){
  var minimumElapsedTime;
  if(!arrayOfSentimentsIsFull){
    if(timeUnit === 'seconds'){
      minimumElapsedTime = (arrayOfSentimentsIndex + 1) * apiCallIntervalSeconds;
    }
    else{
      minimumElapsedTime = arrayOfSentimentsIndex + 1;
    }
  }
  //iterate through all of the variables
  for(var timeScale in sentimentAverages){
    //if number of seconds/minutes/hours is less than the timeScale
    if(!arrayOfSentimentsIsFull && minimumElapsedTime <= timeScale){
      //add to total
      sentimentAverages[timeScale][0]+=newAverageSentiment;
      //divide by number of seconds/minutes/hours
      if(timeUnit === 'seconds'){
        sentimentAverages[timeScale][1] = sentimentAverages[timeScale][0]/(arrayOfSentimentsIndex + 1);
        currentAverages[timeScale] = sentimentAverages[timeScale][0]/(arrayOfSentimentsIndex + 1);
      }
      else{
        sentimentAverages[timeScale][1] = sentimentAverages[timeScale][0]/minimumElapsedTime;
        currentAverages[timeScale] = sentimentAverages[timeScale][0]/minimumElapsedTime;
      }
    }
    else{
      //total = total + new average - old average
      var newAverageSentimentForTotal;
      if(timeUnit === 'seconds'){
        var numberOfIndexesToSubtract = (timeScale/apiCallIntervalSeconds);
        newAverageSentimentForTotal = newAverageSentiment - arrayOfSentiments[arrayOfSentimentsIndex-numberOfIndexesToSubtract];
      }
      else{
        newAverageSentimentForTotal = newAverageSentiment - arrayOfSentiments[arrayOfSentimentsIndex-timeScale];
      }
      sentimentAverages[timeScale][0]+=newAverageSentimentForTotal;
      //divide by number of seconds/minutes/hours
      if(timeUnit === 'seconds'){
        sentimentAverages[timeScale][1] = sentimentAverages[timeScale][0]/(timeScale/apiCallIntervalSeconds);
        currentAverages[timeScale] = sentimentAverages[timeScale][0]/(timeScale/apiCallIntervalSeconds);
      }
      else{
        sentimentAverages[timeScale][1] = sentimentAverages[timeScale][0]/timeScale;
        currentAverages[timeScale] = sentimentAverages[timeScale][0]/timeScale;
      }
    }
  }
  console.log('current averages: ' + JSON.stringify(sentimentAverages));
}

function retrieveAvailableXAxisRangesForTimeSpan(timeSpan){
  //if the graph scale is below 10 - it is not broken up any further
  if(timeUnit === 'seconds'){
    let availableLargestScaleForSeconds = Math.floor(timeSpan/apiCallIntervalSeconds);
    if(availableLargestScaleForSeconds < 10){
      return [availableLargestScaleForSeconds];
    }
    else{
      let availableXAxis = [];
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
      let availableXAxis = [];
      let availableXAxisIndex = 0;
      for(var i = 10; i <= timeSpan; i++){
        if(timeSpan%i === 0){
          availableXAxis[availableXAxisIndex++] = i;
        }
      }
      availableXAxis.splice(availableXAxisIndex, timeSpan-availableXAxisIndex);
      return availableXAxis;
    }
  }
}

//check that team2 data is returned correctly
//try hours to see if the returned data is correct

startStreamWithFilters();

function startStreamWithFilters(){
  stream.on('channels/competitor1',function(tweet){
      // if(checkKeyWords(tweet.text)){
      //   console.log('executed');
      team1Tweets[team1Increment++] = {'text': tweet.text};
      if(team1Increment >= 400){
        team1Increment = 0;
      }
    //}
  });

  stream.on('channels/competitor2',function(tweet){
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
let numberOfIterationsForMinutes;
let numberOfIterationsForHours;
let apiCallInterval;
let secondsBeforeApiCallForNextTeam = 2000;
let lastAPICallTimeStamp = 0;

//appropriator that augments api call interval so minute/hour can be identified for a set number of iterations
//will be changed when a private sentiment analysis algorithm is installed as we will be able to call every minute/hour, completely disregarding the size of the bag of words
if(timeUnit === 'seconds'){
  apiCallInterval = apiCallIntervalSeconds * 1000;
}
if(timeUnit === 'minutes'){
  numberOfIterationsForMinutes = Math.floor(60/apiCallIntervalSeconds);
  //not a whole number
  if(numberOfIterationsForMinutes % 1 !== 0){
    apiCallInterval = (60/numberOfIterationsForMinutes) * 1000;
  }
  else{
    apiCallInterval = apiCallIntervalSeconds * 1000;
  }
}
if(timeUnit === 'hours'){
  numberOfIterationsForHours = Math.floor(3600/apiCallIntervalSeconds);
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
if(team1Increment > 0){
  options.body = {"data": team1Tweets};
  //console.log(JSON.stringify(options.body));
  lastAPICallTimeStamp = new Date();
  request(options, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    team1Sentiment = body.data.map(a => a.polarity).reduce((a, b) => a + b, 0)/body.data.length;
    processReturnedSentimentDataForTeam1();
    }
  else{
      console.log(error);
      team1Tweets = [400];
      team1Increment = 0;
    }
  })
}
else{
  team1Sentiment = 2;
  processReturnedSentimentDataForTeam1();
}
if(team2Increment > 0){
  options.body = {"data": team2Tweets};
  //precaution
  //console.log(JSON.stringify(options.body));
  setTimeout(function(){
  request(options, function (error, response, body) {
  if (!error && response.statusCode == 200) {
      team2Sentiment = body.data.map(a => a.polarity).reduce((a, b) => a + b, 0)/body.data.length;
      processReturnedSentimentDataForTeam2();
    }
  else{
      console.log(error);
      team2Tweets = [400];
      team2Increment = 0;
    }
  })}
  , secondsBeforeApiCallForNextTeam);
}
else{
  team2Sentiment = 2;
  processReturnedSentimentDataForTeam2();
}
}, apiCallInterval, {aligned: true, immediate: true});

function processReturnedSentimentDataForTeam1(){
  if(timeUnit === 'seconds'){
    console.log(secondsTrueScale);
    if(team1AverageSentimentArrayIndex != secondsTrueScale){
      team1AverageSentimentArray[team1AverageSentimentArrayIndex] = team1Sentiment;
      if(calculateAverages){
        calculateSentimentAverages(sentimentAveragesForTeam1, team1CurrentAverages, team1Sentiment, team1AverageSentimentArray, team1AverageSentimentArrayIndex++);
      }
    }
    else{
      if(calculateAverages){
        calculateSentimentAverages(sentimentAveragesForTeam1, team1CurrentAverages, team1Sentiment, team1AverageSentimentArray, team1AverageSentimentArrayIndex, 1);
      }
      team1AverageSentimentArray.shift();
      team1AverageSentimentArray[team1AverageSentimentArrayIndex-1] = team1Sentiment;
      console.log('average sentiment array: ' + team1AverageSentimentArray);
    }
    console.log('resultant array for sentiment average in seconds: ' + team1AverageSentimentArray);
  }
  if(timeUnit === 'minutes'){
    team1TotalSentiment = team1TotalSentiment + team1Sentiment;
    team1AverageSentiment = team1TotalSentiment/++team1NoOfSentiments;
    console.log(team1Sentiment);
    if(team1NoOfSentiments === numberOfIterationsForMinutes){
      if(team1AverageSentimentArrayIndex != scaleOfPersistance){
        team1AverageSentimentArray[team1AverageSentimentArrayIndex] = team1AverageSentiment;
        if(calculateAverages){
          calculateSentimentAverages(sentimentAveragesForTeam1, team1CurrentAverages, team1AverageSentiment, team1AverageSentimentArray, team1AverageSentimentArrayIndex++);
        }
      }
      else{
        if(calculateAverages){
          calculateSentimentAverages(sentimentAveragesForTeam1, team1CurrentAverages, team1AverageSentiment, team1AverageSentimentArray, team1AverageSentimentArrayIndex, 1);
        }
        team1AverageSentimentArray.shift();
        team1AverageSentimentArray[team1AverageSentimentArrayIndex-1] = team1AverageSentiment;
        team1NoOfSentiments = 0;
        console.log('second if statement executed now');
      }
      team1TotalSentiment = 0;
      team1NoOfSentiments = 0;
      console.log('resultant array for sentiment average in minutes: ' + team1AverageSentimentArray);
    }
  }
  if(timeUnit === 'hours'){
    team1TotalSentiment = team1TotalSentiment + team1Sentiment;
    team1AverageSentiment = team1TotalSentiment/++team1NoOfSentiments;
    console.log(team1Sentiment);
    if(team1NoOfSentiments === numberOfIterationsForHours){
      if(team1AverageSentimentArrayIndex != scaleOfPersistance){
        team1AverageSentimentArray[team1AverageSentimentArrayIndex] = team1AverageSentiment;
        if(calculateAverages){
          calculateSentimentAverages(sentimentAveragesForTeam1, team1CurrentAverages, team1AverageSentiment, team1AverageSentimentArray, team1AverageSentimentArrayIndex++);
        }
      }
      else{
        if(calculateAverages){
          calculateSentimentAverages(sentimentAveragesForTeam1, team1CurrentAverages, team1AverageSentiment, team1AverageSentimentArray, team1AverageSentimentArrayIndex, 1);
        }
        team1AverageSentimentArray.shift();
        team1AverageSentimentArray[team1AverageSentimentArrayIndex-1] = team1AverageSentiment;
        team1NoOfSentiments = 0;
        console.log('second if statement executed now');
      }
      team1TotalSentiment = 0;
      team1NoOfSentiments = 0;
      console.log('resultant array for sentiment average in minutes: ' + team1AverageSentimentArray);
    }
  }
  team1Tweets = [400];
  team1Increment = 0;
}

  function processReturnedSentimentDataForTeam2(){
    if(timeUnit === 'seconds'){
      console.log(secondsTrueScale);
      if(team2AverageSentimentArrayIndex != secondsTrueScale){
        team2AverageSentimentArray[team2AverageSentimentArrayIndex] = team2Sentiment;
        if(calculateAverages){
          calculateSentimentAverages(sentimentAveragesForTeam2, team2CurrentAverages, team2Sentiment, team2AverageSentimentArray, team2AverageSentimentArrayIndex++);
        }
      }
      else{
        if(calculateAverages){
          calculateSentimentAverages(sentimentAveragesForTeam2, team2CurrentAverages, team2Sentiment, team2AverageSentimentArray, team2AverageSentimentArrayIndex, 1);
        }
        team2AverageSentimentArray.shift();
        team2AverageSentimentArray[team2AverageSentimentArrayIndex-1] = team2Sentiment;
      }
    }
    if(timeUnit === 'minutes'){
      team2TotalSentiment = team2TotalSentiment + team2Sentiment;
      team2AverageSentiment = team2TotalSentiment/++team2NoOfSentiments;
      if(team2NoOfSentiments === numberOfIterationsForMinutes){
        if(team2AverageSentimentArrayIndex != scaleOfPersistance){
          team2AverageSentimentArray[team2AverageSentimentArrayIndex] = team2AverageSentiment;
          if(calculateAverages){
            calculateSentimentAverages(sentimentAveragesForTeam2, team2CurrentAverages, team2AverageSentiment, team2AverageSentimentArray, team2AverageSentimentArrayIndex++);
          }
        }
        else{
          if(calculateAverages){
            calculateSentimentAverages(sentimentAveragesForTeam2, team2CurrentAverages, team2AverageSentiment, team2AverageSentimentArray, team2AverageSentimentArrayIndex, 1);
          }
          team2AverageSentimentArray.shift();
          team2AverageSentimentArray[team2AverageSentimentArrayIndex-1] = team2AverageSentiment;
          team2NoOfSentiments = 0;
        }
        team2TotalSentiment = 0;
        team2NoOfSentiments = 0;
      }
    }
    if(timeUnit === 'hours'){
      team2TotalSentiment = team2TotalSentiment + team2Sentiment;
      team2AverageSentiment = team2TotalSentiment/++team2NoOfSentiments;
      console.log(team2Sentiment);
      if(team2NoOfSentiments === numberOfIterationsForHours){
        if(team2AverageSentimentArrayIndex != scaleOfPersistance){
          team2AverageSentimentArray[team2AverageSentimentArrayIndex] = team2AverageSentiment;
          if(calculateAverages){
            calculateSentimentAverages(sentimentAveragesForTeam2, team2CurrentAverages, team2AverageSentiment, team2AverageSentimentArray, team2AverageSentimentArrayIndex++);
          }
        }
        else{
          if(calculateAverages){
            calculateSentimentAverages(sentimentAveragesForTeam2, team2CurrentAverages, team2AverageSentiment, team2AverageSentimentArray, team2AverageSentimentArrayIndex, 1);
          }
          team2AverageSentimentArray.shift();
          team2AverageSentimentArray[team2AverageSentimentArrayIndex-1] = team2AverageSentiment;
          team2NoOfSentiments = 0;
          console.log('second if statement executed now');
        }
        team2TotalSentiment = 0;
        team2NoOfSentiments = 0;
        console.log('resultant array for sentiment average in minutes: ' + team2AverageSentimentArray);
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
app.get('/newSentimentData/:timeSpan',function(req,res){
  let timeSpan = req.params.timeSpan;
  res.send({'data':{'team1Sentiment': team1Sentiment, 'team2Sentiment':team2Sentiment, 'team1AverageSentiment':team1CurrentAverages[timeSpan], 'team2AverageSentiment':team2CurrentAverages[timeSpan]}});
});

app.get('/persistedData/:timeSpan/:graphScale',function(req,res){
  res.send(getPersistedSentimentData(req.params.timeSpan, req.params.graphScale));
});

//refactor clientArrayIndex calculation and flip the array
function getPersistedSentimentData(timeSpan, graphScale){
  let rateOfArrayIndexJump;
  //try to set the scale to be 10, but if the server has its persisted data set to lower than that, accordingly lower it on the client
  //for seconds too!
  if(timeUnit === 'seconds'){
   rateOfArrayIndexJump = Math.floor(timeSpan/apiCallIntervalSeconds/graphScale);
  }
  else{
   rateOfArrayIndexJump = Math.floor(timeSpan/graphScale);
  }
  let lowestArrayIndex = team2AverageSentimentArrayIndex - (rateOfArrayIndexJump*graphScale);
  let sentimentArrayIndex = rateOfArrayIndexJump;
  let team1ClientArray = [];
  let team2ClientArray = [];
  let clientArrayIndex = 0;
  console.log('Let us look at the math: ' + (team2AverageSentimentArrayIndex -1) + ' and ' + rateOfArrayIndexJump);
  console.log('INDEXX!!!!! ' + Math.floor(team2AverageSentimentArrayIndex/rateOfArrayIndexJump));
  console.log('team1AverageSentimentArray ' + team1AverageSentimentArray);
  for(var i = team2AverageSentimentArrayIndex-1; i > -1; i=i-sentimentArrayIndex){
    console.log(i);
    if(i < lowestArrayIndex){
      break;
    }
    team1ClientArray[clientArrayIndex] = team1AverageSentimentArray[i];
    team2ClientArray[clientArrayIndex] = team2AverageSentimentArray[i];
    clientArrayIndex++;
  }
  return buildStartingDataCargo(team1ClientArray, team2ClientArray, timeSpan);
}

function buildStartingDataCargo(team1ClientArray, team2ClientArray, timeSpan){
  let initialData = {};
  initialData['team1Sentiment'] = team1ClientArray;
  initialData['team2Sentiment'] = team2ClientArray;
  initialData['team1CurrentAverage'] = sentimentAveragesForTeam1[timeSpan][1];
  initialData['team2CurrentAverage'] = sentimentAveragesForTeam2[timeSpan][1];
  return initialData;
}

app.get('/UISetUp', function(req,res){
  res.send(buildUISetUpCargo());
})

function buildUISetUpCargo(){
  let teamNames = {};
  let cargo = {};
  teamNames['team1'] = channels['competitor1'];
  teamNames['team2'] = channels['competitor2'];
  cargo['teamNames'] = teamNames;
  cargo['timeUnit'] = timeUnit;
  cargo['availableGraphScales'] = availableGraphScales;
  cargo['startingGraphScales'] = startingGraphScales;
  cargo['timeOfLastAPICall'] = buildLastSentimentAPICallUICargo();
  cargo['startingData'] = getPersistedSentimentData(startingGraphScales['timeSpan'], startingGraphScales['xAxisScale']);
  return cargo;
}

app.get('/lastSentimentAPICallTimeStamp', function(req, res){
  res.send(buildLastSentimentAPICallUICargo());
})

function buildLastSentimentAPICallUICargo(){
  //get the last api call time in order to calculate the offset
  //include api call interval in seconds incase data arrives too late so it can retry to calculate the offset successfully
  var lastAPICallCargo = {};
  lastAPICallCargo['lastAPICallTimeStamp'] = lastAPICallTimeStamp;
  lastAPICallCargo['millisecondsBeforeApiCallForNextTeam'] = secondsBeforeApiCallForNextTeam;
  lastAPICallCargo['apiCallInterval'] = apiCallInterval;
  return lastAPICallCargo;
}

app.get('/stopStream', function(req,res){
  stream.stop();
  res.send('Stream has been stopped');
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
