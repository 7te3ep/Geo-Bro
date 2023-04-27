export class Router {
  constructor(contentDiv, routes, loader) {
    this.contentDiv = contentDiv;
    this.routes = routes;
    this.currentView;
    this.loader = loader;

    window.onpopstate = () => {
      this.handleLocation(location.pathname);
    }
  }

  async pageNavigation ( link , event ) {
    event.preventDefault();
    const path = link.getAttribute('href');
    await this.handleLocation(path);
    history.pushState(null, '', path);
  }

  async handleLocation(path) {
    const route = this.routes[path] || this.routes[404];
    this.loader(true)
    const html = await fetch(route).then(response => response.text());
    this.loader(false)
    this.currentView = path
    console.log(route ,path);
    this.contentDiv.innerHTML = html;
  }
}