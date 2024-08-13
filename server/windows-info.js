import { activeWindow, openWindows } from "get-windows";

console.log(await activeWindow({}));
console.log(await openWindows({}));
