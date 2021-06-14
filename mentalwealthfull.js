const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

canvas.width = window.innerHeight * 0.5625; //width of game area (450)
canvas.height = window.innerHeight; //height of game area (800)
let canvasRatio = canvas.height / canvas.width;
let txtMultiplier = (canvas.width/450);
let borderBuffer = canvas.width * 0.02; //used to evenly space objects around the canvas
let canvasPos = canvas.getBoundingClientRect();

function resize() {
	
	if ((canvas.width > 1.125) && (canvas.height > 2))
	{
		var canvasRatio = canvas.height / canvas.width;
		var windowRatio = window.innerHeight / (window.innerHeight * 0.5625);
		var width;
		var height;

		if (windowRatio < canvasRatio) {
			height = window.innerHeight;
			width = height / canvasRatio;
		} else {
			width = window.innerHeight * 0.5625;
			height = width * canvasRatio;
		}
		
	/* 	if ((height < 2) || (width < 1))
		{
			width = 1.125;
			height = 2;
		} */

		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';
		canvas.width = width;
		canvas.height = height;
		canvasRatio = canvas.height / canvas.width;
		txtMultiplier = (canvas.width/450);
		borderBuffer = canvas.width * 0.02;
		canvasPos = canvas.getBoundingClientRect()
		updateAll();
	}
};

window.addEventListener('resize', resize, false);

let username = ""; //stores name for use in the PDF at the end

let gameFrame = 0; //counts the amount of frames the game has been active for
let frameTimer = 150; //timer that counts down by 1 each frame when above 0, used for animations and transitions
let walkTime = 50; //amount of frames the player will walk between questions
let danceTime = 40; //amount of frames player will celebrate after select an option
let fadeTimeTrue = 202; //time to reset the timer to for fading transistions
let fadeTime = 202; //timer for fading in and out
let fadeRound = 0; //used to display which round is coming up next, not which round is currently active
let clickBuffer = 5; //stops mashing clicks
let clickBufferCheck = 0; //counts down by 1 every frame when above zero, to check if another click can be made
let currentRound = 0; //number currently active round
let totalRounds = 0; //amount of rounds in total
let endOfQuestions = false; //determines when the player is at the end of all questions
let gameOver = false; //used to know when the entire questionnaire is complete, stops multiple PDFs from being generated
let fadeAway = false; //used to check whether a fade transition is currently happening

//arrays
let aButtons = []; //stores buttons that are currently on screen
let aRounds = []; //stores each round of questions
let txtArea = []; //stores text boxes when needed

//Mouse

const mouse = {
	x: canvas.width/2,
	y: canvas.height/2,
	click: false
};

function checkBorders(b) //for checking if a click is within the border of a button
{
	var inBorder = false;
	
	if (((mouse.x >= b.x) && (mouse.x <= (b.x + b.width))) && ((mouse.y >= b.y) && (mouse.y <= (b.y + b.height))))
	{
		inBorder = true;
	}
	
	return inBorder; //returns false if not in border, true if in border
}

canvas.addEventListener('mousedown', function(event) //what happens when the mouse is clicked/screen is tapped
{	
	mouse.click = true;
	mouse.x = event.x - canvasPos.left; //get x position of mouse
	mouse.y = event.y - canvasPos.top; //get y position of mouse
	
	if ((aButtons.length > 0)) //if there are buttons of screen
	{
		var pass = false;
		for (var i = 0; i < aButtons.length; i++) //for each button on screen
		{		
			if (pass == false) //if we have no already clicked a button
			{
				pass = checkBorders(aButtons[i]); //check if we are inside the boundries of current button
				if (pass == true) //if we are, the button is clicked
				{
					aButtons[i].clicked();
				}
			}	
		}
	}
});
canvas.addEventListener('mouseup', function(event)
{
	mouse.click = false;
});

//
//questions
//

class Question
{
	
	constructor(txt, type, qNum, pRound)
	{
		this.txt = txt; //question text // canvas cannot wrap text so text is stored in an array line by line
		this.type = type; //type of question // 0 : True/False // 1 : Written answer // 2 : 1 to 5
		this.qNum = qNum; //question's number in the round
		this.pRound = pRound; //round that the question is a part of
		this.answer = 0; //score/answer for the question
	}
	
	activate(testNum)
	{
		switch (this.type) //determine which buttons to make based on what type of question this is
		{
			case 2:
				this.b1 = new Bttn(0.0555, 0.375, 0.1333, 0.1333, "1", 1, 2);
				this.b2 = new Bttn(0.2444, 0.375, 0.1333, 0.1333, "2", 2, 2);
				this.b3 = new Bttn(0.4333, 0.375, 0.1333, 0.1333, "3", 3, 2);
				this.b4 = new Bttn(0.6222, 0.375, 0.1333, 0.1333, "4", 4, 2);
				this.b5 = new Bttn(0.8111, 0.375, 0.1333, 0.1333, "5", 5, 2);
				aButtons.push(this.b1);
				aButtons.push(this.b2);
				aButtons.push(this.b3);
				aButtons.push(this.b4);
				aButtons.push(this.b5);
				break;				
			
			case 1:
				txtArea.push(new TextBox(1, "textarea", 0.01, 0.1111));
				this.bSubmit = new Bttn(0.3444, 0.4625, 0.3333, 0.0625, "SUBMIT", 0, 1);
				aButtons.push(this.bSubmit);
				break;
				
			default:
				this.bTrue = new Bttn(0.1111, 0.36, 0.3333, 0.075, "YES", 1, 0);
				this.bFalse = new Bttn(0.5555, 0.36, 0.3333, 0.075, "NO", 0, 0); //UPDATE THIS LOT AND SORT THE 'WHAT IF THE BUTTONS NEED EXTRA X COORDINATES' THING
				aButtons.push(this.bTrue);
				aButtons.push(this.bFalse);
				break;s
		}
	}
	
	answered(score) //update questions details when answered
	{
		this.answer = score; //store the answer
		this.pRound.nextQuestion(); //move on to the next question
		frameTimer = danceTime; //set players animation to celebration
		player.dance = true; //set players animation to celebration
		player.frameX = 0; //make sure player starts at the first frame of the animation
	}
	
	getAnswer()
	{
		return this.answer;
	}
	
	getTxt()
	{
		return this.txt;
	}
	
	draw(drawX, drawY) //draws all text of the screen for the question
	{
		ctx.fillStyle = "#000000";
		for (var i = 0; i < this.txt.length; i++) //draw each line of the question
		{
			ctx.fillText(this.txt[i], drawX, drawY + ((canvas.height * 0.03) * i)); //canvas cannot wrap text so text is stored in an array line by line
		}
		
		if (this.type == 2) //if this is a 1-5 question, display which end is low and which end is high
		{
			ctx.fillStyle = "#FFFFFF";
			ctx.font = (16 * txtMultiplier) + "px Arial";
			ctx.fillText("LOW", borderBuffer * 2, (canvas.height * 0.4875));
			ctx.fillText("HIGH", canvas.width - (borderBuffer * 2) - (canvas.width * 0.0777), (canvas.height * 0.4875));
		}
	}
}

class Round
{	
	constructor(title, subtitle, background)
	{
		this.title = title; //the title of the round e.g. The Homefront
		this.subtitle = subtitle; //the subsection of the round e.g. Family
		this.background = background; //what background to display during this round
		this.currentQuestion = 0; //which question is currently in play
		this.questions = []; //array to store the questions in this round / questions are stored from last to first due to the way the code works
		this.roundScore = 0; //total score for this round
		this.qNum = 14; //postion of the questions
		this.writtenAnswers = 0; //amount of questions with written answers in this round

	}
	
	startQuestion() //display the current question
	{
		var sQ = this.questions[this.qNum]; //get the question
		sQ.activate(1); //activate and display the question
		player.frameX = 0; //set player back to first frame of animations
		player.frameY = 0;
	}
	
	answerQuestion(score, qType) //answer the current question
	{
		if ((qType == 0) || (qType == 2)) //if the question does not have a written answer
		{
			this.roundScore += score; //increase the total score for this round by the answer given
		}
		this.questions[this.qNum].answered(score); //update the score for the question object
	}
	
	addQuestion(newQ) //add a new question to the round
	{
		this.questions.push(newQ); //push the question to the questions array
		if (newQ.type == 1) //if the question has a written answer, increase the value of written answers in this round
		{
			this.writtenAnswers += 1;
		}
	}
	
	getRoundLength()
	{
		return 14 - this.qNum;
	}
	
	getTotalScore()
	{
		var scr = 0;
		
		for (var i = 0; i < 15; i++)
		{
			if (this.questions[i].type != 1)
			{
				scr += this.questions[i].getAnswer();
			}
		}
		
		return scr;
	}
	
	nextQuestion() //move to the next question
	{
		if (this.qNum > 0) //if we are not at the end of the round
		{
			this.qNum -= 1;
		}
		else //if we are at the end of the round
		{
			if (currentRound == totalRounds) //if we are at the end of the questionnaire
			{
				endOfQuestions = true;
			}
			else
			{
				fadeTime = fadeTimeTrue;
			}
			fadeAway = true;
			fadeRound += 1; //begin the fading transition
			sndRoundEnd.play();
		}
	}
	
	draw()
	{		
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "bold " + (28 * txtMultiplier) + "px Arial";
		ctx.fillText(this.title, borderBuffer, borderBuffer + (canvas.height * 0.03));
		
		ctx.font = "bold " + (20 * txtMultiplier) + "px Arial";
		ctx.fillText(this.subtitle, borderBuffer, (borderBuffer * 4) + (canvas.height * 0.03));
		
		ctx.fillStyle = "#0099FF";
		ctx.fillRect(0, (canvas.height * 0.225), ((canvas.width) / 15) * (15 - this.qNum), (canvas.height * 0.025));
		//ctx.fillStyle = "#880000";
		//ctx.fillRect(borderBuffer, 370, ((canvas.width - (borderBuffer * 2)) / totalRounds) * currentRound, 20);
		
		ctx.fillStyle = "#000000";
		//ctx.font = "14`1px Arial";
		if (this.qNum >= 0 && frameTimer <= 0 && !player.dance)
		{
			this.questions[this.qNum].draw(borderBuffer * 2, (canvas.height * 0.1) + borderBuffer + (canvas.height * 0.03));
		}
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "bold " + (11 * txtMultiplier) + "px Arial";
		ctx.fillText((15 - this.qNum) + "/15", (((canvas.width) / 15) * (15 - this.qNum)) - (canvas.width * 0.0644), canvas.height * 0.243);
	}
}

