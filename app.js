const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const fs = require('fs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const dotenv = require('dotenv');
// console.log(user);

dotenv.config();

let users = [];
if (fs.existsSync('./users.json')) {
    const data = fs.readFileSync('./users.json', 'utf8');
    users = JSON.parse(data || '[]'); 
}

// middleware
app.use(express.json());

// Cấu hình Multer (upload file)
const upload = multer({ dest: 'uploads/' });

// Get user
app.get('/user',(req,res) => {
    user = fs.readFile('./users.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(400).json({ code: 400, message: err });
        } else {
          try {
            // Phân tích dữ liệu JSON
            const users = JSON.parse(data);
            console.log('Đọc thành công:', users);

            // Trả về danh sách người dùng
            return res.status(200).json({ code: 200, data:users });
          } catch (err) {
            console.log('Đọc thất bại', err);
            return res.status(400).json({ code: 400, message: err });
          }
        }
    });
});

// register
const hasSpecialChars = (str) => /[!@#$%^&*(),.?":{}|<>]/.test(str);
app.post('/api/register',(req,res)=> {
    const { username, password } = req.body;

    // Kiểm tra ký tự đặc biệt trong username
    if (hasSpecialChars(username)) {
        return res.status(400).json({ code: 400, message: 'Username không được chứa ký tự đặc biệt!' });
    }

    // Kiểm tra trùng lặp username
    const isDuplicate = users.some((user) => user.username === username);
    if (isDuplicate) {
        return res.status(400).json({ code: 400, message: 'Username đã tồn tại!' });
    }

    // Trả về kết quả thành công
    res.status(200).json({ code: 200, message:"Cảm ơn đã đăng ký" });
    console.log('Đọc thành công:', users);
})

// login 
app.post('/api/login',(req,res) => {
    /*
        JWT:
            - Authentication: xác thực 
            - Authorization: cấp quyền
    */
    try {
        const data = req.body;
        const access_token = jwt.sign(data, process.env.secret_key, {expiresIn: "30s"});
        res.json({ code: 200, token: access_token });  
    } catch (err) {
        res.json({ code: 400, message: err }); 
    }

})

// update-profile
app.post('/api/update-profile', upload.single('avatar'), (req, res) => {
    const token = req.headers.authorization;
    const { profile } = req.body;

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const username = decoded.username;
        const users = readUsers();

        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(400).json({ code: 400, message: 'User không tồn tại' });
        }

        // Cập nhật thông tin
        user.profile = { ...user.profile, ...JSON.parse(profile) };
        if (req.file) user.profile.avatar = req.file.path;

        writeUsers(users);
        return res.status(200).json({ code: 200 });
    } catch (err) {
        return res.status(400).json({ code: 400, message: 'Token không hợp lệ' });
    }
});

// Lấy thông tin hồ sơ
app.get('/api/detail-profile', (req, res) => {
    const token = req.headers.authorization;

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const username = decoded.username;
        const users = readUsers();

        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(400).json({ code: 400, message: 'User không tồn tại' });
        }

        return res.status(200).json({ code: 200, data: user.profile });
    } catch (err) {
        return res.status(400).json({ code: 400, message: 'Token không hợp lệ' });
    }
});

app.listen(PORT, () => {
    console.log("Server started on Port 5000");
})
