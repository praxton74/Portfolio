class sudoku{

	constructor(){

		this.grid = []
		this.tempGrid = []
		
		
	}


    // // https://www.youtube.com/watch?v=G_UYXzGuqvM
	solve(grid){
		// this.grid[0][0] = 8
		// // this.solve()


		// return
		for (let i=0;i<=8;i++){
			for (let j=0;j<=8;j++){
				if (grid[i][j]==0){
					for (let k=1;k<=9;k++){
						if (this.possible(i,j,k)){
							grid[i][j] = k
							this.solve(grid)
							grid[i][j] = 0
							
						}
					}
					return
				}
			}
		}
		this.grid = JSON.parse(JSON.stringify(grid))
	}
	possible(x,y,n){
		`Is n possible in position x,y`
		for (let i=0;i<9;i++){
			if (this.grid[x][i] == n){
				return false
			}
			if (this.grid [i][y]==n){
				return false
			}
		}

		let x0 = (Math.floor(x/3))*3
		let y0 = (Math.floor(y/3))*3

		for (let i=0;i<=2;i++){
			for (let j=0;j<=2;j++){
				if (this.grid[x0+i][y0+j]==n){
					return false
				}
			}
		}

        return true
	}


}



let model;


class imagingExtraction{

	constructor(img,threshValue=130){
		this.size = new cv.Size(28, 28)
		this.img = cv.imread(img);

		
		this.initialImaging(threshValue)

		this.lineDetection()

        // contours, hierarchy = cv2.findContours(thresholdGray,cv2.RETR_TREE,cv2.CHAIN_APPROX_SIMPLE)
        // img = cv2.drawContours(img, contours, -1, (0,255,0), 3)

        this.drawLines()

        this.findDifferences()

        // print("Y Mean:",np.mean(Ydiffs),"Y Median",np.median(Ydiffs))
        // print("X Mean:",np.mean(Xdiffs),"X Median",np.median(Xdiffs))

		let success = this.findBoxes()
		
		if (!success){
			this.img = cv.imread(img);
			threshValue = 225
			this.initialImaging(threshValue)

			this.lineDetection()

			// contours, hierarchy = cv2.findContours(thresholdGray,cv2.RETR_TREE,cv2.CHAIN_APPROX_SIMPLE)
			// img = cv2.drawContours(img, contours, -1, (0,255,0), 3)

			this.drawLines()

			this.findDifferences()
			this.findBoxes()

		}
		// predict


            // this.finalGrid = np.array(self.finalGrid)

		this.predict()
		
		updateGridHTML(this.finalGrid)
		updateGridObject(sudokuGrid.grid)

		
		let r = (window.innerHeight/2 ) / this.img.rows
		let dim = [Math.round(this.img.cols * r), (window.innerHeight/2 )]
		cv.resize(this.img,this.img, new cv.Size(dim[0], dim[1]),0,0)
		cv.imshow('canvasOutput', this.img);
		// this.img.delete()
		// this.hardThreshold.delete()
		// this.thresholdGray.delete()
		// this.gray.delete()
		// this.edges.delete()
		// this.lines.delete()

		
	}
	auto_canny(image, sigma=0.33){

		// compute the median of the single channel pixel intensities
		// let v = [].concat.apply([], image.data);
		// let v = median(image.data)
		let v=255
		
		// apply automatic Canny edge detection using the computed median
		let lower = Math.round(Math.max(0, (1.0 - sigma) * v))
		let upper = Math.round(Math.min(255, (1.0 + sigma) * v))

		let edged = new cv.Mat()
		cv.Canny(image,edged, lower, upper,3,false)
		// return the edged image
		return edged
	}


