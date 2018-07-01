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
let team1TotalSentimentOneMinute = 0;
let team1TotalSentimentOneMinuteWithRefresh = 0;
let team1NoOfSentiments = 1;
let team1TotalSentimentThirtyMinutes = 0;
let team1NoOfSentimentsForThirtyMinutes = 1;
let team1NoOfSentimentsForThirtyMinutesLimit = 5;
let team1AverageSentiment = 0;
let team1AverageSentimentArrayFor1Minute = [10];
let team1AverageSentimentArrayIndexFor1Minute = 0;
let team1AverageSentimentOneMinuteCounter = 10;
let team1AverageSentimentArray = [240];
let team1AverageSentimentArrayIndex = 0;
let team1AverageSentimentForOneMinute = 0;
let team1AverageSentimentForThirtyMinutes = 0;
let team1AverageSentimentForThirtyMinutesSaved = 0;
let team1AverageSentimentForOneHour = 0;
let team1AverageSentimentForOneHourSaved = 0;
let team1AverageSentimentForTwoHours = 0;
let team1AverageSentimentForTwoHoursSaved = 0;
let team1AverageSentimentForFourHours = 0;
let team1AverageSentimentForFourHoursSaved = 0;
let team2Tweets = [400];
let team2Sentiment = 0;
let team2Increment = 0;
let team2TotalSentiment = 0;
let team2NoOfSentiments = 0;
let team2AverageSentiment = 0;
let team2AverageSentimentArrayFor1Minute = [10];
let team2AverageSentimentArrayIndexFor1Minute = 0;
let team2AverageSentimentOneMinuteCounter = 0;
let team2AverageSentimentArray = [240];
let team2AverageSentimentArrayIndex = 0;
let team2AverageSentimentForOneMinute = 0;
let team2AverageSentimentForThirtyMinutes = 0;
let team2AverageSentimentForOneHour = 0;
let team2AverageSentimentForTwoHours = 0;
let team2AverageSentimentForFourHours = 0;

let thirtyMinutesHavePassed = false;
let oneHourHasPassed = false;
let twoHoursHavePassed = false;

