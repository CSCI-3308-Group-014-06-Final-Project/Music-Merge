# Music-Merge
**“For our music enthusiasts around the world, our vision is to revolutionize the way people curate and enjoy their playlists and have something of their own that expresses both parties. Our goal is to seamlessly merge their playlists, and have a dynamic and personalized music experience.”**

One big issue with many modern music streaming platforms is the ability to merge two playlists into one. Our application will allow the user to look at their playlist library and select two playlists that they would like to combine. This feature will become even more powerful when it’s used collaboratively: our site gives users the ability to merge their own playlists with their friends' playlists. This emphasis on making music new and shareable again is at the core of our application. 

Our strategy for increasing novelty is to allow the user the choice for how to generate the merged playlists. Whether they choose to import only a couple songs from each playlist or they can choose to “enhance” their playlists. Through the various music APIs our app will be able to preserve and build on the asethetics of the playlists provided.

# Features
- Merge two distinct Playlists into one 
<!-- 
- Allow user to remove some songs from a merge playlist
- Get recommendations from two users and combine songs into a playlist
- Add songs to merged playlists (recommendations?)
- Possible provide cross-platform playlist transfers
- (Optional) Dynamic updates merged to reflect changes in either distinct playlist 
- search for other users 
-->
- Login and Logout sessions
- View all previously made merged playlists
- Simple user-profile displaying Spotify profile stats (follows, username, pfp)
- Display all playlists liked by the user


# Contributors
| Name             | Email                 | Github Username |
| ---------------- | --------------------- | --------------- |
| Kelly McVeigh    | kemc7914@colorado.edu | KellyMcVeigh    |
| Noah Schwartz    | nosc1301@colorado.edu | NoahBSchwartz   |
| Eli Jones        | eljo7407@colorado.edu | elfjones        |
| Aayush Shrestha  | aash8639@colorado.edu | aaaayush21      |
| Daniel Alemayehu | daal6363@coloraod.edu | DTAlemayehu01   |
| Toby Moore       | tomo7434@colorado.edu | T0blerone       |

# Technology Used
- Spotify API
- HandleBars
- Docker
- Azure
- PostgreSQL
- NodeJS

# How to run Application

Firstly, create a Spotify Web API app to obtain a

Add a .env file with the following content:
```
# database credentials
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="pwd"
POSTGRES_DB="users"

# Node vars
SESSION_SECRET="your-clientId-secret"
API_KEY="your-cliendId-key"
REDIRECT_URI="http://localhost:3000/login"
```
# How to run Tests
Change the last line of docker-compose.yaml to `npm run testandrun`

# Link to Application
We have also deployed our application to the azure cloud! However, our web app is currently in developer mode (deployment mode in the spotify web app takes several weeks to be approved for) so testing of the deployed link is by invite only.

```
http://daal-csci-project.eastus.cloudapp.azure.com:3000/register
```

# Prerequisites
- npm
- docker-compose
- Spotify Web API app

# Installation Instructions
1. Download the latest release
2. Navigate to the home directory of the repository
2. Install npm dependencies with `npm install`
3. Run `docker-compose up -d` in your terminal
4. Visit `http://localhost:3000/register`
5. Enjoy!
