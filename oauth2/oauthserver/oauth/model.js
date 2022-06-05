/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * Schema definitions.
 */

mongoose.model('OAuthTokens', new Schema({
  accessToken: { type: String },
  accessTokenExpiresAt: { type: Date },
  refreshToken: { type: String },
  refreshTokenExpiresAt: { type: Date },
  client : { type: Object },  // `client` and `user` are required in multiple places, for example `getAccessToken()`
  user : { type: Object }
}));

  /*clientId: { type: String },
  refreshToken: { type: String },
  refreshTokenExpiresOn: { type: Date },
  ,
  userId: { type: String },*/

mongoose.model('OAuthClients', new Schema({
  clientId: { type: String },
  clientSecret: { type: String },
  grants: {type: Array},
  redirectUris: { type: Array }
}));

var userSchema = new Schema({
  password: { type: String },
  username: { type: String }
});

mongoose.model('OAuthUsers', userSchema)


var oauthCodeSchema = new Schema({
    authorizationCode: {type: String}, // A string that contains the code
    expiresAt: { type: Date }, // A date when the code expires
    redirectUri: {type: String}, // A string of where to redirect to with this code
    client: { type: Object }, // See the client section
    user: { type: Object },
});

oauthCodeSchema.index({client:1, user: 1}, {unique: true})

mongoose.model('OAuthAuthorizationCode', oauthCodeSchema);

var OAuthTokensModel = mongoose.model('OAuthTokens');
var OAuthClientsModel = mongoose.model('OAuthClients');
var OAuthCodeModel = mongoose.model('OAuthAuthorizationCode');
var OAuthUsersModel = mongoose.model('OAuthUsers');

/**
 * Get client.
 */

module.exports.getClient = async function(clientId, clientSecret) {
    console.log("Dekh mei idhar aa gya : " + clientId + " and mera secret " + clientSecret)
  /*return OAuthClientsModel.findOne({ clientId: clientId }).lean();*/
  /*return new Promise( (resolve, reject) => {
    OAuthClientsModel.findOne({ clientId: clientId }).lean()
  })*/
  const client = await OAuthClientsModel.findOne({ clientId: clientId }).lean();
  console.log(client)
  return { clientId: client.clientId,
            clientSecret: client.clientSecret,
      grants: client.grants,
      redirectUris: client.redirectUris}
};


/**
 * Get access token.
 */

module.exports.getAccessToken = async function(bearerToken) {
    console.log("P1")
  // Adding `.lean()`, as we get a mongoose wrapper object back from `findOne(...)`, and oauth2-server complains.
  const accToken = await OAuthTokensModel.findOne({ accessToken: bearerToken }).lean();
  console.log("---accessToken--")
  console.log(accToken)
  return accToken
};


/**
 * Get refresh token.
 */

module.exports.getRefreshToken = function(refreshToken) {
    console.log("P0")
  return OAuthTokensModel.findOne({ refreshToken: refreshToken }).lean();
};

/**
 * Get user.
 */

module.exports.getUser = function(username, password) {
    console.log("Came Here to Check IF I reached here : " + username)
  return OAuthUsersModel.findOne({ username: username, password: password }).lean();
};

/**
 * Save token.
 */

module.exports.saveToken = function(token, client, user) {
    console.log("Started Token Part")
    console.log(token)
    console.log("-------------")
  var accessToken = new OAuthTokensModel({
    accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      refreshToken: token.refreshToken, // NOTE this is only needed if you need refresh tokens down the line
      refreshTokenExpiresAt: token.refreshTokenExpiresAt,
      client: client,
      user: user
  });
  // Can't just chain `lean()` to `save()` as we did with `findOne()` elsewhere. Instead we use `Promise` to resolve the data.
  return new Promise( (resolve,reject) => {
    accessToken.save( (err,data) => {
      if( err ) {
        console.log("Error at Token Saving Side" + err)
        reject( err );}
      else resolve( data );
    })
  }).then((saveResult) => {
    // `saveResult` is mongoose wrapper object, not doc itself. Calling `toJSON()` returns the doc.
    saveResult = saveResult && typeof saveResult == 'object' ? saveResult.toJSON() : saveResult;
    
    // Unsure what else points to `saveResult` in oauth2-server, making copy to be safe
    var data = new Object();
    for( var prop in saveResult ) data[prop] = saveResult[prop];
    
    // /oauth-server/lib/models/token-model.js complains if missing `client` and `user`. Creating missing properties.
    /*data.client = data.clientId;
    data.user = data.userId;*/

    return data;
  });
};


