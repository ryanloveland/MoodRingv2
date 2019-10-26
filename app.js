const express = require("express");
const app = express();
const port = 3000;
const my_client_id = "054911251a014d14805761ed90cc15fc";
const redirect_uri = 'http://localhost:3000/callback';
const request = require('request');
const url = require('url');

app.get('/', (req, res) => {
    res.send("Hello World, fuk u");
});

app.get('/login', function(req, res) {
    res.redirect('https://accounts.spotify.com/authorize' +
            '?response_type=code' +
            '&client_id=' + my_client_id +
            '&scope=user-top-read' +
            '&redirect_uri=' + encodeURIComponent(redirect_uri));
});

app.get('/callback', function(req, res) {
    let code = req.query.code;
    let bodyResponse;
    request.post('https://accounts.spotify.com/api/token', {
        form: {
            'client_id': "054911251a014d14805761ed90cc15fc",
            'client_secret': "c3f7ca96879f423086ddf241bc323107",
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
          console.log(typeof bodyResponse);
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


app.listen(port, () => console.log(`Example app listening on port ${port}!`))
