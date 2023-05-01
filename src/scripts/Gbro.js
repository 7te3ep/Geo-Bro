import { DashBoard, Games, Social } from "./View.js";

let route = {
   "/dashboard": DashBoard,
   "/games": Games,
   "/social": Social,
};

export class Gbro {
   constructor(server, router, loader, ui) {
      this.getEl = (id) => document.getElementById(id);
      this.router = router;
      this.server = server;
      this.loader = loader;
      this.currentView;
      this.ui = ui;
      this.authUser;
   }

   async init() {
      this.loader(true);
      this.authUser = await this.server.authenthicate();
      await this.updateUserUi();
      await this.loadView(DashBoard);
      this.loader(false);
   }

   async initLinks() {
      document.querySelectorAll("a").forEach((link) => {
         const hasClickEvent = link.classList.contains("clickListened");
         link.classList.add("clickListened");

         if (hasClickEvent)  return
         link.addEventListener("click", (event)=>{
            event.preventDefault();
            this.loadView(route[link.getAttribute("href")]);
         });
      });
   
      this.getEl("logo").addEventListener("click", () => {
         this.server.signOut();
      });
   }

   async loadView(view) {
      this.loader(true);
      this.currentView = new view(this.server, this.authUser);
      await this.currentView.init(this.router);
      await this.initLinks();
      await this.currentView.update();
      this.loader(false);
   }

   async updateUserUi() {
      const userData = await this.server.getUserData(this.authUser);
      this.ui.userCoins.innerHTML = userData.data.coins;
      this.ui.userName.innerHTML = this.authUser.displayName;
      this.ui.userImg.src = this.authUser.photoURL;
   }
}
