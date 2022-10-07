var express = require('express');
var bodyParser = require('body-parser');
var { nanoid } = require("nanoid");
var basicAuth = require('basic-auth');
var app = express();
const API_PORT = 3000;
// using nanoid package: https://www.tabnine.com/code/javascript/modules/nanoid (accessed: 14/03/2022)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
// activating bodyParser

var boards = {};
// array to store all boards


var authorise = function (req, res, next) {
	var user = basicAuth(req);
	if (!user || boards[user.name].password !== user.pass) {
		return res.sendStatus(401)
	}
	req.username = user.name;
	next();
};
// authorisation function


app.get('/boards/:CODE', authorise, function (req, res, next) {
	let code = req.params.CODE;
	if (boards[code]) {
		res.status(200).json(boards[code]);
	}
	else {
		res.status(400).send("Board doesn't exist!");
	}
});
// view specific board endpoint

function addSubTasks(board, column, task, array) {
	for (subTask of array) {
		boards[board][column][task].subTasks[subTask] = { completed: false };
	}
}
// function adds subtasks to subTasks property of specific task

app.post('/createCard/:CODE', authorise, function (req, res, next) {
	let code = req.params.CODE;
	let title = req.body.title;
	let description = req.body.description;
	let subTasks = req.body.subTasks;
	let firstColumn = findNextColumn(code, 'new');
	if (boards[code][firstColumn]) {
		boards[code][firstColumn][title] = {
			description: description, subTasks: {} };
		addSubTasks(code, firstColumn, title, subTasks);
		res.status(200).send(`Added card to board ${code}`);
		console.log(boards[code])
	} else {
		res.status(400).send(`Cannot create card, board doesn't exist.`);
	}
});
// add card to first column of specific board 

app.post('/board::BOARD/column::COLUMN/task::TASK/:SUBTASK=complete', function (req, res, next) {
	let board = req.params.BOARD;
	let column = req.params.COLUMN;
	let task = req.params.TASK;
	let subTask = req.params.SUBTASK;
	if (boards[board][column][task].subTasks[subTask]) {
		boards[board][column][task].subTasks[subTask].completed = true;
		res.status(200).send(`${subTask} complete!`);
	} else {
		res.status(400).send('No such subtask!');
	}
});
// mark sub-task complete endpoint

app.post('/boards/:CODE', function (req, res, next) {
	let code = req.params.CODE;
	let title = req.body.title;
	let boardType = req.body.boardType;
	let password = nanoid();
	// generate unique password for each board created
	if (boards[code]) {
		res.status(400).send(`Cannot add ${code}. board already exists, proceeding to view exisitng board >>`);
	} else {
		boards[code] = boardType == 'default' ? {
			password: password, title: title, waiting: {}, inProgress: {}, completed: {}
		} : { password: password, title: title };
		res.status(200).send(`board ${code} created, password: ${password}`);
		// boards are created with password property, and password is sent back to user
	}
});
// create new board endpoint, if board doesn't already exist

function findNextColumn(boardCode, status) {
	let nxtColumn;
	let nxtColumnIsIt = 0;
	for (property in boards[boardCode]) {
		if (status == 'new' && property != 'title' && property != 'password') { nxtColumn = property; break }
		else if (property == status) { nxtColumnIsIt = 1; }
		else if (nxtColumnIsIt == 1) { nxtColumn = property; break };
	}
	return nxtColumn
}
// function finds next column, based on card's current column

app.post('/board::BOARD/moveCard::TITLE', authorise, function (req, res, next) {
	let board = req.params.BOARD;
	let title = req.params.TITLE;
	let status = req.body.status
	let nxtColumn = findNextColumn(board, status);
	if (nxtColumn == undefined) {
		res.status(400).send(`Card cannot be moved!`);
	} else {
		boards[board][nxtColumn][title] = Object.assign(boards[board][status][title]);
		delete boards[board][status][title]
		res.status(200).send(`Card moved to ${nxtColumn}!`);
	}
});
// move card endpoint
// create copy of object: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign (accessed: 14/03/2022)
// delet object: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/delete (accessed: 14/03/2022)

app.post("/board::BOARD/deleteCard::TITLE", authorise, function (req, res, next) {
	let board = req.params.BOARD;
	let title = req.params.TITLE;
	let status = req.body.status;
	if (boards[board][status][title]) {
		delete boards[board][status][title];
		res.status(200).send(`Card deleted!`);
	} else {
		res.status(400).send('Card not found!');
	}
});
// delete card endpoint

app.post("/board::BOARD/addColumn::NAME", authorise, function (req, res, next) {
	let board = req.params.BOARD;
	let name = req.params.NAME;
	if (boards[board][name]) {
		res.status(400).send(`Column already exists!`);
	} else {
		boards[board][name] = {};
		res.status(200).send(`Column ${name} added!`);
	}
});
// add column endpoint

app.post("/board::BOARD/deleteColumn::NAME", authorise, function (req, res, next) {
	let board = req.params.BOARD;
	let name = req.params.NAME;
	if (boards[board][name]) {
		delete boards[board][name];
		res.status(200).send(`Column deleted!`);
	} else {
		res.status(400).send('Column not found!');
	}
});
// delete column endpoint     

app.use(express.static('content'));

app.listen(API_PORT, () => {
	console.log(`Listening on localhost:${API_PORT}`)
});
