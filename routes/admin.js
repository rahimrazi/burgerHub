var express = require('express');
var router = express.Router();
var productHelpers = require("../helpers/product-helpers")
const userHelpers = require("..//helpers/user-helpers")
const categoryHelpers = require("../helpers/category-helpers")
const bannerHelpers = require("../helpers/banner-helpers")
const couponHelpers = require("../helpers/coupon-helpers")
const adminHelpers = require("../helpers/admin-helpers")
const dashboardHelpers = require('../helpers/dashboard-helpers');
const verifyAdmin = (req, res, next) => {
  if (req.session.admin) {
    next()
  } else {
    res.redirect("/admin")
  }
}


/* GET users listing. */
router.get('/', async function (req, res, next) {
  try {


    if (req.session.admin) {

      let adminw = req.session.admin

      let userCount = await dashboardHelpers.getUserCount()

      console.log(userCount, "usercounteeeeeeeeee");

      let orderCount = await dashboardHelpers.getOrderCount()

      let codCount = await dashboardHelpers.totalCOD()

      let ONLINECount = await dashboardHelpers.totalONLINE()

      let totalDelivered = await dashboardHelpers.totalDelivered()

      let totalShipped = await dashboardHelpers.totalShipped()

      let cancelled = await dashboardHelpers.cancelled()

      let monthamount = await dashboardHelpers.totalMonthAmount()

      let proCount = await productHelpers.getAllProducts()

      let revenue = await dashboardHelpers.totalReport()
      console.log(revenue);

      let dailySales = await dashboardHelpers.perDaySales()
      const salesLabels = dailySales.map(item => {
        return item._id
      })
      const salesData =dailySales.map(item => {
        return item.totalAmount
      })
      console.log(salesLabels,9999999999);
      console.log(salesData,9999999999);
      console.log("daily",dailySales,"dailySalesssssss");
      console.log(proCount.length, 78787);
      console.log(monthamount)

      res.render('admin/dashboard', { adminw, userCount, orderCount, codCount, proCounts: proCount.length, ONLINECount, totalDelivered, totalShipped, revenue, cancelled, monthamount,salesData,salesLabels })

    } else {
      res.render('admin/admin-login', { layout: "blank" })
    }
  } catch (error) {
    next(error)
  }
})

router.post('/orders-count', async (req, res, next) => {
  try {
    let orderCount = await dashboardHelpers.ordersCount()
    res.json(orderCount)
  } catch (error) {
    next(error)

  }

})
router.post('/login', async (req, res, next) => {
  try {

    await adminHelpers.doLogin(req)
    res.redirect("/admin")
  } catch (error) {
    next(error)

  }

})
router.get("/dashboard", verifyAdmin, async (req, res, next) => {
  try {
    res.redirect("/admin")
  } catch (error) {
    next(error)
  }
})

router.get('/view-product', function (req, res, next) {
  try {


    productHelpers.getAllProducts().then((products) => {
      console.log(products);
      res.render('admin/view-product', { products, delMsg: req.session.delMsg, updMsg: req.session.updMsg })

      req.session.delMsg = null;
      req.session.updMsg = null;
    })
  } catch (error) {
    next(error)

  }
})



router.get('/view-product', function (req, res, next) {
  try {



    res.render('admin/view-product');
  } catch (error) {
    next(error)

  }

});



router.get('/add-product', function (req, res, next) {
  try {


    categoryHelpers.getAllCategory().then((categoryDetails) => {

      res.render('admin/add-product', { categoryDetails, addMsg: req.session.addMsg });
      req.session.addMsg = null
    })
  } catch (error) {
    next(error)
  }
});


router.post('/add-product', function (req, res, next) {
  try {


    req.session.addMsg = "Product added"

    productHelpers.addProduct(req.body, (id) => {


      let image = req.files.image
      image.mv("./public/product-images/" + id + ".jpg", (err) => {

        if (!err) {

          res.redirect("/admin/add-product")
        } else {
          console.log(err);
        } 1
      })

    })
  } catch (error) {
    next(error)

  }
})


