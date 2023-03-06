// this is our global websocket, used to communicate from/to Stream Deck software
// and some info about our plugin, as sent by Stream Deck software

let iconDescription = "";
let iconColor = "";
let iconImage = "";
let vcWidget = "";
let vcWidgetValue = 255;
let vcWidgetRes = "";
let vcWidgetResValue = 255;
let buttonType = "0";

document.querySelector('#valueSend').addEventListener('change', function() {
    vcWidgetValue = document.querySelector("#valueSend input").value;
    saveSetting();
});
document.querySelector('#valueSend2').addEventListener('change', function(e) {
    vcWidgetResValue =  document.querySelector("#valueSend2 input").value;
    saveSetting();
});

document.querySelector('#radioBtn0').addEventListener('change', function(e) {
    vcWidgetRes = "";
    document.querySelector("#release-ev").style.display = "none";
    buttonType = "0";
    saveSetting();
});


document.querySelector('#radioBtn1').addEventListener('change', function(e) {
    document.querySelector("#release-ev").style.display = "block";
    buttonType = "1";
    saveSetting();
});
document.querySelector('#radioBtn2').addEventListener('change', function(e) {
    vcWidgetRes = "";
    document.querySelector("#release-ev").style.display = "none";
    buttonType = "2";
    saveSetting();
});


var websocket = null,
    uuid = null,
    actionInfo = {},
    inInfo = {},
    runningApps = [],
    settings = {},
    isQT = navigator.appVersion.includes('QtWebEngine'),
    onchangeevt = 'onchange'; // 'oninput'; // change this, if you want interactive elements act on any change, or while they're modified

function connectElgatoStreamDeckSocket(inPort, inUUID, inRegisterEvent, inInfo, inActionInfo) {
    uuid = inUUID;
    // please note: the incoming arguments are of type STRING, so
    // in case of the inActionInfo, we must parse it into JSON first
    actionInfo = JSON.parse(inActionInfo); // cache the info
    inInfo = JSON.parse(inInfo);
    websocket = new WebSocket('ws://127.0.0.1:' + inPort);

    /** let's see, if we have some settings */
    settings = getPropFromString(actionInfo, 'payload.settings', false);
    // console.log(settings, actionInfo);
    initPropertyInspector(5);

    // if connection was established, the websocket sends
    // an 'onopen' event, where we need to register our PI
    websocket.onopen = function () {
        var json = {
            event: inRegisterEvent,
            uuid: inUUID
        };
        // register property inspector to Stream Deck
        websocket.send(JSON.stringify(json));
        loadGlobalSetting('qlcIP');
        //alert("loading global Setting");
        // demoCanvas("qlc",iconColor, iconDescription, iconImage);
    };

    websocket.onmessage = function (evt) {
        // Received message from Stream Deck
        var jsonObj = JSON.parse(evt.data);
        var event = jsonObj['event'];

        if (event === 'didReceiveGlobalSettings') {
            if (getPropFromString(jsonObj, 'payload.settings.qlcIP')) {
                var ipPort = jsonObj.payload.settings.qlcIP;
                document.getElementById("IP-Address").value = ipPort.split(':')[0];
                document.getElementById("Port").value = ipPort.split(':')[1];
                connectToWebSocket(ipPort);
            }

        }
        if (event === 'didReceiveSettings') {
            if (getPropFromString(jsonObj, 'payload.settings.vcWidget')) {
                var widgetId = jsonObj.payload.settings.vcWidget;
                vcWidget = widgetId;
                let select = document.getElementById("select-vc-widget").options;
                for (let i = 0; i < select.length; i++) {
                    const element = select[i];
                    if (element.value == widgetId)
                    document.getElementById("select-vc-widget").selectedIndex = i;
                }
                
            }
            if (getPropFromString(jsonObj, 'payload.settings.vcWidgetRes')) {
                var widgetId = jsonObj.payload.settings.vcWidgetRes;
                vcWidgetRes = widgetId;
                let select = document.getElementById("select-vc-widget2").options;
                for (let i = 0; i < select.length; i++) {
                    const element = select[i];
                    if (element.value == widgetId)
                    document.getElementById("select-vc-widget2").selectedIndex = i;
                }
            }
            if (getPropFromString(jsonObj, 'payload.settings.vcWidgetVal')) {
                var widgetValue = jsonObj.payload.settings.vcWidgetVal;
                vcWidgetValue = widgetValue;
                document.querySelector("#valueSend input").value = widgetValue;
            }

            if (getPropFromString(jsonObj, 'payload.settings.vcWidgetResVal')) {
                var widgetValue = jsonObj.payload.settings.vcWidgetResVal;
                vcWidgetResValue = widgetValue;
                document.querySelector("#valueSend2 input").value = widgetValue;
            }
            if (getPropFromString(jsonObj, 'payload.settings.buttonType')) {
                var buttonType = jsonObj.payload.settings.buttonType;
                document.querySelector(`#radioBtn${buttonType}`).checked = true;
                document.querySelector(`#radioBtn${buttonType}`).dispatchEvent(new Event('change'));
                
            }

            if (getPropFromString(jsonObj, 'payload.settings.iconDes')) {
                var iconDescription = jsonObj.payload.settings.iconDes;
                    demoCanvas("",iconColor,iconImage,iconDescription);
            }
            if (getPropFromString(jsonObj, 'payload.settings.iconCol')) {
                var iconColor = jsonObj.payload.settings.iconCol;
                    demoCanvas("",iconColor,iconImage,iconDescription);
            }
            if (getPropFromString(jsonObj, 'payload.settings.iconImg')) {
                var iconImage = jsonObj.payload.settings.iconImg;
                    demoCanvas("",iconColor, iconImage, iconDescription);
            }
            // else {
            //     document.querySelector('#radioBtn0').dispatchEvent(new Event('change'));
            // }
            sendToPlugin();
        
        }
    };
}

