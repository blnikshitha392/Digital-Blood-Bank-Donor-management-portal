const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
require("dotenv").config();
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Blood Bank Management System API",
            version: "1.0.0",
            description: "Backend API for AI-Enabled Digital Blood Bank and Donor Management Portal"
        },
        servers: [
            {
                url: "http://localhost:5000"
            }
        ]
    },
    apis: ["./server.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

app.get("/", (req, res) => {
    res.send("Blood Bank Backend is running!");
});

app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({
            message: "PostgreSQL connected successfully!",
            time: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

/**
 * @swagger
 * /api/donors:
 *   get:
 *     summary: Get all donors
 *     description: Fetch all registered blood donors from PostgreSQL
 *     tags:
 *       - Donors
 *     responses:
 *       200:
 *         description: List of all donors
 *       500:
 *         description: Database error
 */
// Get all donors
app.get("/api/donors", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM donors ORDER BY donor_id");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching donors" });
    }
});
/**
 * @swagger
 * /api/donors:
 *   post:
 *     summary: Add a new donor
 *     description: Register a new blood donor in PostgreSQL
 *     tags:
 *       - Donors
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - bloodGroup
 *               - age
 *             properties:
 *               name:
 *                 type: string
 *                 example: Priya Sharma
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               email:
 *                 type: string
 *                 example: priya@gmail.com
 *               bloodGroup:
 *                 type: string
 *                 example: O+
 *               age:
 *                 type: integer
 *                 example: 21
 *               city:
 *                 type: string
 *                 example: Hyderabad
 *     responses:
 *       201:
 *         description: Donor added successfully
 *       500:
 *         description: Database error
 */
// Add a donor
app.post("/api/donors", async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            bloodGroup,
            age,
            city
        } = req.body;

        const result = await pool.query(
            `INSERT INTO donors
            (name, phone, email, blood_group, age, city)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [name, phone, email, bloodGroup, age, city]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error adding donor",
            error: error.message
        });
    }
});
/**
 * @swagger
 * /api/screening:
 *   get:
 *     summary: Get all blood screening records
 *     description: Fetch screening records from PostgreSQL
 *     tags:
 *       - Blood Screening
 *     responses:
 *       200:
 *         description: List of screening records
 *       500:
 *         description: Database error
 */

// Get all screening records
app.get("/api/screening", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                bs.screening_id,
                bs.donor_id,
                d.name AS donor_name,
                bs.hiv_result,
                bs.hepatitis_result,
                bs.malaria_result,
                bs.screening_status,
                bs.screening_date
            FROM blood_screening bs
            JOIN donors d ON bs.donor_id = d.donor_id
            ORDER BY bs.screening_id
        `);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error fetching screening records"
        });
    }
});

/**
 * @swagger
 * /api/screening:
 *   post:
 *     summary: Add a blood screening record
 *     description: Store donor screening results in PostgreSQL
 *     tags:
 *       - Blood Screening
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - donorId
 *               - hivResult
 *               - hepatitisResult
 *               - malariaResult
 *             properties:
 *               donorId:
 *                 type: integer
 *                 example: 1
 *               hivResult:
 *                 type: string
 *                 example: Negative
 *               hepatitisResult:
 *                 type: string
 *                 example: Negative
 *               malariaResult:
 *                 type: string
 *                 example: Negative
 *               screeningStatus:
 *                 type: string
 *                 example: Safe
 *     responses:
 *       201:
 *         description: Screening record added successfully
 *       500:
 *         description: Database error
 */
// Add screening record
app.post("/api/screening", async (req, res) => {
    try {
        const {
            donorId,
            hivResult,
            hepatitisResult,
            malariaResult,
            screeningStatus
        } = req.body;

        const result = await pool.query(
            `INSERT INTO blood_screening
            (donor_id, hiv_result, hepatitis_result, malaria_result, screening_status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                donorId,
                hivResult,
                hepatitisResult,
                malariaResult,
                screeningStatus
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error adding screening record",
            error: error.message
        });
    }
});

// ===============================
// BLOOD INVENTORY
// ===============================
/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get blood inventory
 *     description: Fetch all blood inventory records from PostgreSQL
 *     tags:
 *       - Blood Inventory
 *     responses:
 *       200:
 *         description: List of blood inventory records
 *       500:
 *         description: Database error
 */
// Get all inventory records
app.get("/api/inventory", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM blood_inventory ORDER BY inventory_id"
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error fetching inventory"
        });
    }
});

/**
 * @swagger
 * /api/inventory:
 *   post:
 *     summary: Add blood inventory
 *     description: Add a blood unit record to PostgreSQL
 *     tags:
 *       - Blood Inventory
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bloodGroup
 *               - quantity
 *               - bloodBank
 *               - expiryDate
 *             properties:
 *               bloodGroup:
 *                 type: string
 *                 example: O+
 *               quantity:
 *                 type: integer
 *                 example: 5
 *               bloodBank:
 *                 type: string
 *                 example: Hyderabad Blood Bank
 *               expiryDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-10-15
 *     responses:
 *       201:
 *         description: Inventory added successfully
 *       500:
 *         description: Database error
 */
// Add new inventory record
app.post("/api/inventory", async (req, res) => {
    try {
        const {
            bloodGroup,
            quantity,
            bloodBank,
            expiryDate
        } = req.body;

        const result = await pool.query(
            `INSERT INTO blood_inventory
            (blood_group, quantity, blood_bank, expiry_date)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                bloodGroup,
                quantity,
                bloodBank,
                expiryDate
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error adding inventory",
            error: error.message
        });
    }
});
// =========================
// BLOOD REQUEST API
// =========================
/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: Get all blood requests
 *     description: Fetch all hospital blood requests from PostgreSQL
 *     tags:
 *       - Blood Requests
 *     responses:
 *       200:
 *         description: List of blood requests
 *       500:
 *         description: Database error
 */
