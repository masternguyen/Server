let telegram = require("../../Models/Telegram")

module.exports = function (bot, id) {
  telegram.findOne({ form: id }, "phone", function (err, data) {
    if (data) {
      let opts = {
        parse_mode: "markdown",
        reply_markup: {
          remove_keyboard: true,
        },
      }
      bot.sendMessage(
        id,
        "*แนะนำ*" +
          "\n\n" +
          "Nhập:" +
          "\n" +
          "*OTP*:           รับรหัส OTP ฟรี." +
          "\n" +
          "*GiftCode*:  รับ GiftCode เริ่มต้นตอนนี้.",
        opts
      )
      bot = null
      id = null
    } else {
      let opts = {
        parse_mode: "markdown",
        reply_markup: {
          keyboard: [
            [{ text: "แบ่งปันหมายเลขโทรศัพท์", request_contact: true }],
          ],
          resize_keyboard: true,
        },
      }
      bot.sendMessage(
        id,
        "*JJbetwin.Com*  นี่เป็นครั้งแรกที่คุณใช้แอป OTP. โปรดกด SHARE PHONE NUMBER ถึง _VERIFY_ และรับรหัส OTP ฟรี.",
        opts
      )
      bot = null
      id = null
    }
  })
}
