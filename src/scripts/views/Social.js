import {copyToClipboard} from "../modules/copyToClipboard.js"


export class Social {
   constructor(server , authUser, router){
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/social"
      this.path = "views/social.html"
      this.server = server
      this.authUser = authUser
      this.router = router
   }

   async update() {
      const userData = (await this.server.getData(`users/${this.authUser.uid}`)).data
      this.elements.userID.innerHTML = userData.id
      this.updateFriendsList()
   }

   async updateFriendsList () {
      const userData = (await this.server.getData(`users/${this.authUser.uid}`)).data
      const userFriends = Object.entries(userData.friends || [] ) 
      if (userFriends.length == 0) {
         this.elements.friendList.innerHTML = "<div class'title'>Aucun amis, pour l'instant !</div>"
         return 
      }
      this.elements.friendList.innerHTML = ""
      for (let friend of userFriends) {
         const friendUID = friend[0]
         const friendData = friend[1]
         const friendToShow = `<div class="card rounded light row"><span id="friendName">${friendData.name}</span><div class="btn bad delFriendBtn" id="${friendUID}">X</div></div>`
         this.elements.friendList.innerHTML += friendToShow
      }

      document.querySelectorAll(".delFriendBtn").forEach((delBtn)=>{
         delBtn.addEventListener("click",async ()=>{
            const friendToDelID = delBtn.id
            this.server.delFriend(this.authUser ,friendToDelID)
            await this.update()
         })
      })
   }

   async init() {
      await this.router.loadPage(this.link,this.path)
      this.elements["addFriendInput"] = this.getEl("addFriendInput")
      this.elements["addFriendBtn"] = this.getEl("addFriendBtn")
      this.elements["userID"] = this.getEl("userID")
      this.elements["friendList"] = this.getEl("friendList")
      this.elements["copyToClipboardBtn"] = this.getEl("copyToClipboardBtn")
      this.elements["navSocial"] = this.getEl("navSocial")
      
      this.elements.copyToClipboardBtn.addEventListener("click",()=>{
         copyToClipboard(this.elements.userID.innerHTML)
      })

      this.elements.addFriendBtn.addEventListener("click",async () => {
         await this.server.addFriend(this.authUser , this.elements.addFriendInput.value)
         this.elements.addFriendInput.value = ""
         await this.update()
      })
   }

   async quit() {  
      await this.server.stopExeOnChange("hosts")
   }
}