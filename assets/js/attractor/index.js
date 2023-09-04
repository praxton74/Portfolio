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
    
    document.getElementById("seedOut").textContent = Math.round(attractor.getNoiseSeed());
}

function myFunction() {
    var element = document.body;
    element.classList.toggle("dark-mode");
  }
  

/**
 * @function
 * draw is called once every frame and will run attractor's run method
 */
function draw() {

    attractor.run();
     
}





/**
 * @function
 * when the Document object model is loaded, this function is created which adds event listeners for all sliders buttons and checkboxes
 */
document.addEventListener("DOMContentLoaded",function(){

    /**
     * @function
     * clear button - when clicked, calls clear function - also changes text of current blend mode back to blend
     */
    let clearBtn = document.getElementById("clearButton");
    function callClear () {
        attractor.clearButtonFunc();
        document.getElementById("blendOut").textContent = "Blend";
    }
    clearBtn.addEventListener("click",callClear)


    /**
     * @function
     * randomise button - when clicked, calls seed button function - this updates the seed - and also updates the text for the current seed and blend mode
     */
    let randomiseBtn = document.getElementById("randomiseButton");
    function callRandom () {
        attractor.clearButtonFunc();
        let x = attractor.seedButtonFunc();
        document.getElementById("seedOut").textContent = x;
        document.getElementById("blendOut").textContent = "Blend";
    }
    randomiseBtn.addEventListener("click",callRandom)

    /**
     * @function
     * blend button - when clicked, calls change blend mode function - which cycles through each blend mode (except two of them, which slow the web page down)
     */
    let blendBtn = document.getElementById("blendButton");
    function callBlend() {
        let name = attractor.changeBlendMode();
        document.getElementById("blendOut").textContent = name;
    }
    blendBtn.addEventListener("click",callBlend)

    /**
     * @function
     * total slider - runs update total particles function when slider is moved and updates the text box next to slider
     * I decrement the value as it appears to be one off when I ran the slider with small values
     */
    let totalSlider = document.getElementById("totalSlider");
    function setTotal(event){
        let totalVal = totalSlider.value;
        document.getElementById("totalSliderOut").textContent = (totalVal-1);
        attractor.updateTotalParticles(totalVal--);
    }
    totalSlider.addEventListener("input",setTotal);

    /**
     * @function
     * rate slider - runs rate setter for new rate value and updates text box next to slider
     */
    let rateSlider = document.getElementById("rateSlider");
    function setRate(event){
        let rateVal = rateSlider.value;
        document.getElementById("rateSliderOut").textContent = rateVal;
        attractor.setRate(rateVal);
    }
    rateSlider.addEventListener("input",setRate);

    /**
     * @function
     * mag slider - runs magnetism setter for new magnetism value and updates text box next to slider
     */
    let magSlider = document.getElementById("magSlider");
    function setMag(event){
        let magVal = magSlider.value;
        document.getElementById("magSliderOut").textContent = magVal;
        attractor.setMagnetism(magVal);
    }
    magSlider.addEventListener("input",setMag);

    /**
     * @function
     * dec slider - runs deceleration setter for new deceleration value and updates text box next to slider
     */
    let decSlider = document.getElementById("decSlider");
    function setDec(event){
        let decVal = decSlider.value;
        document.getElementById("decSliderOut").textContent = decVal;
        attractor.setDeceleration(decVal);
    }
    decSlider.addEventListener("input",setDec);



    /**
     * @function
     * radius slider - runs radius setter for new radius value and updates text box next to slider
     */
    let radiusSlider = document.getElementById("radiusSlider");
    function setRadius(event){
        let radiusVal = radiusSlider.value;
        document.getElementById("radiusSliderOut").textContent = radiusVal;
        attractor.setRadius(radiusVal);

    }
    radiusSlider.addEventListener("input",setRadius);


    /**
     * @function
     * red slider - runs red setter for new red value and updates text box next to slider
     */
    let redSlider = document.getElementById("redSlider");
    function setRed(event){
        let redVal = redSlider.value;
        document.getElementById("redSliderOut").textContent = redVal;
        attractor.setRed(redVal);
    }
    redSlider.addEventListener("input",setRed);

    /**
     * @function
     * green slider - runs green setter for new green value and updates text box next to slider
     */
    let greenSlider = document.getElementById("greenSlider");
    function setGreen(event){
        let greenVal = greenSlider.value;
        document.getElementById("greenSliderOut").textContent = greenVal;
        attractor.setGreen(greenVal);
    }
    greenSlider.addEventListener("input",setGreen);

    /**
     * @function
     * blue slider - runs blue setter for new blue value and updates text box next to slider
     */
    let blueSlider = document.getElementById("blueSlider");
    function setBlue(event){
        let blueVal = blueSlider.value;
        document.getElementById("blueSliderOut").textContent = blueVal;
        attractor.setBlue(blueVal);

    }
    blueSlider.addEventListener("input",setBlue);


    /**
     * @function
     * random checkbox - runs set rand colour setter which defines to boolean value of the checkbox - used to change colour of each particle
     * to a random colour on click
     */
    let randomCheckbox = document.getElementById("randColour");
    
    function setRandColour(event){
		if (randomCheckbox.checked){
			speedCheckbox.checked = false;
			attractor.setSpeedColour(speedCheckbox.checked);
		}
		attractor.setRandColour(randomCheckbox.checked);
        
    }
    randomCheckbox.addEventListener("change",setRandColour);


    /**
     * @function
     * speed checkbox - runs set speed colour setter which defines to boolean value of the checkbox - used to change colour of every particle
     * to a blue which moves towards white with increase in speed
     */
    let speedCheckbox = document.getElementById("speedColour");
    
    function setSpeedColour(event){
		if (speedCheckbox.checked){
			randomCheckbox.checked = false;
			attractor.setRandColour(randomCheckbox.checked);
		}
		attractor.setSpeedColour(speedCheckbox.checked);
        
    }
    speedCheckbox.addEventListener("change",setSpeedColour);



})
