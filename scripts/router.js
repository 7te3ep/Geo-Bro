export class Router {
  constructor(contentDiv, routes) {
    this.contentDiv = contentDiv;
    this.routes = routes;
    this.currentView

    window.onpopstate = () => {
      this.handleLocation(location.pathname);
    };


  }

  async pageNavigation ( link , event ) {
    event.preventDefault();
    const path = link.getAttribute('href');
    await this.handleLocation(path);
    history.pushState(null, '', path);
  }

  async handleLocation(path) {
    const route = this.routes[path] || this.routes[404];
    const html = await fetch(route).then(response => response.text());
    this.currentView = path
    console.log(route ,path);
    this.contentDiv.innerHTML = html;
  }
}