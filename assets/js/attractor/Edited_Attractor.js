/* eslint no-undef:0*/
/* eslint no-unused-vars:0*/

/*
 * Particle class in order to define attributes for each unqiue particle
 * For example - size, and spawn position
 */


/**
 * @constructor
 * @param  {numbers} {xPos  - x position of particles
 * @param  {numbers} yPos   - y position of particles
 * @param  {numbers} size   - size/ radius of particles
 * @param  {numbers} xSpeed - x speed of the particles
 * @param  {numbers} ySpeed - y speed of the particles
 * @param  {numbers} xAccn  - x acceleration of particles
 * @param  {numbers} yAccn  - y acceleration of particles
 * @param  {numbers} red    - red attribute of RGB
 * @param  {numbers} green  - green attribute of RGB
 * @param  {numbers} blue   - blue attribute of RGB
 * @param  {numbers} width  - width of screen
 * @param  {numbers} height - height of screen
 * @param  {numbers} renderer}   - optional renderer defined in construction of simulation class
 * constructor used to instantiate particles and assign default values if specific params havent been defined
 */
class Particle {

    constructor ({xPos, yPos, size, xSpeed, ySpeed, xAccn, yAccn, red, green, blue, width, height, renderer}) {

        this.renderer = renderer;

        if (this.renderer === undefined) {

            this.mainHeight = height || windowHeigh;
            this.mainWidth = width || windowWidth;

        } else {

            this.mainHeight = this.renderer.height;
            this.mainWidth = this.renderer.width;

        }
        this.xPos = xPos || random(this.mainWidth);
        this.yPos = yPos || random(this.mainHeight);

        this.xSpeed = xSpeed || 0;
        this.ySpeed = ySpeed || 0;
        this.xAccn = xAccn || 0;
        this.yAccn = yAccn || 0;

        Particle.prototype.r = red || 255;
        Particle.prototype.g = green || 0;
        Particle.prototype.b = blue || 0;

        this.flip = Math.round(Math.random() * 2) * 2 - 1;

        this.maxRandLifeVal = 20;
        this.minLifeVal = 10;
        this.maxLife = random(this.maxRandLifeVal) + this.minLifeVal;
        this.currLife = this.maxLife;
        this.maxColour = 255;
        this.alpha = 32;

        Particle.prototype.size = size || 3;


    }


    /**
     * @function
     * @param  {numbers} attracting - is the draw method running attractor function
     * checkDeath used to check death of particle by life span/ boundaries
     */
    checkDeath (attracting) {

        if (attracting) {

            this.currLife -= 0.05;

        }

        // Console.log("yposition death"+Math.round(this.yPos));
        if (this.currLife <= 0 || this.xPos > this.mainWidth || this.xPos < 0 || this.yPos + 10 > this.mainHeight - 200 || this.yPos < 0) {

            this.respawn();

        }


    }

    /**
     * @function
     * @param  {numbers} renderer - is the renderer defined in the setup of the Simulation class of the constructor which can be passed as a param into that constructor
     * @param  {numbers} speedColour - is the boolean value of the speed Colour checkbox
     * function used to colour particles depending on the two params provided
     */
    colorParticle (renderer, speedColour) {

        if (renderer === undefined) {

            if (speedColour) {

                const speed = dist(0, 0, this.xSpeed, this.ySpeed);
                this.Vr = map(speed, 0, 5, 0, 255);
                this.Vg = map(speed, 0, 5, 64, 255);
                this.Vb = map(speed, 0, 5, 128, 255);
                fill(this.Vr, this.Vg, this.Vb, 32);
                ellipse(this.xPos, this.yPos, this.size, this.size);


            } else {

                fill(this.r, this.g, this.b, this.alpha);
                ellipse(this.xPos, this.yPos, this.size, this.size);

            }


        } else {

            if (speedColour) {

                const speed = dist(0, 0, this.xSpeed, this.ySpeed);
                this.Vr = map(speed, 0, 5, 0, 255);
                this.Vg = map(speed, 0, 5, 64, 255);
                this.Vb = map(speed, 0, 5, 128, 255);
                renderer.fill(this.Vr, this.Vg, this.Vb, 32);
                renderer.ellipse(this.xPos, this.yPos, this.size, this.size);

            } else {

                renderer.fill(this.r, this.g, this.b, this.alpha);
                renderer.ellipse(this.xPos, this.yPos, this.size, this.size);

            }


        }

    }

