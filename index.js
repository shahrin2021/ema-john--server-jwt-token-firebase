const express = require('express');
const app = express();
const { initializeApp } = require('firebase-admin/app');
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config()
const cors = require('cors')

var admin = require("firebase-admin");


// firebase admin initialize 

var serviceAccount = require("./ema-john-project-e4bff-firebase-adminsdk-i20t0-3e6a6b6574.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



app.use(cors())
app.use(express.json())
// emaJojn
// LNodvQoBXD2n52jA


const uri = `mongodb+srv://${process.env.BD_USER}:${process.env.DB_PASS}@cluster0.hes3p.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function verifyToken(req, res, next){
    if(req.headers?.authorization?.startsWith('Bearer ')){
        const idToken = req.headers.authorization.split('Bearer ')[1];
        // console.log('inside function ' ,idToken)
        try{
            const decodedUser= await admin.auth().verifyIdToken(idToken);
            // console.log( 'email',decodedUser.email);
            req.decodedUserEmail = decodedUser.email;

       }catch{

       }
    }
    
    next();
}


async function run (){
    try{
        await client.connect();
        console.log('database connect');

    const database = client.db('onlineShop') ;
    const productCollection = database.collection('products');
    const orderCollection = database.collection('orders');

    // Get the product api 
    app.get('/products', async (req, res)=>{
    console.log(req.query)
        const cursor = productCollection.find({});
        const page= req.query.page;
        const size= parseInt(req.query.size);
        const count =await cursor.count()
        let products;
        if(page){
            products=await cursor.skip(page * size).limit(size).toArray()
        }else{
                products= await cursor.toArray()
        }
        
        
        res.send({
            products,
            count
        });
    });


    // use post to get data by keys

    app.post('/products/byKeys', async (req , res)=>{
       const keys = req.body;
       const query = {key: {$in: keys}};
       console.log(keys)
       const products = await productCollection.find(query).toArray()
        res.json(products)
    });
        app.get('/orders',verifyToken, async(req, res)=>{
            const email = req.query.email;
            console.log(req.headers.authorization)
            if(req.decodedUserEmail === email){
                const  query = {email: email};
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.json(orders)
            }else{
                res.status(401).json({message:'user not authorized'})
            }
          
            
   
              
        })

    app.post('/orders',async (req, res) => {
        const order = req.body;
        order.createdAt = new Date();
        const result = await orderCollection.insertOne(order);
        res.json(result);
    })
    
    










    }finally{
        // await client.close()
    }

}




run().catch(console.dir);



app.get('/', (req, res)=>{
    res.send('ema john mongodb server');
});

app.listen(port ,()=>{
    console.log('listening port ' , port)
});