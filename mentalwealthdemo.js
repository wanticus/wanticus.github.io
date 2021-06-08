const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

canvas.width = 450; //width of game area
canvas.height = 800; //height of game area

let username = ""; //stores name for use in the PDF at the end

let gameFrame = 0; //counts the amount of frames the game has been active for
let frameTimer = 150; //timer that counts down by 1 each frame when above 0, used for animations and transitions
let walkTime = 150; //amount of frames the player will walk between questions
let danceTime = 40; //amount of frames player will celebrate after select an option
let fadeTimeTrue = 202; //time to reset the timer to for fading transistions
let fadeTime = 202; //timer for fading in and out
let fadeRound = 0; //used to display which round is coming up next, not which round is currently active
let borderBuffer = canvas.width * 0.02; //used to evenly space objects around the canvas
let clickBuffer = 5; //stops mashing clicks
let clickBufferCheck = 0; //counts down by 1 every frame when above zero, to check if another click can be made
let currentRound = 0; //number currently active round
let totalRounds = 20; //amount of rounds in total
let endOfQuestions = false; //determines when the player is at the end of all questions
let gameOver = false; //used to know when the entire questionnaire is complete, stops multiple PDFs from being generated
let fadeAway = false; //used to check whether a fade transition is currently happening

//arrays
let aButtons = []; //stores buttons that are currently on screen
let aRounds = []; //stores each round of questions
let txtArea = []; //stores text boxes when needed

