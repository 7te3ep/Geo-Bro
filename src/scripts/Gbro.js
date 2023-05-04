export class Gbro {
   constructor(server, router, loader, ui, route) {
      this.getEl = (id) => document.getElementById(id);
      this.router = router;
      this.server = server;
      this.loader = loader;
      this.route = route;
      this.currentView;
      this.ui = ui;
      this.authUser;

      window.onpopstate = async () => {
         await this.loadView(this.route[location.pathname]);
      };
   }

   async init() {
      this.loader(true);
      this.authUser = await this.server.authenthicate();
      await this.updateUserUi();
      await this.loadView(this.route["/dashboard"]);
      this.loader(false);
   }

   async initLinks() {
      document.querySelectorAll("a").forEach((link) => {
         const hasClickEvent = link.classList.contains("clickListened");
         link.classList.add("clickListened");

         if (hasClickEvent) return
         link.addEventListener("click",async (event)=>{
            event.preventDefault();
            const path = link.getAttribute("href")
            if (path) this.loadView(this.route[path]);
         });
      });
   
      this.getEl("logo").addEventListener("click", () => {
         this.server.signOut();
      });
   }

   async loadView(view) {
      this.loader(true);
      this.currentView = new view(this.server, this.authUser, this.router);
      await this.currentView.init();
      await this.initLinks();
      await this.currentView.update();
      this.loader(false);
   }

   async updateUserUi() {
      const userData = await this.server.getData(`users/${this.authUser.uid}`);
      this.ui.userCoins.innerHTML = userData.data.coins;
      this.ui.userName.innerHTML = this.authUser.displayName;
      this.ui.userImg.src = this.authUser.photoURL;
   }
}