	initialImaging(threshValue){

		if (this.img.rows > 750){
			cv.resize(this.img,this.img, new cv.Size(0, 0),0.4,0.4)
		}
        else {
			// Initialize arguments for the filter
            let top = Math.round(0.01 * this.img.rows)  // shape[0] = rows
            let bottom = top
            let left = Math.round(0.01 * this.img.cols)  // shape[1] = cols
			let right = left
			// cv.copyMakeBorder(src, dst, 10, 10, 10, 10, cv.BORDER_CONSTANT, s);
            cv.copyMakeBorder(this.img,this.img, top, bottom, left, right, cv.BORDER_CONSTANT, new cv.Scalar(0, 0, 0, 255))

		}
		this.gray = new cv.Mat()

		cv.cvtColor(this.img, this.gray, cv.COLOR_BGR2GRAY)

        // cv.GaussianBlur(this.gray,this.gray, new cv.Size(1, 1), cv.BORDER_DEFAULT)

		this.hardThreshold = new cv.Mat()
		this.thresholdGray = new cv.Mat()

        cv.threshold(this.gray,this.thresholdGray, threshValue, 255, cv.THRESH_BINARY_INV)

		// 130 or 225
        cv.threshold(this.gray,this.hardThreshold, 200, 255, cv.THRESH_BINARY_INV)
	}
	lineDetection(){
        // https://opencv-python-tutroals.readthedocs.io/en/latest/py_tutorials/py_imgproc/py_houghlines/py_houghlines.html


        // edges = cv2.Canny(thresholdGray,100,200, apertureSize=3)
		this.edges = this.auto_canny(this.thresholdGray)
		this.lines = new cv.Mat();
		cv.HoughLines(this.edges,this.lines, 1, Math.PI / 180, 145, 0, 0, 0, Math.PI)

	}
	drawLines(){
        this.horizontal = []
        this.vertical = []

        for (let i=0;i<this.lines.rows; i++){
			let rho = this.lines.data32F[i * 2];
			let theta = this.lines.data32F[i * 2 + 1];

			let a = Math.cos(theta);
			let b = Math.sin(theta);
			let x0 = a * rho;
			let y0 = b * rho;
			let startPoint = {x: x0 - 1000 * b, y: y0 + 1000 * a};
			let endPoint = {x: x0 + 1000 * b, y: y0 - 1000 * a};

            if (1.55 < theta && theta < 1.58) {
				this.horizontal.push(rho);
				cv.line(this.img, startPoint, endPoint, [255, 0, 0, 255],2);
			}

            else if (theta < 0.05) {
				this.vertical.push(rho)
				cv.line(this.img, startPoint, endPoint, [255, 0, 0, 255],2);
				
			}

		}
		this.vertical.sort(function(a,b){
			return a-b
		})
		this.horizontal.sort(function(a,b){
			return a-b
		})

	}

	findDifferences(){

		let largestXDiff = 0
		this.Xdiffs = []
		for (let i=this.vertical.length - 1;i>0;i--){
			let diff = this.vertical[i] - this.vertical[i - 1]
			// print(this.vertical[i],this.vertical[i-1],diff)
			if (diff > largestXDiff) largestXDiff = diff
			this.Xdiffs.push([Math.round(this.vertical[i - 1]), Math.round(this.vertical[i]), diff])
		}
			// Xdiffs.append(diff)
		this.Xdiffs.sort(function(a,b){
			return a[0]-b[0]
		})
		// print("\n\n\n\nYDiffs")
		let largestYDiff = 0
		this.Ydiffs = []
		for (let i=this.horizontal.length - 1;i>0;i--){
			let diff = this.horizontal[i] - this.horizontal[i - 1]
			// print(this.horizontal[i],this.horizontal[i-1],diff)
			if (diff > largestYDiff) largestYDiff = diff
			this.Ydiffs.push([Math.round(this.horizontal[i - 1]), Math.round(this.horizontal[i]), diff])
			// Ydiffs.append(diff)
		}
		this.Ydiffs.sort(function(a,b){
			return a[0]-b[0]
		})
		// print(Ydiffs)
	}


