var SpotifyWebApi = require("spotify-web-api-node")
var spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
});

// module.exports = spotifyApi


// module.exports.authorizeUser = async (myCode) => {
//     await spotifyApi.authorizationCodeGrant(myCode).then(
//         function (data) {
//             // console.log('The token expires in ' + data.body['expires_in']);
//             // console.log('The access token is ' + data.body['access_token']);
//             // console.log('The refresh token is ' + data.body['refresh_token']);

//             // Set the access token on the API object to use it in later calls
//             spotifyApi.setAccessToken(data.body['access_token']);
//             spotifyApi.setRefreshToken(data.body['refresh_token']);
//             console.log("Authorization finished withouth error")
//         },
//         function (err) {
//             if (err.statusCode === 400 || err.statusCode === 401) {
//                 console.log(err.statusCode + " : Error with token authorization after shutdown - redirecting to home")
//                 res.redirect('/')
//             } else {
//                 console.log('Something went wrong in the authorization callback!', err);
//             }
//         }
//     )
// }

module.exports.recommend20Songs = async (mySpotifyApi) => {
    listOfTracks = []
    mySpotifyApi.getMyTopTracks()
        .then(function (data) {
            let topTracks = data.body.items;
            trackLimit = topTracks.length >= 5 ? 5 : topArtists.length
            return topTracks.slice(0, trackLimit);
        })
        .then(function (result) {
            for (let i = 0; i < result.length; i++) {
                mySpotifyApi.getArtistRelatedArtists(result[i].album.artists[0].id)
                    .then(function (relatedArtists) {
                        for (let j = 0; j < 2; j++) {
                            artistToSearch = relatedArtists.body.artists[j].id

                            mySpotifyApi.getArtistTopTracks(artistToSearch, 'US')
                                .then(function (songs) {
                                    songLimit = songs.body.tracks.length >= 2 ? 2 : songs.body.tracks.length
                                    for (let k = 0; k < songLimit; k++) {
                                        songToSearch = songs.body.tracks[k].id
                                        mySpotifyApi.getAudioFeaturesForTrack(songToSearch)
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
                                                if (listOfTracks.length >= (trackLimit * 4) - 1) {
                                                    return listOfTracks
                                                }
                                                console.log(listOfTracks.length)
                                                listOfTracks.push(track)
                                            })
                                    }
                                })
                        }
                    })
            }
        })
        .catch(function (error) {
            console.log("Something went wrong in recommend 20 Tracks!")
            console.error(error)
        })
}