    /**
     * @function
     * respawn used to respawn instance of particle at different position and assign it a new life length
     */
    respawn () {

        this.currLife = random(this.maxLifeVal) + this.minLifeVal;
        this.xPos = random(this.mainWidth);
        this.yPos = random(this.mainHeight - 200);

    }

    /**
     * @function
     * see below where getters and setters are defined for all variables for Particles class
     */
    getCurrLife () {

        return this.currLife;

    }

    getFlip () {

        // Dont need set this.flip as it is assigned on particle instantiation and shouldn't be changed
        return this.flip;

    }

    getXPos () {

        return this.xPos;

    }

    setXPos (value) {

        this.xPos = value;

    }

    getYPos () {

        return this.yPos;

    }

    setYPos (value) {

        this.yPos = value;

    }

    getXSpeed () {

        return this.xSpeed;

    }

    setXSpeed (value) {

        this.xSpeed = value;

    }

    getYSpeed () {

        return this.ySpeed;

    }

    setYSpeed (value) {

        this.ySpeed = value;

    }

    getXAccn () {

        return this.xAccn;

    }

    setXAccn (value) {

        this.xAccn = value;

    }

    getYAccn () {

        return this.yAccn;

    }

    setYAccn (value) {

        this.yAccn = value;

    }

    getRed () {

        return this.r;

    }

    setRed (value) {

        this.r = value;

    }

    getGreen () {

        return this.g;

    }

    setGreen (value) {

        this.g = value;

    }

    getBlue () {

        return this.b;

    }

    setBlue (value) {

        this.b = value;

    }


}

/**
 * @constructor
 * @param  {numbers} {magnetism  - strength of attractive force
 * @param  {numbers} deceleration- magnitude of deceleration of particles
 * @param  {numbers} noiseScale  - used in noise function to recieve a wider range of random values
 * @param  {numbers} renderer    - the optional renderer to allow project to be drawn on different image/canvas
 * @param  {numbers} total       - total number of particles to instantiate at the start
 * @param  {numbers} radius      - size of the particles
 * @param  {numbers} rate        - speed of Perlin noise movement
 * @param  {numbers} r    - red attribute of RGB
 * @param  {numbers} g  - green attribute of RGB
 * @param  {numbers} b   - blue attribute of RGB
 * constructor used to instantiate main class for project which will perform attractor and perlin noise functions
 */
class Simulation {

    constructor ({magnetism, deceleration, noiseScale, renderer, total, radius, rate, r, g, b}) {

		this.parent = document.getElementById("attractor")
        this.renderer = renderer || undefined;

        this.runOnce = false;
        this.attracting = false;

        if (this.renderer === undefined) {

            this.height = windowHeight - 300;
            this.width = this.parent.offsetWidth -30;

        } else {

            this.height = this.renderer.height;
            this.width = this.renderer.width;

        }

        this.rate = rate || 0.5;

        this.radius = radius || 3;
        this.maxColour = 255;

        this.r = r || 255;
        this.g = g || 0;
        this.b = b || 0;

        this.total = total || 200;

        this.randColour = false;

        this.magnetism = magnetism || 10;
        this.deceleration = deceleration || 0.95;

        this.particles = new Array(this.total);
        this.noiseScale = noiseScale || int(random(800, 2001));

        this.mouseX = mouseX;
        this.mouseY = mouseY;

        this.blendChange = 0;

        this.speedColour = false;

        //instantiates initial particles
        for (let particle = 0; particle < this.total; particle++) {

            this.particles[particle] = new Particle({"xPos": Math.round(Math.random() * this.width),
                "yPos": Math.round(Math.random() * this.height),
                "size": this.radius,

                "red": 255,
                "green": 0,
                "blue": 0,
                "renderer": this.renderer,
                "height": this.height+200,
                "width": this.width});


        }
		
        this.noiseSeed = 0;
		this.setup();
				
		let callback = this
		let width = this.parent.offsetWidth -30;
		let height = windowHeight - 300
		window.addEventListener("resize", function () {
			if (windowWidth > 400) {
				this.parent = document.getElementById("attractor")
				let newWidth = this.parent.offsetWidth -30

				if (width != newWidth || height != windowHeight - 300){
					
					callback.width 
					callback.width = newWidth;
					callback.height = windowHeight -300
					callback.setup();
					width = newWidth;
				}
			}
			
		});

    }

