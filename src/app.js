const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const querystring = require('querystring')
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const sassMiddleware = require('node-sass-middleware');
const session = require('express-session');
const uuid = require('uuid/v4');
const moment = require('moment');

const FileStore = require('session-file-store')(session);

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
const generateRandomString = (length) => {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

/**
* Obtains parameters from the hash of the URL
* @return Object
*/
const getHashParams = () => {
 var hashParams = {};
 var e, r = /([^&;=]+)=?([^&;]*)/g,
     q = window.location.hash.substring(1);
 while ( e = r.exec(q)) {
    hashParams[e[1]] = decodeURIComponent(e[2]);
 }
 return hashParams;
}


let stateKey = 'spotify_auth_state';

/***
 *  Config new Express app instance.
 *  with Handlebars as template engine
 */
const app = express();
const hbs = exphbs.create({
    defaultLayout: 'main',
    // these two may be the defaults
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
  });
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));
app.enable('view cache'); // only when process.env.NODE_ENV === "production"

// middleware
app.use(favicon(path.join(__dirname, '../public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// no longer needed for express-session to work
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, '../public'),
  dest: path.join(__dirname, '../public'),
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, '../public')));

app.use(session({
  genid: (req) => {
    console.log('Inside the session middleware')
    console.log(req.sessionID)
    return uuid() // use UUIDs for session IDs
  },
  store: new FileStore(),
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))


const client_id = "28f0498c01864754896a7a9d3dc8fdf0";
const client_secret = "0b68f1b0bf2c47cba8cdde4995c08ba2";
const redirect_uri = "http://localhost:3000/";

const index = require('./routes/index');
app.use('/', index);

// const login = require('./routes/login');
// app.use('/login', login);
app.get('/login', (req, res) => {
  console.log('Inside /login route handler');

  let state = generateRandomString(16);
  res.cookie(stateKey, state);
  console.log('login set cookie stateKey');
  console.log('Now redirecting to spotify Web API for authorization...');
  // your application requests authorization
  const scope = 'playlist-modify-private playlist-modify-public';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

// const callback = require('./routes/callback');
// app.use('/callback', callback);
app.get('/callback', (req, res) => {
  console.log('Inside /callback route handler');

  // your application requests refresh and access tokens
  // after checking the state parameter

  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
    }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
     orm: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secrettoString('base64')))
      },
      json: true
    };

      request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
          let access_token = body.access_token,
              refresh_token = body.refresh_token;
          let options = {
            url: 'https://api.spotify.com/v1/me',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
          };

          // use the access token to access the Spotify Web API
          request.get(options, function(error, response, body) {
            console.log(body);
          });

          // we can also pass the token to the browser to make requests from there
          res.redirect('/#' +
            querystring.stringify({
              access_token: access_token,
              refresh_token: refresh_token
            }));
        } else {
          res.redirect('/#' +
            querystring.stringify({
              error: 'invalid_token'
            }));
        }
      });
    }
  });

app.get('/refresh_token', (req, res) => {
  console.log('Inside /refresh_token route handler');
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

// setup eventual route for listing users? (Not Used Currently)
const users = require('./routes/users');
app.use('/users', users);

// catch 404 and forward to error handler
app.use((err, req, res, next) => {
  console.log('PAGE NOT FOUND: hit the 404 handler!');
  // const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  console.log(err);
  res.render('error', {error: err, message: "An error has occured"});
});

module.exports = app;
