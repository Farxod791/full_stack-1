import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import { users } from "./users.js";

const app = express();
app.use(cors());
dotenv.config();
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Email yoki parol noto‘g‘ri" });
  }

  const payload = {
    id: user.id,
    email: user.email,
    personality: user.personality
  };

  const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "1h" });
  res.json([token,user.personality]);
  
});

app.get("/user", (req, res) => {
  const authHeader = req.headers["auth-token"]
  if (!authHeader) return res.status(401).json({ message: "Token yo'q" })

  try {
    const decoded = jwt.verify(authHeader, process.env.SECRET_KEY)
    const user = users.find((u) => u.id === decoded.id)

    if (!user) return res.status(404).json({ message: "Foydalanuvchi topilmadi" })

    const { password, ...userData } = user
    res.json(userData)

  } catch (err) {
    res.status(401).json({ message: "Token yaroqsiz yoki muddati tugagan" })
  }
})

app.post("/register", (req, res) => {
  const newUser = req.body;  

  const requiredFields = ["username", "surname", "email", "password", "personality"];

  for (let field of requiredFields) {
    if (!newUser[field]) {
      return res.status(400).json({ message: `${field} maydoni kerak` });
    }
  }

  const exists = users.find((u) => u.email === newUser.email);
  if (exists) {
    return res.status(409).json({ message: "Bu email allaqachon ro‘yxatdan o‘tgan" });
  }

  newUser.id = users.length ? users[users.length - 1].id + 1 : 1;
  newUser.company = newUser.personality === "yuridik" ? newUser.company : null;
  newUser.request = [];
  newUser.response = {};

  console.log(newUser);

  users.push(newUser);

  res.status(201).json({ message: "Ro‘yxatdan o‘tish muvaffaqiyatli yakunlandi" });
});

app.post("/request", (req, res) => {
  const [id,problem ] = req.body;
  const user = users.find(u => u.id === id);

  if (!user) return res.status(404).json({ message: "User topilmadi" });

  user.requests.push(problem);

  res.json({ message: "Muammo qabul qilindi, masterga yuborildi" });
});


app.get("/master/requests", (req, res) => {
  let id = 1
  const master = users.flatMap((user) =>
  user.requests
    .filter((req) => !req.response) // faqat javobi yo‘q muammolar
    .map((req,index) => ({
      problemId : id++,
      userId: user.id,
      problemIndex: index, 
      username: user.username,
      email: user.email,
      problem: req.problem
    }))
  );

  res.send(master)
  
});

app.post("/master/respond", (req, res) => {
  const { userId, requestIndex, days, price } = req.body;
  
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: "Foydalanuvchi topilmadi" });

  if (!user.requests[requestIndex]) return res.status(404).json({ message: "Muammo topilmadi" });

  user.requests[requestIndex].response = { days, price, confirmed: false };
  console.log(user);

  res.json({ message: "Master javobi saqlandi, admin tasdiqlashi kerak" });
});

app.get("/admin/pending", (req, res) => {
  let id = 1
  const admin = users.flatMap((user) =>
  user.requests
    .filter((req) => req.response && req.response.confirmed === undefined) // faqat javobi bor muammolar
    .map((req,index) => ({
      problemId : id++,
      userId: user.id,
      problemIndex: index, 
      username: user.username,
      email: user.email,
      problem: req.problem,
      days: req.response.days,
      price: req.response.price
    }))
  );
  res.json(admin);
});

app.post("/admin/confirm", (req, res) => {
  const { userId, problemIndex, confirmed} = req.body;  

  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
  
  if (!user.requests[problemIndex].response) return res.status(404).json({ message: "Muammo javobi topilmadi" });

   user.requests[problemIndex].response.confirmed = confirmed
  console.log(user.requests[problemIndex]);

  // Bu yerda foydalanuvchiga xabar yuborish lozim, frontendda real-time qilinsa yaxshi

  res.json({ message: "Admin tasdiqladi. Userga xabar yuborildi" });
});


app.listen(PORT,()=>{
    console.log("Server started")
})
