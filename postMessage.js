const sqlite3 = require('sqlite3').verbose(); // SQLite3 modülünü projeye dahil et
const axios = require('axios');


const sentMessageIDs = {}; // Gönderilen mesajların ID'lerini takip et sakla

const postMessage = async (req, res, next) => {
  const db = new sqlite3.Database('face_getMessage.db', async (err) => {
    if (err) {
      console.error('Veritabanına bağlanırken hata oluştu:', err.message);
      return;
    }

    console.log('Veritabanına başarıyla bağlandı.');

    // Mevcut tabloyu kontrol et
    const checkTableQuery = `SELECT name FROM sqlite_master WHERE type='table' AND name='postMessage'`;
    db.get(checkTableQuery, async (err, row) => {
      if (err) {
        console.error('Tablo kontrol edilirken bir hata oluştu:', err.message);
        return;
      }

      // Eğer tablo yoksa oluştur
      if (!row) {
        try {
          await db.run(`CREATE TABLE postMessage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            profile_pic TEXT,
            message_id TEXT,
            content TEXT,
            type TEXT,
            message_timestamp INTEGER,
            message_date TEXT,
            userID TEXT
          )`);
          console.log('postMessage tablosu başarıyla oluşturuldu');
        } catch (error) {
          console.error('Tablo oluşturulurken bir hata oluştu:', error);
        }
      } else {
        console.log('postMessage tablosu zaten mevcut');
      }
    });

    const query = `SELECT sender_psid, userID FROM messages`;
    db.all(query, async (err, rows) => {
      if (err) {
        console.error('PSID ve userID alınırken hata oluştu:', err.message);
        return;
      }

      for (const row of rows) {
        const recipientPSID = row.sender_psid;
        const userID = row.userID;

        const userProfileEndpoint = `https://graph.facebook.com/${userID}?fields=name,picture&access_token=${process.env.PAGE_ACCESS_TOKEN}`;

        try {
          const userDataResponse = await axios.get(userProfileEndpoint);
          const { name: username, picture: { data: { url: profile_pic } } } = userDataResponse.data;

          const apiEndpoint = `https://graph.facebook.com/v13.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`;
          const messageText = req.body.message;
          
          // Eğer daha önce aynı mesaj gönderilmediyse, bu mesajı gönder
          if (!sentMessageIDs[messageText]) {
            const messageData = {
              recipient: { id: recipientPSID },
              message: { text: messageText } // Kullanıcının gönderdiği metin buraya atanıyor
            };

            const messageResponse = await axios.post(apiEndpoint, messageData, {
              headers: { 'Content-Type': 'application/json' }
            });
            const messageResult = messageResponse.data;
            console.log('Mesaj başarıyla gönderildi:', messageResult);

            const timestamp = Date.now();
            const dateObj = new Date(timestamp);
            const formattedDate = dateObj.toISOString();
            const insertQuery = `INSERT INTO postMessage (username, profile_pic, message_id, content, type, message_timestamp, message_date, userID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            await db.run(insertQuery, [username, profile_pic, messageResult.message_id, messageText, 'text', timestamp, formattedDate, userID]);
            console.log('Mesaj başarıyla postMessage tablosuna eklendi');
            
            // Gönderilen mesajın ID'sini izleme listesine ekle
            sentMessageIDs[messageText] = true;

        
          } else {
            // console.log('Bu mesaj daha önce gönderilmiş.');
          }
        } catch (error) {
          console.error('Hata:', error);
        }
      }
    });
  });
}



// facebook mesaj gönderme test

// const testMessage = "kt";

// postMessage({
//   body: {
//     message: testMessage
//   }
// }, null, () => {}); // req, res, next parametreleri geçirilmemiş gibi davranıyoruz





const db = new sqlite3.Database('face_getMessage.db', (err) => {
  if (err) {
    console.error('Veritabanına bağlanırken hata oluştu:', err.message);
  } else {
    console.log('Veritabanına başarıyla bağlandı');

//     // setInterval kullanarak postMessage tablosunu düzenli aralıklarla sorgula
   /* setInterval(() => {
      const query = `SELECT * FROM postMessage`;

      db.all(query, (err, rows) => {
        if (err) {
          console.error('postMessage tablosu sorgulanırken hata oluştu:', err.message);
        } else {
          // Alınan verileri işle
          console.log('postMessage tablosundaki veriler:');
          rows.forEach(row => {
            console.log(row);
          });
        }
      });
    }, 1000); */ // 10 saniye
  }
});




// TEST
const testMessage = "3 agu";

// postMessage fonksiyonunu çağırarak test mesajını işle
 postMessage({
  body: {
   message: testMessage
   }
 }, null, () => {}); // req, res, next parametreleri geçirilmemiş gibi davranıyoruz


module.exports = {

  
  postMessage 
  
}





