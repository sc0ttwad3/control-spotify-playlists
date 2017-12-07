var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  console.log('Inside the homepage router function');
  console.log(req.sessionID);
  res.render('index', { title: 'control-spotify-playlists', session: req.sessionID });
});

module.exports = router;
