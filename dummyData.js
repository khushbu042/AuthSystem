const mongoose = require("mongoose");
const Product = require("./src/models/product.model.js"); // update path as per your structure
const dotenv = require("dotenv");
dotenv.config({
    path: './.env'
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("DB connected"))
    .catch((err) => console.log(err));
    
const sampleProducts = [];

for (let i = 1; i <= 50; i++) {
    sampleProducts.push({
        name: `Product ${i}`,
        price: Math.floor(Math.random() * 5000) + 100,
        category: i % 2 === 0 ? "laptop" : "phone"
    });
}

const insertData = async () => {
    await Product.insertMany(sampleProducts);
    console.log("Dummy products inserted");
    process.exit();
};

insertData();