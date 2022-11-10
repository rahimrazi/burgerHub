var db = require("../config/connection")
var collection = require("../config/collections")
const bcrypt = require("bcrypt")
const { response } = require("../app")
var objectId = require("mongodb").ObjectId
const Razorpay = require('razorpay');
const { ORDER_COLLECTION } = require("../config/collections")
const { request } = require("http")

var instance = new Razorpay({
    key_id: 'rzp_test_MSI9wK8MWUe8kH',
    key_secret: 'VXgoj4hDq07AcGaIqzwYsNL1',
});
module.exports = {
    doSignup: (userData) => {


        return new Promise(async (resolve, reject) => {
            try {


                userData.block = false


                userData.password = await bcrypt.hash(userData.password, 10)
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                    resolve(data.insertedId)

                })
            } catch (error) {
                reject(error)
            }

        })


    },
    verifyUser: (userData) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            try {

                let verify = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })

                if (verify) {
                    response.status = false
                    resolve(response)
                } else {
                    response.status = true
                    resolve(response)
                }



            } catch (error) {
                reject(error)
            }
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            try {
                
            
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {


                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        if (user.block == false) {

                            console.log("success");
                            response.user = user
                            response.status = true

                            resolve(response)
                        } else {
                            console.log("blocked");
                            resolve({ status: false })
                        }

                    } else {
                        console.log("failed");
                        resolve({ status: false })
                    }
                })
            } else {
                console.log("failed");
                resolve({ status: false })
            }
        } catch (error) {
               reject(error) 
        }
        })
    },
    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            try {
                
            
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                console.log(proExist)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), "products.item": objectId(proId) },
                            {
                                $inc: { "products.$.quantity": 1 }
                            }).then(() => {
                                resolve()
                            })
                } else {


                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {

                                $push: { products: proObj }

                            }).then((response) => {
                                resolve()
                            })
                }

            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        } catch (error) {
                reject(error)
        }
        })
    },
    deleteProduct: (cartId, proId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(cartId) },
                        {
                            $pull: { products: { item: objectId(proId) } }
                        }).then((response) => {
                            resolve({ removeProduct: true })
                        })
            } catch (error) {
                reject(error)
            }

        })
    },
    getCartProducts: (userId) => {
        console.log(userId);
        return new Promise(async (resolve, reject) => {
            try {
                
           
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }

                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: "$products.item",
                        quantity: "$products.quantity"
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }


            ]).toArray()
            console.log(cartItems);
            resolve(cartItems)
        } catch (error) {
                reject(error)
        }

        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                
            
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length

            }
            resolve(count)
        } catch (error) {
           reject(error)     
        }
        })
    },
    changeProductQuantity: (details) => {
        console.log(details);
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            try {
                
           
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } },
                        }
                    ).then((response) => {

                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { "products.$.quantity": details.count }
                        }).then((response) => {
                            resolve({ status: true })
                        })
            }
        } catch (error) {
                reject(error)
        }

        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                
            
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }

                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: "$products.item",
                        quantity: "$products.quantity"
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.price' }] } }
                    }
                }


            ]).toArray()

            console.log("total", total);
            if (total.length == 0) {
                resolve(total);
            } else {
                resolve(total[0].total);
            }
        } catch (error) {
               reject(error) 
        }

        })
    },
    placeOrder: (order, products, total, userId, discount, Couponname) => {

        console.log(order, "orderuseriddddddddddddddd");
        let GrandTotal = total
        if (Couponname) {
            GrandTotal = total - discount

        }
        return new Promise(async (resolve, reject) => {
            try {
                
           
            let status = await order['payment-method'] === 'COD' ? 'placed' : 'pending'

            let orderObj = {
                deliveryDetails: {

                    mobile: order.mobile,
                    address: order.address,
                    pincode: order.pincode

                },
                userId: objectId(order.userId),
                paymentMethod: order['payment-method'],
                products: products,
                totalAmount: total,
                Discount: discount,
                GrandTotal: GrandTotal,

                couponDiscount: discount,
                status: status,
                date: new Date()
            }
            let users = [objectId(userId)];
            await db
                .get()
                .collection(collection.COUPON_COLLECTION)
                .updateOne({ coupon: Couponname }, { $set: { users } })
            await db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })

                resolve(response.insertedId)
            })
        } catch (error) {
            reject(error)   
        }

        })

    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                
            
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        } catch (error) {
            reject  (error)  
        }
        })
    },
    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                
            

            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }).toArray()

                // let prodcuts = await db. get().collection(collection.PRODUCT_COLLECTION).)
                ;
            resolve(orders)
        } catch (error) {
            reject(error)
                
        }
        })
    },
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            try {
                
            
            console.log(444444444444, orderId);
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },



            ]).toArray()

            resolve(orderItems)
        } catch (error) {
         reject(error)       
        }
        })

    },
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            try {
                
            
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId
            };

            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                }
                console.log("New Order:", order)
                resolve(order)

            })
        } catch (error) {
                reject(error)
        }


        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            try {
                
           
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'VXgoj4hDq07AcGaIqzwYsNL1')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        } catch (error) {
             
        }
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            try {
                
           
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId) },
                    {
                        $set: {
                            status: 'placed'
                        }
                    }).then(() => {
                        resolve()
                    })
                } catch (error) {
                reject(error)
                }
        })
    },
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            try {
                
            


            let userdetails = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(userdetails)
        } catch (error) {
            reject(error)
                
        }

        }
        )
    },
    blockUser: (usrID) => {
        return new Promise((resolve, reject) => {

                try {
                    
              


            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(usrID) }, { $set: { block: true } }).then(() => {

                resolve()
            })


        } catch (error) {
                    reject(error)
        }

        })
    },
    unblockUser: (usrID) => {
        return new Promise((resolve, reject) => {
            try {

                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(usrID) }, { $set: { block: false } }).then(() => {
                    resolve()
                })

            } catch (error) {
                reject(error)
            }
        })
    },
    addToWishList: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            try {
                
            
            let userWish = await db.get().collection(collection.WISH_COLLECTION).findOne({ user: objectId(userId) })
            if (userWish) {
                let proExist = userWish.products.findIndex(product => product.item == proId)
                if (proExist != -1) {
                    db.get().collection(collection.WISH_COLLECTION).updateOne({ 'products.item': objectId(proId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve()
                        })

                } else {
                    db.get().collection(collection.WISH_COLLECTION).updateOne({ user: objectId(userId) },
                        {

                            $push: { products: proObj }


                        }).then((response) => {
                            resolve()
                        })
                }
            } else {
                let wishObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.WISH_COLLECTION).insertOne(wishObj).then((response) => {
                    resolve()

                })
            }
            } catch (error) {
                reject(error)
            }
        })
    },
    getWishProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishItems = await db.get().collection(collection.WISH_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'

                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                }, {
                    $project: {
                        item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] }
                    }
                }

            ]).toArray()

            resolve(wishItems)

        })
    },
    getWishCount: (userId) => {
        return new Promise(async (resolve, reject) => {


            let count = 0
            let wish = await db.get().collection(collection.WISH_COLLECTION).findOne({ user: objectId(userId) })
            if (wish) {
                count = wish.products.length

            }
            resolve(count)


        })
    },
    deleteWishListProduct: (cartId, proId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.WISH_COLLECTION)
                    .updateOne({ _id: objectId(cartId) },
                        {
                            $pull: { products: { item: objectId(proId) } }
                        }).then((response) => {
                            resolve({ removeProduct: true })
                        })
            } catch (error) {
                reject(error)
            }

        })
    },


    getProfileDetails: (usrId) => {
        return new Promise((resolve, reject) => {


            userSignupDetails = db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(usrId) })
            resolve(userSignupDetails)



        })
    },

    adminOrders: () => {
        return new Promise(async (resolve, reject) => {
            try {

                let adminorderlist = db.get().collection(collection.ORDER_COLLECTION).find().sort({ date: -1 }).toArray()
                resolve(adminorderlist)

            } catch (error) {
                reject(error)
            }
        })
    },
    getOrderProduct: (orderID) => {
        return new Promise(async (resolve, reject) => {
            try {

                let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate(
                    [
                        {
                            $match: {
                                _id: new objectId(orderID)
                            }
                        },
                        {
                            $unwind: {
                                path: '$products'
                            }
                        },
                        {
                            $lookup: {
                                from: 'product',
                                localField: 'products.item',
                                foreignField: '_id',
                                as: 'result'
                            }
                        },
                        {
                            '$unwind': {
                                'path': '$result'
                            }
                        },
                        {
                            '$project': {
                                'products': 1,
                                'result': 1,
                                'date': 1,
                                'totalAmount': 1,
                                'paymentMethod': 1,
                                'status': 1,
                                'GrandTotal':1,
                                'couponDiscount':1


                            }
                        }
                    ]

                ).toArray()

                resolve(orderItems)
                console.log("orderitems", orderItems)

            } catch (error) {
                reject(error)
            }
        })
    }, changeStatus: (orderId) => {
        return new Promise(async (resolve, reject) => {
            try {


                let changeOrderStatus = await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, { $set: { status: 'packed', value: false, shipped: true, delivered: false } })
                resolve()

            } catch (error) {
                reject(error)
            }
        })

    },

    changeStatusShipped: (orderId) => {
        return new Promise(async (resolve, reject) => {
            try {

                let changeOrderStatus = await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                    { $set: { status: 'Shipped', value: false, shipped: false, delivered: true } })
                resolve()


            } catch (error) {
                reject(error)
            }
        })

    },

    changeStatusDelivered: (orderId) => {
        return new Promise(async (resolve, reject) => {
            try {

                let changeOrderStatus = await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                    { $set: { status: 'Delivered', value: true, shipped: false, delivered: true } })
                resolve()


            } catch (error) {
                reject(error)
            }
        })
    },
    btnChange: (orderId) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            try {

                let order = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: objectId(orderId) })
                if (order) {
                    if (order.shipped) {
                        response.id = orderId
                        response.status = true
                        response.pack = false
                        resolve(response)
                    } else if (order.delivered) {
                        response.id = orderId
                        response.status = false
                        resolve(response)
                    } else {
                        response.pack = true
                        response.status = false
                        response.id = orderId
                        resolve(response)
                    }


                }


            } catch (error) {
                reject(error)
            }
        })

    },
    changeStatusCancelled: (orderId) => {
        return new Promise(async (resolve, reject) => {
            try {

                let changeOrderStatus = await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, { $set: { status: 'Cancelled', value: false } })
                resolve()


            } catch (error) {
                reject(error)
            }
        })
    },
    //getting single user detail fo user profile page
    getUserDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let userDetails = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
                resolve(userDetails)
            } catch (err) {
                next(err)
            }
        })
    },
    //adding address in user profile page
    addAddress: (userId, data) => {
        return new Promise(async (resolve, reject) => {
            try {
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                    $set: {
                        Name: data.Name,
                        Address: data.Address,
                        pincode: data.Pincode,
                        state: data.State,
                        city: data.City
                    }
                }).then((response) => {
                    resolve(response)

                })

            } catch (err) {
                reject(err)
            }
        })
    }
}