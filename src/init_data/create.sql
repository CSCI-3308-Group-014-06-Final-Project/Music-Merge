CREATE TABLE IF NOT EXISTS playlists (
	id INT PRIMARY KEY NOT NULL,
	spotifyUsername VARCHAR(50)
	---> will probably need to link to the playlist using spotify api. not sure what that will look like.
);
