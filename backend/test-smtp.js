const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'rentxysupport@gmail.com',
        pass: 'auwmetmmyizxeilr'
    }
});

transporter.verify(function(error, success) {
    if (error) {
        console.error("SMTP Error:");
        console.error(error);
    } else {
        console.log("Server is ready to take our messages");
    }
});
