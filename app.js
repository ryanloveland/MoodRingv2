const express = require("express");
const app = express();
const port = 3000;
const redirect_uri = 'http://localhost:3000/callback';
const request = require('request');
const url = require('url');
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;

app.get('/', (req, res) => {
    res.send("Hello World, fuk u");
});

app.get('/login', (req, res) => {
    res.redirect('https://accounts.spotify.com/authorize' +
            '?response_type=code' +
            '&client_id=' + client_id +
            '&scope=user-top-read' +
            '&redirect_uri=' + encodeURIComponent(redirect_uri));
});

app.get('/callback', function(req, res) {
    let code = req.query.code;
    let bodyResponse;
    request.post('https://accounts.spotify.com/api/token', {
        form: {
            'client_id': client_id,
            'client_secret': client_secret,
            'grant_type': "authorization_code",
            'code': code,
            'redirect_uri': "http://localhost:3000/callback"
            }
        }, (error, res, body) => {
          if (error) {
            console.error(error)
            return
          }
          console.log(`statusCode: ${res.statusCode}`)
          bodyResponse = JSON.parse(body);
          console.log(bodyResponse);
          const options = {
              url: 'https://api.spotify.com/v1/me/top/tracks/',
              method: 'GET',
              headers: {
                  "Authorization": "Bearer " + bodyResponse["access_token"]
              }
          };
          request(options, (err, res, body) => {
              jsonResponse = JSON.parse(body);
              for (let i = 0; i < jsonResponse.items.length; i++) {
                let spotify_uri = jsonResponse.items[i].id;
                const options2 = {
                    url: "https://api.spotify.com/v1/audio-features/" + spotify_uri,
                    method: "GET",
                    headers: {
                        "Authorization": "Bearer " + bodyResponse["access_token"]
                    }
                };
                request(options2, (err, res, body) => {
                    jsonResponse2 = JSON.parse(body);
                    console.log(jsonResponse.items[i].name);
                    console.log("  " + jsonResponse.items[i].artists[0].name);
                    console.log("SPOTIFY URI: " + spotify_uri);
                    console.log(jsonResponse2.danceability);
                });
              }
          });
        });
    res.end();
});


app.listen(port, () => console.log(`MoodRing is now listening on PORT:${port}`))
