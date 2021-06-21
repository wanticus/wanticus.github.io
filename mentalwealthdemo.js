const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

canvas.width = window.innerHeight * 0.5625; //width of game area (450)
canvas.height = window.innerHeight; //height of game area (800)
let canvasRatio = canvas.height / canvas.width;
let txtMultiplier = (canvas.width/450);
let borderBuffer = canvas.width * 0.02; //used to evenly space objects around the canvas
let canvasPos = canvas.getBoundingClientRect();
let begin = false;

function resize() {
	
	//if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
	//{
		if ((canvas.width > 1.125) && (canvas.height > 2))
		{
			var canvasRatio = canvas.height / canvas.width;
			var windowRatio = window.innerHeight / (window.innerHeight * 0.5625);
			var width;
			var height;
			
			if (!(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)))
			{
				if (windowRatio < canvasRatio) {
					height = window.innerHeight * 0.95;// * 0.98;
					width = (height / canvasRatio);// * 0.98;
				} else {
					width = (window.innerHeight * 0.5625) * 0.95;// * 0.98;
					height = (width * canvasRatio);// * 0.98;
				}
			}
			else
			{
				windowRatio = (window.innerWidth * 1.7777) / window.innerWidth;
				if (windowRatio < canvasRatio) {
					height = window.innerWidth * 1.7777 * 0.75;// * 0.98;
					width = (height / canvasRatio);// * 0.98;
				} else {
					width = window.innerWidth * 0.75;// * 0.98;
					height = (width * canvasRatio);// * 0.98;
				}
			}

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
	//}
}

/* if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
{
	window.addEventListener('resize', updateAll, false);
}
else
{ */
	window.addEventListener('resize', resize, false);
//}

let username = ""; //stores name for use in the PDF at the end

let gameFrame = 0; //counts the amount of frames the game has been active for
let frameTimer = 100; //timer that counts down by 1 each frame when above 0, used for animations and transitions
let walkTime = 20; //amount of frames the player will walk between questions
let danceTime = 60; //amount of frames player will celebrate after select an option
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
	//canvas.focus();
	
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
/* canvas.addEventListener('keydown', function(event)
{
	window.localStorage.clear();
}); */


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
				txtArea.push(new TextBox(1, "textarea", 0.008, 0.1));
				this.bSubmit = new Bttn(0.3444, 0.465, 0.3333, 0.0625, "SUBMIT", 0, 1);
				aButtons.push(this.bSubmit);
				break;
				
			default:
				this.bTrue = new Bttn(0.1111, 0.37, 0.3333, 0.075, "YES", 1, 0);
				this.bFalse = new Bttn(0.54, 0.37, 0.3333, 0.075, "NO", 0, 0); //UPDATE THIS LOT AND SORT THE 'WHAT IF THE BUTTONS NEED EXTRA X COORDINATES' THING
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
		player.frameY = 0; //make sure player starts at the first frame of the animation
		//window.localStorage.setItem(this.pRound.subtitle + (15 - this.qNum), score);
	}
	
	getAnswer()
	{
		return this.answer;
	}
	
	/* getTxt()
	{
		return this.txt;
	} */
	
	draw(drawX, drawY) //draws all text of the screen for the question
	{
		ctx.save();
		
		ctx.fillStyle = "#000000";
		for (var i = 0; i < this.txt.length; i++) //draw each line of the question
		{
			ctx.fillText(this.txt[i], drawX, drawY + borderBuffer + ((canvas.height * 0.03) * i)); //canvas cannot wrap text so text is stored in an array line by line
		}
		
		if (this.type == 0)
		{
			ctx.drawImage(uiYesNo, 0, 0, canvas.width, canvas.height);
		}		
		else if (this.type == 1)
		{
			ctx.drawImage(uiText, 0, 0, canvas.width, canvas.height);
		}		
		else if (this.type == 2) //if this is a 1-5 question, display which end is low and which end is high
		{
			ctx.drawImage(ui1to5, 0, 0, canvas.width, canvas.height);
			
			ctx.fillStyle = "#FFFFFF";
			ctx.font = (16 * txtMultiplier) + "px Arial";
			ctx.fillText("LOW", borderBuffer * 2, (canvas.height * 0.52));
			ctx.fillText("HIGH", canvas.width - (borderBuffer * 2) - (canvas.width * 0.0777), (canvas.height * 0.52));
		}
		
		ctx.restore();
	}
}

