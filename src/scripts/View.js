export class DashBoard {
   constructor(server, authUser){
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/dashboard"
      this.path = "views/dashboard.html"
      this.server = server
      this.authUser = authUser
   }

   async update() {
      const userData = (await this.server.getUserData(this.authUser)).data
      this.elements.userLevel.innerHTML = userData.level
      this.elements.expBar.style.width = `${userData.exp}%`
   }

   async init(router) {
         await router.loadPage(this.link,this.path)
         this.elements["userLevel"] = this.getEl('userLevel')
         this.elements["expBar"] = this.getEl('expBar')
   }
}

export class Games {
   constructor(server, authUser){
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/games"
      this.path = "views/games.html"
      this.server = server
      this.authUser = authUser
   }

   async update() {
      const userData = (await this.server.getUserData(this.authUser)).data
   }

   async init(router) {
         await router.loadPage(this.link,this.path)
   }
}

export class Social {
   constructor(server , authUser){
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/social"
      this.path = "views/social.html"
      this.server = server
      this.authUser = authUser
   }

   async update() {
      const userData = (await this.server.getUserData(this.authUser)).data
      this.elements.userID.innerHTML = userData.id
      this.updateFriendsList()
   }

   async updateFriendsList () {
      const userData = (await this.server.getUserData(this.authUser)).data
      const userFriends = Object.entries(userData.friends || {} )  
      this.elements.friendList.innerHTML = ""
      for (let friend of userFriends) {
         const friendUID = friend[0]
         const friendData = friend[1]
         const friendToShow = `<div class="card rounded light row"><span id="friendName">${friendData.name}</span><div class="btn good">Duel</div><div class="btn bad delFriendBtn" id="${friendUID}">X</div></div>`
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

   async init(router) {
      await router.loadPage(this.link,this.path)
      this.elements["addFriendInput"] = this.getEl("addFriendInput")
      this.elements["addFriendBtn"] = this.getEl("addFriendBtn")
      this.elements["userID"] = this.getEl("userID")
      this.elements["friendList"] = this.getEl("friendList")
   
      this.elements.addFriendBtn.addEventListener("click",async () => {
         await this.server.addFriend(this.authUser , this.elements.addFriendInput.value)
         this.elements.addFriendInput.value = ""
         await this.update()
      })
   }
}