//Mouse
let canvasPos = canvas.getBoundingClientRect();

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
				this.b1 = new Bttn(25, 300, 60, 60, "1", 1, 2);
				this.b2 = new Bttn(110, 300, 60, 60, "2", 2, 2);
				this.b3 = new Bttn(195, 300, 60, 60, "3", 3, 2);
				this.b4 = new Bttn(280, 300, 60, 60, "4", 4, 2);
				this.b5 = new Bttn(365, 300, 60, 60, "5", 5, 2);
				aButtons.push(this.b1);
				aButtons.push(this.b2);
				aButtons.push(this.b3);
				aButtons.push(this.b4);
				aButtons.push(this.b5);
				break;				
			
			case 1:
				txtArea.push(new TextBox(1, "textarea", "8", "50"));
				this.bSubmit = new Bttn(155, 370, 150, 50, "SUBMIT", 0, 1);
				aButtons.push(this.bSubmit);
				break;
				
			default:
				this.bTrue = new Bttn(50, 300, 150, 60, "YES", 1, 0);
				this.bFalse = new Bttn(250, 300, 150, 60, "NO", 0, 0);
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
			ctx.fillText(this.txt[i], drawX, drawY + (22 * i)); //canvas cannot wrap text so text is stored in an array line by line
		}
		
		if (this.type == 2) //if this is a 1-5 question, display which end is low and which end is high
		{
			ctx.fillStyle = "#FFFFFF";
			ctx.font = "16px Arial";
			ctx.fillText("LOW", borderBuffer * 2, 390);
			ctx.fillText("HIGH", canvas.width - (borderBuffer * 2) - 35, 390);
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
		}
	}
	
	draw()
	{		
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "bold 28px Arial";
		ctx.fillText(this.title, borderBuffer, borderBuffer + 24);
		
		ctx.font = "bold 20px Arial";
		ctx.fillText(this.subtitle, borderBuffer, 60);
		
		ctx.fillStyle = "#0099FF";
		ctx.fillRect(0, canvas.height * 0.225, ((canvas.width) / 15) * (15 - this.qNum), 20);
		//ctx.fillStyle = "#880000";
		//ctx.fillRect(borderBuffer, 370, ((canvas.width - (borderBuffer * 2)) / totalRounds) * currentRound, 20);
		
		ctx.fillStyle = "#000000";
		ctx.font = "14`1px Arial";
		if (this.qNum >= 0 && frameTimer <= 0 && !player.dance)
		{
			this.questions[this.qNum].draw(borderBuffer * 2, (canvas.height * 0.1) + borderBuffer + 24);
		}
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "bold 11px Arial";
		ctx.fillText((15 - this.qNum) + "/15", (((canvas.width) / 15) * (15 - this.qNum)) - 29, canvas.height * 0.243);
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
		this.background = new Background(pt2BGspr, 5); //background to display for this part
		this.activated = false; //whether or not the round has been activated
		this.end = false; //whether we are at the end of the scorecard section
	}	
	
	activate() //create buttons, display background and text box
	{
		this.activated = true;
		this.background.startStop();
		player.active = false;
		player.dance = false;
		
		this.txtBox = new TextBox(1, "textarea", "1", "35");
		
		for (var i=0; i<this.posMax+1; i++)
		{
			this.members.push(new ScorecardMember()); //create the people for the scorecard
		}
		
		aButtons.push(new Bttn(borderBuffer, 250, 50, 100, "<", -1, 3));
		aButtons.push(new Bttn(canvas.width - 50 - borderBuffer, 250, 50, 100, ">", 1, 3));
		aButtons.push(new Bttn(borderBuffer + (canvas.width * 0.25), 320, 40, 40, "-", -1, 4));
		aButtons.push(new Bttn(canvas.width - (canvas.width * 0.25) - 50 - borderBuffer, 320, 40, 40, "+", 1, 4));
		aButtons.push(new Bttn((canvas.width *0.5) - 75, 385, 150, 40, "SUBMIT", 0, 5));
	}
	
	deactivate() //end the scorecard section
	{
		this.end = true;
		for (var b=0; b<5; b++)
		{
			aButtons.pop(); //remove buttons
		}
		aButtons.push(new Bttn((canvas.width *0.5) - 100, 385, 200, 40, "GET RESULTS", 0, 6)); //add a new button to get the PDF
	}
	
	deactivateAgain() //generates the PDF and ends questionnaire
	{
		this.txtBox.remove();
		aButtons.pop();
		endOfQuestions = true;
		player.dance = true;
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
			console.log(value + " " + maxValue);
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
				ctx.fillStyle = "#FFFFFF";
				ctx.font = "bold 32px Arial";
				ctx.fillText("MENTAL WEALTH", borderBuffer, borderBuffer + 24); 	
				ctx.fillText("TEAM SCORECARD", borderBuffer, borderBuffer + 60);
			
				if (this.end)
				{		
					ctx.font = "18px Arial";
					ctx.fillText("Your Name:", 90, 270);
					
					ctx.fillStyle = "#000000";
					ctx.font = "bold 20px Arial";
					ctx.fillText("Enter you name to get your results!", borderBuffer, (canvas.height * 0.1) + borderBuffer + 12);
				}
				else
				{
					ctx.font = "bold 48px Arial";
					ctx.fillText(this.members[this.pos].getScore(), (canvas.width * 0.5) - 24, 350);
					
					ctx.font = "18px Arial";
					ctx.fillText("Person #" + (this.pos + 1) + ":", 90, 270);
					
					ctx.fillStyle = "#000000";
					ctx.font = "16px Arial";
					ctx.fillText("Think about who already fits the bill for your mental wealth", borderBuffer, (canvas.height * 0.1) + borderBuffer + 12);
					ctx.fillText("team in your existing network. Complete the following by", borderBuffer, (canvas.height * 0.1) + borderBuffer + 30);
					ctx.fillText("scoring each person's commitment level to you between", borderBuffer, (canvas.height * 0.1) + borderBuffer + 48);
					ctx.fillText("1-10, where 1 is low, and 10 is high. Do not overthink these", borderBuffer, (canvas.height * 0.1) + borderBuffer + 66);
					ctx.fillText("numbers, it's just down to how you feel.", borderBuffer, (canvas.height * 0.1) + borderBuffer + 84);
					ctx.fillText("Only press 'SUBMIT' once you've entered everyone you can.", borderBuffer, (canvas.height * 0.1) + borderBuffer + 102);
				
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
		this.y = 300;
		this.barHeight = 50;
	}
	
	draw()
	{
		if (((fadeTime <= (fadeTimeTrue * 0.98)) && (fadeTime >= (fadeTimeTrue * 0.02))) )// && currentRound > 0)
		{
			ctx.fillStyle = "#FFFFFF";
			ctx.font = "bold 24px Arial";
			ctx.fillText("STARTING ROUND " + fadeRound + " OF " + totalRounds, this.x + 70, this.y - 30);
			ctx.fillText("KEEP IT UP!", this.x + 120, this.y + this.barHeight + 35);
			
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
	constructor(x, y, width, height, txt, score, type)
	{
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.txt = txt;
		this.score = score;
		this.type = type; // 0 : true or false / 1 : submit text / 2 : 1 to 5 / 3 : scrolling scorecard members / 4 : changing scorecard members score / 5 : submit scorecard / 6 : generate pdf
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
					
				case 7:
					window.open("https://www.mikepagan.com/"); //replace with store link
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
					break;
			}
	}
	
	draw()
	{
		ctx.fillStyle = "#FFFFFF";
		ctx.fillRect(this.x, this.y, this.width, this.height);
		ctx.fillStyle = "#000000";
		ctx.font = "bold 24px Arial";
		ctx.fillText(this.txt, this.x + (this.width * 0.5) - (this.txt.length * 15 * 0.5), this.y + (this.height * 0.65));
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
		var xPos = this.framesActive * this.scrollSpd % this.img.width;
		var imgNum = 2;
		
		ctx.save();
		ctx.globalAlpha = this.fadeValue; //global alpha is set to allow for the background to fade
		ctx.translate(-xPos, 0);
		for (var i = 0; i < imgNum; i++)
		{
			ctx.drawImage(this.img, i * this.img.width, canvas.height - this.img.height);
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
		this.x = -200;
		this.y = 510;
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
		ctx.drawImage(this.sprites[this.state], (this.frameX * this.sprWidth), (this.frameY * this.sprHeight), this.sprWidth, this.sprHeight, this.x, this.y, this.sprWidth * 0.5, this.sprHeight * 0.5);	
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
		this.para = document.createElement("P");
		this.x = document.createElement("TEXTAREA");
		this.x.setAttribute("type", type);
		this.x.setAttribute("rows", rows);
		this.x.setAttribute("cols", cols);
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

const tBG = new Background(testBG, 5);
const tBG2 = new Background(testBG2, 5);//tBG.active = true;
const pt2BG = new Background(pt2BGspr, 5);

//
//create questions
//

function makeRounds()
{
	const rFamily = new Round("THE HOME FRONT", "FAMILY", tBG);
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
	//totalRounds += 1;

	const rHome = new Round("THE HOME FRONT", "HOME", tBG2);
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
	//totalRounds += 1;

	const rPossessions = new Round("THE HOME FRONT", "POSSESSIONS / ADMINISTRATION", pt2BG);
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
	//totalRounds += 1;

	aFinalRound = new FinalRound();
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
				if ((currentRound > 2) && (!gameOver))
				{
					endOfQuestions = true;
					gameOver = true;
					aButtons.push(new Bttn(105, 370, 240, 50, "PURCHASE", 0, 7));
				}
				else
				{
					aRounds[currentRound].background.framesActive = gameFrame; //load the next background whilst it is not visible
				}

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
	if (!endOfQuestions)
	{
		mapDisplay.draw(); //draw the map/progress bar
	}
	
	if (!endOfQuestions)
	{
		aRounds[currentRound].draw(); //draw current round and questions if active
	}
	else
	{			
			ctx.fillStyle = "#FFFFFF";
			ctx.font = "bold 32px Arial";
			ctx.fillText("THANKS FOR PLAYING!", 40, 260);
			ctx.font = "bold 24px Arial";
			ctx.fillText("Purchase and play the whole", 50, 320);
			ctx.fillText("questionnaire to get your score!", 40, 345);
			ctx.drawImage(mpLogo, 0, canvas.height * 0.08, mpLogo.width * 0.2, mpLogo.height * 0.2);
			//ctx.drawImage(bcLogo, (canvas.width * 0.5) - ((bcLogo.width * 0.05) * 0.5), 300, bcLogo.width * 0.05, bcLogo.height * 0.05); //draw end screen with logos/credits
	}
	
	drawObjs(aButtons); //draw any buttons that are active
	
	gameFrame++; //increase amount of frames that have passed
	window.requestAnimationFrame(animate); //recurse through this function
	
	if (endOfQuestions && !gameOver)// && imgLoaded) //if at the end
	{
		generatePDF(); //make the PDF
	}
}
animate(); //starts the game