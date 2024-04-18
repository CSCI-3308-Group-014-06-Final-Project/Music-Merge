CREATE TABLE IF NOT EXISTS users (
	username VARCHAR(50) PRIMARY KEY,
	password CHAR(60) NOT NULL,
	spotifyUsername VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS playlists (
	id INT PRIMARY KEY NOT NULL,
	username VARCHAR(50), 
	FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
	---> will probably need to link to the playlist using spotify api. not sure what that will look like.
);