class Round
{	
	constructor(title, subtitle)//, background)
	{
		this.title = title; //the title of the round e.g. The Homefront
		this.subtitle = subtitle; //the subsection of the round e.g. Family
		//this.background = background; //what background to display during this round
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
		if (window.localStorage.getItem(this.subtitle + (15 - newQ.qNum)) != null)
		{
			this.qNum -= 1;
			newQ.answer = window.localStorage.getItem(this.subtitle + (15 - newQ.qNum));
			if (newQ.type != 1)
			{
				newQ.answer = parseInt(newQ.answer);
			}
			if ((newQ.qNum == 15) && (currentRound < 2))
			{
				currentRound += 1;
				fadeRound += 1;
				if ((currentRound == 3) || (currentRound == 6) || (currentRound == 10) || (currentRound == 14) || (currentRound == 17) || (currentRound == 20))
				{
					background.bgNum -= 1;
					BGs.pop();
					background.img.src = BGs[BGs.length-1];
				}
			}
		}
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
				scr += this.questions[i].answer;
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
			if (currentRound == totalRounds-1) //if we are at the end of the questionnaire
			{
				endOfQuestions = true;
				gameOver = true;
				player.jump = true;
				player.end = true;
			}
			else
			{
				fadeTime = fadeTimeTrue;
			}
			player.jump = true;
			fadeAway = true;
			fadeRound += 1; //begin the fading transition
			sndRoundEnd.play();
		}
	}
	
	draw()
	{	
		ctx.save();
	
		ctx.fillStyle = "#FFFFFF";
		ctx.textAlign = 'center';
		ctx.font = "bold " + (26 * txtMultiplier) + "px Arial";
		ctx.fillText(this.title, (canvas.width*0.5), borderBuffer + (canvas.height * 0.034));
		
		ctx.font = "bold " + (18 * txtMultiplier) + "px Arial";
		ctx.fillText(this.subtitle, (canvas.width*0.5), (borderBuffer * 4) + (canvas.height * 0.028));
		//ctx.fillStyle = "#880000";
		//ctx.fillRect(borderBuffer, 370, ((canvas.width - (borderBuffer * 2)) / totalRounds) * currentRound, 20);
		
		ctx.textAlign = 'left';
		ctx.fillStyle = "#000000";
		//ctx.font = "14`1px Arial";
		if (this.qNum >= 0 && frameTimer <= 0 && !player.dance)
		{
			this.questions[this.qNum].draw(borderBuffer * 2, (canvas.height * 0.1) + borderBuffer + (canvas.height * 0.03));
		}
		
		ctx.restore();
	}
}

class ScorecardMember //object to store details of people on the Mental Wealth Team Scorecard
{
	constructor(id)
	{
		this.id = id;
		
		this.name = "";	
		if (window.localStorage.getItem('scorecardMember' + this.id + 'Name') != null)
		{
			this.name = window.localStorage.getItem('scorecardMember' + this.id + 'Name');
		}
		
		this.score = 5;
		if (window.localStorage.getItem('scorecardMember' + this.id + 'Score') != null)
		{
			this.score = parseInt(window.localStorage.getItem('scorecardMember' + this.id + 'Score'));
		}
	}
	
	getName()
	{
		return this.name;
	}
	
	setName(newName)
	{
		this.name = newName;
		window.localStorage.setItem('scorecardMember' + this.id + 'Name', newName);
	}
	
	getScore()
	{
		return this.score;
	}
	
