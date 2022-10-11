var UserInfo = require("../../Models/UserInfo")
var OTP = require("../../Models/OTP")
var Phone = require("../../Models/Phone")
var Helper = require("../../Helpers/Helpers")

function gui(client, red) {
  red = red >> 0
  if (red < 10000) {
    client.red({
      notice: { title: "ส่ง RED", text: "จำนวนเงินฝากต้องมากกว่า 10.000" },
    })
  } else {
    Phone.findOne({ uid: client.UID }, {}, function (err3, check) {
      if (check) {
        UserInfo.findOne(
          { id: client.UID },
          "red ketSat",
          function (err, user) {
            if (user) {
              if (user.red < red) {
                client.red({
                  notice: {
                    title: "การแจ้งเตือน",
                    text: "ยอดคงเหลือไม่พร้อมใช้งาน.",
                  },
                })
              } else {
                UserInfo.updateOne(
                  { id: client.UID },
                  { $inc: { red: -red, ketSat: red } }
                ).exec()
                client.red({
                  notice: {
                    title: "ประสบความสำเร็จ",
                    text:
                      "ส่งแล้ว " +
                      Helper.numberWithCommas(red) +
                      " RED เข้าตู้เซฟได้สำเร็จ.!!",
                  },
                  user: { red: user.red - red, ketSat: user.ketSat * 1 + red },
                })
              }
            }
          }
        )
      } else {
        client.red({
          notice: {
            title: "การแจ้งเตือน",
            text: "ฟังก์ชันสำหรับบัญชีที่เปิดใช้งานเท่านั้น.",
          },
        })
      }
    })
  }
}

function rut(client, data) {
  var red = data.red >> 0

  if (red < 10000) {
    client.red({
      notice: { title: "ถอน RED", text: "จำนวนเงินถอนต้องมากกว่า 10.000" },
    })
  } else {
    Phone.findOne({ uid: client.UID }, {}, function (err3, check) {
      if (check) {
        UserInfo.findOne(
          { id: client.UID },
          "red ketSat phone",
          function (err, user) {
            if (user) {
              OTP.findOne(
                { uid: client.UID, phone: check.phone },
                {},
                { sort: { _id: -1 } },
                function (err, data_otp) {
                  if (data_otp && data.otp == data_otp.code) {
                    if (
                      (new Date() - Date.parse(data_otp.date)) / 1000 > 180 ||
                      data_otp.active
                    ) {
                      client.red({
                        notice: {
                          title: "ข้อผิดพลาด",
                          text: "OTP หมดอายุแล้ว.!",
                        },
                      })
                    } else {
                      if (user.ketSat < red) {
                        client.red({
                          notice: {
                            title: "ความล้มเหลว",
                            text: "จำนวนเงินในตู้เซฟน้อยกว่าจำนวนเงินที่ทำรายการ.",
                          },
                        })
                      } else {
                        OTP.updateOne(
                          { _id: data_otp._id.toString() },
                          { $set: { active: true } }
                        ).exec()
                        UserInfo.updateOne(
                          { id: client.UID },
                          { $inc: { red: red, ketSat: -red } }
                        ).exec()
                        client.red({
                          notice: {
                            title: "ประสบความสำเร็จ",
                            text:
                              "ถอนสำเร็จ " +
                              Helper.numberWithCommas(red) +
                              " RED จากตู้เซฟ.!!",
                          },
                          user: {
                            red: user.red * 1 + red,
                            ketSat: user.ketSat - red,
                          },
                        })
                      }
                    }
                  } else {
                    client.red({
                      notice: {
                        title: "ข้อผิดพลาด",
                        text: "รหัส OTP ไม่ถูกต้อง.!",
                      },
                    })
                  }
                }
              )
            }
          }
        )
      } else {
        client.red({
          notice: {
            title: "การแจ้งเตือน",
            text: "ฟังก์ชันสำหรับบัญชีที่เปิดใช้งานเท่านั้น.",
          },
        })
      }
    })
  }
}

module.exports = function (client, data) {
  if (void 0 !== data.gui) {
    gui(client, data.gui)
  }
  if (void 0 !== data.rut) {
    rut(client, data.rut)
  }
}
