var express = require('express');
var router = express.Router();
const productHelpers = require("../helpers/product-helpers")
const userHelpers = require("..//helpers/user-helpers")
const categoryHelpers = require("../helpers/category-helpers")
const bannerHelpers = require("../helpers/banner-helpers")
const twilioHelpers = require("../helpers/twilio-helpers")
const couponHelpers = require("../helpers/coupon-helpers")
const verifyLogin = (req, res, next) => {
  if (req.session.user.loggedIn) {
    next()
  } else {
    res.redirect("/login")
  }
}



/* GET home page. */
router.get('/', async function (req, res, next) {
  try {


    let user = req.session.user
    let cartCount = {}
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(req.session.user._id)
    }
    let wishCount = null;
    if (req.session.user) {
      wishCount = await userHelpers.getWishCount(req.session.user._id);
    }
    bannerHelpers.getAllBanners().then((banners) => {

      categoryHelpers.getAllCategory().then((categorys) => {

        productHelpers.getAllProducts().then((products) => {

          res.render('user/index', { layout: "hero", products, user, cartCount, wishCount, categorys, banners })
        })
      })
    })
  } catch (error) {

  }

})

router.get('/login', function (req, res) {
  try {


    if (req.session.user) {
      res.redirect("/")
    } else
      res.render('user/login', { "loginErr": req.session.userLoginErr, layout: "hero" })
    req.session.userLoginErr = false

  } catch (error) {

  }

})

router.get('/signup', (req, res) => {
  try {


    res.render('user/signup', { layout: "hero" })
  } catch (error) {

  }
})

router.post("/signup", (req, res, next) => {
  try {
    userHelpers.verifyUser(req.body).then((response) => {
      console.log(response);
      if (response.status) {
        req.session.body = req.body

        twilioHelpers.doSms(req.body).then((data) => {

          req.session.body = req.body;

          if (data) {
            res.redirect("/otp")

          } else {
            res.redirect("/signup");
          }
        })
      } else {
        res.redirect("/signup");
      }
    })
  } catch (error) {
    next(error);
  }
});

router.get("/otp", (req, res, next) => {
  try {
    res.render("user/otp", { layout: "hero" });

  } catch (error) {

  }
})

router.post("/otp", (req, res, next) => {
  try {

    twilioHelpers.otpVerify(req.body, req.session.body).then((response) => {
      if (response) {
        userHelpers.doSignup(req.session.body).then((response) => {

          res.redirect("/login");
        });
      } else {
        res.redirect("/otp");
      }
    });
  } catch (error) {
    next(error);
  }
});

/*router.post('/signup', function (req, res) {

  userHelpers.doSignup(req.body).then((response) => {

    console.log(response)
    req.session.user = req.body //response
    req.session.user.loggedIn = true
    res.redirect("/")

  })
})*/

router.post('/login', function (req, res) {
  try {


    userHelpers.doLogin(req.body).then((response) => {
      if (response.status) {

        req.session.user = response.user
        req.session.user.loggedIn = true
        res.redirect('/')
      } else {
        req.session.userLoginErr = "invalid email or password or blocked"
        res.redirect("/login")
      }
    })
  } catch (error) {

  }
})
router.get("/logout", (req, res) => {
  try {


    req.session.user = null
    res.redirect('/')
  } catch (error) {

  }

})
router.get("/cart", verifyLogin, async (req, res) => {
  try {



    let user = req.session.user
    let products = await userHelpers.getCartProducts(user._id)
    let totalValue = 0
    if (products.length > 0) {
      totalValue = await userHelpers.getTotalAmount(user._id)
    }


    res.render("user/cart", { layout: "hero", user, products, totalValue })
  } catch (error) {

  }
})

router.get("/add-to-cart/:id", (req, res) => {
  try {


    console.log("api call");
    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
      res.json({ status: true })
      // res.redirect("/")
    })
  } catch (error) {

  }

})
//delete from cart
router.get("/delete-product/:carId/:proId", (req, res, next) => {
  try {
    let cartId = req.params.carId;
    let prodId = req.params.proId;
    userHelpers.deleteProduct(cartId, prodId).then((response) => {
      res.json(response);
    });

  } catch (error) {
    next(error);
  }
})

router.post('/change-product-quantity', (req, res, next) => {
  try {
    userHelpers.changeProductQuantity(req.body).then(async (response) => {

      response.total = await userHelpers.getTotalAmount(req.body.user)

      res.json({ response })
    })
  } catch (error) {
    next(error);
  }
})


router.get('/place-order', verifyLogin, async (req, res) => {
  try {



    let viewCoupon = await couponHelpers.viewCoupon()
    let userId = req.session.user._id
    let user = req.session.user

    let total = await userHelpers.getTotalAmount(req.session.user._id)
    res.render("user/place-order", { layout: "hero", total, user, userId, viewCoupon })
  } catch (error) {

  }
})


