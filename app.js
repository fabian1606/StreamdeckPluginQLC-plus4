let vcWidget = "";
let vcWidgetValue = 255;
let vcWidgetRes = "";
let vcWidgetResValue = 255;

const getPropFromString = (jsn, str, sep = '.') => {
    const arr = str.split(sep);
    return arr.reduce((obj, key) =>
        (obj && obj.hasOwnProperty(key)) ? obj[key] : undefined, jsn);
};

var websocket = null,
    uuid = null,
    piContext = 0,
    MActions = {},
    runningApps = [],
    contextArray = [],
    DestinationEnum = Object.freeze({'HARDWARE_AND_SOFTWARE': 0, 'HARDWARE_ONLY': 1, 'SOFTWARE_ONLY': 2});

function connectElgatoStreamDeckSocket(
    inPort,
    inUUID,
    inMessageType,
    inApplicationInfo,
    inActionInfo
) {
    uuid = inUUID;
    if(websocket) {
        websocket.close();
        websocket = null;
    };

    var appInfo = JSON.parse(inApplicationInfo);
    var isMac = appInfo.application.platform === 'mac';

    var getApplicationName = function(jsn) {
        if(jsn && jsn['payload'] && jsn.payload['application']) {
            return isMac ? jsn.payload.application.split('.').pop() : jsn.payload.application.split('.')[0];
        }
        return '';
    };

    websocket = new WebSocket('ws://127.0.0.1:' + inPort);

    websocket.onopen = function() {
        var json = {
            event: inMessageType,
            uuid: inUUID
        };

        websocket.send(JSON.stringify(json));
        loadGlobalSetting('qlcIP');
    };

    websocket.onclose = function(evt) {
        console.log('[STREAMDECK]***** WEBOCKET CLOSED **** reason:', evt);
    };

    websocket.onerror = function(evt) {
        console.warn('WEBOCKET ERROR', evt, evt.data);
    };

    websocket.onmessage = function(evt) {
        try {
            var jsonObj = JSON.parse(evt.data);
            var event = jsonObj['event'];
            if(event === 'didReceiveGlobalSettings') {
                if (getPropFromString(jsonObj, 'payload.settings.qlcIP')) {
                    var ipPort = jsonObj.payload.settings.qlcIP;
                    connectToWebSocket(ipPort);
                }
            }

            if (event === 'didReceiveSettings') {
                let contextObjIndex = contextArray.findIndex(a => a.id === jsonObj['context']); 
                if (getPropFromString(jsonObj, 'payload.settings.vcWidget')) {
                    var widgetId = jsonObj.payload.settings.vcWidget;
                    contextArray[contextObjIndex].vcWidget = widgetId;
                }
                if (getPropFromString(jsonObj, 'payload.settings.vcWidgetRes')) {
                    var widgetId = jsonObj.payload.settings.vcWidgetRes;
                    contextArray[contextObjIndex].vcWidgetRes = widgetId;
                }
                if (getPropFromString(jsonObj, 'payload.settings.vcWidgetVal')) {
                    var widgetValue = jsonObj.payload.settings.vcWidgetVal;
                    contextArray[contextObjIndex].vcWidgetValue = widgetValue;
                }
    
                if (getPropFromString(jsonObj, 'payload.settings.vcWidgetResVal')) {
                    var widgetValue = jsonObj.payload.settings.vcWidgetResVal;
                    contextArray[contextObjIndex].vcWidgetResValue = widgetValue;
                }
                if (getPropFromString(jsonObj, 'payload.settings.buttonType')) {
                    var buttonType = jsonObj.payload.settings.buttonType;
                    contextArray[contextObjIndex].buttonType = buttonType;
                    if (buttonType != "1"){
                        // if(vcWidget)setIntervalRequest(vcWidget);
                    }
                    // alert("Something");
                }
                if (getPropFromString(jsonObj, 'payload.settings.iconDes')) {
                    var iconDescription = jsonObj.payload.settings.iconDes;
                        contextArray[contextObjIndex].iconDes = iconDescription;
                }
                if (getPropFromString(jsonObj, 'payload.settings.iconCol')) {
                    var iconColor = jsonObj.payload.settings.iconCol;
                        contextArray[contextObjIndex].iconCol = iconColor;
                }
                if (getPropFromString(jsonObj, 'payload.settings.iconImg')) {
                    var iconImage = jsonObj.payload.settings.iconImg;
                        contextArray[contextObjIndex].iconImg = iconImage;
                    if(contextArray[contextObjIndex].iconDes != "" && contextArray[contextObjIndex].iconCol != ""){
                        loadAndSetImage(contextArray[contextObjIndex], 0);
                    }
                }
            }

            if(~['applicationDidLaunch', 'applicationDidTerminate'].indexOf(event)) {
                const app = capitalize(getApplicationName(jsonObj));
                const img = `images/${jsonObj.payload.application}.png`;
                const arrImages = event === 'applicationDidTerminate' ? [img, 'images/terminated.png'] : img;
                contextArray.forEach(a => {
                    // loadAndSetImage(a.id, arrImages);
                });

                if(event === 'applicationDidLaunch') {
                    if(!runningApps.includes(app)) {runningApps.push(app);};
                } else if(event === 'applicationDidTerminate') {
                    runningApps = runningApps.filter(item => item !== app);
                }

                if(piContext && piContext !== 0) { // there's a property inspector
                    sendToPropertyInspector(piContext, {runningApps});
                }

            } else {

                /** dispatch message */
                let bEvt;
                if(jsonObj['event'] && jsonObj['event'] === 'willAppear') {
                    bEvt = jsonObj['event'];
                } else {
                    bEvt = !jsonObj.hasOwnProperty('action') ? jsonObj.event : jsonObj.event + jsonObj['context'];
                }

                if(action.hasOwnProperty(bEvt)) {
                    action[bEvt](jsonObj);
                }
            }
        } catch(error) {
            console.trace('Could not parse incoming message', error, evt.data);
        }
    };
}