/**
 *Save Authorization Code
 */
module.exports.saveAuthorizationCode= function(code, client, user) {
    /* This is where you store the access code data into the database */
    /*log({
      title: 'Save Authorization Code',
      parameters: [
        { name: 'code', value: code },
        { name: 'client', value: client },
        { name: 'user', value: user },
      ],
    })*/
    console.log("Starting to save the code which is " + code);
    var authCode = new OAuthCodeModel({
        authorizationCode: code.authorizationCode,
        expiresAt: code.expiresAt,
        client: client,
        user: user
    })
    /*db.authorizationCode = {
      authorizationCode: code.authorizationCode,
      expiresAt: code.expiresAt,
      client: client,
      user: user,
    }*/
    /*return new Promise(resolve => resolve(Object.assign({
      redirectUri: `${code.redirectUri}`,
    }, db.authorizationCode)))*/

    return new Promise((resolve, reject) => {
        authCode.save((err, data) => {
            if (err) reject(err);
            else resolve(data);
        })
    }).then(saveResult => {
        saveResult = saveResult && typeof saveResult == 'object' ? saveResult.toJSON() : saveResult;
    
        // Unsure what else points to `saveResult` in oauth2-server, making copy to be safe
        var data = new Object();
        for( var prop in saveResult ) data[prop] = saveResult[prop];
        
        // /oauth-server/lib/models/token-model.js complains if missing `client` and `user`. Creating missing properties.
        data.redirectUri = code.redirectUri;

        console.log("Checking What is stored ---SaveAuthorizationCode: " + data.authorizationCode);

        return data;
    })

  };

module.exports.getAuthorizationCode= function(authorizationCode) {
    /* this is where we fetch the stored data from the code */
    /*log({
      title: 'Get Authorization code',
      parameters: [
        { name: 'authorizationCode', value: authorizationCode },
      ],
    })
    return new Promise(resolve => {
      resolve(db.authorizationCode)
    })*/
    console.log("Yeh hum aa gye hai kha")
    return OAuthCodeModel.findOne({ authorizationCode }).lean();
  };

module.exports.revokeAuthorizationCode= async function(authorizationCode) {
    /* This is where we delete codes */
    /*log({
      title: 'Revoke Authorization Code',
      parameters: [
        { name: 'authorizationCode', value: authorizationCode },
      ],
    })
    db.authorizationCode = { // DB Delete in this in memory example :)
      authorizationCode: '', // A string that contains the code
      expiresAt: new Date(), // A date when the code expires
      redirectUri: '', // A string of where to redirect to with this code
      client: null, // See the client section
      user: null, // Whatever you want... This is where you can be flexible with the protocol
    }*/
    console.log(authorizationCode)
    await OAuthCodeModel.findOneAndRemove({ authorizationCode: authorizationCode.authorizationCode });
    const codeWasFoundAndDeleted = true  // Return true if code found and deleted, false otherwise
    return new Promise(resolve => resolve(codeWasFoundAndDeleted))
  }

module.exports.revokeToken= async function(token) {
    
    console.log("Inside Revoke Token")
    console.log(token)
    if (!token || token === 'undefined') return false
    else {
        await OAuthTokensModel.findOneAndRemove({ _id: token._id});
        return new Promise(resolve => resolve(true))
    }
}

module.exports.verifyScope= function(token, scope) {
    /* This is where we check to make sure the client has access to this scope */

    /*if (!token.scope) {
        return false;
    }
    let requestedScopes = scope.split(' ');
    let authorizedScopes = token.scope.split(' ');
    return requestedScopes.every(s => authorizedScopes.indexOf(s) >= 0);*/

    console.log("Inside verifyScope")
    console.log(token)
    console.log(scope)
    const userHasAccess = true  // return true if this user / client combo has access to this resource
    return new Promise(resolve => resolve(userHasAccess))
  }