	setScore(newScore)
	{
		this.score = newScore;
		window.localStorage.setItem('scorecardMember' + this.id + 'Score', newScore);
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
		//this.background = new Background(bg1, 5); //background to display for this part
		this.activated = false; //whether or not the round has been activated
		this.end = false; //whether we are at the end of the scorecard section
	}	
	
	activate() //create buttons, display background and text box
	{
		this.activated = true;
		background.startStop();
		player.active = false;
		player.dance = false;	
	
		for (var i=0; i<this.posMax+1; i++)
		{
			this.members.push(new ScorecardMember(i)); //create the people for the scorecard
		}
		
		txtArea.push(new TextBox(1, "textarea", 0.0012, 0.07));
		this.txtBox = txtArea[0];
		this.txtBox.setText(this.members[0].getName());
		
		aButtons.push(new Bttn(0.02, 0.3, 0.11, 0.125, "<", -1, 3));
		aButtons.push(new Bttn(0.8667, 0.3, 0.11, 0.125, ">", 1, 3));
		aButtons.push(new Bttn(0.275, 0.391, 0.0888, 0.0888, "-", -1, 4));
		aButtons.push(new Bttn(0.62, 0.393, 0.0888, 0.0888, "+", 1, 4));
		aButtons.push(new Bttn(0.3444, 0.474, 0.3333, 0.06, "SUBMIT", 0, 5));
	}
	
	deactivate() //end the scorecard section
	{
		this.end = true;
		for (var b=4; b>=0; b--)
		{
			delete aButtons[b];
			aButtons.pop(); //remove buttons
		}
		aButtons.push(new Bttn(0.2888, 0.45, 0.4444, 0.07, "GET RESULTS", 0, 6)); //add a new button to get the PDF
	}
	
	deactivateAgain() //generates the PDF and ends questionnaire
	{
		this.txtBox.remove();
		delete aButtons[0];
		aButtons.pop();
		endOfQuestions = true;
		player.dance = true;
		this.activated = false;
		player.end = true;
		sndEndGame.play();
	}
	
	scrollThrough(scrollVal) //scrolling through the list of scorecard members
	{
		this.members[this.pos].setName(this.txtBox.x.value); //saves the name in the text box for the current member
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
				ctx.save();
				//txtArea[0].update();
			
				ctx.fillStyle = "#FFFFFF";
				ctx.font = "bold " + (26 * txtMultiplier) + "px Arial";
				ctx.textAlign = 'center';
				ctx.fillText("MENTAL WEALTH", canvas.width*0.5, borderBuffer + (canvas.height * 0.037)); 	
				ctx.fillText("TEAM SCORECARD", canvas.width*0.5, borderBuffer + (canvas.height * 0.065));
				ctx.textAlign = 'left';
			
				if (this.end)
				{
					ctx.drawImage(uiName, 0, 0, canvas.width, canvas.height);
					
					ctx.font = (18 * txtMultiplier) + "px Arial";
					ctx.fillText("Your Name:", (canvas.width * 0.19), (canvas.height * 0.33));
					
					ctx.fillStyle = "#000000";
					ctx.font = "bold " + (20 * txtMultiplier) + "px Arial";
					ctx.fillText("Enter you name to get your results!", borderBuffer, (canvas.height * 0.13) + borderBuffer + (canvas.height * 0.015));
					ctx.fillText("(Refresh page to return to scorecard)", borderBuffer, (canvas.height * 0.16) + borderBuffer + (canvas.height * 0.015));
				}
				else
				{
					ctx.drawImage(uiScorecard, 0, 0, canvas.width, canvas.height);
					
					ctx.font = "bold " + (48 * txtMultiplier) + "px Arial";
					ctx.textAlign = 'center';
					ctx.fillText(this.members[this.pos].getScore(), (canvas.width * 0.49), (canvas.height * 0.43));
					ctx.textAlign = 'left';
					
					ctx.font = (18 * txtMultiplier) + "px Arial";
					ctx.fillText("Person #" + (this.pos + 1) + ":", (canvas.width * 0.19), (canvas.height * 0.33));
					
					ctx.fillStyle = "#000000";
					ctx.font = (16 * txtMultiplier) + "px Arial";
					ctx.fillText("Think about who already fits the bill for your mental wealth", borderBuffer, (canvas.height * 0.1) + borderBuffer + (canvas.height * 0.031));
					ctx.fillText("team in your existing network. Complete the following by", borderBuffer, (canvas.height * 0.1) + borderBuffer + (canvas.height * 0.056));
					ctx.fillText("scoring each person's commitment level to you between", borderBuffer, (canvas.height * 0.1) + borderBuffer + (canvas.height * 0.081));
					ctx.fillText("1-10, where 1 is low, and 10 is high. Do not overthink these", borderBuffer, (canvas.height * 0.1) + borderBuffer + (canvas.height * 0.106));
					ctx.fillText("numbers, it's just down to how you feel.", borderBuffer, (canvas.height * 0.1) + borderBuffer + (canvas.height * 0.129));
					//ctx.fillText("Only press 'SUBMIT' once you've entered everyone you can.", borderBuffer, (canvas.height * 0.1) + borderBuffer + (canvas.height * 0.1275));
				}
				
				ctx.restore();
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
		this.y = (canvas.height * 0.34);
		this.barHeight = (canvas.height * 0.0635);
	}
	
