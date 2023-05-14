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
      const userData = (await this.server.getData(`users/${this.authUser.uid}`)).data
      this.elements.userLevel.innerHTML = userData.level
      this.elements.expBar.style.width = `${userData.exp}%`
      await this.updateNewsGallery()
      await this.updateShopGallery()
   }

   async init() {
         await this.router.loadPage(this.link,this.path)
         this.elements["userLevel"] = this.getEl('userLevel')
         this.elements["expBar"] = this.getEl('expBar')
         this.elements["newsGallery"] = this.getEl('newsGallery')
         this.elements["packGallery"] = this.getEl('packGallery')
         
         await this.server.exeOnChange("news",()=>{this.update()})
      }

   async quit() {
      
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

   async updateShopGallery(){
      const packsOnDb = await this.server.getData("shopPacks")
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