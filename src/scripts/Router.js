export class Router {
   constructor({ contentDiv }) {
      this.contentDiv = contentDiv;

      window.onpopstate = () => {
         this.loadPage(location.pathname);
      };
   }

   async loadPage(link , path) {
      history.pushState(null, "", link);
      const html = await fetch(path).then((response) => response.text());
      this.contentDiv.innerHTML = html;
   }
}
