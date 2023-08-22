import * as fs from "firebase-admin";
import * as logger from "firebase-functions/logger";
import * as express from "express";
import * as functions from "firebase-functions";
import cors = require("cors");
import serviceAccount = require("./sdk.json");

fs.initializeApp({
  credential: fs.credential.cert(serviceAccount as any),
});

const app = express();

// Automatically allow cross-origin requests
app.use(cors({origin: true}));

const db = fs.firestore();

app.get("/", (req, res) => res.status(200).send("Hey there!"));

app.post("/tab/:tabId", async (req, res) => {
  try {
    const {
      params: {tabId},
      body: {value},
    } = req;

    const parsedValue = parseInt(value);

    if (!tabId) {
      throw Error("Missing tabId value");
    }

    if (typeof parsedValue !== "number") {
      throw Error("Value should be a number and must at least insert 0");
    }

    await db.collection("tab").doc(tabId).update({
      value: parsedValue,
    });

    const docRef = db.collection("tab").doc(tabId);
    const doc = await docRef.get();

    res.status(201).json({
      data: {
        tabId,
        response: {
          value: doc.data()?.value,
        },
      },
    });
  } catch (error) {
    logger.error(`error occurred updating value of tab ${error}`);
    const errorMessage = (error as any)?.message || "";
    res.status(500).json({
      message: `error occurred updating value of tab. ${errorMessage}`,
      error,
    });
  }
});

app.get("/tab/:tabId", async (req, res) => {
  try {
    const {
      params: {tabId},
    } = req;
    if (!tabId) {
      throw new Error("Missing tabId value");
    }

    const docRef = db.collection("tab").doc(tabId);

    const doc = await docRef.get();

    if (!doc.exists) {
      throw Error(`${tabId} does not exist`);
    }

    res.status(200).json({
      data: {
        tabId,
        value: doc?.data()?.value || 0,
      },
    });
  } catch (error) {
    logger.error(`error occurred fetching tab ${error}`);
    const errorMessage = (error as any)?.message || "";
    res.status(500).json({
      message: `error occurred fetching tab value. ${errorMessage}`,
      error: error,
    });
  }
});

app.get("/sum", async (req, res) => {
  try {
    const docRef = db.collection("tab");
    const snapshot = await docRef.get();

    let sum = 0;

    snapshot.forEach((doc) => {
      sum = sum + (doc?.data()?.value || 0);
    });

    res.status(200).json({
      data: {
        sum: sum,
      },
    });
  } catch (error) {
    logger.error(`error occurred fetching sum of tabs ${error}`);
    res.status(500).json({
      message: "error occurred fetching sum of tabs value",
      error: error,
    });
  }
});

exports.app = functions.https.onRequest(app);
