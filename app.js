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

console.log(JSON.stringify(client2));
var client = new TwitterStreamChannels(client2);

var channels = {
	"team1" : 'portugal',
	"team2" : 'morocco'
};

var stream = client.streamChannels({track:channels});

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

var the_interval = 10 * 1000;

// Set the headers
var headers = {
    'Content-Type': 'application/json',
}

var options = {
    url: 'http://www.sentiment140.com/api/bulkClassifyJson?appid=' + process.env.SENTIMENT_140_EMAIL,
    method: 'POST',
    headers: headers,
    json: true,
}

// Start the request
setInterval(function() {
if(team1Increment > 0){
  options.body = {"data": team1Tweets};
  request(options, function (error, response, body) {
  if (!error && response.statusCode == 200) {
      team1Sentiment = body.data.map(a => a.polarity).reduce((a, b) => a + b, 0)/body.data.length;
      team1TotalSentiment = team1TotalSentiment + team1Sentiment;
      team1AverageSentiment = team1TotalSentiment/++team1NoOfSentiments;
      if(team1NoOfSentiments >= 100){
        team1TotalSentiment = team1AverageSentiment;
        team1NoOfSentiments = 0;
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
  options.body = {"data": team2Tweets};

  if(team2Increment > 0){
  //precaution
  setTimeout(function(){
  request(options, function (error, response, body) {
  if (!error && response.statusCode == 200) {
      team2Sentiment = body.data.map(a => a.polarity).reduce((a, b) => a + b, 0)/body.data.length;
      team2TotalSentiment = team2TotalSentiment + team2Sentiment;
      team2AverageSentiment = team2TotalSentiment/++team2NoOfSentiments;
      if(team2NoOfSentiments >= 100){
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
    console.log('live on port '+9000);
});
app.get('/',function(req,res){
res.send({'data':{'team1Sentiment': team1Sentiment, 'team2Sentiment':team2Sentiment, 'team1AverageSentiment':team1AverageSentiment, 'team2AverageSentiment':team2AverageSentiment}});
});
