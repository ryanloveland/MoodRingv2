//Requirements
const express = require("express");
const dotenv = require("dotenv").config()
const request = require('request');
const url = require('url');
var d3 = require("d3");
const User = require("./calculations/user")

//App functionals
const app = express();
let listOfTracks = [];

//Spotify redirects and API wrapper
// const redirect_uri = 'https://spotifymoodring.herokuapp.com/callback';
const redirect_uri = 'http://localhost:3000/callback'

var SpotifyWebApi = require("spotify-web-api-node")
var spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: redirect_uri
});





app.set('view engine', 'ejs');

//Loads home page
app.get('/', (req, res) => {
    res.render('pages/home');
});

//Redirects to Spotify's authorization for a user
//This then redirects to callback
app.get('/login', (req, res) => {
    res.redirect('https://accounts.spotify.com/authorize' +
        '?response_type=code' +
        '&client_id=' + process.env.CLIENT_ID +
        '&scope=user-top-read' +
        '&redirect_uri=' + encodeURIComponent(redirect_uri));
});

//Currently sets authorization code and evaluates data in one way
app.get('/callback', async (req, res) => {
    //Sets up authorization for future calls to the API
    await spotifyApi.authorizationCodeGrant(req.query.code).then(
        function (data) {
            console.log('The token expires in ' + data.body['expires_in']);
            console.log('The access token is ' + data.body['access_token']);
            console.log('The refresh token is ' + data.body['refresh_token']);

            // Set the access token on the API object to use it in later calls
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);
        },
        function (err) {
            console.log('Something went wrong in the authorization callback!', err);
        }
    )


    spotifyApi.getMyTopTracks()
        .then(function (data) {
            let topTracks = data.body.items;
            trackLimit = topTracks.length >= 5 ? 5 : topArtists.length
            return topTracks.slice(0, trackLimit);
        })
        .then(function (result) {
            for (let i = 0; i < result.length; i++) {
                spotifyApi.getArtistRelatedArtists(result[i].album.artists[0].id)
                    .then(function (relatedArtists) {
                        for (let j = 0; j < 2; j++) {
                            artistToSearch = relatedArtists.body.artists[j].id

                            spotifyApi.getArtistTopTracks(artistToSearch, 'US')
                                .then(function (songs) {
                                    for (let k = 0; k < 2; k++) {
                                        songToSearch = songs.body.tracks[k].id
                                        spotifyApi.getAudioFeaturesForTrack(songToSearch)
                                            .then(function (info) {
                                                var track = {
                                                    originalSongRelation: result[i].name,
                                                    originalArtistRelation: result[i].album.artists[0].name,
                                                    artist: relatedArtists.body.artists[j].name,
                                                    name: songs.body.tracks[k].name,
                                                    valence: info.body.valence,
                                                    danceability: info.body.danceability,
                                                    popularity: info.body.energy
                                                }
                                                if (listOfTracks.length + 1 == trackLimit * 4) {
                                                    res.send("<a href='/display'>Click Here to display some data analysis!</a>");
                                                }
                                                listOfTracks.push(track)
                                            })
                                    }
                                })
                        }
                    })
            }
        })
        .catch(function (error) {
            console.error(error)
        })
})

//Sends data to display page for graph visualization
app.get('/display', (req, res) => {
    res.render('pages/index', { listTracks: listOfTracks });
});

//Port that Mood Ring is running on
app.listen(process.env.PORT, () => console.log(`MoodRing is now listening on port: ${process.env.PORT}`))
