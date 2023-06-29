import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {getDatabase,ref,push,onValue,remove,get,off,set,update , onDisconnect } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import {GoogleAuthProvider,getAuth,signInWithRedirect,getRedirectResult,onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { firebaseConfig } from "./serverConfig.js";
import { lobbyNames } from "./../../assets/lobbyNames.js"
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
   
   async getData(path) {
      var snapshot =  await get(ref(this.db,path))
      if (snapshot.exists()) return snapshot.val()
      else return null
   }

   async setData (path, data) {
      await set(ref(this.db, path), data);
   }

   async updateOnDb (path, data) {
      for (let dataKey of Object.entries(data)){
         const key = dataKey[0]
         const value = dataKey[1]
         const newValue = {}
         newValue[key] = value
         await update(ref(this.db, path), newValue)
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
            id: parseInt(Math.ceil(Math.random() * Date.now()).toPrecision(6).toString().replace(".", ""))
         },
      });
   }

   async exeOnChange(path,func){
      await onValue(ref(this.db,path),await func);
   }

   async stopExeOnChange(path){
      off(ref(this.db, path))
   }

   async addFriend(authUser,friendToAddID){
      const authUserData = (await this.getData(`users/${authUser.uid}`)).data
      if (friendToAddID == authUserData.id) return
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
            await this.setData(`users/${authUser.uid}/data/friends`, currentUserFriends)
        }
      }
   }

   async delFriend(authUser, friendUID) {
      const userData = (await this.getData(`users/${authUser.uid}`)).data
      let userFriends = userData.friends || {}
      delete userFriends[friendUID]
      await this.setData(`users/${authUser.uid}/data/friends`, userFriends)
   }

   async newLobbyOnDb(host){
      const normalize = (num, min, max) => {
         const delta = max - min;
         return (num - min) / delta
      }
      const Alphabet = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"]
      const lobbyId = parseInt(Math.ceil(Math.random() * Date.now()).toPrecision(8).toString().replace(".", "")).toString()
      var alphaLobbyId = ""
      console.log(lobbyId);
      for (let i = 0; i < lobbyId.length; i += 2) {
         alphaLobbyId +=  Alphabet[Math.ceil(normalize(`${lobbyId[i]}${lobbyId[i+1]}`, 0 , 99) * 25)]
      }
      const lobbyName = lobbyNames[Math.round(Math.random()*lobbyNames.length)];
      await set(ref(this.db, `lobbys/${alphaLobbyId}`), {
            players:{
               [host.uid] : {
                  name:host.displayName,
                  img: host.photoURL,
               }
            },
            game:{
               started:false,
            },
            param : {
               lobbyName:lobbyName,
               time:60,
               len:20,
               map:"world",
               visibility:"private"
            }
      });
      await set(ref(this.db, `hosts/${host.uid}`), {
         id: alphaLobbyId,
         name:host.displayName
      });
      return alphaLobbyId
   }

   async playerConnectToLobby(authUser , lobbyId ){
      const lobbyExist = (await get(ref(this.db, `lobbys/${lobbyId}`))).exists()
      if (!lobbyExist) return false
      const lobbyPlayersRef = ref(this.db, `lobbys/${lobbyId}/players/${authUser.uid}`)
      await set(lobbyPlayersRef,{
         name:authUser.displayName,
         img: authUser.photoURL,
      });
      return true
   }

   async onDisconnectRemove(path) {
      const valuePath = ref(this.db, path)
      await onValue(valuePath,async (snap) => {
         if (!snap.exists()) return
         await onDisconnect(valuePath).remove();
      })
   }

   async userPresenceHandler(user){
      const userStatus = ref(this.db,`users/${user.uid}/data/status`)
      await onValue(userStatus,async (snap) => {
         await onDisconnect(userStatus).set(false);
         await set(userStatus, true);
       });
   }

   signOut(){
      signOut(this.auth)
   }
}
