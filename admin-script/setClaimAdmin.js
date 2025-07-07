const admin = require("firebase-admin");

// Replace the path below with the path to the serviceAccountKey.json file you downloaded
const serviceAccount = require("./serviceAccountKey.json");

// Replace with the UID of the user you want to make admin
const uid = "niw3E6twanbnv2HS4p1rfH2hK2Z2";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

admin.auth().setCustomUserClaims(uid, { role: "admin" })
  .then(() => {
    console.log(`Custom claim 'admin' successfully set for user ${uid}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to set custom claim:", error);
    process.exit(1);
  });