# **IN PROGRESS**

# Music-Merge
**“For our music enthusiasts around the world, our vision is to revolutionize the way people curate and enjoy their playlists and have something of their own that expresses both parties. Our goal is to seamlessly merge their playlists, and have a dynamic and personalized music experience.”**

One big issue with many modern music streaming platforms is the ability to merge two playlists into one. Our application will allow the user to look at their playlist library and select two playlists that they would like to combine. This feature will become even more powerful when it’s used collaboratively: our site gives users the ability to merge their own playlists with their friends' playlists. This emphasis on making music new and shareable again is at the core of our application. 

Our strategy for increasing novelty is to allow the user the choice for how to generate the merged playlists. Whether they choose to import only a couple songs from each playlist or they can choose to “enhance” their playlists. Through the various music APIs our app will be able to preserve and build on the asethetics of the playlists provided.

# Features
- Merge two distinct Playlists into one 
- Get recommendations from two users and combine songs into a playlist
- Allow user to remove some songs from a merge playlist
<!-- 
- Add songs to merged playlists (recommendations?)
- Possible provide cross-platform playlist transfers
- (Optional) Dynamic updates merged to reflect changes in either distinct playlist 
- search for other users 
-->
- Login, logout, 
- Simple user-profile interface for managing Linked Account(s?) and merge playlist


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
- (Web Deployment Service)
- PostgreSQL
- NodeJS

# How to run Tests

First, clone the repository. Then, add a .env file with the following content:
```
# database credentials
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="pwd"
POSTGRES_DB="users"

# Node vars
SESSION_SECRET="super duper secret!"
API_KEY="hcaj7Z7rmERbfgzQrHCy3IPaXvElhVGs"
```

# Link to Application

# Prerequisites
- npm
- docker-compose

# Installation Instructions
1. Download the latest release
2. Navigate to the home directory of the repository
2. Install npm dependencies with `npm install`
3. Open up the terminal and navigate to the `ProjectSourceCode` folder
4. Run `docker-compose up -d` in your terminal
5. Visit `http:\\localhost:3000`
6. Enjoy!
