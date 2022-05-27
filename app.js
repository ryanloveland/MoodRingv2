//Requirements
const express = require("express");
const dotenv = require("dotenv").config()
const request = require('request');
const url = require('url');
var d3 = require("d3");
const User = require("./calculations/user")
const path = require("path")

var bodyParser = require("body-parser");




//App functionals
const app = express();

//Spotify redirects and API wrapper
// const redirect_uri = 'https://spotifymoodring.herokuapp.com/callback';
const redirect_uri = 'http://localhost:3000/callback'

var SpotifyWebApi = require("spotify-web-api-node");
const { syncBuiltinESMExports } = require("module");

var spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: redirect_uri
});

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

//Loads home page
app.get('/', (req, res) => {
    res.render('pages/home');
});

//Redirects to Spotify's authorization for a user
//This then redirects to callback
app.get('/login', (req, res, err) => {
    console.log("Beginning login")
    res.redirect('https://accounts.spotify.com/authorize' +
        '?response_type=code' +
        '&client_id=' + process.env.CLIENT_ID +
        '&scope=user-top-read playlist-modify' +
        '&redirect_uri=' + encodeURIComponent(redirect_uri));
});


//Currently sets authorization code and evaluates data in one way
app.get('/callback', async (req, res) => {
    // Sets up authorization for future calls to the API
    await spotifyApi.authorizationCodeGrant(req.query.code).then(
        function (data) {
            // Set the access token on the API object to use it in later calls
            spotifyApi.setAccessToken(data.body['access_token']);

            spotifyApi.setRefreshToken(data.body['refresh_token']);
            console.log("Authorization finished without error")
        },
        function (err) {
            if (err.statusCode === 400 || err.statusCode === 401) {
                console.log(err.statusCode + " : Error with token authorization after shutdown - redirecting to home")
                res.redirect('/')
            } else {
                console.log('Something went wrong in the authorization callback!', err);
            }
        }
    )

    res.redirect('/display')
})

app.get('/logout', (req, res) => {
    res.redirect('https://www.spotify.com/logout/')
})

app.get('/display', (req, res) => {
    res.render('pages/selection.ejs')
})

//Sends data to display page for graph visualization
app.get('/display/relatedToTopSongs', async (req, res) => {
    let numSongs = req.query.numSongRange
    await User.recommend20Songs(spotifyApi, res, numSongs)
});

app.get('/display/dailyNewSongs', async (req, res) => {
    await User.getNewMusic(spotifyApi, res)
})

app.post('/display/songsMissed', async (req, res) => {
    oldMissedTracks = req.body.missedInfo == "" ? "" : JSON.parse(req.body.missedInfo)
    User.getMissedMusic(spotifyApi, res, oldMissedTracks, req.body.findArtist)
})

app.post('/makePlaylist', (req, res) => {
    console.log("Post request sent to make new playlist")
    let mySongs = (req.body.playlistInfo).split(",");
    User.makePlaylist(spotifyApi, mySongs, req.body.playlistName)
    res.redirect('/')
})

//Port that Mood Ring is running on
app.listen(process.env.PORT, () => console.log(`MoodRing is now listening on port: ${process.env.PORT}`))