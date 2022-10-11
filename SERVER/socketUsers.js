let validator = require("validator")
let User = require("./app/Models/Users")
let UserInfo = require("./app/Models/UserInfo")
let helpers = require("./app/Helpers/Helpers")
let socket = require("./app/socket.js")
let captcha = require("./captcha")
let forgotpass = require("./app/Controllers/user/for_got_pass")

// Authenticate!
let authenticate = function (client, data, callback) {
  if (!!data) {
    let token = data.token
    if (!!token && !!data.id) {
      let id = data.id >> 0
      UserInfo.findOne({ UID: id }, "id", function (err, userI) {
        if (!!userI) {
          User.findOne(
            { _id: userI.id },
            "local fail lock",
            function (err, userToken) {
              if (!!userToken) {
                if (userToken.lock === true) {
                  callback({ title: "ห้าม", text: "บัญชีถูกปิดใช้งาน" }, false)
                  return void 0
                }
                if (void 0 !== userToken.fail && userToken.fail > 3) {
                  callback(
                    { title: "การแจ้งเตือน", text: "กรุณาเข้าสู่ระบบ !!" },
                    false
                  )
                  userToken.fail = userToken.fail >> 0
                  userToken.fail += 1
                  userToken.save()
                } else {
                  if (userToken.local.token === token) {
                    userToken.fail = 0
                    userToken.save()
                    client.UID = userToken._id.toString()
                    callback(false, true)
                  } else {
                    callback(
                      {
                        title: "ความล้มเหลว",
                        text: "คุณหรือบุคคลอื่นเข้าสู่ระบบในอุปกรณ์อื่น !!",
                      },
                      false
                    )
                  }
                }
              } else {
                callback(
                  { title: "ความล้มเหลว", text: "การเข้าถึงถูกปฏิเสธ !!" },
                  false
                )
              }
            }
          )
        } else {
          callback(
            { title: "ความล้มเหลว", text: "การเข้าถึงถูกปฏิเสธ !!" },
            false
          )
        }
      })
    } else if (!!data.username && !!data.password) {
      let username = "" + data.username + ""
      let password = "" + data.password + ""
      let captcha = data.captcha
      let register = !!data.register
      let az09 = new RegExp("^[a-zA-Z0-9]+$")
      let testName = az09.test(username)

      if (!validator.isLength(username, { min: 3, max: 32 })) {
        register && client.c_captcha("signUp")
        callback(
          {
            title: register ? "ลงทะเบียน" : "เข้าสู่ระบบ",
            text: "บัญชี (3-32 ตัวอักษร)",
          },
          false
        )
      } else if (!validator.isLength(password, { min: 6, max: 32 })) {
        register && client.c_captcha("signUp")
        callback(
          {
            title: register ? "ลงทะเบียน" : "เข้าสู่ระบบ",
            text: "รหัสผ่าน (6-32 ตัวอักษร)",
          },
          false
        )
      } else if (!testName) {
        register && client.c_captcha("signUp")
        callback(
          {
            title: register ? "ลงทะเบียน" : "เข้าสู่ระบบ",
            text: "ชื่อผู้ใช้มีได้เฉพาะตัวอักษรและตัวเลขเท่านั้น!!",
          },
          false
        )
      } else if (username === password) {
        register && client.c_captcha("signUp")
        callback(
          {
            title: register ? "ลงทะเบียน" : "เข้าสู่ระบบ",
            text: "บัญชีไม่สามารถจับคู่รหัสผ่านได้!!",
          },
          false
        )
      } else {
        try {
          username = username.toLowerCase()
          // ลงทะเบียน
          if (register) {
            if (!captcha || !client.c_captcha) {
              client.c_captcha("signUp")
              callback(
                { title: "ลงทะเบียน", text: "Captcha ไม่ได้อยู่." },
                false
              )
            } else {
              let checkCaptcha = new RegExp("^" + client.captcha + "$", "i")
              checkCaptcha = checkCaptcha.test(captcha)
              if (checkCaptcha) {
                User.findOne({ "local.username": username }).exec(function (
                  err,
                  check
                ) {
                  if (!!check) {
                    client.c_captcha("signUp")
                    callback(
                      { title: "ลงทะเบียน", text: "บัญชีนี้มีอยู่แล้ว !!" },
                      false
                    )
                  } else {
                    User.create(
                      {
                        "local.username": username,
                        "local.password": helpers.generateHash(password),
                        "local.regDate": new Date(),
                      },
                      function (err, user) {
                        if (!!user) {
                          client.UID = user._id.toString()
                          callback(false, true)
                        } else {
                          client.c_captcha("signUp")
                          callback(
                            {
                              title: "ลงทะเบียน",
                              text: "บัญชีนี้มีอยู่แล้ว !!",
                            },
                            false
                          )
                        }
                      }
                    )
                  }
                })
              } else {
                client.c_captcha("signUp")
                callback(
                  { title: "ลงทะเบียน", text: "Captcha ไม่ถูกต้อง." },
                  false
                )
              }
            }
          } else {
            // เข้าสู่ระบบ
            User.findOne({ "local.username": username }, function (err, user) {
              if (user) {
                if (user.lock === true) {
                  callback({ title: "ห้าม", text: "บัญชีถูกปิดใช้งาน" }, false)
                  return void 0
                }
                if (void 0 !== user.fail && user.fail > 3) {
                  if (!captcha || !client.c_captcha) {
                    client.c_captcha("signIn")
                    callback(
                      {
                        title: "เข้าสู่ระบบ",
                        text: "ตรวจพบการเข้าถึงโดยไม่ได้รับอนุญาต โปรดป้อน captcha เพื่อจะดำเนินการต่อ.",
                      },
                      false
                    )
                  } else {
                    let checkCLogin = new RegExp(
                      "^" + client.captcha + "$",
                      "i"
                    )
                    checkCLogin = checkCLogin.test(captcha)
                    if (checkCLogin) {
                      if (user.validPassword(password)) {
                        user.fail = 0
                        user.save()
                        client.UID = user._id.toString()
                        callback(false, true)
                        global["userOnline"]++
                      } else {
                        client.c_captcha("signIn")
                        user.fail += 1
                        user.save()
                        callback(
                          { title: "เข้าสู่ระบบ", text: "รหัสผ่านผิดพลาด!!" },
                          false
                        )
                      }
                    } else {
                      user.fail += 1
                      user.save()
                      client.c_captcha("signIn")
                      callback(
                        { title: "เข้าสู่ระบบ", text: "Captcha ไม่ถูกต้อง..." },
                        false
                      )
                    }
                  }
                } else {
                  if (user.validPassword(password)) {
                    if (!user.local.ban_login) {
                      user.fail = 0
                      user.save()
                      client.UID = user._id.toString()
                      callback(false, true)
                    } else {
                      callback(
                        {
                          title: "เข้าสู่ระบบ",
                          text: "บัญชีถูกล็อค โปรดติดต่อฝ่ายบริการลูกค้าเพื่อขอความช่วยเหลือ",
                        },
                        false
                      )
                    }
                  } else {
                    user.fail = user.fail >> 0
                    user.fail += 1
                    user.save()
                    callback(
                      { title: "เข้าสู่ระบบ", text: "รหัสผ่านผิดพลาด!!" },
                      false
                    )
                  }
                }
              } else {
                callback(
                  { title: "เข้าสู่ระบบ", text: "ไม่มีชื่อบัญชี!!" },
                  false
                )
              }
            })
          }
        } catch (error) {
          callback(
            {
              title: "การแจ้งเตือน",
              text: "เกิดข้อผิดพลาด โปรดตรวจสอบอีกครั้ง!!",
            },
            false
          )
        }
      }
    }
  }
}

