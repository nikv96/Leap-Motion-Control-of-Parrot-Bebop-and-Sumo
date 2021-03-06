// Imports
var cv = require('opencv');

// Create Exports component
var ImageProcessing = exports = module.exports = function(pngStream, callback){
    if(typeof callback !== 'function') 
        throw new Error('Callback missing');

    var lastPng;
    var lastPngTime;
    var pngDeltaTime;
    var targetInterval;
    var processingImage = false;

    pngStream.on('error', console.log);
    pngStream.on('data', function(pngBuffer) {
        var currentTime = Date.now();
        if( lastPngTime ){
            pngDeltaTime = currentTime - lastPngTime;
        }
        lastPngTime = currentTime;
        lastPng = pngBuffer;
        processingImage = true;
    });

    var start = function(interval){
        if(targetInterval) 
            stop();
        interval = interval || 150;
        targetInterval = setInterval(detectTarget, interval);
    }

    var stop = function(){
        if( targetInterval ) 
            clearInterval(targetInterval);
        targetInterval = null;
    }

    var detectTarget = function(){ 
        if (processingImage == true) {
          cv.readImage(lastPng, function(err, image) {
              if (err) 
                  throw err;
              if (image.width() < 1 || image.height() < 1) 
                  throw new Error('Image doesn\'t exist');

              image_gray = image.copy();
              image_gray.convertGrayscale();
              image_gray.detectObject(cv.FACE_CASCADE, 
                {}, 
                function(err, faces){
                  if(faces.length != 0){
                    var max_width = faces[0].width;
                    var face;
                    for (var i = 0; i < faces.length; i++){
                      if(faces[i].width >= max_width)
                        face = faces[i];
                    }

                    image.rectangle([face.x, face.y], [face.width, face.height], [0,255,0], 2);

                    callback({
                      image : image,
                      delatTime : pngDeltaTime,
                      timestamp : lastPngTime,
                      rects : face
                    });
                  }
                }, 1.3, 3);
          });
        }
    };

    return {
        'stop':stop,
        'start':start
    }
};
