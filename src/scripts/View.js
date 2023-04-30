export class DashBoard {
   constructor(){
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/dashboard"
      this.path = "views/dashboard.html"
   }

   async update(userData) {
      const data = userData.data
      this.elements.userLevel.innerHTML = data.level
      this.elements.expBar.style.width = `${data.exp}%`
   }

   async init(router) {
         await router.loadPage(this.link,this.path)
         this.elements["userLevel"] = this.getEl('userLevel')
         this.elements["expBar"] = this.getEl('expBar')
   }
}

export class Games {
   constructor(){
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/games"
      this.path = "views/games.html"
   }

   async update(userData) {
      const data = userData.data
   }

   async init(router) {
         await router.loadPage(this.link,this.path)
   }
}

export class Social {
   constructor(){
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/social"
      this.path = "views/social.html"
   }

   async update(userData) {
      const data = userData.data
      this.elements.userID.innerHTML = data.id
      this.updateFriendsList(userData)
   }

   async updateFriendsList (userData) {
      const userFriends = Object.values(userData.data.friends)  || []
      if (userFriends.length == 0) return
      userFriends.forEach((friend)=>{
         const friendToShow = `<div class="card rounded light row"><span id="friendName">${friend.name}</span><div class="btn good">Duel</div></div>`
         this.elements.friendList.innerHTML += friendToShow
      })
   }

   async init(router, server, user) {
      await router.loadPage(this.link,this.path)
      this.elements["addFriendInput"] = this.getEl("addFriendInput")
      this.elements["addFriendBtn"] = this.getEl("addFriendBtn")
      this.elements["userID"] = this.getEl("userID")
      this.elements["friendList"] = this.getEl("friendList")
      this.elements.addFriendBtn.addEventListener("click", () => {
         server.addFriend(user , this.elements.addFriendInput.value)
         this.elements.addFriendInput.value = ""
         this.update(this.server.getUserData(this.user))
      })
   }
}