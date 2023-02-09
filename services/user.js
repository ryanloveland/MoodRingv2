const res = require("express/lib/response");
var SpotifyWebApi = require("spotify-web-api-node")
var spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
});

module.exports.recommend20Songs = async (mySpotifyApi, myRes, myNumSongs) => {
    listOfTracks = []
    playlistSongs = []
    let errorCount = 0;
    mySpotifyApi.getMyTopTracks()
        .then(function (data) {
            let topTracks = data.body.items;
            trackLimit = topTracks.length >= myNumSongs ? myNumSongs : topTracks.length
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
                                    if (songLimit !== 2) { errorCount += 2 - songs.body.tracks.length }

                                    for (let k = 0; k < songLimit; k++) {
                                        songToSearch = songs.body.tracks[k].id
                                        mySpotifyApi.getAudioFeaturesForTrack(songToSearch)
                                            .then(function (info) {
                                                var track = {
                                                    originalSongId: result[i].id,
                                                    originalSongRelation: result[i].name,
                                                    originalArtistRelation: result[i].album.artists[0].name,
                                                    artist: relatedArtists.body.artists[j].name,
                                                    name: songs.body.tracks[k].name,
                                                    valence: info.body.valence,
                                                    danceability: info.body.danceability,
                                                    popularity: info.body.energy
                                                }
                                                listOfTracks.push(track)
                                                playlistSongs.push("spotify:track:" + songs.body.tracks[k].id)
                                                if (listOfTracks.length >= (trackLimit * 4) - errorCount) {
                                                    console.log(listOfTracks.length + " recommended songs loaded...")
                                                    myRes.render('recommended/recommended.ejs', { listTracks: listOfTracks, playlist: playlistSongs })
                                                    return listOfTracks
                                                }
                                            })
                                    }
                                })
                        }
                    })

            }
        })
        .catch(function (error) {
            console.log("Permissions denied on data display page - redirecting to home!")
            myRes.redirect("/")
        })
}


module.exports.makePlaylist = async (mySpotifyApi, collection, myName) => {
    mySpotifyApi.createPlaylist(myName, { "description": "New songs recommended from the top songs that you listen to! -Mood Ring!", "public": true })
        .then(function (data) {
            console.log("Created playlist : " + myName)
            mySpotifyApi.addTracksToPlaylist(data.body.id, collection)
                .then(function (data) {
                    console.log("    Added tracks to playlist")
                })
                .catch(function (err) {
                    console.log("Couldn't add tracks to playlist")
                })
        })
        .catch(function (err) {
            console.log("Something went wrong when creating your playlist")
        })
}


module.exports.getNewMusic = async (mySpotifyApi, myRes) => {
    mySpotifyApi.getNewReleases({ limit: 20, offset: 0, country: 'US' })
        .then(function (data) {
            myNewSongs = data.body.albums.items
            let dailyTracks = [];
            console.log(myNewSongs)
            for (let i = 0; i < myNewSongs.length; i++) {
                var dailySongInfo = {
                    dailySong: myNewSongs[i].name,
                    dailyArtist: myNewSongs[i].artists[0].name,
                    dailyImage: myNewSongs[i].images[0].url
                }
                dailyTracks.push(dailySongInfo)
            }
            return dailyTracks
        })
        .then(function (data) {
            myRes.render('daily/daily.ejs', { myDailyTracks: data })
        })
        .catch(function (err) {
            console.log("Permissions denied on data display page - redirecting to home!")
            myRes.redirect("/")
        });
}

module.exports.getMissedMusic = async (mySpotifyApi, myRes, oldMissed, findArtist) => {
    mySpotifyApi.searchTracks(`artist: ${findArtist}`)
        .then(function (data) {
            artistTracks = data.body.tracks.items

            releaseDates = artistTracks.map(x => { return x.album.release_date })
            console.log(releaseDates)

            let missedTracks = oldMissed != "" ? oldMissed : []

            const date = new Date();
            const currYear = date.getFullYear();
            const currMonth = ((date.getMonth() + 1 < 10) ? "0" : "") + (date.getMonth() + 1)
            const prevMonth = ((date.getMonth() < 10) ? "0" : "") + (date.getMonth())

            for (let i = 0; i < artistTracks.length; i++) {
                e = artistTracks[i].album.release_date
                ymd = e.split("-")

                if ((ymd[1] === currMonth || ymd[1] === prevMonth) && ymd[0] === currYear.toString(10)) {
                    var missedSongInfo = {
                        missedSongId: artistTracks[i].id,
                        missedSongArtist: artistTracks[i].album.artists[0].name,
                        missedSongName: artistTracks[i].name,
                        missedSongImage: artistTracks[i].album.images[0].url
                    }
                    missedTracks.push(missedSongInfo)
                }
            }
            return missedTracks
        })
        .then(function (data) {
            let playlistInfo = data.map(x => { return "spotify:track:" + x.missedSongId })
            myRes.render('missed/missed', { myMissedTracks: data, playlist: playlistInfo })
        })
        .catch(function (err) {
            console.log("Error in getMissedMusic")
            console.log(err)
            console.log(err.body)
            myRes.redirect("/")
        })
}