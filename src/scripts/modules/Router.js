export class Router {
   constructor({ contentDiv }) {
      this.contentDiv = contentDiv;
   }

   async updatePage(path, data, server) {
      Object.entries(data).forEach((node)=>{
         const database = server.db
         db.set(ref(database,path), node)
      })
   }

   async loadPage(link , path) {
      history.pushState(null, "", link);
      const html = await fetch(path).then((response) => response.text());
      this.contentDiv.innerHTML = html;
   }
}