    /**
     * @function
     * general setup function used to initiate graphics related methods - which change depending on whether a canvas is provided
     */
    setup () {

		for (let i=0;i<this.particles.length;i++){
			this.particles[i].mainWidth = this.width;
			this.particles[i].mainHeight = this.height+200;
		}
		
        if (this.renderer === undefined) {

            this.canvas = createCanvas(this.width, this.height);
			this.canvas.parent("attractor");
			// this.canvas["canvas"].style.marginLeft= "10px";
			// this.canvas["canvas"].style.paddingRight= "15px";
            noStroke();
            fill(0);
            ellipseMode(RADIUS);
            background(0);
            blendMode(BLEND);

        } else {


            this.canvas = createCanvas(this.width * 2 / 3, this.height);
            this.canvas.parent("attractor");
            this.renderer.noStroke();
            this.renderer.fill(0);
            this.renderer.ellipseMode(RADIUS);
            this.renderer.background(0);
            this.renderer.blendMode(BLEND);


        }
        this.noiseSeed = random() * 100000;
        noiseSeed(this.noiseSeed);


    }

    /**
     * @function
     * attractor runs original attractor code, which moves paricles towards mouse position 
     * has been updated to account for getters and setters
     */

    attractor () {

        this.attracting = true;

        for (let i = 0; i < this.total; i++) {

            const distance = dist(this.mouseX, this.mouseY, this.particles[i].getXPos(), this.particles[i].getYPos());

            if (distance > 3) {

                this.particles[i].setXAccn(this.magnetism * (this.mouseX - this.particles[i].getXPos()) / (distance * distance));
                this.particles[i].setYAccn(this.magnetism * (this.mouseY - this.particles[i].getYPos()) / (distance * distance));

            }
            this.particles[i].setXSpeed(this.particles[i].getXSpeed() + this.particles[i].getXAccn());
            this.particles[i].setYSpeed(this.particles[i].getYSpeed() + this.particles[i].getYAccn());

            this.particles[i].setXSpeed(this.particles[i].getXSpeed() * this.deceleration);
            this.particles[i].setYSpeed(this.particles[i].getYSpeed() * this.deceleration);

            this.particles[i].setXPos(this.particles[i].getXPos() + this.particles[i].getXSpeed());
            this.particles[i].setYPos(this.particles[i].getYPos() + this.particles[i].getYSpeed());


            if (!this.randColour) {

                this.particles[i].setRed(this.r);
                this.particles[i].setGreen(this.g);
                this.particles[i].setBlue(this.b);

            }

            this.particles[i].colorParticle(this.renderer, this.speedColour);
            this.particles[i].checkDeath(false);

        }


    }


