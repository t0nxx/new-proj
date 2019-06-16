//const aws = require('aws-sdk');
const express = require('express');
//const multer = require('multer');
//const multerS3 = require('multer-s3');
const Excel = require('exceljs');
const app = express();
const mysql = require('mysql2/promise');
const fileUpload= require('express-fileupload');
const {makePath}=require('./photopath');
const path = require('path');
const cors = require('cors') ;
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));
app.use('/uploads',express.static(__dirname + '/uploads'));

const connection = mysql.createPool({
  host     : process.env.host,
  user     : process.env.user,
  password : process.env.password,
  database : process.env.database ,
  multipleStatements:true ,
  connectionLimit: 10
});

// s3 dynamic cred
// let arr = [] ;

// add rotated app id , secret , token
// app.get('/newCred?',async (req,res)=>{
//     console.log(req.query);
//     arr = [];
//     arr.push(req.query.id,req.query.secret,req.query.sessionToken);
//     arr = arr.map(ele => ele.replace(/\s/g,'+'))
//     console.log(arr);
//     res.send(arr);
// })
app.post('/register',  async (req, res) => {
//     try {
//        //let imgPath = '';
//        /// config   
//        const s3 = new aws.S3({
//         accessKeyId : arr[0],
//         secretAccessKey : arr[1],
//         region : 'us-east-1' ,
//         sessionToken : arr[2]
//     });
    
    // const upload = multer({
    //     storage: multerS3({
    //       s3: s3,
    //       bucket: 'uphh',
    //       contentType: multerS3.AUTO_CONTENT_TYPE,
    //       acl: 'public-read',
    //       metadata: function (req, file, cb) {
    //         cb(null, Object.assign({}, req.body));
    //       },
    //       key: function (req, file, cb) {
    //         cb(null, Date.now().toString())
    //       }
    //     })
    //   }).single('doctorPhoto');


    try {
      let {doctorName,doctorNumber,doctorEmail,doctorWorkplace} = req.body ;
       console.log(req.body);
      await connection.query('INSERT INTO `doctors` (`Name`, `Number`, `Email`, `WorkSpace`) VALUES (?, ?, ?, ?)',[doctorName,doctorNumber,doctorEmail,doctorWorkplace]);
      res.redirect(req.originalUrl+'.html'); 
    } catch (error) {
        res.status(400).send(error);
    }
    
  })

app.post('/upload' , fileUpload() , async(req,res)=>{
  try {

    let {doctorName,doctorQuote} = req.body ;
    let doctorPhoto = 'No Image' ;
    
      if(!req.files){
        doctorPhoto = 'No Image' ;
      }else{
        doctorPhoto = makePath(req.files.doctorPhoto);
      }  
      await connection.query('INSERT INTO `doctors_photos` (`Name`, `Quote`, `Photo`) VALUES (?, ?, ?)',[doctorName,doctorQuote,doctorPhoto]);
      res.redirect(req.originalUrl+'.html');
  } catch (error) {
    res.send({Error : error.message});
  }
});

app.get('/before' ,async (req,res)=>{
  try {
      const [rows] = await connection.query(`SELECT * FROM doctors_photos`);
      res.send({data : rows});
  } catch (error) {
      res.send({Error : error.message});
  }
});

app.post('/after' , fileUpload() , async(req,res)=>{
  try {
    let doctorPhoto = 'No Image' ;
    
      if(!req.files){
        doctorPhoto = 'No Image' ;
      }else{
        doctorPhoto = makePath(req.files.doctorPhoto);
      }  
      await connection.query('INSERT INTO `photos` (`Photo`) VALUES (?)',[doctorPhoto]);
      res.redirect(req.originalUrl+'.html');

  } catch (error) {
    res.send({Error : error.message});
  }
});

app.get('/show' ,async (req,res)=>{
  try {
      let lastElemt = req.query.last || 0 ;
      
      const [remain] = await connection.query(`SELECT COUNT(*) - ${parseInt(lastElemt) + 10}  As remaining FROM photos `);
      
      let remaining  = remain[0].remaining > 0 ? remain[0].remaining  : 0 ;
      if (remaining < 3 ) lastElemt = 0 ;
      const [rows] = await connection.query(`SELECT * from photos LIMIT ${lastElemt},10 `) ;
      let last = rows[rows.length -1];
      res.send({data : rows , last : last.id  });
  } catch (error) {
      res.send({Error : error.message});
      
  }
});

app.get('/export' ,async (req,res)=>{
    try {
      const workbook = new Excel.Workbook();
      const sheet = workbook.addWorksheet('Doctors Sheet');
sheet.columns = [
    { header: 'Id', key: 'id', width: 10 },
    { header: 'Name', key: 'Name', width: 30 },
    { header: 'Number', key: 'Number', width: 20 } ,
    { header: 'Email', key: 'Email', width: 20 } ,
    { header: 'WorkSpace', key: 'WorkSpace', width: 30 } 
  ];
        const [rows] = await connection.query(`SELECT * FROM doctors`);

        sheet.addRows(rows);
        await workbook.xlsx.writeFile('export.xlsx');

        res.download(path.join(__dirname) + '/export.xlsx');
    } catch (error) {
        res.status(400).send(error);
    }
});

app.listen(3000,() => console.log('runnig on port 3000'));