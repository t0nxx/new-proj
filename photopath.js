const path = require('path');

function makePath(photo){
    let toPath = Date.now()+photo.name ;
    photo.mv(path.join(__dirname,`./uploads/${toPath}`),function(err){
        if (err) console.log(err);
    });
 return `http://localhost:3000/uploads/${toPath}` ;
}


module.exports = {makePath};