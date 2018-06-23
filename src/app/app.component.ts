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
  this.initialLabel, this.initialLabel, this.initialLabel, this.initialLabel]
@ViewChild('chart')
    htmlRef: ElementRef;


@ViewChild('chart2')
    htmlRef2: ElementRef;
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
          options: {legend: { display: false },
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
            borderColor: "Red",

            fill: true
          }
        ],
        backgroundColor: ["Red"],
        pointBorderColor: ["Red"],
        labels: this.labels
      },
      options: {legend: { display: false },
        scaleFontColor: 'White',
        scales: {
            yAxes : [{
                ticks : {
                  min : 0,
                  max : 4,
                  fontColor: "Red" // this here
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
    this.http.get('http://localhost:9000/teamNames')
    .subscribe(response => {
      var data = response as teamNames;
      this.team1Name = data.teams.team1;
      this.team2Name = data.teams.team2;
    });
    setInterval(() => {
    this.http.get('http://localhost:9000')
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
      });
  }, 7000);
  }

  public setTimeScale(){
    console.log('Timescale');
  }

  public combinedView(){

  }

  public setOneMinute(){

    //get one minute average sentiment
  }

  public setThirtyMinutes(){
    //get thirty minute average sentiment
  }

  public setOneHour(){

  }

  public setTwoHours(){

  }

  public setFourHours(){

  }
}