	draw()
	{
		if (((fadeTime <= (fadeTimeTrue * 0.98)) && (fadeTime >= (fadeTimeTrue * 0.02))) )// && currentRound > 0)
		{
			ctx.save();
			ctx.fillStyle = "#FFFFFF";
			ctx.textAlign = 'center';
			ctx.font = "bold " + (24 * txtMultiplier) + "px Arial";
			//ctx.fillText("STARTING ROUND " + (fadeRound+1) + " OF " + totalRounds, this.x + (canvas.width * 0.1555), this.y - (canvas.height * 0.0375));
			ctx.fillText("Coming Up Next:", (canvas.width * 0.5), this.y - (canvas.height * 0.035));
			if (fadeRound < totalRounds-1)
			{
				ctx.fillText(aRounds[fadeRound].title, (canvas.width * 0.5), this.y + this.barHeight + (canvas.height * 0.04));
				ctx.font = "bold " + (20 * txtMultiplier) + "px Arial";
				ctx.fillText(aRounds[fadeRound].subtitle, (canvas.width * 0.5), this.y + this.barHeight + (canvas.height * 0.08));
			}
			else
			{				
				ctx.fillText("MENTAL WEALTH", (canvas.width * 0.5), this.y + this.barHeight + (canvas.height * 0.04));
				ctx.fillText("TEAM SCORECARD", (canvas.width * 0.5), this.y + this.barHeight + (canvas.height * 0.08));
			}
			
			ctx.fillStyle = "#0099FF";
			ctx.fillRect(this.x, this.y, (((((canvas.width - (borderBuffer * 2)) / totalRounds) * fadeRound) - ((canvas.width - (borderBuffer * 2)) / totalRounds)) + (((canvas.width - (borderBuffer * 2)) / totalRounds) * ((fadeTimeTrue - fadeTime) / fadeTimeTrue))) * txtMultiplier, this.barHeight * txtMultiplier);
			
			ctx.drawImage(playerHead, (((((canvas.width - (borderBuffer * 2)) / totalRounds) * fadeRound) - ((canvas.width - (borderBuffer * 2)) / totalRounds)) + (((canvas.width - (borderBuffer * 2)) / totalRounds) * ((fadeTimeTrue - fadeTime) / fadeTimeTrue))) - (playerHead.width * 0.5) * txtMultiplier, this.y + (canvas.height * 0.0035) * txtMultiplier, playerHead.width * txtMultiplier, playerHead.height * txtMultiplier);
			ctx.textAlign = 'left';
			ctx.restore();
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
					if (txtArea[0].x.value == "" || txtArea[0].x.value == " ") //if text box is empty
					{
						aRounds[currentRound].answerQuestion("N/A", this.type); //set answer to N/A
					}
					else
					{
						aRounds[currentRound].answerQuestion(txtArea[0].x.value, this.type); //else get the text
					}
					delete aButtons[0];
					aButtons.pop();
					txtArea[0].remove(); //remove buttons and text box
					txtArea.pop();
					player.state = 2 + Math.floor(Math.random() * 3);
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
					aFinalRound.members[aFinalRound.pos].setName(aFinalRound.txtBox.x.value);
					aFinalRound.txtBox.setText("");
					aFinalRound.deactivate();
					player.state = 2 + Math.floor(Math.random() * 3);
					player.frameX = 0;
					player.frameY = 0;
					break;

				case 6:
					//if ((aFinalRound.txtBox.getText() != "") && (aFinalRound.txtBox.x.getText() != " "))
					//{
						username = aFinalRound.txtBox.getText();
						aFinalRound.deactivateAgain();
					//}
					break;
					
				case 7:
					window.localStorage.clear();
					sndDelete.play();
					break;
					
				case 8:
					if (!begin)
					{
						titleScreen.beginGame();
						sndStart.play();
					}
					break;
				
				default:
					var forMax = 1;
					if (this.type == 2)
					{
						forMax = 4;
					}				
				
					aRounds[currentRound].answerQuestion(this.score, this.type);
					for (var i = forMax; i >= 0; i--)
					{
						delete aButtons[i];
						aButtons.pop();
					}
					player.state = 2 + Math.floor(Math.random() * 3);
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
		ctx.save();
		if ((this.type != 0) && (this.type != 2) && (this.type != 3) && (this.type != 4))
		{
			ctx.fillStyle = "#FFFFFF";
			ctx.fillRect(this.x, this.y, this.width, this.height);
		}
		
		ctx.fillStyle = "#000000";
		ctx.font = "bold " + (24 * txtMultiplier) + "px Arial";
		ctx.fillText(this.txt, this.x + (this.width * 0.5) - (this.txt.length * 15 * 0.5 * txtMultiplier), this.y + (this.height * 0.65));
		ctx.restore();
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
		this.bgNum = 6;
	}
	
	draw()
	{
		if ((this.fadeOut) && fadeAway && ((fadeRound == 3) || (fadeRound == 6) || (fadeRound == 10) || (fadeRound == 14) || (fadeRound == 17) || (fadeRound == 20)))
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
		var imgNum = 3;
		
		ctx.save();
		ctx.globalAlpha = this.fadeValue; //global alpha is set to allow for the background to fade
		if (this.bgNum > 0)
		{
			ctx.translate(-xPos, 0);
			for (var i = 0; i < imgNum; i++)
			{
				ctx.drawImage(this.img, i * this.img.width * 0.5 * txtMultiplier, canvas.height - (this.img.height*0.5*txtMultiplier), this.img.width * 0.5 * txtMultiplier, this.img.height * 0.5 * txtMultiplier);
			}
		}
		else
		{
			ctx.drawImage(this.img, -1 * canvas.width * 0.13 * txtMultiplier, canvas.height - (this.img.height*0.5*txtMultiplier), this.img.width * 0.5 * txtMultiplier, this.img.height * 0.5 * txtMultiplier);
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
		
		ctx.drawImage(uiHeader, 0, 0, canvas.width, (canvas.height*0.1));
		
		ctx.fillStyle = "#FFFFFF";
		ctx.fillRect(0, canvas.height * 0.1, canvas.width, (canvas.height * 0.1) + (canvas.height * 0.05));
		
		if (!gameOver)
		{
			ctx.fillStyle = "#0099FF";
			ctx.fillRect(0, (canvas.height * 0.225), ((canvas.width) / 15) * (15 - aRounds[currentRound].qNum), (canvas.height * 0.025));		
			ctx.fillStyle = "#FFFFFF";
			ctx.font = "bold " + (11 * txtMultiplier) + "px Arial";
			ctx.fillText((15 - aRounds[currentRound].qNum) + "/15", (((canvas.width) / 15) * (15 - aRounds[currentRound].qNum)) - (canvas.width * 0.0644), canvas.height * 0.243);
		}
		else
		{			
			ctx.fillStyle = "#FFFFFF";
			ctx.textAlign = "center";
			ctx.font = "bold " + (42 * txtMultiplier) + "px Arial";
			ctx.fillText("CONGRATULATIONS", canvas.width*0.5, borderBuffer + (canvas.height * 0.06)); 	
			ctx.font = "bold " + (32 * txtMultiplier) + "px Arial";
			ctx.fillText("THANKS FOR PLAYING!", (canvas.width * 0.5), (canvas.height * 0.325));
			ctx.font = "bold " + (24 * txtMultiplier) + "px Arial";
			ctx.fillText("Purchase and play the whole", canvas.width*0.5, canvas.height*0.4);
			ctx.fillText("questionnaire to get your score!", canvas.width*0.5, canvas.height*0.43125);
			ctx.drawImage(mpLogo, 0, canvas.height * 0.1, mpLogo.width * 0.2 * txtMultiplier, mpLogo.height * 0.18 * txtMultiplier);//draw end screen with logos/credits
		}
		
		ctx.drawImage(uiLightsBottom, 0, (canvas.height*0.075), canvas.width, uiLightsBottom.height * 0.4 * txtMultiplier);
		ctx.drawImage(uiLightsBottom, 0, (canvas.height*0.225), canvas.width, uiLightsBottom.height * 0.4 * txtMultiplier);
		ctx.drawImage(uiLightsBottom, 0, canvas.height - (390*txtMultiplier), canvas.width, uiLightsBottom.height * 0.6 * txtMultiplier);
		
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
		this.sprites = [playerIdle, playerWalk, playerAnswer, playerSwing, playerFingerGuns, playerJump]; //array to store sprites in position of corresponding state number
		this.active = false; //whether playing is moving or standing still
		this.dance = false; //whether player has just answered a question or not
		this.jump = false;
		this.x = -(canvas.width * 0.4444);
		this.y = (canvas.height * 0.69);
		this.end = false;
	}
	
	update()
	{
		this.frameXMax = 4;
		this.frameYMax = 8;
		
		if (this.end)
		{
			this.state = 5;
			if (this.frameY == 0)
			{
				this.frameSpeed = 20;
			}
			else
			{
				this.frameSpeed = 2;
			}
		}
		else if (this.dance)
		{
			if (this.jump)
			{
				this.state = 5;
				this.frameSpeed = 2;
			}
			else if (this.state == 2)
			{
				this.frameXMax = 3;
				this.frameSpeed = 3;
			}
			else
			{
				this.frameSpeed = 2;
			}
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
				this.frameXMax = 1;
				this.frameYMax = 32;
				if (this.frameY <= 3)
				{
					this.frameSpeed = 30;
				}
				else
				{
					this.frameSpeed = 3;
				}
			}
		}
			
		this.x = -(canvas.width * 0.77);
		this.y = (canvas.height * 0.54);
		
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
		ctx.drawImage(this.sprites[this.state], (this.frameX * this.sprWidth), (this.frameY * this.sprHeight), this.sprWidth, this.sprHeight, this.x, this.y, this.sprWidth * 0.75 * txtMultiplier, this.sprHeight * 0.75 * txtMultiplier);	
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
		var txtValue = this.x.value;
		
		document.getElementById("txtdisplay").removeChild(this.x);
		
		this.x = document.createElement("TEXTAREA");
		this.x.setAttribute("type", this.type);
		this.x.setAttribute("rows", "" + Math.round(canvas.height * this.rows));
		this.x.setAttribute("cols", "" + Math.round(canvas.width * this.cols));
		this.x.setAttribute("font-size", "" + Math.round(24 * txtMultiplier));
		this.setText(txtValue);
		
		this.para.appendChild(this.x);
		document.getElementById("txtdisplay").appendChild(this.x);
	}
	
	remove()
	{
		document.getElementById("txtdisplay").removeChild(this.x);
		delete this;
	}
}

//
//TITLE SCREEN
//

class TitleScreen
{
	constructor()
	{
		aButtons.push(new Bttn(0.08, 0.35, 0.85, 0.12, "BEGIN", 0, 8));
		aButtons.push(new Bttn(0.32, 0.485, 0.38, 0.05, "CLEAR DATA", 0, 7));
		this.img = new Image();
		this.img.src = BGs[0];
	}
	
