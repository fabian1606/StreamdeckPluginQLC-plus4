
var websocketQLC;
var isConnected = false;
const widgets = [];
var timer

var autoDetectNumber = 0;

var ip = "127.0.0.1:9999";
var wshost = "http:"+ip;

var selectId;

//connectTowebsocketQLC(ip);

// helper function to send QLC+ API commands
function requestAPI(cmd)
{
  if (isConnected === true)
  websocketQLC.send("QLC+API|" + cmd);
  // else
    // alert("You must connect to QLC+ WebSocket first!");
}
function requestAPIWithParam(cmd, num)
{
    if (isConnected === true)
      websocketQLC.send("QLC+API|" + cmd + "|" + num);
    // else
      // alert("You must connect to QLC+ WebSocket first!");
}
function autoDetectWidget(number, id){
    selectId = id;
    document.getElementById(id).style.backgroundColor = "#893c2f";
            //alert(element.id);
            if(number< widgets.length){
                //alert(widgets[number].id);
            requestAPIWithParam('getWidgetStatus',widgets[number].id);
            }

}

function connectToWebSocket(host) {
    var url = 'ws://' + host + '/qlcplusWS';
    websocketQLC = new WebSocket(url);
    // update the host information
    wshost = "http://" + host;

    

    websocketQLC.onopen = function(ev) {
        document.getElementById('connected').style.backgroundColor = "#00ff00";
        document.getElementById('connected').style.color = "black";
        document.getElementById('connected').innerHTML= "connected";
        document.getElementById("connect-qlc-container").open = false;
        //document.getElementById('content-if-connected').style.display = "block";
        isConnected = true;
        requestAPI('getWidgetsList');
        loadSetting();
    
    };

    function disconnectWebsocet(){
        document.getElementById('connected').style.backgroundColor = "#ff0000";
        document.getElementById('connected').style.color = "#ffffff";
        document.getElementById('connected').innerHTML= "Not Connected";
        isConnected = false;
    };

    websocketQLC.onclose  = ()=>{ 
      disconnectWebsocet();
      document.getElementById("connect-qlc-container").open = true;
    };

    websocketQLC.onerror = disconnectWebsocet();//(ev) {
    //alert("QLC+ connection error!");
    //};

    // websocketQLC message handler. This is where async events
    // will be shown or processed as needed
    websocketQLC.onmessage = function(ev) {
        //alert("widget");
      // Uncomment the following line to display the received message
      //alert(ev.data);
  
      // Event data is formatted as follows: "QLC+API|API name|arguments"
      // Arguments vary depending on the API called
  
      var msgParams = ev.data.split('|');
  
      if (msgParams[0] === "QLC+API")
      {
      if (msgParams[1] === "getWidgetsNumber")
        {
          //document.getElementById('getWidgetsNumberBox').innerHTML = msgParams[2];
        }
        // Arguments is an array formatted as follows:
        // Widget ID|Widget name|Widget ID|Widget name|...
        else if (msgParams[1] === "getWidgetsList")
        {   
            console.log("widget");
          var tableCode = "";
          for (i = 2; i < msgParams.length; i+=2)
          {
            //tableCode = tableCode + 'option selected value="' + msgParams[i] + "'>" + msgParams[i + 1] + "</option>";
            //tableCode = tableCode + "option selected value='0'>test</option>";
            var option = document.createElement("option");
            option.text = msgParams[i+1];
            option.value = msgParams[i];
            document.getElementById('select-vc-widget').add(option);
            var option2 = document.createElement("option");
            option2.text = msgParams[i+1];
            option2.value = msgParams[i];
            document.getElementById('select-vc-widget2').add(option2);
            const newObject = {id:msgParams[i],name:msgParams[i+1]};
            widgets.push(newObject);
          }
          //document.getElementById('select-vc-widget').innerHTML = tableCode;
        }
        else if (msgParams[1] === "getWidgetType")
        {
          //document.getElementById('getWidgetTypeBox').innerHTML = msgParams[2];
        }
        else if (msgParams[1] === "getWidgetStatus")
        {
          var status = msgParams[2];
          console.log(msgParams);

          if(! widgets[autoDetectNumber].hasOwnProperty('status')||widgets[autoDetectNumber].status == ""){
            widgets[autoDetectNumber].status = status;
            if(autoDetectNumber < widgets.length-1)autoDetectNumber++;
            else autoDetectNumber = 0;
            autoDetectWidget(autoDetectNumber,selectId);
            //alert("here");
          }
          else if(widgets[autoDetectNumber].status === status){
            if(autoDetectNumber < widgets.length-1)autoDetectNumber++;
            else autoDetectNumber = 0;    
            autoDetectWidget(autoDetectNumber,selectId);
          }
          else{
            document.getElementById(selectId).style.backgroundColor = "#627645";
            setInterval(function() {document.getElementById(selectId).style.backgroundColor = "#3d3d3d"},1000);
            let select = document.getElementById("select"+selectId.split("button")[1]);
            select.value=select.options[autoDetectNumber+1].value;
            select.dispatchEvent(new Event('change'));
            autoDetectNumber = 0;
            widgets.forEach(widget => {
              widget.status = "";
            });
          }
        }
      }
    };
    
}