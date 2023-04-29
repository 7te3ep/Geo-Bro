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
   }

   async init(router) {
         await router.loadPage(this.link,this.path)
   }
}