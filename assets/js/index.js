/* eslint no-undef:0*/
/* eslint no-unused-vars:0*/

let attractor;

/**
 * @function
 * the setup function is ran when the page is loaded and instantiates the simulation class, updates the screen text for a default noise seed (which is random so has to be assigned here)
 * this.pg is avaiable to be imported as a param into simulation to use a different graphic as the render location
 */
function setup() {
    
    // Can be used as optional p5 renderer:
    this.pg = createGraphics(400, 250);  

    //attractor =  new Simulation({magnetism:10, deceleration:0.95, noiseScale:1500, total:200, radius:3, rate: 0.5, r:255, g:0, b:0, renderer: this.pg});             
    attractor =  new Simulation({magnetism:10, deceleration:0.95, noiseScale:1500, total:200, radius:3, rate: 0.5, r:255, g:0, b:0});    

}



/**
 * @function
 * draw is called once every frame and will run attractor's run method
 */
function draw() {

    attractor.run();
     
}