window.addEventListener('message', function (ev) {
    console.log('External window received message:  ', ev.data, typeof ev.data);
    if (ev.data === 'initPropertyInspector') {
        initPropertyInspector(5);
    }
}, false);

function saveVcWidget() {
    let select = document.getElementById("select-vc-widget");
    vcWidget = select.options[select.selectedIndex].value;
    saveSetting();

}
function saveVcWidget2() {
    let select = document.getElementById("select-vc-widget2");
    vcWidgetRes = select.options[select.selectedIndex].value;
    saveSetting();
}

function initPropertyInspector(initDelay) {
    prepareDOMElements(document);
    demoCanvas();
}

function revealSdpiWrapper() {
    const el = document.querySelector('.sdpi-wrapper');
    el && el.classList.remove('hidden');
}

// our method to pass values to the plugin
function sendValueToPlugin(value, param) {
    if (websocket && (websocket.readyState === 1)) {
        const json = {
            'action': actionInfo['action'],
            'event': 'sendToPlugin',
            'context': uuid,
            'payload': {
                [param]: value
            }
        };
        websocket.send(JSON.stringify(json));
    }
}
function saveGlobalSetting(value, param) {
    if (websocket && (websocket.readyState === 1)) {
        const json = {
            "event": "setGlobalSettings",
            "context": uuid,
            'payload': {
                [param]: value
            }
        };
        websocket.send(JSON.stringify(json));
    }
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

async function saveSetting(value, param) {
    let jsonData = {
        ["iconDes"]: iconDescription,
                ["iconCol"]: iconColor,
                ["iconImg"]: iconImage,
                ["vcWidget"]: vcWidget,
                ["vcWidgetRes"]: vcWidgetRes,
                ["vcWidgetVal"]: vcWidgetValue,
                ["vcWidgetResVal"]: vcWidgetResValue,
                ["buttonType"]: buttonType,
    };
    if (websocket && (websocket.readyState === 1)) {
        const json = {
            "event": "setSettings",
            "context": uuid,
            'payload': jsonData
        };
        websocket.send(JSON.stringify(json));
        sendToPlugin();

    }
}


function loadSetting() {
    if (websocket && (websocket.readyState === 1)) {
        const json = {
            "event": "getSettings",
            "context": uuid
        };
        websocket.send(JSON.stringify(json));
    }
}

if (!isQT) {
    document.addEventListener('DOMContentLoaded', function () {
        initPropertyInspector(100);
    });
}

/** the beforeunload event is fired, right before the PI will remove all nodes */
window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    // since 4.1 this is no longer needed, as the plugin will receive a notification
    // right before the Property Inspector goes away
    sendValueToPlugin('propertyInspectorWillDisappear', 'property_inspector');
    // Don't set a returnValue to the event, otherwise Chromium with throw an error.  // e.returnValue = '';
});

