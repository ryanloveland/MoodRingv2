var SpotifyWebApi = require("spotify-web-api-node")
var spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
});

module.exports.recommend20Songs = async (mySpotifyApi, myRes) => {
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
                                                    myRes.render('pages/index', { listTracks: listOfTracks })
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
