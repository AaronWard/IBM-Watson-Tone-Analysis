import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
// import config from './config.js';
import recognizeMic from 'watson-speech/speech-to-text/recognize-microphone';
// var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');

  // var tone_analyzer = new ToneAnalyzerV3({
  //   username: config.TONE_USER_NAME,
  //   password: config.TONE_PASSWORD,
  //   version_date: '2017-09-21',
  //   url: 'https://gateway.watsonplatform.net/tone-analyzer/api/'
  // });


  
class App extends Component {
  constructor(){
    super();
    this.state = {};
  }
  onClickButton(){

    fetch('http://localhost:3002/api/tone/token')
    .then((response)=>{
      // return response.text();
      console.log(response);
    })


    /****************************************** */

    fetch('http://localhost:3002/api/speech-to-text/token')
    .then((response) =>{
        return response.text();
    }).then((token) => {

      console.log(token)
      var stream = recognizeMic({
          token: token,
          objectMode: true, // send objects instead of text
          extractResults: true, // convert {results: [{alternatives:[...]}], result_index: 0} to {alternatives: [...], index: 0}
          format: false // optional - performs basic formatting on the results such as capitals an periods
      });

      /**
       * Prints the users speech to the console
       * and assigns the text to the state.
       */
      stream.on('data',(data) => {
          this.setState({
            text: data.alternatives[0].transcript
          }
        )
      });
      stream.on('error', function(err) {
          console.log(err);
      });
      document.querySelector('#stop').onclick = stream.stop.bind(stream);
    })
    .catch(function(error) {
        console.log(error);
    });


    fetch('http://localhost:3002/api/tone/' + this.state.text)
      .then((res) =>{
        console.log("fetched tone");
        console.log(res)
      })  
      .catch(function(error) {
        console.log(error);
    });
}
    render() {
      return (
        <div className="App">
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <h1 className="App-title">Welcome to React</h1>
          </header>
          <button id="button" onClick={this.onClickButton.bind(this)}>Listen To Microphone</button>
        <div className="App-Text">{this.state.text}</div> 
        </div>
      );
    }
}

export default App;