function loadGlobalSetting(param) {
    if (websocket && (websocket.readyState === 1)) {
        const json = {
            "event": "getGlobalSettings",
            "context": uuid
        };
        websocket.send(JSON.stringify(json));
    }
}

function loadSetting(pUuid) {
    if (websocket && (websocket.readyState === 1)) {
        const json = {
            "event": "getSettings",
            "context": pUuid
        };
        websocket.send(JSON.stringify(json));
    }
}

/**
 * We use a contextArray to push our context. You can use a cache to keep some
 * data private to the plugin or to update a key regularily without waiting
 * for an event.
 * This will also work with multi-actions stored in different contexts
*/

var action = {

    willAppear: function(jsn) {
        // jsn.context.interval = setInterval(function(){
        //     getVal(pl.widgetId,jsn.context).then(
        //             function(value) {alert(value);},
        //             function(error) { alert(error); }
        //         );
        // }, 100);

        if(contextArray.findIndex(obj => obj.id === jsn.context)===-1) {
            contextArray.push({id : jsn.context,iconDes:"",iconCol:"#000000",iconImg:""});
            loadSetting(jsn.context);
            if(qlcConnected())alert("Connected");
        }

        action['keyDown' + jsn.context] = function(jsn) {
            console.log('**** action.KEYDOWN', jsn.context);
        };

        action['keyUp' + jsn.context] = function(jsn) {
            console.log('**** action.KEYUP', jsn.context);
        };

        action['sendToPlugin' + jsn.context] = function(jsn) {
            console.log('**** action.SENDTOPLUGIN', jsn.context, jsn);
            if(jsn.hasOwnProperty('payload')) {
                const pl = jsn.payload;

                if(pl.hasOwnProperty('property_inspector')) {
                    const pi = pl.property_inspector;
                    console.log('%c%s', 'font-style: bold; color: white; background: blue; font-size: 15px;', `PI-event for ${jsn.context}:${pi}`);
                    switch(pl.property_inspector) {
                        case 'propertyInspectorWillDisappear':
                            // loadAndSetImage(jsn.context);
                            // setTimeout(() => {
                            //     loadAndSetImage(jsn.context, `images/default.png`);
                            // }, 500);
                            setContext(0); // set a flag, that our PI was removed
                            break;
                        case 'propertyInspectorConnected':
                            setContext(jsn.context);
                            sendToPropertyInspector(jsn.context, {runningApps});
                            break;
                    };
                }
            }
        };

        action['willDisappear' + jsn.context] = function(jsn) {
            console.log('**** action.WILLDISAPPEAR', jsn.context, contextArray);
            contextArray = contextArray.filter(item => item.id !== jsn.context);
            console.log(contextArray);
        };

    }
};

/** STREAM DECK COMMUNICATION */

function sendToPropertyInspector(context, jsonData, xx) {
    var json = {
        'event': 'sendToPropertyInspector',
        'context': context,
        'payload': jsonData
    };
    console.log('-----');
    console.log('sending to Property Inspector', xx, context, piContext, json, JSON.stringify(json));
    websocket.send(JSON.stringify(json));
};

function setTitle(context, newTitle) {
    // var apps = runningApps.join('\n');

    var json = {
        'event': 'setTitle',
        'context': context,
        'payload': {
            // 'title': `${newTitle}\n${apps}`,
            'title': `${newTitle}`,
            'target': DestinationEnum.HARDWARE_AND_SOFTWARE
        }
    };

    websocket.send(JSON.stringify(json));
};

