class Gbro {
    constructor ( server , router , loader , ui ) {
        this.router = router
        this.server = server
        this.loader = loader
        this.ui = ui
        this.user
    }

    async init () {
        this.loader(true)
        await this.server.authentification()
        await this.updateUserProfile()
        await this.router.initPageNavigation()
        await this.router.goToPage("/dashboard")
        this.loader(false)
    }

    async updateUser(){
        this.user = server.auth.currentUser
        this.ui.userName = this.user.displayName
        this.ui.userImage = this.user.photoURL
    }

}

class Server {
    constructor ( { app , db , provider , auth} ) {
        this.app = app
        this.db = db
        this.auth = auth
        this.provider = provider 
    }

    async authentification () {
        onAuthStateChanged(auth, (user) => {
            if (user) return ( user )
            getRedirectResult(auth)
            .then((result) => {
                if (result == null) signInWithRedirect(auth, provider);
                return ( user )
            })
        })
    }
}

class Router {
    constructor(contentDiv, routes , loader) {
      this.contentDiv = contentDiv
      this.routes = routes
      this.loader = loader
  
      window.onpopstate = () => {
        this.goToPage(location.pathname);
      }
    }
  
    async initPageNavigation() {
      document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', event => {
            this.pageNavigation( link , event)
        })
      })
    }
  
    async pageNavigation ( link , event ) {
        this.loader(true)
        event.preventDefault()
        const path = link.getAttribute('href')
        await this.goToPage(path)
        history.pushState(null, '', path)
        this.loader(false)
    }
  
    async goToPage(path) {
      const route = this.routes[path] || this.routes[404];
      const html = await fetch(route).then(response => response.text());
      this.contentDiv.innerHTML = html;
    }
  }