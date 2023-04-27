export class Router {
    constructor( {contentDiv, routes , loader }) {
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