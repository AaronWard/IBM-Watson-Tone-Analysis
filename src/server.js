'use strict';
const config = require('./config');
const express = require('express');
const app = express();
const watson = require('watson-developer-cloud');
const vcapServices = require('vcap_services');
const cors = require('cors');
const ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');

/****************************************************************/

// on bluemix, enable rate-limiting and force https
if (process.env.VCAP_SERVICES) {
  // enable rate-limiting
  const RateLimit = require('express-rate-limit');
  app.enable('trust proxy'); // required to work properly behind Bluemix's reverse proxy
  const limiter = new RateLimit({ windowMs: 15 * 60 * 1000, max: 100, delayMs: 0});

  //  apply to /api/*
  app.use('/api/', limiter);
  // force https - microphone access requires https in Chrome and possibly other browsers
  // (*.mybluemix.net domains all have built-in https support)
  const secure = require('express-secure-only');
  app.use(secure());
}
app.use(express.static(__dirname + '/static'));
app.use(cors());



//********* Speech To Text ********************/

//Autheneticate user
var sttAuthService = new watson.AuthorizationV1(
  Object.assign(
    {
    username: config.USER_NAME,
    password: config.PASSWORD
    },
    vcapServices.getCredentials('speech_to_text') // pulls credentials from environment in bluemix, otherwise returns {}
  )
);

//entry point for requesting token
app.use('/api/speech-to-text/token', function(req, res) {
  sttAuthService.getToken(
    {
      url: watson.SpeechToTextV1.URL
    },
    function(err, token) {
      if (err) {
        console.log('Error retrieving token: ', err);
        res.status(500).send('Error retrieving token');
        return;
      }
      // console.log('token from server.js is ', token);
      res.send(token);
    }
  );
});


/************* Tone analysis *****************/

//Authenticate User
var tone_analyzer = new ToneAnalyzerV3({
  username: config.TONE_USER_NAME,
  password: config.TONE_PASSWORD,
  version_date: '2017-09-21',
  url: 'https://gateway.watsonplatform.net/tone-analyzer/api/'
});


/**
 * Entry point for tone analyzer
 * Takes the speech-to-text result as a paramater
 */
app.use('/api/tone/:text', function(req,res){
    
    console.log('\x1b[36m', "Text recieved :" + req.params.text, '\x1b[0m');

    //Analyse the tone
    tone_analyzer.tone(
      {
        tone_input: req.params.text,
        content_type: 'text/plain'
      },
      function(err, tone) {
        if (err) {
          console.log(err);
        } else {
          console.log('tone endpoint:');
          console.log(JSON.stringify(tone, null, 2));
        }
      }
    );
})

/****************************************************************/
const port = process.env.PORT || process.env.VCAP_APP_PORT || 3002;
app.listen(port, function() {
  console.log('Example IBM Watson Tone Aanalysis JS SDK client app & token server live at http://localhost:%s/', port);
});

// Chrome requires https to access the user's microphone unless it's a localhost url so
// this sets up a basic server on port 3001 using an included self-signed certificate
// note: this is not suitable for production use
// however bluemix automatically adds https support at https://<myapp>.mybluemix.net
if (!process.env.VCAP_SERVICES) {
  const fs = require('fs');
  const https = require('https');
  const HTTPS_PORT = 3001;
 
  const options = {
    key: fs.readFileSync(__dirname + '/keys/localhost.pem'),
    cert: fs.readFileSync(__dirname + '/keys/localhost.cert')
  };
  https.createServer(options, app).listen(HTTPS_PORT, function() {
    console.log('Secure server live at https://localhost:%s/', HTTPS_PORT);
  });
}