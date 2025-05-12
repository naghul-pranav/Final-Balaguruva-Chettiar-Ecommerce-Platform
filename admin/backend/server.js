const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");

const app = express();
const PORT = 5000;
const MONGO_URI = "mongodb+srv://balaguruva-admin:Balaguruva%401@balaguruvacluster.d48xg.mongodb.net/?retryWrites=true&w=majority&appName=BalaguruvaCluster";

// Middleware
app.use(cors());
app.use(express.json());

// Counter schema for auto-incrementing IDs
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model("Counter", counterSchema);

// Product schema with validation
const productSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  mrp: { type: Number, required: true, min: 0 },
  discount: { type: Number, required: true, min: 0, max: 100 },
  discountedPrice: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
  image: { type: String, required: true },
  stock: { type: Number, required: true, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  orderItems: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
      quantity: { type: Number, required: true },
    }
  ],
  totalPrice: { type: Number, required: true },
  orderStatus: {
    type: String,
    enum: ["processing", "shipped", "delivered", "cancelled"],
    default: "processing"
  },
  statusHistory: [
    {
      status: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model("Orders", orderSchema);

// Pre-save middleware for auto-incrementing product ID
productSchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      const counter = await Counter.findByIdAndUpdate(
        "productId",
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );
      this.id = counter.seq;
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Product = mongoose.model("Products", productSchema);

// Connect to MongoDB and update the counter to the max product id
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("✅ MongoDB Connected");

    // Update the counter document to be in sync with the highest product id
    const lastProduct = await Product.findOne({}).sort({ id: -1 });
    const maxId = lastProduct ? lastProduct.id : 0;
    await Counter.findByIdAndUpdate(
      "productId",
      { seq: maxId },
      { upsert: true, new: true }
    );
    console.log(`✅ Counter set to ${maxId}`);

    // Drop the existing index (if any) and create a new unique index on id
    try {
      await mongoose.connection.collection("products").dropIndex("id_1");
      console.log("✅ Dropped existing index");
    } catch (error) {
      console.log("No existing index to drop");
    }
    await Product.collection.createIndex({ id: 1 }, { unique: true });
    console.log("✅ Created new unique index");
  })
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Multer configuration for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  }
});

// Helper function to format the product response
const formatProduct = (product) => ({
  id: product.id,
  _id: product._id,
  name: product.name,
  description: product.description,
  mrp: product.mrp,
  discount: product.discount,
  discountedPrice: product.discountedPrice,
  category: product.category,
  image: `data:image/png;base64,${product.image}`,
  stock: product.stock,
  createdAt: product.createdAt
});

// GET all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products.map(formatProduct));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products", details: err.message });
  }
});

// POST add a new product
app.post("/api/products", upload.single("image"), async (req, res) => {
  try {
    const { name, description, mrp, discount, discountedPrice, category , stock } = req.body;
    if (!req.file) return res.status(400).json({ error: "Image is required" });
    if (!name || !description || !mrp || !discount || !category || category=="" || !stock) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newProduct = new Product({
      name,
      description,
      mrp: Number(mrp),
      discount: Number(discount),
      discountedPrice: Number(discountedPrice),
      category,
      image: req.file.buffer.toString("base64"),
      stock: Number(stock)
    });

    await newProduct.save();
    res.status(201).json({ message: "✅ Product added successfully", product: formatProduct(newProduct) });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ error: "Failed to add product", details: err.message });
  }
});

// PUT update product by MongoDB _id
app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    const updateData = {
      name: req.body.name,
      description: req.body.description || existingProduct.description,
      mrp: Number(req.body.mrp),
      discount: Number(req.body.discount),
      discountedPrice: Number(req.body.discountedPrice),
      category: req.body.category,
      stock: Number(req.body.stock)
    };

    if (req.file) {
      updateData.image = req.file.buffer.toString("base64");
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedProduct) {
      throw new Error("Failed to update product");
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product: formatProduct(updatedProduct)
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update product", details: err.message });
  }
});

app.put("/api/orders/admin/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // ✅ Restock if cancelling
    if (status === "cancelled" && order.orderStatus !== "cancelled") {
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }

    // ✅ Update status and push to status history
    order.orderStatus = status;
    order.statusHistory.push({
      status,
      timestamp: new Date()
    });

    await order.save();

    res.json({ success: true, message: `Order marked as ${status}` });
  } catch (err) {
    console.error("Order status update error:", err);
    res.status(500).json({ error: "Failed to update order", details: err.message });
  }
});


// DELETE a product
// DELETE a product with archival
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID format" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Archive product
    await mongoose.connection.collection("deletedproducts").insertOne(product.toObject());

    // Then delete it
    await Product.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Product archived and deleted successfully",
      deletedId: id
    });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete product", details: err.message });
  }
});

app.get("/api/deleted-products", async (req, res) => {
  try {
    const archived = await mongoose.connection
      .collection("deletedproducts")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ success: true, products: archived });
  } catch (err) {
    console.error("Error fetching deleted products:", err);
    res.status(500).json({ error: "Failed to fetch deleted products" });
  }
});

// Start the server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
