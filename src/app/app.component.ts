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
  startingData: startingData;
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
  millisecondsBeforeApiCallForNextTeam: number;
  apiCallInterval: number;
}

interface startingData{
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
  team1Sentiment  = [0,0,0,0,0,0,0,0,0,0];
  team2Sentiment  = [0,0,0,0,0,0,0,0,0,0];
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
  millisecondsBeforeApiCallForNextTeam = 0;
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

@ViewChild('chart')
    htmlRef: ElementRef;

@ViewChild('chart2')
    htmlRef2: ElementRef;

@ViewChild('chart3')
    htmlRef3: ElementRef;

  ngOnInit(){
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
    //interval = (time/scale)*minute

    var sentimentAPICallInterval = this.calculateNewSentimentFetchInterval(this.timeSpan, this.columnNum, this.timeUnit);

    this.http.get('http://localhost:9000/UISetUp')
    .subscribe(response => {
      var data = response as UISetUpData;
      this.mapUISetUpData(data);
      this.updateWinningChartGlow();
});

    setInterval(() => {
    this.http.get('http://localhost:9000/newSentimentData/45')
    .subscribe(response => {
      var data = response as newSentimentData;
      for(let index = 0; index < this.team1Sentiment.length-1; index++){
        this.team1Sentiment[index] = this.team1Sentiment[index+1];
      }
      this.team1Sentiment[this.team1Sentiment.length-1] = data.data.team1Sentiment;
      //Javascript/typescript method for rounding float variables
      this.team1AverageSentiment = Math.round(data.data.team1AverageSentiment * 100) / 100;
      for(let index = 0; index < this.labels.length-1; index++){
        this.labels[index] = this.labels[index+1];
      }
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
    }, 2000);
  //}, sentimentAPICallInterval);
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

  public setTimeScaleTitle(scale, unit){
    let tempTitle = "Past " + scale + " ";
    tempTitle += scale > 1 ? unit + "s" : unit;
    this.timeScaleTitle = tempTitle;
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

    function decrementSeconds(){
      this.lastAPICallTimeStamp.setSeconds(this.lastAPICallTimeStamp.getSeconds() - timeDecrementer);
      return dateLabelBuilder(this.lastAPICallTimeStamp.getMinutes(), this.lastAPICallTimeStamp.getSeconds());

    }

    function decrementMinutes(){
      this.lastAPICallTimeStamp.setMinutes(this.lastAPICallTimeStamp.getMinutes() - timeDecrementer);
      return dateLabelBuilder(this.lastAPICallTimeStamp.getHours(), this.lastAPICallTimeStamp.getMinutes());
    }

    function decrementHours(){
      this.lastAPICallTimeStamp.setHours(this.lastAPICallTimeStamp.getHours() - timeDecrementer);
      return dateLabelBuilder(this.lastAPICallTimeStamp.getDate(), this.lastAPICallTimeStamp.getHours());
    }
  }

  private mapUISetUpData(data){
    this.team1Name = data.teamNames.team1;
    this.team2Name = data.teamNames.team2;
    //this.timeUnit = data.timeUnit;
    this.availableGraphScales = data.availableGraphScales;
    //this.timeSpan = data.startingGraphScales.timeSpan;
    //this.columnNum = data.startingGraphScales.xAxisScale;
    this.lastAPICallTimeStamp = this.parseRetrievedDate(data.timeOfLastAPICall.lastAPICallTimeStamp);
    this.millisecondsBeforeApiCallForNextTeam = data.timeOfLastAPICall.millisecondsBeforeApiCallForNextTeam;
    //not using the provided API call interval at the moment as the graph's
    //rest call interval is different to the server's call to sentiment api
    this.setUpChart(this.team1Sentiment, data.startingData.team1Sentiment);
    this.setUpChart(this.team2Sentiment, data.startingData.team2Sentiment);
    this.team1AverageSentiment = Math.round(data.startingData.team1CurrentAverage * 100) / 100;
    this.team2AverageSentiment = Math.round(data.startingData.team2CurrentAverage * 100) / 100;
  }

  private parseRetrievedDate(retrievedDate){
    let newDate = new Date(retrievedDate);
    if(!newDate || newDate.toString() === 'Invalid Date' || !newDate.getDate() || !newDate.getHours() || !newDate.getMinutes() || !newDate.getSeconds()){
      console.log('ERROR parsing the retrieved date');
      return new Date();
    }
    return newDate;
  }

  private populateLabelsArrayElements(decrementer, graphScale){
    for(let i = graphScale-1; i > -1; i--){
      this.labels[i] = decrementer();
    }
  }

  public constructCharts(timeSpan, columnNum) {
    var actualArrayLength = 10;
    var lengthToCut = actualArrayLength - columnNum;
    this.labels.splice(0,lengthToCut);
    this.team1Sentiment.length = columnNum;
    this.team2Sentiment.length = columnNum;
    this.generateLabelArray(timeSpan, columnNum);
    this.updateCharts();
    console.log(this.generateCurrentTimeSpan());
  }

  public setUpChart(oldSentimentArray, newSentimentArray){
    for(let i = 0; i < oldSentimentArray.length; i++){
      oldSentimentArray[i] = newSentimentArray[i];
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

  generateCurrentTimeSpan = this.setTimeSpanGenerator('seconds');

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

  private updateCharts(){
    this.chart.update();
    this.chart2.update();
    this.chart3.update();
  }
}
