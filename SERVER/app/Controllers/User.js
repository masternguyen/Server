let User = require("../Models/Users")
let UserInfo = require("../Models/UserInfo")
let Phone = require("../Models/Phone")
let telegram = require("../Models/Telegram")

// Game User
let TaiXiu_User = require("../Models/TaiXiu_user")
let MiniPoker_User = require("../Models/miniPoker/miniPoker_users")
let Bigbabol_User = require("../Models/BigBabol/BigBabol_users")
let VQRed_User = require("../Models/VuongQuocRed/VuongQuocRed_users")
let BauCua_User = require("../Models/BauCua/BauCua_user")
let Mini3Cay_User = require("../Models/Mini3Cay/Mini3Cay_user")
let CaoThap_User = require("../Models/CaoThap/CaoThap_user")
let AngryBirds_user = require("../Models/AngryBirds/AngryBirds_user")
let Candy_user = require("../Models/Candy/Candy_user")
let LongLan_user = require("../Models/LongLan/LongLan_user")
let Zeus_user = require("../Models/Zeus/Zeus_user")
let XocXoc_user = require("../Models/XocXoc/XocXoc_user")
let MegaJP_user = require("../Models/MegaJP/MegaJP_user")
let Message = require("../Models/Message")
let validator = require("validator")
let Helper = require("../Helpers/Helpers")
let onHistory = require("./user/onHistory")
let ket_sat = require("./user/ket_sat")
let next_scene = require("./user/next_scene")
let security = require("./user/security")
let nhanthuong = require("./user/nhanthuong")
let GameState = require("./GameState.js")

let first = function (client) {
  UserInfo.findOne(
    { id: client.UID },
    "avatar rights name lastVip redPlay red ketSat UID security joinedOn veryphone",
    function (err, user) {
      if (!!user) {
        // Tạo token mới
        let txtTH = new Date() + ""
        let token = Helper.generateHash(txtTH)
        User.updateOne(
          { _id: client.UID },
          { $set: { "local.token": token } }
        ).exec()
        user = user._doc
        let vipHT = ((user.redPlay - user.lastVip) / 100000) >> 0 // Điểm vip Hiện Tại
        // Cấp vip hiện tại
        let vipLevel = 1
        let vipPre = 0 // Điểm víp cấp Hiện tại
        let vipNext = 100 // Điểm víp cấp tiếp theo
        if (vipHT >= 120000) {
          vipLevel = 9
          vipPre = 120000
          vipNext = 0
        } else if (vipHT >= 50000) {
          vipLevel = 8
          vipPre = 50000
          vipNext = 120000
        } else if (vipHT >= 15000) {
          vipLevel = 7
          vipPre = 15000
          vipNext = 50000
        } else if (vipHT >= 6000) {
          vipLevel = 6
          vipPre = 6000
          vipNext = 15000
        } else if (vipHT >= 3000) {
          vipLevel = 5
          vipPre = 3000
          vipNext = 6000
        } else if (vipHT >= 1000) {
          vipLevel = 4
          vipPre = 1000
          vipNext = 3000
        } else if (vipHT >= 500) {
          vipLevel = 3
          vipPre = 500
          vipNext = 1000
        } else if (vipHT >= 100) {
          vipLevel = 2
          vipPre = 100
          vipNext = 500
        }
        user.level = vipLevel
        user.vipNext = vipNext - vipPre
        user.vipHT = vipHT - vipPre
        user.token = token

        delete user._id
        delete user.redPlay
        delete user.lastVip

        client.profile = { name: user.name, avatar: user.avatar }

        addToListOnline(client)

        Phone.findOne({ uid: client.UID }, {}, function (err2, dataP) {
          user.phone = dataP ? Helper.cutPhone(dataP.region + dataP.phone) : ""
          Message.countDocuments({ uid: client.UID, read: false }).exec(
            function (errMess, countMess) {
              client.red({
                Authorized: true,
                user: user,
                message: { news: countMess },
              })
              GameState(client)
            }
          )
        })
      } else {
        client.red({ Authorized: false })
      }
    }
  )
}

let updateCoint = function (client) {
  UserInfo.findOne({ id: client.UID }, "red", function (err, user) {
    if (!!user) {
      client.red({ user: { red: user.red } })
    }
  })
}

