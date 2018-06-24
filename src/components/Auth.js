import axios from 'axios';

let lib = require("../utils/library.js");

export default class Auth {
    name = null;
    isLoggedIn = false;
    userEmail = null;
    userPassword = null;
    jwtToken = null;
    jwtTokenExpiry = null;

    constructor(dbIndex) {
        this.dbIndex = dbIndex;
    }

    async getUserDetails() {
        // Returns an object with info about the currently logged in user
        if (!this.isAuthenticated()) {
            await this._loginPostRequest().then((resp) => { return resp });
        }
        return {
            isLoggedIn: this.isLoggedIn,
            jwtToken: this.jwtToken,
            name: this.name || "",
        }
    }

    setCredentials(newEmail, newPassword) {
        this.userEmail = newEmail;
        this.userPassword = newPassword;
    }

    logout() {
        // Get rid of the user credentials
        this.userEmail = null;
        this.userPassword = null;
        this.softLogout();
    }

    // Does not delete the email + pass
    softLogout() {
        this.name = null;
        this.isLoggedIn = false;
        this.jwtToken = null;
        this.jwtTokenExpiry = null;
    }

    isAuthenticated() {
        // Return true iff user is authenticated and jwt is still valid
        let emailRegEx = /^(([^<>()\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; // From http://emailregex.com/

        if (this.jwtTokenExpiry > Date.now() && emailRegEx.test(this.userEmail) && this.userPassword && this.userPassword !== "") {
            return true;
        }
    }

    setDb(newDbIndex) {
        this.softLogout();
        this.dbIndex = newDbIndex;
    }

    async _loginPostRequest() {
        let loginUrl = lib.getDbConfig(this.dbIndex, "url") + "/rpc/login";

        // Makes the HTTP request to obtain JWT token + jwtTokenExpiry + user details
        try {
            let rawResp = await axios.post(loginUrl, { email: this.userEmail, pass: this.userPassword });
            let data = rawResp.data[0];
            this._setStatusTokenExpiry(true, data.token, data.tokenExpiry);

            return data;
        } catch (e) {
            this._setStatusTokenExpiry(false, null, 0);
            console.log(e);
        }
    }

    // Used to set the relevant parts of this class
    _setStatusTokenExpiry(status, token, expiry) {
        this.isLoggedIn = status;
        this.jwtToken = token;
        this.jwtTokenExpiry = expiry ? expiry : Date.now() + (60 * 60 * 1000);
    }

    toString() {
        return JSON.stringify({
            name: this.name,
            isLoggedIn: this.isLoggedIn,
            userEmail: this.userEmail,
            userPassword: this.userPassword,
            jwtToken: this.jwtToken,
            jwtTokenExpiry: this.jwtTokenExpiry
        })
    }
}
