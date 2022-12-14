let telegram = require("../../Models/Telegram")
let OTP = require("../../Models/OTP")
let Phone = require("../../Models/Phone")

module.exports = function (bot, id) {
  telegram.findOne({ form: id }, "phone", function (err, check) {
    if (check) {
      Phone.findOne({ phone: check.phone }, {}, function (err3, checkPhone) {
        if (checkPhone) {
          OTP.findOne(
            { uid: checkPhone.uid, phone: checkPhone.phone },
            {},
            { sort: { _id: -1 } },
            function (err, data) {
              if (
                !data ||
                (new Date() - Date.parse(data.date)) / 1000 > 180 ||
                data.active
              ) {
                // Tạo mã OTP mới
                var otp = (Math.random() * (999999 - 100000 + 1) + 100000) >> 0 // OTP từ 1000 đến 9999
                OTP.create({
                  uid: checkPhone.uid,
                  phone: checkPhone.phone,
                  code: otp,
                  date: new Date(),
                })
                bot.sendMessage(id, "*OTP*:  " + otp + "", {
                  parse_mode: "markdown",
                  reply_markup: { remove_keyboard: true },
                })
                bot = null
                id = null
                checkPhone = null
              } else {
                bot.sendMessage(id, "OTP:  _" + data.code + "_", {
                  parse_mode: "markdown",
                  reply_markup: { remove_keyboard: true },
                })
                bot = null
                checkPhone = null
                id = null
              }
            }
          )
        } else {
          bot.sendMessage(
            id,
            "_การทำงานล้มเหลว, ไม่สามารถอ่านหมายเลขโทรศัพท์ได้_",
            { parse_mode: "markdown", reply_markup: { remove_keyboard: true } }
          )
          bot = null
          checkPhone = null
          id = null
        }
      })
    } else {
      bot.sendMessage(
        id,
        "_การทำงานล้มเหลว, ไม่สามารถอ่านหมายเลขโทรศัพท์ได้_",
        { parse_mode: "markdown", reply_markup: { remove_keyboard: true } }
      )
      bot = null
      id = null
    }
  })
}