    /**
     * @function
     * perlin noise function randomly generates an angle for the particle to move based on the noise seed and noise scale
     * Therefore when it switches to the attractor function (when the mouse is pressed), the particles are in a different (random) position
     * used getters and setters
     */
    perlinNoise () {


        for (let i = 0; i < this.total; i++) {

            const angle = noise(this.particles[i].getXPos() / this.noiseScale, this.particles[i].getYPos() / this.noiseScale) * 2 * Math.PI * this.noiseScale * this.particles[i].getFlip();

            this.particles[i].setXSpeed(lerp(this.particles[i].getXSpeed(), Math.cos(angle) * this.rate, 0.4));
            this.particles[i].setYSpeed(lerp(this.particles[i].getYSpeed(), Math.sin(angle) * this.rate, 0.4));

            this.particles[i].setXPos(this.particles[i].getXPos() + this.particles[i].getXSpeed());
            this.particles[i].setYPos(this.particles[i].getYPos() + this.particles[i].getYSpeed());


            if (!this.randColour) {

                this.particles[i].setRed(this.r);
                this.particles[i].setGreen(this.g);
                this.particles[i].setBlue(this.b);

            }

            this.particles[i].colorParticle(this.renderer, this.speedColour);

            this.particles[i].checkDeath(true);

            smooth();

        }


    }

    /**
     * @function
     * @param {Objects} renderer - optional p5 renderer - which allows renderer to be imported
     * run is essentially the draw method
     * draws a rectangle to get the particles to fade
     * checks mouse up or down and runs perlin noise/ attractor functions accordingly
     * also calls randomcheck event if that checkbox is ticked each time the mouse is clicked
     */
    run (renderer) {

        if (renderer !== undefined) {

            this.renderer = renderer;

        }
        // Black rectangle which also gets trail to fade

        if (this.renderer === undefined) {

            fill(0, 0, 0, 5);
            rect(0, 0, this.width, this.height + 100);

        } else {

            this.renderer.fill(0, 0, 0, 5);
            this.renderer.rect(0, 0, this.width, this.height);

        }

        if (mouseIsPressed === false) {

            this.perlinNoise();

            this.runOnce = false;

        } else if (mouseY < this.height + 100) {

            this.mouseX = mouseX;
            this.mouseY = mouseY;

            if (this.randColour === true && this.runOnce === false) {

                for (let i = 0; i < this.total; i++) {

                    this.particles[i].colorParticle(this.renderer, this.speedColour);
                    // Console.log('Checking!');

                }
                if (this.randColour) {

                    this.randomCheckEvent();

                }
                this.runOnce = true;

            }
            this.attractor();


        }

        if (this.renderer !== undefined) {

            image(this.renderer, 0, 0);

        }

    }

    /**
     * @function
     * clears all drawing on screen by overlaying black rectangle and respawning particles
     */
    clearButtonFunc () {

        if (this.renderer === undefined) {

            blendMode(BLEND);
            fill(0, 0, 0);
            rect(0, 0, this.width, this.height + 100);
            for (let i = 0; i < this.total; i++) {

                this.particles[i].respawn();

            }

        } else {

            this.renderer.blendMode(BLEND);
            this.renderer.fill(0, 0, 0);
            this.renderer.rect(0, 0, this.width, this.Height);
            for (let i = 0; i < this.total; i++) {

                this.particles[i].respawn();

            }

        }

    }

    /**
     * @function
     * updates the noise seed for the perlin noise function so particles move in a different random direction
     */
    seedButtonFunc () {

        this.noiseSeed = random() * 100000;
        noiseSeed(this.noiseSeed);

        return Math.round(this.noiseSeed);

    }


    /**
     * @function
     * update total particles finds difference between current total and the slider value and instantiates/ deletes particles accordingly
     */
    updateTotalParticles (value) {


        if (this.total < value) {

            for (let i = this.total; i < value; i++) {


                this.particles[i] = new Particle({"xPos": Math.round(Math.random() * this.width),
                    "yPos": Math.round(Math.random() * this.height),

                    "red": this.r,
                    "green": this.g,
                    "blue": this.b,
                    "size": this.radius,
                    "renderer": this.renderer,
                    "height": this.height+200,
                    "width": this.width});

            }

            this.total = value;


        } else if (this.total > value) {

            for (let i = this.total; i > value; i--) {

                delete this.particles[i];

            }
            this.total = value;

        }

    }

