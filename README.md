# UngDungQuanLyLichTapGym

Hướng dẫn khởi động nhanh toàn hệ thống để trải nghiệm:
1.Khởi động AI Inference Service:
cd "App/AI_Nutrition_Service"
python main.py
2.Khởi động Backend Node.js:
cd "App/BE_GymPlan"
npm run dev
3.Khởi động Ứng dụng Di động Expo:
cd "App/FE_GymPlan/Client_GymUser/GymPlan"
npm start
4.Khởi động Web admin:
cd "App/FE_GymPlan/Admin/Manage_GymPlan"
npm run dev



Để kết nối điện thoại:
(Máy tính và điện thoại kết nối cùng 1 wifi)
Thay đổi ipconfig trong 2 file
App\FE_GymPlan\Client_GymUser\GymPlan\src\services\api.ts
App\FE_GymPlan\Client_GymUser\GymPlan\.env