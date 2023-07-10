import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {getDatabase,ref,onValue,remove,get,off,set,update , onDisconnect } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import {GoogleAuthProvider, OAuthProvider ,FacebookAuthProvider,TwitterAuthProvider,getAuth, signInWithPopup,onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { firebaseConfig } from "./serverConfig.js";
import { lobbyNames } from "./../../assets/lobbyNames.js"
export class Server {
   constructor() {
      this.app = initializeApp(firebaseConfig);
      this.db = getDatabase(this.app);
      this.auth = getAuth();
      this.provider
   }

   async authenticate( test , provider ) {
      if (provider == 'google') this.provider = new GoogleAuthProvider()
      if (provider == 'twitter') this.provider = new TwitterAuthProvider()
      if (provider == 'facebook') this.provider = new FacebookAuthProvider()
      if (provider == 'microsoft') this.provider = new OAuthProvider('microsoft.com')
      return new Promise(async (resolve) => {
         const onAuth = async (user) => {
            if (!user && !test) {
               await signInWithPopup(this.auth, this.provider)
            }
            if (!test && user) {
               var snapshot = await get(ref(this.db, `users/${user.uid}`))
               const userExistInDb = snapshot.exists()
               if (!userExistInDb) await this.createUser(user);
            }
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
      const generateId = async () => {
         const Alphabet = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"]
         const normalize = (num, min, max) => (num - min) / max - min;
         const lobbyId = parseInt(Math.ceil(Math.random() * Date.now()).toPrecision(8).toString().replace(".", "")).toString()
         let alphaLobbyId = ""
         for (let i = 0; i < lobbyId.length; i += 2) {
            alphaLobbyId +=  Alphabet[Math.ceil(normalize(`${lobbyId[i]}${lobbyId[i+1]}`, 0 , 99) * 25)]
         }
         return alphaLobbyId
      }
      const getParam = async ()=>{
         const previousParam = await this.getData(`replayStack/${host.uid}/param`)
         if (!previousParam) return {time:60,len:20,map:"world",visibility:"private"}
         else return {time: previousParam.time,len: previousParam.len,map: previousParam.map,visibility: previousParam.visibility}
      }
      const getPlayers = async ()=>{
         const previousPlayers = await this.getData(`replayStack/${host.uid}/players`) || {}
         previousPlayers[host.uid] = {
            name:host.displayName,
            img: host.photoURL,
         }
         return previousPlayers
      }
      const param = await getParam()
      const players = await getPlayers()
      const alphaLobbyId = await generateId()
      const lobbyName = lobbyNames[Math.round(Math.random()*lobbyNames.length)];

      await set(ref(this.db, `lobbys/${alphaLobbyId}`), {
            players:players,
            game:{
               started:false,
            },
            param : {
               lobbyName:lobbyName,
               time:param.time,
               len:param.len,
               map:param.map,
               visibility:param.visibility
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

   async removeData(path) {
      const removeRef = ref(this.db,path)
      await remove(removeRef)
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

   crypt(text, salt ){
         const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
         const byteHex = (n) => ("0" + Number(n).toString(16)).substr(-2);
         const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);
       
         return text
           .split("")
           .map(textToChars)
           .map(applySaltToChar)
           .map(byteHex)
           .join("");
   }
   decrypt (encoded, salt) {
      const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
      const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);
      return encoded
        .match(/.{1,2}/g)
        .map((hex) => parseInt(hex, 16))
        .map(applySaltToChar)
        .map((charCode) => String.fromCharCode(charCode))
        .join("");
    };
}
