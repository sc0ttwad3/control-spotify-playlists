var express = require('express');
var router = express.Router();

router.get('/login', (req, res, next) => {
  console.log('Inside the /login router function');

  let state = generateRandomString(16);
  res.cookie(stateKey, state);
  console.log('login set cookie stateKey');
  console.log('Now redirecting to spotify Web API for authorization...');
  // your application requests authorization
  let scope = 'playlist-modify-private playlist-modify-public';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));

    res.render('login', { title: 'login - control-spotify-playlists'});

});

module.exports = router;