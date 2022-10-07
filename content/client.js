var code;
var boardData;
var cardData;
var cardTitle;

let columns;

let newDiv;
let newHeader = document.createElement('strong');

var boardDiv = document.getElementById('boardDiv');

async function moveCard(id) {
    let userKey = login();
    let cardID = id;
    let cardElement = document.getElementById(cardID);
    let status = cardElement.parentElement.id;
    await fetch(`/board:${code}/moveCard:${cardID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': "Basic " + userKey },
        body: JSON.stringify({ status: status })
    }).then(res => res.text())
        .then(txt => {
            alert(txt);
            getBoard(code, userKey);
        })
}
// moves card

async function deleteCard(cardId, columnId) {
    let userKey = login();
    await fetch(`/board:${code}/deleteCard:${cardId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': "Basic " + userKey },
        body: JSON.stringify({ status: columnId })
    }).then(res => res.text())
        .then(txt => {
            alert(txt);
            getBoard(code, userKey);
        })
}
// delete card endpoint

function removeColumns() {
    let board = boardDiv;
    while (board.firstChild) {
        board.removeChild(board.firstChild)
    }
}
// removes all columns for referesh

async function completeSubTask(column, card, subTask){
    await fetch(`/board:${code}/column:${column}/task:${card}/${subTask}=complete`, {
        method: 'POST'
    }).then(res => res.text())
      .then(txt => alert(txt))
}
// mark subtask complete

function createSubTasks(card, subTasksObject) {
    let subTasks = Object.keys(subTasksObject);
    for (subTask of subTasks) {
        let status = subTasksObject[subTask].completed;
        let subTaskElement = document.createElement('p');
        subTaskElement.innerHTML = subTask;
        subTaskElement.id = subTask;
        // creating subTask
        let checkBox = document.createElement('input');
        checkBox.setAttribute("type", "checkbox");
        checkBox.checked = status ? true : false;
        // creating check box
        checkBox.onclick = function (event) {
            let subTask = event.currentTarget.parentElement
            let card = subTask.parentElement;
            let column = card.parentElement;
            completeSubTask(column.id, card.id, subTask.id);
        }
        // adding check box functionality
        subTaskElement.appendChild(checkBox);
        // adding check box to subtask
        card.appendChild(subTaskElement);
        // adding subTask to card
    }
    return card
}
// create subtasks function
// Object.keys: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys (accessed: 17/03/2022)
// HTML checkbox: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox (accessed: 17/03/2022)
// get information on clicked element: https://stackoverflow.com/questions/20059973/how-to-get-the-id-of-a-dynamic-element-when-clicked (accessed: 15/03/2022)

function createCards(column, cards) {
    let cardTitles = Object.keys(cards);
    let columnName = column;
    for (title of cardTitles) {
        let description = cards[title].description;
        let column = document.getElementById(columnName);
        let card = document.createElement('p');
        card.id = title;
        card.innerHTML = title + '-' + description;
        let deleteButton = document.createElement('button');
        deleteButton.innerHTML = 'delete'; 
        deleteButton.onclick = function (event) {
            let card = event.currentTarget.parentElement;
            let column = card.parentElement;
            deleteCard(card.id, column.id);
        };
        card.appendChild(deleteButton);
        // add delete button to each card
        let moveButton = document.createElement('button');
        moveButton.innerHTML = '>';
        moveButton.onclick = function (event) {
            let card = event.currentTarget.parentElement;
            moveCard(card.id);
        };
        card.appendChild(moveButton);
        //add move button to each card
        let subTasks = cards[title].subTasks;
        createSubTasks(card, subTasks);
        // add subtasks to card
        column.appendChild(card);
        // add card to column
    }
}
// create cards in column

function createColumn(column, cards) {
    let newDiv = document.createElement('div');
    newDiv.id = column;
    let newH1 = document.createElement('h1');
    newH1.innerHTML = column;
    newDiv.appendChild(newH1);
    boardDiv.appendChild(newDiv);
}
// create columns

function createBoard(columns, data){
    for (var i = 0; i < columns.length; i++) {
        if (i > 1) {
            let column = columns[i];
            let cards = data[column];
            createColumn(column, cards);
            createCards(column, cards);
        }
    }
}
// renders Kanban board
// i = 1 because first two properties for each board will be password and title, which are not columns

function login() {
    let boardId = code;
    let password = prompt('input password');
    userKey = btoa(boardId + ':' + password);
    return userKey
}
// login function prompts user for password

async function getBoard(code, userKey) {
    await fetch(`/boards/${code}`, { method: 'GET', headers: { 'Authorization': "Basic " + userKey } })
        .then(res => res.json())
        .then(data => {
            columns = Object.keys(data);
            removeColumns();
            createBoard(columns, data);
        })
        .catch(error => {
            console.log(error);
            alert("board ID or password incorrect!")})
}
// view specific board - grab from server
// requires correct passcode to view

async function AddBoard(){
    code = document.getElementById("code").value;
    let boardType = document.getElementById("default").selected ? 'default' : 'empty';
    let boardTitle = document.getElementById("title").value;
    let boardData = { title: boardTitle, boardType: boardType };
    await fetch(`/boards/${code}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(boardData)
    })
    .then(res => res.text())
        .then(txt => {
            alert(txt);
            let userKey = login();
            // grabbing password from user
            getBoard(code, userKey);
        })

}
// create new board

async function saveCard() {
    let userKey = login();
    let cardTitle = document.getElementById("card_title").value;
    let cardDescription = document.getElementById("description").value;
    let subTasks = document.getElementById("subtask").value;
    let subTaskArray = subTasks.split(',');
    let code = document.getElementById("code").value;
    let cardData = { code: code, title: cardTitle, description: cardDescription, subTasks: subTaskArray };
    // for a specific kanban board
    await fetch(`/createCard/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': "Basic " + userKey },
        body: JSON.stringify(cardData)
    })
    .then(res => res.text())
        .then(txt => {
            alert(txt);
            getBoard(code, userKey);
        })
}
// create card in first column of board

async function addColumn() {
    let userKey = login();
    let NAME = document.getElementById("columnName").value;
    let newColumn = {code: code, name: NAME}
    await fetch(`/board:${code}/addColumn:${NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': "Basic " + userKey },
        body: JSON.stringify(newColumn)
    })
    .then(res => res.text())
    .then(txt => {
        alert(txt);
        getBoard(code, userKey);
    })
}
// function adds new column to board

async function deleteColumn() {
    let userKey = login();
    let NAME = document.getElementById("columnName").value;
    await fetch(`/board:${code}/deleteColumn:${NAME}`, {
        method: 'POST',
        headers: { 'Authorization': "Basic " + userKey }
    })
        .then(res => res.text())
        .then(txt => {
            alert(txt);
            getBoard(code, userKey);
            }
        )
        .catch(err => console.log(err))
}
// function deletes specified column from board

// when the page load
window.onload = () => {
    document.getElementById("create_board").onclick = AddBoard;
    document.getElementById("create_card").onclick = saveCard;
    document.getElementById("create_column").onclick = addColumn;
    document.getElementById("delete_column").onclick = deleteColumn;
}