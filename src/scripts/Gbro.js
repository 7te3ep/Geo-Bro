import { DashBoard, Games, Social } from "./View.js";
let route = {
   "/dashboard" : DashBoard,
   "/games" : Games,
   "/social": Social
}
export class Gbro {
   constructor(server, router, loader, ui) {
      this.getEl = id => document.getElementById(id) 
      this.router = router;
      this.server = server;
      this.loader = loader;
      this.currentView
      this.ui = ui;
      this.user;

      window.addEventListener("click",()=>{
         this.server.updateUserOnDb(this.user ,{exp:80, level:100, coins:12})
      })
   }

   async init() {
      this.loader(true);
      this.user = await this.server.authenthicate()
      await this.updateUserUi();
      await this.loadView(DashBoard)
      this.loader(false);
   }

   async initLinks() {
      document.querySelectorAll("a").forEach((link) => {
         const clickEvent = (event)=>{
            event.preventDefault();
            this.loadView((route[link.getAttribute("href")]))
         }
         const hasClickEvent = link.classList.contains("clickListened")
         if (!hasClickEvent) link.addEventListener("click", clickEvent)
         link.classList.add("clickListened");
      })
   }

   async loadView(view){
      this.currentView = new view()
      await this.currentView.init(this.router)
      await this.initLinks()
      await this.updateView()
   }

   async updateView() {
      const userData = await this.server.getUserData(this.user)
      await this.currentView.update(userData)
   }

   async updateUserUi() {
      const userData = await this.server.getUserData(this.user)
      console.log(userData);
      this.ui.userName.innerHTML = this.user.displayName;
      this.ui.userImg.src = this.user.photoURL
      this.ui.userCoins.innerHTML = userData.data.coins
   }
}