app.get("/api/requests", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM blood_requests
            ORDER BY request_id
        `);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error fetching blood requests"
        });
    }
});

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Create a blood request
 *     description: Store a hospital blood request in PostgreSQL
 *     tags:
 *       - Blood Requests
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hospitalName
 *               - bloodGroup
 *               - quantityRequired
 *             properties:
 *               hospitalName:
 *                 type: string
 *                 example: Apollo Hospital
 *               contactNumber:
 *                 type: string
 *                 example: "9876543210"
 *               bloodGroup:
 *                 type: string
 *                 example: O+
 *               quantityRequired:
 *                 type: integer
 *                 example: 3
 *               urgency:
 *                 type: string
 *                 example: Urgent
 *     responses:
 *       201:
 *         description: Blood request created successfully
 *       500:
 *         description: Database error
 */
app.post("/api/requests", async (req, res) => {
    try {
        const {
            hospitalName,
            contactNumber,
            bloodGroup,
            quantityRequired,
            urgency
        } = req.body;

        const result = await pool.query(
            `INSERT INTO blood_requests
            (hospital_name, contact_number, blood_group,
             quantity_required, urgency, request_date, status)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, 'Pending')
            RETURNING *`,
            [
                hospitalName,
                contactNumber,
                bloodGroup,
                quantityRequired,
                urgency
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error adding blood request",
            error: error.message
        });
    }
});
// ==========================================
// AI / ML BLOOD DEMAND PREDICTION
// ==========================================

/**
 * @swagger
 * /api/predict-demand:
 *   post:
 *     summary: Predict blood demand
 *     description: Predict expected blood demand using the trained ML model
 *     tags:
 *       - AI Demand Prediction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - blood_group
 *               - date
 *             properties:
 *               blood_group:
 *                 type: string
 *                 example: O+
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-10-05
 *     responses:
 *       200:
 *         description: Blood demand prediction generated successfully
 *       400:
 *         description: Blood group or date missing
 *       500:
 *         description: Prediction service unavailable
 */

app.post("/api/predict-demand", async (req, res) => {

    try {

        const { blood_group, date } = req.body;

        if (!blood_group || !date) {

            return res.status(400).json({
                message: "Blood group and date are required"
            });

        }

        const response = await axios.post(
            "http://localhost:5001/predict",
            {
                blood_group: blood_group,
                date: date
            }
        );

        res.json(response.data);

    } catch (error) {

        console.error(
            "Prediction error:",
            error.message
        );

        res.status(500).json({
            message: "Prediction service unavailable",
            error: error.message
        });

    }

});
// ==========================================
// NOTIFICATIONS API
// ==========================================

app.get("/api/notifications", async (req, res) => {
    try {
        const notifications = [];

        // LOW INVENTORY
        const inventoryResult = await pool.query(`
            SELECT *
            FROM blood_inventory
            WHERE quantity <= 5
            ORDER BY quantity ASC
        `);

        inventoryResult.rows.forEach(item => {
            notifications.push({
                title: "Low Blood Stock",
                message: `${item.blood_group} has only ${item.quantity} units available at ${item.blood_bank}.`,
                notification_type: "Inventory Alert"
            });
        });

        // BLOOD REQUESTS
        const requestResult = await pool.query(`
            SELECT *
            FROM blood_requests
            WHERE status = 'Pending'
            ORDER BY request_id DESC
        `);

        requestResult.rows.forEach(request => {
            notifications.push({
                title: "Blood Request",
                message: `${request.hospital_name} requested ${request.quantity_required} units of ${request.blood_group}.`,
                notification_type: request.urgency || "Request"
            });
        });

        // NEW DONORS
        const donorResult = await pool.query(`
            SELECT *
            FROM donors
            ORDER BY donor_id DESC
            LIMIT 5
        `);

        donorResult.rows.forEach(donor => {
            notifications.push({
                title: "New Donor Registered",
                message: `${donor.name} registered as a ${donor.blood_group} blood donor.`,
                notification_type: "Donor"
            });
        });

        res.json(notifications);

    } catch (error) {
        console.error("Notification error:", error);

        res.status(500).json({
            message: "Error loading notifications",
            error: error.message
        });
    }
});
app.listen(5000, () => {
    console.log("Server running on port 5000");
    console.log("Swagger UI: http://localhost:5000/api-docs");
});