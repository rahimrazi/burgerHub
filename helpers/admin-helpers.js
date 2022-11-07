var db = require("../config/connection")
var collection = require("../config/collections")
var objectId = require("mongodb").ObjectId

module.exports={
    doLogin:(req)=>{
        return new Promise(async(resolve, reject) => {
            try {

                let admin =  await db.get().collection(collection.ADMIN_COLLECTION).findOne({Email : req.body.Email})
                if(admin){
                    if(req.body.Password == admin.Password){
                        req.session.admin = true
                        resolve("success")
                    }
                }else{
                    req.session.admin = false
                    resolve()
                }
            } catch (error) {
                reject(error)
                
            }
            
        })
        
    },
    getTotalRevenue: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let today = new Date()
                let before = new Date(new Date().getTime() - (250 * 24 * 60 * 60 * 1000))
                let revenue = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match: {
                            status: 'Delivered',
                            date: {
                                $gte: before,
                                $lte: today
                            }
                        }
                    },
                    {
                        $project: {
                            paymentMethod: 1, GrandTotal: 1, date: 1
                        }
                    },
                    {
                        $group: {
                            _id: { date: { $dateToString: { format: "%m-%Y", date: "$date" } }, paymentMethod: '$paymentMethod' },
                            Amount: { $sum: '$GrandTotal' }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            date: '$_id.date',
                            paymentMethod: '$_id.paymentMethod',
                            amount: '$Amount',
                        }
                    }
                ]).sort({ date: 1 }).toArray()
                let obj = {
                    date: [], cod: [0, 0, 0, 0, 0, 0, 0, 0], online: [0, 0, 0, 0, 0, 0, 0, 0]
                }
                let month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                let a = today.getMonth() - 6
                for (let i = 0; i < 8; i++) {
                    for (let k = 0; k < revenue.length; k++) {
                        if (Number(revenue[k].date.slice(0, 2)) == Number(a + i)) {
                            if (revenue[k].paymentMethod == 'ONLINE') {
                                obj.online[i] = revenue[k].amount
                            } else {
                                obj.cod[i] = revenue[k].amount
                            }
                        }
                    }
                    obj.date[i] = month[a + i - 1]
                }
                resolve(obj)
                
            } catch (error) {
                reject(error)
            }

        })
    },
    
}