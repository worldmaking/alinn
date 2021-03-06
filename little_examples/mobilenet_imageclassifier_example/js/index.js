const img = document.getElementById('img'); 
        //new Image();
img.crossOrigin = "";
img.src = "https://i.imgur.com/8EPFBJt.jpg";

img.onload = function() {
  console.log("image loaded")
  // Load the model.
  mobilenet.load().then(model => {
    console.log("network loaded")
    // Classify the image.
    model.classify(img).then(predictions => {
      document.body.insertAdjacentHTML( 'beforeend', `<pre>${JSON.stringify(predictions, null, "  ")}</pre>` );
    });
  });
}