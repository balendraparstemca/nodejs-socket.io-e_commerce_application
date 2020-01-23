var express=require("express");
var cors=require("cors");
var path = require('path');
var bodyparser=require("body-parser");
var socket = require('socket.io');
var app=express();
app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:false}));
var sharedObj = require('./connection');
var http= require('http').Server(app);
var io  = require("socket.io")(http);
var mysql= require("mysql");




var pool =  mysql.createPool({
      connectionLimit :   100,
      host :   'localhost',
      user:   'root',
      password          :   '',
      database          :   'mobile',
      debug             :   false
});


app.use(express.static(path.join(__dirname, 'public')));
app.post('/login-check', function (req, res) {
    
   sharedObj.fnGetMongoCon(res, function (con) {
			con.query("SELECT * FROM   tbl_register where email_add='" + req.body.email + "' and password="+ req.body.password +"", function (err, result, fields) {
			if (err)  res.send({data:'unautherized user.......'});
			else
			{
				
				 res.send({data:'login successfull'});
				 
			}

			
			});
			
       
    })
})

app.get("/",function(req,res){
    res.sendFile(__dirname + '/login.html');
});

app.get("/admin",function(req,res){
    res.sendFile(__dirname + '/detail.html');
});

app.get("/dashboard",function(req,res){
    res.sendFile(__dirname + '/dashboard.html');
});

/*  This is auto initiated event when Client connects to Your Machien.  */

io.on('connection',function(socket){  
    console.log("A user is connected");
    socket.on('status added',function(status,user){
      order_products(status,user,function(res){
		  console.log("aaya");
        if(res){
			    get_order(status,function(result){
				io.emit('refresh feed',result);
					});
            
        } else {
            io.emit('productnotavailable','product is not available your order failed');
			return;
        }
      });
    });
	
	
	  socket.on('adding',function(status,id){
		 console.log(status,id);
      updatestatus(status,id,function(res){
		  
        if(res){
			    get_order(status,function(result){
				io.emit('refresh feed',result);
					});
            
        } else {
            io.emit('error');
        }
      });
    });
	
	
	
	socket.on('wantdetail',function(id){
		 console.log(id);
    
			    get_orderdetails(id,function(result){
				io.emit('gettingdetail',result);
					});
        
    });
});


app.get('/fetch',(req,res)=>
{
 
     
		sharedObj.fnGetMongoCon(res, function (con) {
		con.query("SELECT * FROM  tbl_product", function (err, result, fields) {
		if (err) throw err;
		else
		{
		    
  		     res.send(result);
		     
		}

		
		});
        
       
    })
})


app.get('/customer',(req,res)=>
{
 
     
		sharedObj.fnGetMongoCon(res, function (con) {
		con.query("SELECT * FROM  tbl_register", function (err, result, fields) {
		if (err) throw err;
		else
		{
		    
  		     res.send(result);
		     
		}

		
		});
        
       
    })
})


app.get('/fetchorder',(req,res)=>
{
	
 
     
		sharedObj.fnGetMongoCon(res, function (con) {
		con.query("SELECT * FROM  tbl_order", function (err, result, fields) {
		if (err) throw err;
		else
		{
		    
  		     res.send(result);
		     console.log(result);
		}

		
		});
        
       
    })
})



var order_products = function (obj,user,callback) {
	 productnotavilable=false;
	 var orderid=0;
     var insert=[];
	 console.log("multi data inserting "+ obj + user);
	
	   console.log(insert);
  pool.getConnection(function(err,connection){
        if (err) {
          callback(false);
          return;
        }
		
		

		  connection.query("select * from tbl_order order by id desc limit 1",function(err,re){
			       if(err)
				   {
					   console.log(re);
				   }
				   else{
					   if(re.length > 0)
					   {
						   orderid=re[0].id + 1;
						console.log("order.........." + re);
					   }
					   
				   }
				
		  })
		
		 obj.data.forEach((e,i)=>
						 {
							     
							 connection.query("select  quantity from  tbl_product where prod_id="+ e.pid,function(err,res){
								 if(!err){
									 console.log('ye quantity hai bro '+ res[0].quantity+ e .pid);
									 if(e.quantity > res[0].quantity)
									 {
										
										 
										  callback(false);

										 
										
									 }
									 else{
										  var q=res[0].quantity - e.quantity;
										 connection.query("update tbl_product set quantity="+ q +" where prod_id="+ e.pid,function(err,re){
											 if(err) { console.log(err) ;}
										 })
										 
									
										 
									 }
								 }
								 
							 });
							 
						 })
						 
						 
	
		 
        connection.query("INSERT INTO tbl_order(date,cust_id,cust_name) VALUES(now(),1,'" + user  +"')",function(err,resultone){
            connection.release();
            if(!err) {
						var orderid=resultone.insertId;
						
			  //insert order product
			  obj.data.forEach((e,i)=>
						 {
							 insert.push([e.pid,orderid,e.pname,e.price,e.quantity]);
						 });
			 
						  var sql = "INSERT INTO  orderdetails (prod_id,ordersid, pname, price,quantity) VALUES ?";
					
						connection.query(sql,[insert],function(err,result){
						
						if(!err) {
						  console.log("order product result " + result);
						  callback(true);
						}
						else{
							 console.log(err);
						}
					});
			  
			  
			  
			  
			  
			  
			  
			  callback(true);
            }
			else{
				 console.log(err);
			}
        });
  
 
		
		 
		
/**/
		
		
		
     connection.on('error', function(err) {
              callback(false);
              return;
        });
    });
}


var get_order = function (status,callback) {

	   console.log("fecthing order");
  pool.getConnection(function(err,connection){
        if (err) {
          callback(false);
          return;
        }
    connection.query("select * from  tbl_order",function(err,result){
            connection.release();
            if(!err) {
              callback(result);
            }
        });
     connection.on('error', function(err) {
              callback(false);
              return;
        });
    });
}

var get_orderdetails = function (id,callback) {

	   console.log("fecthing order");
  pool.getConnection(function(err,connection){
        if (err) {
          callback(false);
          return;
        }
    connection.query("select * from  orderdetails where ordersid="+ id,function(err,result){
            connection.release();
            if(!err) {
              callback(result);
            }
        });
     connection.on('error', function(err) {
              callback(false);
              return;
        });
    });
}


var updatestatus = function (status,id,callback) {

	   console.log('updating' + status,id);
  pool.getConnection(function(err,connection){
        if (err) {
          callback(false);
          return;
        }
  connection.query("update tbl_order set status ='"+ status +"' where id=" + id,function(err,result){
           
            if(!err) {
				console.log(result);
              callback(true);
            }
        });
     connection.on('error', function(err) {
		 console.log(err);
              callback(false);
              return;
        });
    });
}




http.listen(8080,function(){
  console.log("Listening on 8080");
});