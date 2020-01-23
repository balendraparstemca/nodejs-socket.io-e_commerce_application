var mysql=require('mysql');
var sharedObj={};

sharedObj.fnGetMongoCon=function(res,cb){
	var dp={
		host    :   "localhost",
		user    :   "root",
		password:   "",
		database:   "mobile"
	}
    var con=mysql.createConnection(dp);
    con.connect(function(err){
          if(err){
              res.send('db conn error');
          }
		  
         console.log(' db connected');
          cb(con); 
    })
}




module.exports=sharedObj;