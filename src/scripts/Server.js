import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {getDatabase,ref,push,onValue,remove,get,off,set,update} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import {GoogleAuthProvider,getAuth,signInWithRedirect,getRedirectResult,onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { firebaseConfig } from "./serverConfig.js";

const app = initializeApp(firebaseConfig);
export class Server {
   constructor() {
      this.app = app;
      this.db = getDatabase(app);
      this.auth = getAuth();
      this.provider = new GoogleAuthProvider();
   }

   async authenthicate(){
      return new Promise(async (resolve) => {
         const onAuth =async (user) => {
            if (!user) {
               await getRedirectResult(this.auth).then(async (result) => {
                  if (!result) await signInWithRedirect(this.auth, this.provider);
               })
            }
            var snapshot = await get(ref(this.db, `users/${user.uid}`))
            if (!snapshot.exists()){
               await this.createUser(user);
            }
            resolve(user);
         }
         await onAuthStateChanged(this.auth, onAuth);
      })
   }

   async getUserData(user) {
      var snapshot =  await get(ref(this.db, `users/${user.uid}`))
      return snapshot.val()
   }

   async updateUserOnDb (user, data) {
      Object.entries(data).forEach(dataKey => {
         const key = dataKey[0]
         const value = dataKey[1]
         const newValue = {}
         newValue[key] = value
         update(ref(this.db, `users/${user.uid}/data/`), newValue)
      })
   }

   async createUser(user) {
      await set(ref(this.db, `users/${user.uid}`), {
         data: {
            email: user.email,
            name: user.displayName,
            level: 0,
            exp: 50,
            coins: 10,
            friends:[],
            id: ((new Date().getTime()).toString()).slice(4) + (Math.round(Math.random()*100)).toString()
         },
      });
   }

   async addFriend(currentUser,currentUserID){
      var users =  await get(ref(this.db, `users`))
      users = users.val()
      Object.entries(users).forEach(async (user) => {
         const userID = user[1].data.id
         if (userID == currentUserID) {
            let currentUserFriends = await this.getUserData(currentUser)
            currentUserFriends = currentUserFriends.data.friends || []
            currentUserFriends.push({uid:user[0],name:user[1].data.name})
            await this.updateUserOnDb(currentUser, {friends:currentUserFriends})
         }
      })
   }

   signOut(){
      signOut(this.auth)
   }
}
