# toBinary
A function that takes the text editor markup and turns it into binary
The function returns a tuple containing the length of the match, and an array of bytes
If not specified, the built in default will kick in, which looks for its tag, wrapped in []

# toMarkup
Used to generate the text editor markup of the message
string: The specified string is written
function: Returns a string to write. Arguments:
- argument
If not specified, the built in default will kick in, which outputs [tag=argument]

# tag
Used for the fallback when toBinary and toMarkup isn't present
**If both toBinary and toMarkup are specified, the tag property won't be used**

# toText
Used to generate the plaintext version of the message
string: The specified string is written
function: Returns a string to write. Arguments:
- state
  - color           Specifies if color has been changed. It adds a </span> at the end when true.
  - getColor(id)    Obtain color hex value from id
- argument

# toHtml
Same as toText, but with added HTML markup for text color and such
toText is used as fallback when toHtml isn't specified

# info
A function used to obtain information about a message before rendering it
Arguments:
- state
  - rows            How many rows the message contains
  - hideButton      Whether the message box button should be hidden
  - icon:           Which icon the message box will use
  - choiceMode      Which choice mode the message box uses (0 for 2 choices, 1 for 3 choices)
  - nextMessage     ID of the next message box
  - end()           Ends the message
  - break()         Starts a new message box
- argument

# render
string: The specified string is written
true: the control code is converted to a character and written
function: Allows altering of the render state and conditional writes. Arguments:
- state
  - x             Current X position of the renderer
  - y             Current Y position of the renderer
  - row           Current row of the renderer (0-indexed)
  - end()         ends the render
  - color(id)     set text color to the specified id
  - write(string) outputs the specified string (NOTE: async. must await or return)
  - icon(id)      outputs the specified icon (NOTE: async. must await or return)
    - NOTE: Game only support one icon texture per message box; it's determined in the info parser;
- argument
