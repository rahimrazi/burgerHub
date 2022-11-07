var db = require("../config/connection")
var collection = require("../config/collections")
var objectId = require("mongodb").ObjectId
module.exports = {
    addProduct: (product, callback) => {
        console.log(product);
        product.Qty=parseInt(product.Qty)
        product.active = true;
        db.get().collection('product').insertOne(product).then((data) => {
            callback(data.insertedId)
        })
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(prodId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
                
                resolve(product)
            })
        })
    },
    updateProduct: (proId, proDetails) => {
        proDetails.Qty=parseInt(proDetails.Qty)
        console.log(proDetails,"prodetailsss");
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: objectId(proId) }, {
                    $set: {
                        name: proDetails.name,
                        price: proDetails.price,
                        Qty: proDetails.Qty
                       

                    }
                }).then((response) => {
                    resolve()
                })

        })
    },
    // for updating the stock when the order is placed
    changeProductStock : async(quantity,id)=>{
        
        let product=await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
            {
                _id : id
            },
            {
                $inc:{
                    Qty : -quantity
                }
            }
        )
        console.log(product);
    },
    //change product status hide unhide
    productStatus:async(proId)=>{
        let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) })
        if (product.active){
            await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                { 
                    _id: objectId(proId) 
                },
                {
                    $set: {
                        active : false


                    }
                }
            )
        }else{
            await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                { 
                    _id: objectId(proId) 
                },
                {
                    $set: {
                        active : true


                    }
                }
            )
        }
    }
}