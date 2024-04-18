// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const qs = require('qs');
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

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		saveUninitialized: true,
		resave: true,
	})
);
app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);
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
// <!-- Section 3 : Connect to Spotify API -->
// *****************************************************


//const clientId = process.env.API_KEY;
const clientId = "603b2cf1577c4343a3e7a378ace0be6c";

app.post('/register', async (req, res) => { // Mark this function as async
	const result = await handleAuthFlow(); // Await the promise from handleAuthFlow
	res.redirect(result); // Use the result for redirection or response
});

//Register - need to fix to connect and work on hash
// app.post('/register', async(req, res) => {
// 	// const result = await handleAuthFlow(); // Await the promise from handleAuthFlow
// 	// res.redirect(result); // Use the result for redirection or response
// 	// const accessToken = await getAccessToken(clientId, code);
// 	// const profile = await fetchProfile(accessToken);
// 	// console.log(profile);
// 	// need to fix hashing, gotta put async in the app line when we do
// 	//hash the password using bcrypt library
// 	//const hash = await bcrypt.hash(req.body.password, 10);
// 	// To-DO: Insert username and hashed password into the 'users' table

// 	// db.any(query, [req.body.username, hash])
// 	if(req.body.username == "" || req.body.password == ""){
// 		throw new Error('Cannot be empty! Please input a username and password.');
// 	}

// 	const query = "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING*;"
// 	db.any(query, [req.body.username, req.body.password])
// 	.then(function(data){
// 	  console.log(data)
// 	  // do we want a successful registration to redirect to the login page?
// 	  res.redirect("/login")
// 	})

// 	// need to change so that an error redirects to the login page, since thats how we wrote the test
// 	.catch(function(error){
// 	  res.redirect("/register")
// 	})

//   });

//const clientId = "603b2cf1577c4343a3e7a378ace0be6c";

const url = require('url');
let globalUrl;
const crypto = require('crypto');
let profile;
let accessToken;
const params = new URLSearchParams(globalUrl);
console.log("global" + globalUrl)
const code = params.get("code");
async function handleAuthFlow() {
	if (!code) {
		return await redirectToAuthCodeFlow(clientId);
	} else {
		const accessToken = await getAccessToken(clientId, code);
		return await fetchProfile(accessToken);
	}
}

const storage = {};

async function redirectToAuthCodeFlow(clientId) {
	const verifier = generateCodeVerifier(128);
	const challenge = await generateCodeChallenge(verifier);
	storage.verifier = verifier;

	const params = new URLSearchParams();
	params.append("client_id", clientId);
	params.append("response_type", "code");
	params.append("redirect_uri", "http://localhost:3000/login");
	params.append("scope", "user-read-private user-read-email playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private");
	params.append("code_challenge_method", "S256");
	params.append("code_challenge", challenge);

	const redirectUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
	return await redirectUrl;
}

function generateCodeVerifier(length) {
	let text = '';
	let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

async function generateCodeChallenge(codeVerifier) {
	const data = Buffer.from(codeVerifier);
	const digest = await crypto.subtle.digest('SHA-256', data);
	return Buffer.from(digest)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

async function getAccessToken(clientId, code) {
	const verifier = storage.verifier;

	const params = new URLSearchParams();
	params.append("client_id", clientId);
	params.append("grant_type", "authorization_code");
	params.append("code", code);
	params.append("redirect_uri", "http://localhost:3000/login");
	params.append("code_verifier", verifier);

	const result = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: params
	});
	console.log(params)

	const { access_token } = await result.json();
	return access_token;
}

async function fetchProfile(token) {
	const result = await fetch("https://api.spotify.com/v1/me", {
		method: "GET", headers: { Authorization: `Bearer ${token}` }
	});
	return await result.json();
}

//client authentication for small route tests, to remove later
async function getToken() {
	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		body: new URLSearchParams({
			'grant_type': 'client_credentials',
		}),
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Basic ' + (Buffer.from(process.env.API_KEY + ':' + process.env.SESSION_SECRET).toString('base64')),
		},
	});

	return await response.json();
}

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************
const settings = {
	option1: undefined,
	option2: undefined,
	option3: undefined,
	option4: undefined,
};

