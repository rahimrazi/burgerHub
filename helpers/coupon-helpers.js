var db = require("../config/connection")
var collection = require("../config/collections")
var objectId = require("mongodb").ObjectId

module.exports={
    addCoupon: (coupon) => {
        return new Promise((resolve, reject) => {
        try {
          

                db.get().collection(collection.COUPON_COLLECTION).insertOne(coupon).then((response) => {
                    resolve(response)
                })
    
          
            
        } catch (error) {
            reject(error)
        }
        })},

    viewCoupon: () => {
        return new Promise(async (resolve, reject) => {
        try {
         
                let viewCoupon = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
                resolve(viewCoupon)
         
            
        } catch (error) {
            reject(error)
        }
       
    })
    },
    deleteCoupon: (couponId) => {
        return new Promise(async (resolve, reject) => {
        try {
         
                db.get().collection(collection.COUPON_COLLECTION).deleteOne({ _id: objectId(couponId) }).then((response) => {
                    resolve(response)
                })
        
            
        } catch (error) {
            reject(error)
        }
    })
    },
    getAllCoupon: (coupUser) => {
        
        let couponNew = coupUser.coupon;

        let userId = coupUser.userId;
        

        return new Promise(async (resolve, reject) => {
        try {
          
                let couponDetails = await db
                    .get()
                    .collection(collection.COUPON_COLLECTION)
                    .findOne({ coupon: couponNew });
    
                if (couponDetails) {
                    console.log(couponDetails, 'coupon detailsss');
                    var d = new Date();
                    
                    let str = d.toJSON().slice(0, 10);
    
                    
    
                    if (str > couponDetails.expiry) {
                        resolve({ expirry: true });
                    } else {
                        
                        let users = await db
                            .get()
                            .collection(collection.COUPON_COLLECTION)
                            .findOne({ coupon: couponNew, users: { $in: [objectId(userId)] } });
                        
                        if (users) {
                            
                            resolve({ used: true });
                        } else {
                            resolve(couponDetails);
                        }
                    }
                } else {
                    
                    resolve({ unAvailable: true });
                }
          
            
        } catch (error) {
            reject(error)
        }
    });
       
    },
    addUser:  (orderDetails) => {
        console.log(orderDetails,'addddding userrrrrrrrrrrrrrrr');
        return new Promise((resolve, reject) => {

        try {
           
                db.get().collection(collection.COUPON_COLLECTION).updateOne({ coupon: orderDetails.coupon },
                {
                    $push: { users: orderDetails.userId }
    
                }).then((response) => {
                    resolve(response)
                })
    
        
         
        } catch (error) {
            reject(error)
        }
    })
       
    }




}
