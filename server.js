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

const SESSION_MAX_AGE = 24 * 60 * 60 * 1000;
const ADMIN_CREDENTIALS = { email: 'admin', password: 'admin', name: 'Admin' };

function setSessionCookies(res, { role, name, userId }) {
    const options = { maxAge: SESSION_MAX_AGE };
    if (role) {
        res.cookie('userRole', role, options);
    }
    if (name) {
        res.cookie('userName', name, options);
    }
    if (userId) {
        res.cookie('userId', userId, options);
    } else {
        res.clearCookie('userId');
    }
}

function clearSessionCookies(res) {
    res.clearCookie('userRole');
    res.clearCookie('userName');
    res.clearCookie('userId');
}

function getSession(req) {
    const { userRole, userName, userId } = req.cookies || {};
    if (!userRole) {
        return { authenticated: false };
    }
    return {
        authenticated: true,
        role: userRole,
        name: userName || null,
        userId: userId || null
    };
}

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "home.html"));
  });

app.get("/SignIn", (req, res) => {
    res.sendFile(path.join(__dirname, "signIn.html"));
});

app.post("/SignIn", (req, res) => {
    const { email, password } = req.body || {};
    const expectsJson =
        req.xhr ||
        (req.headers.accept && req.headers.accept.includes("application/json")) ||
        (req.headers['content-type'] && req.headers['content-type'].includes("application/json"));

    if (!email || !password) {
        const message = "Email and password are required.";
        return expectsJson
            ? res.status(400).json({ success: false, message })
            : res.status(400).send(message);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const isAdminLogin =
        (normalizedEmail === ADMIN_CREDENTIALS.email || normalizedEmail === 'admin@ShipMe.com') &&
        password === ADMIN_CREDENTIALS.password;

    if (isAdminLogin) {
        setSessionCookies(res, { role: 'admin', name: ADMIN_CREDENTIALS.name });
        if (expectsJson) {
            return res.json({ success: true, redirect: '/AdminDashboard' });
        }
        return res.redirect('/AdminDashboard');
    }

    const sql = "SELECT UserID, FirstName, LastName, Email FROM Users WHERE LOWER(Email) = ? AND Password = ?";
    con.query(sql, [normalizedEmail, password], (err, results) => {
        if (err) {
            console.error(err);
            const message = "Unable to sign in right now.";
            return expectsJson
                ? res.status(500).json({ success: false, message })
                : res.status(500).send(message);
        }

        if (results.length > 0) {
            const user = results[0];
            setSessionCookies(res, { role: 'user', name: user.FirstName, userId: user.UserID });
            if (expectsJson) {
                return res.json({ success: true, redirect: '/' });
            }
            return res.redirect('/');
        }

        const message = "Invalid email or password.";
        return expectsJson
            ? res.status(401).json({ success: false, message })
            : res.status(401).send(message);
    });
});

app.get("/SignUp", (req, res) => {
    res.sendFile(path.join(__dirname, "signUp.html"));
});

app.post("/SignUp", (req, res) => {
    const { firstName, lastName, email, phone, password } = req.body || {};

    if (!firstName || !lastName || !email || !phone || !password) {
        return res.status(400).send("All fields are required.");
    }

    const sql = "INSERT INTO Users (FirstName, LastName, Email, PhoneNumber, Password) VALUES (?, ?, ?, ?, ?)";
    con.query(sql, [firstName, lastName, email, phone, password], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error registering user");
      }

      setSessionCookies(res, { role: 'user', name: firstName, userId: result.insertId });
      res.redirect('/');
    });
});

app.post("/Logout", (req, res) => {
    clearSessionCookies(res);
    res.redirect('/');
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
    const session = getSession(req);
    if (!session.authenticated || session.role !== 'admin') {
        return res.redirect('/SignIn');
    }
    res.sendFile(path.join(__dirname, "AdminDashboard.html"));
});

app.get("/Account", (req, res) => {
    const session = getSession(req);
    if (!session.authenticated || session.role !== 'user') {
        return res.redirect('/SignIn');
    }
    res.sendFile(path.join(__dirname, "Account.html"));
});

