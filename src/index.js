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
const url = require('url');
const crypto = require('crypto');
let loggedIn = false;

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


const clientId = process.env.API_KEY;

//Register - need to fix to connect and work on hash
app.post('/register', async (req, res) => {
	const result = await redirectToAuthCodeFlow(clientId);
	res.redirect(result); // Use the result for redirection or response
	// need to fix hashing, gotta put async in the app line when we do
	//hash the password using bcrypt library
	//const hash = await bcrypt.hash(req.body.password, 10);
	// To-DO: Insert username and hashed password into the 'users' table

	// db.any(query, [req.body.username, hash])
	if (req.body.spotifyUsername == "") {
		throw new Error('Cannot be empty! Please input a spotifyUsername');
	}

	const query = "INSERT INTO users (spotifyUsername) VALUES ($1) RETURNING*;"
	db.any(query, [req.body.spotifyUsername])
		.then(function (data) {
			//console.log(data)
			req.session.profile = data[0];
			req.session.loggedIn = true;
			// do we want a successful registration to redirect to the login page?
			//res.redirect("/login")
		})

		.catch(function (error) {
			//res.redirect("/register")
		})

});

// async function handleAuthFlow() {
// 	if (!req.session.code) {
// 		return await redirectToAuthCodeFlow(clientId);
// 	} else {
// 		const accessToken = await getAccessToken(clientId, code);
// 		return await fetchProfile(accessToken);
// 	}
// }

const storage = {};

async function redirectToAuthCodeFlow(clientId) {
	const verifier = generateCodeVerifier(128);
	const challenge = await generateCodeChallenge(verifier);
	storage.verifier = verifier;

	const params = new URLSearchParams();
	params.append("client_id", clientId);
	params.append("response_type", "code");
	params.append("redirect_uri", process.env.REDIRECT_URI);
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
	params.append("redirect_uri", process.env.REDIRECT_URI);
	params.append("code_verifier", verifier);

	const result = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: params
	});
	//console.log(params)

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
	playlist_name: "default",
	playlist_public: false,
	playlist_collaborative: false,
	playlist_description: "default",
};

const user = {
	password: undefined,
	username: undefined,
	profile: undefined
};


const auth = (req, res, next) => {
	if (!req.session.loggedIn) {
		// Default to login page.
		return res.redirect('/login');
	}
	next();
};

