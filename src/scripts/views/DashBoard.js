export class DashBoard {
   constructor(server, authUser, router){
      this.layer = 1 
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/dashboard"
      this.path = "views/dashboard.html"
      this.server = server
      this.authUser = authUser
      this.router = router
   }

   async update() {
      if (!await this.server.getData(`users/${this.authUser.uid}`)) return
      const userData = (await this.server.getData(`users/${this.authUser.uid}`)).data
      this.elements.userLevel.innerHTML = userData.level
      this.elements.expBar.style.width = `${userData.exp}%`
   }

   async init() {
      await this.router.loadPage(this.link,this.path)
      document.querySelectorAll(".navIcon").forEach(icon=>icon.classList.remove("iconFocus"))
      this.getEl("dashboardIcon").classList.add("iconFocus")

      this.elements["userLevel"] = this.getEl('userLevel')
      this.elements["expBar"] = this.getEl('expBar')
      this.elements["newsGallery"] = this.getEl('newsGallery')
      this.elements["performanceGallery"] = this.getEl('performanceGallery')
      this.elements["userInfo"] = this.getEl('userInfo')
      this.elements.userInfo.innerHTML = `<img alt="profile image of user" class="userImg" src="${this.authUser.photoURL}"> <p id="playerName">${this.authUser.displayName}</p>`
      
      await this.server.exeOnChange("news",async ()=>{await this.updateNewsGallery()})
      await this.server.exeOnChange("leaderboard",async ()=>{await this.updateLeaderBoard()})
      document.addEventListener('keydown',async (e)=>{
         if (e.key == "p") await this.server.signOut()
      })
   }

   async swipeNav(diretion){
      if (diretion == "left") this.getEl("navGames").click()
   }

   async quit() {
      await this.server.stopExeOnChange("news")
      await this.server.stopExeOnChange("leaderboard")
   }

   async updateLeaderBoard() {
      this.elements.performanceGallery.innerHTML = ""
      const leaderBoard = Object.entries(await this.server.getData("leaderboard") || {})
      let place = 0
      leaderBoard.forEach((performance)=>{
         const userName = Object.entries(performance[1])[0][0]
         const score = Object.entries(performance[1])[0][1]
         this.elements.performanceGallery.innerHTML += `<div class="card dark rounded row"><div>${place}.</div> <div class="title dark" style="background: none;">${userName} : ${score}s</div></div>`
         place ++
      })
   }

   async updateNewsGallery(){
      const newsOnDb = await this.server.getData("news")
      const newsList = Object.entries(newsOnDb || {} )  
      this.elements.newsGallery.innerHTML = ""
      for (let news of newsList) {
         const newsTitle = news[0]
         const newsContent = news[1]
         const newsToShow = `<div class="container rounded electricBlue row"><p class="title">${newsTitle}</p><p>${newsContent}</p></div>`
         this.elements.newsGallery.innerHTML += newsToShow
      }
   }
}