let signName = function (client, name) {
  if (!!name) {
    name = "" + name + ""
    let az09 = new RegExp("^[a-zA-Z0-9]+$")
    let testName = az09.test(name)

    if (!validator.isLength(name, { min: 3, max: 14 })) {
      client.red({
        notice: {
          title: "ชื่อตัวละคร",
          text: "ความยาวตั้งแต่ 3 ถึง 14 ตัวอักษร!!",
        },
      })
    } else if (!testName) {
      client.red({
        notice: {
          title: "ชื่อตัวละคร",
          text: "ชื่อไม่มีอักขระพิเศษ !!",
        },
      })
    } else {
      UserInfo.findOne(
        { id: client.UID },
        "name red ketSat UID security joinedOn",
        function (err, d) {
          if (!d) {
            name = name.toLowerCase()
            User.findOne({ _id: client.UID }, function (err, base) {
              var regex = new RegExp("^" + base.local.username + "$", "i")
              var testBase = regex.test(name)
              if (testBase) {
                client.red({
                  notice: {
                    title: "ชื่อตัวละคร",
                    text: "ชื่อตัวละครต้องไม่เหมือนกับชื่อผู้ใช้...",
                  },
                })
              } else {
                UserInfo.findOne({ name: name }, "name", function (err, check) {
                  if (!!check) {
                    client.red({
                      notice: {
                        title: "ชื่อตัวละครT",
                        text: "มีชื่อตัวละครอยู่แล้ว...",
                      },
                    })
                  } else {
                    try {
                      UserInfo.create(
                        { id: client.UID, name: name, joinedOn: new Date() },
                        function (errC, user) {
                          if (!!errC) {
                            client.red({
                              notice: {
                                load: 0,
                                title: "ข้อผิดพลาด",
                                text: "มีชื่อตัวละครอยู่แล้ว.",
                              },
                            })
                          } else {
                            // Tạo token mới
                            let txtTH = new Date() + ""
                            let token = Helper.generateHash(txtTH)
                            base.local.token = token
                            base.save()
                            user = user._doc
                            user.level = 1
                            user.vipNext = 100
                            user.vipHT = 0
                            user.phone = ""
                            user.token = token
                            delete user._id
                            delete user.redWin
                            delete user.redLost
                            delete user.redPlay
                            delete user.vip
                            delete user.hu
                            delete user.totall
                            delete user.type
                            delete user.otpFirst
                            delete user.gitCode
                            delete user.gitRed
                            delete user.veryold
                            addToListOnline(client)
                            let data = {
                              Authorized: true,
                              user: user,
                              message: { news: 1 },
                            }
                            client.profile = { name: user.name, avatar: "0" }
                            TaiXiu_User.create({ uid: client.UID })
                            MiniPoker_User.create({ uid: client.UID })
                            Bigbabol_User.create({ uid: client.UID })
                            VQRed_User.create({ uid: client.UID })
                            BauCua_User.create({ uid: client.UID })
                            Mini3Cay_User.create({ uid: client.UID })
                            CaoThap_User.create({ uid: client.UID })
                            AngryBirds_user.create({ uid: client.UID })
                            Candy_user.create({ uid: client.UID })
                            LongLan_user.create({ uid: client.UID })
                            Zeus_user.create({ uid: client.UID })
                            XocXoc_user.create({ uid: client.UID })
                            MegaJP_user.create({ uid: client.UID })
                            Message.create({
                              uid: client.UID,
                              title: "สมาชิกใหม่",
                              text: "ยินดีต้อนรับสู่ JJBETWIN.COM - พอร์ทัลเกมชั้นนำของเอเชีย, ขอให้คุณมีความสุขในการเล่นเกม, ชนะครั้งใหญ่...",
                              time: new Date(),
                            })
                            GameState(client)
                            client.red(data)
                          }
                        }
                      )
                    } catch (error) {
                      client.red({
                        notice: {
                          title: "ชื่อตัวละคร",
                          text: "มีชื่อตัวละครอยู่แล้ว...",
                        },
                      })
                    }
                  }
                })
              }
            })
          } else {
            first(client)
          }
        }
      )
    }
  }
}

