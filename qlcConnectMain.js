
var websocketQLC;
var isConnected = false;
const widgets = [];
var timer

var autoDetectNumber = 0;

var ip = "127.0.0.1:9999";
var wshost = "http:" + ip;

let value = 0;


//connectTowebsocketQLC(ip);

// helper function to send QLC+ API commands
function requestAPI(cmd) {
    if (isConnected === true)
        websocketQLC.send("QLC+API|" + cmd);
    else
        alert("You must connect to QLC+ WebSocket first!");
}
function requestAPIWithParam(cmd, num) {
    if (isConnected === true)
        websocketQLC.send("QLC+API|" + cmd + "|" + num);
    else
        alert("You must connect to QLC+ WebSocket first!");
}

let valueToCheck = "";

async function getVal(id,obj){
    requestAPIWithParam('getWidgetStatus',id);
    valueToCheck = "";
    return new Promise((resolve) => {
        const checkVar = () => {
        if (valueToCheck === "") {
            setTimeout(checkVar, 10);
        } else {
            loadAndSetImage(obj,value);
            resolve(valueToCheck);
        }
        };
        checkVar();
    });
}
const pressButton = function(id,value) {
    // alert(id);
    contextArray.filter(obj => obj.vcWidget == id).forEach(element => {
        // alert (element.id);
        loadAndSetImage(element,value);
    });
};

function qlcConnected() {
    return isConnected;
}

function connectToWebSocket(host) {
    var url = 'ws://' + host + '/qlcplusWS';
    websocketQLC = new WebSocket(url);
    // update the host information
    wshost = "http://" + host;



    websocketQLC.onopen = function (ev) {
        isConnected = true;
        loadSetting();
        alert("connected");

    };

    function disconnectWebsocet() {
        isConnected = false;
    };

    websocketQLC.onclose = () => {
        disconnectWebsocet();
    };

    websocketQLC.onerror = disconnectWebsocet();

    websocketQLC.onmessage = function (ev) {

        var msgParams = ev.data.split('|');

        if (msgParams[0] === "QLC+API") {
            if (msgParams[1] === "getWidgetStatus") {
                valueToCheck = msgParams[2];
            }
        }
        if (msgParams[1] === "BUTTON") {
            pressButton(msgParams[0],msgParams[2]);
        }
    };

}