router.get("/delete-product/:id", (req, res) => {
  try {


    let proId = req.params.id
    productHelpers.deleteProduct(proId).then((response) => {
      req.session.delMsg = "Product deleted"
      res.redirect("/admin/view-product")
    })
  } catch (error) {

  }

})
router.get("/edit-product/:id", async (req, res) => {
  try {


    let product = await productHelpers.getProductDetails(req.params.id)
    res.render("admin/edit-product", { layout: "layout", product })
  } catch (error) {

  }
})
router.post("/edit-product/:id", (req, res) => {
  try {


    let id = req.params.id
    productHelpers.updateProduct(req.params.id, req.body).then(() => {
      req.session.updMsg = "Product update success"
      res.redirect("/admin/view-product")
      console.log("rayiffnte veendum img", req.files);
      if (req.files != null) {
        let image = req.files.image
        console.log("rYIFNTE IMAG", image);
        image.mv("./public/product-images/" + id + ".jpg")

      }
    })
  } catch (error) {

  }
})
router.get("/view-user", (req, res, next) => {
  try {


    userHelpers.getAllUsers().then((userdetails) => {

      console.log(userdetails);
      res.render("admin/view-user", { userdetails });


    })
  } catch (error) {

  }

})
router.get('/block/:id', (req, res, next) => {
  try {
    let usrId = req.params.id;
    userHelpers.blockUser(usrId).then((response) => {
      res.redirect('/admin/view-user')
    })

  } catch (error) {
    next(error)
  }

})


router.get('/unblock/:id', (req, res, next) => {
  try {
    userHelpers.unblockUser(req.params.id).then(() => {
      res.redirect('/admin/view-user')
    })

  } catch (error) {
    next(error)
  }

})

// block unblock products

router.post('/changeProductStatus/:id', (req, res) => {
  try {

    let proId = req.params.id

    productHelpers.productStatus(proId)
    res.json({ status: true })
  } catch (error) {

  }

})

router.get('/view-category', function (req, res, next) {
  try {



    categoryHelpers.getAllCategory().then((categoryDetails) => {


      res.render('admin/view-category', { categoryDetails });


    })
  } catch (error) {
    next(error)
  }
})




router.get('/add-category', function (req, res, next) {
  try {


    res.render('admin/add-category');
  } catch (error) {
    next(error)
  }


});

router.post('/add-category', (req, res, next) => {
  try {
    
 

  categoryHelpers.addCategory(req.body, (id) => {
    res.redirect('/admin/view-category')
  })
} catch (error) {
  next(error)
}

})

router.get('/delete-category/:id', (req, res, next) => {
  try{

  let categId = req.params.id

  categoryHelpers.deleteCategory(categId).then((response) => {
    res.redirect('/admin/view-category')
  })
} catch (error) {
  next(error)
}
})
//view report
router.get('/view-report',async function (req, res, next) {
  try {
    let userCount = await dashboardHelpers.getUserCount()

    console.log(userCount, "usercounteeeeeeeeee");

    let orderCount = await dashboardHelpers.getOrderCount()

    let codCount = await dashboardHelpers.totalCOD()

    let ONLINECount = await dashboardHelpers.totalONLINE()

    let totalDelivered = await dashboardHelpers.totalDelivered()

    let totalShipped = await dashboardHelpers.totalShipped()

    let cancelled = await dashboardHelpers.cancelled()

    let monthamount = await dashboardHelpers.totalMonthAmount()

    let proCount = await productHelpers.getAllProducts()

    let revenue = await dashboardHelpers.totalReport()
    console.log(revenue);

    let dailySales = await dashboardHelpers.perDaySales()
    const salesLabels = dailySales.map(item => {
      return item._id
    })
    const salesData =dailySales.map(item => {
      return item.totalAmount
    })


    order = await userHelpers.adminOrders()
    res.render('admin/view-report',{order,userCount, orderCount, codCount, proCounts: proCount.length, ONLINECount, totalDelivered, totalShipped, revenue, cancelled, monthamount,salesData,salesLabels });
  } catch (error) {
    next(error)

  }

});
router.get('/view-banners', async function (req, res, next) {
  try{
  let banners = await bannerHelpers.getAllBanners()
  console.log(88888888, banners);
  res.render('admin/view-banners', { banners })


} catch (error) {
  next(error)
}

})


