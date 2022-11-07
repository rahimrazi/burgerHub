var db = require("../config/connection")
var collection = require("../config/collections")
var objectId = require("mongodb").ObjectId

module.exports={
    addCategory: (category, callback) =>{
        try {
            
        
        db.get().collection('category').insertOne(category).then((data) => {
            callback(data.insertedId)

        })
    } catch (error) {
            
    }
    },
    getAllCategory:()=>{
        return new Promise(async(resolve,reject)=>{
            try {
                
           
          let category=await db.get().collection('category').find().toArray()
                resolve(category)
            } catch (error) {
                
            }
            
      
    })
        
    },
    deleteCategory:(categId)=>{
        return new Promise((resolve,reject)=>{
            try {
               
                    db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:objectId(categId)}).then((response)=>{
                        resolve(response)
                    })
              
            } catch (error) {
                reject(error)
            }
        })

    },
    categoryProducts: (data) => {
      
        return new Promise(async (resolve, reject) => {
            try {
                let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: data }).toArray()
           
                resolve(products)  
            } catch (error) {
                reject(error)
            }
           
        })
    }
}