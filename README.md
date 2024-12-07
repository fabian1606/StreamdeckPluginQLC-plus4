# QLC+ Plugin for the elgato stream deck

This plugin allows you to control the QLC+ virtual console from the Elgato Stream Deck. you can assign a streamdeck button to a button or fader in the console.
It communicats with the QLC+ webinterface to send the button presses to the virtual console and read the button states to show feedback on the stream deck.

# Installation (only tested on windows)
To use this plugin you need to install the [QLC+](https://www.qlcplus.org/) software and the [Stream Deck Software](https://www.elgato.com/en/gaming/downloads) from Elgato. then you need to copy  the folder `com.qlc.QLC-connect.sdPlugin` to the stream deck plugins folder. The default location is `path%appdata%\Elgato\StreamDeck\Plugins\`
then you need to restart the stream deck software and you should be able to add the QLC+ plugin to your stream deck.  

![image](readme/icons.png)

# Usage

When you have the plugin installed you should see the qlc+ icon in the actions list. There is a function `virtual console input` which you can drag into every button on the stream deck.
When you click on the button you should the configuration window for the button.

## Connecting QLC+
To connect qlc+ you have to enable the webinterface in qlc+. to do that you have to add the [ commandline parameter -w to your qlc+ installation ](https://www.qlcplus.org/docs/html_en_EN/commandlineparameters.html). Then you can enter your ip adress and click the connect button. If the connection is successful the button should turn green.

## Selecting a button
Now you can select a qlc+ virtual console element or click on the detect button to automatically detect an element. when you have selected an element the icon and color of the button gets updated to match the elements title. 

![image](readme/config.png)

when you dont like the icon, color or title you can change it in the configuration window.

## Button actions
You can assign a button action to the button. The button actions are:
- `Simple button` - your button is a simple pushbutton that just sends a value when pressed
- `Button with evebt on click and release` - your button sends a value when pressed, and another value when released (both values can be selected and enable some more functions for qlc+)
- `Flashbutton` - the button sends the same value on click and release (this anables the flash function for chases in qlc+)

- Patch 1 modification by SiliconKnight42 in Dec24 - removed restriction on Values for button to be numeric.  By allowing any value, these Streamdeck buttons can now control QLC Playlists by using the "NEXT" and "PREV" commands; however, care must be taken by users to ensure that only numeric values are sent to other VC Widgets (e.g. buttons, faders, etc.).