app.get("/Orders", (req, res) => {
    const session = getSession(req);
    if (!session.authenticated || session.role !== 'user') {
        return res.redirect('/SignIn');
    }
    res.sendFile(path.join(__dirname, "Orders.html"));
});

app.get("/AboutUs", (req, res) => {
    res.sendFile(path.join(__dirname, "AboutUs.html"));
});

const PAYMENT_METHODS = new Set(['Credit/Debit Card', 'Cash on Delivery']);

app.get('/api/session', (req, res) => {
    res.json(getSession(req));
});

app.get('/api/me', (req, res) => {
    const session = getSession(req);
    if (!session.authenticated) {
        return res.status(401).send('Not signed in.');
    }

    if (session.role === 'admin') {
        return res.json({
            role: 'admin',
            name: ADMIN_CREDENTIALS.name,
            email: 'admin@shipme.com'
        });
    }

    if (!session.userId) {
        return res.status(401).send('User session expired.');
    }

    const sql = `
        SELECT UserID, FirstName, LastName, Email, PhoneNumber
        FROM Users
        WHERE UserID = ?
        LIMIT 1
    `;

    con.query(sql, [session.userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Failed to load profile.');
        }

        if (!results.length) {
            clearSessionCookies(res);
            return res.status(404).send('User not found.');
        }

        const user = results[0];
        res.json({
            role: 'user',
            id: user.UserID,
            firstName: user.FirstName,
            lastName: user.LastName,
            email: user.Email,
            phone: user.PhoneNumber
        });
    });
});

app.get('/api/my/orders', (req, res) => {
    const session = getSession(req);
    if (!session.authenticated || session.role !== 'user' || !session.userId) {
        return res.status(401).send('Please sign in.');
    }

    const userId = session.userId;

    const sql = `
        SELECT 
            io.TrackingID AS trackingID,
            'individual' AS orderType,
            io.Origin AS origin,
            io.Destination AS destination,
            io.ShippingMethod AS shippingMethod,
            io.Weight AS weight,
            io.ShipmentCost AS shipmentCost,
            io.PaymentMethod AS paymentMethod,
            io.OrderStatus AS status,
            io.OrderDate AS orderDate
        FROM IndividualOrders io
        WHERE io.UserID = ?
        UNION ALL
        SELECT 
            bo.TrackingID AS trackingID,
            'business' AS orderType,
            bo.Origin AS origin,
            bo.Destination AS destination,
            bo.ShippingMethod AS shippingMethod,
            bo.Weight AS weight,
            bo.ShipmentCost AS shipmentCost,
            bo.PaymentMethod AS paymentMethod,
            bo.OrderStatus AS status,
            bo.OrderDate AS orderDate
        FROM BusinessOrders bo
        WHERE bo.UserID = ?
        ORDER BY orderDate DESC
    `;

    con.query(sql, [userId, userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err.sqlMessage || 'Failed to load orders.');
        }

        res.json(results.map((row, index) => ({
            id: `${row.orderType}-${index}`,
            trackingID: row.trackingID,
            orderType: row.orderType,
            origin: row.origin,
            destination: row.destination,
            shippingMethod: row.shippingMethod,
            weight: row.weight,
            shipmentCost: row.shipmentCost,
            paymentMethod: row.paymentMethod,
            status: row.status,
            orderDate: row.orderDate
        })));
    });
});

