var User = require("../../Models/Users")
var UserInfo = require("../../Models/UserInfo")
var OTP = require("../../Models/OTP")
var Phone = require("../../Models/Phone")
var validator = require("validator")
var Helper = require("../../Helpers/Helpers")
var smsOTP = require("../../sms").sendOTP

function sendOTP(client, name) {
  if (!!name) {
    name = "" + name + ""
    var az09 = new RegExp("^[a-zA-Z0-9]+$")
    var testName = az09.test(name)
    if (!validator.isLength(name, { min: 3, max: 32 }) || !testName) {
      client.red({
        notice: {
          title: "ข้อผิดพลาด",
          text: "กรุณากรอกชื่อบัญชีที่ถูกต้อง...",
        },
      })
    } else {
      name = name.toLowerCase()
      User.findOne({ "local.username": name }).exec(function (err, check) {
        if (!!check) {
          if (check["local"]["ban_pass"] > 3) {
            client.red({
              notice: {
                title: "ข้อผิดพลาด",
                text: "คุณได้รับรหัส OTP ถึงขีดจำกัดแล้ว โปรดติดต่อผู้ดูแลระบบเพื่อขอความช่วยเหลือ...",
              },
            })
            return void 0
          }
          var cID = check._id.toString()
          Phone.findOne({ uid: cID }, function (err3, checkP) {
            if (checkP) {
              UserInfo.findOne({ id: cID }, "red").exec(function (err, user) {
                if (!!user) {
                  if (user.red < 1000) {
                    // Red không đủ để lấy OTP
                    client.red({
                      notice: {
                        title: "ความล้มเหลว",
                        text: "ไม่สามารถรับ OTP ได้ โปรดติดต่อผู้ดูแลระบบ.",
                      },
                    })
                  } else {
                    OTP.findOne(
                      { uid: cID, phone: checkP.phone },
                      {},
                      { sort: { _id: -1 } },
                      function (err, data_otp) {
                        if (
                          !data_otp ||
                          (new Date() - Date.parse(data_otp.date)) / 1000 >
                            180 ||
                          data_otp.active
                        ) {
                          var otp =
                            (Math.random() * (9999 - 1000 + 1) + 1000) >> 0 // OTP từ 1000 đến 9999
                          // Lấy SMS OTP
                          smsOTP(checkP.region + checkP.phone, otp)
                          OTP.create({
                            uid: cID,
                            phone: checkP.phone,
                            code: otp,
                            date: new Date(),
                          })
                          User.updateOne(
                            { _id: cID },
                            { $inc: { "local.ban_pass": 1 } }
                          ).exec()
                          UserInfo.updateOne(
                            { id: cID },
                            { $inc: { red: -1000 } }
                          ).exec()
                          client.red({
                            notice: {
                              title: "การแจ้งเตือน",
                              text: "ส่ง OTP ไปยังหมายเลขโทรศัพท์ของคุณแล้ว...",
                            },
                          })
                        } else {
                          client.red({
                            notice: {
                              title: "OTP",
                              text: "โปรดตรวจสอบอินบ็อกซ์ของคุณ.!",
                            },
                          })
                        }
                      }
                    )
                  }
                } else {
                  client.red({
                    notice: {
                      title: "ข้อผิดพลาด",
                      text: "บัญชีนี้ยังไม่ได้สร้างตัวละคร...",
                    },
                  })
                }
              })
            } else {
              client.red({
                notice: {
                  title: "ข้อผิดพลาด",
                  text: "บัญชีนี้ยังไม่ได้ยืนยันหมายเลขโทรศัพท์...",
                },
              })
            }
          })
        } else {
          client.red({
            notice: { title: "ข้อผิดพลาด", text: "ไม่มีชื่อบัญชี..." },
          })
        }
      })
    }
  }
}

function iForGot(client, data) {
  if (!!data && !!data.name && !!data.pass && !!data.otp && !!data.captcha) {
    if (
      !validator.isLength(data.name, { min: 3, max: 32 }) ||
      !validator.isLength(data.pass, { min: 6, max: 32 }) ||
      !validator.isLength(data.otp, { min: 4, max: 6 }) ||
      !validator.isLength(data.captcha, { min: 4, max: 4 })
    ) {
      client.red({
        notice: { title: "ข้อผิดพลาด", text: "ข้อมูลไม่ถูกต้อง..." },
      })
    } else {
      var name = "" + data.name + ""
      var az09 = new RegExp("^[a-zA-Z0-9]+$")
      var testName = az09.test(name)
      if (!testName) {
        client.red({
          notice: {
            title: "ข้อผิดพลาด",
            text: "กรุณากรอกชื่อบัญชีที่ถูกต้อง...",
          },
        })
      } else {
        name = name.toLowerCase()
        var checkCaptcha = new RegExp("^" + client.captcha + "$", "i")
        checkCaptcha = checkCaptcha.test(data.captcha)
        if (checkCaptcha) {
          User.findOne({ "local.username": name }).exec(function (err, check) {
            if (!!check) {
              if (check["local"]["ban_pass"] > 3) {
                client.red({
                  notice: {
                    title: "ข้อผิดพลาด",
                    text: "บัญชีนี้ถูกล็อคเพื่อกู้คืนรหัสผ่าน โปรดติดต่อผู้ดูแลระบบเพื่อขอความช่วยเหลือ...",
                  },
                })
              } else {
                var cID = check._id.toString()
                Phone.findOne({ uid: cID }, function (err3, checkP) {
                  if (checkP) {
                    OTP.findOne(
                      { uid: cID, phone: checkP.phone },
                      {},
                      { sort: { _id: -1 } },
                      function (err, data_otp) {
                        if (!!data_otp && data.otp == data_otp.code) {
                          if (
                            (new Date() - Date.parse(data_otp.date)) / 1000 >
                              180 ||
                            data_otp.active
                          ) {
                            client.red({
                              notice: {
                                title: "OTP",
                                text: "OTP หมดอายุแล้ว.!",
                              },
                            })
                          } else {
                            data_otp.active = true
                            data_otp.save()
                            User.updateOne(
                              { _id: cID },
                              {
                                $set: {
                                  "local.ban_pass": 0,
                                  "local.password": Helper.generateHash(
                                    data.pass
                                  ),
                                },
                              }
                            ).exec()
                            client.red({
                              notice: {
                                title: "ประสบความสำเร็จ",
                                text: "คุณกู้คืนรหัสผ่านสำเร็จแล้ว.",
                              },
                            })
                          }
                        } else {
                          client.red({
                            notice: {
                              title: "ข้อผิดพลาด",
                              text: "รหัส OTP ไม่ถูกต้อง...",
                            },
                          })
                        }
                      }
                    )
                  } else {
                    client.red({
                      notice: {
                        title: "ข้อผิดพลาด",
                        text: "บัญชีนี้ยังไม่ได้ยืนยันหมายเลขโทรศัพท์...",
                      },
                    })
                  }
                })
              }
            } else {
              client.red({
                notice: { title: "ข้อผิดพลาด", text: "ไม่มีชื่อบัญชี..." },
              })
            }
          })
        } else {
          client.red({
            notice: { title: "ข้อผิดพลาด", text: "Captcha ไม่ถูกต้อง" },
          })
        }
      }
    }
    client.c_captcha("forgotpass")
  }
}
module.exports = function (client, data) {
  if (!!data) {
    if (!!data.sendOTP) {
      sendOTP(client, data.sendOTP)
    }
    if (!!data.iforgot) {
      iForGot(client, data.iforgot)
    }
  }
}