let changePassword = function (client, data) {
  if (!!data && !!data.passOld && !!data.passNew && !!data.passNew2) {
    if (!validator.isLength(data.passOld, { min: 6, max: 32 })) {
      client.red({
        notice: {
          title: "ข้อผิดพลาด",
          text: "ความยาวรหัสผ่านตั้งแต่ 6 ถึง 32 ตัวอักษร !!",
        },
      })
    } else if (!validator.isLength(data.passNew, { min: 6, max: 32 })) {
      client.red({
        notice: {
          title: "ข้อผิดพลาด",
          text: "ความยาวรหัสผ่านตั้งแต่ 6 ถึง 32 ตัวอักษร!!",
        },
      })
    } else if (!validator.isLength(data.passNew2, { min: 6, max: 32 })) {
      client.red({
        notice: {
          title: "ข้อผิดพลาด",
          text: "ความยาวรหัสผ่านตั้งแต่ 6 ถึง 32 ตัวอักษร !!",
        },
      })
    } else if (data.passOld == data.passNew) {
      client.red({
        notice: {
          title: "ข้อผิดพลาด",
          text: "รหัสผ่านใหม่ไม่ตรงกับรหัสผ่านเก่า.!!",
        },
      })
    } else if (data.passNew != data.passNew2) {
      client.red({
        notice: {
          title: "ข้อผิดพลาด",
          text: "รหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้ง.!!",
        },
      })
    } else {
      User.findOne({ _id: client.UID }, function (err, user) {
        if (!!user) {
          if (user.local.username == data.passNew) {
            client.red({
              notice: {
                title: "ข้อผิดพลาด",
                text: "รหัสผ่านไม่ตรงกับชื่อผู้ใช้ของคุณ.!!",
              },
            })
          } else {
            if (Helper.validPassword(data.passOld, user.local.password)) {
              User.updateOne(
                { _id: client.UID },
                {
                  $set: { "local.password": Helper.generateHash(data.passNew) },
                }
              ).exec()
              client.red({
                notice: {
                  load: 0,
                  title: "ประสบความสำเร็จ",
                  text: "เปลี่ยนรหัสผ่านสำเร็จ.",
                },
              })
            } else {
              client.red({
                notice: {
                  load: 0,
                  title: "ความล้มเหลว",
                  text: "รหัสผ่านเก่าไม่ถูกต้อง.",
                },
              })
            }
          }
        }
      })
    }
  }
}

let getLevel = function (client) {
  UserInfo.findOne(
    { id: client.UID },
    "lastVip redPlay vip",
    function (err, user) {
      if (user) {
        var vipHT = ((user.redPlay - user.lastVip) / 100000) >> 0 // Điểm vip Hiện Tại
        // Cấp vip hiện tại
        var vipLevel = 1
        var vipPre = 0 // Điểm víp cấp Hiện tại
        var vipNext = 100 // Điểm víp cấp tiếp theo
        if (vipHT >= 120000) {
          vipLevel = 9
          vipPre = 120000
          vipNext = 0
        } else if (vipHT >= 50000) {
          vipLevel = 8
          vipPre = 50000
          vipNext = 120000
        } else if (vipHT >= 15000) {
          vipLevel = 7
          vipPre = 15000
          vipNext = 50000
        } else if (vipHT >= 6000) {
          vipLevel = 6
          vipPre = 6000
          vipNext = 15000
        } else if (vipHT >= 3000) {
          vipLevel = 5
          vipPre = 3000
          vipNext = 6000
        } else if (vipHT >= 1000) {
          vipLevel = 4
          vipPre = 1000
          vipNext = 3000
        } else if (vipHT >= 500) {
          vipLevel = 3
          vipPre = 500
          vipNext = 1000
        } else if (vipHT >= 100) {
          vipLevel = 2
          vipPre = 100
          vipNext = 500
        }

        client.red({
          profile: {
            level: {
              level: vipLevel,
              vipNext: vipNext,
              vipPre: vipPre,
              vipTL: user.vip,
              vipHT: vipHT,
            },
          },
        })
      } else {
        client.close()
      }
    }
  )
}

function addToListOnline(client) {
  if (void 0 !== client.redT) {
    if (void 0 !== client.redT.users[client.UID]) {
      client.redT.users[client.UID].push(client)
    } else {
      client.redT.users[client.UID] = [client]
    }
  }
}
function signOut(client) {
  User.updateOne({ _id: client.UID }, { $set: { "local.token": "" } }).exec()
  client.terminate()
}
function avatar(client, avatar) {
  avatar = avatar >> 0
  UserInfo.updateOne({ id: client.UID }, { $set: { avatar: avatar } }).exec()
  client.profile.avatar = avatar
}
function onData(client, data) {
  if (!!data.doi_pass) {
    changePassword(client, data.doi_pass)
  }
  if (!!data.history) {
    onHistory(client, data.history)
  }
  if (!!data.ket_sat) {
    ket_sat(client, data.ket_sat)
  }
  if (!!data.updateCoint) {
    updateCoint(client)
  }
  if (!!data.getLevel) {
    getLevel(client)
  }
  if (!!data.nhanthuong) {
    nhanthuong(client)
  }
  if (!!data.security) {
    security(client, data.security)
  }
  if (!!data.signOut) {
    signOut(client)
  }
  if (void 0 !== data.avatar) {
    avatar(client, data.avatar)
  }
}

module.exports = {
  first: first,
  signName: signName,
  onData: onData,
  next_scene: next_scene,
  updateCoint: updateCoint,
  getLevel: getLevel,
}