let counterToAnHour = 0;
let counterToTwoHours = 0;
var the_interval = 10 * 1000;

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
      team1TotalSentimentOneMinute = team1TotalSentimentOneMinute + team1Sentiment;
      //current average sentiment for minute scale
      team1AverageSentiment = team1TotalSentimentOneMinute/team1NoOfSentiments++;
      //Because team1NoOfSentiments starts with 1 and increments to 2
      if(team1NoOfSentiments == 11){
        team1TotalSentimentOneMinute = team1AverageSentiment;
        team1NoOfSentiments = 2;
      }
      if(team1AverageSentimentArrayIndexFor1Minute < 10){
        //Using own implementation for tracking total as previous one gets out of track and retains the previous average -- important as
        //each minute needs to be fully independent
        team1AverageSentimentArrayFor1Minute[team1AverageSentimentArrayIndexFor1Minute++] = team1Sentiment;
        team1TotalSentimentOneMinuteWithRefresh =  team1TotalSentimentOneMinuteWithRefresh + team1Sentiment;
        console.log('Average Sentiment for 1 minute prior to one minute: ' + team1AverageSentimentArrayFor1Minute);
      }
      else{
        //set to 10 initially
        if(team1AverageSentimentOneMinuteCounter === 10){
          if(team1AverageSentimentArrayIndex < 240){
            team1AverageSentimentArray[team1AverageSentimentArrayIndex++] = team1TotalSentimentOneMinuteWithRefresh/team1AverageSentimentOneMinuteCounter;
          }else{
            team1AverageSentimentArray.shift();
            team1AverageSentimentArray[239] = team1TotalSentimentOneMinuteWithRefresh/team1AverageSentimentOneMinuteCounter;
          }
          if(team1NoOfSentimentsForThirtyMinutes < team1NoOfSentimentsForThirtyMinutesLimit){
            //total sentiment for 30 minutes
            team1TotalSentimentThirtyMinutes = team1TotalSentimentThirtyMinutes + team1TotalSentimentOneMinuteWithRefresh/team1AverageSentimentOneMinuteCounter;
            //average sentiment for 30 minutes
            team1AverageSentimentForThirtyMinutes = team1TotalSentimentThirtyMinutes / team1NoOfSentimentsForThirtyMinutes;
            if(thirtyMinutesHavePassed === true){
              //update the hour average when half an hour had passed
              team1AverageSentimentForOneHour = (team1AverageSentimentForThirtyMinutes + team1AverageSentimentForThirtyMinutesSaved)/2;
              if(oneHourHasPassed === true){
                team1AverageSentimentForTwoHours = (team1AverageSentimentForThirtyMinutes + team1AverageSentimentForOneHourSaved)/2;
                if(twoHoursHavePassed === true){
                  team1AverageSentimentForFourHours = (team1AverageSentimentForThirtyMinutes + team1AverageSentimentForTwoHoursSaved)/2;
                }
                else{
                  team1AverageSentimentForFourHours  = team1AverageSentimentForTwoHours;
                }
              }
              else{
                team1AverageSentimentForTwoHours = team1AverageSentimentForOneHour;
                team1AverageSentimentForFourHours  = team1AverageSentimentForOneHour;
              }
            }
            else{
              //update the hour average before half an hour has passed
              team1AverageSentimentForOneHour = team1AverageSentimentForThirtyMinutes;
              team1AverageSentimentForTwoHours = team1AverageSentimentForThirtyMinutes;
              team1AverageSentimentForFourHours  = team1AverageSentimentForThirtyMinutes;
            }
            console.log('average sentiment array for one minute ' + JSON.stringify(team1AverageSentimentArrayFor1Minute));
            console.log('average sentiment array ' + JSON.stringify(team1AverageSentimentArray));
            console.log('number of sentiments for thirty minutes: ' + team1NoOfSentimentsForThirtyMinutes);
            console.log('total sentiments for thirty minutes: ' + team1TotalSentimentThirtyMinutes);
            console.log('average of sentiments for thirty minutes: ' + team1AverageSentimentForThirtyMinutes);
            console.log('average of sentiments for an hour: ' + team1AverageSentimentForOneHour);
            team1NoOfSentimentsForThirtyMinutes++;
          }
          else{
            //total sentiment for 30 minutes
            //team1TotalSentimentOneMinuteWithRefresh/team1AverageSentimentOneMinuteCounter
            team1TotalSentimentThirtyMinutes = team1TotalSentimentThirtyMinutes + team1TotalSentimentOneMinuteWithRefresh/team1AverageSentimentOneMinuteCounter;
            team1AverageSentimentForThirtyMinutes = team1TotalSentimentThirtyMinutes / team1NoOfSentimentsForThirtyMinutes;
            if(team1AverageSentimentForThirtyMinutesSaved != 0){
              team1AverageSentimentForOneHour = (team1AverageSentimentForThirtyMinutesSaved + team1AverageSentimentForThirtyMinutes)/2;
              if(team1AverageSentimentForOneHourSaved != 0){
                team1AverageSentimentForTwoHours = (team1AverageSentimentForOneHourSaved + team1AverageSentimentForThirtyMinutes)/2;
                if(counterToAnHour === 1){
                  team1AverageSentimentForOneHourSaved = team1AverageSentimentForOneHour;
                  counterToAnHour = 0;
                }
                else{
                  counterToAnHour++;
                }
                if(team1AverageSentimentForTwoHourSaved != 0){
                  team1AverageSentimentForFourHours = (team1AverageSentimentForTwoHoursSaved + team1AverageSentimentForThirtyMinutes)/2;
                  if(counterToTwoHours === 3){
                    team1AverageSentimentForTwoHourSaved = team1AverageSentimentForTwoHours;
                    counterToTwoHours = 0;
                  }
                  else{
                    counterToTwoHours++;
                  }
                }
                else{
                  team1AverageSentimentForTwoHourSaved = team1AverageSentimentForTwoHours;
                  twoHoursHavePassed = true;
                  team1AverageSentimentForFourHours  = team1AverageSentimentForTwoHours;
                }
              }
              else{
                team1AverageSentimentForOneHourSaved = team1AverageSentimentForOneHour;
                oneHourHasPassed = true;
                team1AverageSentimentForTwoHours = team1AverageSentimentForOneHour;
                team1AverageSentimentForFourHours  = team1AverageSentimentForOneHour;
              }
            }
            else{
              team1AverageSentimentForOneHour = team1AverageSentimentForThirtyMinutes;
              team1AverageSentimentForTwoHours = team1AverageSentimentForThirtyMinutes;
              team1AverageSentimentForFourHours  = team1AverageSentimentForThirtyMinutes;
              team1NoOfSentimentsForThirtyMinutesLimit = 6;
            }
            team1AverageSentimentForThirtyMinutesSaved = team1AverageSentimentForThirtyMinutes;
            team1TotalSentimentThirtyMinutes = team1AverageSentimentForThirtyMinutesSaved;
            console.log('///////////////////////////////////////////////////////////////////////////////');
            console.log('average sentiment array for one minute ' + JSON.stringify(team1AverageSentimentArrayFor1Minute));
            console.log('average sentiment array ' + JSON.stringify(team1AverageSentimentArray));
            console.log('number of sentiments for thirty minutes: ' + team1NoOfSentimentsForThirtyMinutes);
            console.log('total sentiments for thirty minutes: ' + team1TotalSentimentThirtyMinutes);
            console.log('average of sentiments for thirty minutes: ' + team1AverageSentimentForThirtyMinutes);
            console.log('average of sentiments for an hour: ' + team1AverageSentimentForOneHour);
            console.log('///////////////////////////////////////////////////////////////////////////////');
            team1NoOfSentimentsForThirtyMinutes = 2;
            thirtyMinutesHavePassed = true;
          }
          team1TotalSentimentOneMinuteWithRefresh = 0;
          team1AverageSentimentOneMinuteCounter = 0;
        }
        team1AverageSentimentArrayFor1Minute.shift();
        team1AverageSentimentArrayFor1Minute[9] = team1Sentiment;
        team1TotalSentimentOneMinuteWithRefresh = team1TotalSentimentOneMinuteWithRefresh + team1Sentiment;
        team1AverageSentimentOneMinuteCounter++;
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
}, the_interval);
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
  team1NoOfSentiments = 1;
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