/** the pagehide event is fired, when the view disappears */
/*
window.addEventListener('pagehide', function (event) {
    console.log('%c%s','background: green; font-size: 22px; font-weight: bold;','window --->> pagehide.');
    sendValueToPlugin('propertyInspectorPagehide', 'property_inspector');

});
*/

/** the unload event is fired, when the PI will finally disappear */
/*
window.addEventListener('unload', function (event) {
    console.log('%c%s','background: orange; font-size: 22px; font-weight: bold;','window --->> onunload.');
    sendValueToPlugin('propertyInspectorDisconnected', 'property_inspector');
});
*/

/** if you prefer, you can apply these listeners to PI's body, like so:
 *
 * <body onpagehide="sendValueToPlugin('propertyInspectorPagehide', 'property_inspector');">
 *
 * <body onunload="sendValueToPlugin('propertyInspectorDisconnected', 'property_inspector');">
*/

/** CREATE INTERACTIVE HTML-DOM
 * where elements can be clicked or act on their 'change' event.
 * Messages are then processed using the 'handleSdpiItemClick' method below.
 */

function prepareDOMElements(baseElement) {
    baseElement = baseElement || document;
    Array.from(baseElement.querySelectorAll('.sdpi-item-value')).forEach(
        (el, i) => {
            const elementsToClick = [
                'BUTTON',
                'OL',
                'UL',
                'TABLE',
                'METER',
                'PROGRESS',
                'CANVAS'
            ].includes(el.tagName);
            const evt = elementsToClick ? 'onclick' : onchangeevt || 'onchange';

            /** Look for <input><span> combinations, where we consider the span as label for the input
             * we don't use `labels` for that, because a range could have 2 labels.
             */
            const inputGroup = el.querySelectorAll('input + span');
            if (inputGroup.length === 2) {
                const offs = inputGroup[0].tagName === 'INPUT' ? 1 : 0;
                inputGroup[offs].textContent = inputGroup[1 - offs].value;
                inputGroup[1 - offs]['oninput'] = function () {
                    inputGroup[offs].textContent = inputGroup[1 - offs].value;
                };
            }
            /** We look for elements which have an 'clickable' attribute
             * we use these e.g. on an 'inputGroup' (<span><input type="range"><span>) to adjust the value of
             * the corresponding range-control
             */
            Array.from(el.querySelectorAll('.clickable')).forEach(
                (subel, subi) => {
                    subel['onclick'] = function (e) {
                        handleSdpiItemChange(e.target, subi);
                    };
                }
            );
            /** Just in case the found HTML element already has an input or change - event attached, 
             * we clone it, and call it in the callback, right before the freshly attached event
            */
            const cloneEvt = el[evt];
            el[evt] = function (e) {
                if (cloneEvt) cloneEvt();
                handleSdpiItemChange(e.target, i);
            };
        }
    );

    /**
     * You could add a 'label' to a textares, e.g. to show the number of charactes already typed
     * or contained in the textarea. This helper updates this label for you.
     */
    baseElement.querySelectorAll('textarea').forEach((e) => {
        const maxl = e.getAttribute('maxlength');
        e.targets = baseElement.querySelectorAll(`[for='${e.id}']`);
        if (e.targets.length) {
            let fn = () => {
                for (let x of e.targets) {
                    x.textContent = maxl ? `${e.value.length}/${maxl}` : `${e.value.length}`;
                }
            };
            fn();
            e.onkeyup = fn;
        }
    });

    baseElement.querySelectorAll('[data-open-url]').forEach(e => {
        const value = e.getAttribute('data-open-url');
        if (value) {
            e.onclick = () => {
                let path;
                if (value.indexOf('http') !== 0) {
                    path = document.location.href.split('/');
                    path.pop();
                    path.push(value.split('/').pop());
                    path = path.join('/');
                } else {
                    path = value;
                }
                $SD.api.openUrl($SD.uuid, path);
            };
        } else {
            console.log(`${value} is not a supported url`);
        }
    });
}