app.post('/api/orders/:trackingID/cancel', (req, res) => {
    const session = getSession(req);
    if (!session.authenticated || session.role !== 'user' || !session.userId) {
        return res.status(401).send('Please sign in.');
    }

    const { trackingID } = req.params;
    if (!trackingID) {
        return res.status(400).send('Tracking ID is required.');
    }

    const updateIndividual = `
        UPDATE IndividualOrders
        SET OrderStatus = 'Cancelled'
        WHERE TrackingID = ? AND UserID = ? AND OrderStatus IN ('Pending', 'In-Transit')
    `;

    con.query(updateIndividual, [trackingID, session.userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Unable to cancel order.');
        }

        if (result.affectedRows > 0) {
            return res.json({ trackingID, status: 'Cancelled' });
        }

        const updateBusiness = `
            UPDATE BusinessOrders
            SET OrderStatus = 'Cancelled'
            WHERE TrackingID = ? AND UserID = ? AND OrderStatus IN ('Pending', 'In-Transit')
        `;

        con.query(updateBusiness, [trackingID, session.userId], (bizErr, bizResult) => {
            if (bizErr) {
                console.error(bizErr);
                return res.status(500).send('Unable to cancel order.');
            }

            if (bizResult.affectedRows > 0) {
                return res.json({ trackingID, status: 'Cancelled' });
            }

            res.status(404).send('Order not found or cannot be cancelled.');
        });
    });
});

app.post('/api/orders', (req, res) => {
    const { orderType, trackingID, order, paymentMethod, amount } = req.body || {};
    const session = getSession(req);

    if (!trackingID || !orderType || !order) {
        return res.status(400).send('Missing order data.');
    }

    if (!PAYMENT_METHODS.has(paymentMethod)) {
        return res.status(400).send('Unsupported payment method.');
    }

    const shipmentCost = order.shipmentCost || parseFloat(amount) || 0;
    const sessionUserId = session.role === 'user' ? session.userId : null;
    const userId = order.userId || sessionUserId || null;
    const status = order.status || 'Pending';

    if (orderType === 'individual') {
        const sender = order.sender || {};
        const receiver = order.receiver || {};
        const pkg = order.package || {};
        const route = order.route || {};

        const insertSql = `
            INSERT INTO IndividualOrders (
                TrackingID,
                UserID,
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
                OrderStatus
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            trackingID,
            userId,
            sender.firstName,
            sender.lastName,
            sender.phone,
            sender.email,
            receiver.firstName,
            receiver.lastName,
            receiver.phone,
            receiver.email,
            receiver.address1,
            receiver.address2,
            receiver.address3,
            pkg.height,
            pkg.length,
            pkg.width,
            pkg.weight,
            route.origin,
            route.destination,
            route.shippingMethod,
            shipmentCost,
            paymentMethod,
            status
        ];

        con.query(insertSql, values, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send(err.sqlMessage || 'Failed to save individual order.');
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
                UserID,
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
                OrderStatus
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            trackingID,
            userId,
            business.name,
            business.registration,
            sender.phone,
            sender.email,
            receiver.firstName,
            receiver.lastName,
            receiver.phone,
            receiver.email,
            receiver.address1,
            receiver.address2,
            receiver.address3,
            pkg.height,
            pkg.length,
            pkg.width,
            pkg.weight,
            route.origin,
            route.destination,
            route.shippingMethod,
            shipmentCost,
            paymentMethod,
            status
        ];

        con.query(insertSql, values, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send(err.sqlMessage || 'Failed to save business order.');
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
                OrderStatus AS status,
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
                OrderStatus AS status,
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
                    OrderStatus AS status,
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
                    OrderStatus AS status,
                    OrderDate AS orderDate
                FROM BusinessOrders
            ) AS combined
            ORDER BY combined.orderDate DESC
        `;
    }

    con.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err.sqlMessage || 'Failed to fetch orders.');
        }

        const serialized = results.map(row => ({
            orderType: row.orderType,
            trackingID: row.trackingID,
            senderName: row.senderName,
            receiverName: row.receiverName,
            businessName: row.businessName,
            origin: row.origin,
            destination: row.destination,
            shippingMethod: row.shippingMethod,
            weight: row.weight != null ? Number(row.weight) : null,
            shipmentCost: row.shipmentCost != null ? Number(row.shipmentCost) : null,
            paymentMethod: row.paymentMethod,
            status: row.status,
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
            OrderStatus,
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
                status: order.OrderStatus,
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
                OrderStatus,
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
                    status: order.OrderStatus,
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
