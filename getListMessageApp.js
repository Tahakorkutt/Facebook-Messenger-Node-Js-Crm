const axios = require("axios");
const sqlite3 = require('sqlite3').verbose();

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

let db = new sqlite3.Database('face_getMessage.db');



const getListMessage = async () => {
  try {
    // Tablo oluşturma sorgusu
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS getAllListMessage (
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
}; // facebook hesabından messenger sayfasından gelen ve gönderilen tüm mesajları çekip veriyi kaydetme



const getSendListAllMessage = async () => {
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
                  db.get("SELECT * FROM AllListMessage WHERE message_content = ?", [messageInfo.message], (err, row) => {
                    if (err) {
                      reject(err);
                    } else {
                      resolve(row);
                    }
                  });
                });

                if (!existingMessage) {
                  db.run(
                    `INSERT INTO AllListMessage (message_id, sender_name, sender_profile_pic, message_content, message_timestamp) VALUES (?, ?, ?, ?, ?)`,
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
    db.all("SELECT * FROM AllListMessage", function(err, rows) {
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
}; // facebook hesabındaki sadece gönderilen tüm mesajları çekip veriyi kaydet


// setInterval(get_messenger_messages, 1000);


  // siçindeki verileri Listeleme

    // setInterval(() => {
    //   const query = `SELECT * FROM get_messenger_messages_table`;

    //   db.all(query, (err, rows) => {
    //     if (err) {
    //       console.error('postMessage tablosu sorgulanırken hata oluştu:', err.message);
    //     } else {
    //       // Alınan verileri işle
    //       console.log('postMessage tablosundaki veriler:');
    //       rows.forEach(row => {
    //         console.log(row);
    //       });
    //     }
    //   });
    // }, 100000); // 10 saniye

// içindeki verileri silme

// // setInterval fonksiyonunu kullanarak veritabanındaki tüm verileri silme
// setInterval(() => {
//   const query = `DELETE FROM get_messenger_messages_table`;

//   db.run(query, (err) => {
//     if (err) {
//       console.error('Veritabanındaki veriler silinirken hata oluştu:', err.message);
//     } else {
//       console.log('Veritabanındaki veriler başarıyla silindi.');
//     }
//   });
// }, 1000); // 10 saniye




    // setInterval(() => {
    //   const query = `SELECT * FROM AllListMessage`;

    //   db.all(query, (err, rows) => {
    //     if (err) {
    //       console.error('postMessage tablosu sorgulanırken hata oluştu:', err.message);
    //     } else {
    //       // Alınan verileri işle
    //       console.log('AllListMessage tablosundaki veriler:');
    //       rows.forEach(row => {
    //         console.log(row);
    //       });
    //     }
    //   });
    // }, 100); // 10 saniye

// içindeki verileri silme

// // setInterval fonksiyonunu kullanarak veritabanındaki tüm verileri silme
// setInterval(() => {
//   const query = `DELETE FROM get_messenger_messages_table`;

//   db.run(query, (err) => {
//     if (err) {
//       console.error('Veritabanındaki veriler silinirken hata oluştu:', err.message);
//     } else {
//       console.log('Veritabanındaki veriler başarıyla silindi.');
//     }
//   });
// }, 1000); // 10 saniye



module.exports = {

  
  getListMessage ,
  getSendListAllMessage
  
}