const user = {
	password: undefined,
	username: undefined,
	profile: undefined
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

app.get('/register', (req, res) => {
	res.render('pages/register');
});

// app.post('/register', async (req, res) => { // Mark this function as async
// 	const result = await handleAuthFlow(); // Await the promise from handleAuthFlow
// 	res.redirect(result); // Use the result for redirection or response
// 	const accessToken = await getAccessToken(clientId, code);
// 	const profile = await fetchProfile(accessToken);
// 	console.log(profile);
// });

app.get('/login', async(req, res) => { //Login attempt
	const code = req.query.code; // This captures the code from the URL
	accessToken = await getAccessToken(clientId, code);
	profile = await fetchProfile(accessToken);
	res.render('pages/login');
});

app.post('/login', (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
	const query = 'select * from users where users.username = $1 AND users.password = $2 LIMIT 1'; //Not sure about this
	const values = [username, password];
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

//logout page
app.get('/logout', auth, (req, res) => {
	// Destroy the session and logout the user
	req.session.destroy(err => {
		if (err) {
			console.error('Error destroying session:', err);
		}
		// Render the logout page with a success message
		res.render('pages/logout', { message: 'Logged out Successfully' });
	});
});

//Settings Page
app.get('/settings', (req, res) => {
	res.render('pages/settings');
})

app.post('/settings', (req, res) => {
	settings.option1 = req.body.option1;
	settings.option2 = req.body.option2;
	settings.option3 = req.body.option3;
	settings.option4 = req.body.option4;
})
// Make sure to apply the auth middleware to the /discover route
app.get('/discover', (req, res) => {
    axios({
        url: `https://api.spotify.com/v1/users/${profile.id}/playlists`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`, // Make sure you have your access token
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
       // console.log(response.data);
        res.render('pages/discover', { playlists: response.data.items }); // Assuming you have a view file to display playlists
    })
    .catch(error => {
        console.error('Error fetching playlists:', error);
        res.status(500).send('Failed to retrieve playlists');
    });
});

app.get('/welcome', (req, res) => {
	res.json({ status: 'success', message: 'Welcome!' });
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
*/

// fetch self playlists, route names not final
// in progress (need to figure out of to get key to load on new instances
app.get('/test', async (req, res) => {
	//console.log(getAccessToken(clientId,code));
	const response =
		await axios({
			url: `https://api.spotify.com/v1/me/playlists`,
			method: `GET`,
			dataType: `json`,
			headers: {
				//`Accept-Encoding`: `application/json`,
				Authorization: `bearer ${getAccessToken(clientId, req.query.code)}`
			},
			params: {
				limit: 20,
				offset: 0,
			},
		})
			.then(results => {
				console.log(results);
				return results.items;
			}).catch(error => {
				results: [];
				res.render('pages/test', { message: "Error loading Laufey events please try again" });
			});
});

//create playlist and add in tracks
//in progress
app.post('/merge', async (req, res) => {

	const user = await fetchProfile(accessToken).id;
	const accessString = `Bearer ${accessToken}`;

	//playlist params, if possible to no be hard coded later on
	const playlistName = "The Playlist!" //req.query.name;
	const playlistIsPublic = false; //req.query.public;
	const IsCollaborative = false; //req.query.collaborative;
	const playlistDescription = "Your Newly Merged Playlist!" //req.query.description;

	let playlistIDs = [];
	//handling for two recived playlist URIs
	//basic uri grab
	req.body.selectedPlaylistURIs.forEach(uri => {
		if(uri.substring(0,17) == `spotify:playlist:`){
			playlistIDs.push(uri.slice(17));
		}
	});
	
	const newPlaylist =
		await axios({
			url: `https://api.spotify.com/v1/users/${user}/playlists`,
			method: `POST`,
			dataType: `json`,
			headers: {
				Authorization: accessString
			},
			params: {
				name: playlistName,
				public: playlistIsPublic,
				collaborative: IsCollaborative,
				description: playlistDescription
			},
		/*}).then(async results => {
			//const playlistId = results.id;
			//const songsToAdd = getSongsToAdd(); //empty function write later, note max of 100, returns array of spotify uri's for tracks
			const response =
				await axios({
					url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
					method: `POST`,
					dataType: `json`,
					headers: {
						Authorization: accessString
					},
					params: {
						position: 0,
						uris: songsToAdd,
					},
				}).then(results => {
					console.log("success!");
				}).catch(error => {
					results: [];
					res.render('pages/test', { message: "Error loading Laufey events please try again" });
				});
				*/
		}).catch(error => {
			results: [];
			res.render('pages/test', { message: "Error loading Laufey events please try again" });
		});

		playlistID.forEach({ID => 
			let playlist = 
				await axios({
					url: `https://api.spotify.com/v1/playlists/${ID}`,
					method: `GET`,
					dataType: `json`,
					headers: {
						Authorization: accessString
					},
				}).catch(error => {
					results: [];
					res.render('pages/test', { message: "Error loading Laufey events please try again" });
				});
			playlist.tracks.items.forEach({item => 
				await axios({
					url: `https://api.spotify.com/v1/playlists/${ID}/tracks`,
					method: `POST`,
					dataType: `json`,
					headers: {
						Authorization: accessString
					},
					params: {
						uris: item.track.trackObject.preview_uri,
					},
				}).catch(error => {
					results: [];
					res.render('pages/test', { message: "Error loading Laufey events please try again" });
				});
			});
		});
});

/*
async function quickAuth() {
	const response = 
		await axios.post(
			'https://accounts.spotify.com/api/token',
			new URLSearchParams({
			  'grant_type': 'client_credentials',
			  'client_id': process.env.API_KEY,
			  'client_secret': process.env.SESSION_SECRET
			})
		).catch(error => {
			console.log("uh-oh");
		});

	return response.access_token;
};
*/

async function getTrackInfo(access_token) {
	const response = await fetch("https://api.spotify.com/v1/search?q=remaster%2520track%3ADoxy%2520artist%3AMiles%2520Davis&type=album", {
		method: 'GET',
		headers: { 'Authorization': 'Bearer ' + access_token },
	});

	return await response.json();
}

//test search with no user context
app.get('/search', async (req, res) => {
	//const accessString = `bearer ${getToken}`;
	/*
	const response = 
		await axios ({
			url: `https://api.spotify.com/v1/search`,
			method: `GET`,
			dataType: `json`,
			headers: {
				Authorization: accessString
			},
			params: {
				q: 'remaster%20track:Doxy%20artist:Miles%20Davis',
				type: `artist`
			},
		}).then(results => {
			console.log(results);
		}).catch(error => {
			console.log(error);
		});
	*/
	const Token = await getToken().then(response => {
		getTrackInfo(response.access_token).then(profile => {
			console.log(profile);
		})
	});
	/*
	const response = await axios.get('https://api.spotify.com/v1/search/', {
	  params: {
		'q': 'remaster%20track:Doxy%20artist:Miles%20Davis',
		'type': 'album'
	  },
	  headers: {
		'Authorization': `Bearer ${Token}`
	  }
	}).catch(error => {
		res.render('pages/test', {message: "uh-oh"});
		console.log(error);
	});
	console.log(response);
	*/
});

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');