	beginGame()
	{
		aButtons.pop();
		aButtons.pop();

		player.active = true;
		
		makeRounds();
		begin = true;
	}
	
	draw()
	{
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(this.img, -100, canvas.height - (this.img.height*0.5*txtMultiplier), this.img.width * 0.5 * txtMultiplier, this.img.height * 0.5 * txtMultiplier);
		ctx.drawImage(mpLogo, 0, (canvas.height * 0.04), mpLogo.width * 0.2 * txtMultiplier, mpLogo.height * 0.18 * txtMultiplier);
		
		ctx.drawImage(uiLightsBottom, 0, -(canvas.height * 0.035), canvas.width, uiLightsBottom.height * 0.6 * txtMultiplier);
		ctx.drawImage(uiLightsBottom, 0, (mpLogo.height * 0.19 * txtMultiplier), canvas.width, uiLightsBottom.height * 0.6 * txtMultiplier);
		ctx.drawImage(uiLightsBottom, 0, canvas.height - (390*txtMultiplier), canvas.width, uiLightsBottom.height * 0.6 * txtMultiplier);
		
		ctx.drawImage(uiText, 0, canvas.height*0.1, canvas.width, canvas.height*0.85);
		
		ctx.fillStyle = "#FFFFFF";
		ctx.textAlign = 'center';
		ctx.font = "bold " + (42 * txtMultiplier) + "px Arial";
		ctx.fillText("MENTAL WEALTH", (canvas.width * 0.5), (canvas.height * 0.28));
		ctx.font = "bold " + (28 * txtMultiplier) + "px Arial";
		ctx.fillText("PLAYABLE QUESTIONNAIRE", (canvas.width * 0.5), (canvas.height * 0.32));
		ctx.font = "bold " + (14 * txtMultiplier) + "px Arial";
		ctx.fillText("Trial Version", (canvas.width * 0.88), (canvas.height * 0.53));
		ctx.textAlign = 'left';
		
		
	}
}
const titleScreen = new TitleScreen();
		
//
//create pieces
//

const player = new Player();
const mapDisplay = new MapScreen();
const uiHand = new UIHandler();

let bg = new Image()
bg.src = BGs[BGs.length-1];
const background = new Background(bg, 5);
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
//create questions
//

function makeRounds()
{
	const rFamily = new Round("THE HOME FRONT", "FAMILY")//, background1);
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
	
	const rHome = new Round("THE HOME FRONT", "HOME")//, background2);
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
	 
	const rPossessions = new Round("THE HOME FRONT", "POSSESSIONS / ADMINISTRATION")//, background3);
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
}

//
//PDF
//

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