function handleSdpiItemChange(e, idx) {

    /** Following items are containers, so we won't handle clicks on them */

    if (['OL', 'UL', 'TABLE'].includes(e.tagName)) {
        return;
    }

    /** SPANS are used inside a control as 'labels'
     * If a SPAN element calls this function, it has a class of 'clickable' set and is thereby handled as
     * clickable label.
     */

    if (e.tagName === 'SPAN') {
        const inp = e.parentNode.querySelector('input');
        var tmpValue;

        // if there's no attribute set for the span, try to see, if there's a value in the textContent
        // and use it as value
        if (!e.hasAttribute('value')) {
            tmpValue = Number(e.textContent);
            if (typeof tmpValue === 'number' && tmpValue !== null) {
                e.setAttribute('value', 0 + tmpValue); // this is ugly, but setting a value of 0 on a span doesn't do anything
                e.value = tmpValue;
            }
        } else {
            tmpValue = Number(e.getAttribute('value'));
        }

        if (inp && tmpValue !== undefined) {
            inp.value = tmpValue;
        } else return;
    }

    const selectedElements = [];
    const isList = ['LI', 'OL', 'UL', 'DL', 'TD'].includes(e.tagName);
    const sdpiItem = e.closest('.sdpi-item');
    const sdpiItemGroup = e.closest('.sdpi-item-group');
    let sdpiItemChildren = isList
        ? sdpiItem.querySelectorAll(e.tagName === 'LI' ? 'li' : 'td')
        : sdpiItem.querySelectorAll('.sdpi-item-child > input');

    if (isList) {
        const siv = e.closest('.sdpi-item-value');
        if (!siv.classList.contains('multi-select')) {
            for (let x of sdpiItemChildren) x.classList.remove('selected');
        }
        if (!siv.classList.contains('no-select')) {
            e.classList.toggle('selected');
        }
    }

    if (sdpiItemChildren.length && ['radio', 'checkbox'].includes(sdpiItemChildren[0].type)) {
        e.setAttribute('_value', e.checked); //'_value' has priority over .value
    }
    if (sdpiItemGroup && !sdpiItemChildren.length) {
        for (let x of ['input', 'meter', 'progress']) {
            sdpiItemChildren = sdpiItemGroup.querySelectorAll(x);
            if (sdpiItemChildren.length) break;
        }
    }

    if (e.selectedIndex !== undefined) {
        if (e.tagName === 'SELECT') {
            sdpiItemChildren.forEach((ec, i) => {
                selectedElements.push({ [ec.id]: ec.value });
            });
        }
        idx = e.selectedIndex;
    } else {
        sdpiItemChildren.forEach((ec, i) => {
            if (ec.classList.contains('selected')) {
                selectedElements.push(ec.textContent);
            }
            if (ec === e) {
                idx = i;
                selectedElements.push(ec.value);
            }
        });
    }

    const returnValue = {
        key: e.id && e.id.charAt(0) !== '_' ? e.id : sdpiItem.id,
        value: isList
            ? e.textContent
            : e.hasAttribute('_value')
                ? e.getAttribute('_value')
                : e.value
                    ? e.type === 'file'
                        ? decodeURIComponent(e.value.replace(/^C:\\fakepath\\/, ''))
                        : e.value
                    : e.getAttribute('value'),
        group: sdpiItemGroup ? sdpiItemGroup.id : false,
        index: idx,
        selection: selectedElements,
        checked: e.checked
    };

    /** Just simulate the original file-selector:
     * If there's an element of class '.sdpi-file-info'
     * show the filename there
     */
    if (e.type === 'file') {
        const info = sdpiItem.querySelector('.sdpi-file-info');
        if (info) {
            const s = returnValue.value.split('/').pop();
            info.textContent = s.length > 28
                ? s.substr(0, 10)
                + '...'
                + s.substr(s.length - 10, s.length)
                : s;
        }
    }

    sendValueToPlugin(returnValue, 'sdpi_collection');
}

function updateKeyForDemoCanvas(cnv) {
    sendValueToPlugin({
        key: 'your_canvas',
        value: cnv.toDataURL()
    }, 'sdpi_collection');
}

/** Stream Deck software passes system-highlight color information
 * to Property Inspector. Here we 'inject' the CSS styles into the DOM
 * when we receive this information. */


/** UTILITIES */

/** Helper function to construct a list of running apps
 * from a template string.
 * -> information about running apps is received from the plugin
 */