class ScorecardMember //object to store details of people on the Mental Wealth Team Scorecard
{
	constructor()
	{
		this.name = "";
		this.score = 5;
	}
	
	getName()
	{
		return this.name;
	}
	
	setName(newName)
	{
		this.name = newName;
	}
	
	getScore()
	{
		return this.score;
	}
	
	setScore(newScore)
	{
		this.score = newScore;
	}
}

class FinalRound
{
	constructor()
	{
		this.pos = 0; //position in the list of people
		this.posMax = 44; //maximum amount of people in the list - 1
		this.members = []; //array for storing each ScorecardMember
		this.txtBox = -1; //text box for entering names / cannot be defined straight away otherwise it will instantly appear
		this.background = new Background(bg1, 5); //background to display for this part
		this.activated = false; //whether or not the round has been activated
		this.end = false; //whether we are at the end of the scorecard section
	}	
	
	activate() //create buttons, display background and text box
	{
		this.activated = true;
		this.background.startStop();
		player.active = false;
		player.dance = false;
		
		this.txtBox = new TextBox(1, "textarea", 0.00125, 0.0777);
		
		for (var i=0; i<this.posMax+1; i++)
		{
			this.members.push(new ScorecardMember()); //create the people for the scorecard
		}
		
		aButtons.push(new Bttn(0.02, 0.3125, 0.1111, 0.125, "<", -1, 3));
		aButtons.push(new Bttn(0.8667, 0.3125, 0.1111, 0.125, ">", 1, 3));
		aButtons.push(new Bttn(0.27, 0.40, 0.0888, 0.0888, "-", -1, 4));
		aButtons.push(new Bttn(0.642, 0.40, 0.0888, 0.0888, "+", 1, 4));
		aButtons.push(new Bttn(0.3444, 0.4813, 0.3333, 0.05, "SUBMIT", 0, 5));
	}
	
	deactivate() //end the scorecard section
	{
		this.end = true;
		for (var b=0; b<5; b++)
		{
			aButtons.pop(); //remove buttons
		}
		aButtons.push(new Bttn((canvas.width * 0.5) - (canvas.height * 0.2222), (canvas.height * 0.4813), (canvas.width * 0.4444), (canvas.height * 0.05), "GET RESULTS", 0, 6)); //add a new button to get the PDF
	}
	
	deactivateAgain() //generates the PDF and ends questionnaire
	{
		this.txtBox.remove();
		aButtons.pop();
		endOfQuestions = true;
		player.dance = true;
		this.activated = false;
	}
	
	scrollThrough(scrollVal) //scrolling through the list of scorecard members
	{
		this.members[this.pos].setName(this.txtBox.getText()); //saves the name in the text box for the current member
		this.pos = this.checkInRange(this.pos + scrollVal, 0, this.posMax); //move to the next member, making sure we do not go below 0 or above 44
		this.txtBox.setText(this.members[this.pos].getName()); //updates text box to show new members name
	}
	
	changeScore(plusMinus) //increase or decrease score for the current member
	{
		var memScore = this.members[this.pos].getScore();
		this.members[this.pos].setScore(this.checkInRange(memScore + plusMinus, 1, 10)); //make sure score does not go below 1 or above 10
	}
	
	checkInRange(value, minValue, maxValue)
	{
		if (value < minValue)
		{
			value = minValue;
		}
		else if (value > maxValue)
		{
			value = maxValue;
		}
		
		return value;
	}
	
	calcuateScore()
	{
		var total = 0;
		
		for (var i=0; i<this.posMax; i++)
		{
			if ((this.members[i].getScore() >= 8) && (this.members[i].getName() != "" && this.members[i].getName() != " "))
			{
				total += this.members[i].getScore();
			}
		}
		
		return total;
	}
	
	draw()
	{
		if (this.activated)
		{			
				this.txtBox.update();
			
				ctx.fillStyle = "#FFFFFF";
				ctx.font = "bold " + (32 * txtMultiplier) + "px Arial";
				ctx.fillText("MENTAL WEALTH", borderBuffer, borderBuffer + (canvas.height * 0.03)); 	
				ctx.fillText("TEAM SCORECARD", borderBuffer, borderBuffer + (canvas.height * 0.075));
			
				if (this.end)
				{		
					ctx.font = (18 * txtMultiplier) + "px Arial";
					ctx.fillText("Your Name:", (canvas.width * 0.2), (canvas.height * 0.3375));
					
					ctx.fillStyle = "#000000";
					ctx.font = "bold " + (20 * txtMultiplier) + "px Arial";
					ctx.fillText("Enter you name to get your results!", borderBuffer, (canvas.height * 0.1) + borderBuffer + (canvas.height * 0.015));
				}
				else
				{
					ctx.font = "bold " + (48 * txtMultiplier) + "px Arial";
					var scorePad = 0.03;
					if (this.members[this.pos].getScore() == 10) { scorePad = 0.05; }
					ctx.fillText(this.members[this.pos].getScore(), (canvas.width * 0.5) - (canvas.width * scorePad), (canvas.height * 0.44));
					
					ctx.font = (18 * txtMultiplier) + "px Arial";
					ctx.fillText("Person #" + (this.pos + 1) + ":", (canvas.width * 0.2), (canvas.height * 0.3375));
					
					ctx.fillStyle = "#000000";
					ctx.font = (16 * txtMultiplier) + "px Arial";
					ctx.fillText("Think about who already fits the bill for your mental wealth", borderBuffer, (canvas.height * 0.1) + borderBuffer + (canvas.height * 0.015));
					ctx.fillText("team in your existing network. Complete the following by", borderBuffer, (canvas.height * 0.1) + borderBuffer + (canvas.height * 0.0375));
					ctx.fillText("scoring each person's commitment level to you between", borderBuffer, (canvas.height * 0.1) + borderBuffer + (canvas.height * 0.06));
					ctx.fillText("1-10, where 1 is low, and 10 is high. Do not overthink these", borderBuffer, (canvas.height * 0.1) + borderBuffer + (canvas.height * 0.0825));
					ctx.fillText("numbers, it's just down to how you feel.", borderBuffer, (canvas.height * 0.1) + borderBuffer + (canvas.height * 0.105));
					ctx.fillText("Only press 'SUBMIT' once you've entered everyone you can.", borderBuffer, (canvas.height * 0.1) + borderBuffer + (canvas.height * 0.1275));
				
			}
		}
		
	}
}

//
//MAP
//

class MapScreen //progress bar that is displayed during fading transistions
{
	constructor()
	{
		this.x = borderBuffer;
		this.y = (canvas.height * 0.375);
		this.barHeight = (canvas.height * 0.0625);
	}
	
	draw()
	{
		if (((fadeTime <= (fadeTimeTrue * 0.98)) && (fadeTime >= (fadeTimeTrue * 0.02))) )// && currentRound > 0)
		{
			ctx.fillStyle = "#FFFFFF";
			ctx.font = "bold " + (24 * txtMultiplier) + "px Arial";
			//ctx.fillText("STARTING ROUND " + (fadeRound+1) + " OF " + totalRounds, this.x + (canvas.width * 0.1555), this.y - (canvas.height * 0.0375));
			ctx.fillText("MENTAL WEALTH METER:", this.x + (canvas.width * 0.1555), this.y - (canvas.height * 0.0375));
			ctx.fillText("KEEP IT UP!", this.x + (canvas.width * 0.2666), this.y + this.barHeight + (canvas.height * 0.0437));
			
			ctx.fillStyle = "#0099FF";
			ctx.fillRect(this.x, this.y, (((((canvas.width - (borderBuffer * 2)) / totalRounds) * fadeRound) - ((canvas.width - (borderBuffer * 2)) / totalRounds)) + (((canvas.width - (borderBuffer * 2)) / totalRounds) * ((fadeTimeTrue - fadeTime) / fadeTimeTrue))), this.barHeight);
			
			ctx.drawImage(playerHead, (((((canvas.width - (borderBuffer * 2)) / totalRounds) * fadeRound) - ((canvas.width - (borderBuffer * 2)) / totalRounds)) + (((canvas.width - (borderBuffer * 2)) / totalRounds) * ((fadeTimeTrue - fadeTime) / fadeTimeTrue))) - (playerHead.width * 0.5), this.y);
		}
	}
}

//
//Buttons
//

class Bttn
{
	constructor(xMultiply, yMultiply, wMultiply, hMultiply, txt, score, type)
	{
		this.xMultiply = xMultiply;
		this.x = (canvas.width * this.xMultiply);
		this.yMultiply = yMultiply;
		this.y = (canvas.height * this.yMultiply);
		this.wMultiply = wMultiply;
		this.width = (canvas.width * this.wMultiply);
		this.hMultiply = hMultiply;
		this.height = (canvas.height * this.hMultiply);
		this.txt = txt;
		//this.txtMultiplier = (canvas.width / 450);
		this.score = score;
		this.type = type; // 0 : true or false / 1 : submit text / 2 : 1 to 5 / 3 : scrolling scorecard members / 4 : changing scorecard members score / 5 : submit scorecard / 6 : generate pdf
		this.update();
	}
	
	clicked()
	{
			switch(this.type)
			{
				case 1:
					if (txtArea[0].getText() == "" || txtArea[0].getText() == " ") //if text box is empty
					{
						aRounds[currentRound].answerQuestion("N/A", this.type); //set answer to N/A
					}
					else
					{
						aRounds[currentRound].answerQuestion(txtArea[0].getText(), this.type); //else get the text
					}
					aButtons.pop();
					txtArea[0].remove(); //remove buttons and text box
					txtArea.pop();
					player.frameX = 0;
					player.frameY = 0; //reset player animation frames
					sndAnswering[Math.floor(Math.random() * 5)].play();
					break;
					
				case 3:
					aFinalRound.scrollThrough(this.score);
					break;
					
				case 4:
					aFinalRound.changeScore(this.score);
					break;

				case 5:
					aFinalRound.members[aFinalRound.pos].setName(aFinalRound.txtBox.getText());
					aFinalRound.txtBox.setText("");
					aFinalRound.deactivate();
					player.frameX = 0;
					player.frameY = 0;
					break;

				case 6:
					if ((aFinalRound.txtBox.getText() != "") && (aFinalRound.txtBox.getText() != " "))
					{
						username = aFinalRound.txtBox.getText();
						aFinalRound.deactivateAgain();
					}
					break;
				
				default:
					var forMax = 2;
					if (this.type == 2)
					{
						forMax = 5;
					}				
				
					aRounds[currentRound].answerQuestion(this.score, this.type);
					for (var i = 0; i < forMax; i++)
					{
						aButtons.pop();
					}
					player.frameX = 0;
					player.frameY = 0;
					sndAnswering[Math.floor(Math.random() * 5)].play();
					break;
			}
	}
	