router.post('/place-order', async (req, res) => {
  try {


    if (req.session.coupon) {
      let user = await userHelpers.getUserDetails(req.session.user._id)
      let order = req.body
      console.log(order, "98237483248327");

      let CoupDetails = req.session.coupon

      Couponname = CoupDetails.coupon

      let products = await userHelpers.getCartProductList(req.body.userId)
      let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
      let discount = CoupDetails.price




      for (var i = 0; i < products.length; i++) {
        await productHelpers.changeProductStock(products[i].quantity, products[i].item)
      }

      userHelpers.placeOrder(order, products, totalPrice, req.session.user._id, discount, Couponname).then((orderId) => {

        if (req.body['payment-method'] === 'COD') {
          res.json({ codSuccess: true })

        } else {
          let GrandTotal = totalPrice - discount
          userHelpers.generateRazorpay(orderId, GrandTotal).then((response) => {

            res.json(response)
          })
        }

      })

    } else {

      req.session.coupon = null
      let user = await userHelpers.getUserDetails(req.session.user._id)
      let order = req.body

      console.log(order, 676767676767676)

      let products = await userHelpers.getCartProductList(req.body.userId)

      let totalPrice = await userHelpers.getTotalAmount(req.body.userId)





      let GrandTotal = totalPrice
      for (var i = 0; i < products.length; i++) {
        await productHelpers.changeProductStock(products[i].quantity, products[i].item)
      }

      userHelpers.placeOrder(order, products, GrandTotal, req.session.user._id).then(async (orderId) => {


        if (req.body['payment-method'] === 'COD') {
          res.json({ codSuccess: true })
        } else {
          GrandTotal = totalPrice

          userHelpers.generateRazorpay(orderId, GrandTotal).then((response) => {
            res.json(response)
          })
        }

      })

    }
  } catch (error) {

  }

})
router.get("/order-success", (req, res) => {
  try {
    
  
  res.render('user/order-success', { layout: "hero", user: req.session.user })
} catch (error) {
    
}
})



router.get("/orders", async (req, res) => {
  try {
    
  


  let orders = await userHelpers.getUserOrders(req.session.user._id)


  res.render("user/orders", { layout: "hero", user: req.session.user, orders })
} catch (error) {
    
}
})



router.get("/view-order-products/:id", async (req, res) => {
  try {
    
  

  let products = await userHelpers.getOrderProducts(req.params.id)



  res.render("user/view-order-products", { layout: "hero", user: req.session.user, products })
} catch (error) {
    
}
})
router.post('/verify-payment', (req, res) => {
  try {
    
  

  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log("payment successful");
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false, errMsg: '' })
  })
} catch (error) {
    
}
})



router.get('/user-Profile', verifyLogin, async (req, res, next) => {
  try {


    let users = req.session.user
    let cartCount = 0
    let wishlistCount = 0
    if (users) {
      cartCount = await userHelpers.getCartCount(req.session.user._id)
      wishlistCount = await userHelpers.getWishCount(req.session.user._id)
    }
    let category = await categoryHelpers.getAllCategory()
    let data = await userHelpers.getUserDetails(req.session.user._id)


    res.render('user/user-Profile', { layout: 'hero', users, wishlistCount, cartCount, data, category, successMsg: req.session.successMsg })

    req.session.successMsg = null
  } catch (err) {
    next(err)
  }
})
//  the image part of user Profile
router.post('/add-addressimage', verifyLogin, (req, res, next) => {
  try {
    if (req.files.Image) {
      let image = req.files.Image
      let id = req.session.user._id
      image.mv('./public/user-images/' + id + '.jpg')
    }
    res.redirect('back')
  } catch (err) {
    next(err)
  }
})

// the address part of user Profile
router.post('/add-address', verifyLogin, (req, res, next) => {
  try {
    req.session.successMsg = "    update Success"
    userHelpers.addAddress(req.session.user._id, req.body).then((response) => {
      res.redirect('back')
    })
  } catch (err) {
    next(err)
  }
})



router.get('/wishlist', verifyLogin, async (req, res) => {
  try {
    
  
  let user = req.session.user
  let products = await userHelpers.getWishProducts(user._id)
  res.render('user/wishlist', { layout: "hero", products, user })
} catch (error) {
    
}
})
router.get("/add-to-wish/:id", (req, res, next) => {
  try {
    
 

  userHelpers.addToWishList(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
} catch (error) {
    
}

});

router.get("/delete-wishlistproduct/:carId/:proId", (req, res, next) => {
  try {
    let cartId = req.params.carId;
    let proId = req.params.proId;
    userHelpers.deleteWishListProduct(cartId, proId).then((response) => {
      res.json(response);
    });
  } catch (error) {
    next(error);
  }

});

//to get category products
router.get('/category', async (req, res) => {
  try {
    
    let category = req.query.category;
    let user = req.session.user;
    let cartCount = null;
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let whishCount = null;
  if (req.session.user) {
    whishCount = await userHelpers.getWishCount(req.session.user._id);
  }
  
  let categorys = await categoryHelpers.getAllCategory();
  
  let categoryProducts = await categoryHelpers.categoryProducts(category);
  
  res.render("user/category", {
    categoryProducts,
    
    user,
    categorys,
    layout: "hero",
    cartCount,
    whishCount
  });
} catch (error) {
  
}
  
})
//to get single product page
router.get('/single-product/:id', async (req, res) => {
  try {
    
    let proId = req.params.id;
    
    let proDetails = await productHelpers.getProductDetails(proId);
    
    
    res.render("user/single-product", { layout: "hero", proDetails })
  } catch (error) {
    
  }
})

router.post('/apply-coupon', (req, res, next) => {
  try {



    couponHelpers.getAllCoupon(req.body).then((response) => {

      if (response.coupon) {
        req.session.coupon = response
        let addUser = couponHelpers.addUser(req.body)
      }

      res.json(response)



    })

  } catch (error) {
    next(error)
  }


})



module.exports = router;
