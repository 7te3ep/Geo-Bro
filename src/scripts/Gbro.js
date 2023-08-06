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
         await this.currentView.quit()
         await this.loadView(this.route[location.pathname]);
      };

      window.oncontextmenu = function(event) {
         event.preventDefault();
         event.stopPropagation();
         return false;
    };
   }

   async init() {
      this.loader(true);
      const userIsAuth = await this.server.authenticate(true, "none")
      const isShareLink = location.pathname.length == 11 && location.pathname.slice(0, 6) == "/lobby"
      const pathExist = this.route[location.pathname]
      const isNavigation = pathExist && !isShareLink
      const isNotAccessible = ["/entry","/hostLobby","/chooseMap","/speedrun","/classic","/lobby"].includes(location.pathname)
      if (isShareLink){
         const lobbyId = location.pathname.slice(-4)
         await this.server.playerConnectToLobby(this.server.auth.currentUser , lobbyId )
         await this.loadView(this.route["/lobby"]);
      } 
      else if (!userIsAuth) await this.loadView(this.route["/entry"]);
      else if (userIsAuth && location.pathname == "/" || isNotAccessible )  await this.loadView(this.route["/dashboard"]) 
      else if (isNavigation) await this.loadView(this.route[location.pathname]);
      else if (!pathExist) this.loadView(this.route["/404"]);
      
      if (userIsAuth) await this.server.userPresenceHandler(this.server.auth.currentUser,()=>{this.currentView.quit()})
      await this.initSwipe()
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
            if (path){
               this.loader(true);
               const isGameNav = ["/classic","/speedrun","/hostLobby","/chooseMap"].includes(path)
               if (!isGameNav) await this.currentView.quit();
               await this.loadView(this.route[path]);
               this.loader(false);
            } 
         });

      });
   }

   async loadView(view) {
      this.currentView = new view(this.server, this.server.auth.currentUser, this.router);
      await this.currentView.init();
      await this.initLinks();
      await this.currentView.update();
   }

   async initSwipe(){
      const classRef = this
      var xDown = null, yDown = null, xUp = null, yUp = null;
      document.addEventListener('touchstart', touchstart, false);        
      document.addEventListener('touchmove', touchmove, false);
      document.addEventListener('touchend', touchend, false);
      function touchstart(evt) { const firstTouch = (evt.touches || evt.originalEvent.touches)[0]; xDown = firstTouch.clientX; yDown = firstTouch.clientY; }
      function touchmove(evt) { if (!xDown || !yDown ) return; xUp = evt.touches[0].clientX; yUp = evt.touches[0].clientY; }
      function touchend(evt) { 
         var xDiff = xUp - xDown, yDiff = yUp - yDown;
         const distance = xUp && yUp ? Math.sqrt((xUp-xDown)**2 + (yUp-yDown)**2) : 0 
         const isPrimaryView = classRef.currentView.layer == 1
         const isSwipe = distance > 150 
         if ((Math.abs(xDiff) > Math.abs(yDiff)) && isSwipe && isPrimaryView) { 
            if (classRef.currentView.swipeNav == undefined) return
            if (xDiff < 0) 
               classRef.currentView.swipeNav('left')
            else
               classRef.currentView.swipeNav('right')
         } 
         xDown = null, yDown = null, xUp = null, yUp = null;
      }
   }
}