	update()
	{
		this.x = (canvas.width * this.xMultiply);
		this.y = (canvas.height * this.yMultiply);
		this.width = (canvas.width * this.wMultiply);
		
		if ((this.type == 2) || (this.type == 4))
		{
			this.height = (canvas.width * this.wMultiply);
		}
		else
		{
			this.height = (canvas.height * this.hMultiply);
		}
		
		txtMultiplier = (canvas.width/450);
	}
	
	draw()
	{
		ctx.fillStyle = "#FFFFFF";
		ctx.fillRect(this.x, this.y, this.width, this.height);
		
		ctx.fillStyle = "#000000";
		ctx.font = "bold " + (24 * txtMultiplier) + "px Arial";
		ctx.fillText(this.txt, this.x + (this.width * 0.5) - (this.txt.length * 15 * 0.5 * txtMultiplier), this.y + (this.height * 0.65));
	}
}

//
//Backgrounds
//

class Background
{
	constructor(img, scrollSpd)
	{
		this.img = img; //background's image
		this.scrollSpd = scrollSpd; //scrolling speed when moving
		this.active = true; //scrolling or not
		this.framesActive = gameFrame; //how many frames background has been animated for, allows for scrolling image to be smooth
		this.fadeOut = false; //fading in/out or not
		this.fadeValue = 0; // 0 = invisible / 100 = visible
	}
	
	draw()
	{
		if (this.fadeOut)
		{
			if (this.fadeValue > 0.02)
			{
				this.fadeValue -= 0.01;
			}
			else
			{
				this.fadeValue = 0;
			}
		}
		else
		{
			if (this.fadeValue < 0.98)
			{
				this.fadeValue += 0.01;
			}
			else
			{
				this.fadeValue = 1;
			}
		}
		
		if (this.active)
		{
			this.framesActive++;
		}
		var xPos = this.framesActive * this.scrollSpd % this.img.width * txtMultiplier;
		var imgNum = 4;
		
		ctx.save();
		ctx.globalAlpha = this.fadeValue; //global alpha is set to allow for the background to fade
		ctx.translate(-xPos, 0);
		for (var i = 0; i < imgNum; i++)
		{
			ctx.drawImage(this.img, i * this.img.width * 0.5 * txtMultiplier, canvas.height - (this.img.height*0.5*txtMultiplier), this.img.width * 0.5 * txtMultiplier, this.img.height * 0.5 * txtMultiplier);
		}		
		ctx.restore();
		ctx.globalAlpha = 1; //global alpha must be reset to 1 here as otherwise all other objects will be drawn with same alpha as the background
	}
	
	startStop()
	{
		this.active = !this.active;
	}
}

//
//UI
//

class UIHandler
{
	constructor()
	{
		this.mode = 0; // 0 = question display
	}
	
	draw()
	{
		ctx.save();
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, canvas.width, canvas.height * 0.05);
		//ctx.stroke();
		
		//ctx.beginPath();
		//ctx.strokeStyle = "red";
		ctx.fillStyle = "#FFFFFF";
		ctx.fillRect(0, canvas.height * 0.1, canvas.width, canvas.height * 0.1 + canvas.height * 0.05);
		//ctx.fillRect(borderBuffer, (canvas.height - (canvas.height * 0.15)) + borderBuffer, canvas.width - (borderBuffer * 2), (canvas.height * 0.15) - (borderBuffer * 2));
		//ctx.fill();
		ctx.restore;
	}
}

//
//player
//

class Player
{	
	constructor()
	{
		this.frameX = 0; //current frame on the x axis of sprite sheet
		this.frameY = 0; //current frame on the y axis of sprite sheet
		this.frame = 0;
		this.frameXMax = 4; //maximum frame to reach on x axis
		this.frameYMax = 8; //maximum frame to reach on y axis
		this.frameSpeed = 3; //animation speed / the higher the value, the slower the animation
		this.sprWidth = 1280; //width of each frame
		this.sprHeight = 720; //height of each frame
		this.state = 0; // 0 = idle / 1 = walking / 2 - answering
		this.sprites = [playerIdle, playerWalk, playerAnswer]; //array to store sprites in position of corresponding state number
		this.active = true; //whether playing is moving or standing still
		this.dance = false; //whether player has just answered a question or not
		this.x = -(canvas.width * 0.4444);
		this.y = (canvas.height * 0.69);
	}
	
	update()
	{
		if (this.dance)
		{
			this.state = 2;
			this.frameXMax = 3; //answering sprite sheet has 1 less column
			this.frameSpeed = 3;
		}
		else
		{
			if (this.active)
			{
				this.state = 1;
				this.frameSpeed = 2;
			}
			else
			{
				this.state = 0;
				if (this.frameY == 0)
				{
					this.frameSpeed = 30;
				}
				else
				{
					this.frameSpeed = 3;
				}
			}
			this.frameXMax = 4;
			
			this.x = -(canvas.width * 0.4444);
			this.y = (canvas.height * 0.66);
		}
		
		if (gameFrame % this.frameSpeed == 0) //if at a frame to animate
		{
			this.frameX += 1; //move to the next column on sprite sheet
			if (this.frameX >= this.frameXMax) //if at the last column
			{
				this.frameX = 0; //go back to first column
				this.frameY += 1; //go to next row
				if (this.frameY >= this.frameYMax) //if we are at the last row
				{
					this.frameY = 0; //go back to first row
				}
			}
		}
	}
	
	draw()
	{
		ctx.save();
		ctx.drawImage(this.sprites[this.state], (this.frameX * this.sprWidth), (this.frameY * this.sprHeight), this.sprWidth, this.sprHeight, this.x, this.y, this.sprWidth * 0.5 * txtMultiplier, this.sprHeight * 0.5 * txtMultiplier);	
		ctx.restore();
	}
}

//
//TEXT BOX
//

class TextBox
{
	constructor(id, type, rows, cols)
	{
		this.id = id;
		this.rows = rows;
		this.cols = cols;
		this.para = document.createElement("P");
		this.x = document.createElement("TEXTAREA");
		this.x.setAttribute("type", type);
		this.x.setAttribute("rows", "" + Math.round(canvas.height * rows));
		this.x.setAttribute("cols", "" + Math.round(canvas.width * cols));
		this.x.setAttribute("font-size", "" + Math.round(14 * txtMultiplier));
		console.log(this.x.getAttribute("rows") + " " + this.x.getAttribute("cols"));
		this.para.appendChild(this.x);
		document.getElementById("txtdisplay").appendChild(this.x);
	}
	
	getText()
	{
		return this.x.value;
	}
	
	setText(newText)
	{
		this.x.value = newText;
	}
	
	update()
	{
		var txtValue = this.getText();
		console.log(canvas.height + " " + this.rows);
		
		document.getElementById("txtdisplay").removeChild(this.x);
		
		console.log(canvas.height + " " + this.rows);
		this.x = document.createElement("TEXTAREA");
		this.x.setAttribute("type", this.type);
		this.x.setAttribute("rows", "" + Math.round(canvas.height * this.rows));
		this.x.setAttribute("cols", "" + Math.round(canvas.width * this.cols));
		this.x.setAttribute("font-size", "" + Math.round(24 * txtMultiplier));
		this.setText(txtValue);
		console.log((canvas.height * this.rows) + " " + (canvas.width * this.cols));
		
		this.para.appendChild(this.x);
		document.getElementById("txtdisplay").appendChild(this.x);
	}
	
	remove()
	{
		document.getElementById("txtdisplay").removeChild(this.x);
	}
}

//
// draw functions
//

function drawObjs(array)
{
	if (array.length != 0)
	{
		for (var i = 0; i < array.length; i++)
		{
			array[i].draw();
		}
	}
}

//
//create pieces
//

const player = new Player();
const mapDisplay = new MapScreen();
const testQ = new Round("THE HOME FRONT", "- Family");
const uiHand = new UIHandler();

//
//create backgrounds
//

const background1 = new Background(bg1, 5);
const background2 = new Background(bg2, 5);
const background3 = new Background(bg3, 5);
const background4 = new Background(bg4, 5);
const background5 = new Background(bg5, 5);
const background6 = new Background(bg6, 5);
const background7 = new Background(bg7, 5);
const background8 = new Background(bg8, 5);
const background9 = new Background(bg9, 5);
const background10 = new Background(bg10, 5);
const background11 = new Background(bg11, 5);
const background12 = new Background(bg12, 5);
const background13 = new Background(bg13, 5);
const background14 = new Background(bg14, 5);
const background15 = new Background(bg15, 5);
const background16 = new Background(bg16, 5);
const background17 = new Background(bg17, 5);
const background18 = new Background(bg18, 5);
const background19 = new Background(bg19, 5);
const background20 = new Background(bg20, 5);

//
//create questions
//

