// app.js
var express = require('express');
var cors = require('cors');
var myFn = require('./fn');
var googleSheet = require('./operation/google_connector');

// สร้าง express เพื่อทำ path
var app = express();

// ทำให้ดึง uri ไปใช้งานได้
app.use(cors());

// สร้าง server port
var port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('[success] task 1 : listening on port ' + port);
});

// ข้อความสำหรับ path หน้าแรกของ express เรา (localhost:5000/)
app.get('/', (req, res) => {
  res.status(200).send('hello');
});

app.get('/students', (req, res) => {
  googleSheet.data$.subscribe((data) => {
    res.status(200).send(data);
  });
});

app.get('/addStudent', (req, res) => {
  googleSheet.valueWrite.next(1);
});

// ข้อความสำหรับใส่ path ผิด (localhost:5000/asdfghjkl;)
app.use((req, res, next) => {
  var err = new Error('ไม่พบ path ที่คุณต้องการ');
  err.status = 404;
  next(err);
});