    findBoxes(){
		let only_diffs = []
		let only_diffs2 = []
		for (let i=0;i<this.Ydiffs.length;i++){
			if (this.Ydiffs[i][2] > 5){
				only_diffs.push(this.Ydiffs[i][2])
			}
		}
		for (let i=0;i<this.Xdiffs.length;i++){
			if (this.Xdiffs[i][2] > 5){
				only_diffs2.push(this.Xdiffs[i][2])
			}
		}

		let boxMax;
		let boxMin;

        if (this.img.rows < 400){
            boxMin = Math.round(Math.ceil((mean([mean(only_diffs), median(only_diffs), mean(only_diffs2), median(only_diffs2)])) * 0.6))
            // boxMax = Math.round((mean([mean(only_diffs),median(only_diffs),mean(only_diffs2),median(only_diffs2)]))*1.5)
            boxMax = Math.round(Math.ceil((mean([mean(only_diffs), median(only_diffs), mean(only_diffs2), median(only_diffs2)])) * 1.7))
		}
        else{
            boxMin = Math.round(Math.ceil((mean([mean(only_diffs), median(only_diffs), mean(only_diffs2), median(only_diffs2)])) * 0.7))
            // boxMax = Math.round((mean([mean(only_diffs),median(only_diffs),mean(only_diffs2),median(only_diffs2)]))*1.5)
            boxMax = Math.round(Math.ceil((mean([mean(only_diffs), median(only_diffs), mean(only_diffs2), median(only_diffs2)])) * 1.3))
		}

        // print(boxMin, boxMax)
        // print(this.Ydiffs)
        // print(this.Xdiffs)
        let image = 1
        this.finalGrid = []
        this.means = []
		for (let i=0;i<this.Ydiffs.length;i++){
            let regions = []
			if (this.finalGrid.length == 9) break

            if (this.Ydiffs[i][2] > boxMin && this.Ydiffs[i][2] < boxMax){

                for (let j=0;j< this.Xdiffs.length;j++){
					if (regions.length == 9) break
					
                    if (this.Xdiffs[j][2] > boxMin && this.Xdiffs[j][2] < boxMax){

						// You can try more different parameters
						// let rect = new cv.Rect(100, 100, 200, 200);
						// dst = src.roi(rect);

						// RECT is of form (xCoordinate , yCoordinate, width, height)
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
						// let rect = new cv.Rect(this.Ydiffs[j][0], this.Xdiffs[i][0], this.Ydiffs[j][1]-this.Ydiffs[j][0], this.Xdiffs[i][1]-this.Xdiffs[i][0]);
						let rect = new cv.Rect(this.Xdiffs[j][0],this.Ydiffs[i][0], this.Xdiffs[j][1]-this.Xdiffs[j][0], this.Ydiffs[i][1]-this.Ydiffs[i][0]);

                        let roi = this.hardThreshold.roi(rect)

                        cv.resize(roi,roi, this.size,0,0,cv.INTER_AREA)

                        if (mean(roi.data) < 100) cv.bitwise_not(roi,roi)

						roi = roi.roi(new cv.Rect(3,3,25,25))
						
						// let tempROI = roi.roi(new cv.Rect(0,0,roi.cols-1,1))

						// // rows,cols
						// while (mean2d(tempROI) < 100) {
						// 	roi = roi.roi(new cv.Rect(1,0,roi.cols-1,roi.rows))
						// 	tempROI = roi.roi(new cv.Rect(0,0,roi.cols-1,1))

						// }

						// tempROI = roi.roi(new cv.Rect(0,0,1,roi.rows-1))
						
						// while (mean2d(tempROI) < 100) {
						// 	roi = roi.roi(new cv.Rect(0,1,roi.cols,roi.rows-1))
						// 	tempROI = roi.roi(new cv.Rect(0,0,1,roi.rows-1))
						// }
						

						cv.resize(roi,roi, this.size,0,0,cv.INTER_AREA)
                        // cv2.imshow("roi"+str(image),roi)
                        // print(image,np.mean(roi))
						this.means.push(mean2d(roi.roi(new cv.Rect(4,4,roi.rows-4,roi.cols-4))))
						
                        regions.push(roi)
						image += 1
					}
				}

            if (regions.length == 9) this.finalGrid.push(regions)
            else{
                if (regions.length == 0) continue
                //print("region length", len(regions))
                if (regions.length < 9) return false// ERROR
                    // for i in range(len(regions)):
					//     cv2.imshow(str(i), regions[i])
				}
			}
		}

		// cv.imshow('canvasOutput2', this.finalGrid[2][0]);
		// cv.imshow('canvasOutput3', this.finalGrid[2][1]);
		// cv.imshow('canvasOutput4', this.finalGrid[2][2]);
		// cv.imshow('canvasOutput5', this.finalGrid[2][3]);
		// cv.imshow('canvasOutput6', this.finalGrid[2][4]);
		// cv.imshow('canvasOutput7', this.finalGrid[2][5]);
		// cv.imshow('canvasOutput8', this.finalGrid[2][6]);
		// cv.imshow('canvasOutput9', this.finalGrid[2][7]);
		// cv.imshow('canvasOutput10', this.finalGrid[2][8]);
		return true
					
	}

	predict(){

		let values = []
		let tempValues = []
		for (let i=0; i<this.means.length;i++){
			if (this.means[i] < 245){


				let tempImage = tf.tensor1d(this.finalGrid[Math.floor(i / 9)][i % 9].data)

				const predictOut = model.predict(tempImage.reshape([1,28,28,1]))
				const yPred = predictOut.argMax(-1);

				tempValues.push(yPred.dataSync()[0]+1)
			}

			else{

				tempValues.push(0)

			}
			if (tempValues.length ==9){
				values.push(tempValues)
				tempValues = []
			}
		}


		this.finalGrid = JSON.parse(JSON.stringify(values))

	}


}
function median (array){
	if (array.length==0) return 0

	array.sort()
	let half = Math.floor(array.length /2)
	if (array % 2 ==0) return array[half]
	return Math.round((array[half-1] + array[half] )/2)
}
function mean(array){
	
	let sum = array.reduce((a, b) => a + b, 0)
	return sum/array.length
}
function mean2d(array){
	return mean(array.data)
}

