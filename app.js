const express = require("express");
const app = express();
const port = process.env.PORT;
const redirect_uri = 'https://spotifymoodring.herokuapp.com/callback';
const request = require('request');
const url = require('url');
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
var d3 = require("d3");
let auth = "Bearer ";
let refresh_token;
let listOfTracks = [];

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('pages/login');
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
    let danceTotal = 0;
    request.post('https://accounts.spotify.com/api/token', {
        form: {
            'client_id': client_id,
            'client_secret': client_secret,
            'grant_type': "authorization_code",
            'code': code,
            'redirect_uri': redirect_uri
            }
        }, (error, res, body) => {
          if (error) {
            console.error(error)
            return
          }
          console.log(`statusCode: ${res.statusCode}`)
          bodyResponse = JSON.parse(body);
          console.log(bodyResponse);
          auth = auth + bodyResponse["access_token"];
          refresh_token = bodyResponse.refresh_token;
          const options = {
              url: 'https://api.spotify.com/v1/me/top/tracks/',
              method: 'GET',
              headers: {
                  "Authorization": auth
              }
          };
          request(options, (err, res, body) => {
              console.log(err);
              jsonResponse = JSON.parse(body);
              let counter = 0;
              for (let i = 0; i < jsonResponse.items.length/2; i++) {
                let spotify_uri = jsonResponse.items[i].id;
                let track = jsonResponse.items[i];
                //const options2 = {
                //    url: "https://api.spotify.com/v1/audio-features/" + spotify_uri,
                //    method: "GET",
                //    headers: {
                //        "Authorization": auth
                //    }
                //};
                let artists = track.artists;
                let trackInfo = {};
                trackInfo.name = track.name;
                trackInfo.artists = track.artists;
                trackInfo.relatedArtists = [];
                for (let j = 0; j < artists.length; j++) {
                    let artist = artists[j];
                    request.post('https://accounts.spotify.com/api/token', {
                        form: {
                            'client_id': client_id,
                            'client_secret': client_secret,
                            'grant_type': "refresh_token",
                            'refresh_token': refresh_token
                            }
                        }, (error, res, body) => {
                            if (error) {
                              console.error(error)
                              return
                            }
                            bodyResponse = JSON.parse(body);
                            auth = "Bearer " + bodyResponse.access_token;
                        });
                        let artistId = artist.id;
                        let options3 = {
                           url: "https://api.spotify.com/v1/artists/" + artistId + "/related-artists",
                           method: "GET",
                           headers: {
                               "Authorization": auth
                           }
                        }
                        let relatedArtists;
                        request(options3, (err, res, body) => {
                            relatedArtists = JSON.parse(body);
                            console.log("Track Name: " + track.name);
                            console.log("Artist: " + artists[j].name);
                            console.log("Artist ID: " + artist.id);
                            console.log("Related Artists: ");
                            let counter = 0;
                            let count1= 0;
                            for (let k = 0; k < relatedArtists.artists.length/10; k++) {
                                console.log(relatedArtists.artists[k].name);
                                let relArtistId = relatedArtists.artists[k].id;
                                let options4 = {
                                   url: "https://api.spotify.com/v1/artists/" + relArtistId + "/top-tracks?country=US",
                                   method: "GET",
                                   headers: {
                                       "Authorization": auth
                                   }
                                }
                                request(options4, (err, res, body) => {
                                    let topTracks = JSON.parse(body);
                                    let trackList = topTracks.tracks;
                                    let tracks = [];
                                    let count = 0;
                                    for (let l = 0; l < trackList.length/5; l++) {
                                        console.log(trackList[l].name);
                                        let options5 = {
                                           url: "https://api.spotify.com/v1/audio-features/" + trackList[l].id,
                                           method: "GET",
                                           headers: {
                                               "Authorization": auth
                                           }
                                        }
                                        request(options5, (err, res, body) => {
                                            trackFeatures = JSON.parse(body);
                                            let track = {
                                                name: trackList[l].name,
                                                valence: trackFeatures.valence,
                                                danceability: trackFeatures.danceability,
                                                popularity: trackList[l].popularity
                                            }
                                            tracks.push(track); 
                                            count++;
                                            if (count == trackList.length/5) {
                                                let relatedArtist = {
                                                    name: relatedArtists.artists[k].name,
                                                    topTracks: tracks
                                                }
                                                trackInfo.relatedArtists.push(relatedArtist);
                                            }
                                        });
                                    }
                                });
                                counter++;
                                if (counter == relatedArtists.artists.length/10) {
                                    let pushTrack = true;
                                    for (var u = 0; u < listOfTracks.length; u++) {
                                        if (listOfTracks[u].name == trackInfo.name) {
                                           pushTrack = false; 
                                        }
                                    }
                                    if (pushTrack) {
                                        listOfTracks.push(trackInfo);
                                    }
                                }
                            }
                        });
                }
                //request(options2, (err, res, body) => {
                //    jsonResponse2 = JSON.parse(body);
                //    console.log(jsonResponse.items[i].name);
                //    console.log("  " + jsonResponse.items[i].artists[0].name);
                //    console.log("SPOTIFY URI: " + spotify_uri);
                //    console.log(jsonResponse2.danceability);
                //    counter++;
                //    danceTotal = danceTotal + jsonResponse2.danceability;
                //    if (counter == jsonResponse.items.length) {
                //        console.log(danceTotal/jsonResponse.items.length);
                //    }
                //});
             }
          }); 
        });
    res.send("<a href='/display'>Click Here to display some data analysis!</a>");
    res.end();
});

app.get('/display', (req, res) => {
    res.render('pages/index', {listTracks: listOfTracks});
});


app.listen(port, () => console.log(`MoodRing is now listening on PORT:${port}`))