function makeRounds()
{

	const rFamily = new Round("THE HOME FRONT", "FAMILY", background1);
	rFamily.addQuestion(new Question(["Further Observations"], 1, 15, rFamily));
	 rFamily.addQuestion(new Question(["What changes are on the horizon in your", "family and how will you manage them?"], 1, 14, rFamily));
	rFamily.addQuestion(new Question(["Can you describe what would be an ideal", "family environment for you?"], 1, 13, rFamily));
	rFamily.addQuestion(new Question(["What is your current relationship with your", "family?"], 1, 12, rFamily));
	rFamily.addQuestion(new Question(["When was your last family holiday / short", "break and what did you do?"], 1, 11, rFamily));
	rFamily.addQuestion(new Question(["I have made a will in the last 3 years and", "have power of attorney in place."], 0, 10, rFamily));
	rFamily.addQuestion(new Question(["I have good personal life insurance."], 0, 9, rFamily));
	rFamily.addQuestion(new Question(["I regularly have one-on-one time with each", "member of my immediate family."], 0, 8, rFamily));
	rFamily.addQuestion(new Question(["I have at least one meal a day with my", "immediate family that live with me."], 0, 7, rFamily));
	rFamily.addQuestion(new Question(["I am on speaking terms with my extended", "family."], 0, 6, rFamily));
	rFamily.addQuestion(new Question(["When conversing with my family I listen", "before I speak, and I do not interrupt."], 0, 5, rFamily));
	rFamily.addQuestion(new Question(["I have a partner who I love, and they love", "me."], 0, 4, rFamily));
	rFamily.addQuestion(new Question(["I have forgiven any past family member's", "transgressions against me."], 0, 3, rFamily));
	rFamily.addQuestion(new Question(["I have at least one common interest with", "each member of my family."], 0, 2, rFamily));
	rFamily.addQuestion(new Question(["I do not lie to my family."], 0, 1, rFamily));
	aRounds.push(rFamily);
	totalRounds += 1;

	const rHome = new Round("THE HOME FRONT", "HOME", background2);
	rHome.addQuestion(new Question(["Further Observations"], 1, 15, rHome));
	rHome.addQuestion(new Question(["How long do you expect to continue living", "where you currently are?"], 1, 14, rHome));
	rHome.addQuestion(new Question(["If you were to create the ideal home", "situation, what would that be?"], 1, 13, rHome));
	rHome.addQuestion(new Question(["Have the recent lockdowns changed the", "way you view your home life?"], 1, 12, rHome));
	rHome.addQuestion(new Question(["How would you describe the current set up", "at your home?"], 1, 11, rHome));
	rHome.addQuestion(new Question(["I have things of beauty in my home that", "enhance my life."], 0, 10, rHome));
	rHome.addQuestion(new Question(["The moment I walk through the door I feel", "good to be at home - not jobs to be done."], 0, 9, rHome));
	rHome.addQuestion(new Question(["The home is fit for purpose for this stage", "in my life."], 0, 8, rHome));
	rHome.addQuestion(new Question(["My family feel equally positive about our", "home."], 0, 7, rHome));
	rHome.addQuestion(new Question(["I have a place for everything, and", "everything is in its place."], 0, 6, rHome));
	rHome.addQuestion(new Question(["I am living in the place I want to be."], 0, 5, rHome));
	rHome.addQuestion(new Question(["I am comfortable in my own home."], 0, 4, rHome));
	rHome.addQuestion(new Question(["My home reflects and supports my social", "life."], 0, 3, rHome));
	rHome.addQuestion(new Question(["My home is clean, tidy and decorated to my", "tastes."], 0, 2, rHome));
	rHome.addQuestion(new Question(["All my home is in the best possible state", "of repair."], 0, 1, rHome));
	aRounds.push(rHome);
	totalRounds += 1;
	 
	const rPossessions = new Round("THE HOME FRONT", "POSSESSIONS / ADMINISTRATION", background3);
	rPossessions.addQuestion(new Question(["Further Observations"], 1, 15, rPossessions));
	rPossessions.addQuestion(new Question(["Given the situation what one item would", "you rescue from your house?"], 1, 14, rPossessions));
	rPossessions.addQuestion(new Question(["Are there unnecessary items that you", "hoard, that you wouldn't admit to others?"], 1, 13, rPossessions));
	rPossessions.addQuestion(new Question(["What could you do now that would make", "you better or more organised?"], 1, 12, rPossessions));
	rPossessions.addQuestion(new Question(["What repair tasks are currently", "outstanding?"], 1, 11, rPossessions));
	rPossessions.addQuestion(new Question(["I am completely on top of everything at", "home and at work."], 0, 10, rPossessions));
	rPossessions.addQuestion(new Question(["My paper trail for all investments,", "insurances and policies is easily located."], 0, 9, rPossessions));
	rPossessions.addQuestion(new Question(["I have a funeral plan, a Living Power of", "Attorney and an up-to-date Will."], 0, 8, rPossessions));
	rPossessions.addQuestion(new Question(["I keep filed receipts and warranties for", "everything I buy and is still current."], 0, 7, rPossessions));
	rPossessions.addQuestion(new Question(["I do not hoard unnecessary possessions."], 0, 6, rPossessions));
	rPossessions.addQuestion(new Question(["My possessions support the needs of both", "my work and home life."], 0, 5, rPossessions));
	rPossessions.addQuestion(new Question(["I have a list of tradesmen and specialists", "who repair/maintain."], 0, 4, rPossessions));
	rPossessions.addQuestion(new Question(["I celebrate and appreciate all that I have."], 0, 3, rPossessions));
	rPossessions.addQuestion(new Question(["I have all warrantees, guarantees and", "instructions filed where I can find them."], 0, 2, rPossessions));
	rPossessions.addQuestion(new Question(["All my mechanical and electrical", "possessions are in a good state of repair."], 0, 1, rPossessions));
	aRounds.push(rPossessions);
	totalRounds += 1;

	//

	const rHealth = new Round("PERSONAL RESPONSIBILITY", "HEALTH", background4);
	rHealth.addQuestion(new Question(["Further Observations"], 1, 15, rHealth));
	rHealth.addQuestion(new Question(["Describe what a good week of eating well", "and exercising looks like?"], 1, 14, rHealth));
	rHealth.addQuestion(new Question(["What are your go to excuses for not", "exercising regularly, at all or too much?"], 1, 13, rHealth));
	rHealth.addQuestion(new Question(["Does your current physical health concern", "you? What have you done about it?"], 1, 12, rHealth));
	rHealth.addQuestion(new Question(["Has Covid-19 made you think differently", "about your health?"], 1, 11, rHealth));
	rHealth.addQuestion(new Question(["I am happy with my physical appearance."], 0, 10, rHealth));
	rHealth.addQuestion(new Question(["I eat a healthy balanced diet without", "excess."], 0, 9, rHealth));
	rHealth.addQuestion(new Question(["I drink at least two litres of water each day."], 0, 8, rHealth));
	rHealth.addQuestion(new Question(["I deal with any physical or mental", "challenges immediately I become aware", "of them."], 0, 7, rHealth));
	rHealth.addQuestion(new Question(["I do not deprive myself of sleep -", "averaging 7 hours per night."], 0, 6, rHealth));
	rHealth.addQuestion(new Question(["Annually I have checks: blood pressure,", "cholesterol, teeth, eyes and hearing."], 0, 5, rHealth));
	rHealth.addQuestion(new Question(["I continue to exercise and manage my diet", "according to my lifestyle."], 0, 4, rHealth));
	rHealth.addQuestion(new Question(["I drink less than 20 units of alcohol per", "week."], 0, 3, rHealth));
	rHealth.addQuestion(new Question(["I do not smoke or take recreational drugs."], 0, 2, rHealth));
	rHealth.addQuestion(new Question(["I am within the weight range healthy for my", "height, sex, age and sporting background."], 0, 1, rHealth));
	aRounds.push(rHealth);
	totalRounds += 1;

	const rRecreation = new Round("PERSONAL RESPONSIBILITY", "RECREATION", background5);
	rRecreation.addQuestion(new Question(["Further Observations"], 1, 15, rRecreation));
	rRecreation.addQuestion(new Question(["How would you describe your relationship", "with your friends?"], 1, 14, rRecreation));
	rRecreation.addQuestion(new Question(["Are you in control of your time spent on", "social media apps?"], 1, 13, rRecreation));
	rRecreation.addQuestion(new Question(["How do you communicate with your friends", "- calls, text, what's app, video calls?"], 1, 12, rRecreation));
	rRecreation.addQuestion(new Question(["Can you name your friends who you speak", "to at least once per week?"], 1, 11, rRecreation));
	rRecreation.addQuestion(new Question(["I have at least two friends who are not", "connected to normal work environment."], 0, 10, rRecreation));
	rRecreation.addQuestion(new Question(["I visit one place of interest (museum,", "gallery) every quarter."], 0, 9, rRecreation));
	rRecreation.addQuestion(new Question(["I always have plenty to talk about at social", "events."], 0, 8, rRecreation));
	rRecreation.addQuestion(new Question(["I take an active interest in at least one", "hobby."], 0, 7, rRecreation));
	rRecreation.addQuestion(new Question(["I read from a book or equivalent every day."], 0, 6, rRecreation));
	rRecreation.addQuestion(new Question(["I watch less than 15 hours TV each week."], 0, 5, rRecreation));
	rRecreation.addQuestion(new Question(["Every week I have something to look", "forward to."], 0, 4, rRecreation));
	rRecreation.addQuestion(new Question(["I have a retreat that I can go to where I feel", "secure."], 0, 3, rRecreation));
	rRecreation.addQuestion(new Question(["I take 25 days holiday per year."], 0, 2, rRecreation));
	rRecreation.addQuestion(new Question(["I have a strong group of friendships that", "fulfil my social needs."], 0, 1, rRecreation));
	aRounds.push(rRecreation);
	totalRounds += 1;

	const rConduct = new Round("PERSONAL RESPONSIBILITY", "PERSONAL CONDUCT", background6);
	rConduct.addQuestion(new Question(["Further Observations"], 1, 15, rConduct));
	rConduct.addQuestion(new Question(["How long should a hug last?"], 1, 14, rConduct));
	rConduct.addQuestion(new Question(["Describe when you offended someone, or", "they offended you and how you resolved", "this?"], 1, 13, rConduct));
	rConduct.addQuestion(new Question(["Do you listen to feedback from other", "people? How do you respond to them", "afterwards?"], 1, 12, rConduct));
	rConduct.addQuestion(new Question(["How would you describe your current", "communication style with other people?"], 1, 11, rConduct));
	rConduct.addQuestion(new Question(["All my emotional needs are currently", "being met."], 0, 10, rConduct));
	rConduct.addQuestion(new Question(["My time is precious and respected and so", "is everyone else's."], 0, 9, rConduct));
	rConduct.addQuestion(new Question(["I always admit when I am wrong", "- immediately and with good grace."], 0, 8, rConduct));
	rConduct.addQuestion(new Question(["I am never late for anything especially if it", "is for the benefit of somebody else."], 0, 7, rConduct));
	rConduct.addQuestion(new Question(["I make every effort to make amends if I", "offend somebody."], 0, 6, rConduct));
	rConduct.addQuestion(new Question(["I do not talk about people behind their", "backs."], 0, 5, rConduct));
	rConduct.addQuestion(new Question(["I always let people know if they have", "offended me."], 0, 4, rConduct));
	rConduct.addQuestion(new Question(["I avoid making unconstructive criticism and", "pulling people down."], 0, 3, rConduct));
	rConduct.addQuestion(new Question(["I always think and look for the best in", "people."], 0, 2, rConduct));
	rConduct.addQuestion(new Question(["I am no longer affected by past harms", "against me."], 0, 1, rConduct));
	aRounds.push(rConduct);
	totalRounds += 1;

	//

	const rFinances = new Round("DIRECTION & DEVELOPMENT", "FINANCES", background7);
	rFinances.addQuestion(new Question(["Further Observations"], 1, 15, rFinances));
	rFinances.addQuestion(new Question(["How far ahead have you set financial", "goals? 1 day? 1 year? 5 years?"], 1, 14, rFinances));
	rFinances.addQuestion(new Question(["How would you describe yourself when it", "comes to managing your finances?"], 1, 13, rFinances));
	rFinances.addQuestion(new Question(["What is your approach to debt and how", "successful are you with this approach?"], 1, 12, rFinances));
	rFinances.addQuestion(new Question(["Can you name the trusted people who you", "discuss your finances with?"], 1, 11, rFinances));
	rFinances.addQuestion(new Question(["All my income streams are predictable", "and secure."], 0, 10, rFinances));
	rFinances.addQuestion(new Question(["VAT / TAX / Accounts are all in order with", "no more than 1 month outstanding."], 0, 9, rFinances));
	rFinances.addQuestion(new Question(["I have one month's income put aside for", "unforeseen purchases."], 0, 8, rFinances));
	rFinances.addQuestion(new Question(["I know all my financial commitments and", "pay them on time."], 0, 7, rFinances));
	rFinances.addQuestion(new Question(["I invest in assets such as property or", "shares supported by professional", "advisors."], 0, 6, rFinances));
	rFinances.addQuestion(new Question(["I have a budgeting system which tracks", "the amount I actually spendand earn."], 0, 5, rFinances));
	rFinances.addQuestion(new Question(["I have sufficient insurance for all my", "assets, and cover for my liabilities."], 0, 4, rFinances));
	rFinances.addQuestion(new Question(["I have laid firm plans to finance my", "retirement."], 0, 3, rFinances));
	rFinances.addQuestion(new Question(["I have 3 months basic living costs put", "aside and easily accessible."], 0, 2, rFinances));
	rFinances.addQuestion(new Question(["My annual outgoings are covered by my", "annual income."], 0, 1, rFinances));
	aRounds.push(rFinances);
	totalRounds += 1;

	const rCareer = new Round("DIRECTION & DEVELOPMENT", "CAREER", background8);
	rCareer.addQuestion(new Question(["Further Observations"], 1, 15, rCareer));
	rCareer.addQuestion(new Question(["If you had a magic wand what three things", "would you change today with your work?"], 1, 14, rCareer));
	rCareer.addQuestion(new Question(["Can you describe your ideal career/job", "including timeframes or locations?"], 1, 13, rCareer));
	rCareer.addQuestion(new Question(["How would you describe your current", "job/business satisfaction?"], 1, 12, rCareer));
	rCareer.addQuestion(new Question(["Do you talk about work excessively when", "at home with your family?"], 1, 11, rCareer));
	rCareer.addQuestion(new Question(["I only commit to what I can deliver."], 0, 10, rCareer));
	rCareer.addQuestion(new Question(["I have good working relationships with all", "my colleagues both internal and external."], 0, 9, rCareer));
	rCareer.addQuestion(new Question(["I only do things which help me achieve my", "objectives."], 0, 8, rCareer));
	rCareer.addQuestion(new Question(["My physical work location is pleasing and", "energising."], 0, 7, rCareer));
	rCareer.addQuestion(new Question(["I have all the tools and training I need to", "achieve objectives."], 0, 6, rCareer));
	rCareer.addQuestion(new Question(["Mostly I work less than 40 hours week and", "never more than 45."], 0, 5, rCareer));
	rCareer.addQuestion(new Question(["I reward and am rewarded according to", "the value I provide."], 0, 4, rCareer));
	rCareer.addQuestion(new Question(["I am rarely off work due to illness."], 0, 3, rCareer));
	rCareer.addQuestion(new Question(["I have a career plan where the next 12", "months have firm goals set against them."], 0, 2, rCareer));
	rCareer.addQuestion(new Question(["I enjoy my work 90% or more of the time."], 0, 1, rCareer));
	aRounds.push(rCareer);
	totalRounds += 1;

	const rSpiritual = new Round("DIRECTION & DEVELOPMENT", "SPIRITUAL", background9);
	rSpiritual.addQuestion(new Question(["Further Observations"], 1, 15, rSpiritual));
	rSpiritual.addQuestion(new Question(["On a scale of emotionally stunted or a", "tree hugger where you place yourself?"], 1, 14, rSpiritual));
	rSpiritual.addQuestion(new Question(["How would you describe your mindset", "towards religious beliefs that differ from", "your own?"], 1, 13, rSpiritual));
	rSpiritual.addQuestion(new Question(["When was the last time you had 'me'", "time and what did you do?"], 1, 12, rSpiritual));
	rSpiritual.addQuestion(new Question(["What does being a good person mean to", "you?"], 1, 11, rSpiritual));
	rSpiritual.addQuestion(new Question(["I have adequate time for myself to reflect,", "reboot and meditate."], 0, 10, rSpiritual));
	rSpiritual.addQuestion(new Question(["I recycle and am resourceful wherever", "possible."], 0, 9, rSpiritual));
	rSpiritual.addQuestion(new Question(["I give something back to the community", "either through my possessions or", "my time."], 0, 8, rSpiritual));
	rSpiritual.addQuestion(new Question(["I understand that future & past are", "thoughts but only the present exists - life", "is a gift."], 0, 7, rSpiritual));
	rSpiritual.addQuestion(new Question(["I don't think that life is a chore to be", "done before I die."], 0, 6, rSpiritual));
	rSpiritual.addQuestion(new Question(["I laugh out loud many times each day."], 0, 5, rSpiritual));
	rSpiritual.addQuestion(new Question(["I keep a journal where I can record", "anything I like - positive and gratitude."], 0, 4, rSpiritual));
	rSpiritual.addQuestion(new Question(["I only give my word if I know I can keep it:", "people can trust me."], 0, 3, rSpiritual));
	rSpiritual.addQuestion(new Question(["I avoid lying if at all possible and have a", "reputation for honesty."], 0, 2, rSpiritual));
	rSpiritual.addQuestion(new Question(["I believe in something that gives me a", "feeling of well-being."], 0, 1, rSpiritual));
	aRounds.push(rSpiritual);
	totalRounds += 1;

	const rPersonalDev = new Round("DIRECTION & DEVELOPMENT", "PERSONAL DEVELOPMENT", background10);
	rPersonalDev.addQuestion(new Question(["Further Observations"], 1, 15, rPersonalDev));
	rPersonalDev.addQuestion(new Question(["What is your best or most recent success", "story, how long did it take and why is it", "so memorable?"], 1, 14, rPersonalDev));
	rPersonalDev.addQuestion(new Question(["What are your views on working with a", "mentor/coach?"], 1, 13, rPersonalDev));
	rPersonalDev.addQuestion(new Question(["How many hours per week do you think", "you need to invest for your personal", "development?"], 1, 12, rPersonalDev));
	rPersonalDev.addQuestion(new Question(["Can you describe what personal", "development means to you?"], 1, 11, rPersonalDev));
	rPersonalDev.addQuestion(new Question(["I have at least one creative outlook that", "stimulates me mentally, emotionally or", "physically."], 0, 10, rPersonalDev));
	rPersonalDev.addQuestion(new Question(["I am open to change."], 0, 9, rPersonalDev));
	rPersonalDev.addQuestion(new Question(["I have learnt at least one hobby in the last", "12 months."], 0, 8, rPersonalDev));
	rPersonalDev.addQuestion(new Question(["I understand that future &  past are", "thoughts but only the present exists - life", "is a gift."], 0, 7, rPersonalDev));
	rPersonalDev.addQuestion(new Question(["I have a twelve-month personal", "development plan."], 0, 6, rPersonalDev));
	rPersonalDev.addQuestion(new Question(["I am aware of my personal and", "professional strengths and weaknesses."], 0, 5, rPersonalDev));
	rPersonalDev.addQuestion(new Question(["I habitually teach what I know to others."], 0, 4, rPersonalDev));
	rPersonalDev.addQuestion(new Question(["I have a mentor/coach who I regularly", "work with."], 0, 3, rPersonalDev));
	rPersonalDev.addQuestion(new Question(["I read one book each quarter that", "improves me."], 0, 2, rPersonalDev));
	rPersonalDev.addQuestion(new Question(["I set aside 20 minutes every day to", "improve myself."], 0, 1, rPersonalDev));
	aRounds.push(rPersonalDev);
	totalRounds += 1;

	//
	//

	const rBiggerPicture = new Round("THE RIGHT PLACE TO BE", "The Bigger Picture", background11);
	rBiggerPicture.addQuestion(new Question(["Further Observations"], 1, 15, rBiggerPicture));
	rBiggerPicture.addQuestion(new Question(["How can you improve the mental wealth", "of the staff?"], 1, 14, rBiggerPicture));
	rBiggerPicture.addQuestion(new Question(["How can they increase your satisfaction", "and productivity?"], 1, 13, rBiggerPicture));
	rBiggerPicture.addQuestion(new Question(["What makes this a place where people", "want to work?"], 1, 12, rBiggerPicture));
	rBiggerPicture.addQuestion(new Question(["What ways does the company do good", "things in the community?"], 1, 11, rBiggerPicture));
	rBiggerPicture.addQuestion(new Question(["Supporting mental health is taken very", "seriously."], 2, 10, rBiggerPicture));
	rBiggerPicture.addQuestion(new Question(["Whether a Gen Z, Gen 0 or a baby boomer", "there is a space for you."], 2, 9, rBiggerPicture));
	rBiggerPicture.addQuestion(new Question(["Philanthropy and charitable support is", "strongly encouraged."], 2, 8, rBiggerPicture));
	rBiggerPicture.addQuestion(new Question(["The company gives back to the", "community."], 2, 7, rBiggerPicture));
	rBiggerPicture.addQuestion(new Question(["Having tattoos is an individual's choice."], 2, 6, rBiggerPicture));
	rBiggerPicture.addQuestion(new Question(["The reputation and brand are seen", "positively within the society."], 2, 5, rBiggerPicture));
	rBiggerPicture.addQuestion(new Question(["Maternity and paternity cover and", "procedures are up to date."], 2, 4, rBiggerPicture));
	rBiggerPicture.addQuestion(new Question(["Travel emissions are reduced by video", "conferencing and home working."], 2, 3, rBiggerPicture));
	rBiggerPicture.addQuestion(new Question(["The company has a sincere and proactive", "approach to carbon offsetting."], 2, 2, rBiggerPicture));
	rBiggerPicture.addQuestion(new Question(["The organisation operates in a socially", "responsible manner."], 2, 1, rBiggerPicture));
	aRounds.push(rBiggerPicture);
	totalRounds += 1;
	///*
	const rDifferent = new Round("THE RIGHT PLACE TO BE", "What Makes Your Organisation Different?", background12);
	rDifferent.addQuestion(new Question(["Further Observations"], 1, 15, rDifferent));
	rDifferent.addQuestion(new Question(["What is the company Vision and Mission?"], 1, 14, rDifferent));
	rDifferent.addQuestion(new Question(["If there was one thing you could change,", "what would it be?"], 1, 13, rDifferent));
	rDifferent.addQuestion(new Question(["What mistakes have you learnt from", "recently?"], 1, 12, rDifferent));
	rDifferent.addQuestion(new Question(["How could you make it easier for people", "to buy from you?"], 1, 11, rDifferent));
	rDifferent.addQuestion(new Question(["Competitors strategies & innovation do", "not worry us."], 2, 10, rDifferent));
	rDifferent.addQuestion(new Question(["We are leaders in our market."], 2, 9, rDifferent));
	rDifferent.addQuestion(new Question(["The company has a proactive approach to", "winning more referrals."], 2, 8, rDifferent));
	rDifferent.addQuestion(new Question(["The lifetime value of our customers is", "recognised."], 2, 7, rDifferent));
	rDifferent.addQuestion(new Question(["Everyone understands why people buy", "from us."], 2, 6, rDifferent));
	rDifferent.addQuestion(new Question(["All the necessary association", "accreditation are in place."], 2, 5, rDifferent));
	rDifferent.addQuestion(new Question(["Your everyday conduct promotes trust."], 2, 4, rDifferent));
	rDifferent.addQuestion(new Question(["The organisation always excels at", "pitching and presenting."], 2, 3, rDifferent));
	rDifferent.addQuestion(new Question(["Staff morale, mental wellbeing and", "enjoyment are core values."], 2, 2, rDifferent));
	rDifferent.addQuestion(new Question(["Customer service is at the forefront of", "client relationships."], 2, 1, rDifferent));
	aRounds.push(rDifferent);
	totalRounds += 1;
	///*
	const rCulture = new Round("THE RIGHT PLACE TO BE", "Culture", background13);
	rCulture.addQuestion(new Question(["Further Observations"], 1, 15, rCulture));
	rCulture.addQuestion(new Question(["Describe the culture to a stranger:"], 1, 14, rCulture));
	rCulture.addQuestion(new Question(["How has the company adapted to", "generational changes?"], 1, 13, rCulture));
	rCulture.addQuestion(new Question(["If we could do one thing to improve your", "culture, what would it be?"], 1, 12, rCulture));
	rCulture.addQuestion(new Question(["How is unethical behaviour dealt with?"], 1, 11, rCulture));
	rCulture.addQuestion(new Question(["Overall, the staff are very satisfied with", "their employer."], 2, 10, rCulture));
	rCulture.addQuestion(new Question(["The values are distinctive and memorable."], 2, 9, rCulture));
	rCulture.addQuestion(new Question(["90%+ would recommend working here to", "a friend."], 2, 8, rCulture));
	rCulture.addQuestion(new Question(["There is a zero-tolerance policy against", "any kind of discrimination."], 2, 7, rCulture));
	rCulture.addQuestion(new Question(["Most staff would say they plan at least", "two more years here."], 2, 6, rCulture));
	rCulture.addQuestion(new Question(["Staff are willing to regularly give extra", "effort."], 2, 5, rCulture));
	rCulture.addQuestion(new Question(["The environment enables individuals to", "do their best work."], 2, 4, rCulture));
	rCulture.addQuestion(new Question(["Always looking for ways to aggressively", "reduce bureaucracy."], 2, 3, rCulture));
	rCulture.addQuestion(new Question(["It's such a positive environment to", "work."], 2, 2, rCulture));
	rCulture.addQuestion(new Question(["There is a very positive approach to", "diversity, racism and inclusivity."], 2, 1, rCulture));
	aRounds.push(rCulture);
	totalRounds += 1;

	const rProcess = new Round("THE RIGHT PLACE TO BE", "Making Every Step of the Process Work", background14);
	rProcess.addQuestion(new Question(["Further Observations"], 1, 15, rProcess));
	rProcess.addQuestion(new Question(["When trouble comes and situations arise", "how are they dealt with?"], 1, 14, rProcess));
	rProcess.addQuestion(new Question(["What obvious physical structures, layout", "or environment reveal the essence", "of the company?"], 1, 13, rProcess));
	rProcess.addQuestion(new Question(["What changes are needed?"], 1, 12, rProcess));
	rProcess.addQuestion(new Question(["Would you do business with yourself if", "you were a customer?"], 1, 11, rProcess));
	rProcess.addQuestion(new Question(["We are always willing to show important", "people around the office."], 2, 10, rProcess));
	rProcess.addQuestion(new Question(["The physical premises are correct for", "what we currently need."], 2, 9, rProcess));
	rProcess.addQuestion(new Question(["The quality of your plant and equipment", "is fit for purpose."], 2, 8, rProcess));
	rProcess.addQuestion(new Question(["When compared to others your delivery", "is well above the average."], 2, 7, rProcess));
	rProcess.addQuestion(new Question(["There are many retained long term", "service contracts."], 2, 6, rProcess));
	rProcess.addQuestion(new Question(["The audit trail is clear and easy to follow."], 2, 5, rProcess));
	rProcess.addQuestion(new Question(["Creating customised quotes and", "proposals is straight forward."], 2, 4, rProcess));
	rProcess.addQuestion(new Question(["There are clear and robust operational", "standards."], 2, 3, rProcess));
	rProcess.addQuestion(new Question(["No safety risks or short cuts are taken in", "the organisation."], 2, 2, rProcess));
	rProcess.addQuestion(new Question(["Quality is a top priority with this", "organisation."], 2, 1, rProcess));
	aRounds.push(rProcess);
	totalRounds += 1;

	//

	const rLeadership = new Round("WORLD, HERE WE COME!", "Leadership & Direction", background15);
	rLeadership.addQuestion(new Question(["Further Observations"], 1, 15, rLeadership));
	rLeadership.addQuestion(new Question(["What one thing could be done now that", "would improve the leadership?"], 1, 14, rLeadership));
	rLeadership.addQuestion(new Question(["How are future leaders encouraged to", "step up?"], 1, 13, rLeadership));
	rLeadership.addQuestion(new Question(["What are some informal practices leaders", "rely on to get work done?"], 1, 12, rLeadership));
	rLeadership.addQuestion(new Question(["What animal or meme would characterize", "the management style?"], 1, 11, rLeadership));
	rLeadership.addQuestion(new Question(["How would you describe the leadership", "exhibited?"], 1, 10, rLeadership));
	rLeadership.addQuestion(new Question(["There is a real sense of encouragement to", "develop full potential."], 2, 9, rLeadership));
	rLeadership.addQuestion(new Question(["Leaders are open to alternative directions."], 2, 8, rLeadership));
	rLeadership.addQuestion(new Question(["The leaders are open to input from", "employees."], 2, 7, rLeadership));
	rLeadership.addQuestion(new Question(["Senior leaders live the core values of the", "organisation."], 2, 6, rLeadership));
	rLeadership.addQuestion(new Question(["The leaders care about their employees'", "well being."], 2, 5, rLeadership));
	rLeadership.addQuestion(new Question(["The leadership have confidence in their", "abilities."], 2, 4, rLeadership));
	rLeadership.addQuestion(new Question(["There is a clear long-term strategy."], 2, 3, rLeadership));
	rLeadership.addQuestion(new Question(["The leadership is fit for purpose for the", "way ahead."], 2, 2, rLeadership));
	rLeadership.addQuestion(new Question(["There is a continuous commitment to", "change."], 2, 1, rLeadership));
	aRounds.push(rLeadership);
	totalRounds += 1;

	const rCommunication = new Round("WORLD, HERE WE COME!", "Communication Works", background16);
	rCommunication.addQuestion(new Question(["Further Observations"], 1, 15, rCommunication));
	rCommunication.addQuestion(new Question(["Describe a time where your", "communication approach made all the", "difference in that situation:"], 1, 14, rCommunication));
	rCommunication.addQuestion(new Question(["How does the company approach the", "provision of mentors, role models and", "support buddies?"], 1, 13, rCommunication));
	rCommunication.addQuestion(new Question(["What are the things that keep you awake", "at night about the business?"], 1, 12, rCommunication));
	rCommunication.addQuestion(new Question(["What was the last big achievement that", "was celebrated?"], 1, 11, rCommunication));
	rCommunication.addQuestion(new Question(["Changes are communicated in advance", "of implementation."], 2, 10, rCommunication));
	rCommunication.addQuestion(new Question(["Honest opinions is encouraged without", "fear of negative consequences."], 2, 9, rCommunication));
	rCommunication.addQuestion(new Question(["People like their work colleagues."], 2, 8, rCommunication));
	rCommunication.addQuestion(new Question(["There is a feeling of cooperation and", "trust."], 2, 7, rCommunication));
	rCommunication.addQuestion(new Question(["Two-way feedback, ideas and innovation", "is encouraged."], 2, 6, rCommunication));
	rCommunication.addQuestion(new Question(["Staff receive positive recognition for work", "that is well done."], 2, 5, rCommunication));
	rCommunication.addQuestion(new Question(["There is a feeling of trust towards", "information that is shared."], 2, 4, rCommunication));
	rCommunication.addQuestion(new Question(["There is a good understanding of how the", "company finances."], 2, 3, rCommunication));
	rCommunication.addQuestion(new Question(["At the heart of the company there is a", "spirit of fun and enjoyment."], 2, 2, rCommunication));
	rCommunication.addQuestion(new Question(["Internal communications are frequent", "and detailed enough."], 2, 1, rCommunication));
	aRounds.push(rCommunication);
	totalRounds += 1;

	const rInnovating = new Round("WORLD, HERE WE COME!", "Communication Works", background17);
	rInnovating.addQuestion(new Question(["Further Observations"], 1, 15, rInnovating));
	rInnovating.addQuestion(new Question(["What qualifications and ISO standards", "have been attained recently?"], 1, 14, rInnovating));
	rInnovating.addQuestion(new Question(["How are global discoveries considered", "and helping your evolution?"], 1, 13, rInnovating));
	rInnovating.addQuestion(new Question(["In what ways does the company create", "solutions to tomorrow's problems?"], 1, 12, rInnovating));
	rInnovating.addQuestion(new Question(["How would you describe your strong", "historical relationships with suppliers?"], 1, 11, rInnovating));
	rInnovating.addQuestion(new Question(["Technology (software and hardware)", "upgrades and issues are resolved in a", "timely manner."], 2, 10, rInnovating));
	rInnovating.addQuestion(new Question(["There is a continual focus on technology", "upgrades, new products and innovation", "of existing offering."], 2, 9, rInnovating));
	rInnovating.addQuestion(new Question(["There are no nasty legal battles affecting", "the company."], 2, 8, rInnovating));
	rInnovating.addQuestion(new Question(["All bills are paid on time."], 2, 7, rInnovating));
	rInnovating.addQuestion(new Question(["There is a good availability of", "management information."], 2, 6, rInnovating));
	rInnovating.addQuestion(new Question(["Purchasing procedures are well", "organised."], 2, 5, rInnovating));
	rInnovating.addQuestion(new Question(["There are reserves within the accounts", "for tough times."], 2, 4, rInnovating));
	rInnovating.addQuestion(new Question(["There is simple and clear succession", "planning."], 2, 3, rInnovating));
	rInnovating.addQuestion(new Question(["There is a continuous growth in turnover", "and staff."], 2, 2, rInnovating));
	rInnovating.addQuestion(new Question(["Profits are consistently heading in the", "right direction."], 2, 1, rInnovating));
	aRounds.push(rInnovating);
	totalRounds += 1;

	//

	const rTeamPeople = new Round("THERE ARE NO WEAK LINKS", "The Team - The People", background18);
	rTeamPeople.addQuestion(new Question(["Further Observations"], 1, 15, rTeamPeople));
	rTeamPeople.addQuestion(new Question(["What consistent efforts are being made", "with staff wellbeing?"], 1, 14, rTeamPeople));
	rTeamPeople.addQuestion(new Question(["How would you describe the approach to", "Mental Wealth?"], 1, 13, rTeamPeople));
	rTeamPeople.addQuestion(new Question(["Do you have a say in the organisation's", "policy changes?"], 1, 12, rTeamPeople));
	rTeamPeople.addQuestion(new Question(["Why are talented employees leaving?"], 1, 11, rTeamPeople));
	rTeamPeople.addQuestion(new Question(["The dress code reflects the company", "culture."], 2, 10, rTeamPeople));
	rTeamPeople.addQuestion(new Question(["The company is great at retaining the", "best talent."], 2, 9, rTeamPeople));
	rTeamPeople.addQuestion(new Question(["The geography of office location(s)", "works well."], 2, 8, rTeamPeople));
	rTeamPeople.addQuestion(new Question(["Staffing levels are adequate to provide", "quality products/services."], 2, 7, rTeamPeople));
	rTeamPeople.addQuestion(new Question(["Deadlines at this organisation are realistic."], 2, 6, rTeamPeople));
	rTeamPeople.addQuestion(new Question(["There are opportunities for incentives,", "rewards and share options."], 2, 5, rTeamPeople));
	rTeamPeople.addQuestion(new Question(["The recruitment process consistently", "finds great new people."], 2, 4, rTeamPeople));
	rTeamPeople.addQuestion(new Question(["Staff concerns are dealt with", "confidentially and promptly."], 2, 3, rTeamPeople));
	rTeamPeople.addQuestion(new Question(["There are backbone staff who might", "have a company logo tattoo."], 2, 2, rTeamPeople));
	rTeamPeople.addQuestion(new Question(["The company is blessed with and", "consistently looks after great staff."], 2, 1, rTeamPeople));
	aRounds.push(rTeamPeople);
	totalRounds += 1;

	const rYourRole = new Round("THERE ARE NO WEAK LINKS", "Your Role", background19);
	rYourRole.addQuestion(new Question(["Further Observations"], 1, 15, rYourRole));
	rYourRole.addQuestion(new Question(["What's the one major thing that's", "holding you back?"], 1, 14, rYourRole));
	rYourRole.addQuestion(new Question(["How could you improve the company", "benefits package?"], 1, 13, rYourRole));
	rYourRole.addQuestion(new Question(["Which of your personal habits do you", "need to start, stop or continue?"], 1, 12, rYourRole));
	rYourRole.addQuestion(new Question(["What part of your role inspires you the", "most?"], 1, 11, rYourRole));
	rYourRole.addQuestion(new Question(["My physical working environment is how I", "want it to be."], 2, 10, rYourRole));
	rYourRole.addQuestion(new Question(["Most days, I feel I have made progress at", "work."], 2, 9, rYourRole));
	rYourRole.addQuestion(new Question(["The importance of my role has a direct", "impact on success levels."], 2, 8, rYourRole));
	rYourRole.addQuestion(new Question(["My skills and abilities are consistently", "stretched in a good way."], 2, 7, rYourRole));
	rYourRole.addQuestion(new Question(["I have a good balance between work life", "and personal life."], 2, 6, rYourRole));
	rYourRole.addQuestion(new Question(["I would recruit me to do my role."], 2, 5, rYourRole));
	rYourRole.addQuestion(new Question(["Regularly I find myself working below my", "pay grade."], 2, 4, rYourRole));
	rYourRole.addQuestion(new Question(["There are enough trusted people available", "I can delegate to."], 2, 3, rYourRole));
	rYourRole.addQuestion(new Question(["There is a culture of teamwork and", "cooperation."], 2, 2, rYourRole));
	rYourRole.addQuestion(new Question(["I wake up every day and look forward to", "going to work."], 2, 1, rYourRole));
	aRounds.push(rYourRole);
	totalRounds += 1;

	const rImprovement = new Round("THERE ARE NO WEAK LINKS", "Continuous Improvement is the Norm", background20);
	rImprovement.addQuestion(new Question(["Further Observations"], 1, 15, rImprovement));
	rImprovement.addQuestion(new Question(["Describe your experience of working with", "coaches and mentors:"], 1, 14, rImprovement));
	rImprovement.addQuestion(new Question(["How do you respond to feedback from", "others?"], 1, 13, rImprovement));
	rImprovement.addQuestion(new Question(["What was your biggest challenge last", "year? What did you learn from it?"], 1, 12, rImprovement));
	rImprovement.addQuestion(new Question(["How often do you find yourself spending", "time lighting fires or putting them out?"], 1, 11, rImprovement));
	rImprovement.addQuestion(new Question(["Personal development plans are used to", "inspire creative thinking."], 2, 10, rImprovement));
	rImprovement.addQuestion(new Question(["When the wheels come off there to help", "and support."], 2, 9, rImprovement));
	rImprovement.addQuestion(new Question(["As life changes the company is flexible", "to help personal growth."], 2, 8, rImprovement));
	rImprovement.addQuestion(new Question(["Doing good work gets rewarded."], 2, 7, rImprovement));
	rImprovement.addQuestion(new Question(["Staff are encouraged to develop", "professionally and acquire new skills."], 2, 6, rImprovement));
	rImprovement.addQuestion(new Question(["Career path are aligned with skills and", "interests."], 2, 5, rImprovement));
	rImprovement.addQuestion(new Question(["The right resources are made available to", "encourage progress."], 2, 4, rImprovement));
	rImprovement.addQuestion(new Question(["There is ongoing training available for all."], 2, 3, rImprovement));
	rImprovement.addQuestion(new Question(["The induction programme for new", "starters is fit for purpose."], 2, 2, rImprovement));
	rImprovement.addQuestion(new Question(["Everyone has a personal and professional", "development plan."], 2, 1, rImprovement));
	aRounds.push(rImprovement);
	totalRounds += 1;
	
	aFinalRound = new FinalRound();
	aRounds.push(aFinalRound);
	totalRounds += 1;
}