    /**
     * @function
     * if the checkbox for random colours on click is checked, this will be ran after each click, which randomises the RGB of each particle
     */
    randomCheckEvent () {

        // When checked randomise colour with each click
        for (let i = 0; i < this.total; i++) {

            this.particles[i].setRed(Math.round(random(this.maxColour)));
            this.particles[i].setGreen(Math.round(random(this.maxColour)));
            this.particles[i].setBlue(Math.round(random(this.maxColour)));

        }

        this.runOnce = true;


    }

    /**
     * @function
     * when button to change blend mode is clicked, this function is ran, which cycles through every blend mode with a switch statement
     */
    changeBlendMode () {

        this.blendChange++;
        if (this.renderer === undefined) {

            switch (this.blendChange % 12) {

            default:
                blendMode(BLEND);
                return "Blend";
            case 1:
                blendMode(ADD);
                return "Add";
            case 2:
                blendMode(LIGHTEST);
                return "Lightest";
            case 3:
                blendMode(DIFFERENCE);
                return "Difference";
            case 4:
                blendMode(EXCLUSION);
                return "Exclusion";
            case 5:
                blendMode(MULTIPLY);
                return "Multiply";
            case 6:
                blendMode(SCREEN);
                return "Screen";
            case 7:
                blendMode(OVERLAY);
                return "Overlay";
            case 8:
                blendMode(HARD_LIGHT);
                return "Hard Light";
            case 9:
                blendMode(SOFT_LIGHT);
                return "Soft Light";
            case 10:
                blendMode(DODGE);
                return "Dodge";
            case 11:
                blendMode(BURN);
                return "Burn";

            }

        } else {

            switch (this.blendChange % 12) {

            default:
                this.renderer.blendMode(BLEND);
                return "Blend";
            case 1:
                this.renderer.blendMode(ADD);
                return "Add";
            case 2:
                this.renderer.blendMode(LIGHTEST);
                return "Lightest";
            case 3:
                this.renderer.blendMode(DIFFERENCE);
                return "Difference";
            case 4:
                this.renderer.blendMode(EXCLUSION);
                return "Exclusion";
            case 5:
                this.renderer.blendMode(MULTIPLY);
                return "Multiply";
            case 6:
                this.renderer.blendMode(SCREEN);
                return "Screen";
            case 7:
                this.renderer.blendMode(OVERLAY);
                return "Overlay";
            case 8:
                this.renderer.blendMode(HARD_LIGHT);
                return "Hard Light";
            case 9:
                this.renderer.blendMode(SOFT_LIGHT);
                return "Soft Light";
            case 10:
                this.renderer.blendMode(DODGE);
                return "Dodge";
            case 11:
                this.renderer.blendMode(BURN);
                return "Burn";

            }

        }

    }

    /**
     * @function
     * see below where getters and setters are defined for all variables for Particles class
     */
    getNoiseSeed () {

        return this.noiseSeed;

    }

    setRandColour (value) {

        this.randColour = value;

    }

    getTotal () {

        return this.total;

    }

    setTotal (value) {

        this.total = value;

    }

    getMagnetism () {

        return this.magnetism;

    }

    setMagnetism (value) {

        this.magnetism = value;

    }

    getDeceleration () {

        return this.deceleration;

    }

    setDeceleration (value) {

        this.deceleration = value;

    }

    getRadius () {

        return this.radius;

    }

    setRadius (value) {

        this.radius = value;
        Particle.prototype.size = value;

    }

    getRate () {

        return this.rate;

    }

    setRate (value) {

        this.rate = value;

    }

    getRed () {

        return this.r;

    }

    setRed (value) {

        this.r = value;
        Particle.prototype.r = value;

    }

    getGreen () {

        return this.g;

    }

    setGreen (value) {

        this.g = value;
        Particle.prototype.g = value;

    }

    getBlue () {

        return this.b;

    }

    setBlue (value) {

        this.b = value;
        Particle.prototype.b = value;

    }

    setRenderer (value) {

        this.renderer = value;

    }

    getRenderer () {

        return this.renderer;

    }

    setSpeedColour (value) {

        this.speedColour = value;

    }

    getSpeedColour () {

        return this.speedColour;

    }

}

