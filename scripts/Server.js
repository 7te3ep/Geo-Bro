import { initializeApp} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase , ref , push , onValue , remove, get, off } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"
import { GoogleAuthProvider, getAuth, signInWithRedirect, getRedirectResult, onAuthStateChanged  } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { firebaseConfig } from "./serverConfig.js";

const app = initializeApp(firebaseConfig)
export class Server {
    constructor () {
        this.app = app
        this.db = getDatabase(app)
        this.auth = getAuth()
        this.provider = new GoogleAuthProvider()
        
        this.authentification = new Promise(resolve => {
            const onAuth = user => {
              if (user) resolve(user)
              else getRedirectResult(this.auth).then(result => {
                if (!result) signInWithRedirect(this.auth, this.provider)
                resolve(user)
              })
            }
            onAuthStateChanged(this.auth, onAuth)
        })
    }
}