makeRounds();

//
//PDF
//

//var imgLoaded = false;

var mpLogo = new Image();
//mpLogo.crossOrigin = '*';
mpLogo.src = 'mikeLogo.png';
//mpLogo.onload = function() { resolve(mpLogo); imgLoaded = true; };
//canvas.toDataURL(); */

var bcLogo = new Image();
bcLogo.src = 'catLogo.png';


function createSentenceFromArray(textArray) //puts seperated pieces of text together for the PDF
{
	var output = "";
	
	for (var p=0; p < textArray.length; p++)
	{
		if (p > 0) { output += " "; } //adds a space between words
		output += textArray[p];
	}
	
	return output;
}

function generatePDF()
{
	const doc = new jsPDF(); //create new blank pdf
	const docWidth = doc.internal.pageSize.width;
	const docHeight = doc.internal.pageSize.height;
	var roundCounter = [3,3,4,4,3,3]; //amount of rounds in each part of the question in order / used for calculating scores
	var roundScores = []; //stores the total score for each section
	var roundCounterPos = 0; //which round we are checking
	
	var textOut = []; //array to store sections of a sentence
	var questionText = ""; //stores the put-together sentence
	var wrapNum = 400; //when to wrap text to the next line
	var extraLines = 0; //amount of extra space if a line wraps to next line
	
	var tempScore = 0; //temporary variable whilst score is added up
	for (var a = 0; a < aRounds.length-1; a++) //for each round other than the final round
	{
		tempScore += aRounds[a].getTotalScore(); //add the total score for that round to the total
		roundCounter[roundCounterPos] -= 1; //go to next round in this section
		
		if (roundCounter[roundCounterPos] <= 0) //if all rounds in this section are checked
		{
			roundScores.push(tempScore); //add total score to array
			tempScore = 0; //reset the temporary value
			roundCounterPos += 1; //move to next section
		}
	}

	//doc.addImage(mpLogo, 'PNG', (docWidth * 0.5) - (mpLogo.width * 0.5), (docHeight * 0.5) - (mpLogo.height * 0.5), mpLogo.width, mpLogo.height); //add mike's logo (cannot get it to work though)
	doc.text("MENTAL WEALTH QUESTIONNAIRE", 10, 50);
	doc.text("For: " + username, 10, 70); //title page			
	doc.addPage();

	if (totalRounds > 1 && aFinalRound.activated) //this was here for testing purposes as final round is drawn out differently to the rest
	{
		for (var i=0; i < totalRounds-1; i++) //for each round that isnt the scorecard
		{
			var i2 = i; //needed for nested for loops
			extraLines = 0; //reset amount of extra lines for new page
			
			if (i == 0) //creates title page for each section of the questionnaire
			{
				doc.text("Personal Baseline - HOMEFRONT", 10, 50);
				doc.text("Your total score for this section was: " + roundScores[0], 10, 70);				
				doc.addPage();
			}
			else if (i == 3)
			{
				doc.text("Personal Baseline - PERSONAL RESPONSIBILITY", 10, 50);
				doc.text("Your total score for this section was: " + roundScores[1], 10, 70);				
				doc.addPage();
			}
			else if (i == 6)
			{
				doc.text("Personal Baseline - DIRECTION & DEVELOPMENT", 10, 50);
				doc.text("Your total score for this section was: " + roundScores[2], 10, 70);				
				doc.addPage();
			}
			else if (i == 10)
			{
				doc.text("Business Baseline - THE RIGHT PLACE TO BE!", 10, 50);
				doc.text("Your total score for this section was: " + roundScores[3], 10, 70);				
				doc.addPage();
			}
			else if (i == 14)
			{
				doc.text("Business Baseline - WORLD, HERE WE COME!", 10, 50);
				doc.text("Your total score for this section was: " + roundScores[4], 10, 70);				
				doc.addPage();
			}
			else if (i == 17)
			{
				doc.text("Business Baseline - THERE ARE NO WEAK LINKS", 10, 50);
				doc.text("Your total score for this section was: " + roundScores[5], 10, 70);				
				doc.addPage();
			}
			
			doc.text(aRounds[i].title, 10, 10);
			doc.text(aRounds[i].subtitle, 10, 20); //page header displaying section and round title
			
			for (var q=14; q > aRounds[i].writtenAnswers - 1; q -=1) //for each question in a round
			{	
				questionText = createSentenceFromArray(aRounds[i2].questions[q].txt); //put the text together
				
				if (i2 < 10) //if in the personal baseline section
				{
					if (aRounds[i2].questions[q].getAnswer() == 1) //if they answered yes
					{
						textOut = doc.splitTextToSize((15-q) + ". " + questionText + " YES", wrapNum);
					}
					else //if they answered no
					{
						textOut = doc.splitTextToSize((15-q) + ". " + questionText + " NO", wrapNum);
					}					
				}
				else //if in business baseline section
				{
					textOut = doc.splitTextToSize((15-q) + ". " + questionText + " " + aRounds[i2].questions[q].getAnswer(), wrapNum);
				}
				
				for (t=0; t < textOut.length; t++) //for each line of text to be added
				{
					if (t > 0) //if there is more than 1 new line
					{
						extraLines += 1; //increase amount of extra lines
					}
					doc.text(textOut[t], 10, 40 + (10 * (14 - q + extraLines))); //put text into pdf
				}
				
				textOut = []; //reset text
				
			}
			
			doc.addPage();
			
			doc.text(aRounds[i].title, 10, 10);
			doc.text(aRounds[i].subtitle, 10, 20);
			extraLines = 0;
			
			for (var j=(aRounds[i].writtenAnswers - 1); j >=0; j-=1) //for each written answer question
			{
				questionText = createSentenceFromArray(aRounds[i2].questions[j].txt);
				textOut = doc.splitTextToSize((15-j) + ". " + questionText, wrapNum);				
				for (t=0; t < textOut.length; t++)
				{
					if (t > 0)
					{
						extraLines += 1;
					}
					doc.text(textOut[t], 10, 30 + (10 * (aRounds[i2].writtenAnswers - j + extraLines)));
				}
				textOut = [];			
				
				textOut = doc.splitTextToSize(aRounds[i2].questions[j].getAnswer(), wrapNum);
				for (t=0; t < textOut.length; t++)
				{	
					extraLines += 1;
					doc.text(textOut[t], 10, 30 + (10 * (aRounds[i2].writtenAnswers - j + extraLines)));
				}
				textOut = [];
			}
			
			doc.addPage();
			extraLines = 0;
		}
	}
	
	if (aFinalRound.activated) //mainly here for testing purposes, adds details of final round if it is activated
	{
		
		doc.text("MENTAL WEALTH SCORECARD", 10, 50);
		doc.text("Your total score for this section was: " + aFinalRound.calcuateScore(), 10, 70); //title page
		
		doc.addPage();
		doc.text("MENTAL WEALTH SCORECARD", 10, 10); //page header
		
		for (var i=0; i < 25; i++) //for first half of members
		{
			if (aFinalRound.members[i].getName() != "" && aFinalRound.members[i].getName() != " ") //if they have a name
			{
				doc.text("Person " + i + ": " + aFinalRound.members[i].getName() + " - " + aFinalRound.members[i].getScore(), 10, 30 + (10 * i)); //display details
			}
			else //if not
			{
				doc.text("Person " + i + ": N/A", 10, 30 + (10 * i)); //display N/A
			}
		}
		
		doc.addPage();
		doc.text("MENTAL WEALTH SCORECARD", 10, 10);
		
		for (var i=0; i < aFinalRound.posMax - 25; i++) //same again for the second half
		{
			if (aFinalRound.members[i+25].getName() != "" && aFinalRound.members[i+25].getName() != " ")
			{
				doc.text("Person #" + (i+25) + ": " + aFinalRound.members[i+25].getName() + " - " + aFinalRound.members[i+25].getScore(), 10, 30 + (10 * i));
			}
			else
			{
				doc.text("Person " + (i+25) + ": N/A", 10, 30 + (10 * i));
			}
		}
	}
	
	let today = new Date().toLocaleDateString() //get current date for file name
	doc.save("mentalWealthScorecard" + today); //save pdf document
	gameOver = true; //end the game
}