function setImage(context, imgData) {

    var json = {
        'event': 'setImage',
        'context': context,
        'payload': {
            'image': imgData,
            'target': DestinationEnum.HARDWARE_AND_SOFTWARE
        }
    };

    websocket.send(JSON.stringify(json));
};

function setImageState(value){
    contextArray.forEach(a => {
        getVal(pl.widgetId,a);
    });
}

function loadAndSetImage(obj,value) {
    loadImage( function(data) {
        var json = {
            'event': 'setImage',
            'context': obj.id,
            'payload': {
                'image': data,
                'target': DestinationEnum.HARDWARE_AND_SOFTWARE
            }
        };
        websocket.send(JSON.stringify(json));
    },obj,value);
};

/** UTILS */

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};


function setContext(ctx) {
    console.log('%c%s', 'color: white; background: blue; font-size: 12px;', 'piContext', ctx, piContext);
    piContext = ctx;
    console.log('new context: ', piContext);
}

function loadImage(callback,obj,value) {
    /** Convert to array, so we may load multiple images at once */
    const canvas = document.createElement('canvas');
    canvas.width = 144;
    canvas.height = 144;

    function roundRect(x, y, w, h, radius)
    {
        var r = x + w;
        var b = y + h;
        ctx.beginPath();
        ctx.strokeStyle="#00ff00";
        ctx.lineWidth=4;
        ctx.moveTo(x+radius, y);
        ctx.lineTo(r-radius, y);
        ctx.quadraticCurveTo(r, y, r, y+radius);
        ctx.lineTo(r, y+h-radius);
        ctx.quadraticCurveTo(r, b, r-radius, b);
        ctx.lineTo(x+radius, b);
        ctx.quadraticCurveTo(x, b, x, b-radius);
        ctx.lineTo(x, y+radius);
        ctx.quadraticCurveTo(x, y, x+radius, y);
        ctx.stroke();
    }

    function lightOrDark(color) {

        // Check the format of the color, HEX or RGB?
        if (color.match(/^rgb/)) {

            // If HEX --> store the red, green, blue values in separate variables
            color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);

            r = color[1];
            g = color[2];
            b = color[3];
        }
        else {

            // If RGB --> Convert it to HEX: http://gist.github.com/983661
            color = +("0x" + color.slice(1).replace(
                color.length < 5 && /./g, '$&$&'
            )
            );

            r = color >> 16;
            g = color >> 8 & 255;
            b = color & 255;
        }

        // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
        hsp = Math.sqrt(
            0.299 * (r * r) +
            0.587 * (g * g) +
            0.114 * (b * b)
        );

        // Using the HSP value, determine whether the color is light or dark
        if (hsp > 127.5) {

            return "#000000";
        }
        else {

            return "#ffffff";
        }
    }

    var ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    
    
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const accentColor = obj.iconCol;
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height / 4);
    ctx.fillStyle = lightOrDark(accentColor);
    ctx.textAlign = "center";
    let text = obj.iconDes;
    if (text.length <= 10) {
        ctx.font = "900 20px Arial";
    } else {
        ctx.font = "900 15px Arial";
    }
    ctx.lineWidth = 1;
    ctx.fillText(text, canvas.width / 2, 25);
    ctx.fillStyle = '#515151';
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
    ctx.arc(canvas.width / 2, canvas.height / 2 + canvas.height / 8, 50, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    var img = new Image();
    img.src = obj.iconImg;
    img.onload = function () {
        ctx.drawImage(img, canvas.width / 2 - 35, canvas.height / 2 + canvas.height / 8 - 35, 70, 70);
        ctx.save();
        callback(canvas.toDataURL('image/png'));
    }
    if(value != 0)
        roundRect(2,2,canvas.width-4,canvas.height-4,25);
};

function readFile(fileName, props = {}) {
    return new Promise(function(resolve, reject) {
        const request = Object.assign(new XMLHttpRequest(), props || {});
        request.open('GET', fileName, true);
        request.onload = (e, f) => {
            const isBlob = request.responseType == "blob" || (request.response instanceof Blob || ['[object File]', '[object Blob]'].indexOf(Object.prototype.toString.call(request.response)) !== -1);

            console.log("utils.readFile", request, 'isBlob', isBlob, this);

            if(isBlob) {
                const reader = new FileReader();
                reader.onloadend = (evt) => {
                    resolve(evt.target.result);
                };
                console.log("readAsDataURL");
                reader.readAsDataURL(request.response);
            } else if(request.responseType == 'arraybuffer') {
                console.log("arraybuffer");
                resolve(request.response);
            } else {
                console.log("responseText");
                resolve(request.responseText);
            }
        };
        request.send();
    });
}