	doc.text("MENTAL WEALTH QUESTIONNAIRE", 10, 50);
	doc.text("For: " + username, 10, 70); //title page			
	doc.addPage();

	
	if (totalRounds > 1 && !aFinalRound.activated) //this was here for testing purposes as final round is drawn out differently to the rest
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
					if (aRounds[i2].questions[q].answer == 1) //if they answered yes
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
					textOut = doc.splitTextToSize((15-q) + ". " + questionText + " " + aRounds[i2].questions[q].answer, wrapNum);
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
				
				textOut = doc.splitTextToSize(aRounds[i2].questions[j].answer, wrapNum);
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
	
	if (!aFinalRound.activated) //mainly here for testing purposes, adds details of final round if it is activated
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
	//if (!aFinalRound.activated) //if we are not at the final round
	//{
		if (frameTimer > 0) //if an action happening
		{
			if (!player.dance) //if the player is not celebrating
			{		
				background.active = true; //move the background
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
					background.fadeOut = true; //begin animating transition
					frameTimer = fadeTimeTrue; //set the timer for the transition
				}
				else //if not
				{
					frameTimer = walkTime; //player is walking
				}
				player.dance = false;
				player.jump = false;
				player.frameX = 0;
				player.frameY = 0;
			}
			else if (!gameOver)
			{
				aRounds[currentRound].startQuestion(); //start the next question in the new round
				player.active = false; //player is thinking
				frameTimer = -1; //reduce action timer to -1 so that this step does not repeat
			}
			background.active = false; //stop the background from moving
		}
		
		if (fadeAway) //if a fade transition is happening
		{
			fadeTime -= 1; //reduce timer per frame
			if (fadeTime == (fadeTimeTrue * 0.5)) //if halfway through the transition (background is invisible)
			{
				currentRound += 1; //move to the next round

				if ((currentRound == 3) || (currentRound == 6) || (currentRound == 10) || (currentRound == 14) || (currentRound == 17) || (currentRound == 20))
				{
					if (currentRound == 20)
					{
						fadeTime = fadeTime * 0.05;
						frameTimer = fadeTime;
					}
					
					background.bgNum -= 1;
					BGs.pop();
					background.fadeOut = !background.fadeOut;
					background.img.src = BGs[background.bgNum];
					background.framesActive = gameFrame; //load the next background whilst it is not visible
				}
			}
			else if (fadeTime <= 0) //if at the end of the fade
			{
				fadeAway = false; //no longer in the transition
			}
		}
	//}
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
		for (var i=0; i<txtArea.length; i++)
		{
			txtArea[i].update();
		}
	}
	
	mapDisplay.x = borderBuffer;
	mapDisplay.y = (canvas.height * 0.34);
}

