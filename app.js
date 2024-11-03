require('dotenv').config();
const express = require('express');
const querystring = require('querystring');
const axios = require('axios');
const crypto = require('crypto');
const app = express();
const cors = require('cors')

app.use(cors())
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

// Utility function to generate random state string
function generateRandomString(length) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

app.get('/login', (req, res) => {
  const state = generateRandomString(16);
  const scope = 'user-read-private user-read-email';

  // Redirect the user to Spotify's authorization page
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

// Callback route to handle the redirection from Spotify
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;

  if (!code || !state) {
    return res.status(400).send('Missing code or state');
  }

  try {
    // Exchange authorization code for access and refresh tokens
    const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', querystring.stringify({
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    }), {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = tokenResponse.data.access_token;
    const refreshToken = tokenResponse.data.refresh_token;
    const expires_in = tokenResponse.data.expires_in
    // console.log(tokenResponse)

    // Use the access token to retrieve the user’s profile
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
        res.send(`
          <script>
              window.opener.postMessage({ accessToken: "${accessToken}", refreshToken: "${refreshToken}" , expires_in :"${expires_in}", me: ${JSON.stringify(userResponse.data)} },"*");
              window.close();
          </script>
      `);

    // res.send({
    //   message: 'Spotify Authorization Successful!',
    //   user: userResponse.data,
    //   access_token: accessToken,
    //   refresh_token: refreshToken,
    //   expires_in : expires_in
    // });
  } catch (error) {
    res.status(500).send('Error during Spotify Authorization');
    console.error(error);
  }
});

 // playList
app.get('/playlist',(req,res)=>{
// Make a GET request to fetch user's playlists
axios.get('https://api.spotify.com/v1/me/playlists', {
  headers: {
    'Authorization': `Bearer ${accessToken2}`
  }
})
.then(response => {
  console.log('User Playlists:', response.data);
})
.catch(error => {
  console.error('Error fetching playlists:', error.response ? error.response.data : error.message);
});
res.end()
})

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
