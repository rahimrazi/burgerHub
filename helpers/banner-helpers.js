var db = require("../config/connection")
var collection = require("../config/collections")
var objectId = require("mongodb").ObjectId

module.exports={
    addBanner: (banner, callback) =>{
        db.get().collection('banner').insertOne(banner).then((data) => {
            callback(data.insertedId)
        })
    },
    getAllBanners:()=>{
        return new Promise(async(resolve,reject)=>{
          let banner=await db.get().collection('banner').find().toArray();
                resolve(banner)
            
      
    })
        
    },
    deleteBanner:(bannerId)=>{
        return new Promise((resolve,reject)=>{
            try {
               
                    db.get().collection(collection.BANNER_COLLECTION).deleteOne({_id:objectId(bannerId)}).then((response)=>{
                        resolve(response)
                    })
              
            } catch (error) {
                reject(error)
            }
        })

    }
}