function animate()
{
	ctx.beginPath();
	
	if (begin)
	{
		gameLoop();
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "#000000"
		ctx.fillRect(0, 0, canvas.width, canvas.height); //clear the canvas
		
		if (!endOfQuestions) //if questionnaire is still going
		{
			background.draw(); //draw the current round's corresponding background
		}
		else //if not
		{
			background.draw();
			background.active = false; //draw this background
		}
		
		player.update(); //update player animations
		player.draw(); //draw the player
		uiHand.draw(); //draw the UI
		mapDisplay.draw(); //draw the map/progress bar
		
		if (!endOfQuestions)
		{
			aRounds[currentRound].draw(); //draw current round and questions if active
		}
		
		if (endOfQuestions && !gameOver)// && imgLoaded) //if at the end
		{
			generatePDF(); //make the PDF
		}
		
		//ctx.fillStyle = "#FFFFFF"
		//ctx.fillText("FRAMES: " + gameFrame, canvas.width * 0.9, canvas.height * 0.02);
		
		ctx.closePath();
		
		if (txtArea.length > 0)
		{
/* 			if (document.activeElement.nodeName == 'TEXTAREA')
			{ */
				txtArea[0].x.focus();
			/*}
			else
			{ 
				txtArea[0].x.blur();
			}*/
		}
	}
	else
	{
		titleScreen.draw();
	}
		
	drawObjs(aButtons); //draw any buttons that are active
	
	gameFrame++; //increase amount of frames that have passed
	window.requestAnimationFrame(animate); //recurse through this function
}

resize();
animate(); //starts the game