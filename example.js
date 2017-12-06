

const spotifyWebApi = require('spotify-web-api-node')
// Need to use env values for the credentials!

const spot = new spotifyWebApi({
  clientId: '',
  clientSecret: '',
  redirectUri: ''
});

// enter access token
spot.setAccessToken('')

// Get ELVIS albums?
//
// optional
// options with JSON object
spot.getArtistAlbums('43ZHCT0cAZBISjO8DG9PnE', { limit: 10, offset: 20 })
  .then((data) => {
    console.log('Artist albums', data.body);
  }, (err) => {
    console.error(err);
  });

// Get a user's playlists
spot.getUserPlaylists('sc0ttwad3')
  .then((data) => {
    console.log('Retrieved playlists', data.body);
  }, (err) => {
    console.log('Something went wrong!', err);
  });