function sdpiCreateList(el, obj, cb) {
    if (el) {
        el.style.display = obj.value.length ? 'block' : 'none';
        Array.from(document.querySelectorAll(`.${el.id}`)).forEach((subel, i) => {
            subel.style.display = obj.value.length ? 'flex' : 'none';
        });
        if (obj.value.length) {
            el.innerHTML = `<div class="sdpi-item" ${obj.type ? `class="${obj.type}"` : ''} id="${obj.id || window.btoa(new Date().getTime().toString()).substr(0, 8)}">
            <div class="sdpi-item-label">${obj.label || ''}</div>
            <ul class="sdpi-item-value ${obj.selectionType ? obj.selectionType : ''}">
                    ${obj.value.map(e => `<li>${e}</li>`).join('')}
                </ul>
            </div>`;
            setTimeout(function () {
                prepareDOMElements(el);
                if (cb) cb();
            }, 10);
            return;
        }
    }
    if (cb) cb();
};

/** get a JSON property from a (dot-separated) string
 * Works on nested JSON, e.g.:
 * jsn = {
 *      propA: 1,
 *      propB: 2,
 *      propC: {
 *          subA: 3,
 *          subB: {
 *             testA: 5,
 *             testB: 'Hello'
 *          }
 *      }
 *  }
 *  getPropFromString(jsn,'propC.subB.testB') will return 'Hello';
 */
const getPropFromString = (jsn, str, sep = '.') => {
    const arr = str.split(sep);
    return arr.reduce((obj, key) =>
        (obj && obj.hasOwnProperty(key)) ? obj[key] : undefined, jsn);
};

// import data from 'imageConfig.json';

var img = new Image();


document.querySelector("#select-vc-widget").addEventListener("change", function (e) {
    demoCanvas(e.target.options[e.target.selectedIndex].text);
});

