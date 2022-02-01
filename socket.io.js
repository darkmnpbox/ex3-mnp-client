import { io } from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js";

const socket = io("http://localhost:4002");

function showMessage(message, color) {
    const messages_element = document.getElementById('messages');
    const message_element = document.createElement('div');
    message_element.setAttribute("class", "alert alert-" + color)
    message_element.setAttribute("role", "alert")
    messages_element.appendChild(message_element);
    message_element.innerHTML = message;
    setTimeout(() => {
        messages_element.removeChild(message_element);
    }, 10000)
}

socket.on("connect", () => {
    showMessage('socket has been connected...', 'success');
    console.log("socket has been connected.");
});

socket.on("socketIdFromServer", (data) => {
    showMessage('socket id: ' + data.socketId, 'info');
    sessionStorage.setItem("socketId", data.socketId);
    console.log(data);
});

socket.on("successResponseFromServer", (data) => {
    showMessage(data.message, 'success');
    removeRequestFromRequestMap(data.requestId);
    console.log(data);
});

socket.on("errorResponseFromServer", (data) => {
    showMessage(data.message, 'danger');
    removeRequestFromRequestMap(data.requestId);
    console.log(data);
});

function removeRequestFromRequestMap(requestId) {
    if (sessionStorage.getItem('RequestMap')) {
        let requestMap = JSON.parse(sessionStorage.getItem('RequestMap'));
        if (requestMap[requestId]) {
            delete requestMap[requestId];
            sessionStorage.setItem('RequestMap', JSON.stringify(requestMap));
            showMessage(`Request with id : ${requestId} removed. RequsetMap updated...`, 'info');
        } else {
            showMessage(`Unregistered requestId : ${requestId} recived...`, 'danger');
        }
    } else {
        showMessage('Somthing went wrong in Request Map, Not found...', 'danger');
    }
}