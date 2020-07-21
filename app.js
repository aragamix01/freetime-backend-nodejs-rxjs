// app.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const googleSheet = require('./operation/google_operation');
const connector = require('./operation/google_connector');
// สร้าง express เพื่อทำ path
const app = express();

// ทำให้ดึง uri ไปใช้งานได้
app.use(cors());

// สร้าง server port
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('[success] task 1 : listening on port ' + port);
});

// ข้อความสำหรับ path หน้าแรกของ express เรา (localhost:5000/)
app.get('/', (req, res) => {
  res.status(200).send('hello');
});

app.get('/getMenu', (req, res) => {
  googleSheet.data$.subscribe((data) => {
    res.status(200).send(data);
  });
});

app.use(bodyParser.json());

app.post('/addMenu', (req, res) => {
  const sub = googleSheet.valueWrite$.subscribe((rs) => {
    res.status(200).send(rs);
    sub.unsubscribe();
  });
  googleSheet.valueWrite.next(req.body);
});

app.get('/addStudent', (req, res) => {
  const sub = googleSheet.valueWrite$.subscribe((rs) => {
    res.status(200).send(rs);
    sub.unsubscribe();
  });
  googleSheet.valueWrite.next(1);
});

app.use((req, res, next) => {
  var err = new Error('ไม่พบ path ที่คุณต้องการ');
  err.status = 404;
  next(err);
});