document.querySelector("#icon-options").addEventListener("click", function (e) {
    demoCanvas("",iconColor,e.target.style.backgroundImage.slice(4, -1).replace(/"/g, ""),iconDescription);
});
document.querySelector("#colorselection input").addEventListener("change", function (e) {
    iconColor = e.target.value;
    demoCanvas("",iconColor,iconImage,iconDescription);
});
document.querySelector("#icon-name input").addEventListener("change", function (e) {
    iconDescription = e.target.value;
    demoCanvas("",iconColor,iconImage,iconDescription);
});

async function demoCanvas(text = "",color="",imgSrc="",imgTitle="") {
    const touchDevice = (('ontouchstart' in document.documentElement) && (navigator.platform != 'Win32'));
    const evtDown = touchDevice ? 'touchstart' : 'mousedown';
    const evtMove = touchDevice ? 'touchmove' : 'mousemove';
    const evtEnd = touchDevice ? 'touchend' : 'mouseup';
    const evtX = touchDevice ? 'pageX' : 'clientX';
    const evtY = touchDevice ? 'pageY' : 'clientY';

    const cnv = document.querySelector('canvas');
    if (!cnv) return;
    const ctx = cnv.getContext('2d');
    if (!ctx) return;

    // const data = require('imageConfig.json');
    // console.log(data);

    const colors = [
        { color: "#ff0000", names: ["red", "rot", "rouge", "rosso", "rojo", "rosso"] },
        { color: "#ff7f00", names: ["orange", "arancione", "naranja", "laranja"] },
        { color: "#ffff00", names: ["yellow", "gelb", "jaune", "giallo", "amarillo", "amarelo"] },
        { color: "#00ff00", names: ["green", "grün", "vert", "verde", "verde", "verde"] },
        { color: "#00ffff", names: ["cyan", "türkies", "ciano", "cian", "ciano"] },
        { color: "#0000ff", names: ["blue", "blau", "bleu", "blu", "azul", "azul"] },
        { color: "#4b0082", names: ["indigo", "lila", "indaco", "índigo", "índigo"] },
        { color: "#9400d3", names: ["violet", "violett", "rosa", "viola", "violeta", "violeta"] },
        { color: "#ffffff", names: ["white", "weiß", "blanc", "bianco", "blanco", "branco"] },
        { color: "#000000", names: ["black", "schwarz"] }
    ]
    const types = [
        { src: "images/types/movement.svg", names: ["move", "movement", "bewegung", "mouvement", "movimento", "movimiento", "movimento"] },
        { src: "images/types/gobo.svg", names: ["gobo"] },
        { src: "images/types/color.svg", names: ["color", "farbe", "couleur", "colore", "color", "cor"] },
        { src: "images/types/prism.svg", names: ["prism", "prisma", "prisme"] },
        { src: "images/types/effekt.svg", names: ["effect", "effekt", "effet", "effetto", "efecto", "efeito"] },
        { src: "images/types/music.svg", names: ["music", "musik", "audio", "musique", "musica", "música", "música"] },
        { src: "images/types/strobe.svg", names: ["strobe", "stroboskop", "strobo", "stroboscope", "strobo", "stroboscopio", "stroboscopio"] },
        { src: "images/types/show.svg", names: ["show"] },
        { src: "images/types/cueList.svg", names: ["cueList"] },
        { src: "images/types/bightness.svg", names: ["brightness", "helligkeit", "dimmer", "luminosité", "luminosità", "brillo", "brilho"] },
        { src: "images/types/video.svg", names: ["video"] },
        { src: "images/types/qlcIcon.png", names: ["qlc"] }
    ]
        document.querySelector("#icon-options").innerHTML = "";
        types.forEach(type => {
            let newIcon = document.createElement("div");
            newIcon.classList.add("icon-option-img");
            newIcon.classList.add("sdpi-item");
            newIcon.style.backgroundImage = `url(${type.src})`;
            newIcon.addEventListener("click", function () {
                console.log(type.src);
                document.querySelector("#icon-options").style.display = "none";
                document.querySelector("#active-icon").style.backgroundImage = `url(${type.src})`;
            });
            document.querySelector("#icon-options").appendChild(newIcon);
        });
        // alert(document.querySelector("#icon-option").innerHTML)
        document.querySelector("#active-icon").addEventListener("click", function () {
            document.querySelector("#icon-options").style.display = "flex";
        });

    function checkColor(text) {
        let color = "#000";
        colors.forEach(c => {
            c.names.forEach(name => {
                if (text.toLowerCase().includes(name)) color = c.color;
            });
        });
        return color;
    }
    function checkType(text) {
        let type = "";
        types.forEach(t => {
            t.names.forEach(name => {
                if (text.toLowerCase().includes(name)) type = t.src;
            });
        });
        if (checkColor(text) !== "#000" && type == "" ) type = "images/types/color.svg";
        else if (type == "" ) type = "images/types/qlcIcon.png";
        return type;
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

    function updateCanvas(text) {


        ctx.lineWidth = 4;
        ctx.fillStyle = "black";
        text = (imgTitle || text).toUpperCase();
        iconDescription = text;
        document.querySelector("#icon-name input").value = text;
        ctx.fillRect(0, 0, cnv.width, cnv.height);
        let accentColor = color || checkColor(text);
        document.querySelector("#colorselection input").value = accentColor;
        iconColor = accentColor;
        ctx.fillStyle = accentColor;
        ctx.fillRect(0, 0, cnv.width, cnv.height / 4);
        ctx.fillStyle = lightOrDark(accentColor);
        ctx.textAlign = "center";
        if (text.length <= 10) {
            ctx.font = "900 20px Arial";
        } else {
            ctx.font = "900 15px Arial";
        }
        ctx.lineWidth = 1;
        ctx.fillText(text, cnv.width / 2, 25);
        ctx.fillStyle = '#515151';
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000000';
        ctx.arc(cnv.width / 2, cnv.height / 2 + cnv.height / 8, 50, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        img.src = imgSrc || checkType(text);
        iconImage = img.src;
        document.querySelector("#active-icon").style.backgroundImage = `url(${img.src})`;
        img.onload = function () {
            ctx.drawImage(img, cnv.width / 2 - 35, cnv.height / 2 + cnv.height / 8 - 35, 70, 70);
            updateKeyForDemoCanvas(cnv, cnv);
            saveSetting();
        }
    }

    updateCanvas(text);
    const pos = { x: 0, y: 0 };

    var el = document.querySelector('.sdpi-wrapper');
    cnv.addEventListener(evtDown, function (e) {
        if (e.shiftKey) {
            updateCanvas();
            return;
        }
        pos.x = e[evtX] - cnv.offsetLeft + el.scrollLeft;
        pos.y = e[evtY] - cnv.offsetTop + el.scrollTop;
    });

    cnv.addEventListener(evtEnd, function (e) {
        e.target.value = cnv.toDataURL();
    });
}
