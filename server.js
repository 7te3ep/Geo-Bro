import { initializeApp} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase , ref , push , onValue , remove, get, off } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"
import { GoogleAuthProvider, getAuth, signInWithRedirect, getRedirectResult, onAuthStateChanged  } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyALqixkjgEjLlkfJPyyFWdIcn4ey0MVumE",
  authDomain: "geobro-c87b0.firebaseapp.com",
  databaseURL: "https://geobro-c87b0-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "geobro-c87b0",
  storageBucket: "geobro-c87b0.appspot.com",
  messagingSenderId: "11811089425",
  appId: "1:11811089425:web:4aa63eaddebd7d502155b0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app)
const provider = new GoogleAuthProvider();
const auth = getAuth();

var authanticate = new Promise ((resolve)=>{
  onAuthStateChanged(auth, (user) => {
    if (user) {
      resolve( user )
      push(ref(database,`users/${user.uid}`),user.email)
    } 
    else {
      getRedirectResult(auth)
      .then((result) => {
        if (result == null) signInWithRedirect(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        resolve( user )
      })
    }
  });
} )

const getUser = ()=> { return auth.currentUser}

export {authanticate, getUser}