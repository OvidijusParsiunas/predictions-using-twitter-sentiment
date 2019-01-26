import { Component, ElementRef, ViewChild, Inject} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {DOCUMENT} from '@angular/common';
import {Chart} from 'chart.js';

interface sentimentDetails{
  team1Sentiment: number;
  team2Sentiment: number;
  team1AverageSentiment: number;
  team2AverageSentiment: number;
}

interface newSentimentData{
  data: sentimentDetails;
}

interface UISetUpData{
  teamNames: teamNames;
  timeUnit: string;
  availableGraphScales: timespanScales[];
  startingGraphScales: startingGraphScales;
  timeOfLastAPICall: timeOfLastAPICall;
  startingData: persistedData;
}

interface teamNames{
    team1: string;
    team2: string;
}

interface startingGraphScales{
  timeSpan: number;
  xAxisScale: number;
}

interface timeOfLastAPICall{
  lastAPICallTimeStamp: Date;
  secondsBeforeApiCallForNextTeam: number;
  apiCallIntervalSeconds: number;
}

interface persistedData{
  team1Sentiment: number[];
  team2Sentiment: number[];
  team1CurrentAverage: number;
  team2CurrentAverage: number;
}

interface timespanScales{
  timespan: number;
  availableXAxisScales: number[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  constructor(@Inject(DOCUMENT) private document: any, private http: HttpClient){}
  chart: Chart;
  chart2: Chart;
  chart3: Chart;
  team1Name = 'Team 1 Name';
  team2Name = 'Team 2 Name';
  team1Sentiment = [];
  team2Sentiment = [];
  //default lengths for when the ui is up and the server is on later to allow the new sentiment to be populated
  team1AverageSentiment = 0;
  team2AverageSentiment = 0;
  team1Sparkles = true;
  team2Sparkles = true;
  timeScaleTitle = "For Past 30 Minutes"
  initialLabel = new Date().getMinutes() + ':' + new Date().getSeconds();
  labels = [this.initialLabel, this.initialLabel, this.initialLabel, this.initialLabel, this.initialLabel, this.initialLabel,
  this.initialLabel, this.initialLabel, this.initialLabel, this.initialLabel];
  timeUnit = 'minutes';
  columnNum = 10;
  timeSpan = 10;
  hideCombinedView: boolean = true;
  dropDownChangeViewText = "Combined View";
  availableGraphScales = {};
  lastAPICallTimeStamp = new Date();
  apiCallIntervalSeconds = 0;
  secondsBeforeApiCallForNextTeam = 0;
  initialAPICallOffset = 0;

@ViewChild('chart')
    htmlRef: ElementRef;

@ViewChild('chart2')
    htmlRef2: ElementRef;

@ViewChild('chart3')
    htmlRef3: ElementRef;

  //we instantiate 3 charts, the third one is hidden and appears when the double view is activated (the others are then deactivated)
  ngOnInit(){
        this.setDefaultSentimentArrayLengths();
        this.chart = new Chart(this.htmlRef.nativeElement, {
          type: 'line',
          data: {
            datasets: [{
                data: this.team1Sentiment,
                borderColor: "Red",

                fill: true
              }
            ],
            backgroundColor: ["Red"],
            pointBorderColor: ["Red"],
            labels: this.labels
          },
          options: {
            legend: { display: false },
            scaleFontColor: 'White',
            scales: {
                yAxes : [{
                    ticks : {
                      min : 0,
                      max : 4,
                      fontColor: "Red" // this here#
                    },
                    scaleLabel: {
                      display: true,
                      labelString: 'Positive Sentiment Score',
                      fontColor: "Red"
                   }
                }],
                xAxes : [{
                    ticks : {
                      fontColor: "Red" // this here
                    },
                    scaleLabel: {
                      display: true,
                      labelString: 'Time m/s',
                      fontColor: "Red"
                   }
                }]
            }
          }
    });

    this.chart2 = new Chart(this.htmlRef2.nativeElement, {
      type: 'line',
      data: {
        datasets: [{
            data: this.team2Sentiment,
            borderColor: "#407cd6",

            fill: true
          }
        ],
        backgroundColor: ["#317fce"],
        pointBorderColor: ["#317fce"],
        labels: this.labels
      },
      options: {legend: { display: false },
        scaleFontColor: 'White',
        scales: {
            yAxes : [{
                ticks : {
                  min : 0,
                  max : 4,
                  fontColor: "#407cd6" // this here
                },
                scaleLabel: {
                  display: true,
                  labelString: 'Positive Sentiment Score',
                  fontColor: "#407cd6"
               }
            }],
            xAxes : [{
                ticks : {
                  fontColor: "#407cd6" // this here
                },
                scaleLabel: {
                  display: true,
                  labelString: 'Time m/s',
                  fontColor: "#407cd6"
               }
            }]
        }
      }
});

this.chart3 = new Chart(this.htmlRef3.nativeElement, {
  type: 'line',
  data: {
    type: 'line',
    datasets: [{
        data: this.team1Sentiment,
        label: 'Brazil',
        borderColor: "Red",
        fill: true,
        legendMarkerType: "circle",
        backgroundColor: "rgba(237, 237, 237, 0.2)", // <-- supposed to be light blue
      },
      {
        data: this.team2Sentiment,
        label: 'Afghanistan',
        borderColor: "#407cd6",
        fill: true,
        backgroundColor: "rgba(237, 237, 237, 0.4)",
        }
    ],
    backgroundColor: ["Red"],
    pointBorderColor: ["Red"],
    labels: this.labels
  },
  options: {
      legend: { display: false },
      responsive: true,
      maintainAspectRatio: false,
    scales: {
        yAxes : [{
            ticks : {
              min : 0,
              max : 4,
              fontColor: "Red" // this here#
            },
            scaleLabel: {
              display: true,
              labelString: 'Positive Sentiment Score',
              fontColor: "Red"
           }
        }],
        xAxes : [{
            ticks : {
              fontColor: "Red" // this here
            },
            scaleLabel: {
              display: true,
              labelString: 'Time m/s',
              fontColor: "Red"
           }
        }]
    }
  }
});

    this.http.get('http://localhost:9000/UISetUp')
    .subscribe(response => {
      var data = response as UISetUpData;
      this.mapUISetUpData(data);
      this.updateWinningChartGlow();
      this.setAPICallOffset();
      this.instantiateSentimentAPICalls();
    },
    error => {
      console.log('The server is not responding');
    });
  }

  //the following is used to create a reusable function
  generateCurrentTimeSpan = this.setTimeSpanGenerator('seconds');

  private instantiateSentimentAPICalls(){
    var sentimentAPICallInterval = this.calculateNewSentimentFetchInterval(this.timeSpan, this.columnNum, this.timeUnit);
    setTimeout(() => {
      setInterval(() => {
      this.http.get('http://localhost:9000/newSentimentData/45')
      .subscribe(response => {
        var data = response as newSentimentData;
        console.log('length is: ' + this.team1Sentiment.length);
        for(let index = 0; index < this.team1Sentiment.length-1; index++){
          this.team1Sentiment[index] = this.team1Sentiment[index+1];
        }
        this.team1Sentiment[this.team1Sentiment.length-1] = data.data.team1Sentiment;
        //Javascript/typescript method for rounding float variables
        this.team1AverageSentiment = Math.round(data.data.team1AverageSentiment * 100) / 100;
        //move all array element values by one index to the left
        for(let index = 0; index < this.labels.length-1; index++){
          this.labels[index] = this.labels[index+1];
        }
        //this is used to retrieve the current time, which is then stored in the last array element for every new iteration
        this.labels[this.labels.length-1] = this.generateCurrentTimeSpan();

        for(let index = 0; index < this.team2Sentiment.length-1; index++){
          this.team2Sentiment[index] = this.team2Sentiment[index+1];
        }

        this.team2Sentiment[this.team2Sentiment.length-1] = data.data.team2Sentiment;
        this.team2AverageSentiment = Math.round(data.data.team2AverageSentiment * 100) / 100;
          // this.team1Sentiment.push(data.data.team1team1Sentiment);
          // this.team1Sentiment = this.team1Sentiment.splice(-1);
          //
          // this.labels.push(new Date().getHours() + ':' + new Date().getMinutes());
          // this.team1Sentiment = this.team1Sentiment.splice(-1);
              // this.chart.data.datasets[0].data.push(data.data.team1team1Sentiment);
              // this.chart.data.labels.push(new Date().getHours() + ':' + new Date().getMinutes());
          console.log('team1team1Sentiment ' + data.data.team1Sentiment + ' team2team1Sentiment ' + data.data.team2Sentiment);
          this.updateWinningChartGlow();
        });
      }, 2000); // keeping it 2 seconds for testing purposes, but should be the following upon completion: }, sentimentAPICallInterval);
    }, this.initialAPICallOffset);
  }

  private setDefaultSentimentArrayLengths(){
    this.team1Sentiment.length = 10;
    this.team2Sentiment.length = 10;
  }
  private updateWinningChartGlow(){
    if(this.team1AverageSentiment > this.team2AverageSentiment){
      document.getElementById('teamCards1').setAttribute("style", '-moz-box-shadow: 0 0 3px #FF0; -webkit-box-shadow: 0 0 3px #FF0; box-shadow:0 0 20px #FF0');
      document.getElementById('teamCards2').setAttribute("style", '-moz-box-shadow: 0; -webkit-box-shadow: 0; box-shadow:0');
      this.team1Sparkles = false;
      this.team2Sparkles = true;
    }
    else if(this.team1AverageSentiment < this.team2AverageSentiment){
      document.getElementById('teamCards1').setAttribute("style", '-moz-box-shadow: 0; -webkit-box-shadow: 0; box-shadow:0');
      document.getElementById('teamCards2').setAttribute("style", '-moz-box-shadow: 0 0 3px #FF0; -webkit-box-shadow: 0 0 3px #FF0; box-shadow:0 0 20px #FF0');
      this.team1Sparkles = true;
      this.team2Sparkles = false;
    }
    else if(this.team1AverageSentiment === this.team2AverageSentiment){
      document.getElementById('teamCards1').setAttribute("style", '-moz-box-shadow: 0 0 3px #FF0; -webkit-box-shadow: 0 0 3px #FF0; box-shadow:0 0 20px #FF0')
      document.getElementById('teamCards2').setAttribute("style", '-moz-box-shadow: 0 0 3px #FF0; -webkit-box-shadow: 0 0 3px #FF0; box-shadow:0 0 20px #FF0')
      this.team1Sparkles = false;
      this.team2Sparkles = false;
    }
    this.updateCharts();
  }

  //this is important because when the interval is 100s and columns are 20, we want the retrieval to be slower for 20
  public calculateNewSentimentFetchInterval(timeSpan, columnNum, timeUnit){
    var interval = timeSpan/columnNum;
    if(timeUnit === 'seconds'){
      interval = interval*1000;
    } else if(timeUnit === 'minutes'){
      interval = interval*60000;
    } else if(timeUnit === 'hours'){
      interval = interval*3600000;
    }
    return interval;
  }

  public generateLabelArray(timeSpan, arrayLength){
    var timeDecrementer = timeSpan/arrayLength;
    var timeUnit = 'seconds';
    var dateLabelBuilder = this.dateLabelBuilder;

    if(timeUnit === 'seconds'){
      this.populateLabelsArrayElements(decrementSeconds, arrayLength);
    }
    else if(timeUnit === 'minutes'){
      this.populateLabelsArrayElements(decrementMinutes, arrayLength);
    }
    else if(timeUnit === 'hours'){
      this.populateLabelsArrayElements(decrementHours, arrayLength);
    }

    function decrementSeconds(lastAPICallTimeStamp){
      lastAPICallTimeStamp.setSeconds(lastAPICallTimeStamp.getSeconds() - timeDecrementer);
      return dateLabelBuilder(lastAPICallTimeStamp.getMinutes(), lastAPICallTimeStamp.getSeconds());
    }

    function decrementMinutes(lastAPICallTimeStamp){
      this.lastAPICallTimeStamp.setMinutes(this.lastAPICallTimeStamp.getMinutes() - timeDecrementer);
      return dateLabelBuilder(this.lastAPICallTimeStamp.getHours(), this.lastAPICallTimeStamp.getMinutes());
    }

    function decrementHours(lastAPICallTimeStamp){
      this.lastAPICallTimeStamp.setHours(this.lastAPICallTimeStamp.getHours() - timeDecrementer);
      return dateLabelBuilder(this.lastAPICallTimeStamp.getDate(), this.lastAPICallTimeStamp.getHours());
    }
  }

  private mapUISetUpData(data){
    this.team1Name = data.teamNames.team1;
    this.team2Name = data.teamNames.team2;
    this.timeUnit = data.timeUnit;
    this.availableGraphScales = data.availableGraphScales;
    this.timeSpan = data.startingGraphScales.timeSpan;
    this.columnNum = data.startingGraphScales.xAxisScale;
    this.lastAPICallTimeStamp = this.parseRetrievedDate(data.timeOfLastAPICall.lastAPICallTimeStamp);
    this.secondsBeforeApiCallForNextTeam = data.timeOfLastAPICall.secondsBeforeApiCallForNextTeam;
    this.apiCallIntervalSeconds = data.timeOfLastAPICall.apiCallIntervalSeconds;
    //not using the provided API call interval at the moment as the graph's
    //rest call interval is different to the server's call to sentiment api
    this.team1Sentiment.length = this.columnNum;
    this.team2Sentiment.length = this.columnNum;
    this.generateLabelArray(this.timeSpan, this.columnNum);
    this.setUpSentimentData(this.team1Sentiment, data.startingData.team1Sentiment);
    this.setUpSentimentData(this.team2Sentiment, data.startingData.team2Sentiment);
    this.team1AverageSentiment = Math.round(data.startingData.team1CurrentAverage * 100) / 100;
    this.team2AverageSentiment = Math.round(data.startingData.team2CurrentAverage * 100) / 100;
  }

  private parseRetrievedDate(retrievedDate){
    let newDate = new Date(retrievedDate);
    if(!newDate || newDate.toString() === 'Invalid Date'){
      console.log('ERROR parsing the retrieved date; the date object before parsing: ' + retrievedDate + ', the date object after parsing: ' + newDate);
      return new Date();
    }
    return newDate;
  }

  private populateLabelsArrayElements(decrementer, graphScale){
    let lastAPICallTimeStampLabel = new Date(this.lastAPICallTimeStamp);
    for(let i = graphScale-1; i > -1; i--){
      this.labels[i] = decrementer(lastAPICallTimeStampLabel);
    }
  }

  private setAPICallOffset(){
    let currentDifference = Date.now() - this.lastAPICallTimeStamp.getTime();
    let apiCallIntervalMilliseconds = this.apiCallIntervalSeconds * 1000;
    let millisecondsBeforeApiCallForNextTeam = this.secondsBeforeApiCallForNextTeam * 1000;
    if(currentDifference - 200 > apiCallIntervalMilliseconds){
      console.log('The set up data took too long to retrieve in order to enable a sync with the server API using a calculated offset, creating a fixed offset instead...');
      currentDifference = 0;
    }
    let idealAPICallTimeStamp = ((apiCallIntervalMilliseconds - millisecondsBeforeApiCallForNextTeam)/2)+millisecondsBeforeApiCallForNextTeam;
    if(currentDifference < idealAPICallTimeStamp){
      this.initialAPICallOffset = idealAPICallTimeStamp - currentDifference;
    }
    else if(currentDifference >= idealAPICallTimeStamp){
      currentDifference = currentDifference%apiCallIntervalMilliseconds;
      if(currentDifference < idealAPICallTimeStamp){
        this.initialAPICallOffset = idealAPICallTimeStamp - currentDifference;
      }
      else if(currentDifference >= idealAPICallTimeStamp){
        this.initialAPICallOffset = idealAPICallTimeStamp + apiCallIntervalMilliseconds - currentDifference;
      }
    }
  }

  public constructCharts(timeSpan, columnNum) {
    var actualArrayLength = 10;
    var lengthToCut = actualArrayLength - columnNum;
    this.labels.splice(0,lengthToCut);
    this.team1Sentiment.length = columnNum;
    this.team2Sentiment.length = columnNum;
    this.generateLabelArray(timeSpan, columnNum);
    this.getPersistedSentimentData(timeSpan, columnNum);
    //retrieve the available data
    //sync initial ping to the server
    // - update labels
    // - update the sentiment data
    //update fetch rate
    this.updateCharts();
  }

  public setUpSentimentData(oldSentimentArray, newSentimentArray){
    let oldSentimentArrayIndex = oldSentimentArray.length-1;
    for(let i = newSentimentArray.length-1; i > -1; i--){
      oldSentimentArray[oldSentimentArrayIndex--] = newSentimentArray[i];
    }
    while(oldSentimentArrayIndex > -1){
      oldSentimentArray[oldSentimentArrayIndex--] = 0;
    }
  }

  public changeView(){
    if(this.hideCombinedView){
      this.hideCombinedView = false;
      this.dropDownChangeViewText = "Double View";
    }
    else{
      this.hideCombinedView = true;
      this.dropDownChangeViewText = "Combined View";
    }
  }

  private setTimeSpanGenerator(precision){
    if(precision === 'seconds'){
      return function(){
        var date = new Date();
        return this.dateLabelBuilder(date.getMinutes(), date.getSeconds());
      }
    }
    else if(precision === 'minutes'){
      return function(){
        var date = new Date();
        return this.dateLabelBuilder(date.getHours(), date.getMinutes());
      }
    }
    else if(precision === 'hours'){
      return function(){
        var date = new Date();
        return this.dateLabelBuilder(date.getDate(), date.getHours());
      }
    }
  }

  private dateLabelBuilder(timeUnit1, timeUnit2){
    return timeUnit1 + ':' + ('0' + timeUnit2).slice(-2);
  }

  private getPersistedSentimentData(timeSpan, graphScale){
    return this.http.get('http://localhost:9000/persistedData/45/6')
    .subscribe(response => {
      let data = response as persistedData;
    },
    error => {
      console.log('The server is not responding');
    });
  }

  private updateCharts(){
    this.chart.update();
    this.chart2.update();
    this.chart3.update();
  }

  //Retired functions
  public setTimeScaleTitle(scale, unit){
    let tempTitle = "Past " + scale + " ";
    tempTitle += scale > 1 ? unit + "s" : unit;
    this.timeScaleTitle = tempTitle;
  }
}


//Returned UI Setup code
/*
{
    "teamNames": {
        "team1": "Brazil",
        "team2": "Costa,Rica,CostaRica"
    },
    "timeUnit": "seconds",
    "availableGraphScales": {
        "25": [
            5
        ],
        "30": [
            6
        ],
        "35": [
            7
        ],
        "40": [
            8
        ],
        "45": [
            9
        ],
        "50": [
            10
        ],
        "55": [
            11
        ],
        "60": [
            12
        ],
        "65": [
            13
        ],
        "70": [
            14
        ],
        "75": [
            15
        ],
        "80": [
            16
        ],
        "85": [
            17
        ],
        "90": [
            18
        ],
        "95": [
            19
        ],
        "100": [
            10,
            20
        ],
        "105": [
            21
        ],
        "110": [
            11,
            22
        ],
        "115": [
            23
        ],
        "120": [
            12,
            24
        ]
    },
    "startingGraphScales": {
        "timeSpan": 70,
        "xAxisScale": 14
    },
    "timeOfLastAPICall": {
        "this.lastAPICallTimeStamp": "2018-09-02T14:43:20.000Z",
        "millisecondsBeforeApiCallForNextTeam": 2000,
        "apiCallInterval": 5000
    },
    "startingData": {
        "team1Sentiment": [
            2.3333333333333335,
            2,
            2
        ],
        "team2Sentiment": [
            2.3076923076923075,
            2,
            2
        ],
        "team1CurrentAverage": 2.111111111111111,
        "team2CurrentAverage": 2.1025641025641026
    }
}
*/
