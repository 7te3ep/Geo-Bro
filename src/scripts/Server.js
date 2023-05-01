import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {getDatabase,ref,push,onValue,remove,get,off,set,update} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import {GoogleAuthProvider,getAuth,signInWithRedirect,getRedirectResult,onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { firebaseConfig } from "./serverConfig.js";

export class Server {
   constructor() {
      this.app = initializeApp(firebaseConfig);
      this.db = getDatabase(this.app);
      this.auth = getAuth();
      this.provider = new GoogleAuthProvider();
   }

   async authenthicate(){
      return new Promise(async (resolve) => {
         const onAuth = async (user) => {
            if (!user) {
               const userIsLoggingIn = await getRedirectResult(this.auth)
               if (!userIsLoggingIn) await signInWithRedirect(this.auth, this.provider);
            }
            var snapshot = await get(ref(this.db, `users/${user.uid}`))
            const userExistInDb = snapshot.exists()
            if (!userExistInDb) await this.createUser(user);
            resolve(user);
         }
         await onAuthStateChanged(this.auth, onAuth);
      })
   }

   async getUserData(user) {
      var snapshot =  await get(ref(this.db, `users/${user.uid}`))
      if (snapshot.exists()) return snapshot.val()
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

   async addFriend(authUser,friendToAddID){
      const authUserData = (await this.getUserData(authUser)).data
      var users = await get(ref(this.db, `users`))
      users = Object.entries(users.val())
      for (let user of users){
         const userUID = user[0]
         const userID = user[1].data.id
         const userName = user[1].data.name
         const friendRef = ref(this.db, `users/${authUser.uid}/data/friends/${userUID}`)
         const alreadyFriend = (await get(friendRef)).exists()
         if (userID == friendToAddID && !alreadyFriend) {
            let currentUserFriends = authUserData.friends || {}
            currentUserFriends[userUID] = {name:userName}
            await this.updateUserOnDb(authUser, {friends:currentUserFriends})
        }
      }
   }

   async delFriend(authUser, friendUID) {
      const userData = (await this.getUserData(authUser)).data
      let userFriends = userData.friends || {}
      delete userFriends[friendUID]
      await this.updateUserOnDb(authUser, {friends:userFriends})
   }

   signOut(){
      signOut(this.auth)
   }
}