var sudokuGrid;

function updateGridObject(grid){
	grid = []
	for (let i=0;i<9;i++){
		let row = document.getElementById("row"+(i+1)).children
		grid[i] = [] 
		for (let j=0;j<9;j++){

			if (row.item(j).innerHTML == ""){
				grid[i][j] = 0
			}
			else{
				grid[i][j] = parseInt(row.item(j).innerHTML)

			}
		}
		// grid.grid.push(rowArray)

	}
	console.log("updating object")

	sudokuGrid.grid = grid
}
function updateGridHTML(grid){
	for (let i=0;i<9;i++){
		let row = document.getElementById("row"+(i+1)).children

		for (let j=0;j<9;j++){


			if (grid[i][j].toString()=="0"){
				row.item(j).innerHTML = ""
			}
			else{
				row.item(j).innerHTML = grid[i][j].toString()

			}
		}
		// grid.grid.push(rowArray)

	}
	console.log("updating HTML")

}

function clearGridHTML(){
	document.getElementById("fileInput").value = null;
	const context = document.getElementById("canvasOutput").getContext('2d');

	context.clearRect(0, 0, document.getElementById("canvasOutput").width, document.getElementById("canvasOutput").height);
	context.fillStyle = '#e6e6e6';
	context.fillRect(0,0,260,560);

	for (let i=0;i<9;i++){
		let row = document.getElementById("row"+(i+1)).children

		for (let j=0;j<9;j++){
			row.item(j).innerHTML = ""
			
		}
		// grid.grid.push(rowArray)

	}
	updateGridObject(sudokuGrid.grid)
}

function onOpenCvReady() {
	document.getElementById('status').innerHTML = 'If you would like to import an image of a sudoku,<br> please enter the file below';
  }

let keypressed = {}
document.addEventListener("DOMContentLoaded",function(){
	const context = document.getElementById("canvasOutput").getContext('2d');

	context.fillStyle = '#e6e6e6';
	context.fillRect(0,0,260,560);



	sudokuGrid = new sudoku()
	updateGridObject(sudokuGrid.grid)
	

	// Key events and animations
	document.onkeydown = function (ev) {

		// https://stackoverflow.com/questions/35394937/keyboardevent-keycode-deprecated-what-does-this-mean-in-practice
		/*
		var code;
		if (ev.key !== undefined) {
			code = ev.key;
			if (code >=0 && code <=9){
				updateGridObject(sudokuGrid.grid)
			}
		} 
		else if (ev.keyIdentifier !== undefined) {
			code = ev.keyIdentifier;
			if (code >=0 && code <=9){
				updateGridObject(sudokuGrid.grid)
			}
		} 
		else if (ev.keyCode !== undefined) {
			code = ev.keyCode;

			// 48 is 0
			// 49 is 1 etc
			if (code >=48 && code <=57){
				updateGridObject(sudokuGrid.grid)
			}
		}


		// for events on update/ multi key presses
		keypressed[code] = true;*/

	}

	let solveBtn = document.getElementById("solveButton")
	function solve (){

		updateGridObject(sudokuGrid.grid)
		sudokuGrid.solve(sudokuGrid.grid)

		updateGridHTML(sudokuGrid.grid)
	}
	solveBtn.addEventListener("click",solve)

	let clearBtn = document.getElementById("clearButton")

	clearBtn.addEventListener("click",clearGridHTML)



	// TODO: Add step-by-step animation of how backtracking works - with skip one step, skip 10 steps or skip 100 steps

	let imgElement = document.getElementById('imageSrc');
	let inputElement = document.getElementById('fileInput');
	inputElement.addEventListener('change', (e) => {
	  imgElement.src = URL.createObjectURL(e.target.files[0]);
	}, false);
	imgElement.onload = function() {
		let image = new imagingExtraction(imgElement)


	};

	async function initModel(){
		// return await tf.models.modelFromJSON(myModelJSON)
		model = await tf.loadLayersModel('https://raw.githubusercontent.com/Julian-Wyatt/Sudoku/master/Model/js/model.json');
	}

	initModel()


});
