import {copyToClipboard} from "./copyToClipboard.js"

export class DashBoard {
   constructor(server, authUser, router){
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/dashboard"
      this.path = "views/dashboard.html"
      this.server = server
      this.authUser = authUser
      this.router = router
   }

   async update() {
      const userData = (await this.server.getUserData(this.authUser)).data
      this.elements.userLevel.innerHTML = userData.level
      this.elements.expBar.style.width = `${userData.exp}%`
      this.updateNewsGallery()
      this.updateShopGallery()
   }

   async init() {
         await this.router.loadPage(this.link,this.path)
         this.elements["userLevel"] = this.getEl('userLevel')
         this.elements["expBar"] = this.getEl('expBar')
         this.elements["newsGallery"] = this.getEl('newsGallery')
         this.elements["packGallery"] = this.getEl('packGallery')
   }

   async updateNewsGallery(){
      const newsOnDb = await this.server.getNews()
      const newsList = Object.entries(newsOnDb || {} )  
      this.elements.newsGallery.innerHTML = ""
      for (let news of newsList) {
         const newsTitle = news[0]
         const newsContent = news[1]
         const newsToShow = `<div class="container rounded electricBlue"><p class="title">${newsTitle}</p><p>${newsContent}</p></div>`
         this.elements.newsGallery.innerHTML += newsToShow
      }
   }

   async updateShopGallery(){
      const packsOnDb = await this.server.getShopPacks()
      const packList = Object.entries(packsOnDb || {} )  
      this.elements.packGallery.innerHTML = ""
      for (let pack of packList) {
         const packName = pack[0]
         const packType = pack[1].type
         const packArea = pack[1].area
         const packPrice = pack[1].price
         const packToShow = `<div class="card rounded dark"><p class="title">${packName}</p><p>Area: ${packArea}</p><p>Type:  ${packType}</p><p> ${packPrice}</p></div>`
         this.elements.packGallery.innerHTML += packToShow
      }
   }
}

export class Games {
   constructor(server, authUser, router){
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/games"
      this.path = "views/games.html"
      this.server = server
      this.authUser = authUser
      this.router = router
   }

   async update() {
      const userData = (await this.server.getUserData(this.authUser)).data
   }

   async init() {
      await this.router.loadPage(this.link,this.path)

      this.elements["lobbyIdInput"] = this.getEl("lobbyIdInput")
      this.elements["joinLobbyBtn"] = this.getEl("joinLobbyBtn")
      this.elements["createLobbyBtn"] = this.getEl("createLobbyBtn")

      let canConnect = false
      this.elements.joinLobbyBtn.addEventListener('click',async ()=>{
         const lobbyId = this.elements.lobbyIdInput.value
         let lobbyExist = await this.server.getData(`lobbys/${lobbyId}`)
         if (!lobbyExist) return
         await this.server.playerConnectToLobby(this.authUser , lobbyId )
         this.elements.joinLobbyBtn.href = "/lobby"
         if (!canConnect) this.elements.joinLobbyBtn.click()
         canConnect = true
      })
   }
}

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

   async init() {
      await this.router.loadPage(this.link,this.path)
      this.elements["addFriendInput"] = this.getEl("addFriendInput")
      this.elements["addFriendBtn"] = this.getEl("addFriendBtn")
      this.elements["userID"] = this.getEl("userID")
      this.elements["friendList"] = this.getEl("friendList")
      this.elements["copyToClipboardBtn"] = this.getEl("copyToClipboardBtn")
      
      this.elements.copyToClipboardBtn.addEventListener("click",()=>{
         copyToClipboard(this.elements.userID.innerHTML)
      })

      this.elements.addFriendBtn.addEventListener("click",async () => {
         await this.server.addFriend(this.authUser , this.elements.addFriendInput.value)
         this.elements.addFriendInput.value = ""
         await this.update()
      })
   }
}