//
//game
//

function gameLoop()
{
	if (!aFinalRound.activated) //if we are not at the final round
	{
		if (frameTimer > 0) //if an action happening
		{
			if (!player.dance) //if the player is not celebrating
			{		
				aRounds[currentRound].background.active = true; //move the background
			}
			player.active = true; //the player is walking
			frameTimer -= 1; //reduce action timer
		}
		else if (frameTimer == 0) //if timer is at 0
		{
			if (player.dance) //if player is celebrating
			{
				if (fadeAway) //if fade transition is activated
				{
					aRounds[currentRound].background.fadeOut = true; //begin animating transition
					frameTimer = fadeTimeTrue; //set the timer for the transition
				}
				else //if not
				{
					frameTimer = walkTime; //player is walking
				}
				player.dance = false;
				player.frameX = 0;
				player.frameY = 0;
			}
			else if ((currentRound == aRounds.length - 1) && (!fadeAway) && (!aFinalRound.activated)) //if at the last round, it is not activated and the fade transition has ended
			{
				aFinalRound.activate(); //activate the final round
			}
			else
			{
				aRounds[currentRound].startQuestion(); //start the next question in the new round
				player.active = false; //player is thinking
				frameTimer = -1; //reduce action timer to -1 so that this step does not repeat
			}
			aRounds[currentRound].background.active = false; //stop the background from moving
		}
		
		if (fadeAway) //if a fade transition is happening
		{
			fadeTime -= 1; //reduce timer per frame
			if (fadeTime == (fadeTimeTrue * 0.5)) //if halfway through the transition (background is invisible)
			{
				currentRound += 1; //move to the next round
				aRounds[currentRound].background.framesActive = gameFrame; //load the next background whilst it is not visible
			}
			else if (fadeTime <= 0) //if at the end of the fade
			{
				fadeAway = false; //no longer in the transition
			}
		}
	}
}

