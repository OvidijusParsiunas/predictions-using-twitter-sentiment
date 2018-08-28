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

interface responseData{
  data: sentimentDetails;
}

interface teamNames{
  teams: {
    team1:string;
    team2: string
  };
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
  timeScale = 10;
  hideCombinedView: boolean = true;
  dropDownChangeViewText = "Combined View";

@ViewChild('chart')
    htmlRef: ElementRef;

@ViewChild('chart2')
    htmlRef2: ElementRef;

@ViewChild('chart3')
    htmlRef3: ElementRef;

  ngOnInit(){
        this.retrieveUISetUpData();
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

    var sentimentAPICallInterval = this.calculateNewSentimentFetchInterval();

    this.http.get('http://localhost:9000/teamNames')
    .subscribe(response => {
      var data = response as teamNames;
      this.team1Name = data.teams.team1;
      this.team2Name = data.teams.team2;
    });

    setInterval(() => {
    this.http.get('http://localhost:9000/newSentimentData/45')
    .subscribe(response => {
      var data = response as responseData;
      for(let index = 0; index < this.team1Sentiment.length-1; index++){
        this.team1Sentiment[index] = this.team1Sentiment[index+1];
      }
      this.team1Sentiment[this.team1Sentiment.length-1] = data.data.team1Sentiment;
      this.team1AverageSentiment = Math.round(data.data.team1AverageSentiment * 100) / 100;
      for(let index = 0; index < this.labels.length-1; index++){
        this.labels[index] = this.labels[index+1];
      }
      this.labels[this.labels.length-1] = new Date().getMinutes() + ':' + new Date().getSeconds();
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
        else if(this.team1AverageSentiment < this.team2AverageSentiment){
          document.getElementById('teamCards1').setAttribute("style", '-moz-box-shadow: 0 0 3px #FF0; -webkit-box-shadow: 0 0 3px #FF0; box-shadow:0 0 20px #FF0')
          document.getElementById('teamCards2').setAttribute("style", '-moz-box-shadow: 0 0 3px #FF0; -webkit-box-shadow: 0 0 3px #FF0; box-shadow:0 0 20px #FF0')
          this.team1Sparkles = false;
          this.team2Sparkles = false;
        }

        this.chart.update();
        this.chart2.update();
        this.chart3.update();
      });
    }, 2000);
  //}, sentimentAPICallInterval);
  }

  public retrieveUISetUpData(){
    this.http.get('http://localhost:9000/UISetUp')
    .subscribe(response => {
      //Define an interface for the retrieved
      //UICargo object
    });
  }

  public calculateNewSentimentFetchInterval(){
    var interval = this.timeScale/this.columnNum;
    if(this.timeUnit === 'seconds'){
      interval = interval*1000;
    } else if(this.timeUnit === 'minutes'){
      interval = interval*60000;
    }
    return interval;
  }

  public setTimeScaleTitle(scale, unit){
    let tempTitle = "Past " + scale + " ";
    tempTitle += scale > 1 ? unit + "s" : unit;
    this.timeScaleTitle = tempTitle;
  }

  public generateLabelArray(){
    var arrayLength = 10;
    var time = 50;
    var lastAPICallTimeStamp = new Date();
    var timeDecrementer = time/arrayLength;
    var timeUnit = 'seconds';
    if(timeUnit === 'seconds'){
      this.populateLabelsArrayElements(lastAPICallTimeStamp.getMinutes(), lastAPICallTimeStamp.getSeconds(), timeDecrementer);
    }
    else if(timeUnit === 'minutes'){
      this.populateLabelsArrayElements(lastAPICallTimeStamp.getHours(), lastAPICallTimeStamp.getMinutes(), timeDecrementer);
    }
    else if(timeUnit === 'hours'){
      this.populateLabelsArrayElements(lastAPICallTimeStamp.getDate(), lastAPICallTimeStamp.getHours(), timeDecrementer);
    }
    console.log(this.labels);
  }

  private populateLabelsArrayElements(timeUnit1, timeUnit2, decrementer){
    var graphScale = 10;
    for(let i = graphScale; i > 0; i--){
      timeUnit2 = timeUnit2 - decrementer;
      this.labels[i] = timeUnit1 + ":" + timeUnit2;
    }
  }

  public setXAxisScale(length) {
    var actualArrayLength = 10;
    var lengthToCut = actualArrayLength - length;
    this.labels.splice(0,lengthToCut);
    this.chart.update();
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
}
