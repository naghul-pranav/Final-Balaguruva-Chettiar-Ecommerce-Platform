const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const User = require('./models/User');
const app = express();
const PORT = 5000;
const jwt = require("jsonwebtoken");
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
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now, expires: "7d" }
}, { timestamps: true });

const Contact = mongoose.model("Contact", contactSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false // Allow guest checkout
  },
  userEmail: { type: String, required: true },
  userName: { type: String, required: false, default: "Guest User" },
  orderItems: [{
    name: { type: String, required: true },
    mrp: { type: Number, required: true },
    discountedPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String }
  }],
  
  shippingInfo: {
    fullName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true }
  },
  deliveryMethod: { 
    type: String, 
    required: true,
    enum: ['standard', 'express'] 
  },
  paymentMethod: { 
    type: String, 
    required: true,
    enum: ['razorpay', 'cod', 'upi'] // Add 'upi' here
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String }
  },
  subtotal: { type: Number, required: true },
  deliveryPrice: { type: Number, required: true, default: 0 },
  totalPrice: { type: Number, required: true },
  orderStatus: {
    type: String, 
    required: true,
    enum: ['processing', 'shipped', 'delivered', 'cancelled'],
    default: 'processing'
  },
  orderReference: { type: String, required: true, unique: true },
  notes: { type: String }
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);

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
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: "Status is required" 
      });
    }
    
    // Validate status value
    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status value" 
      });
    }
    
    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }
    
    // Update order status
    order.orderStatus = status;
    
    // Set payment status to completed if order is delivered and payment was pending
    if (status === 'delivered' && order.paymentMethod === 'cod' && order.paymentStatus === 'pending') {
      order.paymentStatus = 'completed';
    }
    
    // If order is cancelled, update payment status appropriately
    if (status === 'cancelled') {
      if (order.paymentStatus === 'completed') {
        // For orders where payment is already completed, we might want to mark as 'refunded'
        // For simplicity, we're just logging this case
        console.log(`Admin cancelled order ${id} with completed payment - refund may be needed`);
      } else if (order.paymentStatus === 'pending') {
        // For pending payments, mark as failed when order is cancelled
        order.paymentStatus = 'failed';
      }
    }
    
    await order.save();
    
    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: {
        _id: order._id,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error("Error updating order status (admin):", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update order status", 
      error: error.message 
    });
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

app.get("/api/contacts", async (req, res) => {
  try {
    const contacts = await Contact.find({});
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contacts", details: error.message });
  }
});

// Get All Users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "email name createdAt");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users", details: error.message });
  }
});
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(`Auth Header for ${req.path}:`, authHeader); // Debug header

  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    console.log(`No token provided for ${req.path}`);
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  console.log(`Token received: ${token}`); // Debug token

  try {
    const verified = jwt.verify(token, "4953546c308be3088b28807c767bd35e99818434d130a588e5e6d90b6d1d326e");
    console.log(`Token verified for user:`, verified); // Debug verified payload
    req.user = verified;
    next();
  } catch (error) {
    console.error(`Token verification error for ${req.path}:`, error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Invalid token. Please log in again." });
    }
    res.status(500).json({ message: "Internal server error during token verification." });
  }
};

app.put("/api/orders/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: "Status is required" 
      });
    }
    
    // Validate status value
    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status value" 
      });
    }
    
    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }
    
    // Update order status
    order.orderStatus = status;
    
    // Set payment status to completed if order is delivered and payment was pending
    if (status === 'delivered' && order.paymentMethod === 'cod' && order.paymentStatus === 'pending') {
      order.paymentStatus = 'completed';
    }
    
    // If order is cancelled and payment was completed, we might want to handle refund logic here
    
    await order.save();
    
    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: {
        _id: order._id,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus
      }
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update order status", 
      error: error.message 
    });
  }
});
// Get All Orders (Admin)
app.get("/api/orders", authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders. Please try again later." });
  }
});

// Get All Orders (Admin - No Authentication)
app.get("/api/orders/admin/all", async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch orders. Please try again later.",
      error: error.message
    });
  }
});

// Update Order Status Endpoint for Admin (No Authentication)


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