//
//animation
//

function updateAll()
{
	if (aButtons.length > 0)
	{
		for (var i=0; i<aButtons.length; i++)
		{
			aButtons[i].update();
		}
	}
	
	if (txtArea.length > 0)
	{
		console.log("TXTAREA");
		for (var i=0; i<txtArea.length; i++)
		{
			console.log(i + " " + txtArea[i].getText());
			txtArea[i].update();
		}
	}
}

function animate()
{
	gameLoop();
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#000000"
	ctx.fillRect(0, 0, canvas.width, canvas.height); //clear the canvas
	
	if (!endOfQuestions) //if questionnaire is still going
	{
		aRounds[currentRound].background.draw(); //draw the current round's corresponding background
	}
	else //if not
	{
		tBG.draw();
		tBG.active = false; //draw this background
	}
	
	player.update(); //update player animations
	player.draw(); //draw the player
	uiHand.draw(); //draw the UI
	mapDisplay.draw(); //draw the map/progress bar
	
	if (!endOfQuestions)
	{
		aRounds[currentRound].draw(); //draw current round and questions if active
	}
	else
	{			
			ctx.fillStyle = "#FFFFFF";
			ctx.font = "bold 32px Arial";
			ctx.fillText("THANKS FOR PLAYING!", (canvas.width * 0.0888), (canvas.height * 0.325));
			ctx.drawImage(mpLogo, 0, canvas.height * 0.08, mpLogo.width * 0.2 * txtMultiplier, mpLogo.height * 0.2 * txtMultiplier);
			ctx.drawImage(bcLogo, (canvas.width * 0.5) - ((bcLogo.width * 0.05) * 0.5), (canvas.height * 0.375), bcLogo.width * 0.05, bcLogo.height * 0.05); //draw end screen with logos/credits
	}
	
	drawObjs(aButtons); //draw any buttons that are active
	
	gameFrame++; //increase amount of frames that have passed
	window.requestAnimationFrame(animate); //recurse through this function
	
	if (endOfQuestions && !gameOver)// && imgLoaded) //if at the end
	{
		generatePDF(); //make the PDF
	}
}

resize();
animate(); //starts the game
