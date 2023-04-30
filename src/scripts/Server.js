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
      for (let dataKey of Object.entries(data)){
         const key = dataKey[0]
         const value = dataKey[1]
         const newValue = {}
         newValue[key] = value
         await update(ref(this.db, `users/${user.uid}/data/`), newValue)
      }
   }

   async createUser(user) {
      await set(ref(this.db, `users/${user.uid}`), {
         data: {
            email: user.email,
            name: user.displayName,
            level: 0,
            exp: 50,
            coins: 10,
            friends:{},
            id: ((new Date().getTime()).toString()).slice(4) + (Math.round(Math.random()*100)).toString()
         },
      });
   }

   async addFriend(currentUser,friendToAddID){
      var snapshot =  await get(ref(this.db, `users`))
      var users = Object.entries(snapshot.val())
      for (let user of users){
         const userUID = user[0]
         const userID = user[1].data.id
         const userName = user[1].data.name
         const friendRef = ref(this.db, `users/${currentUser.uid}/data/friends/${userUID}`)
         const alreadyFriend = (await get(friendRef)).exists()
         if (userID == friendToAddID && !alreadyFriend) {
            let currentUserFriends = await this.getUserData(currentUser)
            currentUserFriends = currentUserFriends.data.friends || {}
            currentUserFriends[userUID] = {name:userName}
            await this.updateUserOnDb(currentUser, {friends:currentUserFriends})
        }
      }
   }

   signOut(){
      signOut(this.auth)
   }
}
