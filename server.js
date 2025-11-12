const mysql = require('mysql2');
const express = require("express");
const app = express();
const path = require("path");
const port = 8080;
const cookieParser = require('cookie-parser');

app.use(cookieParser());

const requestLogger = (req, res, next) => {
    console.log(` ${req.method} ${req.url}`);
    next();
  };

app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(__dirname));

const con = mysql.createConnection({
    host: "localhost",
    user: "NodeClient",
    password: "NodeClient123",
    database: "ShipMe"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "home.html"));
  });

app.get("/SignIn", (req, res) => {
    res.sendFile(path.join(__dirname, "signIn.html"));
});

app.post("/SignIn", function(req, res) {
    const { email, password } = req.body;

    const sql = "SELECT FirstName FROM Users WHERE Email = ? AND Password = ?";
    con.query(sql, [email, password], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            const firstName = results[0].FirstName;
            res.cookie("firstName", firstName, { maxAge: 24*60*60*1000 });
            res.send('Welcome, + ${firstName}');
        } else {
            res.send("Invalid email or password.");
        }
    });
});

app.get("/getOrders", (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const sql = `
        SELECT OrderID, TrackingID, ShipmentCost, Origin, Destination, OrderDate, Status
        FROM individualOrders
        WHERE SenderEmail = ?
        ORDER BY OrderDate DESC
    `;

    con.query(sql, [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

app.get("/SignUp", (req, res) => {
    res.sendFile(path.join(__dirname, "signUp.html"));
});

app.post("/SignUp", (req, res) => {
    const { firstName, lastName, email, phone, password } = req.body;
  
    const sql = "INSERT INTO Users (FirstName, LastName, Email, PhoneNumber, Password) VALUES (?, ?, ?, ?, ?)";
    con.query(sql, [firstName, lastName, email, phone, password], (err, result) => {
      if (err) {
        console.error(err);
        return res.send("Error registering user");
      }
      res.send(`User ${firstName} registered successfully! <a href="/SignIn">Sign in</a>`);
    });
  });

app.get("/PrivacyPolicy", (req, res) => {
    res.sendFile(path.join(__dirname, "privacyPolicy.html"));
});

app.get("/Payment", (req, res) => {
    res.sendFile(path.join(__dirname, "payment.html"));
});

app.get("/IndividualForm", (req, res) => {
    res.sendFile(path.join(__dirname, "IndividualForm.html"));
});



app.get("/BusinessForm", (req, res) => {
    res.sendFile(path.join(__dirname, "BusinessForm.html"));
});

app.get("/ChooseType", (req, res) => {
    res.sendFile(path.join(__dirname, "ChooseType.html"));
});

app.get("/AdminDashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "AdminDashboard.html"));
});

app.get("/AboutUs", (req, res) => {
    res.sendFile(path.join(__dirname, "AboutUs.html"));
});

const PAYMENT_METHODS = new Set(['Credit/Debit Card', 'Cash on Delivery']);

app.post('/api/orders', (req, res) => {
    const { orderType, trackingID, order, paymentMethod, amount } = req.body || {};

    if (!trackingID || !orderType || !order) {
        return res.status(400).send('Missing order data.');
    }

    if (!PAYMENT_METHODS.has(paymentMethod)) {
        return res.status(400).send('Unsupported payment method.');
    }

    const shipmentCost = order.shipmentCost || parseFloat(amount) || 0;

    if (orderType === 'individual') {
        const sender = order.sender || {};
        const receiver = order.receiver || {};
        const pkg = order.package || {};
        const route = order.route || {};

        const insertSql = `
            INSERT INTO IndividualOrders (
                TrackingID,
                SenderFirstName,
                SenderLastName,
                SenderPhone,
                SenderEmail,
                ReceiverFirstName,
                ReceiverLastName,
                ReceiverPhone,
                ReceiverEmail,
                ReceiverAddress1,
                ReceiverAddress2,
                ReceiverAddress3,
                Height,
                Length,
                Width,
                Weight,
                Origin,
                Destination,
                ShippingMethod,
                ShipmentCost,
                PaymentMethod
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            trackingID,
            sender.firstName || null,
            sender.lastName || null,
            sender.phone || null,
            sender.email || null,
            receiver.firstName || null,
            receiver.lastName || null,
            receiver.phone || null,
            receiver.email || null,
            receiver.address1 || null,
            receiver.address2 || null,
            receiver.address3 || null,
            pkg.height || null,
            pkg.length || null,
            pkg.width || null,
            pkg.weight || null,
            route.origin || null,
            route.destination || null,
            route.shippingMethod || null,
            shipmentCost,
            paymentMethod
        ];

        con.query(insertSql, values, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Failed to save individual order.');
            }
            res.status(201).json({ trackingID });
        });
    } else if (orderType === 'business') {
        const business = order.business || {};
        const sender = order.sender || {};
        const receiver = order.receiver || {};
        const pkg = order.package || {};
        const route = order.route || {};

        const insertSql = `
            INSERT INTO BusinessOrders (
                TrackingID,
                BusinessName,
                BusinessRegistration,
                SenderPhone,
                SenderEmail,
                ReceiverFirstName,
                ReceiverLastName,
                ReceiverPhone,
                ReceiverEmail,
                ReceiverAddress1,
                ReceiverAddress2,
                ReceiverAddress3,
                Height,
                Length,
                Width,
                Weight,
                Origin,
                Destination,
                ShippingMethod,
                ShipmentCost,
                PaymentMethod
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            trackingID,
            business.name || null,
            business.registration || null,
            sender.phone || null,
            sender.email || null,
            receiver.firstName || null,
            receiver.lastName || null,
            receiver.phone || null,
            receiver.email || null,
            receiver.address1 || null,
            receiver.address2 || null,
            receiver.address3 || null,
            pkg.height || null,
            pkg.length || null,
            pkg.width || null,
            pkg.weight || null,
            route.origin || null,
            route.destination || null,
            route.shippingMethod || null,
            shipmentCost,
            paymentMethod
        ];

        con.query(insertSql, values, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Failed to save business order.');
            }
            res.status(201).json({ trackingID });
        });
    } else {
        res.status(400).send('Unknown order type.');
    }
});

app.get('/api/orders', (req, res) => {
    const { type } = req.query || {};
    const normalizedType = (type || '').toLowerCase();

    let query = '';

    if (normalizedType === 'individual') {
        query = `
            SELECT 
                'individual' AS orderType,
                TrackingID AS trackingID,
                CONCAT_WS(' ', SenderFirstName, SenderLastName) AS senderName,
                CONCAT_WS(' ', ReceiverFirstName, ReceiverLastName) AS receiverName,
                NULL AS businessName,
                Origin AS origin,
                Destination AS destination,
                ShippingMethod AS shippingMethod,
                Weight AS weight,
                ShipmentCost AS shipmentCost,
                PaymentMethod AS paymentMethod,
                OrderDate AS orderDate
            FROM IndividualOrders
            ORDER BY OrderDate DESC
        `;
    } else if (normalizedType === 'business') {
        query = `
            SELECT 
                'business' AS orderType,
                TrackingID AS trackingID,
                BusinessName AS senderName,
                CONCAT_WS(' ', ReceiverFirstName, ReceiverLastName) AS receiverName,
                BusinessName AS businessName,
                Origin AS origin,
                Destination AS destination,
                ShippingMethod AS shippingMethod,
                Weight AS weight,
                ShipmentCost AS shipmentCost,
                PaymentMethod AS paymentMethod,
                OrderDate AS orderDate
            FROM BusinessOrders
            ORDER BY OrderDate DESC
        `;
    } else {
        query = `
            SELECT *
            FROM (
                SELECT 
                    'individual' AS orderType,
                    TrackingID AS trackingID,
                    CONCAT_WS(' ', SenderFirstName, SenderLastName) AS senderName,
                    CONCAT_WS(' ', ReceiverFirstName, ReceiverLastName) AS receiverName,
                    NULL AS businessName,
                    Origin AS origin,
                    Destination AS destination,
                    ShippingMethod AS shippingMethod,
                    Weight AS weight,
                    ShipmentCost AS shipmentCost,
                    PaymentMethod AS paymentMethod,
                    OrderDate AS orderDate
                FROM IndividualOrders
                UNION ALL
                SELECT 
                    'business' AS orderType,
                    TrackingID AS trackingID,
                    BusinessName AS senderName,
                    CONCAT_WS(' ', ReceiverFirstName, ReceiverLastName) AS receiverName,
                    BusinessName AS businessName,
                    Origin AS origin,
                    Destination AS destination,
                    ShippingMethod AS shippingMethod,
                    Weight AS weight,
                    ShipmentCost AS shipmentCost,
                    PaymentMethod AS paymentMethod,
                    OrderDate AS orderDate
                FROM BusinessOrders
            ) AS combined
            ORDER BY combined.orderDate DESC
        `;
    }

    con.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Failed to fetch orders.');
        }

        const serialized = results.map(row => ({
            orderType: row.orderType,
            trackingID: row.trackingID,
            senderName: row.senderName || null,
            receiverName: row.receiverName || null,
            businessName: row.businessName || null,
            origin: row.origin || null,
            destination: row.destination || null,
            shippingMethod: row.shippingMethod || null,
            weight: row.weight != null ? Number(row.weight) : null,
            shipmentCost: row.shipmentCost != null ? Number(row.shipmentCost) : null,
            paymentMethod: row.paymentMethod || null,
            orderDate: row.orderDate
        }));

        res.json(serialized);
    });
});