app.get('/', (req, res) => {
	if(loggedIn){
		axios({
			url: `https://api.spotify.com/v1/users/${req.session.profile.id}`,
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${req.session.accessToken}`, // Your Spotify Access Token
				'Content-Type': 'application/json'
			}
		})
			.then(response => {
				res.render('pages/home', {
					user: response.data // Pass the entire user object to the view
				});
			})
			.catch(error => {
				console.error('Error fetching user data:', error);
				res.status(500).send('Failed to retrieve user data');
			});
	}
	else {
		res.redirect("/login");
	}

});

app.get('/register', (req, res) => {
	res.render('pages/register');
});

app.get('/login', async (req, res) => { //Login attempt
	const code = req.query.code; // This captures the code from the URL
	req.session.accessToken = await getAccessToken(clientId, code);
	req.session.profile = await fetchProfile(req.session.accessToken);
	res.render('pages/login');
});

app.post('/login', (req, res) => {
	const spotifyUsername = req.body.spotifyUsername;
	// const password = req.body.password;
	const query = 'select * from users where users.spotifyUsername = $1'; //Not sure about this
	const values = [spotifyUsername];
	//console.log(req);


	db.one(query, values)
		.then(data => {
			//Update session data with users info (not in db yet)
			loggedIn = true;
			res.redirect('/'); //Redirect home with updated session
		})
		.catch(err => {
			//console.log(err);
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
		loggedIn = false;
		res.render('pages/logout', { message: 'Logged out Successfully' });
	});
});

//Settings Page
app.get('/settings', (req, res) => {
    if(loggedIn)
	{
	initialvalue1 = settings.playlist_name;
	initialvalue2 = settings.playlist_public;
	initialvalue3 = settings.playlist_collaborative
	initialvalue4 = settings.playlist_description;
	res.render('pages/settings', {initialvalue1, initialvalue2, initialvalue3, initialvalue4});
	}
	else {
		res.render('pages/login');
	}
})

app.post('/settings', (req, res) => {
	settings.playlist_name = req.body.playlist_name;
	settings.playlist_public = req.body.playlist_public;
	settings.playlist_collaborative = req.body.playlist_collaborative;
	settings.playlist_description = req.body.playlist_description;

	res.redirect("/");
})
// Make sure to apply the auth middleware to the /discover route
app.get('/discover', async (req, res) => {
	let playlistItems = [];
	let letsLoop = true;
	let offsetN = 0;
	while(letsLoop) {
		//console.log("BANANA ANANA BANANANA BANANANA PI");
		const response = 
			await axios({
				url: `https://api.spotify.com/v1/users/${req.session.profile.id}/playlists`,
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${req.session.accessToken}`, // Make sure you have your access token
					'Content-Type': 'application/json'
				},
				params: {
					offset: offsetN
				}
			}).catch(error => {
				console.error('Error fetching playlists:', error);
				res.status(500).send('Failed to retrieve playlists');
		    });

		//let playlistPage = response.data;
		if(response.data.items.length == 0) {
			letsLoop = false;
		} 

		let playlistPage = response.data.items;
		for (item of playlistPage) {
			if (item.uri === null) {
				break;
			}
			console.log(item.name);
			playlistItems.push(item);
		}
		offsetN = offsetN + 100;
	}
	if (loggedIn) {
		res.render('pages/discover', { playlists: playlistItems, settings: settings.option2 }); // Assuming you have a view file to display playlists
	}
	else {
		res.render('pages/login');
	}

});

app.get('/welcome', (req, res) => {
	res.json({ status: 'success', message: 'Welcome!' });
});


//create playlist and add in tracks
//in progress
app.post('/merge', async (req, res) => {

	const user = await fetchProfile(req.session.accessToken);
	const accessString = `Bearer ${req.session.accessToken}`;

	//playlist params, if possible to no be hard coded later on
	const playlistName = settings.playlist_name; //req.query.name;
	const playlistIsPublic = settings.playlist_public; //req.query.public;
	const IsCollaborative = settings.playlist_collaborative; //req.query.collaborative;
	const playlistDescription = settings.playlist_description; //req.query.description;

	//handling for two recived playlist URIs
	//basic uri grab
	const playlistIDs = [];
	for await (const uri of req.body.selectedPlaylistURIs) {
		if (uri.substring(0, 17) == `spotify:playlist:`) {
			playlistIDs.push(uri.slice(17));
		}
	}

	const response =
		await axios({
			url: `https://api.spotify.com/v1/users/${user.id}/playlists`,
			method: `POST`,
			dataType: `json`,
			headers: {
				Authorization: accessString
			},
			data: {
				name: playlistName,
				/*
				public: playlistIsPublic,
				collaborative: IsCollaborative,
				description: playlistDescription
				*/
			},

		})

	const newPlaylist = response.data;

	let trackURIs = [];

	for (const ID of playlistIDs) {
		let offset = 0;
		do {
			const responseA =
				await axios({
					url: `https://api.spotify.com/v1/playlists/${ID}/tracks`,
					method: `GET`,
					dataType: `json`,
					headers: {
						Authorization: accessString
					},
					params: {
						offset: offset
					}
				});
			if (responseA.data.items.length == 0) {
				break;
			}
			let playlistItemArray = responseA.data.items;
			for (item of playlistItemArray) {
				if (item.track === null) {
					break;
				}
				trackURIs.push(item.track.uri);
			}
			offset = offset + 100;
		} while (true)
	}
	while (trackURIs.length > 0) {
		if (trackURIs.length <= 100) {
			const responseB =
				await axios({
					url: `https://api.spotify.com/v1/playlists/${newPlaylist.id}/tracks`,
					method: `POST`,
					dataType: `json`,
					headers: {
						Authorization: accessString
					},
					data: {
						"uris": trackURIs,
					}
				});
			trackURIs = [];
		} else {
			const temp = trackURIs.slice(100);
			const postURIs = trackURIs.splice(0, 100);
			const responseB =
				await axios({
					url: `https://api.spotify.com/v1/playlists/${newPlaylist.id}/tracks`,
					method: `POST`,
					dataType: `json`,
					headers: {
						Authorization: accessString
					},
					data: {
						"uris": postURIs,
					}
				});
			trackURIs = temp;
		}
	}

	/*
	const query = `INSERT INTO playlists (playlistID, spotifyUsername, playlistName) VALUES ($1, $2, $3) returning * ;`;
	db.one(query, [newPlaylist.id, user.id, newPlaylist.name]);
	*/
});

async function addTrack(trackURI, playlistID, accessStr) {
	const response =
		await axios({
			url: `https://api.spotify.com/v1/playlists/${playlistID}/tracks`,
			method: `POST`,
			dataType: `json`,
			headers: {
				Authorization: accessStr
			},
			params: {
				uris: trackURI,
			},
		}).catch(error => { });

}

async function getTrackInfo(access_token) {
	const response = await fetch("https://api.spotify.com/v1/search?q=remaster%2520track%3ADoxy%2520artist%3AMiles%2520Davis&type=album", {
		method: 'GET',
		headers: { 'Authorization': 'Bearer ' + access_token },
	});

	return await response.json();
}

//test search with no user context
app.get('/search', async (req, res) => {
	const Token = await getToken().then(response => {
		profile = req.session.profile;
		getTrackInfo(response.access_token).then(profile => {
			console.log(req.session.profile);
		})
	});
});


app.get('/playlists', (req, res) => {
    axios({
        url: `https://api.spotify.com/v1/users/${req.session.profile.id}/playlists`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${req.session.accessToken}`, // Make sure you have your access token
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            // console.log(response.data);
            if(loggedIn)
            {
                const query = "SELECT uri FROM playlists WHERE playlists.spotifyUsername = $1;"
                db.any(query, [req.body.spotifyUsername])
					.then(async function (rows) {
						// Handle the response here
						const playlistsFromURI = []
						for(const playlistURI in data)
						{
							const playlist = await axios({
								url: `https://api.spotify.com/v1/playlists/${playlistURI}`,
								method: `GET`,
								headers: {
								Authorization: accessString
								}
							});
							playlistsFromURI.push(playlistURI.data);
						};
						res.render('pages/discover', { playlists: playlistsFromURI, settings: settings.option2 });
						console.log("Query executed successfully. Response:", rows);
					})
					.catch(function (error) {
						// Handle any errors that occur during the query execution
						console.error("Error executing query:", error);
					});

            }
            else{
                res.render('pages/login');
            }
            
        })
        .catch(error => {
            console.error('Error fetching playlists:', error);
            res.status(500).send('Failed to retrieve playlists');
        });
});

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');
