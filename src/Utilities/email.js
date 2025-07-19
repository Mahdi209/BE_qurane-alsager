const nodemailer = require('nodemailer');

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send an email using Gmail
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 * @returns {Promise} - Resolves with send info or rejects with error
 */
const sendEmail = async ({ to, subject, text, newPassword }) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', 'Amiri', 'Arial', sans-serif;
            line-height: 1.8;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
            direction: rtl;
            text-align: right;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            overflow: hidden;
            direction: rtl;
        }
        .header {
            background: linear-gradient(135deg, #B77D3D 0%, #8B5A2B 100%);
            color: white;
            text-align: center;
            padding: 30px;
            direction: rtl;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            text-align: center;
        }
        .header p {
            margin: 10px 0 0 0;
            text-align: center;
        }
        .content {
            padding: 30px;
            direction: rtl;
            text-align: right;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2c3e50;
            text-align: right;
        }
        .content p {
            text-align: right;
            margin: 15px 0;
            line-height: 1.8;
        }
        .password-box {
            background-color: #f8f9fa;
            border: 2px dashed #B77D3D;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
            direction: ltr;
        }
        .password-box p {
            text-align: center;
            direction: rtl;
            margin-bottom: 10px;
        }
        .password {
            font-size: 24px;
            font-weight: bold;
            color: #B77D3D;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
            direction: ltr;
            text-align: center;
        }
        .login-button {
            text-align: center;
            margin: 30px 0;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #B77D3D 0%, #8B5A2B 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            direction: rtl;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(183, 125, 61, 0.3);
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            border-top: 1px solid #dee2e6;
            direction: rtl;
        }
        .footer p {
            text-align: center;
            margin: 5px 0;
        }
        .signature {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            text-align: center;
            color: #7f8c8d;
            direction: rtl;
        }
        .signature p {
            text-align: center;
        }
        
        /* تحسينات إضافية للنصوص العربية */
        .arabic-text {
            font-family: 'Amiri', 'Traditional Arabic', 'Arial Unicode MS', sans-serif;
            text-align: right;
            direction: rtl;
        }
        
        /* التأكد من اتجاه النص في جميع العناصر */
        h1, h2, h3, h4, h5, h6 {
            direction: rtl;
            text-align: center;
        }
        
        strong {
            direction: rtl;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🕌 القرآني الصغير</h1>
            <p>لوحة التحكم الإدارية</p>
        </div>
        
        <div class="content arabic-text">
            <div class="greeting">السلام عليكم ورحمة الله وبركاته</div>
            
            <p><strong>عزيزي المشرف،</strong></p>
            
            <p>تم إعادة تعيين كلمة المرور الخاصة بحسابك في لوحة تحكم القرآني الصغير بنجاح.</p>
                            <p><strong>كلمة المرور الجديدة:</strong></p>

            <div class="password-box">
                <div class="password">${newPassword}</div>
            </div>
            
            <p>يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.</p>
            
            <div class="login-button">
                <a href="#" class="btn">🔐 تسجيل الدخول الآن</a>
            </div>
            
            <div class="signature">
                <p><strong>مع أطيب التحيات،</strong><br>
                فريق القرآني الصغير</p>
            </div>
        </div>
        
        <div class="footer arabic-text">
            <p>📧 هذه رسالة تلقائية، يُرجى عدم الرد عليها</p>
            <p>© ${new Date().getFullYear()} القرآني الصغير - جميع الحقوق محفوظة</p>
        </div>
    </div>
</body>
</html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};
module.exports = {
    sendEmail
};
