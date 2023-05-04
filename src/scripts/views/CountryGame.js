export class CountryGame {
   constructor(server, authUser, router){
      this.getEl = id => document.getElementById(id) 
      this.elements = {}
      this.link = "/country"
      this.path = "views/countryGames.html"
      this.server = server
      this.authUser = authUser
      this.router = router
   }

   async update() {
      const userData = (await this.server.getData(`users/${this.authUser.uid}`)).data
   }

   async init() {
      await this.router.loadPage(this.link,this.path)
      const width = window.innerWidth
      const height = window.innerHeight

      const projection = d3.geoMercator()
        .translate([width / 2, height / 2])
        .scale(width/5);

      const path = d3.geoPath()
        .projection(projection);

      const zoom = d3.zoom()
        .scaleExtent([1, 18])
        .on('zoom', ()=>g.attr('transform', d3.event.transform));

      const svg = d3.select('#content')
         .append('svg')
         .attr('width', width)
         .attr('height', height);

      const g = svg.append('g');

      svg.call(zoom);

      d3.json('../assets/countries.geo.json')
      .then(world => {
        g.selectAll('.country')
          .data(world.features)
          .enter().append('path')
          .attr("id", d => d.properties.name)
          .attr('class', 'country')
          .attr('d', path)
          .style("fill", function(){return "rgb("+Math.random()*255+","+Math.random()*255+","+Math.random()*255+")"})
          .on("click",(e)=>{
            pathClicked(e)
          });
      });

   d3.select("svg").attr('id',"map").on("dblclick.zoom", null); // Désactive le zoom avec un double click               
   }

   async quit() {
      
   }
}