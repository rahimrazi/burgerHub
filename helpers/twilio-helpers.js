require('dotenv').config()
const accountID=process.env.ACCOUNTID
const authToken=process.env.AUTHTOKEN
const serviceID=process.env.SERVICEID

const client=require('twilio')(accountID, authToken, serviceID)


module.exports={
   
    doSms:(userData)=>{
        let res={}
        return new Promise(async(resolve,reject)=>{
        try {
           
       
            await client.verify.services(serviceID).verifications.create({
                to :`+91${userData.mobileNumber}`,
                channel:"sms"
            }).then((res)=>{
                res.valid=true;
                resolve(res)
               
            })
       
        } catch (error) {
            reject(error)
        }
    })
    },
   
    otpVerify:(otpData,userData)=>{
        let resp={}

        return new Promise(async(resolve,reject)=>{
        try {
            
            await client.verify.services(serviceID).verificationChecks.create({
                to:   `+91${userData.mobileNumber}`,
                code:otpData.otp
            }).then((resp)=>{
                 
                resolve(resp.valid)
            })
       
        } catch (error) {
            reject(error)
        }
    })
    }

   

 }
 