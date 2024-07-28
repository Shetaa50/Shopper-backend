const port = 4000;
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
// const multer = require("multer");
const path = require("path");
const uploads = require('./uploads')

app.use(express.json());
app.use(cors());

// database connection 
mongoose.connect("mongodb+srv://ae796309:01148392533ae-@cluster0.wt5rvlr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/e-commerce").then(() => {
    console.log("database connected");
}).catch((err) => {
    console.log(err);
});

app.get("/", (req, res) => {
    res.send("express app is running")
})

// image engine 

// const storage = multer.diskStorage({
//     destination: "./upload/images",
//     filename: (req, file, cb) => {
//         return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
//     }
// })
// const upload = multer({
//     dest: 'uploads/'
// })
// image upload
// app.use('/images', express.static('upload/'))
app.post('/uploads', (req, res) => {
    res.json({
        success: 1,
        image_url: `https://shopper-backend-nine.vercel.app/uploads/${req.file.filename}`
    })
})

// DB schema 
const Product = mongoose.model('product', {
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true,
    },
})
//Add Product
app.post('/addproduct', async (req, res) => {
    let products = await Product.find({})
    let id;
    if (products.length > 0) {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1;
    }
    else {
        id = 1;
    }
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
        description: req.body.description,
    });
    console.log(product);
    await product.save();
    console.log("product added");
    res.json({
        success: 1,
        name: req.body.name,
    })
})
//Remove Product
app.post('/removeproduct', async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id })
    console.log("product removed");
    res.json({
        success: true
    })
})
//Get Products
app.get('/allproducts', async (req, res) => {
    let products = await Product.find({});
    console.log("products fetched");
    res.send(products);
})
//search 
app.get('/searchproducts', async (req, res) => {
    try {
        const searchTerm = req.query.name;
        if (!searchTerm) {
            return res.status(400).json({ errors: "No search term provided" });
        }
        const products = await Product.find({ name: { $regex: searchTerm, $options: "i" } });
        console.log("products searched");
        res.send(products);
    } catch (error) {
        console.error("Error searching products:", error);
        res.status(500).json({ errors: "Internal server error" });
    }
})
//Login schema 

const Users = mongoose.model('Users', {
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    }
})

//user registration
app.post('/signup', async (req, res) => {
    let check = await Users.findOne({ email: req.body.email })
    if (check) {
        return res.status(400).json({
            success: false,
            errors: "user already exists"
        })
    }
    let cart = {}
    for (let i = 1; i < 20; i++) {
        cart[i] = 0
    }
    const user = new Users({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        cartData: cart
    })
    await user.save();
    const data = {
        user: {
            id: user.id
        }
    }
    const token = jwt.sign(data, 'secret_ecom')
    res.json({
        success: true,
        token
    })
})

//user login
app.post('/login', async (req, res) => {
    let user = await Users.findOne({ email: req.body.email })
    if (user) {
        const passcompare = req.body.password === user.password
        if (passcompare) {
            const data = {
                user: {
                    id: user.id
                }
            }
            const token = jwt.sign(data, 'secret_ecom')
            res.json({
                success: true,
                token
            })
        }
        else {
            res.json({ success: false, errors: "invalid password" })
        }
    }
    else {
        res.json({ success: false, errors: "invalid email" })
    }
})
//new collection 
app.get('/newcollection', async (req, res) => {
    let products = await Product.find({});
    let newcollections = products.slice(1).slice(-8);
    console.log("new collection fetched");
    res.send(newcollections);
})
// popular section
app.get('/popular', async (req, res) => {
    let products = await Product.find({ category: "women" });
    let popular = products.slice(0, 4);
    console.log("popular fetched");
    res.send(popular);
})
//user fetch 
const fetchUser = async (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        res.status(401).send({ errors: "please login" })
    }
    else {
        try {
            const data = jwt.verify(token, 'secret_ecom')
            req.user = data.user;
            next();

        } catch (error) {
            res.status(401).send({ errors: "please login" })
        }
    }
}
//cart data endpoint 
app.post('/addtocart', fetchUser, async (req, res) => {
    console.log("added!", req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id })
    userData.cartData[req.body.itemId] += 1
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send('done!')
})
app.post('/removefromcart', fetchUser, async (req, res) => {
    console.log("removed!", req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id })
    if (userData.cartData[req.body.itemId] > 0) {
        userData.cartData[req.body.itemId] -= 1
        await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    }
    res.send('done!')
})
app.post('/getcartdata', fetchUser, async (req, res) => {
    console.log("getting cart data");
    let userData = await Users.findOne({ _id: req.user.id })
    res.json(userData.cartData)
})

app.get('/alluserscartdata', async (req, res) => {
    try {
        console.log("Getting all users' cart data");
        let users = await Users.find({}, 'name email cartData'); // Fetch only necessary fields

        // Prepare a list of product IDs from all users' cart data
        let productIds = [];
        users.forEach(user => {
            for (let itemId in user.cartData) {
                if (user.cartData[itemId] > 0) {
                    productIds.push(parseInt(itemId, 10)); // Collect product IDs
                }
            }
        });

        // Retrieve product details for the collected product IDs
        let products = [];
        if (productIds.length > 0) {
            products = await Product.find({ id: { $in: productIds } });
        }

        // Create a map for easy lookup of products by ID
        let productMap = {};
        products.forEach(product => {
            productMap[product.id] = product;
        });

        // Format the response with user names and detailed cart data
        let result = users.map(user => {
            let detailedCartData = {};
            for (let itemId in user.cartData) {
                if (user.cartData[itemId] > 0 && productMap[itemId]) {
                    detailedCartData[itemId] = {
                        quantity: user.cartData[itemId],
                        productDetails: productMap[itemId]
                    };
                }
            }
            return {
                name: user.name,
                cartData: detailedCartData
            };
        });

        res.json(result);
    } catch (error) {
        console.error("Error fetching all users' cart data:", error);
        res.status(500).json({ errors: "Internal server error" });
    }
});

app.listen(port, (error) => {
    if (!error) {
        console.log("server running on port " + port)

    }
    else {
        console.log("Error :" + error)
    }
})
