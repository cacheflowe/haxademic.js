// TODO: add more from: https://www.bennadel.com/blog/3941-styling-console-log-output-formatting-with-css.htm#blog-post

console.todo = function (msg) {
  console.log(
    "%c %s %s %s ",
    "color: yellow; background-color: black;",
    "--",
    msg,
    "--"
  );
};

console.important = function (msg) {
  console.log(
    "%c%s %s %s",
    "color: #00ff00; font-weight: bold; text-decoration: underline;",
    "--",
    msg,
    "--"
  );
};

console.color = function (msg, color) {
  console.log("%c" + msg, "color: " + color);
};

console.fancy = function (msg) {
  console.log(
    "%c" + msg,
    "background-color: green; color: white ; font-weight: bold ; " +
      "font-size: 20px ; font-style: italic ; text-decoration: underline ; " +
      "font-family: 'american typewriter' ; text-shadow: 1px 1px 3px black ;"
  );
};

console.box = function (msg) {
  console.log(
    "%c" + msg,
    "display: inline-block ; border: 3px solid red ; border-radius: 7px ; " +
      "padding: 10px ; margin: 20px ;"
  );
};
