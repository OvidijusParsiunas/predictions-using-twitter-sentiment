import { Component, ElementRef, ViewChild } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Chart } from 'chart.js';

interface sentimentDetails{
  team1Sentiment: number;
  team2Sentiment: number;
  team1AverageSentiment: number;
  team2AverageSentiment: number;
}

interface responseData{
  data: sentimentDetails;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  constructor( private http: HttpClient){}
  chart: Chart;
  chart2: Chart;
  team1Sentiment  = [0,0,0,0,0,0,0,0,0,0];
  team2Sentiment  = [0,0,0,0,0,0,0,0,0,0];
  team1AverageSentiment = 0;
  team2AverageSentiment = 0;
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
                      fontColor: "Red" // this here
                    }
                }],
                xAxes : [{
                    ticks : {
                      fontColor: "Red" // this here
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
                }
            }],
            xAxes : [{
                ticks : {
                  fontColor: "Red" // this here
                }
            }]
        }
      }
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
        this.chart.update();
        this.chart2.update();
      });
  }, 7000);
  }

}