app.get('/api/orders/:trackingID', (req, res) => {
    const trackingID = req.params.trackingID;

    if (!trackingID) {
        return res.status(400).send('Tracking ID is required.');
    }

    const individualQuery = `
        SELECT 
            TrackingID,
            SenderFirstName,
            SenderLastName,
            SenderPhone,
            SenderEmail,
            ReceiverFirstName,
            ReceiverLastName,
            ReceiverPhone,
            ReceiverEmail,
            ReceiverAddress1,
            ReceiverAddress2,
            ReceiverAddress3,
            Height,
            Length,
            Width,
            Weight,
            Origin,
            Destination,
            ShippingMethod,
            ShipmentCost,
            PaymentMethod,
            OrderDate
        FROM IndividualOrders
        WHERE TrackingID = ?
        LIMIT 1
    `;

    con.query(individualQuery, [trackingID], (indErr, indResults) => {
        if (indErr) {
            console.error(indErr);
            return res.status(500).send('Failed to fetch order.');
        }

        if (indResults.length > 0) {
            const order = indResults[0];
            return res.json({
                orderType: 'individual',
                trackingID: order.TrackingID,
                sender: {
                    firstName: order.SenderFirstName,
                    lastName: order.SenderLastName,
                    phone: order.SenderPhone,
                    email: order.SenderEmail
                },
                receiver: {
                    firstName: order.ReceiverFirstName,
                    lastName: order.ReceiverLastName,
                    phone: order.ReceiverPhone,
                    email: order.ReceiverEmail,
                    address1: order.ReceiverAddress1,
                    address2: order.ReceiverAddress2,
                    address3: order.ReceiverAddress3
                },
                route: {
                    origin: order.Origin,
                    destination: order.Destination,
                    shippingMethod: order.ShippingMethod
                },
                package: {
                    height: order.Height,
                    length: order.Length,
                    width: order.Width,
                    weight: order.Weight
                },
                shipmentCost: order.ShipmentCost,
                paymentMethod: order.PaymentMethod,
                orderDate: order.OrderDate
            });
        }

        const businessQuery = `
            SELECT 
                TrackingID,
                BusinessName,
                BusinessRegistration,
                SenderPhone,
                SenderEmail,
                ReceiverFirstName,
                ReceiverLastName,
                ReceiverPhone,
                ReceiverEmail,
                ReceiverAddress1,
                ReceiverAddress2,
                ReceiverAddress3,
                Height,
                Length,
                Width,
                Weight,
                Origin,
                Destination,
                ShippingMethod,
                ShipmentCost,
                PaymentMethod,
                OrderDate
            FROM BusinessOrders
            WHERE TrackingID = ?
            LIMIT 1
        `;

        con.query(businessQuery, [trackingID], (bizErr, bizResults) => {
            if (bizErr) {
                console.error(bizErr);
                return res.status(500).send('Failed to fetch order.');
            }

            if (bizResults.length > 0) {
                const order = bizResults[0];
                return res.json({
                    orderType: 'business',
                    trackingID: order.TrackingID,
                    business: {
                        name: order.BusinessName,
                        registration: order.BusinessRegistration
                    },
                    sender: {
                        phone: order.SenderPhone,
                        email: order.SenderEmail
                    },
                    receiver: {
                        firstName: order.ReceiverFirstName,
                        lastName: order.ReceiverLastName,
                        phone: order.ReceiverPhone,
                        email: order.ReceiverEmail,
                        address1: order.ReceiverAddress1,
                        address2: order.ReceiverAddress2,
                        address3: order.ReceiverAddress3
                    },
                    route: {
                        origin: order.Origin,
                        destination: order.Destination,
                        shippingMethod: order.ShippingMethod
                    },
                    package: {
                        height: order.Height,
                        length: order.Length,
                        width: order.Width,
                        weight: order.Weight
                    },
                    shipmentCost: order.ShipmentCost,
                    paymentMethod: order.PaymentMethod,
                    orderDate: order.OrderDate
                });
            }

            res.status(404).send('Order not found.');
        });
    });
});

app.listen(port, function() {
    console.log("http://localhost:8080");
});