module.exports = function (ws, redT) {
  ws.auth = false
  ws.UID = null
  ws.captcha = {}
  ws.c_captcha = captcha
  ws.red = function (data) {
    try {
      this.readyState == 1 && this.send(JSON.stringify(data))
    } catch (err) {}
  }
  socket.signMethod(ws)
  ws.on("message", function (message) {
    try {
      if (!!message) {
        message = JSON.parse(message)
        if (!!message.captcha) {
          this.c_captcha(message.captcha)
        }
        if (!!message.forgotpass) {
          forgotpass(this, message.forgotpass)
        }
        if (this.auth == false && !!message.authentication) {
          authenticate(
            this,
            message.authentication,
            function (err, success) {
              if (success) {
                this.auth = true
                this.redT = redT
                socket.auth(this)
                redT = null
              } else if (!!err) {
                this.red({ unauth: err })
                //this.close();
              } else {
                this.red({ unauth: { message: "Authentication failure" } })
                //this.close();
              }
            }.bind(this)
          )
        } else if (!!this.auth) {
          socket.message(this, message)
        }
      }
    } catch (error) {}
  })
  ws.on("close", function (message) {
    if (this.UID !== null && void 0 !== this.redT.users[this.UID]) {
      if (
        this.redT.users[this.UID].length === 1 &&
        this.redT.users[this.UID][0] === this
      ) {
        delete this.redT.users[this.UID]
      } else {
        var self = this
        this.redT.users[this.UID].forEach(function (obj, index) {
          if (obj === self) {
            self.redT.users[self.UID].splice(index, 1)
          }
        })
      }
    }
    this.auth = false
    void 0 !== this.TTClear && this.TTClear()
    global["userOnline"] = global["userOnline"]--
  })
}