router.get('/add-banner', function (req, res, next) {
  try {




    res.render('admin/add-banner', { addMsg: req.session.addMsg });
    req.session.addMsg = null
  } catch (error) {
    next(error)

  }

});


router.post('/add-banner', function (req, res, next) {
  try {


    req.session.addMsg = "banner added"

    bannerHelpers.addBanner(req.body, (id) => {


      let image = req.files.image
      image.mv("./public/product-images/" + id + ".jpg", (err) => {

        if (!err) {

          res.redirect("/admin/add-banner")
        } else {
          console.log(err);
        } 1
      })

    })
  } catch (error) {
    next(error)
  }
})

router.get("/delete-banner/:id", (req, res) => {
  try {


    let proId = req.params.id
    bannerHelpers.deleteBanner(proId).then((response) => {
      req.session.delMsg = "Banner deleted"
      res.redirect("/admin/view-banner")
    })
  } catch (error) {

  }
})

//admin view order
router.get('/view-orders', async (req, res, next) => {
  try {



    order = await userHelpers.adminOrders()


    res.render('admin/view-orders', { order })

  } catch (error) {
    next(error)

  }

})

router.get('/view-order-products/:id', async (req, res, next) => {
  try {
    singleId = req.params.id
    let products = await userHelpers.getOrderProduct(req.params.id)

    console.log(products, 234123123123);
    buttonchange = await userHelpers.btnChange(singleId)

    res.render('admin/view-order-products', { products, singleId, buttonchange })

  } catch (error) {
    next(error)
  }

})
router.get('/item-packed/:id', async (req, res, next) => {
  try {
    orderId = req.params.id

    let changeStatusPacked = userHelpers.changeStatus(orderId)


    res.redirect('/admin/view-orders')
  } catch (error) {
    next(error)
  }



})

router.get('/item-shipped/:id', async (req, res, next) => {
  try {
    orderId = req.params.id

    let changeStatusShipped = userHelpers.changeStatusShipped(orderId)
    res.redirect('/admin/view-orders')

  } catch (error) {
    next(error)
  }



})

router.get('/item-delivered/:id', async (req, res, next) => {
  try {
    orderId = req.params.id

    let changeStatusDelivered = await userHelpers.changeStatusDelivered(orderId)
    res.redirect('/admin/view-orders')

  } catch (error) {
    next(error)
  }



})

router.get('/coupon-manage', async (req, res, next) => {

  try {
    let viewCoupon = await couponHelpers.viewCoupon()
    res.render('admin/coupon-manage', { viewCoupon })

  } catch (error) {
    next(error)
  }

})
router.get('/add-coupon', (req, res, next) => {
  try {
    res.render('admin/add-coupon')

  } catch (error) {
    next(error)
  }

})
router.post('/add-coupon', async (req, res, next) => {
  try {

    let addCoupon = await couponHelpers.addCoupon(req.body)

    res.redirect('/admin/coupon-manage')

  } catch (error) {
    next(error)
  }



})
router.get('/delete-coupon/:id', (req, res, next) => {
  try {
    let couponId = req.params.id
    let deleteCoupon = couponHelpers.deleteCoupon(couponId)
    res.redirect('/admin/coupon-manage')

  } catch (error) {
    next(error)
  }

})
router.get('/admin-login', (req, res, next) => {
  try {

    res.render('admin/admin-login')

  } catch (error) {
    next(error)
  }

})

router.post("/total-revenue", async (req, res, next) => {
  try {
    let response = await adminHelpers.getTotalRevenue()
    res.json(response)
  } catch (error) {
    next(error)
  }
})
router.post("/logout", (req, res, next) => {
  try {
    req.session.admin = null;
    res.redirect("/admin")

  } catch (error) {
    next(error)
  }
})

module.exports = router;