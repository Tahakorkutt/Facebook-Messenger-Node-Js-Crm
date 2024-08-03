const sqlite3 = require('sqlite3').verbose(); // SQLite3 modülünü projeye dahil et

const sentMessages = {}; // Bu nesne, gönderilmiş mesajların bir listesini tutar


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
          const userDataResponse = await fetch(userProfileEndpoint);
          const userData = await userDataResponse.json();
          const { name: username, picture: { data: { url: profile_pic } } } = userData;

          const apiEndpoint = `https://graph.facebook.com/v13.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`;
          const messageText = req.body.message;

          // Gönderilen mesajı kontrol et
          if (!sentMessages[messageText]) {
            const messageData = {
              recipient: { id: recipientPSID },
              message: { text: messageText } // Kullanıcının gönderdiği metin buraya atanıyor
            };

            const messageResponse = await fetch(apiEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(messageData)
            });
            const messageResult = await messageResponse.json();
            console.log('Mesaj başarıyla gönderildi:', messageResult);

            // Gönderilen mesajı veritabanına kaydet
            const timestamp = Date.now();
            const dateObj = new Date(timestamp);
            const formattedDate = dateObj.toISOString();
            const insertQuery = `INSERT INTO postMessage (username, profile_pic, message_id, content, type, message_timestamp, message_date, userID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            await db.run(insertQuery, [username, profile_pic, messageResult.message_id, messageText, 'text', timestamp, formattedDate, userID]);
            console.log('Mesaj başarıyla postMessage tablosuna eklendi');

            // Gönderilen mesajı listeye ekle
            sentMessages[messageText] = true;
          } else {
            console.log('Bu mesaj daha önce gönderilmiş.');
          }
        } catch (error) {
          console.error('Hata:', error);
        }
      }
    });
  });
};

// Tes kodu


// const testMessage = "t19";

// // postMessage fonksiyonunu çağırarak test mesajını işle
// postMessage({
//   body: {
//     message: testMessage
//   }
// }, null, () => {}); // req, res, next parametreleri geçirilmemiş gibi davranıyoruz




// https://api.izmirekolhastanesi.com/api.php


const db = new sqlite3.Database('face_getMessage.db', (err) => {
  if (err) {
    console.error('Veritabanına bağlanırken hata oluştu:', err.message);
  } else {
    console.log('Veritabanına başarıyla bağlandı');

//     // setInterval kullanarak postMessage tablosunu düzenli aralıklarla sorgula
    setInterval(() => {
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
    }, 60000); // 1 dakikada bir çalıştır
  }
  // Messages tablosundaki veriler 
  // const db = new sqlite3.Database('face_getMessage.db', (err) => {
  // if (err) {
  //   console.error('Veritabanına bağlanırken hata oluştu:', err.message);
  // } else {
});


//   console.log('Veritabanına başarıyla bağlandı');

//   // setInterval kullanarak postMessage tablosunu düzenli aralıklarla sorgula


//   setInterval(() => {
//     const query = `SELECT * FROM messages`;

//     db.all(query, (err, rows) => {
//       if (err) {
//         console.error('messages tablosu sorgulanırken hata oluştu:', err.message);
//       } else {
//         // Alınan verileri işle
//         console.log('messages tablosundaki veriler:');
//         rows.forEach(row => {
//           console.log(row);
//         });
//       }
//     });
//   }, 200000); // 2 saniyede bir çalıştır
// }
// });


// Veritabanı dosyasına bağlantı oluştur





module.exports = {

  
  postMessage 
  
}





