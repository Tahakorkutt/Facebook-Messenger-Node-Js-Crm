

// const testMessage = "369";

// postMessage fonksiyonunu çağırarak test mesajını işle
// postMessage({
//   body: {
//     message: testMessage
//   }
// }, null, () => {}); // req, res, next parametreleri geçirilmemiş gibi davranıyoruz


// const db = new sqlite3.Database('face_getMessage.db', (err) => {
//   if (err) {
//     console.error('Veritabanına bağlanırken hata oluştu:', err.message);
//   } else {
//     console.log('Veritabanına başarıyla bağlandı');

//     // setInterval kullanarak postMessage tablosunu düzenli aralıklarla sorgula
//     setInterval(() => {
//       // Tüm id sütununa sahip verileri sil
//       const deleteAllIdQuery = `DELETE FROM postMessage WHERE id IS NOT NULL`;

//       db.run(deleteAllIdQuery, (err) => {
//         if (err) {
//           console.error('Tüm id sütununa sahip veriler silinirken bir hata oluştu:', err.message);
//         } else {
//           console.log('Tüm id sütununa sahip veriler başarıyla silindi');

//           // postMessage tablosundaki tüm verileri sil
//           const deleteAllQuery = `DELETE FROM postMessage`;

//           db.run(deleteAllQuery, (err) => {
//             if (err) {
//               console.error('postMessage tablosundaki tüm veriler silinirken bir hata oluştu:', err.message);
//             } else {
//               console.log('postMessage tablosundaki tüm veriler başarıyla silindi');
//             }
//           });
//         }
//       });
//     }, 600); // 1 dakikada bir çalıştır
//   }
// });

// https://api.izmirekolhastanesi.com/api.php


// const db = new sqlite3.Database('face_getMessage.db', (err) => {
//   if (err) {
//     console.error('Veritabanına bağlanırken hata oluştu:', err.message);
//   } else {
//     console.log('Veritabanına başarıyla bağlandı');

// //     // setInterval kullanarak postMessage tablosunu düzenli aralıklarla sorgula
//     setInterval(() => {
//       const query = `SELECT * FROM postMessage`;

//       db.all(query, (err, rows) => {
//         if (err) {
//           console.error('postMessage tablosu sorgulanırken hata oluştu:', err.message);
//         } else {
//           // Alınan verileri işle
//           console.log('postMessage tablosundaki veriler:');
//           rows.forEach(row => {
//             console.log(row);
//           });
//         }
//       });
//     }, 100000); // 10 saniye
//   }
// });


// Messages tablosundaki veriler 
// const db = new sqlite3.Database('face_getMessage.db', (err) => {
// if (err) {
//   console.error('Veritabanına bağlanırken hata oluştu:', err.message);
// } else {
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

const getListMessage = async () => {
  try {
    // Tablo oluşturma sorgusu
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS AllListMessage (
        message_id TEXT PRIMARY KEY,
        sender_name TEXT,
        sender_profile_pic TEXT,
        message_content TEXT,
        message_timestamp TEXT
      );
    `;
  
    // Tabloyu oluştur
    await new Promise((resolve, reject) => {
      db.run(createTableQuery, (err) => {
        if (err) {
          console.error('Tablo oluşturulurken hata oluştu:', err.message);
          reject(err);
        } else {
          console.log('Tablo başarıyla oluşturuldu');
          resolve();
        }
      });
    });

    const rows = await new Promise((resolve, reject) => {
      db.all("SELECT userID FROM postMessage", (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    for (const row of rows) {
      const RECIPIENT_ID = row.userID;

      const apiEndpoint = `https://graph.facebook.com/v13.0/me/conversations?access_token=${process.env.PAGE_ACCESS_TOKEN}&fields=participants,messages{message}`;

      const response = await axios.get(apiEndpoint);
      const conversations = response.data.data;
      
      for (const conversation of conversations) {
        const participants = conversation.participants.data;

        if (participants.some(participant => participant.id === RECIPIENT_ID)) {
          const messages = conversation.messages.data;
          for (const message of messages) {
            const messageInfoEndpoint = `https://graph.facebook.com/v13.0/${message.id}?fields=message,from,id,created_time&access_token=${process.env.PAGE_ACCESS_TOKEN}`;
            try {
              const messageInfoResponse = await axios.get(messageInfoEndpoint);
              const messageInfo = messageInfoResponse.data;

              const senderProfileInfoEndpoint = `https://graph.facebook.com/${messageInfo.from.id}?fields=name,picture&access_token=${process.env.PAGE_ACCESS_TOKEN}`;
              const senderProfileInfoResponse = await axios.get(senderProfileInfoEndpoint);
              const senderProfileInfo = senderProfileInfoResponse.data;

              if (senderProfileInfo.name === 'Deneme chat') {
                const existingMessage = await new Promise((resolve, reject) => {
                  db.get("SELECT * FROM getAllListMessage WHERE message_content = ?", [messageInfo.message], (err, row) => {
                    if (err) {
                      reject(err);
                    } else {
                      resolve(row);
                    }
                  });
                });

                if (!existingMessage) {
                  db.run(
                    `INSERT INTO getAllListMessage (message_id, sender_name, sender_profile_pic, message_content, message_timestamp) VALUES (?, ?, ?, ?, ?)`,
                    [messageInfo.id, senderProfileInfo.name, senderProfileInfo.picture.data.url, messageInfo.message, messageInfo.created_time],
                    function(err) {
                      if (err) {
                        console.error("Mesajı kaydederken hata oluştu:", err.message);
                      } else {
                        console.log("Mesaj başarıyla kaydedildi:", messageInfo.id);
                      }
                    }
                  );
                } else {
                  console.log("Aynı message_content'e sahip bir mesaj zaten var, bu nedenle eklenmedi:", messageInfo.message);
                }
              }
            } catch (error) {
              console.error('Mesaj bilgilerini alırken hata oluştu:', error.response.data);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Veritabanından userID alınırken hata oluştu:', error.message);
  } finally {
    db.close((err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log("Veritabanı bağlantısı başarıyla kapatıldı");
    });
  }

  // Tüm verileri alma işlemi
  db.serialize(() => {
    db.all("SELECT * FROM getAllListMessage", function(err, rows) {
      if (err) {
        console.error("Verileri alırken hata oluştu:", err.message);
        return;
      }
      console.log("Tüm veriler:");
      rows.forEach((row) => {
        console.log(row);
      });
    });
  });
};

