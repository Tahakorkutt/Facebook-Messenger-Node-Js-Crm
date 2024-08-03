const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");
const request = require("request");
const axios = require("axios");
const sqlite3 = require('sqlite3').verbose();

const cors = require("cors");
const app = express();
const env = require("dotenv").config();

// var OAuth2 = require('oauth2').OAuth2;

app.use(cors()); // CORS middleware burada kullanılıyor
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



app.use(express.json());

// messenger

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;


let db = new sqlite3.Database('face_getMessage.db');


async function getUserProfile(sender_psid) { // gelen mesajları çekme kodu başlangıcı

  try {
    const response = await axios.get(
      `https://graph.facebook.com/${sender_psid}?fields=first_name,last_name,profile_pic&access_token=${PAGE_ACCESS_TOKEN}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

// const db = new sqlite3.Database('face_getMessage.db', (err) => {
//   if (err) {
//     console.error('Veritabanına bağlanırken hata oluştu:', err.message);
//   } else {
//     console.log('Veritabanına başarıyla bağlandı');
//     // Veritabanında tablo oluştur
//     db.run(`CREATE TABLE IF NOT EXISTS messages (
//       id INTEGER PRIMARY KEY,
//       userID TEXT,
//       message_timestamp INTEGER,
//       username TEXT,
//       profile_pic TEXT,
//       sender_psid TEXT,
//       message_id TEXT,
//       type TEXT,
//       content TEXT,
//       message_date TEXT
//     )`, (err) => {
//       if (err) {
//         console.error('Tablo oluşturulurken hata oluştu:', err.message);
//       } else {
//         console.log('Tablo başarıyla oluşturuldu');
//       }
//     });
//   }
// });

// Mesajları veritabanına ekleme fonksiyonu
function addMessageToDatabase(messageObject) {  
  const sqlCheck = `SELECT COUNT(*) AS count FROM messages WHERE content = ?`;
  
  db.get(sqlCheck, [messageObject.content], (err, row) => {
    if (err) {
      console.error('Veritabanı sorgusu yapılırken hata oluştu:', err.message);
    } else {
      if (row.count === 0) { // Aynı content içeriğine sahip kayıt yoksa
        const sql = `INSERT INTO messages (
          userID,
          message_timestamp,
          username,
          profile_pic,
          sender_psid,
          message_id,
          type,
          content,
          message_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
          messageObject.userID,
          messageObject.message_timestamp,
          messageObject.username,
          messageObject.profile_pic,
          messageObject["Sender PSID"],
          messageObject.message_id,
          messageObject.type,
          messageObject.content,
          messageObject.message_date
        ];

        db.run(sql, params, function(err) {
          if (err) {
            console.error('Mesajı veritabanına eklerken hata oluştu:', err.message);
          } else {
            console.log('Row inserted');
          }
        });
      } else {
        console.log('Bu içerik zaten veritabanında kayıtlı');
      }
    }
  });
}



// Mesajları işleme
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    for (const entry of body.entry) {
      const webhookEvent = entry.messaging[0];

      if (webhookEvent.message) {
        const sender_psid = webhookEvent.sender.id;
        const userProfile = await getUserProfile(sender_psid);
        const username = userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : "Unknown";
        const profile_pic = userProfile ? userProfile.profile_pic : null;
        const message_id = webhookEvent.message.mid || "Unknown";
        const message_timestamp = webhookEvent.timestamp;
        const sender_userID = webhookEvent.sender.id;

        const message_type = webhookEvent.message.hasOwnProperty("text")
          ? "text"
          : webhookEvent.message.attachments &&
            webhookEvent.message.attachments[0].type === "image"
          ? "image"
          : webhookEvent.message.attachments &&
            webhookEvent.message.attachments[0].type === "video"
          ? "video"
          : "Unknown";
        const content =
          message_type === "text"
            ? webhookEvent.message.text || "No text"
            : "Attachment";
        const message_date = new Date(webhookEvent.timestamp).toISOString();

        const messageObject = {
          userID: sender_userID,
          message_timestamp: webhookEvent.timestamp,
          username: username,
          profile_pic: profile_pic,
          "Sender PSID": sender_psid,
          message_id: message_id,
          type: message_type,
          content: content,
          message_date: message_date,
        };

        console.log(JSON.stringify(messageObject, null, 2));

        // Mesajı veritabanına ekle
        addMessageToDatabase(messageObject);

        // Otomatik yanıt işlevselliğini kaldırma
        let responseText = null;

        // Manuel yanıt gönderme işlevi
        if (responseText !== null) {
          await sendManualResponse(sender_psid, responseText);
        }

       
      }
    }
    
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});


const {postMessage}=require('./postMessage');
app.get('/postMessage', postMessage)

const {getListMessage}=require('./getListMessageApp');
app.get('/getListMessage', getListMessage)


const {getSendListAllMessage}=require('./getListMessageApp');
app.get('/getSendListAllMessage', getSendListAllMessage)



app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

async function sendManualResponse(sender_psid, message) {
  const response = {
    text: message,
  };
  await callSendAPI(sender_psid, response);
}
function callSendAPI(sender_psid, response) {
  const request_body = {
    recipient: {
      id: sender_psid,
    },
    message: response,
  };

  request(
    {
      uri: "https://graph.facebook.com/v13.0/me/messages",
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: "POST",
      json: request_body,
    },
    (err, res, body) => {
      if (!err) {
        console.log("Message sent successfully!");
        console.log("Sent message to PSID", sender_psid, ":", response);
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
  }


// gelen mesajları çekme kod bitişi


  
// veritabanı


// setInterval ile 10 saniyede bir kodu çalıştıralım
// intervalId = setInterval(() => {
//   db.all('SELECT * FROM messages', (err, rows) => {
//     if (err) {
//       console.error('Verileri alırken bir hata oluştu:', err.message);
//       // Intervalin durdurulması
//       clearInterval(intervalId);
//       return;
//     }
//     rows.forEach(row => {
//       console.log(row);
//     });
//   });
// }, 1000); // 10 saniye




// Interval süresince çalışacak middleware fonksiyonu
app.use((req, res, next) => {
  // 10 saniyede bir çalışacak olan kod
  next();
});







// const intervalId = setInterval(() => {
//   db.serialize(function() {
//     db.run("DELETE FROM messages", (err) => {
//       if (err) {
//         console.error('Verileri silerken bir hata oluştu:', err.message);
//         clearInterval(intervalId); // Intervalin durdurulması
//         return;
//       }
//       console.log('messages tablosundaki tüm veriler silindi.');
//     });
//   });
// }, 10000); // 10 saniye

// Interval süresince çalışacak middleware fonksiyonu
app.use((req, res, next) => {
  // 10 saniyede bir çalışacak olan kod
  next();
});



// Veritabanı bağlantısını kapat
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Veritabanı kapatılırken bir hata oluştu:', err.message);
      return;
    }
    console.log('Veritabanı başarıyla kapatıldı');
    process.exit(0); // İşlemi sonlandır
  });
});


// SQLite'den userID'yi almak için fonksiyon
function getUserIDFromDB() {
    return new Promise((resolve, reject) => {
        db.get("SELECT userID FROM messages LIMIT 1", (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row.userID);
            }
        });
    });
}











// Port tanımlaması
const port = process.env.PORT || 4000;

app.use(express.json());
app.use("/", (req, res, next) => {
  // Buraya isteği işleyen kodu ekleyebilirsiniz
  next();
});
app.get("/", (req, res) => {
  res.send("Hello World!");
});


const startServer = () => {
  try {
    // Connect to DB
    // connectDB();

    // Start & Listen to the requests
    app.listen(port, () => console.log(`Server started listening on ${port}`));
  } catch (error) {
    console.log(error);
  }
};

startServer();
