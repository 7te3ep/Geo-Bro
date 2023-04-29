export class Router {
   constructor({ contentDiv, loader }) {
      this.contentDiv = contentDiv;
      this.loader = loader;

      window.onpopstate = () => {
         this.loadPage(location.pathname);
      };
   }

   async loadPage(link , route) {
      history.pushState(null, "", link);
      const html = await fetch(route).then((response) => response.text());
      this.contentDiv.innerHTML = html;
   }
}
