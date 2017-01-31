// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>MathUtil</h1>"));

// make a random number
let randNum = document.createElement('div');
randNum.innerHTML = `MathUtil.randRange(0, 10) | ${MathUtil.randRange(0, 10)}`;
mainEl.appendChild(randNum);
