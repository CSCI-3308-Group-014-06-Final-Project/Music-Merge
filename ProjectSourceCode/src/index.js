// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcrypt'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

const hbs = handlebars.create({
	extname: 'hbs',
	layoutsDir: __dirname + '/views/layouts',
	partialsDir: __dirname + '/views/partials',
  });

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************
const dbConfig = {
	host: 'db',
	port: 5432,
	database: process.env.POSTGRES_DB,
	user: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD,
  };
  const db = pgp(dbConfig);
  
  // db test
  db.connect()
	.then(obj => {
	  // Can check the server version here (pg-promise v10.1.0+):
	  console.log('Database connection successful');
	  obj.done(); // success, release the connection;
	})
	.catch(error => {
	  console.log('ERROR', error.message || error);
	});
// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

app.use(
	session({
	  secret: process.env.SESSION_SECRET,
	  saveUninitialized: false,
	  resave: false,
	})
  );
// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************
const user = {
	password: undefined,
	username: undefined
};


const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};

app.get('/', (req, res) => {
	res.render('pages/home')
});

app.get('/login', (req, res) => { //Login attempt
	res.render('pages/login');
});

app.post('/login', (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
	const query = 'select * from users where users.username = $1 LIMIT 1'; //Not sure about this
	const values = [username];
	console.log(req);

	db.one(query, values)
		.then(data => {
			//Update session data with users info (not in db yet)
			res.redirect('/'); //Redirect home with updated session
		})
		.catch(err => {
			console.log(err);
			res.redirect('/login');
		});
});

app.get('/register', (req, res) => {
	res.render('pages/register');
});


//logout page
app.get('/logout', auth, (req, res) => {
    // Destroy the session and logout the user
    req.session.destroy(err => {
      if(err) {
        console.error('Error destroying session:', err);
      }
      // Render the logout page with a success message
      res.render('pages/logout', { message: 'Logged out Successfully' });
    });
  });

// Make sure to apply the auth middleware to the /discover route
app.get('/discover', (req, res) => {
	axios({
	  url: `https://app.ticketmaster.com/discovery/v2/events.json`,
	  method: 'GET',
	  dataType: 'json',
	  headers: {
		'Accept-Encoding': 'application/json',
	  },
	  params: {
		apikey: process.env.API_KEY,
		keyword: 'noah', // You can choose any artist/event here.
		size: 10
	  },
	})
	.then(results => {
	  console.log(results.data);
	  res.render('pages/discover', {events: results.data._embedded.events});
	})
	.catch(error => {
	  res.render('pages/discover', {message: error});
	  // Handle error (e.g., render an error page).
	});
  });
  
app.get('/welcome', (req, res) => {
	res.json({status: 'success', message: 'Welcome!'});
  });

/*
//SPOTIFY EXAMPLE

// Authorization token that must have been created previously. See : https://developer.spotify.com/documentation/web-api/concepts/authorization
const token = 'BQAglxA4MOHg0EkibANrmiz3U0lrx0UmnJtgHHM-i_XkdaW4xOnv2R1zsCy3-Jyi32ijbJjg-4dQawjAIBZSrnEY9MgAXCS8epAQh273rR7Cw9iX7k0aoR1kZmboN7_i-tXhj7UCiDII_tAGjYA76C5hoP64zEJNmBT9nrTr7oW7P0ruv26i1NHFvh3EmuZOtAnuk5tZWzyj1kdBm72CGYgexfVmIRBxE9KZj9jD0GFmrfnczyHHZy8QmdHnHDCvY7t_';
async function fetchWebApi(endpoint, method, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method,
    body:JSON.stringify(body)
  });
  return await res.json();
}

async function getTopTracks(){
  // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
  return (await fetchWebApi(
    'v1/me/top/tracks?time_range=long_term&limit=5', 'GET'
  )).items;
}

const topTracks = await getTopTracks();
console.log(
  topTracks?.map(
    ({name, artists}) =>
      `${name} by ${artists.map(artist => artist.name).join(', ')}`
  )
);

//SPOTIFY EXAMPLE
*/

app.get('/test', async (req, res) => {
	const response =
		await axios({
			url: ,
			method: ,
			dataType: ,
			headers: {},
			params: {
				apikey: process.env.API_KEY,
			},
		})
		  .then(results => {
		})
		  .catch(error => {
			  results: [];
			  res.render('pages/test', {message: "No playlists"});
		});
});


// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');
