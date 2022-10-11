let UserInfo = require("../Models/UserInfo")
let OTP = require("../Models/OTP")
let Phone = require("../Models/Phone")
let telegram = require("../Models/Telegram")
let smsOTP = require("../sms").sendOTP

function createOTP(client) {
  Phone.findOne({ uid: client.UID }, function (err3, check) {
    if (check) {
      OTP.findOne(
        { uid: client.UID, phone: check.phone },
        {},
        { sort: { _id: -1 } },
        function (err1, data) {
          if (
            !data ||
            (new Date() - Date.parse(data.date)) / 1000 > 180 ||
            data.active
          ) {
            // Tạo mã OTP mới
            UserInfo.findOne({ id: client.UID }, "red", function (err2, user) {
              if (user) {
                let otp = (Math.random() * (9999 - 1000 + 1) + 1000) >> 0 // OTP từ 1000 đến 9999
                telegram.findOne(
                  { phone: check.phone },
                  "form",
                  function (err3, teleCheck) {
                    if (!!teleCheck) {
                      OTP.create({
                        uid: client.UID,
                        phone: check.phone,
                        code: otp,
                        date: new Date(),
                      })
                      client.red({
                        notice: {
                          title: "การแจ้งเตือน",
                          text: "OTP ถูกส่งไปยัง Telegram ของคุณแล้ว.",
                        },
                      })
                      let testCheck = client.redT.telegram.sendMessage(
                        teleCheck.form,
                        "*OTP*:  " + otp + "",
                        {
                          parse_mode: "markdown",
                          reply_markup: { remove_keyboard: true },
                        }
                      )
                    } else {
                      client.red({
                        notice: {
                          title: "ความล้มเหลว",
                          text: "คุณต้องตรวจสอบสิทธิ์โทรเลขเพื่อรับ OTP.",
                        },
                      })
                    }
                  }
                )
              }
            })
          } else {
            client.red({
              notice: {
                title: "OTP",
                text: "โปรดตรวจสอบกล่องจดหมายของคุณใน Telegram.!",
              },
            })
          }
        }
      )
    } else {
      client.red({
        notice: {
          title: "การแจ้งเตือน",
          text: "คุณต้องเปิดใช้งานหมายเลขโทรศัพท์เพื่อใช้ฟังก์ชันนี้.",
          button: { text: "เปิดใช้งาน", type: "reg_otp" },
        },
      })
    }
  })
}

module.exports = function (client) {
  createOTP(client)
}
