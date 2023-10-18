
"use strict";

let pptx = new PptxGenJS();

// Simple Slide
function onButtonClick() {
  let pptx = new PptxGenJS();
  let slide = pptx.addSlide();
  let opts = {
	x: 0.0,
	y: 0.25,
	w: '100%',
	h: 1.5,
	align: 'center',
	fontSize: 24,
	color: '0088CC',
	fill: 'F1F1F1'
  };
  slide.addText(
	'BONJOUR - CIAO - GUTEN TAG - HELLO - HOLA - NAMASTE - OLÀ - ZDRAS-TVUY-TE - こんにちは - 你好',
	opts
  );
  pptx.writeFile();
}


//const button = document.querySelector('button');
//button.addEventListener('click', onButtonClick);